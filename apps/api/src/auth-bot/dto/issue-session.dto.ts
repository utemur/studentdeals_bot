import { IsString } from 'class-validator';

export class IssueSessionDto {
  @IsString()
  telegramId!: string;
}

