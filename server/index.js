import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import { User, Entry, Mood, Photo, toClient, defaultReminder } from './models.js';

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diarynotes';
const MONGODB_DNS_SERVERS = (process.env.MONGODB_DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

if (!JWT_SECRET) {
  throw new Error('Set JWT_SECRET in the environment before starting the API.');
}

if (MONGODB_DNS_SERVERS.length) {
  try {
    dns.setServers(MONGODB_DNS_SERVERS);
  } catch (error) {
    throw new Error('MONGODB_DNS_SERVERS must be a comma-separated list of valid DNS server addresses.', { cause: error });
  }
}

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  connectDatabase().then(() => next()).catch(next);
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

let photoFiles;
let connectionPromise;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI, { dbName: 'diarynotes' })
      .then(() => {
        photoFiles = new GridFSBucket(mongoose.connection.db, { bucketName: 'photos' });
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        connectionPromise = null;
      });
  }
  await connectionPromise;
}

const route = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function issueToken(user) {
  return jwt.sign({ sub: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

function validDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function cleanUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, createdAt: user.createdAt, avatar: null };
}

function checkMoodPercentages(percentages) {
  if (!percentages || typeof percentages !== 'object' || Array.isArray(percentages)) return false;
  const values = Object.values(percentages);
  return values.length > 0
    && Object.keys(percentages).every((key) => /^[a-z][a-z0-9_-]*$/i.test(key))
    && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 100)
    && values.reduce((sum, value) => sum + value, 0) === 100;
}

async function clearUserData(userId) {
  const photos = await Photo.find({ owner: userId }).select('fileId').lean();
  await Promise.all(photos.map(({ fileId }) => photoFiles.delete(fileId)));
  await Promise.all([
    Entry.deleteMany({ owner: userId }),
    Mood.deleteMany({ owner: userId }),
    Photo.deleteMany({ owner: userId }),
    User.updateOne({ _id: userId }, { $set: { draft: null } }),
  ]);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.name });
});

app.post('/api/auth/signup', route(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < 6 || password.length > 128) return res.status(400).json({ error: 'Password must be between 6 and 128 characters' });

  const existing = await User.findOne({ email }).select('_id');
  if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  return res.status(201).json({ token: issueToken(user), user: cleanUser(user) });
}));

app.post('/api/auth/login', route(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  return res.json({ token: issueToken(user), user: cleanUser(user) });
}));

app.get('/api/auth/me', requireAuth, route(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  return res.json({ user: cleanUser(user) });
}));

app.patch('/api/auth/me', requireAuth, route(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
  const user = await User.findByIdAndUpdate(req.userId, { $set: { name } }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ error: 'Account not found' });
  return res.json({ user: cleanUser(user) });
}));

app.delete('/api/auth/me', requireAuth, route(async (req, res) => {
  await clearUserData(req.userId);
  await User.deleteOne({ _id: req.userId });
  return res.status(204).end();
}));

app.get('/api/bootstrap', requireAuth, route(async (req, res) => {
  const [user, entries, moods, photos] = await Promise.all([
    User.findById(req.userId),
    Entry.find({ owner: req.userId }).sort({ createdAt: -1 }),
    Mood.find({ owner: req.userId }),
    Photo.find({ owner: req.userId }).sort({ createdAt: -1 }),
  ]);
  if (!user) return res.status(401).json({ error: 'Account no longer exists' });
  return res.json({
    user: cleanUser(user),
    entries: entries.map(toClient),
    moods: Object.fromEntries(moods.map((mood) => [mood.dateKey, toClient(mood)])),
    photos: photos.map(toClient),
    reminder: user.settings?.reminder || defaultReminder(),
    draft: user.draft || null,
  });
}));

app.get('/api/entries', requireAuth, route(async (req, res) => {
  const entries = await Entry.find({ owner: req.userId }).sort({ createdAt: -1 });
  return res.json({ entries: entries.map(toClient) });
}));

