import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { comparePassword } from '../../common/utils/password.util'

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase())

    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    if (user.status === 'disabled') {
      throw new UnauthorizedException('User account is disabled')
    }

    const passwordValid = await comparePassword(password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const payload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      collegeId: user.collegeId ?? null,
      status: user.status,
    }
    const token = await this.jwtService.signAsync(payload)

    return {
      id: user.id,
      token,
      role: user.role,
      name: user.name,
      email: user.email,
      collegeId: user.collegeId ?? null,
    }
  }
}
