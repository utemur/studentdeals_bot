import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  verificationId!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsString()
  telegramId!: string;
}

