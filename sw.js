const CACHE = 'mgit-desk-offline-v5';
const SHELL = ['./', './index.html', './style.css', './syllabus.js', './notes.js', './branches.js', './branch-notes.js', './app.js'].map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install', event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mgit-desk-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!SHELL.includes(event.request.url))return;
  event.respondWith(fetch(event.request).then(response=>response.ok ? response : caches.match(event.request).then(cached=>cached||response)).catch(()=>caches.match(event.request)));
});
