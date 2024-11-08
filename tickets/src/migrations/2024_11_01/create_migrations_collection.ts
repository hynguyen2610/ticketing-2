// create-migrations-collection.ts
import { BaseMigration } from '../base_migration'; // Import BaseMigration
import Migration from '../../models/migration/migration'; // Import your migration model

export default class CreateMigrationsCollection extends BaseMigration {
  id: string = 'create_migrations_collection'; // Unique migration ID

  // Apply specific logic for this migration
  public async applyMigration(): Promise<void> {
    await Migration.create({ id: this.id });
  }

  // Undo specific logic for this migration
  public async undoMigration(): Promise<void> {
    // If this migration needs to be undone, remove the record
    await Migration.deleteOne({ id: this.id });
  }
}