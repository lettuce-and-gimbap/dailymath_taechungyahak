/* 앱 설치(PWA)용 서비스 워커.
   항상 인터넷에서 새 파일을 먼저 받는다(network-first) — 선생님이 고친 내용이 바로 반영되도록.
   인터넷이 끊겼을 때만 마지막으로 받아 둔 화면을 보여 준다. Firestore 요청은 건드리지 않는다. */
const CACHE='taechung-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{
    const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r;
  }).catch(()=>caches.match(e.request)));
});
