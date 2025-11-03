import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartEmailDto } from './dto/start-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { IssueSessionDto } from './dto/issue-session.dto';
import { MailService } from './mail.service';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';

@Injectable()
export class AuthBotService {
  private readonly studentDomains: string[];
  private readonly codeTtl: number;
  private readonly maxAttempts: number;
  private readonly sessionTtl: number;
  private readonly codePepper: string;
  private readonly frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {
    const domainsEnv = process.env.STUDENT_EMAIL_DOMAINS || '.edu,.ac.uk,.edu.uz';
    this.studentDomains = domainsEnv.split(',').map(d => d.trim());
    this.codeTtl = parseInt(process.env.CODE_TTL_SECONDS || '900', 10);
    this.maxAttempts = parseInt(process.env.CODE_MAX_ATTEMPTS || '5', 10);
    this.sessionTtl = parseInt(process.env.SESSION_URL_TTL_SECONDS || '120', 10);
    this.codePepper = process.env.CODE_PEPPER || 'default-pepper-change-in-production';
    this.frontendUrl = process.env.FRONTEND_URL || 'https://studentdeals-uz-web.vercel.app';
  }

  async startEmail(dto: StartEmailDto) {
    const { email, telegramId } = dto;
    
    // Проверяем домен email
    const isValidDomain = this.studentDomains.some(domain => 
      email.endsWith(domain)
    );

    if (!isValidDomain) {
      throw new BadRequestException(
        `Email must be from a student domain: ${this.studentDomains.join(', ')}`
      );
    }

    // Генерируем 6-значный код
    const code = this.generateCode();
    const codeHash = this.hashCode(code);

    // Создаём запись в БД
    const verification = await this.prisma.verificationCode.create({
      data: {
        email,
        codeHash,
        telegramId,
        expiresAt: new Date(Date.now() + this.codeTtl * 1000),
      },
    });

    // Отправляем письмо
    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Не выбрасываем ошибку, чтобы пользователь мог повторить
      // возвращаем success, но письмо не было отправлено
    }

    return {
      verificationId: verification.id,
      expiresAt: verification.expiresAt,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { verificationId, code, telegramId } = dto;

    // Находим запись
    const verification = await this.prisma.verificationCode.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification ID');
    }

    if (verification.telegramId !== telegramId) {
      throw new BadRequestException('Telegram ID mismatch');
    }

    if (verification.consumedAt) {
      throw new BadRequestException('Code already used');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Code expired');
    }

    if (verification.attempts >= this.maxAttempts) {
      throw new BadRequestException('Too many attempts');
    }

    // Проверяем код
    const codeHash = this.hashCode(code);
    if (codeHash !== verification.codeHash) {
      // Увеличиваем счётчик попыток
      await this.prisma.verificationCode.update({
        where: { id: verificationId },
        data: { attempts: verification.attempts + 1 },
      });
      throw new UnauthorizedException('Invalid code');
    }

    // Помечаем код как использованный
    await this.prisma.verificationCode.update({
      where: { id: verificationId },
      data: { consumedAt: new Date() },
    });

    // Создаём или обновляем пользователя
    const user = await this.prisma.user.upsert({
      where: { email: verification.email },
      update: {
        telegramId,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: verification.email,
        telegramId,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return {
      ok: true,
      userId: user.id,
    };
  }

  async issueSession(dto: IssueSessionDto) {
    const { telegramId } = dto;

    // Проверяем, что пользователь существует и верифицирован
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user || !user.emailVerified) {
      throw new UnauthorizedException('User not verified');
    }

    // Генерируем JWT с коротким TTL
    const token = await this.jwtService.signAsync(
      { userId: user.id, telegramId },
      { expiresIn: `${this.sessionTtl}s` }
    );

    // Создаём магическую ссылку
    const sessionUrl = `${this.frontendUrl}/auth/magic?token=${token}`;

    return {
      sessionUrl,
    };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashCode(code: string): string {
    return createHash('sha256')
      .update(code + this.codePepper)
      .digest('hex');
  }
}

