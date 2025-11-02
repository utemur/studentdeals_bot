# StudentDeals Bot - Монорепо

Монорепо для Telegram-бота авторизации и верификации студентов.

## Структура проекта

```
.
├── apps/
│   ├── api/          # NestJS API сервер
│   └── bot/          # Telegram бот (Telegraf)
├── package.json      # Root package.json
├── pnpm-workspace.yaml
└── .env.example      # Пример переменных окружения
```

## Технологии

- **pnpm workspaces** - управление монорепо
- **TypeScript** - для всех приложений
- **NestJS** - API сервер
- **Telegraf** - Telegram бот
- **Prisma** - ORM для базы данных
- **Resend** - отправка email

## Быстрый старт

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните все переменные:

```bash
cp .env.example .env
```

### 3. Настройка базы данных

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
```

### 4. Запуск в режиме разработки

```bash
# Из корня проекта
pnpm dev
```

Это запустит:
- API сервер на http://localhost:3000
- Telegram бота в режиме polling

## Раздельные приложения

### API (apps/api)

NestJS сервер с Prisma ORM.

**Запуск:**
```bash
pnpm -w --filter @studentdeals/api dev
```

**Endpoints:**
- `GET /healthz` - health check
- `POST /auth/bot/start-email` - начало верификации
- `POST /auth/bot/verify-email` - проверка кода
- `POST /auth/bot/issue-session` - генерация session URL

### Bot (apps/bot)

Telegram бот на Telegraf.

**Запуск:**
```bash
pnpm -w --filter @studentdeals/bot dev
```

**Команды:**
- `/start` - главное меню
- Help - справка
- Verify student e-mail - верификация

## Production деплой

### Render.com

#### API

1. Create new Web Service
2. Build command: `pnpm -w --filter @studentdeals/api build`
3. Start command: `node apps/api/dist/main.js`
4. Добавьте все переменные окружения из `.env.example`

#### Bot

1. Create new Web Service
2. Build command: `pnpm -w --filter @studentdeals/bot build`
3. Start command: `node apps/bot/dist/index.js`
4. Добавьте переменные окружения
5. После деплоя установите webhook: `pnpm -w --filter @studentdeals/bot set-webhook`

## Документация

- [API документация](apps/api/README.md)
- [Bot документация](apps/bot/README.md)

## Лицензия

MIT

