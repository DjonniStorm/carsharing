import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResendCodeDto,
  VerifyEmailDto,
  VerifySmsDto,
} from './auth.dto';
import { AuthService } from './services/auth.service';

@ApiTags('Аутентификация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Пользователь зарегистрирован' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход по email или телефону' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Вход выполнен успешно' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-sms')
  @ApiOperation({ summary: 'Подтвердить код из SMS' })
  @ApiBody({ type: VerifySmsDto })
  @ApiResponse({ status: 200, description: 'Код SMS обработан' })
  verifySms(@Body() dto: VerifySmsDto) {
    return this.authService.verifySms(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Подтвердить код из email' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Код email обработан' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-code')
  @ApiOperation({ summary: 'Повторно отправить код подтверждения' })
  @ApiBody({ type: ResendCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Код поставлен в очередь на отправку',
  })
  resendCode(@Body() dto: ResendCodeDto) {
    return this.authService.resendVerificationCode(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Обновить access и refresh токены' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Токены обновлены' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Завершить текущую сессию' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Сессия завершена' })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }
}
