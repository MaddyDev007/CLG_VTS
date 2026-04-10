import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { User } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { hashPassword } from '../../common/utils/password.util'
import { College } from '../colleges/college.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { isSuperAdmin, mergeCollegeWhere, requireCollegeScope, resolveCollegeScope } from '../../common/tenant/tenant-scope'
import { UpdateUserStatusDto } from './dto/update-user-status.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { collegeHasRelatedData } from '../colleges/college-lifecycle.util'
import { ListUsersDto } from './dto/list-users.dto'

@Injectable()
export class UsersService {
  private readonly roleLevel: Record<User['role'], number> = {
    SUPER_ADMIN: 4,
    COLLEGE_ADMIN: 3,
    FLEET_MANAGER: 2,
    STUDENT: 1,
  }

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(College) private readonly collegesRepo: Repository<College>,
    private readonly dataSource: DataSource,
  ) {}

  private buildDetailedUsersQuery(actor: AuthenticatedUser, filters?: ListUsersDto) {
    const query = this.usersRepo
      .createQueryBuilder('u')
      .leftJoin(College, 'c', 'u."collegeId" = c.id')
      .select([
        'u.id AS id',
        'u.name AS name',
        'u.email AS email',
        'u.role AS role',
        'u."collegeId" AS "collegeId"',
        'c.name AS "collegeName"',
        'u.status AS status',
        'u."createdAt" AS "createdAt"',
      ])
      .orderBy('u."createdAt"', 'DESC')

    const collegeScope = resolveCollegeScope(actor, filters?.collegeId)
    if (collegeScope) {
      query.where('u."collegeId" = :collegeId', { collegeId: collegeScope })
    }

    if (filters?.role) {
      query.andWhere('u.role = :role', { role: filters.role })
    }

    return query
  }

  async findAll(actor: AuthenticatedUser, filters?: ListUsersDto): Promise<UserResponseDto[]> {
    return this.buildDetailedUsersQuery(actor, filters).getRawMany<UserResponseDto>()
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } })
  }

  async findById(id: string, actor?: AuthenticatedUser): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: actor ? mergeCollegeWhere<User>(actor, { id }) : { id },
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async findDetailedById(id: string, actor: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.buildDetailedUsersQuery(actor).andWhere('u.id = :id', { id }).getRawOne<UserResponseDto>()
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  private assertUserManagementAccess(targetUser: User, actor: AuthenticatedUser): void {
    if (targetUser.id === actor.userId) {
      throw new ForbiddenException('You cannot disable or delete your own account.')
    }

    if (this.roleLevel[targetUser.role] >= this.roleLevel[actor.role]) {
      throw new ForbiddenException('You cannot manage users with equal or higher role.')
    }
  }

  private getAllowedCreateRoles(actorRole: AuthenticatedUser['role']): Array<CreateUserDto['role']> {
    switch (actorRole) {
      case 'SUPER_ADMIN':
        return ['FLEET_MANAGER', 'STUDENT']
      case 'COLLEGE_ADMIN':
        return ['FLEET_MANAGER', 'STUDENT']
      case 'FLEET_MANAGER':
        return ['STUDENT']
      case 'STUDENT':
        throw new ForbiddenException('You are not authorized to create this role.')
      default:
        throw new ForbiddenException('You are not authorized to create this role.')
    }
  }

  private getAllowedUpdateRoles(actorRole: AuthenticatedUser['role']): Array<NonNullable<UpdateUserDto['role']>> {
    switch (actorRole) {
      case 'SUPER_ADMIN':
        return ['FLEET_MANAGER', 'STUDENT']
      case 'COLLEGE_ADMIN':
        return ['FLEET_MANAGER', 'STUDENT']
      case 'FLEET_MANAGER':
        return ['STUDENT']
      default:
        return []
    }
  }

  private async assertCollegeExists(collegeId: string): Promise<string> {
    const college = await this.collegesRepo.findOne({ where: { id: collegeId } })
    if (!college) {
      throw new NotFoundException('College not found')
    }

    return college.id
  }

  private async resolveCollegeIdForCreate(payload: CreateUserDto, actor: AuthenticatedUser): Promise<string | null> {
    const allowedRoles = this.getAllowedCreateRoles(actor.role)
    if (!allowedRoles.includes(payload.role)) {
      throw new ForbiddenException('You are not authorized to create this role.')
    }

    if (!isSuperAdmin(actor)) {
      return requireCollegeScope(actor)
    }

    if (payload.collegeId) {
      return this.assertCollegeExists(payload.collegeId)
    }

    throw new ForbiddenException('Super admin must select a college before creating users.')
  }

  async create(payload: CreateUserDto, actor: AuthenticatedUser): Promise<User> {
    const passwordHash = await hashPassword(payload.password)
    const collegeId = await this.resolveCollegeIdForCreate(payload, actor)
    const user = this.usersRepo.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      role: payload.role,
      collegeId,
      passwordHash,
      status: 'active',
    })
    return this.usersRepo.save(user)
  }

  async update(id: string, payload: UpdateUserDto, actor: AuthenticatedUser): Promise<User> {
    const user = await this.findById(id, actor)
    this.assertUserManagementAccess(user, actor)

    if (payload.role) {
      const allowedRoles = this.getAllowedUpdateRoles(actor.role)
      if (!allowedRoles.includes(payload.role)) {
        throw new ForbiddenException('You are not authorized to assign this role.')
      }
    }

    Object.assign(user, {
      ...payload,
      collegeId: payload.collegeId ?? user.collegeId,
    })

    if (!isSuperAdmin(actor)) {
      user.collegeId = requireCollegeScope(actor)
    } else if (payload.collegeId) {
      user.collegeId = await this.assertCollegeExists(payload.collegeId)
    } else if (!user.collegeId) {
      throw new ForbiddenException('Super admin must manage users within a selected college scope.')
    }

    return this.usersRepo.save(user)
  }

  async updateStatus(id: string, payload: UpdateUserStatusDto, actor: AuthenticatedUser): Promise<User> {
    const user = await this.findById(id, actor)
    this.assertUserManagementAccess(user, actor)

    user.status = payload.status
    return this.usersRepo.save(user)
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: mergeCollegeWhere<User>(actor, { id }),
      })

      if (!user) {
        throw new NotFoundException('User not found')
      }

      this.assertUserManagementAccess(user, actor)

      const collegeId = user.collegeId ?? null

      await manager.remove(User, user)

      if (!collegeId) {
        return
      }

      const remainingUsers = await manager.count(User, {
        where: { collegeId },
      })

      if (remainingUsers > 0) {
        return
      }

      const hasRelatedData = await collegeHasRelatedData(manager, collegeId)
      if (hasRelatedData) {
        return
      }

      await manager.delete(College, { id: collegeId })
    })
  }
}
