// === js/student/dashboard.js ===
/* --------------------------------------------------------------------
   학생 대시보드
   학생 화면의 탭 묶음과 하단 네비게이션
   -------------------------------------------------------------------- */

/* 좌표평면·수직선 눈금 숫자 크기 — 100%→130%→160%→200% 순으로 돌아가며 커진다.
   전역 CSS 변수 --ms 를 바꿔서 index.html 의 svg text[...] 규칙(눈금 숫자)과
   GS.planeSVG(좌표10 등)의 눈금 숫자가 함께 커지도록 한다. 학생마다 이 브라우저에 저장된다. */
var NUM_SIZE_STEPS=[1,1.3,1.6,2];
var NUM_SIZE_KEY='yakHakNumSize';
function loadNumSize(){try{const v=parseFloat(localStorage.getItem(NUM_SIZE_KEY));return NUM_SIZE_STEPS.includes(v)?v:1;}catch(e){return 1;}}
function applyNumSize(v){try{document.documentElement.style.setProperty('--ms',v);localStorage.setItem(NUM_SIZE_KEY,String(v));}catch(e){}}
function NumSizeToggle(){
  const[v,setV]=useState(()=>{const x=loadNumSize();applyNumSize(x);return x;});
  const next=()=>{const i=NUM_SIZE_STEPS.indexOf(v);const nv=NUM_SIZE_STEPS[(i+1)%NUM_SIZE_STEPS.length];setV(nv);applyNumSize(nv);};
  // DarkToggle과 같은 동그란 아이콘 단추 — 좁은 화면에서도 헤더가 넘치지 않도록 글자는 넣지 않는다.
  // 지금 배율은 title(길게 누르면 보이는 설명)과, 켜져 있을 때(1보다 클 때) 오른쪽 위 작은 점으로만 표시한다.
  return<button onClick={next} title={`좌표평면·수직선 눈금 숫자 크기 ${Math.round(v*100)}% (눌러서 변경)`}
    className="dark-toggle relative flex-shrink-0" style={{fontSize:18}}>
    🔢
    {v>1&&<span className="absolute -top-0.5 -right-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-black px-1 leading-tight">{Math.round(v*100)}</span>}
  </button>;
}

/* 하던 공부 알림 — 문제 푸는 화면을 가리지 않게 머리글 바로 아래에 한 줄로 작게 뜬다.
   - [이어서] : 문제풀기 탭으로 가서 저장된 문제부터 바로 이어 푼다
   - 위·아래·옆으로 밀거나 [✕] : 오른쪽 위의 작은 📚 단추로 접힌다 (누르면 다시 펼쳐짐)
   - 무시하고 지금 문제를 끝까지 풀면, 그 기록이 저장돼 있던 하던 공부를 '풀림'으로 덮는다 (StudentDashboard 참고) */
function SavedSessionBar({saved,collapsed,onCollapse,onExpand,onResume}){
  const start=useRef(null);
  const[drag,setDrag]=useState(0);
  if(collapsed)return<button onClick={onExpand} aria-label="하던 공부 보기"
    className="fixed top-16 right-3 z-30 bg-amber-400 text-amber-900 rounded-full shadow-md font-black text-xs px-3 active:scale-95 transition-transform"
    style={{minHeight:'36px'}}>📚 하던 공부</button>;
  const down=e=>{start.current={x:e.clientX,y:e.clientY};};
  const move=e=>{if(!start.current)return;const dx=e.clientX-start.current.x,dy=e.clientY-start.current.y;setDrag(Math.abs(dx)>Math.abs(dy)?dx:dy);};
  const up=()=>{if(!start.current)return;start.current=null;if(Math.abs(drag)>40)onCollapse();setDrag(0);};
  return<div className="px-3 pt-2 pb-1 bg-gray-50" style={{touchAction:'none'}}
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
    <div className="flex items-center gap-2 bg-amber-50 border-2 border-amber-300 rounded-2xl pl-3 pr-1.5 py-1.5 shadow-sm"
      style={{transform:`translateY(${Math.max(-30,Math.min(30,drag))}px)`,opacity:1-Math.min(.6,Math.abs(drag)/120),transition:drag?'none':'all .2s'}}>
      <span className="text-lg">📚</span>
      <span className="flex-1 min-w-0 text-xs font-black text-amber-800 truncate">하던 공부 <span className="text-amber-600">({saved?.correctCount||0}/10 맞힘)</span></span>
      <button onClick={onResume} className="px-3 bg-amber-500 text-white rounded-xl font-black text-xs whitespace-nowrap" style={{minHeight:'34px'}}>이어서</button>
      <button onClick={onCollapse} aria-label="접기" className="px-2 text-amber-700 font-black text-sm" style={{minHeight:'34px'}}>✕</button>
    </div>
  </div>;
}

