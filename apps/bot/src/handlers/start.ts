import { Context, Markup } from 'telegraf';
import { Config } from '../config';

export function setupStartHandler(ctx: Context, config: Config) {
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.url('🔐 Login with Telegram', `${config.frontendUrl}/auth/telegram`),
    ],
    [
      Markup.button.callback('🎓 Verify student e-mail', 'verify_email'),
    ],
    [
      Markup.button.callback('ℹ️ Help', 'help'),
    ],
  ]);

  return ctx.reply(
    '👋 Welcome to StudentDeals!\n\n' +
    'Choose an option:',
    keyboard
  );
}

