# Render Deployment Summary

## ✅ Исправления

### 1. Node Version
- **Было:** Node 25.x (слишком новый)
- **Стало:** Node 22.x (LTS)
- **Изменено в:** `package.json` → `"engines": { "node": "22.x" }`

### 2. Build Commands
- **Было:** `npm install -g pnpm && pnpm install && pnpm -w --filter @app build`
- **Стало:** `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm -w --filter @app build`
- **Изменено в:** `render.yaml`, `RENDER_DEPLOY.md`

### 3. Start Commands
- **Было:** `node apps/api/dist/main.js`
- **Стало:** `pnpm -w --filter @studentdeals/api start:prod`
- **Изменено в:** `render.yaml`, `apps/api/package.json`, `apps/bot/package.json`

### 4. Production Scripts
- **Добавлено:** `"start:prod"` в `apps/api/package.json` и `apps/bot/package.json`
- Использует тот же start, но явно для production

### 5. Removed Corepack
- Удалён `corepack enable` из всех команд
- Используем `npm install -g pnpm` вместо corepack

## 📋 Render Build Commands

### API Service
```bash
# Build Command
npm install -g pnpm && pnpm install --frozen-lockfile && pnpm -w --filter @studentdeals/api build

# Start Command
pnpm -w --filter @studentdeals/api start:prod
```

### Bot Service
```bash
# Build Command
npm install -g pnpm && pnpm install --frozen-lockfile && pnpm -w --filter @studentdeals/bot build

# Start Command
pnpm -w --filter @studentdeals/bot start:prod
```

## 🎯 Environment Variables

### API
- DATABASE_URL
- RESEND_API_KEY
- FRONTEND_URL
- STUDENT_EMAIL_DOMAINS
- CODE_PEPPER
- CODE_TTL_SECONDS
- CODE_MAX_ATTEMPTS
- SESSION_URL_TTL_SECONDS
- JWT_SECRET
- JWT_ISSUER
- JWT_AUDIENCE
- NODE_ENV=production

### Bot
- TELEGRAM_BOT_TOKEN
- BOT_WEBHOOK_SECRET
- BOT_WEBHOOK_BASE
- FRONTEND_URL
- API_URL
- RESEND_API_KEY
- STUDENT_EMAIL_DOMAINS
- CODE_PEPPER
- CODE_TTL_SECONDS
- CODE_RESEND_COOLDOWN
- CODE_MAX_ATTEMPTS
- SESSION_URL_TTL_SECONDS
- NODE_ENV=production

## ✅ Verification Checklist

- [x] Node version set to 22.x
- [x] Build commands use --frozen-lockfile
- [x] Start commands use pnpm workspaces
- [x] start:prod scripts added
- [x] No corepack usage
- [x] TypeScript outputs to dist/
- [x] Both services listen on process.env.PORT
- [x] Bot listens on 0.0.0.0 (Express default)
- [x] API listens on 0.0.0.0 (NestJS default)

## 🚀 Next Steps

1. Update Render service settings:
   - Node version: 22
   - Build command: (see above)
   - Start command: (see above)

2. Manual Deploy or wait for auto-deploy

3. Verify:
   - API: `curl https://studentdeals-api-XXX.onrender.com/healthz`
   - Bot: `curl https://studentdeals-bot-XXX.onrender.com/healthz`

4. Run migrations:
   ```bash
   cd apps/api
   npx prisma migrate deploy
   ```

5. Setup webhook:
   ```bash
   node apps/bot/dist/index.js --set-webhook
   ```

