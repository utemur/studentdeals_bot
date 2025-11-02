import { z } from 'zod';

const configSchema = z.object({
  telegramBotToken: z.string().min(1),
  webhookSecret: z.string().min(1),
  webhookBase: z.string().url().optional(),
  frontendUrl: z.string().url(),
  apiUrl: z.string().url(),
  resendApiKey: z.string().optional(),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  studentDomains: z.string().transform(s => s.split(',').map(d => d.trim())),
  codeTtl: z.string().transform(s => parseInt(s, 10)),
  codeResendCooldown: z.string().transform(s => parseInt(s, 10)),
  codeMaxAttempts: z.string().transform(s => parseInt(s, 10)),
  sessionUrlTtl: z.string().transform(s => parseInt(s, 10)),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const config = configSchema.parse({
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.BOT_WEBHOOK_SECRET,
    webhookBase: process.env.BOT_WEBHOOK_BASE,
    frontendUrl: process.env.FRONTEND_URL,
    apiUrl: process.env.API_URL,
    resendApiKey: process.env.RESEND_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    studentDomains: process.env.STUDENT_EMAIL_DOMAINS || '.edu,.ac.uk,.edu.uz',
    codeTtl: process.env.CODE_TTL_SECONDS || '900',
    codeResendCooldown: process.env.CODE_RESEND_COOLDOWN || '60',
    codeMaxAttempts: process.env.CODE_MAX_ATTEMPTS || '5',
    sessionUrlTtl: process.env.SESSION_URL_TTL_SECONDS || '120',
  });

  return config;
}

