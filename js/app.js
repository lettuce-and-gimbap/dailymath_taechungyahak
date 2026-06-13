function QuoteSplash({onDone}){
  const DURATION=4500;
  // 접속할 때마다 다음 글귀가 나오도록 인덱스 회전
  const startIdx=React.useRef((()=>{
    let i=0;try{i=parseInt(localStorage.getItem('yakHakQuoteIdx')||'0',10)||0;}catch(e){}
    i=((i%LEARN_QUOTES.length)+LEARN_QUOTES.length)%LEARN_QUOTES.length;
    try{localStorage.setItem('yakHakQuoteIdx',String((i+1)%LEARN_QUOTES.length));}catch(e){}
    return i;
  })()).current;
  const quoteEntry=LEARN_QUOTES[startIdx];
  const quote=typeof quoteEntry==='string'?quoteEntry:quoteEntry.text;
  const quoteAuthor=typeof quoteEntry==='string'?'태청야학 수학반':quoteEntry.author;
  const bg=QUOTE_BGS[startIdx%QUOTE_BGS.length];
  const cardRef=React.useRef();
  const[pct,setPct]=React.useState(100);
  const[paused,setPaused]=React.useState(false);
  const[saving,setSaving]=React.useState(false);
  const elapsedRef=React.useRef(0);
  const lastRef=React.useRef(Date.now());
  const doneRef=React.useRef(false);

  React.useEffect(()=>{
    lastRef.current=Date.now();
    let raf;
    const tick=()=>{
      const now=Date.now();
      if(!paused){
        elapsedRef.current += now-lastRef.current;
        const p=Math.max(0,100-(elapsedRef.current/DURATION)*100);
        setPct(p);
        if(elapsedRef.current>=DURATION&&!doneRef.current){doneRef.current=true;onDone();return;}
      }
      lastRef.current=now;
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[paused]);

  const finish=()=>{if(!doneRef.current){doneRef.current=true;onDone();}};

  const capture=async()=>{
    if(typeof html2canvas==='undefined'){alert('스크린샷으로 간직해 주세요!');return;}
    setSaving(true);setPaused(true);
    try{
      const canvas=await html2canvas(cardRef.current,{backgroundColor:null,scale:2,useCORS:true});
      const link=document.createElement('a');
      link.download='태청야학_오늘의_글귀.png';
      link.href=canvas.toDataURL('image/png');
      link.click();
    }catch(e){alert('이미지 저장에 실패했어요. 화면을 스크린샷으로 간직해 주세요!');}
    setSaving(false);setPaused(false);
  };

  const stop=e=>{e.stopPropagation();};

  return(
    <div
      onPointerDown={()=>setPaused(true)}
      onPointerUp={()=>setPaused(false)}
      onPointerLeave={()=>setPaused(false)}
      onPointerCancel={()=>setPaused(false)}
      style={{position:'fixed',inset:0,zIndex:9999,background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px',touchAction:'none',userSelect:'none'}}>
      {/* 진행 바 */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:'rgba(255,255,255,0.25)'}}>
        <div style={{height:'100%',width:pct+'%',background:'rgba(255,255,255,0.9)',transition:'width .1s linear'}}/>
      </div>

      {/* 글귀 카드 (캡쳐 대상) */}
      <div ref={cardRef} style={{background:bg,borderRadius:'28px',padding:'40px 28px',maxWidth:'440px',width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
        <div style={{fontSize:'40px',marginBottom:'18px'}}>🎓</div>
        <div style={{fontSize:'15px',fontWeight:800,color:'rgba(255,255,255,0.85)',letterSpacing:'0.05em',marginBottom:'18px'}}>오늘의 배움 한 줄</div>
        <p style={{fontSize:'24px',lineHeight:1.55,fontWeight:900,color:'#fff',wordBreak:'keep-all',textShadow:'0 2px 12px rgba(0,0,0,0.22)',margin:0}}>{quote}</p>
        <div style={{marginTop:'26px',fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,0.8)'}}>— {quoteAuthor} —</div>
      </div>

      {/* 안내 + 버튼 (캡쳐 영역 밖) */}
      <div style={{marginTop:'22px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',width:'100%',maxWidth:'440px'}}>
        <div style={{fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,0.9)',height:'18px'}}>
          {paused?'⏸ 잠시 멈췄어요 (손을 떼면 다시 진행돼요)':'화면을 꾹 누르면 멈춰서 더 오래 볼 수 있어요'}
        </div>
        <div style={{display:'flex',gap:'10px',width:'100%'}}>
          <button onPointerDown={stop} onClick={capture} disabled={saving}
            style={{flex:1,padding:'14px',borderRadius:'16px',background:'rgba(255,255,255,0.95)',color:'#444',fontWeight:900,fontSize:'15px'}}>
            {saving?'저장 중...':'📸 글귀 간직하기'}
          </button>
          <button onPointerDown={stop} onClick={finish}
            style={{flex:1,padding:'14px',borderRadius:'16px',background:'rgba(0,0,0,0.22)',color:'#fff',fontWeight:900,fontSize:'15px'}}>
            들어가기 →
          </button>
        </div>
      </div>
    </div>
  );
}

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
