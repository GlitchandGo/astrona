window.WS = (() => {
  let sock = null;
  let handlers = [];
  function connect(onOpen, onMessage) {
    if (sock && sock.readyState === 1) return;
    const token = APP.token();
    const base = location.origin.replace(/^http/, 'ws');
    sock = new WebSocket(`${base}/?token=${token}`);
    sock.onopen = () => { onOpen && onOpen(); };
    sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      onMessage && onMessage(msg);
      for (const h of handlers) h(msg);
    };
    sock.onclose = () => {};
  }
  function send(type, payload) {
    if (sock && sock.readyState === 1) {
      sock.send(JSON.stringify({ type, payload }));
    }
  }
  function delivered(threadId, messageId) {
    send('deliver', { threadId, messageId });
  }
  function on(handler) { handlers.push(handler); }
  return { connect, send, delivered, on };
})();
