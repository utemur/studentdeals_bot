import { Telegraf } from 'telegraf';
import { loadConfig } from './config';
import { setupStartHandler } from './handlers/start';
import { setupHelpHandler } from './handlers/help';
import { setupVerifyHandlers, clearVerificationState } from './handlers/verify';
import { rateLimit } from './middlewares/rateLimit';

const config = loadConfig();

export const bot = new Telegraf(config.telegramBotToken);

// Middleware для rate limit
bot.use(rateLimit(10, 60000)); // 10 команд в минуту

// Команда /start
bot.command('start', async (ctx) => {
  // Очищаем состояние верификации при старте
  if (ctx.from?.id) {
    clearVerificationState(ctx.from.id);
  }
  await setupStartHandler(ctx, config);
});

// Обработчик help callback
bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await setupHelpHandler(ctx);
});

// Обработчики верификации
setupVerifyHandlers(bot, config);

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
});

