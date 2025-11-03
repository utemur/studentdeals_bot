import { IsEmail, IsString } from 'class-validator';

export class StartEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  telegramId!: string;
}

