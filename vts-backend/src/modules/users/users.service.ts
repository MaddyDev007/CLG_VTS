import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { User } from './user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { hashPassword } from '../../common/utils/password.util'
import { College } from '../colleges/college.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { getCollegeWhere, isSuperAdmin, mergeCollegeWhere, requireCollegeScope } from '../../common/tenant/tenant-scope'
import { UpdateUserStatusDto } from './dto/update-user-status.dto'
import { UserResponseDto } from './dto/user-response.dto'
import { collegeHasRelatedData } from '../colleges/college-lifecycle.util'

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

  private buildDetailedUsersQuery(actor: AuthenticatedUser) {
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

    const where = getCollegeWhere<User>(actor)
    if (where?.collegeId) {
      query.where('u."collegeId" = :collegeId', { collegeId: where.collegeId })
    }

    return query
  }

  async findAll(actor: AuthenticatedUser): Promise<UserResponseDto[]> {
    return this.buildDetailedUsersQuery(actor).getRawMany<UserResponseDto>()
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

  private async findOrCreateCollegeByName(name: string): Promise<College> {
    const normalized = name.trim()
    let college = await this.collegesRepo.findOne({ where: { name: normalized } })
    if (college) {
      return college
    }

    college = this.collegesRepo.create({
      name: normalized,
      status: 'active',
    })

    return this.collegesRepo.save(college)
  }

  private getAllowedCreateRoles(actorRole: AuthenticatedUser['role']): Array<CreateUserDto['role']> {
    switch (actorRole) {
      case 'SUPER_ADMIN':
        return ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER', 'STUDENT']
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

  private async resolveCollegeIdForCreate(payload: CreateUserDto, actor: AuthenticatedUser): Promise<string | null> {
    const allowedRoles = this.getAllowedCreateRoles(actor.role)
    if (!allowedRoles.includes(payload.role)) {
      throw new ForbiddenException('You are not authorized to create this role.')
    }

    if (!isSuperAdmin(actor)) {
      return requireCollegeScope(actor)
    }

    if (payload.role === 'SUPER_ADMIN') {
      return null
    }

    if (payload.collegeId) {
      const college = await this.collegesRepo.findOne({ where: { id: payload.collegeId } })
      if (!college) {
        throw new NotFoundException('College not found')
      }
      return college.id
    }

    if (payload.collegeName?.trim()) {
      const college = await this.findOrCreateCollegeByName(payload.collegeName)
      return college.id
    }

    throw new ForbiddenException('collegeId or collegeName is required for non-SUPER_ADMIN users')
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
    const nextCollegeId =
      payload.collegeName?.trim()
        ? (await this.findOrCreateCollegeByName(payload.collegeName)).id
        : payload.collegeId

    Object.assign(user, {
      ...payload,
      collegeId: nextCollegeId ?? user.collegeId,
    })

    if (!isSuperAdmin(actor)) {
      user.collegeId = requireCollegeScope(actor)
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
