import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  settings: {
    theme: { type: String, default: 'light' },
    reminder: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: '20:00' },
      frequency: { type: String, default: 'daily' },
    },
  },
  draft: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

const entrySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  mood: { type: String, default: null },
  photoIds: { type: [String], default: [] },
  favorite: { type: Boolean, default: false },
  wordCount: { type: Number, default: 0 },
}, { timestamps: true });

entrySchema.index({ owner: 1, dateKey: -1, createdAt: -1 });

const moodSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  percentages: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

moodSchema.index({ owner: 1, dateKey: 1 }, { unique: true });

const photoSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true, maxlength: 200 },
  caption: { type: String, default: '', maxlength: 2000 },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  linkedEntryId: { type: String, default: null },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
}, { timestamps: true });

photoSchema.index({ owner: 1, createdAt: -1 });

export const User = mongoose.model('User', userSchema);
export const Entry = mongoose.model('Entry', entrySchema);
export const Mood = mongoose.model('Mood', moodSchema);
export const Photo = mongoose.model('Photo', photoSchema);

export function toClient(document) {
  const value = document.toObject ? document.toObject({ versionKey: false }) : document;
  const { _id, owner, fileId, ...rest } = value;
  return { ...rest, id: String(_id) };
}

export function defaultReminder() {
  return { enabled: false, time: '20:00', frequency: 'daily' };
}
