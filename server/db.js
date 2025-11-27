import crypto from 'crypto';
import User from './models/User.js';
import Message from './models/Message.js';
import Contact from './models/Contact.js';
import Block from './models/Block.js';

export function cryptoId() {
  return Math.random().toString(36).slice(2, 10);
}
export function threadKey(a, b) {
  return [a, b].sort().join(':');
}

async function generateUniqueNumber() {
  while (true) {
    const raw = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const n = `${raw.slice(0,4)}-${raw.slice(4)}`;
    const exists = await User.exists({ number: n });
    if (!exists) return n;
  }
}

export async function createUser({ username, email, phone, passwordHash }) {
  const id = crypto.randomUUID();
  const number = await generateUniqueNumber();
  return await User.create({ _id: id, username, email, phone, number, passwordHash });
}
export async function findUserByNumber(number) {
  return await User.findOne({ number }).lean();
}
export async function findUserById(id) {
  return await User.findById(id).lean();
}
export async function updateProfile(id, { username, avatarUrl }) {
  await User.updateOne({ _id: id }, { $set: { ...(username && { username }), ...(avatarUrl && { avatarUrl }) } });
  return await findUserById(id);
}

export async function getContacts(userId) {
  const contacts = await Contact.find({ userId }).lean();
  const ids = contacts.map(c => c.contactId);
  return await User.find({ _id: { $in: ids } }, { username: 1, number: 1, avatarUrl: 1 }).lean();
}
export async function addContact(userId, targetNumber) {
  const target = await findUserByNumber(targetNumber);
  if (!target) return null;
  await Contact.updateOne(
    { userId, contactId: target._id },
    { $setOnInsert: { userId, contactId: target._id } },
    { upsert: true }
  );
  return target;
}
export async function searchUsers(q) {
  return await User.find(
    { username: { $regex: q, $options: 'i' } },
    { username: 1, number: 1, avatarUrl: 1 }
  ).limit(50).lean();
}

export async function block(userId, targetNumber) {
  const target = await findUserByNumber(targetNumber);
  if (!target) return null;
  await Block.updateOne(
    { userId, blockedId: target._id },
    { $setOnInsert: { userId, blockedId: target._id } },
    { upsert: true }
  );
  return target;
}
export async function unblock(userId, targetNumber) {
  const target = await findUserByNumber(targetNumber);
  if (!target) return null;
  await Block.deleteOne({ userId, blockedId: target._id });
  return target;
}
export async function isBlocked(senderId, recipientId) {
  const blocked = await Block.exists({ userId: recipientId, blockedId: senderId });
  return !!blocked;
}

export async function getMessages(threadId) {
  return await Message.find({ threadId }).sort({ createdAt: 1 }).lean();
}
export async function sendMessage({ senderId, recipientId, text, imageUrl }) {
  const threadId = threadKey(senderId, recipientId);
  const id = cryptoId();
  const createdAt = Date.now();
  const msg = await Message.create({
    id, threadId, senderId, recipientId,
    text: text || null,
    imageUrl: imageUrl || null,
    status: 'sent',
    createdAt
  });
  return msg.toObject();
}
export async function markDelivered(threadId, messageId) {
  await Message.updateOne({ threadId, id: messageId }, { $set: { status: 'delivered' } });
}
export async function markSeen(threadId, ids) {
  await Message.updateMany({ threadId, id: { $in: ids } }, { $set: { status: 'seen' } });
}
export async function deleteMessage(threadId, messageId) {
  await Message.updateOne({ threadId, id: messageId }, { $set: { deleted: true } });
}
