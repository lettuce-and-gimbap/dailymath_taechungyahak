// === js/app.js ===
/* --------------------------------------------------------------------
   앱 진입점
   로그인 상태에 따라 학생/선생님 대시보드를 띄운다
   -------------------------------------------------------------------- */

/* ===== APP ===== */
function App(){
  const[user,setUser]=useState(null);const[checking,setChecking]=useState(true);
  const[showSplash,setShowSplash]=useState(false);

  useEffect(()=>{
    const saved=localStorage.getItem('yakHakUser2');
    if(saved){const{name}=JSON.parse(saved);loadUser(name).then(data=>{if(data){const d={...data};const curMon=getKSTMonday();if(d.lastDate!==todayStr()){d.todayLessons=0;d.todayCorrect=0;d.todayWrong=0;d.lastDate=todayStr()}if(!d.currentWeekStart)d.currentWeekStart=curMon;else if(d.currentWeekStart!==curMon){if(!d.stampArchive)d.stampArchive=[];const oldDates=(d.activeDates||[]).filter(x=>x>=d.currentWeekStart&&x<curMon);if(oldDates.length>0)d.stampArchive.unshift({weekStart:d.currentWeekStart,activeDates:oldDates});d.currentWeekStart=curMon}d.lastLoginAt=`${todayStr()} ${timeStr()}`;saveUser(d);setUser(d);
      // 자동 로그인: 이번 탭 세션에 아직 스플래시를 안 봤을 때만 노출
      if(!sessionStorage.getItem('yakHakSplashDone'))setShowSplash(true);
    }setChecking(false)})}else setChecking(false);
  },[]);

  // 명시적 로그인: 마찬가지로 세션 플래그 확인
  const login=data=>{localStorage.setItem('yakHakUser2',JSON.stringify({name:data.name}));setUser(data);if(!sessionStorage.getItem('yakHakSplashDone'))setShowSplash(true);};
  // 로그아웃 시 플래그 초기화 → 다음 접속 때 스플래시 다시 보임
  const logout=()=>{localStorage.removeItem('yakHakUser2');setUser(null);setShowSplash(false);sessionStorage.removeItem('yakHakSplashDone');};
  const update=newData=>{setUser(newData)};
  // 스플래시 닫힐 때 이번 세션에 본 것으로 기록 (새로고침·탭 이동 때 재노출 방지)
  const handleSplashDone=()=>{sessionStorage.setItem('yakHakSplashDone','1');setShowSplash(false);};

  if(checking)return<div className="min-h-screen flex items-center justify-center text-2xl font-black text-indigo-600">🎓 불러오는 중...</div>;
  if(!user)return<AuthScreen onLogin={login}/>;
  const main = user.role==='admin'
    ? <TeacherDashboard userData={user} onLogout={logout} onUpdate={update}/>
    : <StudentDashboard userData={user} onLogout={logout} onUpdate={update}/>;
  return(<>{main}{showSplash&&<QuoteSplash onDone={handleSplashDone}/>}</>);
}

var root=ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
