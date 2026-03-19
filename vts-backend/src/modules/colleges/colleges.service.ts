import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { College } from './college.entity'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { isSuperAdmin, requireCollegeScope } from '../../common/tenant/tenant-scope'
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto'
import { collegeHasRelatedData } from './college-lifecycle.util'

@Injectable()
export class CollegesService {
  constructor(
    @InjectRepository(College) private readonly collegesRepo: Repository<College>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(actor: AuthenticatedUser, includeAll = false): Promise<College[]> {
    if (isSuperAdmin(actor) && includeAll) {
      return this.collegesRepo.find({ order: { name: 'ASC' } })
    }

    if (isSuperAdmin(actor)) {
      return this.collegesRepo.find({
        where: { status: 'active' },
        order: { name: 'ASC' },
      })
    }

    return this.collegesRepo.find({
      where: { id: requireCollegeScope(actor), status: 'active' },
      order: { name: 'ASC' },
    })
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

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    if (!isSuperAdmin(actor)) {
      throw new ForbiddenException('Only super admins can delete colleges')
    }

    await this.dataSource.transaction(async (manager) => {
      const college = await manager.findOne(College, { where: { id } })
      if (!college) {
        throw new NotFoundException('College not found')
      }

      const userCount = await manager
        .createQueryBuilder()
        .from('users', 'u')
        .where('u."collegeId" = :collegeId', { collegeId: id })
        .getCount()

      if (userCount > 0 || (await collegeHasRelatedData(manager, id))) {
        throw new ConflictException('Cannot delete college with existing data.')
      }

      await manager.delete(College, { id })
    })
  }
}
