# Исправление неудачной миграции

## Проблема

В базе данных есть неудачная миграция `20250101000000_add_password_hash`, которая блокирует применение новых миграций.

Ошибка:
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20250101000000_add_password_hash` migration started at 2025-11-20 17:24:36.120122 UTC failed
```

## Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

Скрипт `apps/api/scripts/fix-migration.sh` должен автоматически исправить проблему при следующем деплое. Убедитесь, что:

1. Файл `render.yaml` содержит вызов скрипта в `buildCommand`
2. Скрипт имеет права на выполнение: `chmod +x apps/api/scripts/fix-migration.sh`
3. Переменная `DATABASE_URL` установлена в Render.com

### Вариант 2: Ручное исправление через Prisma CLI

Если автоматическое исправление не работает, выполните вручную:

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250101000000_add_password_hash
```

**Важно:** Это нужно выполнить на сервере Render.com или с доступом к production базе данных.

### Вариант 3: Ручное исправление через SQL

Если Prisma CLI недоступен, выполните SQL запрос напрямую в базе данных:

```sql
DELETE FROM "_prisma_migrations" WHERE migration_name = '20250101000000_add_password_hash';
```

Или пометьте миграцию как примененную (если изменения уже есть в БД):

```sql
UPDATE "_prisma_migrations" 
SET finished_at = NOW(), 
    applied_steps_count = 1 
WHERE migration_name = '20250101000000_add_password_hash';
```

### Вариант 4: Через Render.com Shell

1. Зайдите в Render.com Dashboard
2. Откройте ваш сервис `studentdeals-api`
3. Перейдите в раздел "Shell" или "Logs"
4. Выполните команду:

```bash
cd apps/api
pnpm prisma migrate resolve --rolled-back 20250101000000_add_password_hash
```

## Проверка

После исправления проверьте, что миграция больше не блокирует деплой:

```bash
cd apps/api
pnpm prisma migrate status
```

Должно показать, что все миграции применены или что проблемных миграций нет.

## Почему это произошло?

Миграция `20250101000000_add_password_hash` была создана для добавления поля `passwordHash` в таблицу `User`, но она упала во время выполнения. При этом поле `passwordHash` уже существует в схеме (в миграции `0_init`), поэтому эта миграция была избыточной.

## Предотвращение в будущем

1. Всегда проверяйте миграции локально перед деплоем
2. Используйте `prisma migrate dev` для разработки
3. Используйте `prisma migrate deploy` только в production
4. Скрипт `fix-migration.sh` теперь автоматически исправляет подобные проблемы

