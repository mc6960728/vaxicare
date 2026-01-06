import { Migration } from '../migration-runner';

// Import all migrations here (in order)
import migration_20251204_001 from './20251204_001_add_parent_acknowledgment_to_appointments';
import migration_20251215_001 from './20251215_001_create_users_table';
import migration_20251215_002 from './20251215_002_add_parent_extended_fields';

// Export all migrations in order (oldest first)
export const migrations: Migration[] = [
  migration_20251204_001,
  migration_20251215_001,
  migration_20251215_002,
  // Add new migrations here...
];
