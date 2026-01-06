import {
  runMigrationUp,
  runMigrationDown,
  getMigrationStatus,
  getPendingMigrations,
  prisma,
} from './migration-runner';
import { migrations } from './scripts';

const command = process.argv[2];

async function main() {
  console.log('\n🚀 Vaxicare Migration Tool\n');

  try {
    switch (command) {
      case 'up':
        // Run all pending migrations
        const pending = await getPendingMigrations(migrations);
        if (pending.length === 0) {
          console.log('✅ All migrations are up to date!');
        } else {
          console.log(`Found ${pending.length} pending migration(s)\n`);
          for (const migration of pending) {
            await runMigrationUp(migration);
          }
        }
        break;

      case 'down':
        // Rollback last migration
        const reversedMigrations = [...migrations].reverse();
        let rolledBack = false;
        for (const migration of reversedMigrations) {
          const result = await runMigrationDown(migration);
          if (result) {
            rolledBack = true;
            break;
          }
        }
        if (!rolledBack) {
          console.log('⚠️  No migrations to rollback');
        }
        break;

      case 'status':
        await getMigrationStatus(migrations);
        break;

      default:
        console.log('Usage: npm run migrate <command>\n');
        console.log('Commands:');
        console.log('  up      Run all pending migrations');
        console.log('  down    Rollback last migration');
        console.log('  status  Show migration status');
        break;
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n');
}

main();
