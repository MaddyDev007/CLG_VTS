import { ForbiddenException, NotFoundException } from '@nestjs/common'
import type { SelectQueryBuilder, FindOptionsWhere, ObjectLiteral } from 'typeorm'
import type { AuthenticatedUser } from '../auth/authenticated-user.interface'

export function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'SUPER_ADMIN'
}

export function requireCollegeScope(user: AuthenticatedUser): string {
  if (isSuperAdmin(user)) {
    throw new ForbiddenException('Super admin does not require a college scope')
  }

  if (!user.collegeId) {
    throw new ForbiddenException('College-scoped user is missing a college assignment')
  }

  return user.collegeId
}

export function getCollegeWhere<T extends ObjectLiteral>(
  user: AuthenticatedUser,
): FindOptionsWhere<T> | undefined {
  if (isSuperAdmin(user)) {
    return undefined
  }

  return { collegeId: requireCollegeScope(user) } as unknown as FindOptionsWhere<T>
}

export function mergeCollegeWhere<T extends ObjectLiteral>(
  user: AuthenticatedUser,
  where: FindOptionsWhere<T>,
): FindOptionsWhere<T> {
  const collegeWhere = getCollegeWhere<T>(user)
  if (!collegeWhere) {
    return where
  }

  return {
    ...where,
    ...collegeWhere,
  }
}

export function applyTenantScope<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  alias: string,
  user: AuthenticatedUser,
): SelectQueryBuilder<T> {
  return query.andWhere(`(:collegeScope::uuid IS NULL OR ${alias}.collegeId = :collegeScope::uuid)`, {
    collegeScope: isSuperAdmin(user) ? null : requireCollegeScope(user),
  })
}

export function applyCollegeScope<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  alias: string,
  user: AuthenticatedUser,
): SelectQueryBuilder<T> {
  return applyTenantScope(query, alias, user)
}

export function assertTenantAccess(resourceCollegeId: string | null | undefined, user: AuthenticatedUser) {
  if (isSuperAdmin(user)) {
    return
  }

  const collegeId = requireCollegeScope(user)
  if (!resourceCollegeId || resourceCollegeId !== collegeId) {
    throw new ForbiddenException('You do not have access to this resource.')
  }
}

export function assertSameCollege(resourceCollegeId: string | null | undefined, user: AuthenticatedUser) {
  try {
    assertTenantAccess(resourceCollegeId, user)
  } catch (error) {
    if (error instanceof ForbiddenException) {
      throw new NotFoundException('Resource not found')
    }
    throw error
  }
}
