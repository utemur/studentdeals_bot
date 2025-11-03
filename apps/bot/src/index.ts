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

async function startPolling() {
  console.log('🤖 Starting bot in polling mode...');
  await bot.launch();
  console.log('✅ Bot is running!');
}

async function setWebhook() {
  if (!config.webhookBase) {
    throw new Error('BOT_WEBHOOK_BASE is required for webhook setup');
  }

  const webhookUrl = `${config.webhookBase}/webhook/telegram/${config.webhookSecret}`;
  console.log(`Setting webhook to: ${webhookUrl}`);
  
  await bot.telegram.setWebhook(webhookUrl);
  console.log('✅ Webhook set successfully');
  
  const info = await bot.telegram.getWebhookInfo();
  console.log('Webhook info:', JSON.stringify(info, null, 2));
}

async function deleteWebhook() {
  console.log('Deleting webhook...');
  await bot.telegram.deleteWebhook();
  console.log('✅ Webhook deleted successfully');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--set-webhook')) {
    await setWebhook();
    process.exit(0);
  }

  if (args.includes('--delete-webhook')) {
    await deleteWebhook();
    process.exit(0);
  }

  // Default: start polling
  await startPolling();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

