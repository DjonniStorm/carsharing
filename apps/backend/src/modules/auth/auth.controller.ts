import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Вход по email/телефону и паролю' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({
    summary: 'Публичная регистрация',
    description:
      'По умолчанию создаёт пользователя с ролью DRIVER, учётная запись сразу активна. JWT как после логина. ' +
      'Если в окружении OPEN_MANAGER_SELF_REGISTER=true, в теле можно передать role=MANAGER (0) или DRIVER (1). ' +
      'SYSTEM_ADMIN через этот эндпоинт недоступен.',
  })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  @ApiConflictResponse({
    description: 'Email или телефон уже заняты',
  })
  async register(@Body() dto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(dto);
  }
}
