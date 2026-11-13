// === js/student/home.js ===
/* --------------------------------------------------------------------
   홈 탭
   수학 나무 숲 · 출석 스탬프 · 공지/숙제 · 내가 보낸 의견
   -------------------------------------------------------------------- */

function calcStreak(activeDates){
  if(!activeDates?.length)return{total:0,streak:0};
  const u=[...new Set(activeDates)].sort((a,b)=>b.localeCompare(a));const total=u.length;
  let streak=0;const cur=new Date();cur.setHours(0,0,0,0);
  const last=new Date(u[0]);last.setHours(0,0,0,0);
  const diff=(cur-last)/(1000*60*60*24);if(diff>1)return{total,streak:0};
  streak=1;for(let i=1;i<u.length;i++){const d1=new Date(u[i-1]),d2=new Date(u[i]);if((d1-d2)/(1000*60*60*24)===1)streak++;else break}
  return{total,streak};
}

/* ===== HOME TAB (나의 수학 나무 숲 & 대시보드) ===== */
/* ── 학생이 보낸 의견 목록 (삭제 + 읽기 전 수정) ── */
function StudentSentFeedback({name,refreshSignal}){
  const[items,setItems]=React.useState([]);
  const[loading,setLoading]=React.useState(true);
  const[editId,setEditId]=React.useState(null);
  const[editText,setEditText]=React.useState('');
  const[open,setOpen]=React.useState(false);   // 보낸 의견 목록 접기/펼치기
  const load=async()=>{
    setLoading(true);
    try{
      const snap=await db.collection('studentFeedback').where('studentName','==',name).get();
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      arr.sort((a,b)=>{
        const ta=a.sentAt?.toDate?a.sentAt.toDate().getTime():new Date(a.sentAt).getTime();
        const tb=b.sentAt?.toDate?b.sentAt.toDate().getTime():new Date(b.sentAt).getTime();
        return tb-ta;
      });
      setItems(arr.slice(0,10));
    }catch(e){}
    setLoading(false);
  };
  React.useEffect(()=>{load();},[name,refreshSignal]);
  const fmt=ts=>{if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleDateString('ko-KR')+' '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});};
  const startEdit=(it)=>{setEditId(it.id);setEditText(it.message);};
  const saveEdit=async(id)=>{
    if(!editText.trim())return;
    try{await db.collection('studentFeedback').doc(id).set({message:editText.trim()},{merge:true});setEditId(null);load();}
    catch(e){alert('수정 실패');}
  };
  const del=async(id)=>{
    if(!confirm('이 의견을 삭제할까요?'))return;
    try{await db.collection('studentFeedback').doc(id).delete();load();}
    catch(e){alert('삭제 실패');}
  };
  if(loading&&items.length===0)return null;
  if(items.length===0)return null;
  return(<div className="mt-4 pt-4 border-t border-gray-100">
    <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between py-1">
      <span className="text-sm font-black text-gray-500">📨 내가 보낸 의견 ({items.length})</span>
      <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold">{open?'접기 ▲':'펼쳐보기 ▼'}</span>
    </button>
    {open&&<div className="space-y-2 mt-2">
      {items.map(it=>{
        const unread=!it.read;
        return(<div key={it.id} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
          {editId===it.id?(
            <div className="space-y-2">
              <textarea lang="ko" value={editText} onChange={e=>setEditText(e.target.value)} rows={2} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-medium resize-none outline-none focus:border-indigo-400"/>
              <div className="flex gap-2">
                <button onClick={()=>saveEdit(it.id)} className="flex-1 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm">저장</button>
                <button onClick={()=>setEditId(null)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-xl font-bold text-sm">취소</button>
              </div>
            </div>
          ):(
            <>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {unread
                  ?<span className="text-[11px] bg-gray-200 text-gray-500 font-bold px-2 py-0.5 rounded-full">아직 안 읽음</span>
                  :<span className="text-[11px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">선생님이 읽음</span>}
                <span className="text-[11px] text-gray-400 ml-auto">{fmt(it.sentAt)}</span>
              </div>
              <p className="text-sm text-gray-700 font-medium leading-relaxed break-keep">{it.message}</p>
              {it.voiceId&&<VoicePlayer voiceId={it.voiceId} sec={it.voiceSec}/>}
              <div className="flex gap-2 mt-2 justify-end">
                {unread&&<button onClick={()=>startEdit(it)} className="text-[11px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">✏️ 수정</button>}
                <button onClick={()=>del(it.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
              </div>
            </>
          )}
        </div>);
      })}
    </div>}
  </div>);
}

function HomeTab({userData,onUpdate,onGoPractice,onResumeSaved,hasSavedSession,onStartHomework}){
  const{totalLessons,todayLessons,todayCorrect,todayWrong,goal=3,activeDates=[],currentWeekStart,stampArchive=[],name,logs=[]}=userData;
  const[notices,setNotices]=React.useState([]);
  const[pendingHomework,setPendingHomework]=React.useState(null);
  React.useEffect(()=>{
    const now=new Date();
    db.collection('notices').get().then(snap=>{
      const arr=[];snap.forEach(d=>{
        const n={id:d.id,...d.data()};
        const exp=n.expiresAt?.toDate?n.expiresAt.toDate():new Date(n.expiresAt||0);
        if(exp>now)arr.push(n);
      });
      arr.sort((a,b)=>(b.createdAt?.toDate?.().getTime()||0)-(a.createdAt?.toDate?.().getTime()||0));
      setNotices(arr);
    }).catch(()=>{});
    db.collection('homework').where('active','==',true).get().then(snap=>{
      const arr=[];snap.forEach(d=>{
        const h={id:d.id,...d.data()};
        const exp=h.expiresAt?.toDate?h.expiresAt.toDate():new Date(h.expiresAt||0);
        const forMe=!h.assignedTo||(Array.isArray(h.assignedTo)?h.assignedTo.includes(name):h.assignedTo===name);
        if(exp>now&&forMe&&!(h.completedBy||[]).includes(name))arr.push(h);
      });
      arr.sort((a,b)=>(b.createdAt?.toDate?.().getTime()||0)-(a.createdAt?.toDate?.().getTime()||0));
      if(arr.length>0)setPendingHomework(arr[0]);
    }).catch(()=>{});
  },[name]);
  
  // 1. 스탬프 및 진도율 계산 로직
  const weekDates=weekDatesFrom(currentWeekStart||getKSTMonday());
  const pct=Math.min((todayLessons/goal)*100,100);const circ=226.2;const offset=circ-(circ*pct/100);
  const{total,streak}=calcStreak(activeDates);
  const allFilled=weekDates.every(d=>activeDates.includes(d));
  const monday=currentWeekStart||getKSTMonday();
  const monDate=new Date(monday+'T00:00:00+09:00');const sunDate=new Date(monDate);sunDate.setDate(sunDate.getDate()+6);
  const weekLabel=`${monDate.getMonth()+1}/${monDate.getDate()}(월) ~ ${sunDate.getMonth()+1}/${sunDate.getDate()}(일)`;
  const praise=todayLessons===0?'시작이 반이에요! 도전해봐요 💪':todayLessons<goal?`정말 잘하고 있어요! 조금만 더! 🌟`:'🎊 오늘 목표 달성! 대단해요!';
  const[showArchive,setShowArchive]=useState(false);
  const[showMathForest,setShowMathForest]=useState(false);

  // 토픽 기준의 3단 영역 지도. 알 수 없는 유형은 기타에 남겨 분모에서 누락시키지 않는다.
  const treeDomains=[
    {key:'calculation',label:'계산의 힘',emoji:'🧮',color:'indigo',match:(t,c)=>c==='div'||c==='math'||/연산|나눗셈|계산/.test(t)},
    {key:'number',label:'수와 식',emoji:'🔢',color:'blue',match:(t,c)=>/약수|배수|소인수|정수|유리수|다항식|인수분해|복소수/.test(t)||['poly','number'].includes(c)},
    {key:'equation',label:'방정식과 부등식',emoji:'⚖️',color:'violet',match:(t,c)=>/방정식|부등식/.test(t)||['eq','ineq','equation'].includes(c)},
    {key:'function',label:'함수와 그래프',emoji:'📈',color:'cyan',match:(t,c)=>/함수|그래프/.test(t)||['func','function'].includes(c)},
    {key:'geometry',label:'도형과 좌표',emoji:'📐',color:'emerald',match:(t,c)=>/기하|도형|좌표|대칭|거리|원|직선/.test(t)||c==='geometry'},
    {key:'set',label:'집합과 명제',emoji:'🧩',color:'amber',match:(t,c)=>/집합|명제/.test(t)||c==='set'},
    {key:'statistics',label:'확률과 통계',emoji:'🎲',color:'rose',match:(t,c)=>/확률|통계|순열|조합/.test(t)||c==='stat'},
    {key:'word',label:'문장제',emoji:'📖',color:'orange',match:(t)=>/문장제|스토리|실생활/.test(t)},
    {key:'other',label:'탐험 중인 유형',emoji:'🌿',color:'slate',match:()=>true}
  ];
  const treeStats=Object.fromEntries(treeDomains.map(d=>[d.key,{total:0,correct:0,byDate:{}}]));
  const treeQuestions=[];
  logs.forEach(log=>(log.questions||[]).forEach(q=>{
    const topic=String(q.meta?.type||q.topic||log.type||'기타'),cat=String(q.meta?.category||'').toLowerCase();
    const domain=treeDomains.find(d=>d.match(topic.toLowerCase(),cat))||treeDomains[treeDomains.length-1];
    const date=String(log.date||'').slice(0,10);const stat=treeStats[domain.key];
    stat.total++;if(q.isOk)stat.correct++;
    if(date){if(!stat.byDate[date])stat.byDate[date]={total:0,correct:0};stat.byDate[date].total++;if(q.isOk)stat.byDate[date].correct++;}
    treeQuestions.push({q,topic,domain,date});
  }));
  // 같은 문항/토픽에서 오답 후 정답으로 전환된 건만 '되찾음'으로 센다.
  const attempts=new Map();let recovered=0,recoveredThisWeek=0;
  const ordered=[...treeQuestions].reverse();
  const mondayKey=getKSTMonday();
  ordered.forEach(({q,topic,date})=>{
    const key=String(q.qTxt||q.qFull||q.topic||topic).trim().toLowerCase();
    if(!key)return;
    const prev=attempts.get(key)||false;
    if(q.isOk&&prev){recovered++;if(date&&date>=mondayKey)recoveredThisWeek++;attempts.set(key,false);}
    else if(!q.isOk)attempts.set(key,true);
  });
  const activeTotal=new Set([...(activeDates||[]),...logs.map(l=>String(l.date||'').slice(0,10)).filter(Boolean)]).size;
  const domainStage=stat=>stat.total===0?{icon:'🌱',label:'첫 씨앗'}:stat.correct/stat.total>=.9?{icon:'🍎',label:'열매'}:stat.correct/stat.total>=.75?{icon:'🌳',label:'자라는 나무'}:stat.correct/stat.total>=.4?{icon:'🌿',label:'새싹'}:{icon:'🌱',label:'씨앗'};
  const colorClasses={indigo:'from-indigo-400 to-indigo-600',blue:'from-blue-400 to-blue-600',violet:'from-violet-400 to-violet-600',cyan:'from-cyan-400 to-cyan-600',emerald:'from-emerald-400 to-emerald-600',amber:'from-amber-400 to-amber-600',rose:'from-rose-400 to-rose-600',orange:'from-orange-400 to-orange-600',slate:'from-slate-400 to-slate-600'};

  const[feedbackMsg,setFeedbackMsg]=React.useState('');const[fbSent,setFbSent]=React.useState(false);
  const[sentFbRefresh,setSentFbRefresh]=React.useState(0);
  const[fbVoice,setFbVoice]=React.useState(null);const[fbVKey,setFbVKey]=React.useState(0);   // 🎙 녹음 (ui/voiceMsg.js)
  const sendStudentFeedback=async()=>{if(!feedbackMsg.trim()&&!fbVoice)return;try{
    const voiceId=fbVoice?await saveVoice({from:name,to:'선생님',blob:fbVoice.blob,sec:fbVoice.sec}):null;
    const ref=await db.collection('studentFeedback').add({studentName:name,message:feedbackMsg.trim()||'🎙 음성 의견',voiceId,voiceSec:fbVoice?Math.round(fbVoice.sec):null,sentAt:new Date(),read:false});
    pushNotify('studentFeedback',ref.id);   // 선생님 휴대폰 알림
    setFbSent(true);setFeedbackMsg('');setFbVoice(null);setFbVKey(k=>k+1);setSentFbRefresh(x=>x+1);setTimeout(()=>setFbSent(false),3000);}catch(e){alert('전송 실패'+(e&&e.message?': '+e.message:''));}};
  // 취약 영역 감지
  const weakAreaCheck = (() => {
    const counts = { geo: 0, set: 0, stat: 0 };
    logs.forEach(log => {
      if(!log.questions) return;
      log.questions.forEach(q => {
        const type = (q.meta?.type || log.type || '').toLowerCase();
        const cat = (q.meta?.category || '').toLowerCase();
        if(type.includes('기하')||type.includes('도형')||cat==='geometry'||type.includes('직선')||type.includes('원의')||type.includes('대칭')||type.includes('거리')) counts.geo++;
        else if(type.includes('집합')||type.includes('함수')||cat==='set'||cat==='func') counts.set++;
        else if(type.includes('확률')||type.includes('통계')||cat==='stat'||type.includes('순열')||type.includes('조합')) counts.stat++;
      });
    });
    const weak=[];
    if(counts.geo<5)weak.push({label:'도형과 기하',emoji:'🔷',count:counts.geo});
    if(counts.set<5)weak.push({label:'집합과 함수',emoji:'🔶',count:counts.set});
    if(counts.stat<5)weak.push({label:'확률과 통계',emoji:'🟣',count:counts.stat});
    return weak;
  })();

  return(<div className="p-4 space-y-5 pb-36">
    <div className="text-2xl font-black text-gray-800 mt-1">{name}님! 안녕하세요 👋</div>

    {/* 전체공지 배너 */}
    {notices.map(n=>(
      <div key={n.id} className="bg-blue-50 border-2 border-blue-300 rounded-3xl p-4 shadow-sm">
        <div className="font-black text-blue-800 text-sm mb-1">📢 선생님 공지</div>
        <p className="text-sm text-blue-700 font-medium leading-relaxed break-keep">{n.text}</p>
        {n.voiceId&&<VoicePlayer voiceId={n.voiceId} sec={n.voiceSec} big/>}
      </div>
    ))}

    {/* 숙제 배너 */}
    {pendingHomework&&(
      <button onClick={()=>onStartHomework&&onStartHomework(pendingHomework)} className="w-full text-left bg-green-50 border-2 border-green-400 rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-transform flex items-center gap-3">
        <div className="text-3xl">📝</div>
        <div className="flex-1">
          <div className="font-black text-green-800 text-base">선생님의 숙제가 있어요!</div>
          <div className="text-sm text-green-700 font-bold mt-0.5">풀어보시겠어요? ({pendingHomework.title}) →</div>
        </div>
      </button>
    )}

    {/* 저장된 세션 알림 배너 */}
    {hasSavedSession&&(()=>{
      let saved=null;try{saved=JSON.parse(localStorage.getItem('yakHakSavedSession_'+name));}catch{}
      return(<button onClick={onResumeSaved||onGoPractice} className="w-full text-left bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-transform flex items-center gap-3">
        <div className="text-3xl">📚</div>
        <div className="flex-1">
          <div className="font-black text-amber-800 text-base">하던 공부가 있어요!</div>
          <div className="text-sm text-amber-700 font-bold mt-0.5">이어서 풀어볼까요? (정답 {saved?.correctCount||0}/10) →</div>
        </div>
      </button>);
    })()}

    {/* 오늘의 달성도 (탭하면 바로 오늘 문제 풀기로 이동) */}
    <button onClick={onGoPractice} className={`w-full text-left bg-white rounded-3xl p-5 shadow-md active:scale-[0.98] transition-transform ${todayLessons>=goal?'goal-glow':''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-gray-400 uppercase">📅 오늘의 달성도</div>
        <span className="text-xs font-black text-white bg-indigo-500 rounded-full px-3 py-1.5">문제 풀러 가기 →</span>
      </div>
      <div className="flex items-center gap-5">
        <div style={{position:'relative',width:96,height:96,flexShrink:0}}>
          <svg viewBox="0 0 88 88" width={96} height={96} style={{transform:'rotate(-90deg)'}}>
            <circle cx={44} cy={44} r={36} fill="none" stroke="#DDE4F5" strokeWidth={8}/>
            <circle cx={44} cy={44} r={36} fill="none" stroke="#5B7BFF" strokeWidth={8} strokeLinecap="round"
              className="ring-fill" strokeDasharray={circ} strokeDashoffset={offset}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',lineHeight:1.2}}>
            <span style={{fontSize:24,fontWeight:900,color:'#5B7BFF'}}>{todayLessons}</span>
            <span style={{fontSize:11,fontWeight:700,color:'#6B7280'}}>/ {goal}</span>
          </div>
        </div>
        <div>
          <div className="text-xl font-black text-gray-800 mb-1 break-keep">{praise}</div>
          <div className="text-sm text-gray-500">목표: <strong>{goal}</strong> 레슨/일</div>
          <div className="mt-2 inline-block bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">👉 지금 바로 오늘 문제 풀기</div>
        </div>
      </div>
    </button>

    {/* 이번 주 출석 스탬프 */}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-bold text-gray-400 uppercase">🎯 이번 주 출석 스탬프</div>
      </div>
      <div className="text-xs text-gray-400 mb-3">{weekLabel} • 월요일 00시 리셋</div>
      <div className="flex gap-2 flex-wrap">
        {weekDates.map((d,i)=>{const on=activeDates.includes(d);return(
          <div key={i} className={`w-11 h-11 rounded-full flex items-center justify-center text-xl font-black ${on?(allFilled?'stamp-gold':'bg-gradient-to-br from-indigo-100 to-blue-200 shadow-md'):'bg-gray-100 text-gray-400 text-sm'}`}>
            {on?'⭐':DAY_KO[i]}
          </div>);})}
      </div>
      {stampArchive.length>0&&<>
        <button onClick={()=>setShowArchive(v=>!v)} className="mt-3 w-full text-sm text-gray-500 font-bold py-2 border border-gray-200 rounded-xl">
          {showArchive?'이전 주 기록 닫기 ▲':'이전 주 기록 보기 ▼'}</button>
        {showArchive&&stampArchive.slice(0,4).map((wk,wi)=>{
          const wkDates=weekDatesFrom(wk.weekStart);const wMon=new Date(wk.weekStart+'T00:00:00+09:00');const wSun=new Date(wMon);wSun.setDate(wSun.getDate()+6);
          return(<div key={wi} className="mt-3">
            <div className="text-xs text-gray-400 font-bold mb-2">{wMon.getMonth()+1}/{wMon.getDate()}(월) ~ {wSun.getMonth()+1}/{wSun.getDate()}(일)</div>
            <div className="flex gap-2 flex-wrap">
              {wkDates.map((d,i)=>{const on=wk.activeDates.includes(d);return(<div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold ${on?'bg-indigo-100 text-indigo-700':'bg-gray-100 text-gray-400 text-xs'}`}>{on?'⭐':DAY_KO[i]}</div>)})}
            </div>
          </div>)})}
      </>}
    </div>

    {weakAreaCheck.length>0&&(
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 shadow-lg text-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">📚</span>
          <div>
            <div className="font-black text-base">중졸·고졸 모의고사 연습이 필요해요!</div>
            <div className="text-xs opacity-80 mt-0.5">아직 충분히 풀지 않은 영역이 있어요</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {weakAreaCheck.map(area=>(
            <div key={area.label} className="bg-white/20 rounded-xl px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
              <span>{area.emoji}</span><span>{area.label}</span>
              <span className="opacity-70 text-xs">({area.count}문항)</span>
            </div>
          ))}
        </div>
        <div className="text-xs opacity-80 bg-white/10 rounded-xl p-3 leading-relaxed">
          💡 <b>모의고사 탭</b>에서 실전 모의고사나 약점 집중 문제를 풀어 보세요.
        </div>
      </div>
    )}

    {/* 나의 수학 나무 숲: 누적 성장 배지와 세분 영역 지도 */}
    <div className="bg-white rounded-3xl shadow-md border-t-4 border-t-green-400 overflow-hidden">
      <button onClick={()=>setShowMathForest(v=>!v)} aria-expanded={showMathForest} className="w-full text-left px-5 pt-5 pb-3 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="flex items-start gap-3">
          <div className="text-4xl">🌳</div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-black text-green-800">나의 수학나무 숲</div>
            <div className="text-xs text-green-700 mt-1">오늘까지 {treeQuestions.length}문제를 만나고 {activeTotal}일 함께했어요.</div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white text-green-700 border border-green-100">{showMathForest?'접기 ▲':'펼치기 ▼'}</span>
        </div>
      </button>
      {showMathForest&&<>
        <div className="px-5 pt-4 grid grid-cols-3 gap-2">
          {[["🌱",treeQuestions.length,"만난 문제"],["🔁",recovered,"되찾은 문제"],["⭐",activeTotal,"함께한 날"]].map(([ico,val,label])=><div key={label} className="rounded-2xl bg-white/90 border border-green-100 p-2.5 text-center shadow-sm"><div className="text-[10px] text-gray-500 font-bold">{ico} {label}</div><div className="text-xl text-green-800 font-black mt-0.5">{val}<span className="text-xs ml-0.5">개</span></div>{label==='되찾은 문제'&&<div className="text-[9px] text-green-600 font-bold">이번 주 +{recoveredThisWeek}</div>}</div>)}
        </div>
      <div className="px-5 pb-5 pt-3">
        <div className="flex items-center justify-between mb-2"><div className="text-xs font-black text-gray-700">배움의 영역 지도</div><div className="text-[10px] text-gray-400">색 막대 = 지금까지 정답 비율</div></div>
        <div className="space-y-2">
          {treeDomains.map(d=>{
            const st=treeStats[d.key],rate=st.total?Math.round(st.correct/st.total*100):0,stage=domainStage(st);
            return <div key={d.key} className="rounded-2xl border border-gray-100 bg-white px-3 py-2.5">
              <div className="flex items-center gap-2"><span className="text-lg">{d.emoji}</span><span className="text-xs font-black text-gray-800 flex-1">{d.label}</span><span className="text-[10px] text-gray-500">{stage.icon} {stage.label}</span></div>
              <div className="flex items-center gap-2 mt-1.5"><div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${colorClasses[d.color]}`} style={{width:`${rate}%`}}/></div><span className="w-16 text-right text-[10px] font-bold text-gray-500">{st.total?`${st.correct}/${st.total} · ${rate}%`:'아직 기록 없음'}</span></div>
              {st.total>0&&<div className="mt-1 text-[9px] text-gray-400">{st.total<5?'기록이 더 쌓이면 변화가 또렷해져요':`최근 기록 ${Math.min(5,st.total)}회 중 ${(()=>{const recent=treeQuestions.filter(x=>x.domain.key===d.key).slice(0,5);return recent.filter(x=>x.q.isOk).length;})()}회 정답`}</div>}
            </div>;
          })}
        </div>
        <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-[10px] text-amber-800 leading-relaxed"><b>🌟 다음 성장 미션</b><br/>{treeDomains.filter(d=>treeStats[d.key].total>0&&treeStats[d.key].total<5).length?`기록이 적은 ${treeDomains.filter(d=>treeStats[d.key].total>0&&treeStats[d.key].total<5).length}개 영역에서 문제를 더 만나봐요.`:treeQuestions.length===0?'첫 문제를 풀어 나무에 씨앗을 심어봐요!':'가장 많이 자란 영역의 다음 유형에도 도전해봐요!'} 오답은 성장 과정의 일부이고, 되찾은 문제는 실력이 된 순간이에요.</div>
      </div>
      </>}
    </div>

    {/* 학생 의견 보내기 */}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <StudentReceivedFeedback name={name}/>
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">💬 선생님께 의견 보내기</div>
      <textarea lang="ko" value={feedbackMsg} onChange={e=>setFeedbackMsg(e.target.value)} placeholder="선생님께 전하고 싶은 말을 남겨주세요" rows={3} className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base font-medium resize-none focus:border-indigo-400 outline-none mb-3"/>
      <div className="mb-3"><VoiceRecorder key={fbVKey} onChange={setFbVoice}/></div>
      <button onClick={sendStudentFeedback} className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-black text-base active:scale-95 transition-transform">
        {fbSent?'✅ 전송되었어요!':'선생님께 보내기 📩'}
      </button>
      <StudentSentFeedback name={name} refreshSignal={sentFbRefresh}/>
    </div>

    {/* 휴대폰 알림 (ui/push.js) */}
    <PushCard userData={userData}/>
  </div>);
}

/* 받은 선생님 피드백 — 홈에서 접었다 펼치기 (기록 탭에도 같은 목록이 있다) */
function StudentReceivedFeedback({name}){
  const[items,setItems]=React.useState([]);const[open,setOpen]=React.useState(false);
  React.useEffect(()=>{
    db.collection('feedback').where('studentName','==',name).get().then(snap=>{
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      const t=x=>x.createdAt?.toDate?x.createdAt.toDate().getTime():new Date(x.createdAt).getTime();
      arr.sort((a,b)=>t(b)-t(a));setItems(arr.slice(0,20));
    }).catch(()=>{});
  },[name]);
  if(!items.length)return null;
  const unread=items.filter(f=>!f.read).length;
  return(<div className="mb-4 pb-4 border-b border-gray-100">
    <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between py-1">
      <span className="text-sm font-black text-indigo-700">💌 받은 선생님 피드백 ({items.length}){unread?<span className="ml-1.5 text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-full">새 {unread}</span>:null}</span>
      <span className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-bold">{open?'접기 ▲':'펼쳐보기 ▼'}</span>
    </button>
    {open&&<div className="space-y-2 mt-2">{items.map(fb=>(
      <div key={fb.id} className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100">
        {fb.relatedLog&&<div className="text-[11px] text-indigo-500 font-black mb-1">📋 {fb.relatedLog}</div>}
        <div className="text-base font-bold text-gray-800 leading-relaxed break-keep">{fb.message}</div>
        {fb.voiceId&&<VoicePlayer voiceId={fb.voiceId} sec={fb.voiceSec}/>}
        <div className="text-[11px] text-gray-400 mt-1.5 text-right">{fb.createdAt?.toDate?.()?.toLocaleDateString('ko-KR')||''}</div>
      </div>))}</div>}
  </div>);
}
