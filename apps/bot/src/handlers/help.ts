import { Context } from 'telegraf';

export async function setupHelpHandler(ctx: Context) {
  return ctx.editMessageText(
    'ℹ️ <b>StudentDeals Bot Help</b>\n\n' +
    '🎓 <b>Verify student e-mail</b>\n' +
    'Verify your student email to access exclusive deals.\n' +
    'You will receive a 6-digit code via email.\n\n' +
    '🔐 <b>Login with Telegram</b>\n' +
    'Use your Telegram account to access your profile on the web.\n\n' +
    'For more information, visit our website!',
    { parse_mode: 'HTML' }
  );
}

