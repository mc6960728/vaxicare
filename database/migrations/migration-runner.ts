import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Migration {
  name: string;
  up: (prisma: PrismaClient) => Promise<void>;
  down: (prisma: PrismaClient) => Promise<void>;
}

// Migration tracking table
async function ensureMigrationTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      "id" SERIAL PRIMARY KEY,
      "name" VARCHAR(255) NOT NULL UNIQUE,
      "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Check if migration was already run
async function isMigrationExecuted(name: string): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "_migrations" WHERE "name" = $1`,
    name
  );
  return Number(result[0].count) > 0;
}

// Mark migration as executed
async function markMigrationExecuted(name: string) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_migrations" ("name") VALUES ($1)`,
    name
  );
}

// Remove migration from executed list
async function removeMigrationRecord(name: string) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "_migrations" WHERE "name" = $1`,
    name
  );
}

// Run a single migration UP
export async function runMigrationUp(migration: Migration) {
  await ensureMigrationTable();

  const alreadyExecuted = await isMigrationExecuted(migration.name);
  if (alreadyExecuted) {
    console.log(`⏭️  Skipping ${migration.name} (already executed)`);
    return false;
  }

  console.log(`⬆️  Running migration: ${migration.name}`);
  try {
    await migration.up(prisma);
    await markMigrationExecuted(migration.name);
    console.log(`✅ Migration ${migration.name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${migration.name} failed:`, error);
    throw error;
  }
}

// Run a single migration DOWN
export async function runMigrationDown(migration: Migration) {
  await ensureMigrationTable();

  const wasExecuted = await isMigrationExecuted(migration.name);
  if (!wasExecuted) {
    console.log(`⏭️  Skipping rollback of ${migration.name} (not executed)`);
    return false;
  }

  console.log(`⬇️  Rolling back migration: ${migration.name}`);
  try {
    await migration.down(prisma);
    await removeMigrationRecord(migration.name);
    console.log(`✅ Rollback of ${migration.name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Rollback of ${migration.name} failed:`, error);
    throw error;
  }
}

// Get all pending migrations
export async function getPendingMigrations(migrations: Migration[]): Promise<Migration[]> {
  await ensureMigrationTable();
  const pending: Migration[] = [];

  for (const migration of migrations) {
    const executed = await isMigrationExecuted(migration.name);
    if (!executed) {
      pending.push(migration);
    }
  }

  return pending;
}

// Get migration status
export async function getMigrationStatus(migrations: Migration[]) {
  await ensureMigrationTable();

  console.log('\n📋 Migration Status:\n');
  console.log('─'.repeat(60));

  for (const migration of migrations) {
    const executed = await isMigrationExecuted(migration.name);
    const status = executed ? '✅ Executed' : '⏳ Pending';
    console.log(`${status}  ${migration.name}`);
  }

  console.log('─'.repeat(60));
}

export { prisma };
