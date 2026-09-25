/* 앱 설치(PWA)용 서비스 워커.
   항상 인터넷에서 새 파일을 먼저 받는다(network-first) — 선생님이 고친 내용이 바로 반영되도록.
   인터넷이 끊겼을 때만 마지막으로 받아 둔 화면을 보여 준다. Firestore 요청은 건드리지 않는다. */
const CACHE='taechung-v2';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{
    const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return r;
  }).catch(()=>caches.match(e.request)));
});

/* 휴대폰 알림 — 서버(worker/)는 내용 없는 푸시만 보낸다. 문구는 /inbox 에서 받아 띄운다. */
const PUSH_SERVER='https://taechung-push.gimbap-lettuce.workers.dev';
const _hex=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].slice(0,16).map(b=>b.toString(16).padStart(2,'0')).join('');
self.addEventListener('push',e=>e.waitUntil((async()=>{
  let m=null;
  try{const sub=await self.registration.pushManager.getSubscription();
    if(sub)m=await (await fetch(PUSH_SERVER+'/inbox?id='+await _hex(sub.endpoint))).json();}catch(err){}
  m=m||{title:'태청야학 수학반',body:'새 소식이 있어요. 눌러서 확인해 보세요.'};
  await self.registration.showNotification(m.title,{body:m.body,icon:'icon-192.png',badge:'icon-192.png',tag:'taechung',renotify:true,data:{url:m.url||'./'}});
})()));
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const target=new URL(e.notification.data&&e.notification.data.url||'./',self.registration.scope).href;
  e.waitUntil((async()=>{
    const wins=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const w of wins)if(w.url.startsWith(self.registration.scope)){await w.focus();return w.navigate(target);}
    return self.clients.openWindow(target);
  })());
});
