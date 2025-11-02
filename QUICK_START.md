# Быстрый старт StudentDeals Bot

## Установка

```bash
# Клонируйте репозиторий
git clone <repo-url>
cd StudentDeals_bot

# Установите зависимости
pnpm install

# Скопируйте .env.example в .env и заполните переменные
cp .env.example .env
nano .env  # или отредактируйте в любом редакторе
```

## Локальный запуск

### 1. Запустите PostgreSQL

```bash
# Используя Docker
docker run -d \
  --name studentdeals-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=studentdeals \
  -p 5432:5432 \
  postgres:15

# Или используйте существующую БД
```

### 2. Настройте базу данных

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate dev --name init
```

### 3. Запустите API

```bash
cd apps/api
pnpm dev
```

API будет доступен на http://localhost:3000

### 4. Запустите бота

В новом терминале:

```bash
cd apps/bot
pnpm dev
```

Бот будет работать в режиме polling.

## Тестирование

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Нажмите "🎓 Verify student e-mail"
4. Введите тестовый email (например: `test@university.edu`)
5. Проверьте почту - должен прийти код
6. Введите код в боте
7. Получите кнопку "🎉 Open my account"

## Важные переменные окружения

```env
TELEGRAM_BOT_TOKEN=<from @BotFather>
DATABASE_URL=postgresql://user:password@localhost:5432/studentdeals
RESEND_API_KEY=<from resend.com>
CODE_PEPPER=<random string, keep secret>
JWT_SECRET=<random string, keep secret>
```

## Production деплой

См. [DEPLOYMENT.md](DEPLOYMENT.md) для подробных инструкций по деплою на Render.

## Структура

- `apps/api` - NestJS API сервер
- `apps/bot` - Telegram бот на Telegraf
- `package.json` - корневой package.json для монорепо
- `render.yaml` - конфигурация для Render Blueprint

## Документация

- [README.md](README.md) - общая информация
- [apps/api/README.md](apps/api/README.md) - API документация
- [apps/bot/README.md](apps/bot/README.md) - бот документация
- [DEPLOYMENT.md](DEPLOYMENT.md) - инструкции по деплою
