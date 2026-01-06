import { PrismaClient } from '@prisma/client';
import { Migration } from '../migration-runner';

const migration: Migration = {
  name: '20251204_001_add_parent_acknowledgment_to_appointments',

  up: async (prisma: PrismaClient) => {
    // Add isParentAcknowledged column with default false
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "appointments"
      ADD COLUMN IF NOT EXISTS "isParentAcknowledged" BOOLEAN NOT NULL DEFAULT false
    `);

    // Add parentAcknowledgedAt column (nullable)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "appointments"
      ADD COLUMN IF NOT EXISTS "parentAcknowledgedAt" TIMESTAMP
    `);

    console.log('  Added isParentAcknowledged and parentAcknowledgedAt columns to appointments table');
  },

  down: async (prisma: PrismaClient) => {
    // Remove parentAcknowledgedAt column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "appointments"
      DROP COLUMN IF EXISTS "parentAcknowledgedAt"
    `);

    // Remove isParentAcknowledged column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "appointments"
      DROP COLUMN IF EXISTS "isParentAcknowledged"
    `);

    console.log('  Removed isParentAcknowledged and parentAcknowledgedAt columns from appointments table');
  },
};

export default migration;
