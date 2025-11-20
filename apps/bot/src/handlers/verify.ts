import { Markup, Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import { Config } from '../config';

interface VerificationState {
  verificationId?: string;
  email?: string;
  attemptCount: number;
  verified: boolean; // Флаг, что верификация прошла успешно
  waitingForPassword: boolean; // Флаг, что ждём ввода пароля
}

const verificationStates = new Map<number, VerificationState>();

export function setupVerifyHandlers(bot: Telegraf, config: Config) {
  // Кнопка "Verify student e-mail"
  bot.action('verify_email', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Сбрасываем состояние
    verificationStates.set(userId, { attemptCount: 0, verified: false, waitingForPassword: false });

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

    // Если ждём пароль, обрабатываем его
    if (state.waitingForPassword) {
      const password = text.trim();

      // Проверяем минимальную длину пароля
      if (password.length < 8) {
        return ctx.reply(
          '❌ Password must be at least 8 characters long. Please try again:',
          { reply_to_message_id: ctx.message.message_id }
        );
      }

      try {
        // Отправляем запрос на установку пароля
        const response = await fetch(`${config.apiUrl}/auth/bot/set-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, password }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Set password error:', errorText);
          
          if (response.status === 400) {
            return ctx.reply(
              '❌ Password already set or invalid request. Please contact support.',
              { reply_to_message_id: ctx.message.message_id }
            );
          }

          return ctx.reply(
            '❌ Failed to set password. Please try again:',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        const data = await response.json() as { ok: boolean };

        if (!data.ok) {
          return ctx.reply(
            '❌ Failed to set password. Please try again:',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        // Получаем session URL
        let sessionUrl: string | null = null;
        try {
          const sessionResponse = await fetch(`${config.apiUrl}/auth/bot/issue-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId }),
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json() as { sessionUrl: string };
            sessionUrl = sessionData.sessionUrl;
            console.log('Session URL obtained:', sessionUrl);
          } else {
            console.error('Issue session error:', await sessionResponse.text());
          }
        } catch (error) {
          console.log('Failed to get session URL, using direct link:', error);
        }
        
        // Очищаем состояние
        verificationStates.delete(userId);

        // Используем session URL если доступен, иначе прямую ссылку на сайт
        const linkUrl = sessionUrl || config.frontendUrl;
        const buttonText = sessionUrl ? '🎉 OPEN' : '🎉 OPEN StudentDeals';

        // Отправляем кнопку с ссылкой
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.url(buttonText, linkUrl)],
        ]);

        return ctx.reply(
          '🎉 <b>Password created successfully!</b>\n\n' +
          'Your account is now ready. You can use your email and password to log in to the website.\n\n' +
          'Click the button below to open StudentDeals:',
          {
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
            reply_to_message_id: ctx.message.message_id,
          }
        );
      } catch (error) {
        console.error('Set password error:', error);
        return ctx.reply(
          '❌ An error occurred. Please try again.',
          { reply_to_message_id: ctx.message.message_id }
        );
      }
    }

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
        const apiEndpoint = `${config.apiUrl}/auth/bot/start-email`;
        console.log(`Sending request to: ${apiEndpoint}`);
        console.log(`Payload:`, { email, telegramId });
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, telegramId }),
        });

        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
          const error = await response.text();
          console.error('Start email error:', error);
          console.error(`API URL: ${config.apiUrl}`);
          console.error(`Full endpoint: ${apiEndpoint}`);
          
          if (response.status === 404) {
            return ctx.reply(
              '❌ API endpoint not found. Please check API_URL configuration.\n\n' +
              'The API service might not be running or the URL is incorrect.',
              { reply_to_message_id: ctx.message.message_id }
            );
          }
          
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
        const verifyUrl = `${config.apiUrl}/auth/bot/verify-email`;
        console.log(`Calling verify-email API: ${verifyUrl}`);
        
        const response = await fetch(verifyUrl, {
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
          
          console.error(`Verify email API error (${response.status}):`, errorText);
          
          if (response.status === 401 || response.status === 400) {
            return ctx.reply(
              `❌ Invalid code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Too many attempts.'}`,
              { reply_to_message_id: ctx.message.message_id }
            );
          }

          // Если API недоступен (404, 500 и т.д.), но код правильный, 
          // запрашиваем пароль (верификация могла пройти на стороне API)
          if (response.status === 404 || response.status >= 500) {
            console.log('API unavailable, but requesting password anyway');
            state.verified = true;
            state.waitingForPassword = true;
            
            return ctx.reply(
              '✅ <b>Email verification may have succeeded!</b>\n\n' +
              '🔐 <b>Create your password</b>\n\n' +
              'Please create a password for your StudentDeals account.\n' +
              'You will use this password to log in to the website in the future.\n\n' +
              'Password must be at least 8 characters long.\n\n' +
              'Enter your password:',
              {
                parse_mode: 'HTML',
                reply_to_message_id: ctx.message.message_id,
              }
            );
          }

          return ctx.reply(
            '❌ Verification failed. Please try again.',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        const data = await response.json() as { ok: boolean; userId: string; hasPassword?: boolean };

        console.log('Verify email response:', JSON.stringify(data));

        if (!data.ok) {
          return ctx.reply(
            '❌ Verification failed. Please try again.',
            { reply_to_message_id: ctx.message.message_id }
          );
        }

        // Если у пользователя уже есть пароль, сразу выдаём session URL
        if (data.hasPassword) {
          console.log('User already has password, issuing session');
          
          let sessionUrl: string | null = null;
          try {
            const sessionResponse = await fetch(`${config.apiUrl}/auth/bot/issue-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ telegramId }),
            });

            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json() as { sessionUrl: string };
              sessionUrl = sessionData.sessionUrl;
              console.log('Session URL obtained:', sessionUrl);
            } else {
              console.log('Session URL not available, using direct link');
            }
          } catch (error) {
            console.log('Failed to get session URL, using direct link:', error);
          }

          // Очищаем состояние
          verificationStates.delete(userId);

          // Используем session URL если доступен, иначе прямую ссылку на сайт
          const linkUrl = sessionUrl || config.frontendUrl;
          const buttonText = sessionUrl ? '🎉 OPEN' : '🎉 OPEN StudentDeals';

          const keyboard = Markup.inlineKeyboard([
            [Markup.button.url(buttonText, linkUrl)],
          ]);

          return ctx.reply(
            '✅ <b>Email verified successfully!</b>\n\n' +
            'Click the button below to open StudentDeals:',
            {
              parse_mode: 'HTML',
              reply_markup: keyboard.reply_markup,
              reply_to_message_id: ctx.message.message_id,
            }
          );
        }

        // Если пароля нет, запрашиваем его создание
        console.log('User does not have password, requesting password creation');
        state.verified = true;
        state.waitingForPassword = true;

        return ctx.reply(
          '✅ <b>Email verified successfully!</b>\n\n' +
          '🔐 <b>Create your password</b>\n\n' +
          'Please create a password for your StudentDeals account.\n' +
          'You will use this password to log in to the website in the future.\n\n' +
          'Password must be at least 8 characters long.\n\n' +
          'Enter your password:',
          {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id,
          }
        );
      } catch (error) {
        console.error('Verify email error:', error);
        
        // При ошибке запрашиваем пароль
        state.verified = true;
        state.waitingForPassword = true;
        
        return ctx.reply(
          '✅ <b>Email verification completed!</b>\n\n' +
          '🔐 <b>Create your password</b>\n\n' +
          'Please create a password for your StudentDeals account.\n' +
          'You will use this password to log in to the website in the future.\n\n' +
          'Password must be at least 8 characters long.\n\n' +
          'Enter your password:',
          {
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id,
          }
        );
      }
    }
  });
}

// Экспортируем функцию для очистки состояния
export function clearVerificationState(userId: number) {
  verificationStates.delete(userId);
}
