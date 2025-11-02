# 🚀 Быстрая инструкция по деплою на Render

## ⚠️ КРИТИЧНО: Смените токены!

В репозитории были обнаружены реальные токены:
- Telegram Bot Token: `8561886016:AAGKNTaHkEfLqerp57l9fp49gHLJm6DOQr0`
- Resend API Key: `re_HXW7aXez_8P1z8kH1Z5gRopsSv2GyZtZS`

**НЕМЕДЛЕННО СМЕНИТЕ:**
1. Telegram: @BotFather → /revoke → создайте нового бота
2. Resend: Dashboard → API Keys → Revoke → Create

---

## 📋 3 способа деплоя

### 1️⃣ Blueprint (самый простой)

1. Зайдите в Render Dashboard
2. Нажмите **New** → **Blueprint**
3. Подключите репозиторий `utemur/studentdeals_bot`
4. Render автоматически найдёт `render.yaml`
5. Заполните переменные окружения
6. Нажмите **Apply**

Render создаст все 3 сервиса автоматически!

---

### 2️⃣ Ручной деплой (пошагово)

#### Шаг 1: Database

**New** → **PostgreSQL**
- **Name:** `studentdeals-db`
- **Region:** Singapore (ближайший к Узбекистану)
- **Plan:** Free
- **Database:** `studentdeals`
- Нажмите **Create**

После создания:
- Скопируйте **Internal Database URL**
- Пример: `postgresql://user:pass@dpg-xxx.internal/dbname`

#### Шаг 2: API

**New** → **Web Service**
- **Repository:** `utemur/studentdeals_bot`
- **Name:** `studentdeals-api`
- **Region:** Singapore
- **Branch:** `main`
- **Root Directory:** (оставить пустым)

**Build & Deploy:**
- **Build Command:** `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm -w --filter @studentdeals/api build`
- **Start Command:** `pnpm -w --filter @studentdeals/api start:prod`

**Environment:**
- **Node:** Version 22

**Plan:** Free

**Environment Variables:**
```
DATABASE_URL=<Internal Database URL из шага 1>
RESEND_API_KEY=re_НОВЫЙ_КЛЮЧ
FRONTEND_URL=https://studentdeals-uz-web.vercel.app
STUDENT_EMAIL_DOMAINS=.edu,.ac.uk,.edu.uz
CODE_PEPPER=randomstring12345
CODE_TTL_SECONDS=900
CODE_MAX_ATTEMPTS=5
SESSION_URL_TTL_SECONDS=120
JWT_SECRET=randomjwtsecret67890
JWT_ISSUER=studentdeals
JWT_AUDIENCE=web
NODE_ENV=production
```

Нажмите **Create Web Service**

После деплоя:
- Скопируйте **Internal URL** API
- Пример: `https://studentdeals-api-xxx.onrender.com`

#### Шаг 3: Bot

**New** → **Web Service**
- **Repository:** `utemur/studentdeals_bot`
- **Name:** `studentdeals-bot`
- **Region:** Singapore
- **Branch:** `main`

**Build & Deploy:**
- **Build Command:** `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm -w --filter @studentdeals/bot build`
- **Start Command:** `pnpm -w --filter @studentdeals/bot start:prod`

**Environment:**
- **Node:** Version 22

**Plan:** Free

**Environment Variables:**
```
TELEGRAM_BOT_TOKEN=НОВЫЙ_ТОКЕН_ОТ_BOTFATHER
BOT_WEBHOOK_SECRET=randomsecret54321
BOT_WEBHOOK_BASE=https://studentdeals-bot-XXX.onrender.com
FRONTEND_URL=https://studentdeals-uz-web.vercel.app
API_URL=<Internal URL API из шага 2>
RESEND_API_KEY=re_НОВЫЙ_КЛЮЧ
STUDENT_EMAIL_DOMAINS=.edu,.ac.uk,.edu.uz
CODE_PEPPER=randomstring12345
CODE_TTL_SECONDS=900
CODE_RESEND_COOLDOWN=60
CODE_MAX_ATTEMPTS=5
SESSION_URL_TTL_SECONDS=120
NODE_ENV=production
```

