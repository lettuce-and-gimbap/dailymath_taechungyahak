function DarkToggle({className}){
  const[dark,setDark]=React.useState(()=>typeof document!=='undefined'&&document.body.classList.contains('dark'));
  const toggle=()=>{
    const next=!dark;
    setDark(next);
    document.body.classList.toggle('dark',next);
    try{localStorage.setItem('yakHakTheme',next?'dark':'light');}catch(e){}
  };
  return(<button onClick={toggle} aria-label="다크 모드 전환" title="다크/라이트 모드" className={`dark-toggle ${className||''}`}>{dark?'☀️':'🌙'}</button>);
}

function AuthScreen({onLogin}){
  const[name,setName]=useState('');const[pin,setPin]=useState('');const[pinC,setPinC]=useState('');
  const[isReg,setIsReg]=useState(false);const[err,setErr]=useState('');const[loading,setLoading]=useState(false);
  const handle=async()=>{
    if(!name.trim()||pin.length!==4){setErr('이름과 4자리 PIN을 모두 입력해주세요.');return}
    setLoading(true);setErr('');
    try{
      const doc=await db.collection('users').doc(name.trim()).get();
      if(isReg){
        if(pin!==pinC){setErr('PIN 번호가 서로 다릅니다.');setLoading(false);return}
        if(doc.exists){setErr('이미 등록된 이름입니다. 로그인을 해주세요.');setLoading(false);return}
        const isAdmin=ADMIN_NAMES.includes(name.trim());
        const userData={name:name.trim(),pin,role:isAdmin?'admin':'student',createdAt:todayStr(),lastLoginAt:`${todayStr()} ${timeStr()}`,totalLessons:0,todayLessons:0,todayCorrect:0,todayWrong:0,lastDate:todayStr(),activeDates:[],logs:[],currentWeekStart:getKSTMonday(),stampArchive:[],goal:3,ver:0,rangeMin:10,rangeMax:99,divRangeMin:10,divRangeMax:99};
        await db.collection('users').doc(name.trim()).set(userData);
        onLogin(userData);
      }else{
        if(!doc.exists){setErr('등록되지 않은 이름입니다. 가입하기를 눌러주세요.');setLoading(false);return}
        const data=doc.data();
        if(data.pin!==pin){setErr('PIN 번호가 올바르지 않습니다.');setLoading(false);return}
        // Check new day
        const data2={...data};if(data2.lastDate!==todayStr()){data2.todayLessons=0;data2.todayCorrect=0;data2.todayWrong=0;data2.lastDate=todayStr()}
	data2.lastLoginAt=`${todayStr()} ${timeStr()}`; // 로그인 시 항상 갱신
        const curMon=getKSTMonday();if(!data2.currentWeekStart)data2.currentWeekStart=curMon;
        else if(data2.currentWeekStart!==curMon){if(!data2.stampArchive)data2.stampArchive=[];const oldDates=(data2.activeDates||[]).filter(d=>d>=data2.currentWeekStart&&d<curMon);if(oldDates.length>0)data2.stampArchive.unshift({weekStart:data2.currentWeekStart,activeDates:oldDates});data2.currentWeekStart=curMon}
        await saveUser(data2);onLogin(data2);
      }
    }catch(e){setErr('서버 연결 오류. 인터넷 연결을 확인해주세요.')}
    setLoading(false);
  };
  return(<div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 flex items-center justify-center p-5">
    <div className="fixed top-4 right-4 z-30"><DarkToggle/></div>
    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
      <div className="text-center mb-8"><div className="text-7xl mb-3">🎓</div>
        <h1 className="text-3xl font-black text-gray-800">태청야학 수학반</h1>
        <p className="text-gray-500 text-base mt-2">배움엔 나이가 없어요!</p></div>
      <div className="space-y-5">
        <div><label className="block text-lg font-bold text-gray-700 mb-2">이름</label>
          <input type="text" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-xl font-bold focus:border-blue-400 outline-none" placeholder="예: 홍길동"/></div>
        <div><label className="block text-lg font-bold text-gray-700 mb-2">PIN 번호 (숫자 4자리)</label>
          <input type="number" value={pin} onChange={e=>setPin(e.target.value.slice(0,4))} onKeyDown={e=>e.key==='Enter'&&handle()}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl font-black text-center tracking-widest focus:border-blue-400 outline-none" placeholder="0 0 0 0"/></div>
        {isReg&&<div><label className="block text-lg font-bold text-gray-700 mb-2">PIN 확인</label>
          <input type="number" value={pinC} onChange={e=>setPinC(e.target.value.slice(0,4))} onKeyDown={e=>e.key==='Enter'&&handle()}
            className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl font-black text-center tracking-widest focus:border-blue-400 outline-none" placeholder="0 0 0 0"/></div>}
        {err&&<div className="bg-red-50 text-red-600 rounded-2xl px-5 py-3 text-base font-bold border border-red-200">{err}</div>}
        <button onClick={handle} disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl text-xl font-black shadow-lg active:scale-95 transition-transform">
          {loading?'처리 중...':(isReg?'✅ 가입하기':'→ 로그인')}</button>
        <button onClick={()=>{setIsReg(!isReg);setErr('')}} className="w-full py-3 text-gray-500 font-bold text-base">
          {isReg?'이미 계정이 있어요 → 로그인':'처음이에요 → 새로 가입하기'}</button>
      </div>
    </div>
  </div>);
}

/* ===== STREAK CALCULATOR ===== */
