// === js/ui/voiceMsg.js ===
/* --------------------------------------------------------------------
   음성 피드백 — 녹음기 · 재생기 · 보관 기간 정리 (선생님↔학생 공용)

   왜 Firestore 에 넣나 : Firebase Storage 는 2026-02-03 부터 무료(Spark) 요금제에서 쓸 수 없다.
   그래서 녹음을 opus 24kbps 로 작게 만들어 base64 로 voiceMsgs 문서 하나에 담는다.
   60초 ≈ 180KB(base64 240KB) → Firestore 문서 한도(1MiB) 안에 여유 있게 들어간다.
   feedback / studentFeedback 문서에는 voiceId 만 적어 둬서, 목록을 읽을 때 음성까지 내려받지 않는다.
   보관 기간(VOICE_KEEP_DAYS)이 지나면 선생님 화면을 열 때 purgeExpiredVoices() 가 완전히 지운다.
   학생 이름이 from/to 에 들어가므로 db.js renameUser 에도 등록되어 있다.
   -------------------------------------------------------------------- */

var VOICE_MAX_SEC=60;        // 한 번에 녹음할 수 있는 길이
var VOICE_KEEP_DAYS=30;      // 이 날짜가 지나면 음성 파일을 완전히 지운다 (글 피드백은 남는다)

var _blobToB64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});
var _b64ToBlob=(b64,mime)=>{const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:mime});};

/* 녹음 한 개를 저장하고 문서 id 를 돌려준다 */
var saveVoice=async({from,to,blob,sec})=>{
  const data=await _blobToB64(blob);
  if(data.length>950000)throw new Error('녹음이 너무 깁니다. 짧게 다시 녹음해주세요.');
  const now=new Date();
  const ref=await db.collection('voiceMsgs').add({from,to,mime:blob.type||'audio/webm',data,sec:Math.round(sec),
    createdAt:now,expiresAt:new Date(now.getTime()+VOICE_KEEP_DAYS*86400000)});
  return ref.id;
};

var deleteVoice=async(id)=>{if(!id)return;try{await db.collection('voiceMsgs').doc(id).delete();}catch(e){}};

/* 보관 기간이 지난 음성을 지운다 — 하루에 한 번만 (선생님 화면에서 부른다) */
var purgeExpiredVoices=async()=>{
  const k='voicePurgeDay',today=todayStr();
  try{if(localStorage.getItem(k)===today)return 0;}catch(e){}
  try{
    const snap=await db.collection('voiceMsgs').where('expiresAt','<',new Date()).get();
    const refs=[];snap.forEach(d=>refs.push(d.ref));
    for(let i=0;i<refs.length;i+=400){const b=db.batch();refs.slice(i,i+400).forEach(r=>b.delete(r));await b.commit();}
    try{localStorage.setItem(k,today);}catch(e){}
    return refs.length;
  }catch(e){console.error('음성 정리 실패',e);return 0;}
};

