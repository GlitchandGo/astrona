window.UI = {
  initPopup() {
    const popup = document.getElementById('popup');
    const ok = document.getElementById('popupOk');
    const cancel = document.getElementById('popupCancel');
    const close = document.getElementById('popupClose');
    if (ok) ok.addEventListener('click', () => popup.classList.add('hidden'));
    if (cancel) cancel.addEventListener('click', () => popup.classList.add('hidden'));
    if (close) close.addEventListener('click', () => popup.classList.add('hidden'));
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
    const t = localStorage.getItem('astrona_theme') || 'light';
    document.body.classList.toggle('theme-light', t === 'light');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.src = t === 'light' ?
      'assets/icons/sun.svg' : 'assets/icons/moon.svg';
  }
};

window.UI.applyTheme();
window.addEventListener('astrona-theme-change', () => window.UI.applyTheme());
