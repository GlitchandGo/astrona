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
    b.classList.toggle('theme-light');
    // Persist
    localStorage.setItem('astrona_theme', b.classList.contains('theme-light') ? 'light' : 'dark');
  },
  applyTheme() {
    const t = localStorage.getItem('astrona_theme') || 'light';
    document.body.classList.toggle('theme-light', t === 'light');
  }
};
UI.applyTheme();
