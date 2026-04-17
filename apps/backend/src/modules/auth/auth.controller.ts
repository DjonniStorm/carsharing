import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResendCodeDto,
  VerifySmsDto,
} from './auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registration accepted' })
  register(@Body() dto: RegisterDto) {
    return { endpoint: 'register', dto };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login accepted' })
  login(@Body() dto: LoginDto) {
    return { endpoint: 'login', dto };
  }

  @Post('verify-sms')
  @ApiOperation({ summary: 'Verify SMS code' })
  @ApiBody({ type: VerifySmsDto })
  @ApiResponse({ status: 200, description: 'SMS code verification accepted' })
  verifySms(@Body() dto: VerifySmsDto) {
    return { endpoint: 'verify-sms', dto };
  }

  @Post('resend-code')
  @ApiOperation({ summary: 'Resend SMS verification code' })
  @ApiBody({ type: ResendCodeDto })
  @ApiResponse({ status: 200, description: 'SMS code resend accepted' })
  resendCode(@Body() dto: ResendCodeDto) {
    return { endpoint: 'resend-code', dto };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Token refresh accepted' })
  refresh(@Body() dto: RefreshDto) {
    return { endpoint: 'refresh', dto };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Invalidate current session token' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logout accepted' })
  logout(@Body() dto: LogoutDto) {
    return { endpoint: 'logout', dto };
  }
}
