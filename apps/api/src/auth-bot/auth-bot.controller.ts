import { Controller, Post, Body } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthBotService } from './auth-bot.service';
import { StartEmailDto } from './dto/start-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IssueSessionDto } from './dto/issue-session.dto';
import { SetPasswordDto } from './dto/set-password.dto';

@Controller('auth/bot')
export class AuthBotController {
  constructor(private readonly authBotService: AuthBotService) {}

  @SkipThrottle()
  @Post('start-email')
  async startEmail(@Body() dto: StartEmailDto) {
    return this.authBotService.startEmail(dto);
  }

  @SkipThrottle()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authBotService.verifyEmail(dto);
  }

  @Post('issue-session')
  async issueSession(@Body() dto: IssueSessionDto) {
    return this.authBotService.issueSession(dto);
  }

  @SkipThrottle()
  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return this.authBotService.setPassword(dto);
  }
}

