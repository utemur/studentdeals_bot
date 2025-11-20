#!/bin/bash
# Script to fix failed migration in production

MIGRATION_NAME="20250101000000_add_password_hash"

echo "🔧 Attempting to resolve failed migration: $MIGRATION_NAME"

# Method 1: Try to resolve using Prisma CLI
if pnpm prisma migrate resolve --rolled-back "$MIGRATION_NAME" 2>&1; then
  echo "✅ Migration successfully marked as rolled back using Prisma CLI."
  exit 0
fi

echo "⚠️  Prisma migrate resolve failed, trying direct SQL approach..."

# Method 2: Try to delete the failed migration record directly using psql
if command -v psql >/dev/null 2>&1 && [ -n "$DATABASE_URL" ]; then
  echo "Using psql to remove failed migration record..."
  if psql "$DATABASE_URL" -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '$MIGRATION_NAME';" 2>&1; then
    echo "✅ Failed migration record removed from database."
    exit 0
  fi
fi

# Method 3: Try using node with Prisma client (if psql not available)
if [ -n "$DATABASE_URL" ]; then
  echo "Trying to remove migration record using Node.js..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const migrationName = '$MIGRATION_NAME';
    prisma.\$executeRawUnsafe(\`DELETE FROM \"_prisma_migrations\" WHERE migration_name = '\${migrationName}'\`)
      .then(() => {
        console.log('✅ Migration record removed.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Failed:', err.message);
        process.exit(1);
      })
      .finally(() => prisma.\$disconnect());
  " 2>&1 && exit 0
fi

echo "⚠️  All automatic fix methods failed."
echo "ℹ️  You may need to manually fix the migration in the database."
echo "ℹ️  Run this SQL: DELETE FROM \"_prisma_migrations\" WHERE migration_name = '$MIGRATION_NAME';"
echo "ℹ️  Or mark it as rolled back: pnpm prisma migrate resolve --rolled-back $MIGRATION_NAME"
exit 0

