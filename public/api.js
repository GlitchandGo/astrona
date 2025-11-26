const BASE = '';

async function req(method, url, body, isForm) {
  const headers = { };
  if (!isForm) headers['Content-Type'] = 'application/json';
  const token = APP.token();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(url, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });
  const json = await r.json().catch(()=>({}));
  if (!r.ok) return { error: json.error || 'Request failed' };
  return { data: json, ...json };
}

window.API = {
  signup(payload) { return req('POST', '/api/signup', payload); },
  login(payload) { return req('POST', '/api/login', payload); },
  me() { return req('GET', '/api/me'); },
  updateProfile(fd) { return req('PUT', '/api/profile', fd, true); },
  getContacts() { return req('GET', '/api/contacts'); },
  addContact(number) { return req('POST', '/api/contacts', { number }); },
  searchUsers(q) { return req('GET', `/api/users/search?q=${encodeURIComponent(q)}`); },
  block(number) { return req('POST', '/api/block', { number }); },
  unblock(number) { return req('POST', '/api/unblock', { number }); },
  getMessages(peerId) { return req('GET', `/api/messages/${peerId}`); },
  sendMessage(peerId, payload) { return req('POST', `/api/messages/${peerId}`, payload); },
  markSeen(threadId, ids) { return req('POST', `/api/messages/${threadId}/seen`, { messageIds: ids }); },
  deleteMessage(threadId, messageId) { return req('DELETE', `/api/messages/${threadId}/${messageId}`); }
};
