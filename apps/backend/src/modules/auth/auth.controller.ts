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
  ApiTooManyRequestsResponse,
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
import { FirebaseRecaptchaParamsResponseDto } from './dto/firebase-recaptcha-params-response.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { SendVerificationCodeResponseDto } from './dto/send-verification-code-response.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
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
      'Роль по умолчанию DRIVER; при OPEN_MANAGER_SELF_REGISTER=true можно передать MANAGER или DRIVER. ' +
      'Если AUTH_SKIP_VERIFICATION=true — сразу JWT. Иначе isActive=false; код отправляется через POST /auth/send-verification-code.',
  })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  @ApiConflictResponse({
    description: 'Email или телефон уже заняты',
  })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  @Get('firebase-recaptcha-params')
  @Public()
  @ApiOperation({
    summary: 'Параметры reCAPTCHA для SMS (Firebase Phone Auth)',
    description:
      'Возвращает recaptchaSiteKey для виджета на mobile-клиенте перед POST /auth/send-verification-code с channel=sms.',
  })
  @ApiResponse({ status: 200, type: FirebaseRecaptchaParamsResponseDto })
  async getFirebaseRecaptchaParams(): Promise<FirebaseRecaptchaParamsResponseDto> {
    return this.authService.getFirebaseRecaptchaParams();
  }

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Отправить код подтверждения регистрации',
    description:
      'Канал email (SMTP) или sms (Firebase Phone Auth + recaptchaToken). Пользователь должен существовать и быть неактивным (isActive=false).',
  })
  @ApiResponse({ status: 200, type: SendVerificationCodeResponseDto })
  @ApiTooManyRequestsResponse({ description: 'Повторный запрос раньше чем через 60 сек' })
  async sendVerificationCode(
    @Body() dto: SendVerificationCodeDto,
  ): Promise<SendVerificationCodeResponseDto> {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Подтвердить регистрацию по коду',
    description:
      'Email-код (bcrypt) или SMS-код (Firebase). При успехе isActive=true и JWT.',
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный или просроченный код' })
  async verifyAccount(@Body() dto: VerifyAccountDto): Promise<LoginResponseDto> {
    return this.authService.verifyAccount(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Подтвердить email (alias verify-account)',
    description: 'Обратная совместимость с mobile-клиентом.',
  })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Неверный или просроченный код' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<LoginResponseDto> {
    return this.authService.verifyEmail(dto);
  }
}