app.post('/api/entries', requireAuth, route(async (req, res) => {
  const { title, content, dateKey, mood = null, favorite = false, photoIds = [] } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) return res.status(400).json({ error: 'A title of up to 200 characters is required' });
  if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'Entry content is required' });
  if (!validDateKey(dateKey)) return res.status(400).json({ error: 'A valid entry date is required' });
  const entry = await Entry.create({
    owner: req.userId,
    title: title.trim(),
    content: content.trim(),
    dateKey,
    mood: mood || null,
    favorite: Boolean(favorite),
    photoIds: Array.isArray(photoIds) ? photoIds.filter((id) => typeof id === 'string') : [],
    wordCount: content.trim().split(/\s+/).filter(Boolean).length,
  });
  return res.status(201).json({ entry: toClient(entry) });
}));

app.patch('/api/entries/:id', requireAuth, route(async (req, res) => {
  const updates = {};
  if (req.body.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim() || req.body.title.trim().length > 200) return res.status(400).json({ error: 'A title of up to 200 characters is required' });
    updates.title = req.body.title.trim();
  }
  if (req.body.content !== undefined) {
    if (typeof req.body.content !== 'string' || !req.body.content.trim()) return res.status(400).json({ error: 'Entry content is required' });
    updates.content = req.body.content.trim();
    updates.wordCount = updates.content.split(/\s+/).filter(Boolean).length;
  }
  if (req.body.dateKey !== undefined) {
    if (!validDateKey(req.body.dateKey)) return res.status(400).json({ error: 'A valid entry date is required' });
    updates.dateKey = req.body.dateKey;
  }
  if (req.body.mood !== undefined) updates.mood = req.body.mood || null;
  if (req.body.favorite !== undefined) updates.favorite = Boolean(req.body.favorite);
  if (req.body.photoIds !== undefined && Array.isArray(req.body.photoIds)) updates.photoIds = req.body.photoIds;
  const entry = await Entry.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  return res.json({ entry: toClient(entry) });
}));

app.delete('/api/entries/:id', requireAuth, route(async (req, res) => {
  const entry = await Entry.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  await Photo.updateMany({ owner: req.userId, linkedEntryId: req.params.id }, { $set: { linkedEntryId: null } });
  return res.status(204).end();
}));

app.get('/api/moods', requireAuth, route(async (req, res) => {
  const moods = await Mood.find({ owner: req.userId });
  return res.json({ moods: Object.fromEntries(moods.map((mood) => [mood.dateKey, toClient(mood)])) });
}));

app.put('/api/moods/:dateKey', requireAuth, route(async (req, res) => {
  if (!validDateKey(req.params.dateKey) || !checkMoodPercentages(req.body.percentages)) {
    return res.status(400).json({ error: 'Mood percentages must be between 0 and 100 and total exactly 100' });
  }
  const mood = await Mood.findOneAndUpdate(
    { owner: req.userId, dateKey: req.params.dateKey },
    { $set: { percentages: req.body.percentages } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return res.json({ mood: toClient(mood) });
}));

app.delete('/api/moods/:dateKey', requireAuth, route(async (req, res) => {
  await Mood.deleteOne({ owner: req.userId, dateKey: req.params.dateKey });
  return res.status(204).end();
}));

app.get('/api/photos', requireAuth, route(async (req, res) => {
  const photos = await Photo.find({ owner: req.userId }).sort({ createdAt: -1 });
  return res.json({ photos: photos.map(toClient) });
}));

app.post('/api/photos', requireAuth, upload.single('photo'), route(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Select a photo to upload' });
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) return res.status(400).json({ error: 'Only JPG, PNG, and WebP images are supported' });
  if (!validDateKey(req.body.dateKey)) return res.status(400).json({ error: 'A valid photo date is required' });
  const linkedEntryId = req.body.linkedEntryId || null;
  if (linkedEntryId && !(await Entry.exists({ _id: linkedEntryId, owner: req.userId }))) {
    return res.status(400).json({ error: 'The linked entry does not exist' });
  }

  const storedFile = await new Promise((resolve, reject) => {
    const stream = photoFiles.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { ownerId: req.userId },
    });
    stream.once('error', reject);
    stream.once('finish', () => resolve(stream));
    stream.end(file.buffer);
  });
  let photo;
  try {
    photo = await Photo.create({
      owner: req.userId,
      fileId: storedFile.id,
      name: String(req.body.name || file.originalname).trim().slice(0, 200),
      caption: String(req.body.caption || '').slice(0, 2000),
      dateKey: req.body.dateKey,
      linkedEntryId,
      fileType: file.mimetype,
      fileSize: file.size,
    });
  } catch (error) {
    await photoFiles.delete(storedFile.id);
    throw error;
  }
  return res.status(201).json({ photo: toClient(photo) });
}));

