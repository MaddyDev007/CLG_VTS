import { Body, Controller, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login' })
  @ApiBody({
    schema: {
      example: {
        email: 'admin@example.com',
        password: 'StrongPassword123',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'JWT token + user role',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        role: 'FLEET_MANAGER',
        name: 'Asha Rao',
      },
    },
  })
  @Post('login')
  async login(@Body() payload: LoginDto) {
    return this.authService.login(payload.email, payload.password)
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout confirmation',
    schema: { example: { success: true } },
  })
  @Post('logout')
  async logout() {
    return { success: true }
  }
}
