// === js/app.js ===
/* --------------------------------------------------------------------
   앱 진입점
   로그인 상태에 따라 학생/선생님 대시보드를 띄운다
   -------------------------------------------------------------------- */

/* ===== APP ===== */
function App(){
  const[user,setUser]=useState(null);const[checking,setChecking]=useState(true);
  const[showSplash,setShowSplash]=useState(false);
  const[netError,setNetError]=useState(false);   // 통신 실패 — 로그인 상태는 그대로 두고 다시 시도하게 한다

  /* 자정이 지났으면 오늘 기록을 비우고, 주가 바뀌었으면 도장판을 넘긴다.
     첫 로드 · 재시도 · 계정 전환이 모두 같은 전처리를 거치도록 한 군데에 모았다. */
  const freshen=d0=>{
    const d={...d0};
    const curMon=getKSTMonday();
    if(d.lastDate!==todayStr()){d.todayLessons=0;d.todayCorrect=0;d.todayWrong=0;d.lastDate=todayStr();}
    if(!d.currentWeekStart)d.currentWeekStart=curMon;
    else if(d.currentWeekStart!==curMon){
      if(!d.stampArchive)d.stampArchive=[];
      const oldDates=(d.activeDates||[]).filter(x=>x>=d.currentWeekStart&&x<curMon);
      if(oldDates.length>0)d.stampArchive.unshift({weekStart:d.currentWeekStart,activeDates:oldDates});
      d.currentWeekStart=curMon;
    }
    d.lastLoginAt=`${todayStr()} ${timeStr()}`;
    return d;
  };

  /* 선생님이 이름을 바꾼 학생은 저장된 옛 이름으로 찾아도 새 계정이 온다 (db.js resolveUser).
     이때 저장해 둔 이름과 '하던 공부' 저장본을 새 이름으로 옮겨서, 다시 로그인하지 않아도 되게 한다. */
  const adoptName=(savedName,d)=>{
    if(!d||!d.name||d.name===savedName)return;
    try{
      localStorage.setItem('yakHakUser2',JSON.stringify({name:d.name}));
      const saved=localStorage.getItem('yakHakSavedSession_'+savedName);
      if(saved){localStorage.setItem('yakHakSavedSession_'+d.name,saved);localStorage.removeItem('yakHakSavedSession_'+savedName);}
    }catch(e){}
  };

  const restore=React.useCallback(async()=>{
    const saved=localStorage.getItem('yakHakUser2');
    if(!saved){setChecking(false);return;}
    setNetError(false);setChecking(true);
    var savedName='';
    try{savedName=JSON.parse(saved).name;}catch(e){setChecking(false);return;}
    try{
      const data=await loadUser(savedName,{throwOnError:true});
      if(!data){setChecking(false);return;}   // 계정이 정말 없어졌을 때만 로그인 화면으로
      adoptName(savedName,data);
      const d=freshen(data);
      saveUser(d);setUser(d);
      // 자동 로그인: 이번 탭 세션에 아직 스플래시를 안 봤을 때만 노출
      if(!sessionStorage.getItem('yakHakSplashDone'))setShowSplash(true);
    }catch(e){
      // 인터넷이 끊겼을 뿐이므로 로그아웃시키지 않는다 — 다시 시도 화면을 보여 준다
      setNetError(true);
    }
    setChecking(false);
  },[]);

  useEffect(()=>{restore()},[restore]);

  // 명시적 로그인: 마찬가지로 세션 플래그 확인
  const login=data=>{localStorage.setItem('yakHakUser2',JSON.stringify({name:data.name}));setUser(data);if(!sessionStorage.getItem('yakHakSplashDone'))setShowSplash(true);};
  // 로그아웃 시 플래그 초기화 → 다음 접속 때 스플래시 다시 보임
  const logout=()=>{localStorage.removeItem('yakHakUser2');setUser(null);setShowSplash(false);sessionStorage.removeItem('yakHakSplashDone');};
  const update=newData=>{setUser(newData)};

  /* 관리자 빠른 전환 (QUICK_SWITCH_PAIRS) : PIN 입력 없이 이름만 바꿔서 다시 불러온다.
     자정이 지났으면 오늘 기록을 초기화하는 등 초기 로드/로그인과 같은 전처리를 거친다.
     스플래시는 다시 띄우지 않는다 — 같은 사람이 화면만 바꾸는 것이지 새로 접속하는 게 아니라서. */
  const switchUser=async(name)=>{
    setChecking(true);
    try{
      const data=await loadUser(name);
      if(!data){alert(`'${name}' 계정을 찾을 수 없습니다. 먼저 그 이름으로 가입해 주세요.`);setChecking(false);return;}
      const d=freshen(data);
      await saveUser(d);
      localStorage.setItem('yakHakUser2',JSON.stringify({name:d.name}));
      setUser(d);
    }catch(e){alert('전환 실패. 인터넷 연결을 확인해주세요.');}
    setChecking(false);
  };
  // 스플래시 닫힐 때 이번 세션에 본 것으로 기록 (새로고침·탭 이동 때 재노출 방지)
  const handleSplashDone=()=>{sessionStorage.setItem('yakHakSplashDone','1');setShowSplash(false);};

  if(checking)return<div className="min-h-screen flex items-center justify-center text-2xl font-black text-indigo-600">🎓 불러오는 중...</div>;
  /* 통신 실패 : 로그인 상태(localStorage)는 그대로 두고 다시 시도만 하게 한다 */
  if(netError&&!user)return(<div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
    <div className="text-5xl">📡</div>
    <div className="text-xl font-black text-gray-700">인터넷 연결을 확인해주세요</div>
    <div className="text-sm text-gray-500 font-semibold">로그인은 그대로 있어요. 연결되면 바로 이어집니다.</div>
    <button onClick={restore} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black">다시 시도</button>
  </div>);
  if(!user)return<AuthScreen onLogin={login}/>;
  const main = user.role==='admin'
    ? <TeacherDashboard userData={user} onLogout={logout} onUpdate={update} onSwitchUser={switchUser}/>
    : <StudentDashboard userData={user} onLogout={logout} onUpdate={update} onSwitchUser={switchUser}/>;
  return(<>{main}{showSplash&&<QuoteSplash onDone={handleSplashDone}/>}</>);
}

var root=ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
