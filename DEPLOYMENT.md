# Инструкция по деплою StudentDeals Bot

## Предварительные требования

1. Аккаунт на Render.com
2. Telegram Bot Token от @BotFather
3. API ключ Resend
4. PostgreSQL база данных (можно на Render)

## Шаг 1: Создание базы данных

1. В Render создайте новый PostgreSQL database
2. Скопируйте Internal Database URL

## Шаг 2: Деплой API

1. Создайте новый **Web Service** в Render
2. Подключите GitHub репозиторий
3. Настройки:
   - **Build Command:** `pnpm install && pnpm -w --filter @studentdeals/api build`
   - **Start Command:** `node apps/api/dist/main.js`
   - **Environment:** Node
4. Добавьте переменные окружения:
   ```
   DATABASE_URL=<ваш_postgresql_url>
   RESEND_API_KEY=<ваш_resend_api_key>
   FRONTEND_URL=https://studentdeals-uz-web.vercel.app
   STUDENT_EMAIL_DOMAINS=.edu,.ac.uk,.edu.uz
   CODE_PEPPER=<случайная_строка>
   CODE_TTL_SECONDS=900
   CODE_MAX_ATTEMPTS=5
   SESSION_URL_TTL_SECONDS=120
   JWT_SECRET=<случайная_строка>
   JWT_ISSUER=studentdeals
   JWT_AUDIENCE=web
   NODE_ENV=production
   ```
5. После деплоя нажмите **Manual Deploy**
6. Скопируйте **Internal URL** API сервиса

## Шаг 3: Деплой бота

1. Создайте новый **Web Service** в Render
2. Подключите GitHub репозиторий
3. Настройки:
   - **Build Command:** `pnpm install && pnpm -w --filter @studentdeals/bot build`
   - **Start Command:** `node apps/bot/dist/index.js`
   - **Environment:** Node
4. Добавьте переменные окружения:
   ```
   TELEGRAM_BOT_TOKEN=<ваш_bot_token>
   BOT_WEBHOOK_SECRET=<случайная_строка>
   BOT_WEBHOOK_BASE=https://<ваш-бот-domain>.onrender.com
   FRONTEND_URL=https://studentdeals-uz-web.vercel.app
   API_URL=<internal_url_api_из_шага_2>
   RESEND_API_KEY=<ваш_resend_api_key>
   STUDENT_EMAIL_DOMAINS=.edu,.ac.uk,.edu.uz
   CODE_PEPPER=<та_же_строка_что_в_api>
   CODE_TTL_SECONDS=900
   CODE_RESEND_COOLDOWN=60
   CODE_MAX_ATTEMPTS=5
   SESSION_URL_TTL_SECONDS=120
   NODE_ENV=production
   ```
5. После деплоя скопируйте **URL** бота

## Шаг 4: Обновление BOT_WEBHOOK_BASE

1. Вернитесь в настройки бота
2. Обновите `BOT_WEBHOOK_BASE` на реальный URL бота (без завершающего слеша)
3. Перезапустите сервис

## Шаг 5: Установка Webhook

После деплоя обеих сервисов:

```bash
# Установите зависимости локально
pnpm install

# Установите webhook
BOT_WEBHOOK_BASE=https://<your-bot-domain>.onrender.com \
BOT_WEBHOOK_SECRET=<ваш_webhook_secret> \
TELEGRAM_BOT_TOKEN=<ваш_bot_token> \
pnpm -w --filter @studentdeals/bot set-webhook
```

Или используйте Render Shell:

1. Зайдите в бот сервис
2. Откройте **Shell** вкладку
3. Выполните:
```bash
export TELEGRAM_BOT_TOKEN=<ваш_bot_token>
export BOT_WEBHOOK_SECRET=<ваш_webhook_secret>
export BOT_WEBHOOK_BASE=https://<your-bot-domain>.onrender.com
node apps/bot/dist/index.js --set-webhook
```

## Шаг 6: Применение миграций БД

В Render Shell API сервиса:

```bash
cd apps/api
npx prisma migrate deploy
```

## Проверка работы

1. Откройте Telegram бота
2. Отправьте `/start`
3. Нажмите "🎓 Verify student e-mail"
4. Введите тестовый email с доменом `.edu`
5. Проверьте получение кода на почту
6. Введите код
7. Проверьте получение кнопки "Open my account"

## Troubleshooting

### Бот не отвечает

1. Проверьте, что webhook установлен: используйте `--set-webhook`
2. Проверьте логи в Render Dashboard
3. Убедитесь, что `NODE_ENV=production`

### API возвращает ошибки

1. Проверьте, что база данных доступна
2. Проверьте логи API сервиса
3. Убедитесь, что все переменные окружения установлены

### Письма не отправляются

1. Проверьте `RESEND_API_KEY`
2. Проверьте логи в Resend Dashboard
3. Убедитесь, что домен настроен в Resend

### Internal URL vs Public URL

- Для `API_URL` в боте используйте **Internal URL** (начинается с `https://studentdeals-api...`)
- Для `BOT_WEBHOOK_BASE` используйте **Public URL** бота

## Health Checks

- API: `https://<api-url>/healthz`
- Bot: `https://<bot-url>/healthz`

Оба должны возвращать `{"status":"ok"}`.

