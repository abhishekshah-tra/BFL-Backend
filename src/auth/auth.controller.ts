import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service.js';

import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

import { AuthGuard } from './auth.guard.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // ==========================================
  // LOGIN
  // ==========================================

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.login(
      dto,
      ipAddress,
      userAgent,
    );
  }

  // ==========================================
  // REFRESH
  // ==========================================

  @Post('refresh')
  refresh(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(
      dto,
    );
  }

  // ==========================================
  // ME
  // ==========================================

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  me(@Req() request: any) {
    return this.authService.getMe(
      request.user.userId,
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@Req() request: any) {
    return this.authService.logout(
      request.user.sessionId,
    );
  }

  // ==========================================
  // LOGOUT ALL
  // ==========================================

  @Post('logout-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logoutAll(@Req() request: any) {
    return this.authService.logoutAll(
      request.user.userId,
    );
  }
}