import type { UserRole, UserStatus } from '../user.entity'

export class UserResponseDto {
  id!: string
  name!: string
  email!: string
  role!: UserRole
  collegeId!: string | null
  collegeName!: string | null
  status!: UserStatus
  createdAt!: Date
}
