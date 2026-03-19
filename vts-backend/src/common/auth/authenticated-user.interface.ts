import type { UserRole, UserStatus } from '../../modules/users/user.entity'

export type AuthenticatedUser = {
  userId: string
  role: UserRole
  name: string
  collegeId: string | null
  status: UserStatus
}
