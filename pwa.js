(() => {
  const status = document.querySelector('#offline-status');
  const install = document.querySelector('#install-app');
  const help = document.querySelector('#install-help');
  const standalone = matchMedia('(display-mode: standalone)');
  let prompt = null;
  let ready = false;
  function updateStatus() {
    status.textContent = ready
      ? (navigator.onLine ? 'Ready offline. Your tracker goes where you go.' : 'You’re offline. Your entries still save on this device.')
      : (navigator.onLine ? 'Preparing offline access…' : 'Go online once to prepare offline access.');
  }
  function updateInstalled() { install.hidden = standalone.matches; }
  updateInstalled();
  standalone.addEventListener('change', updateInstalled);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    prompt = event;
    install.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    prompt = null;
    install.hidden = true;
    help.hidden = true;
  });
  install.addEventListener('click', async () => {
    if (!prompt) { help.hidden = !help.hidden; return; }
    const pending = prompt;
    prompt = null;
    try {
      await pending.prompt();
      const result = await pending.userChoice;
      help.hidden = result.outcome === 'accepted';
    } catch { help.hidden = false; }
  });
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status.textContent = 'For offline access, open this site in Chrome over HTTPS.';
    return;
  }
  updateStatus();
  navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'})
    .then(() => navigator.serviceWorker.ready)
    .then(() => { ready = true; updateStatus(); })
    .catch(() => { status.textContent = 'Offline setup didn’t finish. Reconnect and refresh to try again.'; });
})();
