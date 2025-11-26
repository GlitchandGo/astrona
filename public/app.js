window.APP = {
  storeAuth(data) {
    localStorage.setItem('astrona_token', data.token);
    localStorage.setItem('astrona_profile', JSON.stringify(data.profile));
  },
  token() { return localStorage.getItem('astrona_token') || ''; },
  me() { try { return JSON.parse(localStorage.getItem('astrona_profile') || '{}'); } catch { return {}; } },
  ensureAuth() {
    if (!this.token()) location.href = 'index.html';
  },
  updateProfile(profile) {
    localStorage.setItem('astrona_profile', JSON.stringify(profile));
  }
};
