import { PrismaClient } from '@prisma/client';
import { Migration } from '../migration-runner';

const migration: Migration = {
  name: '20251215_002_add_parent_extended_fields',

  up: async (prisma: PrismaClient) => {
    // Add deletedAt column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP
    `);

    // Personal Info fields
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "age" INTEGER
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "gender" "Gender"
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "bloodGroup" "BloodGroup"
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "numberOfChildren" INTEGER
    `);

    // Contact & Address fields
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "address" TEXT
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "city" VARCHAR(255)
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "state" VARCHAR(255)
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "pincode" VARCHAR(20)
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "emergencyContactName" VARCHAR(255)
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "emergencyContactPhone" VARCHAR(50)
    `);

    // Medical & Notes fields
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "registrationDate" TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "registrationTime" VARCHAR(20)
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "lastVisitDate" TIMESTAMP
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "lastVisitTime" VARCHAR(20)
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "medicalHistory" TEXT
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "parents"
      ADD COLUMN IF NOT EXISTS "notes" TEXT
    `);

    console.log('  Added extended fields to parents table');
  },

  down: async (prisma: PrismaClient) => {
    // Remove all added columns
    const columns = [
      'deletedAt', 'age', 'dateOfBirth', 'gender', 'bloodGroup', 'numberOfChildren',
      'address', 'city', 'state', 'pincode', 'emergencyContactName', 'emergencyContactPhone',
      'registrationDate', 'registrationTime', 'lastVisitDate', 'lastVisitTime',
      'medicalHistory', 'notes'
    ];

    for (const column of columns) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "parents"
        DROP COLUMN IF EXISTS "${column}"
      `);
    }

    console.log('  Removed extended fields from parents table');
  },
};

export default migration;
