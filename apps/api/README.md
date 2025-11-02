# StudentDeals API

NestJS API сервер для работы с Telegram ботом.

## Технологии

- **NestJS** - прогрессивный Node.js фреймворк
- **Prisma** - современный ORM
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Resend** - отправка email

## Установка

```bash
pnpm install
```

## Настройка базы данных

```bash
# Генерация Prisma Client
pnpm prisma:generate

# Применение миграций
pnpm prisma:migrate

# Открыть Prisma Studio
pnpm prisma:studio
```

## Запуск

### Разработка

```bash
pnpm dev
```

API будет доступен на http://localhost:3000

### Production

```bash
pnpm build
pnpm start
```

## Endpoints

### Health Check

```
GET /healthz
```

Проверка статуса API.

**Response:**
```json
{
  "status": "ok"
}
```

### Bot Auth Endpoints

#### POST /auth/bot/start-email

Запускает процесс верификации email.

**Request:**
```json
{
  "email": "student@university.edu",
  "telegramId": "123456789"
}
```

**Response:**
```json
{
  "verificationId": "cm123abc...",
  "expiresAt": "2024-01-01T12:30:00Z"
}
```

**Ошибки:**
- `400` - невалидный домен email
- `500` - ошибка отправки email

#### POST /auth/bot/verify-email

Проверяет введённый код верификации.

**Request:**
```json
{
  "verificationId": "cm123abc...",
  "code": "123456",
  "telegramId": "123456789"
}
```

**Response:**
```json
{
  "ok": true,
  "userId": "cm456def..."
}
```

**Ошибки:**
- `400` - невалидный verificationId
- `400` - код уже использован
- `400` - код истёк
- `400` - слишком много попыток
- `401` - неверный код

#### POST /auth/bot/issue-session

Генерирует магическую ссылку для доступа к аккаунту.

**Request:**
```json
{
  "telegramId": "123456789"
}
```

**Response:**
```json
{
  "sessionUrl": "https://studentdeals-uz-web.vercel.app/auth/magic?token=eyJhbG..."
}
```

**Ошибки:**
- `401` - пользователь не верифицирован

## Модели базы данных

### User

```prisma
model User {
  id             String    @id @default(cuid())
  email          String?   @unique
  emailVerified  Boolean   @default(false)
  emailVerifiedAt DateTime?
  telegramId     String?   @unique
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

### VerificationCode

```prisma
model VerificationCode {
  id         String    @id @default(cuid())
  email      String
  codeHash   String
  telegramId String
  attempts   Int       @default(0)
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  consumedAt DateTime?

  @@index([email])
  @@index([telegramId])
  @@index([expiresAt])
}
```

## Безопасность

- **Хэширование кодов**: коды хранятся в виде SHA256 хэшей с использованием pepper
- **TTL**: коды действительны 15 минут (настраивается через `CODE_TTL_SECONDS`)
- **Лимит попыток**: максимум 5 попыток ввода кода
- **JWT**: короткоживущие токены (2 минуты) для магических ссылок
- **Валидация**: входные данные валидируются через class-validator

## Переменные окружения

```env
DATABASE_URL=postgresql://user:password@localhost:5432/studentdeals
RESEND_API_KEY=re_your_api_key
FRONTEND_URL=https://studentdeals-uz-web.vercel.app
STUDENT_EMAIL_DOMAINS=.edu,.ac.uk,.edu.uz
CODE_PEPPER=random_pepper
CODE_TTL_SECONDS=900
CODE_MAX_ATTEMPTS=5
SESSION_URL_TTL_SECONDS=120
JWT_SECRET=your_jwt_secret
JWT_ISSUER=studentdeals
JWT_AUDIENCE=web
PORT=3000
```

## Разработка

### Структура проекта

```
apps/api/
├── src/
│   ├── main.ts              # Точка входа
│   ├── app.module.ts        # Главный модуль
│   ├── app.controller.ts    # Health check
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth-bot/
│   │   ├── auth-bot.module.ts
│   │   ├── auth-bot.controller.ts
│   │   ├── auth-bot.service.ts
│   │   ├── mail.service.ts
│   │   └── dto/
│   │       ├── start-email.dto.ts
│   │       ├── verify-email.dto.ts
│   │       └── issue-session.dto.ts
├── prisma/
│   └── schema.prisma        # Prisma схема
└── package.json
```

### Создание новых модулей

```bash
# Используя NestJS CLI
cd apps/api
pnpm nest generate module module-name
pnpm nest generate controller module-name
pnpm nest generate service module-name
```

## Тестирование

```bash
# Unit тесты
pnpm test

# E2E тесты
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Production деплой

### Build

```bash
pnpm build
```

### Start

```bash
pnpm start
```

Порт можно настроить через переменную окружения `PORT` (по умолчанию 3000).

### Health Check

Render и другие платформы используют `/healthz` для health checks:

```bash
curl https://your-api-domain.com/healthz
```

