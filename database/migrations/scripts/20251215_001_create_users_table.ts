import { PrismaClient } from '@prisma/client';
import { Migration } from '../migration-runner';

const migration: Migration = {
  name: '20251215_001_create_users_table',

  up: async (prisma: PrismaClient) => {
    // Create UserRole enum type if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fullName" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(50),
        "profilePhoto" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
        "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
        "isDeleted" BOOLEAN NOT NULL DEFAULT false,
        "deletedAt" TIMESTAMP,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_isDeleted_idx" ON "users"("isDeleted")
    `);

    console.log('  Created users table with indexes');
  },

  down: async (prisma: PrismaClient) => {
    // Drop indexes
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "users_email_idx"`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "users_role_idx"`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "users_status_idx"`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "users_isDeleted_idx"`);

    // Drop users table
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "users"`);

    // Note: We don't drop the UserRole enum as it might be used elsewhere

    console.log('  Dropped users table and indexes');
  },
};

export default migration;
