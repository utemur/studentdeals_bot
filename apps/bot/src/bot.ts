import { Telegraf } from 'telegraf';
import { loadConfig } from './config';
import { rateLimit } from './middlewares/rateLimit';
import { setupStartHandler } from './handlers/start';
import { setupVerifyHandlers } from './handlers/verify';
import { setupHelpHandler } from './handlers/help';

const config = loadConfig();

export const bot = new Telegraf(config.telegramBotToken);

bot.use(rateLimit(10, 60000)); // simple anti-spam

// Подключаем обработчики
bot.start(async (ctx) => {
  await setupStartHandler(ctx, config);
});

bot.action('help', async (ctx) => {
  await ctx.answerCbQuery();
  await setupHelpHandler(ctx);
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'ℹ️ <b>StudentDeals Bot Help</b>\n\n' +
    '🎓 <b>Verify student e-mail</b>\n' +
    'Verify your student email to access exclusive deals.\n' +
    'You will receive a 6-digit code via email.\n\n' +
    '🔐 <b>Login with Telegram</b>\n' +
    'Use your Telegram account to access your profile on the web.\n\n' +
    'For more information, visit our website!',
    { parse_mode: 'HTML' }
  );
});

// Подключаем обработчики верификации
setupVerifyHandlers(bot, config);

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
