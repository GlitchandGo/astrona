import crypto from 'crypto';

export const db = {
  users: new Map(),          // id -> user
  numbers: new Set(),        // unique numbers
  messages: new Map(),       // threadId -> [messages]
  groups: new Map()          // id -> group
};

export function generateNumber() {
  let n;
  do {
    const raw = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    n = `${raw.slice(0,4)}-${raw.slice(4)}`;
  } while (db.numbers.has(n));
  db.numbers.add(n);
  return n;
}

export function createUser({ username, email, phone, number, passwordHash }) {
  const id = crypto.randomUUID();
  const user = {
    id, username, email, phone: phone || null, number,
    passwordHash,
    avatar: null,
    contacts: [],
    blocked: [],
    online: false
  };
  db.users.set(id, user);
  return user;
}

export function findUserByNumber(number) {
  for (const u of db.users.values()) {
    if (u.number === number) return u;
  }
  return null;
}

export function validateEmail(email) {
  // Allow subdomains; simple pattern domain@domain.tld with more tld chars
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function hashPass(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}
export function verifyPass(pass, hash) {
  return hashPass(pass) === hash;
}
