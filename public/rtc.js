window.RTC = {
  createPeer({ audio = true, video = false } = {}) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
    });
    return pc;
  }
};
