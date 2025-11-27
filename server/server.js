import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://glitchandgo:Ls898dia@astrona.to8htqh.mongodb.net/Astrona";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { generateNumber, db, createUser, findUserByNumber, validateEmail, hashPass, verifyPass } from './storage.js';
import { validateSignup, validateLogin, validateMessage, validateImage } from './validators.js';
import uploadRouter from './routes/uploads.js';
import User from './models/user.js';
import Message from './models/message.js';
import Group from './models/group.js';
import Contact from './models/contact.js';
import Block from './models/block.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Simple auth middleware
function auth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'Unauthorized' });
  const token = hdr.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Multer for image upload (5MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Invalid file type'), ok);
  }
});

// Signup
app.post('/api/signup', (req, res) => {
  const { username, email, password, phone } = req.body || {};
  const v = validateSignup({ username, email, password });
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (!validateEmail(email)) return res.status(400).json({ error: 'Invalid email format' });

  const number = generateNumber();
const passwordHash = await hashPass(password); // bcrypt
const user = await User.create({
  username,
  email,
  phone,
  number,
  passwordHash,
  contacts: [],
  blocked: [],
  avatar: null,
  online: false
});
const token = jwt.sign({ id: user._id, number: user.number }, JWT_SECRET, { expiresIn: '7d' });
res.json({ token, profile: sanitizeUser(user) });

// Login by number + password
app.post('/api/login', (req, res) => {
  const { number, password } = req.body || {};
  const v = validateLogin({ number, password });
  if (!v.ok) return res.status(400).json({ error: v.error });
  const user = findUserByNumber(number);
  if (!user || !verifyPass(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, number: user.number }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, profile: sanitizeUser(user) });
});

// Update profile (username, avatar upload)
app.put('/api/profile', auth, upload.single('avatar'), (req, res) => {
  const user = db.users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { username } = req.body || {};
  if (username && typeof username === 'string' && username.length <= 20) {
    user.username = username;
  }
  if (req.file) {
    const v = validateImage(req.file);
    if (!v.ok) return res.status(400).json({ error: v.error });
    // For MVP: store base64 in-memory (replace with object storage in prod)
    user.avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }
  res.json({ profile: sanitizeUser(user) });
});

// Get my profile
app.get('/api/me', auth, (req, res) => {
  const user = db.users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ profile: sanitizeUser(user) });
});

// Contacts
app.get('/api/contacts', auth, (req, res) => {
  const user = db.users.get(req.user.id);
  const contacts = user.contacts.map(id => sanitizeUser(db.users.get(id)));
  res.json({ contacts });
});

app.post('/api/contacts', auth, (req, res) => {
  const { number } = req.body || {};
  const target = findUserByNumber(number);
  if (!target) return res.status(404).json({ error: "Failed to create contact: Number doesn't exist" });
  const user = db.users.get(req.user.id);
  if (!user.contacts.includes(target.id)) user.contacts.push(target.id);
  res.json({ contact: sanitizeUser(target) });
});

// Search by username (non-unique)
app.get('/api/users/search', auth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ results: [] });

  const results = await User.find({ username: { $regex: q, $options: 'i' } })
    .select('_id username number avatar online')
    .limit(50);

  res.json({
    results: results.map(u => ({
      id: String(u._id),
      username: u.username,
      number: u.number,
      avatar: u.avatar || null,
      online: !!u.online
    }))
  });
});
  
// Blocking
app.post('/api/block', auth, async (req, res) => {
  const { number } = req.body || {};
  if (!number) return res.status(400).json({ error: 'Number required' });

  const target = await User.findOne({ number });
  if (!target) return res.status(404).json({ error: 'User not found' });

  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { blocked: target._id } }
  );

  res.json({ ok: true });
});

// Unblocking
app.post('/api/unblock', auth, async (req, res) => {
  const { number } = req.body || {};
  if (!number) return res.status(400).json({ error: 'Number required' });

  const target = await User.findOne({ number });
  if (!target) return res.status(404).json({ error: 'User not found' });

  await User.updateOne(
    { _id: req.user.id },
    { $pull: { blocked: target._id } }
  );

  res.json({ ok: true });
});

// Messaging
app.get('/api/messages/:peerId', auth, async (req, res) => {
  const peerId = req.params.peerId;
  const threadId = threadKey(req.user.id, peerId);

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 })
    .select('_id senderId recipientId text image status deleted createdAt');

  res.json({ messages });
});

app.post('/api/messages/:peerId', auth, upload.none(), async (req, res) => {
  const peerId = req.params.peerId;
  const { text, image } = req.body || {};
  const v = validateMessage({ text, image });
  if (!v.ok) return res.status(400).json({ error: v.error });

  const sender = await User.findById(req.user.id);
  const recipient = await User.findById(peerId);
  if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

  const senderBlockedRecipient = (sender.blocked || []).some(id => String(id) === String(recipient._id));
  const recipientBlockedSender = (recipient.blocked || []).some(id => String(id) === String(sender._id));
  if (recipientBlockedSender) return res.status(403).json({ error: 'Recipient unavailable' });
  if (senderBlockedRecipient) return res.status(403).json({ error: 'You have blocked this user' });

  const threadId = threadKey(sender._id, recipient._id);
  const msg = await Message.create({
    threadId,
    senderId: sender._id,
    recipientId: recipient._id,
    text: text || null,
    image: image || null,
    status: 'sent',
    createdAt: Date.now()
  });

  notifyUser(String(recipient._id), { type: 'message', payload: msg });

  res.json({ message: msg });
});
  
