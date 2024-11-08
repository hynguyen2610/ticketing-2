// base-migration.ts
import { Model, Document } from 'mongoose';
import MigrationModel from '../models/migration/migration'; // Your migration model

export abstract class BaseMigration {
  abstract id: string;  // Migration ID

  // Common 'up' method logic
  async up(): Promise<void> {
    const existingMigration = await this.findMigration();

    if (existingMigration) {
      console.log(`Migration with id '${this.id}' already applied.`);
      return;
    }

    await this.applyMigration(); // Specific logic for applying migration
    await this.recordMigration(); // Mark as applied
    console.log(`Migration with id '${this.id}' applied successfully.`);
  }

  // Common 'down' method logic
  async down(): Promise<void> {
    const existingMigration = await this.findMigration();

    if (!existingMigration) {
      console.log(`Migration with id '${this.id}' has not been applied or already undone.`);
      return;
    }

    await this.undoMigration(); // Specific logic for undoing migration
    await this.removeMigration(); // Mark as removed
    console.log(`Migration with id '${this.id}' undone successfully.`);
  }

  // Helper method to find a migration record by its id
  private async findMigration(): Promise<Document | null> {
    return MigrationModel.findOne({ id: this.id });
  }

  // Mark migration as applied (can be overridden in subclass)
  private async recordMigration(): Promise<void> {
    await MigrationModel.create({ id: this.id });
  }

  // Mark migration as removed (can be overridden in subclass)
  private async removeMigration(): Promise<void> {
    await MigrationModel.deleteOne({ id: this.id });
  }

  // Abstract method to apply the migration (specific to each migration)
  protected abstract applyMigration(): Promise<void>;

  // Abstract method to undo the migration (specific to each migration)
  protected abstract undoMigration(): Promise<void>;
}
