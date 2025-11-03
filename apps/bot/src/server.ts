import express from 'express';
import { bot } from './index';
import { loadConfig } from './config';

const config = loadConfig();
const app = express();

// Middleware для парсинга JSON
app.use(express.json());

// Health check для Render
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// Webhook путь
const webhookPath = `/webhook/telegram/${config.webhookSecret}`;
app.post(webhookPath, async (req, res) => {
  await bot.handleUpdate(req.body, res);
});

const port = process.env.PORT || 3001;

app.listen(port, async () => {
  console.log(`🚀 Webhook server listening on port ${port}`);
  console.log(`📡 Webhook path: ${webhookPath}`);
  
  // Автоматически устанавливаем webhook при старте
  if (config.webhookBase) {
    const webhookUrl = `${config.webhookBase}${webhookPath}`;
    console.log(`Setting webhook to: ${webhookUrl}`);
    try {
      await bot.telegram.setWebhook(webhookUrl);
      console.log('✅ Webhook set successfully');
    } catch (error) {
      console.error('Failed to set webhook:', error);
    }
  } else {
    console.warn('⚠️  BOT_WEBHOOK_BASE not set - webhook will not be configured');
  }
});

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit(0);
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});

