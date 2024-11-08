import { Schema, model, Document } from 'mongoose';

interface IMigration extends Document {
  id: string;
  applied_at: Date;
}

const migrationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  applied_at: { type: Date, default: Date.now },
});

const Migration = model<IMigration>('Migration', migrationSchema);

export default Migration;