// Read receipt (mark seen)
app.post('/api/messages/:threadId/seen', auth, async (req, res) => {
  const { messageIds } = req.body || {};
  const threadId = req.params.threadId;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: 'messageIds required' });
  }

  await Message.updateMany(
    { _id: { $in: messageIds }, threadId },
    { $set: { status: 'seen' } }
  );

  const updated = await Message.find({ _id: { $in: messageIds }, threadId })
    .select('_id senderId');

  const senders = [...new Set(updated.map(m => String(m.senderId)))];
  for (const s of senders) {
    notifyUser(s, { type: 'seen', payload: { threadId, messageIds } });
  }

  res.json({ ok: true });
});
  
// Delete message (global tombstone)
app.delete('/api/messages/:threadId/:messageId', auth, async (req, res) => {
  const { threadId, messageId } = req.params;

  const msg = await Message.findOne({ _id: messageId, threadId });
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  msg.deleted = true;
  await msg.save();

  notifyUser(String(msg.recipientId), { type: 'message-deleted', payload: { threadId, messageId } });
  notifyUser(String(msg.senderId), { type: 'message-deleted', payload: { threadId, messageId } });

  res.json({ ok: true });
});

// Minimal group support (text+images, no calls)
app.post('/api/groups', auth, async (req, res) => {
  const { name, memberIds } = req.body || {};

  const group = await Group.create({
    name: name || 'Group',
    ownerId: req.user.id,
    memberIds: [...new Set([req.user.id, ...(memberIds || [])])]
  });

  res.json({ group });
});

app.get('/api/groups', auth, async (req, res) => {
  const groups = await Group.find({ memberIds: req.user.id });
  res.json({ groups });
});

// WebSocket server for presence, signaling, receipts, calls
const server = app.listen(PORT, () => console.log(`Astrona server running on http://localhost:${PORT}`));
const wss = new WebSocketServer({ server });
const socketsByUser = new Map();

function notifyUser(userId, message) {
  const sock = socketsByUser.get(userId);
  if (sock && sock.readyState === 1) {
    sock.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws, req) => {
  // Expect token query ?token=...
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');
  let userId = null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    userId = payload.id;
  } catch {
    ws.close();
    return;
  }
  socketsByUser.set(userId, ws);

  // Mark online
  const user = db.users.get(userId);
  user.online = true;
  broadcastPresence(userId, true);

  ws.on('message', (data) => {
    let msg = {};
    try { msg = JSON.parse(data.toString()); } catch {}
    handleWS(userId, ws, msg);
  });

  ws.on('close', () => {
    socketsByUser.delete(userId);
    const u = db.users.get(userId);
    if (u) {
      u.online = false;
      broadcastPresence(userId, false);
    }
  });
});

function broadcastPresence(userId, online) {
  for (const [uid, sock] of socketsByUser.entries()) {
    if (sock.readyState === 1) {
      sock.send(JSON.stringify({ type: 'presence', payload: { userId, online } }));
    }
  }
}

function handleWS(userId, ws, msg) {
  const { type, payload } = msg;
  switch (type) {
    case 'deliver': {
      // Mark delivered for messages sent to this user
      const { threadId, messageId } = payload;
      const list = db.messages.get(threadId) || [];
      const m = list.find(mm => mm.id === messageId);
      if (m && m.recipientId === userId) {
        m.status = 'delivered';
        notifyUser(m.senderId, { type: 'delivered', payload: { threadId, messageId } });
      }
      break;
    }
    case 'call-offer':
    case 'call-answer':
    case 'call-ice':
    case 'call-end':
    case 'call-hold':
    case 'call-camera':
    case 'call-mute': {
      const { to, data } = payload;
      // Block checks
      const caller = db.users.get(userId);
      const callee = db.users.get(to);
      if (!callee) return;
      if (caller.blocked.includes(callee.id)) return; // caller blocked callee
      if (callee.blocked.includes(caller.id)) {
        notifyUser(userId, { type: 'call-error', payload: { reason: 'Unavailable' } });
        return;
      }
      notifyUser(to, { type, payload: { from: userId, data } });
      break;
    }
    default:
      break;
  }
}

// Helpers
function threadKey(a, b) {
  return [a, b].sort().join(':');
}
function cryptoId() {
  return Math.random().toString(36).slice(2, 10);
}
function sanitizeUser(u) {
  return { id: u.id, username: u.username, number: u.number, avatar: u.avatar || null, online: !!u.online };
    }
