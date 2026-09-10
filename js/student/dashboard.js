// === js/student/dashboard.js ===
/* --------------------------------------------------------------------
   학생 대시보드
   학생 화면의 탭 묶음과 하단 네비게이션
   -------------------------------------------------------------------- */

function StudentDashboard({userData,onLogout,onUpdate}){
  const[tab,setTab]=useState('home');
  const[feedbacks,setFeedbacks]=useState([]);
  const[showFbModal,setShowFbModal]=useState(false);
  const[sessionActive,setSessionActive]=useState(false);
  const[showNavModal,setShowNavModal]=useState(false);
  const[pendingTab,setPendingTab]=useState(null);
  const[hasSavedSession,setHasSavedSession]=useState(()=>!!localStorage.getItem('yakHakSavedSession_'+userData.name));
  const[activeHomework,setActiveHomework]=useState(null);
  const TABS=[{k:'home',icon:'🏠',lbl:'홈'},{k:'practice',icon:'✏️',lbl:'문제풀기'},{k:'geometry',icon:'📐',lbl:'기하학'},{k:'exam',icon:'📝',lbl:'모의고사'},{k:'history',icon:'📅',lbl:'기록'}];

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
    <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
      <div className="text-2xl">🎓</div>
      <h1 className="text-lg font-black text-gray-800 flex-1">태청야학 수학반</h1>
      <span className="text-sm font-bold text-gray-500">{userData.name}</span>
      <DarkToggle/>
      <button onClick={onLogout} className="text-xs text-gray-400 font-bold px-2 py-1 rounded-lg bg-gray-100">로그아웃</button>
    </header>
    <div className="flex-1 overflow-auto scroll-body">
      {tab==='home'&&<HomeTab userData={userData} onUpdate={onUpdate} onGoPractice={()=>setTab('practice')} hasSavedSession={hasSavedSession} onStartHomework={setActiveHomework}/>}
      {tab==='practice'&&<DailyPracticeTab userData={userData} onUpdate={onUpdate} onSessionActive={handleSessionActive}/>}
      {tab==='geometry'&&<GeometryTab userData={userData} onUpdate={onUpdate}/>}
      {tab==='exam'&&<MockExamTab userData={userData} onUpdate={onUpdate}/>}
      {/* 기록 탭으로 가져온 피드백 데이터를 넘겨줌 */}
      {tab==='history'&&<HistoryTab userData={userData} feedbacks={feedbacks} onDeleteFeedback={deleteFeedback}/>}
    </div>
    {/* 진행 중인 저장 세션 플로팅 팝업 (홈/풀기 탭 제외) */}
    {hasSavedSession&&tab!=='practice'&&tab!=='home'&&(
      <div className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-30 max-w-lg mx-auto pointer-events-none">
        <button onClick={()=>setTab('practice')} className="pointer-events-auto bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl font-black text-sm flex items-center gap-2 active:scale-95 transition-all">
          📚 하던 공부가 있어요! 이어서 하시겠어요? →
        </button>
      </div>
    )}

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
              if(d){localStorage.setItem('yakHakSavedSession_'+userData.name,JSON.stringify(d));setHasSavedSession(true);}
              setShowNavModal(false);setSessionActive(false);setTab(pendingTab);
            }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">
              현재 상태 저장하기 💾
            </button>
            <button onClick={()=>{
              setShowNavModal(false);setSessionActive(false);setTab(pendingTab);
            }} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-lg active:scale-95 transition-all">
              그만하기
            </button>
            <button onClick={()=>setShowNavModal(false)}
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
