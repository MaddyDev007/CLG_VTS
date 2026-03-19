import { Injectable, NestMiddleware } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'

type JwtPayload = {
  sub: string
  role: string
  name: string
  collegeId?: string | null
  status?: string
}

@Injectable()
export class CollegeScopeMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _: Response, next: NextFunction) {
    req.collegeScope = null

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) {
      next()
      return
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET')
      const payload = verify(token, secret) as JwtPayload
      req.collegeScope = payload.role === 'SUPER_ADMIN' ? null : (payload.collegeId ?? null)
    } catch {
      req.collegeScope = null
    }

    next()
  }
}
