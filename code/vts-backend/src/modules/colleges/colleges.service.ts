import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { College } from './college.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { isSuperAdmin, requireCollegeScope } from '../../common/tenant/tenant-scope'
import { CreateCollegeDto } from './dto/create-college.dto'
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto'
import { collegeHasRelatedData } from './college-lifecycle.util'
import { User } from '../users/user.entity'
import { UpdateCollegeDto } from './dto/update-college.dto'
import { hashPassword } from '../../common/utils/password.util'
import type { CollegeStatus } from './college.entity'

type CollegeAdminSummary = {
  id: string
  name: string
  email: string
  status: User['status']
}

type CollegeSummary = {
  id: string
  name: string
  status: CollegeStatus
  createdAt: Date
  admin: CollegeAdminSummary | null
}

type CollegeDetails = CollegeSummary & {
  admin: CollegeAdminSummary | null
}

type CollegeMutationResult = {
  college: CollegeDetails
  adminTemporaryPassword?: string
}

@Injectable()
export class CollegesService {
  constructor(
    @InjectRepository(College) private readonly collegesRepo: Repository<College>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private async buildCollegeAdminMap(collegeIds: string[]): Promise<Map<string, CollegeAdminSummary[]>> {
    if (collegeIds.length === 0) {
      return new Map()
    }

    const admins = await this.usersRepo.find({
      where: {
        role: 'COLLEGE_ADMIN',
      },
      order: {
        name: 'ASC',
        createdAt: 'ASC',
      },
    })

    const adminMap = new Map<string, CollegeAdminSummary[]>()

    admins.forEach((admin) => {
      if (!admin.collegeId || !collegeIds.includes(admin.collegeId)) {
        return
      }

      const current = adminMap.get(admin.collegeId) ?? []
      current.push({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
      })
      adminMap.set(admin.collegeId, current)
    })

    return adminMap
  }

  private mapCollegeSummary(college: College, admins: CollegeAdminSummary[]): CollegeSummary {
    return {
      id: college.id,
      name: college.name,
      status: college.status,
      createdAt: college.createdAt,
      admin: admins[0] ?? null,
    }
  }

  private generateTemporaryAdminPassword(): string {
    return `VTS-${Math.random().toString(36).slice(2, 8)}${Date.now().toString().slice(-4)}`
  }

  private async assertEmailAvailable(email: string, ignoreUserId?: string): Promise<void> {
    const existingUser = await this.usersRepo.findOne({ where: { email: email.toLowerCase() } })
    if (existingUser && existingUser.id !== ignoreUserId) {
      throw new ConflictException('Admin email already exists')
    }
  }

  async create(payload: CreateCollegeDto, actor: AuthenticatedUser): Promise<CollegeMutationResult> {
    if (!isSuperAdmin(actor)) {
      throw new ForbiddenException('Only super admins can create colleges')
    }

    const normalizedName = payload.name.trim()
    const existingCollege = await this.collegesRepo.findOne({ where: { name: normalizedName } })
    if (existingCollege) {
      throw new ConflictException('College name already exists')
    }

    const normalizedAdminName = payload.adminName.trim()
    const normalizedAdminEmail = payload.adminEmail.trim().toLowerCase()
    await this.assertEmailAvailable(normalizedAdminEmail)

    const adminTemporaryPassword = this.generateTemporaryAdminPassword()
    let savedCollegeId = ''

    await this.dataSource.transaction(async (manager) => {
      const collegeRepo = manager.getRepository(College)
      const userRepo = manager.getRepository(User)

      const college = collegeRepo.create({
        name: normalizedName,
        status: payload.status ?? 'active',
      })

      const savedCollege = await collegeRepo.save(college)
      savedCollegeId = savedCollege.id

      const adminUser = userRepo.create({
        name: normalizedAdminName,
        email: normalizedAdminEmail,
        role: 'COLLEGE_ADMIN',
        collegeId: savedCollege.id,
        passwordHash: await hashPassword(adminTemporaryPassword),
        status: 'active',
      })

      await userRepo.save(adminUser)
    })

    return {
      college: await this.findDetailedById(savedCollegeId, actor),
      adminTemporaryPassword,
    }
  }

  async findAll(actor: AuthenticatedUser, includeAll = false): Promise<CollegeSummary[]> {
    let colleges: College[]

    if (isSuperAdmin(actor) && includeAll) {
      colleges = await this.collegesRepo.find({ order: { name: 'ASC' } })
    } else if (isSuperAdmin(actor)) {
      colleges = await this.collegesRepo.find({
        where: { status: 'active' },
        order: { name: 'ASC' },
      })
    } else {
      colleges = await this.collegesRepo.find({
        where: { id: requireCollegeScope(actor) },
        order: { name: 'ASC' },
      })
    }

    const adminMap = await this.buildCollegeAdminMap(colleges.map((college) => college.id))
    return colleges.map((college) => this.mapCollegeSummary(college, adminMap.get(college.id) ?? []))
  }

  async findDetailedById(id: string, actor: AuthenticatedUser): Promise<CollegeDetails> {
    if (!isSuperAdmin(actor) && requireCollegeScope(actor) !== id) {
      throw new NotFoundException('College not found')
    }

    const college = await this.collegesRepo.findOne({ where: { id } })
    if (!college) {
      throw new NotFoundException('College not found')
    }

    const adminMap = await this.buildCollegeAdminMap([college.id])
    const admins = adminMap.get(college.id) ?? []

    return {
      ...this.mapCollegeSummary(college, admins),
      admin: admins[0] ?? null,
    }
  }

  async update(id: string, payload: UpdateCollegeDto, actor: AuthenticatedUser): Promise<CollegeMutationResult> {
    if (!isSuperAdmin(actor)) {
      throw new ForbiddenException('Only super admins can manage colleges')
    }

    const college = await this.collegesRepo.findOne({ where: { id } })
    if (!college) {
      throw new NotFoundException('College not found')
    }

    const normalizedName = payload.name?.trim()
    const normalizedAdminName = payload.adminName?.trim()
    const normalizedAdminEmail = payload.adminEmail?.trim().toLowerCase()

    if (normalizedName) {
      const existingCollege = await this.collegesRepo.findOne({ where: { name: normalizedName } })
      if (existingCollege && existingCollege.id !== college.id) {
        throw new ConflictException('College name already exists')
      }

      college.name = normalizedName
    }

    if (payload.status) {
      college.status = payload.status
    }

    let adminTemporaryPassword: string | undefined
    await this.dataSource.transaction(async (manager) => {
      const collegeRepo = manager.getRepository(College)
      const userRepo = manager.getRepository(User)

      await collegeRepo.save(college)

      const admins = await userRepo.find({
        where: {
          collegeId: college.id,
          role: 'COLLEGE_ADMIN',
        },
        order: {
          createdAt: 'ASC',
        },
      })

      const currentAdmin = admins[0] ?? null
      const extraAdmins = admins.slice(1)

      for (const extraAdmin of extraAdmins) {
        extraAdmin.role = 'FLEET_MANAGER'
        await userRepo.save(extraAdmin)
      }

      if (currentAdmin) {
        if (normalizedAdminEmail) {
          const existingUser = await userRepo.findOne({ where: { email: normalizedAdminEmail } })
          if (existingUser && existingUser.id !== currentAdmin.id) {
            throw new ConflictException('Admin email already exists')
          }
        }

        if (normalizedAdminName) {
          currentAdmin.name = normalizedAdminName
        }

        if (normalizedAdminEmail) {
          currentAdmin.email = normalizedAdminEmail
        }

        await userRepo.save(currentAdmin)
        return
      }

      if (!normalizedAdminName || !normalizedAdminEmail) {
        throw new ConflictException('College admin details are required because this college has no admin.')
      }

      const existingUser = await userRepo.findOne({ where: { email: normalizedAdminEmail } })
      if (existingUser) {
        throw new ConflictException('Admin email already exists')
      }

      adminTemporaryPassword = this.generateTemporaryAdminPassword()
      const createdAdmin = userRepo.create({
        name: normalizedAdminName,
        email: normalizedAdminEmail,
        role: 'COLLEGE_ADMIN',
        collegeId: college.id,
        passwordHash: await hashPassword(adminTemporaryPassword),
        status: 'active',
      })

      await userRepo.save(createdAdmin)
    })

    const collegeDetails = await this.findDetailedById(id, actor)
    if (!collegeDetails.admin) {
      throw new ConflictException('Each college must have exactly one admin.')
    }

    return {
      college: collegeDetails,
      adminTemporaryPassword,
    }
  }

  async updateStatus(id: string, payload: UpdateCollegeStatusDto, actor: AuthenticatedUser): Promise<College> {
    if (!isSuperAdmin(actor)) {
      throw new ForbiddenException('Only super admins can manage college status')
    }

    const college = await this.collegesRepo.findOne({ where: { id } })
    if (!college) {
      throw new NotFoundException('College not found')
    }

    college.status = payload.status
    return this.collegesRepo.save(college)
  }

  async requestDelete(id: string, actor: AuthenticatedUser): Promise<CollegeDetails> {
    if (!isSuperAdmin(actor)) {
      throw new ForbiddenException('Only super admins can request college deletion')
    }

    const college = await this.collegesRepo.findOne({ where: { id } })
    if (!college) {
      throw new NotFoundException('College not found')
    }

    if (college.status === 'delete_pending') {
      throw new ConflictException('Delete request is already pending for this college')
    }

    if (college.status !== 'active') {
      throw new ConflictException('Only active colleges can enter the delete approval workflow')
    }

    college.status = 'delete_pending'
    await this.collegesRepo.save(college)
    return this.findDetailedById(id, actor)
  }

  async cancelDelete(id: string, actor: AuthenticatedUser): Promise<CollegeDetails> {
    if (actor.role !== 'COLLEGE_ADMIN') {
      throw new ForbiddenException('Only the college admin can cancel a delete request')
    }

    if (requireCollegeScope(actor) !== id) {
      throw new NotFoundException('College not found')
    }

    const college = await this.collegesRepo.findOne({ where: { id } })
    if (!college) {
      throw new NotFoundException('College not found')
    }

    if (college.status !== 'delete_pending') {
      throw new ConflictException('This college does not have a pending delete request')
    }

    college.status = 'active'
    await this.collegesRepo.save(college)
    return this.findDetailedById(id, actor)
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    if (actor.role !== 'COLLEGE_ADMIN') {
      throw new ForbiddenException('Only the college admin can approve college deletion')
    }

    if (requireCollegeScope(actor) !== id) {
      throw new NotFoundException('College not found')
    }

    await this.dataSource.transaction(async (manager) => {
      const college = await manager.findOne(College, { where: { id } })
      if (!college) {
        throw new NotFoundException('College not found')
      }

      if (college.status !== 'delete_pending') {
        throw new ConflictException('This college does not have a pending delete request')
      }

      const nonAdminUserCount = await manager
        .createQueryBuilder()
        .from('users', 'u')
        .where('u."collegeId" = :collegeId', { collegeId: id })
        .andWhere('u.role <> :adminRole', { adminRole: 'COLLEGE_ADMIN' })
        .getCount()

      if (nonAdminUserCount > 0 || (await collegeHasRelatedData(manager, id))) {
        throw new ConflictException('Cannot delete college with existing users or operational data.')
      }

      await manager
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('"collegeId" = :collegeId', { collegeId: id })
        .andWhere('role = :adminRole', { adminRole: 'COLLEGE_ADMIN' })
        .execute()

      await manager.delete(College, { id })
    })
  }
}
