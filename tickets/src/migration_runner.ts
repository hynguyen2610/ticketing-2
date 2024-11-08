// migration-runner.ts
import { logger } from '@ndhcode/common';
import Migration from './models/migration/migration';
import { BaseMigration } from './migrations/base_migration';
import CreateMigrationsCollection from './migrations/2024_11_01/create_migrations_collection';
import UpdateImageUrlMigration from './migrations/2024_11_01/update_image_url_migration';

class MigrationRunner {
  private appliedMigrations: Set<string>;

  constructor() {
    this.appliedMigrations = new Set();
  }

  // Method to check if a migration has already been applied
  private async hasMigrationBeenApplied(migrationId: string): Promise<boolean> {
    if (this.appliedMigrations.has(migrationId)) {
      return true;
    }
    const migration = await Migration.findOne({ id: migrationId });
    return migration !== null;
  }

  // Method to mark a migration as applied
  private async markMigrationAsApplied(migrationId: string) {
    this.appliedMigrations.add(migrationId);
    await Migration.create({ id: migrationId });
  }

  // Method to run a specific migration if not already applied
  private async runMigrationIfNotApplied(migration: BaseMigration) {
    const migrationId = migration.id;
    if (!(await this.hasMigrationBeenApplied(migrationId))) {
      console.log(`Running migration: ${migrationId}`);
      await migration.up(); // Apply migration
      await this.markMigrationAsApplied(migrationId); // Mark it as applied
    } else {
      console.log(`Migration ${migrationId} already applied.`);
    }
  }

  // Method to run all migrations in sequence
  public async runAllMigrations() {
    try {
      const migrations = [
        new CreateMigrationsCollection(),
        new UpdateImageUrlMigration(),
        // Add other migrations here
      ];

      // Run all migrations
      for (const migration of migrations) {
        await this.runMigrationIfNotApplied(migration);
      }

      console.log('All migrations applied successfully.');
      logger.info('All migrations applied successfully.');
    } catch (error) {
      console.error('Error applying migrations:', error);
      logger.error('Error applying migrations:', error);
      throw error;  // Re-throw to let the caller handle the error
    }
  }
}

// Exporting the MigrationRunner class
export default MigrationRunner;
