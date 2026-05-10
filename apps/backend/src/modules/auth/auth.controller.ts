import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
import { PatchMeDto } from './dto/patch-me.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновить свой профиль',
    description: 'Сейчас поддерживается только смена отображаемого имени.',
  })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async patchMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PatchMeDto,
  ): Promise<ReadUserEntity> {
    return this.authService.patchProfile(user.id, dto);
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
      'Роль по умолчанию DRIVER; при OPEN_MANAGER_SELF_REGISTER=true можно передать MANAGER или DRIVER. SYSTEM_ADMIN недоступен. ' +
      'Если AUTH_SKIP_VERIFICATION=true — как раньше: сразу активная учётная запись и JWT. ' +
      'Иначе создаётся неактивная запись, на email уходит код подтверждения (нужен SMTP в NOTIFICATION_EMAIL_*); JWT после подтверждения кода (отдельный эндпоинт позже).',
  })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  @ApiConflictResponse({
    description: 'Email или телефон уже заняты',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Подтвердить email после регистрации',
    description:
      'Передаётся email и 6-значный код из письма. При успехе учётная запись активируется (isActive), выдаётся JWT. ' +
      'Код держится только в памяти сервера до перезапуска.',
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный или просроченный код' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<LoginResponseDto> {
    return this.authService.verifyEmail(dto);
  }
}
