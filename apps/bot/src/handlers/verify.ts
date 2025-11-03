import { Markup, Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import { Config } from '../config';

interface VerificationState {
  verificationId?: string;
  email?: string;
  attemptCount: number;
}

const verificationStates = new Map<number, VerificationState>();

export function setupVerifyHandlers(bot: Telegraf, config: Config) {
  // Кнопка "Verify student e-mail"
  bot.action('verify_email', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Сбрасываем состояние
    verificationStates.set(userId, { attemptCount: 0 });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🎓 <b>Student E-mail Verification</b>\n\n' +
      'Please send your student email address.\n' +
      'Supported domains: ' + config.studentDomains.join(', '),
      { parse_mode: 'HTML' }
    );
  });

  // Обработка текстовых сообщений (для ввода email и кода)
  bot.on('text', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const state = verificationStates.get(userId);
    if (!state) return; // Не в процессе верификации

    const text = ctx.message.text;
    const telegramId = userId.toString();

    // Если у нас нет verificationId, значит вводится email
    if (!state.verificationId) {
      const email = text.trim().toLowerCase();

      // Простая проверка email
      if (!email.includes('@') || !email.includes('.')) {
        return ctx.reply(
          '❌ Invalid email format. Please send a valid email address.',
          { reply_to_message_id: ctx.message.message_id }
        );
      }

      // Проверяем домен
      const isValidDomain = config.studentDomains.some(domain => 
        email.endsWith(domain)
      );

      if (!isValidDomain) {
        return ctx.reply(
          `❌ Email must be from a student domain:\n${config.studentDomains.map(d => `• ${d}`).join('\n')}`,
          { reply_to_message_id: ctx.message.message_id }
        );
      }

      try {
        // Отправляем запрос на старт верификации
        console.log(`Sending request to: ${config.apiUrl}/auth/bot/start-email`);
        console.log(`Payload:`, { email, telegramId });
        
        const response = await fetch(`${config.apiUrl}/auth/bot/start-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, telegramId }),
        });

        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Start email error:', error);
          return ctx.reply(
            '❌ Failed to start verification. Please try again later.',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        const data = await response.json() as { verificationId: string; expiresAt: string };
        
        // Сохраняем состояние
        state.verificationId = data.verificationId;
        state.email = email;

        await ctx.reply(
          `✅ Verification code sent to: <b>${email}</b>\n\n` +
          'Please enter the 6-digit code from your email:',
          { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id 
          }
        );
      } catch (error) {
        console.error('Start email error:', error);
        return ctx.reply(
          '❌ An error occurred. Please try again later.',
          { reply_to_message_id: ctx.message.message_id }
        );
      }
    } else {
      // Вводится код
      const code = text.trim();

      // Проверяем формат кода
      if (!/^\d{6}$/.test(code)) {
        return ctx.reply(
          '❌ Code must be 6 digits. Please try again:',
          { reply_to_message_id: ctx.message.message_id }
        );
      }

      // Проверяем лимит попыток
      if (state.attemptCount >= config.codeMaxAttempts) {
        verificationStates.delete(userId);
        return ctx.reply(
          '❌ Too many failed attempts. Please start over with /start',
          { reply_to_message_id: ctx.message.message_id }
        );
      }

      try {
        // Отправляем запрос на проверку кода
        const response = await fetch(`${config.apiUrl}/auth/bot/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verificationId: state.verificationId,
            code,
            telegramId,
          }),
        });

        if (!response.ok) {
          state.attemptCount++;
          const remaining = config.codeMaxAttempts - state.attemptCount;
          const errorText = await response.text();
          
          if (response.status === 401 || response.status === 400) {
            return ctx.reply(
              `❌ Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Too many attempts.'}`,
              { reply_to_message_id: ctx.message.message_id }
            );
          }

          console.error('Verify email error:', errorText);
          return ctx.reply(
            '❌ Verification failed. Please try again.',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        const data = await response.json() as { ok: boolean; userId: string };

        if (!data.ok) {
          return ctx.reply(
            '❌ Verification failed. Please try again.',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        // Получаем session URL
        const sessionResponse = await fetch(`${config.apiUrl}/auth/bot/issue-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId }),
        });

        if (!sessionResponse.ok) {
          console.error('Issue session error:', await sessionResponse.text());
          return ctx.reply(
            '✅ Email verified! But failed to generate session link. Please contact support.',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        const sessionData = await sessionResponse.json() as { sessionUrl: string };
        
        // Очищаем состояние
        verificationStates.delete(userId);

        // Отправляем кнопку с ссылкой
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.url('🎉 Open my account', sessionData.sessionUrl)],
        ]);

        return ctx.reply(
          '🎉 <b>Successfully verified!</b>\n\n' +
          'You can now access your StudentDeals account by clicking the button below:',
          {
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
            reply_to_message_id: ctx.message.message_id,
          }
        );
      } catch (error) {
        console.error('Verify email error:', error);
        return ctx.reply(
          '❌ An error occurred. Please try again.',
          { reply_to_message_id: ctx.message.message_id }
        );
      }
    }
  });
}

// Экспортируем функцию для очистки состояния
export function clearVerificationState(userId: number) {
  verificationStates.delete(userId);
}
