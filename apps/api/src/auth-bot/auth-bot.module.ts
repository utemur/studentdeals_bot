import { Module } from '@nestjs/common';
import { AuthBotController } from './auth-bot.controller';
import { AuthBotService } from './auth-bot.service';
import { MailService } from './mail.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: {
        issuer: process.env.JWT_ISSUER || 'studentdeals',
        audience: process.env.JWT_AUDIENCE || 'web',
      },
    }),
  ],
  controllers: [AuthBotController],
  providers: [AuthBotService, MailService],
})
export class AuthBotModule {}

