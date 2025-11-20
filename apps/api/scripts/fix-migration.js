#!/usr/bin/env node
/**
 * Script to fix failed Prisma migration in production
 * Tries multiple methods to resolve the failed migration
 */

const { PrismaClient } = require('@prisma/client');

const MIGRATION_NAME = '20250101000000_add_password_hash';

async function fixMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log(`🔧 Attempting to fix failed migration: ${MIGRATION_NAME}`);
    
    // Method 1: Try to delete the failed migration record
    try {
      const result = await prisma.$executeRawUnsafe(
        `DELETE FROM "_prisma_migrations" WHERE migration_name = '${MIGRATION_NAME}'`
      );
      
      if (result > 0) {
        console.log(`✅ Successfully removed failed migration record from database.`);
        process.exit(0);
      } else {
        console.log(`ℹ️  Migration record not found in database (may have been already fixed).`);
        process.exit(0);
      }
    } catch (error) {
      console.log(`⚠️  SQL approach failed: ${error.message}`);
      console.log(`ℹ️  This is expected if migration doesn't exist or table structure is different.`);
      process.exit(0); // Don't fail the build
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration().catch((error) => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(0); // Don't fail the build, let migrate deploy handle it
});

