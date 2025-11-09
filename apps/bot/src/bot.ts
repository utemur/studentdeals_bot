import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import { Resend } from 'resend';
import { loadConfig } from './config';
import { rateLimit } from './middlewares/rateLimit';

type PendingVerification = {
  email: string;
  code: string;
  expires: number;
};

const config = loadConfig();
const resendClient = config.resendApiKey ? new Resend(config.resendApiKey) : null;
const pendingVerifications = new Map<number, PendingVerification>();

export const bot = new Telegraf(config.telegramBotToken);

bot.use(rateLimit(10, 60000)); // simple anti-spam

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_REGEX = /^\d{6}$/;
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

bot.start(async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    pendingVerifications.delete(userId);
  }

  await ctx.reply('👋 Hi! Please enter your student email.');
});

bot.command('help', async (ctx) => {
  await ctx.reply('ℹ️ Send your student email to receive a verification code.');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return;
  }

  const message = ctx.message.text.trim();
  const pending = pendingVerifications.get(userId);

  if (!pending) {
    // Expecting an email address
    if (!EMAIL_REGEX.test(message)) {
      await ctx.reply('❌ That does not look like a valid email. Please try again.');
      return;
    }

    if (!resendClient) {
      console.error('Resend API key is missing. Email cannot be sent.');
      await ctx.reply('❌ Email service is not configured. Please contact support.');
      return;
    }

    const code = generateVerificationCode();
    const expires = Date.now() + CODE_TTL_MS;

    pendingVerifications.set(userId, { email: message.toLowerCase(), code, expires });

    await ctx.reply(`📧 Sending verification code to ${message.toLowerCase()}...\n\n📥 Please check your inbox as well as Junk/Spam folders.`);

    try {
      await resendClient.emails.send({
        from: 'StudentDeals <noreply@studentdeals.uz>',
        to: message.toLowerCase(),
        subject: 'StudentDeals Email Verification Code',
        text: `Your verification code is: ${code}`,
      });

      await ctx.reply('✅ Please enter the 6-digit code you received.');
      console.log(`Verification code sent to ${message.toLowerCase()} (code ${code}).`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      pendingVerifications.delete(userId);
      await ctx.reply('❌ Failed to send verification email. Please try again later.');
    }

    return;
  }

  // Expecting a code
  if (Date.now() > pending.expires) {
    pendingVerifications.delete(userId);
    await ctx.reply('❌ The verification code has expired. Please enter your email again to receive a new code.');
    return;
  }

  if (!CODE_REGEX.test(message)) {
    await ctx.reply('❌ The verification code must be a 6-digit number. Please try again.');
    return;
  }

  if (message !== pending.code) {
    await ctx.reply('❌ Invalid verification code. Please try again.');
    return;
  }

  pendingVerifications.delete(userId);
  await ctx.reply('🎉 Email verified successfully! Welcome to StudentDeals.');
  console.log(`User ${userId} verified email ${pending.email}`);

  // Optional: notify backend
  if (config.apiUrl) {
    try {
      const response = await fetch(`${config.apiUrl}/auth/bot/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: userId.toString(),
          email: pending.email,
          code: message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Backend verification call failed:', response.status, errorText);
      } else {
        console.log('Backend verification call succeeded.');
      }
    } catch (error) {
      console.warn('Failed to notify backend about verification:', error);
    }
  }
});

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

process.once('SIGINT', () => {
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