**Важно:** `BOT_WEBHOOK_BASE` заполните ПОСЛЕ получения URL бота!

Нажмите **Create Web Service**

#### Шаг 4: Обновите BOT_WEBHOOK_BASE

После деплоя бота:
1. Скопируйте Public URL бота
2. Settings → Environment
3. Измените `BOT_WEBHOOK_BASE` на реальный URL
4. **Save Changes**
5. Services → **Manual Deploy** → **Deploy latest commit**

---

### 3️⃣ Командная строка

```bash
# Установите Render CLI
npm install -g @render/cli

# Залогиньтесь
render login

# Задеплойте через CLI
render deploy
```

---

## 🔧 Post-Deploy настройка

### 1. Применить миграции БД

1. Зайдите в **studentdeals-api** сервис
2. **Shell** (в боковом меню)
3. Выполните:
```bash
cd apps/api
npx prisma migrate deploy
```

Должно появиться: `All migrations have been successfully applied.`

### 2. Установить webhook

1. Зайдите в **studentdeals-bot** сервис
2. **Shell**
3. Выполните:
```bash
node apps/bot/dist/index.js --set-webhook
```

Должно появиться: `✅ Webhook set successfully`

### 3. Проверить health checks

```bash
# API
curl https://studentdeals-api-XXX.onrender.com/healthz

# Bot
curl https://studentdeals-bot-XXX.onrender.com/healthz
```

Оба должны вернуть: `{"status":"ok"}`

---

## 🧪 Тестирование

1. Найдите бота в Telegram
2. Отправьте `/start`
3. Должна появиться клавиатура с кнопками
4. Нажмите **🎓 Verify student e-mail**
5. Введите тестовый email (например: `test@university.edu`)
6. Проверьте почту - должен прийти код
7. Введите код в боте
8. Должна появиться кнопка **🎉 Open my account**

---

## 🐛 Troubleshooting

### Бот не отвечает

1. Проверьте webhook: **Shell** → `node apps/bot/dist/index.js --delete-webhook && node apps/bot/dist/index.js --set-webhook`
2. Проверьте логи: **Logs** в Render Dashboard
3. Убедитесь, что `NODE_ENV=production`

### API не работает

1. Проверьте миграции: **Shell** → `cd apps/api && npx prisma migrate deploy`
2. Проверьте DATABASE_URL корректный
3. Проверьте логи

### Письма не отправляются

1. Проверьте `RESEND_API_KEY` валидный
2. Зайдите в Resend Dashboard
3. Проверьте **Sending** → **Emails** - должны быть логи

### Internal URL vs Public URL

- **Internal URL** начинается с имени сервиса (например: `https://studentdeals-api-xxx.onrender.com`)
- Используйте Internal URL для `API_URL` в боте
- Используйте Public URL для `BOT_WEBHOOK_BASE`

---

## 📊 Мониторинг

### Render Dashboard

- **Metrics** - CPU, Memory, Request rate
- **Logs** - реальные логи приложения
- **Events** - все события (деплои, рестарты)

### Проверка

```bash
# Проверить статус всех сервисов
curl https://studentdeals-api-XXX.onrender.com/healthz
curl https://studentdeals-bot-XXX.onrender.com/healthz

# Проверить API endpoints
curl -X POST https://studentdeals-api-XXX.onrender.com/auth/bot/start-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.edu","telegramId":"123456789"}'
```

---

## ✅ Чеклист

- [ ] Сменили Telegram Bot Token
- [ ] Сменили Resend API Key
- [ ] Создали PostgreSQL database
- [ ] Задеплоили API
- [ ] Задеплоили Bot
- [ ] Применили миграции БД
- [ ] Установили webhook
- [ ] Проверили health checks
- [ ] Протестировали полный flow

---

## 🎉 Готово!

Ваш бот должен работать! 

**URLs:**
- API: https://studentdeals-api-XXX.onrender.com
- Bot: https://studentdeals-bot-XXX.onrender.com
- Database: Internal (доступен только из Render)

**Документация:**
- Подробный деплой: DEPLOYMENT.md
- Быстрый старт: QUICK_START.md
- API: apps/api/README.md
- Bot: apps/bot/README.md

