import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ReadUserEntity } from '../user/entities/dtos/user.read';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './types/authenticated-user';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Текущий пользователь',
    description:
      'Проверяет JWT и наличие учётной записи в БД (удалённые и неактивные получают 401).',
  })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  @ApiUnauthorizedResponse({
    description: 'Недействительная или просроченная сессия',
  })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<ReadUserEntity> {
    return this.authService.getCurrentUser(user.id);
  }

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
