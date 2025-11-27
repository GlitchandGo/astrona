// Helper: convert base64 VAPID key to Uint8Array (required by pushManager.subscribe)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe the current browser to push notifications (if supported & permitted)
async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    // Wait for service worker to be ready
    const reg = await navigator.serviceWorker.ready;

    // Ask for Notification permission if not already granted
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    // Get VAPID public key from backend (endpoint should return { publicKey: '...' })
    const res = await fetch('/api/push-public-key');
    if (!res.ok) return;
    const { publicKey } = await res.json();
    if (!publicKey) return;

    // Subscribe to push
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Send subscription to backend to save for the current user
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP.token()}`
      },
      body: JSON.stringify({ subscription: sub })
    });
  } catch (err) {
    // Fail silently - don't block user flow if push subscription fails
    console.warn('Push subscription failed', err);
  }
}

window.APP = {
  storeAuth(data) {
    localStorage.setItem('astrona_token', data.token);
    localStorage.setItem('astrona_profile', JSON.stringify(data.profile));
    // Attempt to subscribe to push notifications (non-blocking)
    subscribeToPush().catch(()=>{});
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
