-- Migration: Add passwordHash field to User table
-- Run this manually if Prisma migrate dev doesn't work with Render Internal URL

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