/* 🎙 녹음기 : 녹음 → 들어보기 → onChange({blob,sec}) / 지우면 onChange(null) */
function VoiceRecorder({onChange,compact}){
  const[st,setSt]=useState('idle');      // idle | rec | done
  const[sec,setSec]=useState(0);
  const[url,setUrl]=useState(null);
  const recRef=React.useRef(null);const timerRef=React.useRef(null);const t0=React.useRef(0);
  const stop=()=>{try{recRef.current&&recRef.current.state!=='inactive'&&recRef.current.stop();}catch(e){}clearInterval(timerRef.current);};
  React.useEffect(()=>()=>{stop();},[]);
  const start=async()=>{
    if(!navigator.mediaDevices||!window.MediaRecorder){alert('이 기기에서는 녹음을 지원하지 않습니다.');return;}
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
    catch(e){alert('마이크 사용을 허용해주세요.\n(주소창 왼쪽 자물쇠 → 마이크 → 허용)');return;}
    const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
    const rec=new MediaRecorder(stream,mime?{mimeType:mime,audioBitsPerSecond:24000}:{audioBitsPerSecond:24000});
    const chunks=[];
    rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    rec.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      const s=(Date.now()-t0.current)/1000;
      const blob=new Blob(chunks,{type:rec.mimeType||mime||'audio/webm'});
      setUrl(URL.createObjectURL(blob));setSec(Math.round(s));setSt('done');
      onChange&&onChange({blob,sec:s});
    };
    recRef.current=rec;t0.current=Date.now();setSec(0);setSt('rec');rec.start();
    timerRef.current=setInterval(()=>{
      const s=Math.floor((Date.now()-t0.current)/1000);setSec(s);
      if(s>=VOICE_MAX_SEC)stop();
    },250);
  };
  const clear=()=>{if(url)URL.revokeObjectURL(url);setUrl(null);setSt('idle');setSec(0);onChange&&onChange(null);};

  if(st==='rec')return(<button type="button" onClick={stop}
    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white font-black text-sm animate-pulse">
    ■ 녹음 끝내기 <span className="tabular-nums">{sec}초 / {VOICE_MAX_SEC}초</span></button>);
  if(st==='done')return(<div className="flex items-center gap-2 bg-white border-2 border-indigo-200 rounded-xl p-2">
    <audio src={url} controls className="flex-1 min-w-0 h-9"/>
    <button type="button" onClick={clear} className="px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-black whitespace-nowrap">다시</button>
  </div>);
  return(<button type="button" onClick={start}
    className={`w-full flex items-center justify-center gap-2 ${compact?'py-2.5':'py-3'} rounded-xl bg-white border-2 border-dashed border-indigo-300 text-indigo-600 font-black text-sm`}>
    🎙 목소리로 녹음하기 <span className="text-xs font-bold text-gray-400">(최대 {VOICE_MAX_SEC}초)</span></button>);
}

/* ▶ 재생기 : 누를 때 내려받아 재생. 💾 로 휴대폰에 저장할 수 있다. */
function VoicePlayer({voiceId,sec,big}){
  const[st,setSt]=useState('idle');   // idle | loading | ready | gone
  const[url,setUrl]=useState(null);const[mime,setMime]=useState('');
  const audioRef=React.useRef(null);
  React.useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
  const load=async()=>{
    setSt('loading');
    try{
      const d=await db.collection('voiceMsgs').doc(voiceId).get();
      if(!d.exists){setSt('gone');return;}
      const v=d.data();const blob=_b64ToBlob(v.data,v.mime);
      setMime(v.mime);setUrl(URL.createObjectURL(blob));setSt('ready');
      setTimeout(()=>{try{const p=audioRef.current&&audioRef.current.play();p&&p.catch(()=>{});}catch(e){}},50);
    }catch(e){setSt('idle');alert('음성을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');}
  };
  if(!voiceId)return null;
  if(st==='gone')return<div className="text-xs font-bold text-gray-400 mt-2">🔇 보관 기간({VOICE_KEEP_DAYS}일)이 지나 지워진 음성입니다</div>;
  if(st==='ready')return(<div className="flex items-center gap-2 mt-2">
    <audio ref={audioRef} src={url} controls className="flex-1 min-w-0 h-10"/>
    <a href={url} download={`음성피드백_${todayStr()}.${/mp4/.test(mime)?'m4a':'webm'}`}
      className="px-2.5 py-2 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black whitespace-nowrap">💾 저장</a>
  </div>);
  return(<button type="button" onClick={load} disabled={st==='loading'}
    className={`mt-2 flex items-center gap-2 rounded-2xl bg-indigo-600 text-white font-black active:scale-95 transition-transform ${big?'w-full justify-center py-4 text-lg':'px-4 py-2.5 text-sm'}`}>
    {st==='loading'?'불러오는 중…':<>▶ 목소리 듣기{sec?<span className="opacity-80 font-bold">({sec}초)</span>:null}</>}
  </button>);
}
