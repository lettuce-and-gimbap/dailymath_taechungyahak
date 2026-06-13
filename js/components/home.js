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
    <div className="text-xs font-bold text-gray-400 uppercase mb-2">📨 내가 보낸 의견</div>
    <div className="space-y-2">
      {items.map(it=>{
        const unread=!it.read;
        return(<div key={it.id} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
          {editId===it.id?(
            <div className="space-y-2">
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={2} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-medium resize-none outline-none focus:border-indigo-400"/>
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
              <div className="flex gap-2 mt-2 justify-end">
                {unread&&<button onClick={()=>startEdit(it)} className="text-[11px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">✏️ 수정</button>}
                <button onClick={()=>del(it.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
              </div>
            </>
          )}
        </div>);
      })}
    </div>
  </div>);
}

function HomeTab({userData,onUpdate,onGoPractice}){
  const{totalLessons,todayLessons,todayCorrect,todayWrong,goal=3,activeDates=[],currentWeekStart,stampArchive=[],name,logs=[]}=userData;
  
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

  // 2. 🌳 나의 수학 나무 숲 데이터 집계 (검정고시 5대 영역)
  const treeStats = {
  '기초 연산': { c: 0, t: 0, desc: '덧셈, 뺄셈, 곱셈, 나눗셈' },
  '약수와 배수': { c: 0, t: 0, desc: '약수, 배수, 최대공약수, 최소공배수' },
  '문장제 문제': { c: 0, t: 0, desc: '실생활 문제 읽고 풀기' },
  '도형과 좌표': { c: 0, t: 0, desc: '도형, 좌표, 대칭이동' },
  '검정고시 수학': { c: 0, t: 0, desc: '방정식, 함수, 확률, 통계' }
};

  // 학습 로그를 순회하며 각 문항별로 카테고리에 맞게 정답(c)과 전체(t) 누적
  logs.forEach(log => {
    if(log.questions) {
      log.questions.forEach(q => {
        const type = (q.meta?.type || log.type || '').toLowerCase();
        const cat = (q.meta?.category || '').toLowerCase();

        // 영역 매핑 분류
	if(type.includes('나눗셈') || cat === 'div' || cat === 'math') {
  treeStats['기초 연산'].t++;
  if(q.isOk) treeStats['기초 연산'].c++;
}
else if(type.includes('약수') || type.includes('배수') || type.includes('gcd') || type.includes('lcm')) {
  treeStats['약수와 배수'].t++;
  if(q.isOk) treeStats['약수와 배수'].c++;
}
else if(type.includes('스토리') || type.includes('문장제') || type.includes('학습지')) {
  treeStats['문장제 문제'].t++;
  if(q.isOk) treeStats['문장제 문제'].c++;
}
else if(type.includes('기하') || type.includes('도형') || cat === 'geometry' || type.includes('대칭') || type.includes('거리') || type.includes('원')) {
  treeStats['도형과 좌표'].t++;
  if(q.isOk) treeStats['도형과 좌표'].c++;
}
else if(type.includes('다항식') || type.includes('방정식') || type.includes('함수') || type.includes('집합') || type.includes('확률') || type.includes('통계') || type.includes('모의고사') || type.includes('검정고시') || cat === 'exam5' || cat === 'poly' || cat === 'eq' || cat === 'ineq' || cat === 'set' || cat === 'func' || cat === 'stat') {
  treeStats['검정고시 수학'].t++;
  if(q.isOk) treeStats['검정고시 수학'].c++;
}

      });
    }
  });

  // 3. 개별 나무 렌더링 컴포넌트
  const renderTree = (title, stat) => {
    const rate = stat.t === 0 ? 0 : Math.round((stat.c / stat.t) * 100);
    let icon, message, bgColor, borderColor;

    // 성장 4단계 로직 및 따뜻한 동기부여 메시지
    if (stat.t === 0) {
       icon = "🌱"; 
       message = "아직 시작하지 않은 영역이에요. 첫 씨앗을 심어볼까요?"; 
       bgColor = "bg-gray-50"; borderColor = "border-gray-200";
    } else if (rate < 40) {
       icon = "🌱"; 
       message = "따뜻한 햇살과 물이 조금 더 필요해요! 오답은 나무의 거름이 된답니다."; 
       bgColor = "bg-amber-50"; borderColor = "border-amber-200";
    } else if (rate < 75) {
       icon = "🌿"; 
       message = "뿌리를 내리고 줄기가 쑥쑥 자라고 있어요! 정말 훌륭한 발전입니다."; 
       bgColor = "bg-lime-50"; borderColor = "border-lime-200";
    } else if (rate < 90) {
       icon = "🌳"; 
       message = "잎이 무성해졌어요! 개념을 거의 완벽하게 이해하셨네요. 화이팅!"; 
       bgColor = "bg-green-50"; borderColor = "border-green-300";
    } else {
       icon = "🍎"; 
       message = "와! 꾸준히 노력하신 덕분에 탐스러운 열매가 맺혔어요! 완벽합니다."; 
       bgColor = "bg-emerald-50"; borderColor = "border-emerald-400";
    }

    return (
      <div key={title} className={`flex items-center gap-4 p-4 rounded-2xl border-2 shadow-sm mb-3 ${bgColor} ${borderColor} transition-all hover:scale-[1.02]`}>
         <div className="text-5xl drop-shadow-md">{icon}</div>
         <div className="flex-1">
            <div className="text-sm font-black text-gray-800">{title} <span className="text-xs font-bold text-gray-500 ml-1">({stat.desc})</span></div>
            <div className="text-xs font-bold text-gray-600 mt-1 leading-snug break-keep">{message}</div>
            {stat.t > 0 && (
              <div className="mt-2.5 w-full bg-white/60 rounded-full h-2.5 overflow-hidden border border-black/10">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{width: `${rate}%`}}></div>
              </div>
            )}
         </div>
      </div>
    );
  };

  const[feedbackMsg,setFeedbackMsg]=React.useState('');const[fbSent,setFbSent]=React.useState(false);
  const[sentFbRefresh,setSentFbRefresh]=React.useState(0);
  const sendStudentFeedback=async()=>{if(!feedbackMsg.trim())return;try{await db.collection('studentFeedback').add({studentName:name,message:feedbackMsg.trim(),sentAt:new Date(),read:false});setFbSent(true);setFeedbackMsg('');setSentFbRefresh(x=>x+1);setTimeout(()=>setFbSent(false),3000);}catch(e){alert('전송 실패');}};
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
            <div className="font-black text-base">중졸·고졸 검정고시 연습이 필요해요!</div>
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
          💡 <b>문제풀기 탭 → 중졸 또는 고졸 검정고시 연습</b>을 선택하면 필요한 영역을 골고루 연습할 수 있어요!
        </div>
      </div>
    )}

    {/* 🌟 나의 수학 나무 숲 (접었다 펼치기) 🌟 */}
    {(()=>{const[treeOpen,setTreeOpen]=React.useState(false);return(
    <div className="bg-white rounded-3xl shadow-md border-t-4 border-t-green-400 overflow-hidden">
      <button onClick={()=>setTreeOpen(o=>!o)} className="w-full flex items-center justify-between px-5 py-4">
        <div className="text-sm font-black text-green-700 uppercase tracking-wide">🌳 나의 수학 나무 숲</div>
        <span className="text-green-500 font-bold text-lg">{treeOpen?'▲':'▼'}</span>
      </button>
      {treeOpen&&<div className="px-5 pb-5">
        <p className="text-xs text-gray-500 font-bold mb-4">매일 꾸준히 문제를 풀며 검정고시 5대 영역의 나무를 예쁘게 키워보세요!</p>
        <div className="flex flex-col">
          {Object.entries(treeStats).map(([title, stat]) => renderTree(title, stat))}
        </div>
      </div>}
    </div>)})()}

    {/* 학생 의견 보내기 */}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">💬 선생님께 의견 보내기</div>
      <textarea value={feedbackMsg} onChange={e=>setFeedbackMsg(e.target.value)} placeholder="선생님께 전하고 싶은 말을 남겨주세요" rows={3} className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base font-medium resize-none focus:border-indigo-400 outline-none mb-3"/>
      <button onClick={sendStudentFeedback} className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-black text-base active:scale-95 transition-transform">
        {fbSent?'✅ 전송되었어요!':'선생님께 보내기 📩'}
      </button>
      <StudentSentFeedback name={name} refreshSignal={sentFbRefresh}/>
    </div>
  </div>);
}

/* ===== DAILY PRACTICE TAB ===== */
