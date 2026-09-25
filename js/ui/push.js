// === js/ui/push.js ===
/* --------------------------------------------------------------------
   휴대폰 알림 (웹 푸시) — 선생님·학생 공용
   서버 : worker/ (Cloudflare Worker taechung-push). 설치·운영은 worker/README.md.
   - PushCard : 🔔 알림 켜기 / 끄기 / 테스트 카드
   - pushNotify(kind, docId) : 새 문서를 저장한 뒤 부른다. 서버가 그 문서를 직접 읽어 받을 사람을 정한다.
       'studentFeedback' → 선생님들 · 'feedback' → 그 학생 · 'notice' → 학생 전체
   - pushRefresh(userData) : 화면을 열 때 구독을 현재 이름으로 다시 등록한다 (이름이 바뀐 학생 대비)
   -------------------------------------------------------------------- */

var PUSH_SERVER='https://taechung-push.gimbap-lettuce.workers.dev';
var PUSH_KEY='taechungPush_v1';   // localStorage {id, name}

var _pushApi=async(path,body)=>{
  const r=await fetch(PUSH_SERVER+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:undefined);
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||('서버 응답 '+r.status));
  return j;
};
var _pushInfo=()=>{try{return JSON.parse(localStorage.getItem(PUSH_KEY))||{};}catch(e){return{};}};
var pushSupported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
var pushIsOn=()=>pushSupported()&&!!_pushInfo().id&&Notification.permission==='granted';

var _b64u=s=>{const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));return Uint8Array.from(b,c=>c.charCodeAt(0));};

var pushEnable=async(userData)=>{
  if(!pushSupported())throw new Error('이 브라우저는 알림을 지원하지 않습니다. 홈 화면에 추가한 앱에서 켜 주세요.');
  const perm=await Notification.requestPermission();
  if(perm!=='granted')throw new Error('알림이 차단되어 있습니다. 휴대폰 설정 → 앱/사이트 알림에서 허용해 주세요.');
  const reg=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
  let sub=await reg.pushManager.getSubscription();
  if(!sub){const{publicKey}=await _pushApi('/vapid');sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:_b64u(publicKey)});}
  const{id}=await _pushApi('/subscribe',{subscription:sub.toJSON(),name:userData.name,role:userData.role==='admin'?'admin':'student'});
  localStorage.setItem(PUSH_KEY,JSON.stringify({id,name:userData.name}));
  return id;
};
var pushDisable=async()=>{
  const info=_pushInfo();
  try{const reg=await navigator.serviceWorker.getRegistration();const sub=reg&&await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe();}catch(e){}
  if(info.id)_pushApi('/unsubscribe',{id:info.id}).catch(()=>{});
  localStorage.removeItem(PUSH_KEY);
};
var pushRefresh=(userData)=>{
  if(!pushIsOn())return;
  if(_pushInfo().name===userData.name)return;
  pushEnable(userData).catch(()=>{});
};
var pushNotify=(kind,docId)=>{if(docId)_pushApi('/notify',{kind,docId}).catch(()=>{});};

function PushCard({userData,compact}){
  const[on,setOn]=useState(pushIsOn());const[busy,setBusy]=useState(false);const[msg,setMsg]=useState('');
  React.useEffect(()=>{pushRefresh(userData);},[userData.name]);
  const isT=userData.role==='admin';
  const enable=async()=>{setBusy(true);setMsg('');try{await pushEnable(userData);setOn(true);setMsg('✅ 켜졌어요. [테스트]로 확인해 보세요.');}catch(e){setMsg(e.message);}setBusy(false);};
  const disable=async()=>{setBusy(true);await pushDisable();setOn(false);setMsg('알림을 껐어요.');setBusy(false);};
  const test=async()=>{setBusy(true);setMsg('');try{await _pushApi('/test',{id:_pushInfo().id});setMsg('보냈어요. 몇 초 안에 알림이 와야 합니다.');}catch(e){setMsg(e.message);if(/다시 켜/.test(e.message)){localStorage.removeItem(PUSH_KEY);setOn(false);}}setBusy(false);};
  if(!pushSupported())return null;
  return(<div className={`rounded-2xl p-4 border-2 ${on?'bg-emerald-50 border-emerald-200':'bg-amber-50 border-amber-200'}`}>
    <div className="flex items-center gap-2">
      <div className="text-2xl">{on?'🔔':'🔕'}</div>
      <div className="flex-1 min-w-0">
        <div className="font-black text-gray-800 text-sm">휴대폰 알림 {on?'켜짐':'꺼짐'}</div>
        <div className="text-xs text-gray-500 font-medium">{isT?'새 학생 의견이 오면 알려 드려요':'선생님 피드백·공지가 오면 알려 드려요'}</div>
      </div>
      {on?<div className="flex gap-1.5 flex-shrink-0">
          <button onClick={test} disabled={busy} className="text-xs px-3 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg font-black">테스트</button>
          <button onClick={disable} disabled={busy} className="text-xs px-3 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg font-black">끄기</button>
        </div>
        :<button onClick={enable} disabled={busy} className="flex-shrink-0 text-sm px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black">{busy?'…':'알림 켜기'}</button>}
    </div>
    {msg&&<div className="text-xs font-bold text-gray-600 mt-2">{msg}</div>}
  </div>);
}
