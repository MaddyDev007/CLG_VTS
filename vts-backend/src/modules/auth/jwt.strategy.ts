import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { UserRole, UserStatus } from '../users/user.entity'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    })
  }

  async validate(payload: { sub: string; role: UserRole; name: string; collegeId?: string | null; status: UserStatus }) {
    return {
      userId: payload.sub,
      role: payload.role,
      name: payload.name,
      collegeId: payload.collegeId ?? null,
      status: payload.status,
    }
  }
}
