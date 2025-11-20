-- Fix failed migration: mark it as rolled back or remove it
-- This script should be run manually in the database if needed

-- Option 1: Remove the failed migration record (if _prisma_migrations table exists)
-- DELETE FROM "_prisma_migrations" WHERE migration_name = '20250101000000_add_password_hash';

-- Option 2: If the migration was partially applied, you might need to:
-- 1. Check if passwordHash column exists: SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'passwordHash';
-- 2. If it doesn't exist, the migration can be safely removed from _prisma_migrations table
-- 3. If it exists, you need to drop it first: ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";

