import { bot } from './bot';
import { loadConfig } from './config';

const config = loadConfig();

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