function StudentDashboard({userData,onLogout,onUpdate:onUpdateRaw,onSwitchUser}){
  const[tab,setTab]=useState('home');
  const[feedbacks,setFeedbacks]=useState([]);
  const[showFbModal,setShowFbModal]=useState(false);
  const[sessionActive,setSessionActive]=useState(false);
  const[showNavModal,setShowNavModal]=useState(false);
  const[pendingTab,setPendingTab]=useState(null);
  const[hasSavedSession,setHasSavedSession]=useState(()=>!!localStorage.getItem('yakHakSavedSession_'+userData.name));
  const[activeHomework,setActiveHomework]=useState(null);
  const[barCollapsed,setBarCollapsed]=useState(false);   // 하던 공부 알림을 작은 단추로 접었는지
  const[resumeReq,setResumeReq]=useState(false);         // 문제풀기 탭에 가자마자 저장된 문제부터 이어 풀기
  const[toast,setToast]=useState('');
  const[pendingSwitch,setPendingSwitch]=useState(false);   // 전환 단추를 눌렀는데 문제 풀이 중이라 확인 모달을 거치는 중
  const SAVE_KEY='yakHakSavedSession_'+userData.name;
  const savedInfo=(()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY));}catch{return null;}})();
  const goResume=()=>{setResumeReq(true);setTab('practice');};
  const switchTarget=quickSwitchTarget(userData.name);   // 등록된 짝 계정이 있을 때만 전환 단추가 보인다
  const handleSwitchClick=()=>{
    if(sessionActive&&tab==='practice'){setPendingSwitch(true);setShowNavModal(true);}
    else onSwitchUser(switchTarget);
  };

  /* 다른 탭(좌표10·기하학·모의고사·숙제)에서 한 묶음을 끝까지 풀어 기록이 새로 생기면,
     저장돼 있던 하던 공부는 그 기록으로 '풀림' 처리한다 — 알림을 무시하고 지금 문제를 계속 푼 경우 */
  const onUpdate=upd=>{
    const newLog=upd&&Array.isArray(upd.logs)&&upd.logs[0]&&upd.logs[0]!==(userData.logs||[])[0];
    if(newLog&&localStorage.getItem(SAVE_KEY)){
      localStorage.removeItem(SAVE_KEY);setHasSavedSession(false);setBarCollapsed(false);
      if(tab!=='practice'){setToast('✅ 하던 공부는 방금 푼 기록으로 정리했어요');setTimeout(()=>setToast(''),2800);}
    }
    onUpdateRaw(upd);
  };
  const TABS=[{k:'home',icon:'🏠',lbl:'홈'},{k:'practice',icon:'✏️',lbl:'문제풀기'},{k:'coord',icon:'📍',lbl:'좌표10'},{k:'geometry',icon:'📐',lbl:'기하학'},{k:'exam',icon:'📝',lbl:'모의고사'},{k:'history',icon:'📅',lbl:'기록'}];

  const handleSessionActive=(active)=>{
    setSessionActive(active);
    if(!active) setHasSavedSession(!!localStorage.getItem('yakHakSavedSession_'+userData.name));
  };

  const handleTabClick=(k)=>{
    if(k===tab)return;
    if(sessionActive&&tab==='practice'){
      setPendingTab(k);
      setShowNavModal(true);
    } else {
      setTab(k);
    }
  };

  // ── 접속 heartbeat: 30초마다 Firestore onlineStatus 갱신 ──
  useEffect(()=>{
    if(userData.role==='admin')return;
    const updateOnline=()=>{
      db.collection('onlineStatus').doc(userData.name).set({
        name:userData.name,
        lastSeen:new Date(),
        ts:Date.now()
      }).catch(()=>{});
    };
    updateOnline();
    const hb=setInterval(updateOnline,30000);
    const clearOnline=()=>{
      db.collection('onlineStatus').doc(userData.name).delete().catch(()=>{});
    };
    window.addEventListener('beforeunload',clearOnline);
    return()=>{clearInterval(hb);clearOnline();window.removeEventListener('beforeunload',clearOnline);};
  },[userData.name,userData.role]);

  // 학생 본인의 피드백 불러오기 및 안읽음 알림 체크
  useEffect(()=>{
    const fetchFb = async () => {
      try {
        const snap = await db.collection('feedback').where('studentName','==',userData.name).get();
        let arr = [];
        snap.forEach(d=>arr.push({id:d.id, ...d.data()}));
        arr.sort((a,b)=> {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        setFeedbacks(arr);
        // 안읽은 피드백이 하나라도 있으면 모달 띄우기
        if(arr.some(f => !f.read)) setShowFbModal(true);
      } catch(e) {}
    };
    fetchFb();
  },[userData.name]);

  const deleteFeedback=async(id)=>{
    if(!confirm('이 피드백을 삭제하시겠어요?'))return;
    try{
      await db.collection('feedback').doc(id).delete();
      setFeedbacks(prev=>prev.filter(f=>f.id!==id));
    }catch(e){alert('삭제 실패');}
  };

  // 확인 버튼 누르면 모두 읽음 처리
  const markAllAsRead = async () => {
    const unreads = feedbacks.filter(f => !f.read);
    for(let f of unreads) {
      await db.collection('feedback').doc(f.id).set({read: true}, {merge:true});
    }
    setFeedbacks(prev => prev.map(f => ({...f, read:true})));
    setShowFbModal(false);
  };

  if(activeHomework){
    return<HomeworkSession homework={activeHomework} userData={userData} onUpdate={onUpdate} onDone={()=>setActiveHomework(null)}/>;
  }

  return(<div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50 relative" style={{overflowX:'hidden',width:'100%',maxWidth:'100vw'}}>
    <div className="sticky top-0 z-20">
    <header className="bg-white border-b px-4 py-3 flex items-center gap-2 shadow-sm">
      <div className="text-2xl flex-shrink-0">🎓</div>
      <h1 className="text-lg font-black text-gray-800 flex-1 min-w-0 truncate">태청야학 수학반</h1>
      <span className="text-sm font-bold text-gray-500 truncate max-w-[64px] flex-shrink">{userData.name}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {switchTarget&&<button onClick={handleSwitchClick} title={`${switchTarget} 계정으로 전환`}
          className="flex items-center text-xs font-black px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 active:scale-95 transition-transform whitespace-nowrap">
          👨‍🏫 전환
        </button>}
        <NumSizeToggle/>
        <DarkToggle/>
        <button onClick={onLogout} className="text-xs text-gray-400 font-bold px-2 py-1 rounded-lg bg-gray-100 whitespace-nowrap">로그아웃</button>
      </div>
    </header>
    {/* 하던 공부 알림 (홈·문제풀기 탭은 화면 안에 따로 안내가 있어서 뺀다) */}
    {hasSavedSession&&tab!=='practice'&&tab!=='home'&&
      <SavedSessionBar saved={savedInfo} collapsed={barCollapsed} onCollapse={()=>setBarCollapsed(true)}
        onExpand={()=>setBarCollapsed(false)} onResume={goResume}/>}
    </div>
    {toast&&<div className="fixed top-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg fade-in">{toast}</div></div>}
    <div className="flex-1 overflow-auto scroll-body">
      {tab==='home'&&<HomeTab userData={userData} onUpdate={onUpdate} onGoPractice={()=>setTab('practice')} onResumeSaved={goResume} hasSavedSession={hasSavedSession} onStartHomework={setActiveHomework}/>}
      {tab==='practice'&&<DailyPracticeTab userData={userData} onUpdate={onUpdate} onSessionActive={handleSessionActive}
        autoResume={resumeReq} onAutoResumed={()=>setResumeReq(false)}/>}
      {tab==='coord'&&<CoordDailyTab userData={userData} onUpdate={onUpdate}/>}
      {tab==='geometry'&&<GeometryTab userData={userData} onUpdate={onUpdate}/>}
      {tab==='exam'&&<MockExamTab userData={userData} onUpdate={onUpdate}/>}
      {/* 기록 탭으로 가져온 피드백 데이터를 넘겨줌 */}
      {tab==='history'&&<HistoryTab userData={userData} feedbacks={feedbacks} onDeleteFeedback={deleteFeedback}/>}
    </div>

    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 max-w-lg mx-auto">
      <div className="flex">{TABS.map(t=><button key={t.k} onClick={()=>handleTabClick(t.k)} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${tab===t.k?'text-indigo-600':'text-gray-400'}`}><span className="text-2xl">{t.icon}</span><span className="text-xs font-bold">{t.lbl}</span></button>)}</div>
      <div className="text-center text-[10px] text-gray-300 font-semibold pb-1 tracking-wide">Made by 소명 🎓</div>
    </nav>

    {/* 탭 이동 시 이탈 확인 모달 */}
    {showNavModal&&(
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm fade-in">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">📚</div>
            <div className="text-xl font-black text-gray-800">문제 풀이 중이에요!</div>
            <div className="text-sm text-gray-500 mt-2">다른 화면으로 이동하시겠어요?</div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={()=>{
              const d=window.__yakHakActiveSession;
              if(d){localStorage.setItem('yakHakSavedSession_'+userData.name,JSON.stringify(d));setHasSavedSession(true);setBarCollapsed(false);}
              setShowNavModal(false);setSessionActive(false);
              if(pendingSwitch){setPendingSwitch(false);onSwitchUser(switchTarget);}else setTab(pendingTab);
            }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">
              현재 상태 저장하기 💾
            </button>
            <button onClick={()=>{
              setShowNavModal(false);setSessionActive(false);
              if(pendingSwitch){setPendingSwitch(false);onSwitchUser(switchTarget);}else setTab(pendingTab);
            }} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-lg active:scale-95 transition-all">
              그만하기
            </button>
            <button onClick={()=>{setShowNavModal(false);setPendingSwitch(false);}}
              className="w-full py-3 text-gray-400 font-bold text-sm">
              계속 풀기
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 피드백 도착 알림 모달 */}
    {showFbModal && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col fade-in">
          <div className="text-center mb-4 flex-shrink-0">
            <div className="text-5xl mb-2">💌</div>
            <div className="text-xl font-black text-gray-800">선생님의 피드백 도착!</div>
            <div className="text-sm text-gray-500 mt-1">새로운 피드백을 확인해보세요.</div>
          </div>
          <div className="space-y-3 mb-6 overflow-y-auto flex-1 p-1">
            {feedbacks.filter(f => !f.read).map(fb => (
              <div key={fb.id} className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 shadow-sm">
                {fb.relatedLog && <div className="text-xs text-indigo-600 font-black mb-2 bg-white px-2.5 py-1.5 rounded-lg inline-block border border-indigo-100">📋 {fb.relatedLog}</div>}
                <div className="text-gray-800 font-bold text-base leading-relaxed">{fb.message}</div>
              </div>
            ))}
          </div>
          <button onClick={markAllAsRead} className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl active:scale-95 transition-all flex-shrink-0">확인했습니다 ✓</button>
        </div>
      </div>
    )}
  </div>);
}
