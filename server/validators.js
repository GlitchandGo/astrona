export function validateSignup({ username, email, password }) {
  if (!username || typeof username !== 'string' || username.length < 1 || username.length > 20) {
    return { ok: false, error: 'Username must be 1–20 chars' };
  }
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email required' };
  }
  if (!password || typeof password !== 'string' || password.length < 4 || password.length > 20) {
    return { ok: false, error: 'Password must be 4–20 chars' };
  }
  return { ok: true };
}

export function validateLogin({ number, password }) {
  if (!number || !/^\d{4}-\d{4}$/.test(number)) return { ok: false, error: 'Invalid number format' };
  if (!password || password.length < 4 || password.length > 20) return { ok: false, error: 'Invalid password' };
  return { ok: true };
}

export function validateMessage({ text, image }) {
  if (!text && !image) return { ok: false, error: 'Message must have text or image' };
  if (text && typeof text === 'string' && text.length > 1000) return { ok: false, error: 'Max length 1000 chars' };
  if (image && typeof image !== 'string') return { ok: false, error: 'Invalid image payload' };
  return { ok: true };
}

export function validateImage(file) {
  const types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!types.includes(file.mimetype)) return { ok: false, error: 'Invalid file type' };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Max 5MB' };
  return { ok: true };
}
