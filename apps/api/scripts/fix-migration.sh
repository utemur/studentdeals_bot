#!/bin/bash
# Script to fix failed migration in production

set -e

echo "Attempting to resolve failed migration..."

# Try to resolve the failed migration
npx prisma migrate resolve --rolled-back 20250101000000_add_password_hash 2>&1 || {
  echo "Migration resolve failed, trying SQL approach..."
  
  # Alternative: use SQL to delete the failed migration record
  # This requires DATABASE_URL to be set
  if [ -n "$DATABASE_URL" ]; then
    echo "Deleting failed migration record from database..."
    npx prisma db execute --stdin <<EOF || true
DELETE FROM "_prisma_migrations" WHERE migration_name = '20250101000000_add_password_hash';
EOF
  fi
}

echo "Migration fix attempt completed."

