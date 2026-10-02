/* 앱 설치(PWA)용 서비스 워커.
   항상 인터넷에서 새 파일을 먼저 받는다(network-first) — 선생님이 고친 내용이 바로 반영되도록.
   인터넷이 끊겼을 때만 마지막으로 받아 둔 화면을 보여 준다. Firestore 요청은 건드리지 않는다. */
const CACHE='taechung-v3';
const NET_WAIT=6000;   // 이 시간(ms) 안에 응답이 없고 받아 둔 사본이 있으면 사본을 먼저 보여 준다
self.addEventListener('install',e=>self.skipWaiting());
/* 옛 캐시(taechung-v2 등)는 지운다 — 저장 공간이 쌓이지 않게 */
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  /* 인터넷이 약할 때 fetch 가 끝없이 기다리면 앱이 하얀 화면으로 멈춘다(2026-10-02).
     NET_WAIT 가 지나도 응답이 없으면 받아 둔 사본으로 먼저 띄우고, 늦게 온 새 파일은 다음 실행을 위해 저장만 한다. */
  const net=fetch(e.request).then(r=>{
    if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c)).catch(()=>{});}
    return r;
  });
  e.respondWith(new Promise(resolve=>{
    let done=false;const finish=r=>{if(!done&&r){done=true;resolve(r);}};
    const t=setTimeout(()=>caches.match(e.request).then(finish),NET_WAIT);
    net.then(r=>{clearTimeout(t);finish(r);})
      .catch(()=>{clearTimeout(t);caches.match(e.request).then(c=>{if(c)finish(c);else{done=true;resolve(Response.error());}});});
  }));
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