app.get('/api/photos/:id/file', requireAuth, route(async (req, res) => {
  const photo = await Photo.findOne({ _id: req.params.id, owner: req.userId });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  res.set('Content-Type', photo.fileType);
  res.set('Content-Length', String(photo.fileSize));
  res.set('Cache-Control', 'private, no-store');
  const stream = photoFiles.openDownloadStream(photo.fileId);
  stream.on('error', (error) => {
    if (!res.headersSent) res.status(404).json({ error: 'Photo file not found' });
    else res.destroy(error);
  });
  stream.pipe(res);
}));

app.patch('/api/photos/:id', requireAuth, route(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name).trim().slice(0, 200);
  if (req.body.caption !== undefined) updates.caption = String(req.body.caption).slice(0, 2000);
  if (req.body.dateKey !== undefined) {
    if (!validDateKey(req.body.dateKey)) return res.status(400).json({ error: 'A valid photo date is required' });
    updates.dateKey = req.body.dateKey;
  }
  if (req.body.linkedEntryId !== undefined) {
    const linkedEntryId = req.body.linkedEntryId || null;
    if (linkedEntryId && !(await Entry.exists({ _id: linkedEntryId, owner: req.userId }))) {
      return res.status(400).json({ error: 'The linked entry does not exist' });
    }
    updates.linkedEntryId = linkedEntryId;
  }
  const photo = await Photo.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  return res.json({ photo: toClient(photo) });
}));

app.delete('/api/photos/:id', requireAuth, route(async (req, res) => {
  const photo = await Photo.findOne({ _id: req.params.id, owner: req.userId });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  await photoFiles.delete(photo.fileId);
  await photo.deleteOne();
  return res.status(204).end();
}));

app.delete('/api/photos', requireAuth, route(async (req, res) => {
  const photos = await Photo.find({ owner: req.userId }).select('fileId').lean();
  await Promise.all(photos.map(({ fileId }) => photoFiles.delete(fileId)));
  await Photo.deleteMany({ owner: req.userId });
  return res.status(204).end();
}));

app.put('/api/settings/reminder', requireAuth, route(async (req, res) => {
  const { enabled, time, frequency } = req.body;
  if (typeof enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')
    || !['daily', 'weekdays', 'weekends'].includes(frequency)) {
    return res.status(400).json({ error: 'Reminder settings are invalid' });
  }
  const reminder = { enabled, time, frequency };
  await User.updateOne({ _id: req.userId }, { $set: { 'settings.reminder': reminder } });
  return res.json({ reminder });
}));

app.get('/api/draft', requireAuth, route(async (req, res) => {
  const user = await User.findById(req.userId).select('draft');
  if (!user) return res.status(404).json({ error: 'Account not found' });
  return res.json({ draft: user.draft || null });
}));

app.put('/api/draft', requireAuth, route(async (req, res) => {
  const draft = { ...req.body, savedAt: new Date().toISOString() };
  await User.updateOne({ _id: req.userId }, { $set: { draft } });
  return res.json({ draft });
}));

app.delete('/api/draft', requireAuth, route(async (req, res) => {
  await User.updateOne({ _id: req.userId }, { $set: { draft: null } });
  return res.status(204).end();
}));

app.delete('/api/data', requireAuth, route(async (req, res) => {
  await clearUserData(req.userId);
  return res.status(204).end();
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = status === 413 ? 'Photo must be under 4MB' : error.message;
    return res.status(status).json({ error: message });
  }
  if (error.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
  if (error.name === 'ValidationError' || error.name === 'CastError' || error instanceof SyntaxError) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'An unexpected server error occurred' });
});

if (process.env.VERCEL !== '1') {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Could not connect to MongoDB. Check MONGODB_URI, DNS resolution, Atlas Network Access, and database credentials.');
    throw error;
  }
  app.listen(PORT, () => {
    console.log(`Moodora API listening on http://localhost:${PORT} (database: diarynotes)`);
  });
}

export default app;
