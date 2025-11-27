window.UI = {
  initPopup() {
    const popup = document.getElementById('popup');
    const ok = document.getElementById('popupOk');
    const cancel = document.getElementById('popupCancel');
    const close = document.getElementById('popupClose');
    if (ok) ok.addEventListener('click', () => popup.classList.add('hidden'));
    if (cancel) cancel.addEventListener('click', () => popup.classList.add('hidden'));
    if (close) close.addEventListener('click', () => popup.classList.add('hidden'));
    // Make sure popup buttons have modern style
    [ok, cancel, close].forEach(btn => {
      if (btn) btn.style.borderRadius = '8px';
      if (btn) btn.style.padding = '12px 22px';
      if (btn && btn.classList.contains('primary')) {
        btn.style.background = 'var(--accent)';
        btn.style.color = '#fff';
        btn.style.border = 'none';
      } else if (btn && btn.classList.contains('danger')) {
        btn.style.background = 'var(--danger)';
        btn.style.color = '#fff';
        btn.style.border = 'none';
      } else if (btn && btn.classList.contains('ghost')) {
        btn.style.background = 'var(--card)';
        btn.style.color = 'var(--fg)';
        btn.style.border = '1px solid var(--border)';
      }
    });
  },
  popup(text, onClose) {
    const popup = document.getElementById('popup');
    const area = document.getElementById('popupText');
    const ok = document.getElementById('popupOk') || document.getElementById('popupClose');
    popup.classList.remove('hidden');
    area.textContent = text;
    ok.onclick = () => { popup.classList.add('hidden'); onClose && onClose(); };
  },
  prompt(label, onOk) {
    const popup = document.getElementById('popup');
    const area = document.getElementById('popupText');
    const ok = document.getElementById('popupOk');
    const cancel = document.getElementById('popupCancel');
    popup.classList.remove('hidden');
    area.innerHTML = `<div class="row"><label>${label}</label><input id="promptInput" type="text"></div>`;
    ok.onclick = () => { popup.classList.add('hidden'); const v = document.getElementById('promptInput').value.trim(); onOk && onOk(v); };
    cancel.onclick = () => popup.classList.add('hidden');
  },
  toggleTheme() {
    const b = document.body;
    const modeNow = b.classList.toggle('theme-light');
    localStorage.setItem('astrona_theme', b.classList.contains('theme-light') ? 'light' : 'dark');
    // update theme icon if present
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.src = b.classList.contains('theme-light') ?
      'assets/icons/sun.svg' : 'assets/icons/moon.svg';
    window.dispatchEvent(new Event('astrona-theme-change'));
  },
  applyTheme() {
    // Mixed palette: white, black, blue (blue as accent/main)
    const t = localStorage.getItem('astrona_theme') || 'light';
    document.body.classList.toggle('theme-light', t === 'light');
    // Update brand/nav colors
    const accent = t === 'light' ? '#1c2d45' : '#5a7cfa';
    const cardBg = t === 'light' ? '#fff' : '#171a21';
    const fg = t === 'light' ? '#111' : '#e6e6e6';
    const primaryBtn = t === 'light' ? '#3056ff' : '#5a7cfa';
    // Make nav-bar background, cards, buttons colorful
    // Update nav-bar
    document.querySelectorAll('.nav-bar, .card, .popup-card, .composer, .contacts, .call-card').forEach(
      el => el && (el.style.background = cardBg)
    );
    document.querySelectorAll('button.primary').forEach(
      btn => btn && (btn.style.background = primaryBtn)
    );
    document.querySelectorAll('button.danger').forEach(
      btn => btn && (btn.style.background = '#e11d48')
    );
    document.querySelectorAll('button.ghost').forEach(
      btn => btn && (btn.style.background = cardBg)
    );
    document.querySelectorAll('button').forEach(
      btn => btn && (btn.style.color = fg)
    );
    // Theme icon update
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.src = t === 'light' ?
      'assets/icons/sun.svg' : 'assets/icons/moon.svg';
  }
};

window.UI.applyTheme();
window.addEventListener('astrona-theme-change', () => window.UI.applyTheme());
