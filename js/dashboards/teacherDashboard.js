function TeacherDashboard({userData,onLogout,onUpdate}){
  const[tab,setTab]=useState('analysis');
  const TABS=[{k:'analysis',icon:'📊',lbl:'학생현황'},{k:'worksheets',icon:'📝',lbl:'학습지'},{k:'feedback',icon:'💬',lbl:'피드백'}];
  return(<div className="teacher-ui flex flex-col min-h-screen max-w-2xl mx-auto bg-gray-50" style={{overflowX:'hidden',width:'100%',maxWidth:'100vw'}}>
    <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-md">
      <div className="text-2xl">👨‍🏫</div>
      <h1 className="text-lg font-black flex-1">선생님 대시보드</h1>
      <span className="text-sm font-bold opacity-80">{userData.name}</span>
      <DarkToggle/>
      <button onClick={onLogout} className="text-xs text-white/70 font-bold px-2 py-1 rounded-lg bg-white/10">로그아웃</button>
    </header>
    <div className="flex-1 overflow-auto scroll-body">
      {tab==='analysis'&&<StudentAnalysisTab/>}
      {tab==='worksheets'&&<WorksheetTab/>}
      {tab==='feedback'&&<FeedbackTab/>}
    </div>
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 max-w-2xl mx-auto">
      <div className="flex">{TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} className={`flex-1 flex flex-col items-center py-3 gap-1 ${tab===t.k?'text-indigo-600':'text-gray-400'}`}>
        <span className="text-2xl">{t.icon}</span><span className="text-xs font-bold">{t.lbl}</span>
      </button>)}</div>
    </nav>
  </div>);
}

function StudentAnalysisTab(){
  const[students,setStudents]=useState([]);
  const[loading,setLoading]=useState(false);
  const[selected,setSelected]=useState(null);
  const[onlineMap,setOnlineMap]=useState({}); // {학생이름: lastSeen timestamp}

  // 접속중 실시간 구독 (30초 이상 업데이트 없으면 오프라인 간주)
  useEffect(()=>{
    const unsub=db.collection('onlineStatus').onSnapshot(snap=>{
      const now=Date.now();
      const map={};
      snap.forEach(d=>{const ts=d.data().ts;if(ts&&now-ts<90000)map[d.id]=ts;});
      setOnlineMap(map);
    },()=>{});
    return()=>unsub();
  },[]);
  const[folders,setFolders]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('teacherFolders')||'[{"id":"all","name":"폴더없음","ids":[]}]')}
    catch{return[{id:'all',name:'폴더없음',ids:[]}]}
  });
  const[activeFolder,setActiveFolder]=useState('all');
  const[editFolderId,setEditFolderId]=useState(null);
  const[pickerOpen,setPickerOpen]=useState(null);  // 열린 학생 id

  const saveFolders=f=>{setFolders(f);localStorage.setItem('teacherFolders',JSON.stringify(f));};
  const customFolders=folders.filter(f=>f.id!=='all');

  const addFolder=()=>{
    const id='f'+Date.now();
    saveFolders([...folders,{id,name:'새 폴더',ids:[]}]);
    setEditFolderId(id);
  };
  const renameFolder=(id,name)=>{saveFolders(folders.map(f=>f.id===id?{...f,name:name||f.name}:f));setEditFolderId(null);};

  const deleteFolder=(fid)=>{
    if(!confirm('이 폴더를 삭제할까요?\n안에 있던 학생들은 폴더없음으로 돌아갑니다.'))return;
    saveFolders(folders.filter(f=>f.id!==fid));
    if(activeFolder===fid)setActiveFolder('all');
  };

  // 단일 폴더 배정 (중복 없음) — fid=null 이면 폴더없음
  const assignFolder=(fid,sid)=>{
    saveFolders(folders.map(f=>{
      if(f.id==='all')return f;
      if(f.id===fid)return{...f,ids:f.ids.includes(sid)?f.ids.filter(x=>x!==sid):[...f.ids,sid]};
      return{...f,ids:f.ids.filter(x=>x!==sid)}; // 다른 폴더에서 제거
    }));
  };
  const clearFolder=(sid)=>{
    saveFolders(folders.map(f=>f.id==='all'?f:{...f,ids:f.ids.filter(x=>x!==sid)}));
  };

  const deleteStudent=async(s)=>{
    if(!confirm(`${s.name||s.id} 학생을 삭제할까요?
삭제하면 데이터가 모두 사라지고
새로 회원가입해야 합니다.`))return;
    try{
      await db.collection('users').doc(s.id).delete();
      clearFolder(s.id);
      setStudents(prev=>prev.filter(x=>x.id!==s.id));
    }catch(e){alert('삭제 실패: '+e.message);}
  };

  const load=async()=>{
    setLoading(true);
    try{
      const snap=await db.collection('users').where('role','==','student').get();
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      arr.sort((a,b)=>(b.lastDate||'').localeCompare(a.lastDate||''));
      setStudents(arr);
    }catch(e){alert('데이터 로드 실패.')}
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  if(selected)return<StudentDetail student={selected} onBack={()=>setSelected(null)}/>;

  const curFolder=folders.find(f=>f.id===activeFolder)||folders[0];
  // '폴더없음' 탭: 어느 커스텀 폴더에도 없는 학생
  // 커스텀 폴더 탭: 해당 폴더 ids에 포함된 학생
  const visibleStudents=activeFolder==='all'
    ?students.filter(s=>!customFolders.some(f=>f.ids.includes(s.id)))
    :students.filter(s=>curFolder?.ids.includes(s.id));

  const LIGHT_CLS={'light-red':'bg-red-50 text-red-700 border border-red-200','light-yel':'bg-yellow-50 text-yellow-700 border border-yellow-200','light-grn':'bg-green-50 text-green-700 border border-green-200'};

  return(<div className="p-4 pb-36 space-y-3">
    <div className="flex items-center justify-between mb-2">
      <div className="text-lg font-black text-gray-800">📊 학생 현황</div>
      <button onClick={load} className="text-sm px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold">🔄 새로고침</button>
    </div>

    {/* ── 폴더 탭 ── */}
    <div className="flex gap-2 flex-wrap items-center">
      {/* 폴더없음 (기본) */}
      <button onClick={()=>setActiveFolder('all')}
        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${activeFolder==='all'?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>
        📋 폴더없음 <span className="text-xs opacity-70">({students.filter(s=>!customFolders.some(f=>f.ids.includes(s.id))).length})</span>
      </button>

      {/* 커스텀 폴더 탭 */}
      {customFolders.map(f=>(
        <div key={f.id} className="flex items-center gap-0.5">
          {editFolderId===f.id
            ?<input autoFocus defaultValue={f.name}
                onBlur={e=>renameFolder(f.id,e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&renameFolder(f.id,e.target.value)}
                className="border-2 border-indigo-400 rounded-lg px-2 py-1 text-sm font-bold w-24 outline-none"/>
            :<>
              <button onDoubleClick={()=>setEditFolderId(f.id)} onClick={()=>setActiveFolder(f.id)}
                className={`px-3 py-1.5 rounded-l-xl text-sm font-bold transition-all ${activeFolder===f.id?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>
                📁 {f.name} <span className="text-xs opacity-70">({f.ids.length})</span>
              </button>
              <button onClick={()=>deleteFolder(f.id)}
                className={`px-1.5 py-1.5 rounded-r-xl text-xs font-black transition-all ${activeFolder===f.id?'bg-indigo-400 text-white hover:bg-red-500':'bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
                title="폴더 삭제">✕</button>
            </>
          }
        </div>
      ))}
      <button onClick={addFolder} className="px-3 py-1.5 rounded-xl text-sm font-bold bg-green-100 text-green-700">＋ 폴더 추가</button>
    </div>
    <div className="text-xs text-gray-400">폴더 탭 더블클릭: 이름 수정 · ✕: 폴더 삭제 · 카드 📁: 폴더 배정</div>

    {/* 신호등 안내 */}
    <div className="bg-white rounded-2xl p-4 text-sm border border-gray-200 shadow-sm space-y-1.5">
      <div className="font-bold text-gray-600 mb-2">신호등 기준 안내</div>
      {[['🔴 집중 케어','미접속 5일↑ 또는 정답률 40% 미만'],['🟡 격려 필요','미접속 3~4일 또는 정답률 40~69%'],['🟢 순항 중','2일 이내 접속 & 정답률 70% 이상']].map(([t,d])=><div key={t} className="text-xs text-gray-500">{t}: {d}</div>)}
    </div>

    {loading&&<div className="text-center py-8 text-gray-400 font-bold">분석 중... ⏳</div>}

    {!loading&&visibleStudents.map(s=>{
      const a=analyzeStudent(s);
      const myFolder=customFolders.find(f=>f.ids.includes(s.id));
      const isOpen=pickerOpen===s.id;
      return(
      <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 카드 본문 */}
        <div className="flex items-stretch">
          <button onClick={()=>setSelected(s)} className="flex-1 p-4 text-left">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-black text-gray-800 text-base flex-1">👤 {s.name||s.id}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LIGHT_CLS[a.status.color]}`}>{a.status.icon} {a.status.text}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 font-semibold">
              {onlineMap[s.name||s.id]
                ? <span className="inline-flex items-center gap-1 text-emerald-600 font-black bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 text-[10px]"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"/>접속중</span>
                : <span>마지막 학습: {daysText(a.daysInactive)}</span>
              }
              <span>🕐 {s.lastLoginAt||s.lastDate||'기록 없음'}</span>
              <span>정답률: {a.recentAcc}%</span>
              <span>레슨: {s.logs?.length||0}회</span>
            </div>
          </button>
          {/* 우측 버튼 컬럼 */}
          <div className="flex flex-col border-l border-gray-100">
            <button onClick={e=>{e.stopPropagation();setPickerOpen(isOpen?null:s.id);}}
              className={`flex-1 px-3 text-xs font-bold transition-colors ${isOpen?'bg-indigo-500 text-white':'text-indigo-500 hover:bg-indigo-50'}`}
              title="폴더 배정">
              📁<br/>{myFolder?'변경':'배정'}
            </button>
            <button onClick={e=>{e.stopPropagation();deleteStudent(s);}}
              className="flex-1 px-3 text-xs font-bold text-red-400 hover:bg-red-50 border-t border-gray-100 transition-colors"
              title="학생 삭제">
              🗑️<br/>삭제
            </button>
          </div>
        </div>

        {/* 폴더 피커 */}
        {isOpen&&(
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
            <div className="text-xs font-bold text-gray-500 mb-2">
              현재: {myFolder?<span className="text-indigo-600">📁 {myFolder.name}</span>:<span className="text-gray-400">폴더없음</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {myFolder&&(
                <button onClick={()=>{clearFolder(s.id);setPickerOpen(null);}}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-200 text-gray-600 hover:bg-gray-300">
                  📋 폴더없음으로
                </button>
              )}
              {customFolders.map(f=>(
                <button key={f.id} onClick={()=>{assignFolder(f.id,s.id);setPickerOpen(null);}}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${myFolder?.id===f.id?'bg-indigo-500 text-white':'bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'}`}>
                  📁 {f.name}
                </button>
              ))}
              {customFolders.length===0&&<span className="text-xs text-gray-400">폴더를 먼저 추가하세요</span>}
            </div>
          </div>
        )}
      </div>);})}

    {!loading&&visibleStudents.length===0&&(
      <div className="text-center py-12 text-gray-400 font-bold">
        {activeFolder==='all'?'모든 학생이 폴더에 배정되어 있어요.':'이 폴더에 배정된 학생이 없어요.'}
      </div>
    )}
  </div>);
}

function StudentDetail({student,onBack}){
  const[open,setOpen]=useState(null);
  const[tab,setTab]=useState('overview');
  const[qStats,setQStats]=useState({});
  const[qStatsLoading,setQStatsLoading]=useState(false);
  const[isExporting,setIsExporting]=useState(false);
  const logs=student.logs||[];
  const a=analyzeStudent(student);
  const LIGHT_CLS={'light-red':'bg-red-50 text-red-700 border border-red-200','light-yel':'bg-yellow-50 text-yellow-700 border border-yellow-200','light-grn':'bg-green-50 text-green-700 border border-green-200'};
  const ORD=['①','②','③','④'];

  // ── 4축 분석 엔진 (객관 지표) ──
  const momentum=useMemo(()=>detectMomentum(logs),[logs]);
  const hesitation=useMemo(()=>buildHesitationProfile(logs),[logs]);
  const revision=useMemo(()=>buildRevisionProfile(logs),[logs]);
  const activeTime=useMemo(()=>buildActiveTimeSummary(logs),[logs]);
  const explore=useMemo(()=>buildExploreSummary(student),[student]);
  const relativeMastery=useMemo(()=>buildRelativeMastery(logs,qStats),[logs,qStats]);

  // qStats 비동기 로드 (토픽-레벨 크로스-학생 난이도)
  useEffect(()=>{
    if(logs.length===0)return;
    const hasHashes=logs.some(l=>l.questions?.some(q=>q.qTopicHash));
    if(!hasHashes)return;
    setQStatsLoading(true);
    fetchQStatsForLogs(logs).then(s=>{setQStats(s);setQStatsLoading(false);});
  },[student.name]);

  // 세션 요약
  const summary=useMemo(()=>{
    let totalQ=0,correct=0;
    let feelingCount={easy:0,normal:0,hard:0};
    logs.slice(0,8).forEach(l=>{
      if(l.feeling)feelingCount[l.feeling]=(feelingCount[l.feeling]||0)+1;
      if(!l.questions)return;
      l.questions.forEach(q=>{totalQ++;if(q.isOk)correct++;});
    });
    return{totalQ,rawAcc:totalQ>0?Math.round((correct/totalQ)*100):0,feelingCount};
  },[logs]);

  // 차트 데이터 (순수 정답률)
  const chartData=useMemo(()=>
    logs.slice(0,10).reverse().map((l,i)=>({
      i,acc:calcRawAccuracy(l.questions)??0,date:l.date,type:l.type
    }))
  ,[logs]);

  // 모멘텀 표시
  const momentumInfo=useMemo(()=>{
    if(momentum.trend==='insufficient')return{icon:'🔍',label:'데이터 부족',cls:'text-gray-400',delta:''};
    if(momentum.trend==='rising')return{icon:'📈',label:'성장 중',cls:'text-emerald-700',delta:`+${momentum.delta}%p`};
    if(momentum.trend==='declining')return{icon:'📉',label:'주의 필요',cls:'text-red-600',delta:`${momentum.delta}%p`};
    return{icon:'➡️',label:'안정 유지',cls:'text-blue-600',delta:`±${Math.abs(momentum.delta)}%p`};
  },[momentum]);

  const TABS=[{k:'overview',lbl:'종합'},{k:'behavior',lbl:'행동패턴'},{k:'mastery',lbl:'영역성취'},{k:'sessions',lbl:'세션기록'}];

  // 망설임 분류별 레이블
  const HESI_CFG={
    impulsive:{lbl:'충동적',cls:'bg-orange-100 text-orange-800',tip:'빠름+오답: 문제를 읽지 않고 찍는 패턴'},
    fluent:{lbl:'숙달',cls:'bg-emerald-100 text-emerald-800',tip:'빠름+정답: 개념이 자동화되어 있음'},
    effortful:{lbl:'신중·노력',cls:'bg-blue-100 text-blue-800',tip:'느림+정답: 집중하여 풀고 있음'},
    struggling:{lbl:'어려움',cls:'bg-red-100 text-red-800',tip:'느림+오답: 개념 이해에 어려움'},
    moderate:{lbl:'보통',cls:'bg-gray-100 text-gray-700',tip:'8~30초 내 답변'},
    unknown:{lbl:'미수집',cls:'bg-gray-50 text-gray-400',tip:'이전 버전 로그 (firstClickMs 없음)'}
  };
  // 수정 분류별 레이블
  const REV_CFG={
    fixated:{lbl:'⚠️ 오개념 고착',cls:'bg-red-100 text-red-800',tip:'수정없음+오답: 가장 위험한 패턴. 즉각 교정 필요'},
    confident:{lbl:'✅ 확신 정답',cls:'bg-emerald-100 text-emerald-800',tip:'수정없음+정답: 자신감 있는 정답'},
    uncertain_capable:{lbl:'🔄 능력있지만 불안',cls:'bg-blue-100 text-blue-800',tip:'많이 바꿈+정답: 자기효능감 부족'},
    searching:{lbl:'🔍 개념 탐색',cls:'bg-amber-100 text-amber-800',tip:'많이 바꿈+오답: 아직 개념 형성 중'},
    reconsidered:{lbl:'↩ 재검토',cls:'bg-indigo-50 text-indigo-700',tip:'1회 수정: 정상적 재검토'},
    unknown:{lbl:'미수집',cls:'bg-gray-50 text-gray-400',tip:'이전 버전 로그'}
  };

  // 📄 학생 분석 리포트 PDF 생성 함수 (개선판 v2)
  const exportReport = async (mode='report') => {
    setIsExporting(true);
    const renderArea = document.getElementById('pdf-render-area');
    const jsPDF = window.jspdf.jsPDF;

    // ── 지표 설명 텍스트 ──
    const INDICATOR_DESC = {
      status:   '최근 7일 참여·정답 추이 종합 판정. 순항 중 / 주의 / 위험 3단계.',
      rawAcc:   '최근 풀이 문항 기준 정답 비율. 전체 누적값이 아닌 최근 수행 중심.',
      momentum: '이전 기간 대비 정답률 변화폭. 양수=성장, 음수=하락.',
      activeTime:'세션당 추정 집중 시간. 응답 간격으로 유휴/활동 시간 구분.',
      fixated:  '수정 없이 반복 오답: 오개념이 굳어진 신호. 즉각 개입 필요.',
      selfEff:  '정답인데도 답안을 여러 번 수정: 실력보다 자신감이 낮은 패턴.',
      exploration:'그래프 탐험의 상호작용 기반 자기주도 탐색량. 체류 시간이 아닌 조작 횟수·실질 활동·개념 폭. 성취도가 아닌 참여 지표.',
    };

    // ── 색상 상태 계산 ──
    const statusColor = a.status.color === 'green' ? '#16a34a' : a.status.color === 'red' ? '#dc2626' : '#d97706';
    const accColor    = summary.rawAcc >= 80 ? '#16a34a' : summary.rawAcc >= 60 ? '#d97706' : '#dc2626';
    const momColor    = momentum.trend === 'rising' ? '#16a34a' : momentum.trend === 'declining' ? '#dc2626' : '#6366f1';

    // ── 섹션 헤더 HTML ──
    const sectionHead = (icon, title) =>
      `<div style="display:flex;align-items:center;gap:0;margin:0 0 10px 0;">
        <div style="width:5px;height:28px;background:#6366f1;border-radius:3px 0 0 3px;flex-shrink:0;"></div>
        <div style="background:#eef2ff;flex:1;padding:6px 12px;border-radius:0 6px 6px 0;">
          <span style="font-size:13px;font-weight:900;color:#3730a3;">${icon} ${title}</span>
        </div>
       </div>`;

    // ── 진행 바 HTML ──
    const barHtml = (pct, color='#6366f1', h=8) => {
      const filled = Math.min(Math.max(pct,0),100);
      return `<div style="width:100%;background:#e2e8f0;border-radius:${h}px;height:${h}px;overflow:hidden;">
        <div style="width:${filled}%;background:${color};height:${h}px;border-radius:${h}px;"></div>
      </div>`;
    };

    // ── 뱃지 HTML ──
    const badge = (text, bg, color, border) =>
      `<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:${bg};color:${color};border:1px solid ${border};">${text}</span>`;

    // ── 지표 설명 행 ──
    const descRow = (text) =>
      `<div style="font-size:10px;color:#94a3b8;line-height:1.5;margin-top:3px;">📌 ${text}</div>`;

    // ── 피드백 제언 아이템 ──
    const feedItem = (priority, title, body, borderColor, bg) =>
      `<div style="border-left:4px solid ${borderColor};background:${bg};border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:8px;">
        <div style="font-size:11px;font-weight:900;color:${borderColor};margin-bottom:4px;">${priority}</div>
        <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:3px;">${title}</div>
        <div style="font-size:11px;color:#475569;line-height:1.6;">${body}</div>
       </div>`;

    // ── 페이지 1 HTML ──
    const page1 = `
    <div style="width:794px;min-height:1123px;background:white;padding:36px 42px;box-sizing:border-box;font-family:'Noto Sans KR',sans-serif;color:#1e293b;">

      <!-- 헤더 배너 -->
      <div style="background:linear-gradient(135deg,#3730a3,#6366f1);border-radius:10px;padding:18px 24px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:17px;font-weight:900;color:white;">학생 맞춤형 학습 분석 리포트</div>
          <div style="font-size:11px;color:#c7d2fe;margin-top:3px;">태청야학 수학반 · 출력일: ${new Date().toLocaleDateString('ko-KR')}</div>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;text-align:center;">
          <div style="font-size:20px;font-weight:900;color:white;">${student.name}</div>
          <div style="font-size:10px;color:#c7d2fe;margin-top:2px;">학습자</div>
        </div>
      </div>

      <!-- ① 현황 요약 3칸 -->
      ${sectionHead('📊','학생 현황 요약')}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:6px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:6px;">현재 상태</div>
          <div style="font-size:18px;font-weight:900;color:${statusColor};">${a.status.icon} ${a.status.text}</div>
        </div>
        <div style="background:#f0f1fe;border:1px solid #c7d2fe;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:6px;">최근 정답률</div>
          <div style="font-size:22px;font-weight:900;color:${accColor};">${summary.rawAcc}<span style="font-size:14px;">%</span></div>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:6px;">학습 모멘텀</div>
          <div style="font-size:16px;font-weight:900;color:${momColor};">${momentumInfo.icon} ${momentumInfo.label}</div>
          <div style="font-size:12px;font-weight:700;color:${momColor};">${momentumInfo.delta}</div>
        </div>
      </div>
      <!-- 지표 설명 -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;">
        ${['status','rawAcc','momentum'].map(k=>`<div style="font-size:9px;color:#94a3b8;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:5px 7px;line-height:1.5;">📌 ${INDICATOR_DESC[k]}</div>`).join('')}
      </div>

      <!-- ② 행동·학습 패턴 분석 -->
      ${sectionHead('🔍','행동 및 학습 패턴 분석')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;page-break-inside:avoid;">
        <colgroup><col style="width:110px"/><col style="width:64px"/><col/><col style="width:150px"/></colgroup>
        <tr style="background:#3730a3;color:white;">
          <th style="padding:7px 10px;text-align:center;font-size:11px;">분석 항목</th>
          <th style="padding:7px 10px;text-align:center;font-size:11px;">상태</th>
          <th style="padding:7px 10px;text-align:left;font-size:11px;">상세 시사점</th>
          <th style="padding:7px 10px;text-align:left;font-size:11px;">교수자 제언</th>
        </tr>
        <!-- 평균 참여 시간 -->
        <tr style="background:#f0fdf4;">
          <td style="padding:7px 9px;font-weight:700;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            평균 참여 시간
            <div style="font-size:9px;color:#94a3b8;margin-top:3px;font-weight:400;">📌 ${INDICATOR_DESC.activeTime}</div>
          </td>
          <td style="padding:7px 9px;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            ${activeTime.avgActiveMin >= 1
              ? badge('양호','#dcfce7','#16a34a','#86efac')
              : badge('주의','#fef9c3','#d97706','#fde68a')}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;line-height:1.5;">
            세션당 평균 <b>${activeTime.avgActiveMin}분</b> 집중.
            ${activeTime.flaggedSessions > 0
              ? `<span style="color:#d97706;font-weight:700;">${activeTime.flaggedSessions}회 세션에서 3분 이상 유휴 감지.</span>`
              : '집중도 매우 양호합니다.'}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;font-size:10px;color:#475569;line-height:1.6;">
            ${activeTime.flaggedSessions > 0
              ? '유휴 세션 시간대를 확인하고, 짧게 나눠 풀도록 안내하세요.'
              : '현재 리듬을 유지할 수 있도록 격려하세요.'}
          </td>
        </tr>
        <!-- 자기주도 탐색 (그래프 탐험) -->
        <tr style="background:#f0f9ff;">
          <td style="padding:7px 9px;font-weight:700;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            🔭 자기주도 탐색
            <div style="font-size:9px;color:#94a3b8;margin-top:3px;font-weight:400;">📌 ${INDICATOR_DESC.exploration}</div>
          </td>
          <td style="padding:7px 9px;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            ${!explore.has
              ? badge('데이터 없음','#f1f5f9','#94a3b8','#e2e8f0')
              : explore.breadth >= 3
              ? badge('활발','#dbeafe','#2563eb','#93c5fd')
              : badge('탐색 적음','#fef9c3','#d97706','#fde68a')}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;line-height:1.5;">
            ${!explore.has
              ? '아직 그래프 탐험 활동 기록이 없습니다. 슬라이더·드래그로 그래프를 직접 조작하면 탐색량이 집계됩니다.'
              : `최근 누적 <b>${explore.sessions}회</b> 탐험, 실질 조작 <b>${explore.activeMin}분</b>, 상호작용 <b>${explore.totalInteractions}회</b>(세션당 ${explore.perSession}회). 서로 다른 <b>${explore.breadth}/6개</b> 개념을 탐색했습니다.${
                  explore.conceptLink.some(c=>c.quizRate!=null)
                    ? ` <span style="color:#2563eb;">탐색-성취 연계:</span> ` + explore.conceptLink.filter(c=>c.quizRate!=null).slice(0,3).map(c=>`${c.concept} 정답률 ${c.quizRate}%`).join(' · ')
                    : ' (동일 개념 퀴즈를 풀면 탐색→성취 연계가 표시됩니다.)'
                }`}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;font-size:10px;color:#475569;line-height:1.6;">
            ${!explore.has
              ? '개념 설명만으로 이해가 어려운 학생에게 탐험 도구로 직접 조작해보도록 권하세요.'
              : explore.breadth >= 3
              ? '탐색이 활발합니다. <b>탐색량 자체는 성취가 아니므로</b>, 많이 탐색한 개념의 퀴즈 정답률이 함께 오르는지 확인해 실효성을 판단하세요.'
              : '한두 개념에 탐색이 몰려 있습니다. 아직 안 만져본 개념을 직접 조작해보도록 안내하세요.'}
          </td>
        </tr>
        <tr style="background:${revision.counts?.fixated > 0 ? '#fff1f2' : '#f8fafc'};">
          <td style="padding:7px 9px;font-weight:700;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            오개념 고착
            <div style="font-size:9px;color:#94a3b8;margin-top:3px;font-weight:400;">📌 ${INDICATOR_DESC.fixated}</div>
          </td>
          <td style="padding:7px 9px;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            ${revision.counts?.fixated > 0
              ? badge('⚠️ 주의','#fee2e2','#dc2626','#fca5a5')
              : badge('양호','#dcfce7','#16a34a','#86efac')}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;line-height:1.5;">
            ${revision.counts?.fixated > 0
              ? `<span style="color:#dc2626;font-weight:700;">${revision.counts.fixated}문항에서 수정 없이 반복 오답 패턴 확인.</span> 해당 개념에 즉각 개입이 필요합니다.`
              : '고착형 오답 패턴이 거의 없습니다.'}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;font-size:10px;color:#475569;line-height:1.6;">
            ${revision.counts?.fixated > 0
              ? '해당 문항을 함께 풀며 학생의 사고 과정을 구두 확인하세요. 오답 논리 파악이 핵심입니다.'
              : '현재 상태를 유지하도록 긍정적 피드백을 제공하세요.'}
          </td>
        </tr>
        <!-- 자기효능감 -->
        <tr style="background:#f0f1fe;">
          <td style="padding:7px 9px;font-weight:700;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            자기효능감
            <div style="font-size:9px;color:#94a3b8;margin-top:3px;font-weight:400;">📌 ${INDICATOR_DESC.selfEff}</div>
          </td>
          <td style="padding:7px 9px;text-align:center;border:1px solid #e2e8f0;vertical-align:top;">
            ${revision.counts?.uncertain_capable > 0
              ? badge('점검 필요','#fef9c3','#d97706','#fde68a')
              : badge('양호','#dcfce7','#16a34a','#86efac')}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;line-height:1.5;">
            ${revision.counts?.uncertain_capable > 0
              ? `정답인데도 답안을 여러 번 수정하는 패턴 ${revision.counts.uncertain_capable}회 관찰.`
              : '전반적으로 확신을 가지고 문제를 풀어나가고 있습니다.'}
          </td>
          <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;font-size:10px;color:#475569;line-height:1.6;">
            ${revision.counts?.uncertain_capable > 0
              ? '"맞게 생각했어요"라는 언어적 칭찬으로 자신감을 높여주세요.'
              : '자기효능감이 높을수록 학습 지속성이 향상됩니다. 계속 격려하세요.'}
          </td>
        </tr>
      </table>

      <!-- ③ 영역별 성취도 -->
      ${sectionHead('📈','영역별 성취도')}
      ${relativeMastery.length === 0
        ? `<div style="padding:16px;text-align:center;color:#94a3b8;border:1px solid #e2e8f0;border-radius:8px;font-size:11px;margin-bottom:18px;">
            아직 비교 가능한 누적 학습 데이터가 충분하지 않습니다.<br/>
            <span style="font-size:10px;">검정고시·모의고사·기하 문제지를 풀면 이 영역이 채워집니다.</span>
           </div>`
        : `<table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:11px;page-break-inside:avoid;">
            <colgroup><col style="width:88px"/><col style="width:54px"/><col/><col style="width:52px"/><col style="width:52px"/><col style="width:148px"/></colgroup>
            <tr style="background:#3730a3;color:white;">
              <th style="padding:7px 8px;text-align:center;font-size:10.5px;">영역</th>
              <th style="padding:7px 8px;text-align:center;font-size:10.5px;">나의 성취율</th>
              <th style="padding:7px 8px;text-align:center;font-size:10.5px;">진행 바</th>
              <th style="padding:7px 8px;text-align:center;font-size:10.5px;">전체 평균</th>
              <th style="padding:7px 8px;text-align:center;font-size:10.5px;">수준</th>
              <th style="padding:7px 8px;text-align:left;font-size:10.5px;">교수자 제언</th>
            </tr>
            ${relativeMastery.map((m,idx) => {
              const sc = m.myRate ?? 0;
              const barColor = sc >= 80 ? '#16a34a' : sc >= 60 ? '#d97706' : '#dc2626';
              const lvLabel = sc >= 95 ? '우수' : sc >= 80 ? '양호' : sc >= 60 ? '발전 중' : '보충 필요';
              const lvColor = sc >= 80 ? '#16a34a' : sc >= 60 ? '#d97706' : '#dc2626';
              const gapStr  = m.gap != null ? (m.gap >= 0 ? '+' : '') + m.gap + '%p' : '–';
              const gapColor= m.gap != null && m.gap < 0 ? '#dc2626' : '#16a34a';
              const tips = {
                '무리함수':'그래프 탐험 도구로 평행이동 패턴을 시각적으로 반복 확인.',
                '유리함수':'점근선 개념 먼저 확인 후 그래프 형태로 연결하세요.',
                '이차함수':'꼭짓점 좌표 공식과 그래프의 관계를 직접 그려 확인하세요.',
                '원의 방정식':'중심과 반지름 개념 확인 후 좌표평면에 직접 그리기.',
                '대칭이동':'x축·y축·원점 대칭 3가지를 표로 정리해 비교하세요.',
                '점과 직선 거리':'공식 암기보다 유도 과정을 설명하게 해보세요.',
              };
              const tip = tips[m.topic] || '관련 단원 문제를 추가로 제공하세요.';
              return `<tr style="background:${idx%2===0?'white':'#f8fafc'};">
                <td style="padding:8px 8px;font-weight:700;border:1px solid #e2e8f0;vertical-align:middle;">${m.topic}</td>
                <td style="padding:8px 8px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle;">
                  <span style="font-size:16px;font-weight:900;color:${barColor};">${sc}%</span>
                </td>
                <td style="padding:8px 10px;border:1px solid #e2e8f0;vertical-align:middle;">
                  ${barHtml(sc, barColor, 8)}
                </td>
                <td style="padding:8px 8px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle;font-size:11px;">
                  ${m.allRate != null ? m.allRate + '%' : '–'}<br/>
                  <span style="color:${gapColor};font-weight:700;">${gapStr}</span>
                </td>
                <td style="padding:8px 8px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle;">
                  <span style="font-size:11px;font-weight:700;color:${lvColor};">${lvLabel}</span>
                </td>
                <td style="padding:8px 8px;border:1px solid #e2e8f0;vertical-align:middle;font-size:10.5px;color:#475569;line-height:1.55;">${tip}</td>
              </tr>`;
            }).join('')}
           </table>`}

      <!-- 성취 수준 범례 -->
      <div style="display:flex;gap:14px;font-size:10px;color:#64748b;margin-bottom:14px;background:#f8fafc;padding:6px 10px;border-radius:6px;border:1px solid #e2e8f0;">
        <span><b style="color:#16a34a;">■</b> 우수 95%↑</span>
        <span><b style="color:#16a34a;">■</b> 양호 80–94%</span>
        <span><b style="color:#d97706;">■</b> 발전 중 60–79%</span>
        <span><b style="color:#dc2626;">■</b> 보충 필요 60%↓</span>
        <span style="margin-left:auto;color:#94a3b8;">전체 평균 대비 %p = 이 학생 성취율 − 전체 학생 평균</span>
      </div>

      <!-- 푸터 -->
      <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;color:#94a3b8;font-size:9.5px;">
        본 리포트는 태청야학 수학반 AI 학습 분석 엔진에 의해 자동 생성되었습니다. · 출력일: ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>`;

    // ── 페이지 2: 종합 교수자 피드백 제언 ──
    const hasFixated   = (revision.counts?.fixated ?? 0) > 0;
    const hasSelfEff   = (revision.counts?.uncertain_capable ?? 0) > 0;
    const weakAreas    = relativeMastery.filter(m => m.myRate != null && m.myRate < 80).map(m => m.topic);
    const strongAreas  = relativeMastery.filter(m => m.myRate != null && m.myRate >= 90).map(m => m.topic);
    const noDataAreas  = relativeMastery.filter(m => m.myRate == null).map(m => m.topic);

    const page2 = `
    <div style="width:794px;min-height:1123px;background:white;padding:36px 42px;box-sizing:border-box;font-family:'Noto Sans KR',sans-serif;color:#1e293b;">

      <!-- 헤더 배너 (연속 표시) -->
      <div style="background:linear-gradient(135deg,#3730a3,#6366f1);border-radius:10px;padding:14px 24px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:14px;font-weight:900;color:white;">학생 맞춤형 학습 분석 리포트 — 2/2 페이지</div>
        <div style="font-size:13px;color:#c7d2fe;">${student.name} 학생 · 출력일: ${new Date().toLocaleDateString('ko-KR')}</div>
      </div>

      <!-- ④ 종합 교수자 피드백 -->
      ${sectionHead('💬','종합 교수자 피드백 제언')}
      <div style="margin-bottom:18px;">
        ${hasFixated
          ? feedItem('🚨 즉시 개입 필요','오개념 고착 문항 직접 확인',
              `오개념 고착이 발생한 <b>${revision.counts.fixated}개 문항</b>을 직접 확인하세요. 학생이 어떤 논리로 오답을 선택하는지 구두 확인이 필요합니다.`,
              '#dc2626','#fff1f2')
          : feedItem('✅ 오개념 위험도 낮음','현재 상태 유지',
              '고착형 오답 패턴이 거의 없습니다. 정기적인 오답 노트 작성 습관을 함께 유도하면 좋습니다.',
              '#16a34a','#f0fdf4')}
        ${weakAreas.length > 0
          ? feedItem('📌 단기 목표 (1~2주)','취약 영역 집중 보충',
              `<b>${weakAreas.join(', ')}</b> 영역 집중 보충. 주 1회 해당 단원 추가 문제지를 제공하고 오답 패턴을 매회 기록하세요.`,
              '#d97706','#fffbeb')
          : ''}
        ${strongAreas.length > 0
          ? feedItem('⭐ 강점 강화','강점 영역 활용한 동기부여',
              `<b>${strongAreas.join(', ')}</b> 분야는 핵심 강점입니다. 어려운 영역 진입 전 이 분야를 먼저 칭찬하며 자신감을 충전시키세요.`,
              '#16a34a','#f0fdf4')
          : ''}
        ${noDataAreas.length > 0
          ? feedItem('📂 장기 목표 (1달)','미탐색 영역 데이터 축적',
              `<b>${noDataAreas.join(', ')}</b> 영역은 아직 데이터가 없습니다. 관련 문항 풀이를 시작하여 학습 지도를 넓혀가세요.`,
              '#6366f1','#eef2ff')
          : ''}
        ${hasSelfEff
          ? feedItem('💛 자기효능감 향상','언어적 격려 강화',
              `정답을 맞히고도 ${revision.counts.uncertain_capable}회 답안을 바꾸는 패턴이 관찰되었습니다. "맞게 생각했어요"라는 구체적 칭찬을 자주 해주세요.`,
              '#d97706','#fffbeb')
          : ''}
      </div>

      <!-- ⑤ 지표 해설 참고표 -->
      ${sectionHead('📖','리포트 지표 해설 참고표')}
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:18px;">
        <tr style="background:#eef2ff;">
          <th style="padding:7px 10px;text-align:left;border:1px solid #c7d2fe;color:#3730a3;font-size:11px;width:130px;">지표명</th>
          <th style="padding:7px 10px;text-align:left;border:1px solid #c7d2fe;color:#3730a3;font-size:11px;width:200px;">측정 방식</th>
          <th style="padding:7px 10px;text-align:left;border:1px solid #c7d2fe;color:#3730a3;font-size:11px;">교육적 의미 및 해석 방법</th>
        </tr>
        ${[
          ['현재 상태','최근 7일 참여·정답 추이 자동 판정','순항 중: 꾸준히 참여하며 성취 유지. 주의: 최근 정답률 하락 또는 장기 미참여. 위험: 두 조건 동시 해당.'],
          ['최근 정답률','최근 세션 기준 정답 수 ÷ 전체 문항 수','전체 누적값이 아니므로 최근 수행 흐름을 반영. 80% 이상이면 양호, 60% 미만이면 개념 보충 필요.'],
          ['학습 모멘텀','이전 기간 평균 정답률 − 최근 기간 평균 정답률','양수=성장 중, 음수=하락 추세. 절대값보다 방향성(추세)이 더 중요한 지표임.'],
          ['평균 참여 시간','세션 총 소요 시간 중 응답 간 유휴 시간 제거 후 추정','성인 학습자는 짧고 집중적인 세션이 효과적. 유휴 세션이 많으면 학습 환경 점검 필요.'],
          ['오개념 고착','수정 없이 동일 오답 반복 (revisionCount=0, isOk=false)','가장 위험한 패턴. 학생 스스로 틀린 것을 모르거나 무기력해진 상태일 수 있음. 즉시 개입.'],
          ['자기효능감','정답임에도 답 수정 반복 (revisionCount>1, isOk=true)','실력은 있으나 자신감 부족. 언어적 칭찬과 구체적 성취 확인이 효과적인 개입 방법.'],
          ['🔭 자기주도 탐색','그래프 탐험의 조작 횟수·유휴 보정 활동 시간·탐색 개념 폭(체류 시간 아님)','성취가 아닌 참여·호기심 지표. 탐색이 많은 개념의 퀴즈 정답률이 함께 오르는지로 실효성 판단.'],
          ['영역별 성취율','해당 토픽 문항의 정답 수 ÷ 전체 풀이 수','풀이 문항이 적을수록 신뢰도 낮음. 최소 5문항 이상 축적 후 해석 권장.'],
          ['전체 평균 대비 %p','이 학생 성취율 − 전체 학생 동일 문항 평균','양수=또래 평균 이상, 음수=또래 평균 이하. 전체 학생 수가 적을수록 비교 신뢰도 낮음.'],
        ].map((r,i)=>`<tr style="background:${i%2===0?'white':'#f8fafc'};">
          <td style="padding:7px 10px;font-weight:700;border:1px solid #e2e8f0;vertical-align:top;">${r[0]}</td>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;vertical-align:top;color:#475569;">${r[1]}</td>
          <td style="padding:7px 10px;border:1px solid #e2e8f0;vertical-align:top;color:#475569;line-height:1.6;">${r[2]}</td>
        </tr>`).join('')}
      </table>

      <!-- 주의사항 박스 -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:11px;line-height:1.7;color:#92400e;">
        <b>⚠️ 리포트 해석 시 주의사항</b><br/>
        본 리포트는 앱 내 학습 로그를 기반으로 자동 생성됩니다. 데이터가 적은 초기에는 지표 신뢰도가 낮을 수 있습니다.
        모든 지표는 교사의 직접 관찰·면담과 함께 종합적으로 해석하시기 바랍니다.
        오개념 고착·자기효능감 지표는 <b>검정고시·모의고사·기하 문제지 세션</b>에서만 수집됩니다.
      </div>

      <!-- 푸터 -->
      <div style="border-top:1px solid #e2e8f0;padding-top:8px;text-align:center;color:#94a3b8;font-size:9.5px;">
        본 리포트는 태청야학 수학반 AI 학습 분석 엔진에 의해 자동 생성되었습니다. · 출력일: ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>`;

    // ── 지표 상세해설 페이지 (page3) ──
    // 이 학생의 실제 값에 맞게 각 지표별 상세 해설 생성
    // ── 공통 헬퍼 ──
    const pageHeader2 = (subtitle, pageNum) =>
      `<div style="background:linear-gradient(135deg,#0f172a,#3730a3);border-radius:10px;padding:13px 22px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:13px;font-weight:900;color:white;">학생 맞춤형 학습 분석 리포트 — 지표 상세 해설 ${pageNum}</div>
          <div style="font-size:10px;color:#c7d2fe;margin-top:2px;">${subtitle}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;font-weight:900;color:white;">${student.name}</div>
          <div style="font-size:10px;color:#c7d2fe;">${new Date().toLocaleDateString('ko-KR')} 출력</div>
        </div>
       </div>`;

    // ── 지표 카드 헬퍼 (산출기준 + 학습분석학 배경 + 이 학생 해석 + 교수자 행동) ──
    const dc = (badge, title, valueHtml, valueBg, formulaHtml, theoryHtml, thisStudentHtml, actionHtml, warnHtml='') =>
      `<div style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:13px;overflow:hidden;page-break-inside:avoid;">
        <div style="background:${valueBg}22;border-bottom:2px solid ${valueBg};padding:9px 16px;display:flex;align-items:center;gap:10px;">
          <div style="background:${valueBg};color:white;border-radius:6px;padding:3px 9px;font-size:9.5px;font-weight:900;white-space:nowrap;">${badge}</div>
          <div style="font-size:13px;font-weight:900;color:#1e293b;flex:1;">${title}</div>
          <div style="font-size:13px;font-weight:900;color:${valueBg};">${valueHtml}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0;">
          <div style="padding:9px 14px;border-right:1px solid #e2e8f0;">
            <div style="font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">📐 산출 기준</div>
            <div style="font-size:10.5px;color:#475569;line-height:1.65;">${formulaHtml}</div>
          </div>
          <div style="padding:9px 14px;">
            <div style="font-size:9px;font-weight:900;color:#4338ca;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">📚 학습분석학 이론</div>
            <div style="font-size:10.5px;color:#334155;line-height:1.65;">${theoryHtml}</div>
          </div>
        </div>
        <div style="padding:9px 14px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
          <div style="font-size:9px;font-weight:900;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">🔎 이 학생 해석</div>
          <div style="font-size:10.5px;color:#1e293b;line-height:1.7;">${thisStudentHtml}</div>
        </div>
        <div style="display:grid;grid-template-columns:${warnHtml?'1fr 1fr':'1fr'};gap:0;">
          <div style="padding:8px 14px;">
            <div style="font-size:9px;font-weight:900;color:#16a34a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">✅ 교수자 권장 행동</div>
            <div style="font-size:10.5px;color:#166534;line-height:1.65;">${actionHtml}</div>
          </div>
          ${warnHtml?`<div style="padding:8px 14px;border-left:1px solid #e2e8f0;background:#fffbeb;">
            <div style="font-size:9px;font-weight:900;color:#d97706;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">⚠️ 해석 주의</div>
            <div style="font-size:10px;color:#92400e;line-height:1.6;">${warnHtml}</div>
          </div>`:''}
        </div>
       </div>`;

    const sH2 = (icon, title) =>
      `<div style="display:flex;align-items:center;gap:0;margin:14px 0 10px 0;">
         <div style="width:5px;height:26px;background:#6366f1;border-radius:3px 0 0 3px;flex-shrink:0;"></div>
         <div style="background:#eef2ff;flex:1;padding:5px 12px;border-radius:0 6px 6px 0;">
           <span style="font-size:12.5px;font-weight:900;color:#3730a3;">${icon} ${title}</span>
         </div>
       </div>`;

    // ── 지표별 3단계 해석값 계산 ──
    const fixatedN = revision.counts?.fixated ?? 0;
    const selfEffN  = revision.counts?.uncertain_capable ?? 0;
    const totalSessions = logs.length;
    const recentSessions = logs.slice(0,3).length;

    // 현재 상태
    const statusFormula = `① 최근 7일 이내 세션 존재 여부 확인<br/>② 최근 3회 세션 정답률 평균 계산<br/>③ ①②의 조합으로 3단계(순항/주의/위험) 자동 분류`;
    const statusTheory  = `학습분석학의 시간적 분석 원칙에 따라 <b>단기 시간 창(time window)</b>을 7일로 설정한다. 단일 시점 점수보다 <b>방향성과 지속성</b>이 개입 여부 판단에 더 유효한 지표다(Siemens, 2013).`;
    const statusStudent = a.status.text === '순항 중'
      ? `${student.name} 학생은 현재 <b style="color:#16a34a;">순항 중</b> 상태입니다. 최근 7일 내 세션이 확인되며 정답률 방향이 안정적입니다. 학습 흐름이 건강하게 유지되고 있어 별도 개입 없이 지속 관찰이 적절합니다.`
      : a.status.text === '격려 필요'
      ? `${student.name} 학생은 현재 <b style="color:#d97706;">격려 필요</b> 상태입니다. 참여 간격이 벌어지거나 정답률이 하락 중입니다. 즉각 개입보다는 부드러운 접근으로 참여를 유도하세요.`
      : `${student.name} 학생은 현재 <b style="color:#dc2626;">집중 케어 필요</b> 상태입니다. 장기 미참여 또는 정답률 급락이 감지됩니다. 개별 면담을 통해 학습 장벽을 파악하세요.`;
    const statusAction = a.status.text === '순항 중'
      ? `현재 학습 리듬을 유지하도록 긍정적 피드백을 제공하세요. 새로운 도전 과제를 추가하여 성취감을 지속시키는 것이 좋습니다.`
      : a.status.text === '격려 필요'
      ? `짧은 격려 메시지나 쉬운 문제로 성공 경험을 쌓게 해주세요. 참여 빈도에 초점을 맞춘 단기 목표 설정이 효과적입니다.`
      : `즉각적인 개별 면담 후 학습 목표와 방법을 함께 재설정하세요. 매우 쉬운 문제부터 시작해 성공 경험을 회복시키세요.`;

    // 최근 정답률
    const accFormula = `정답률 = 최근 세션 정답 문항 수 ÷ 최근 세션 전체 문항 수 × 100<br/><b>누적 평균이 아닌 최근 1회 세션 기준</b>으로 산출하므로 현재 수행 수준을 가장 직접적으로 반영한다.`;
    const accTheory  = `학습분석학에서 측정 단위로 '세션'을 채택하는 것은 <b>시간적 세분화(temporal granularity)</b> 문제이다. 누적값은 장기 성취를 반영하나 최근 변화에 둔감하므로, 개입 판단에는 <b>최근 세션 기준이 더 높은 민감도</b>를 제공한다.`;
    const accStudent = summary.rawAcc >= 80
      ? `현재 <b style="color:#16a34a;">${summary.rawAcc}%</b>로 양호 수준(기준: 80% 이상)입니다. 핵심 개념의 이해가 충분히 이루어지고 있음을 나타냅니다. 취약 영역 집중 보충과 병행하면 균형 잡힌 성장이 가능합니다.`
      : summary.rawAcc >= 60
      ? `현재 <b style="color:#d97706;">${summary.rawAcc}%</b>로 발전 중 단계(기준: 60~79%)입니다. 기본 개념은 있으나 응용 단계에서 실수가 발생하고 있습니다. 오답 유형을 분류하여 특정 개념의 누락 여부를 확인하세요.`
      : `현재 <b style="color:#dc2626;">${summary.rawAcc}%</b>로 보충 필요(기준: 60% 미만) 단계입니다. 기초 개념의 재정립이 필요합니다. 난이도를 단계적으로 낮추어 성공 경험을 먼저 확보하세요.`;
    const accAction = summary.rawAcc >= 80
      ? `현재 수준을 유지하며 심화 문제나 새 영역을 추가 제공하세요. 정답률보다 풀이 과정의 논리성을 함께 확인하는 단계로 진입할 수 있습니다.`
      : summary.rawAcc >= 60
      ? `오답이 반복되는 문항 유형을 파악하고 해당 개념 설명을 보강하세요. 주 1회 오답 노트 점검을 통해 취약점을 추적하세요.`
      : `기초 개념 설명 → 쉬운 문제 성공 → 점진적 난이도 상승의 순서로 접근하세요. 한 번에 여러 개념을 다루지 말고 한 가지씩 완성하는 전략이 효과적입니다.`;
    const accWarn = `세션 수가 ${totalSessions}회로 ${totalSessions < 5 ? '아직 적습니다. 세션이 누적될수록 이 지표의 신뢰도가 높아집니다.' : '충분히 누적되어 신뢰도가 높습니다.'}`;

    // 학습 모멘텀
    const momDelta = momentum.avgRecent && momentum.avgOlder ? (momentum.avgRecent - momentum.avgOlder).toFixed(1) : '?';
    const momFormula = `모멘텀 = 최근 3회 세션 평균 정답률 − 이전 3회 세션 평균 정답률<br/>최근: ${momentum.avgRecent ?? '?'}% / 이전: ${momentum.avgOlder ?? '?'}% → <b>차이: ${momDelta}%p</b>`;
    const momTheory  = `학습분석학은 "절대값보다 방향성(추세)이 더 중요한 지표"임을 명시한다. 모멘텀은 <b>시간의 흐름(time flow)</b> 분석의 핵심으로, 현재 점수가 낮더라도 상승 추세라면 개입 우선순위를 낮출 수 있고, 높더라도 하락 중이라면 즉각 점검이 필요하다.`;
    const momStudent = momentum.trend === 'rising'
      ? `<b style="color:#16a34a;">성장 중 (+${Math.abs(Number(momDelta))}%p)</b>입니다. 이전 기간 대비 정답률이 실질적으로 향상되고 있으며, 학습 전략과 집중도가 긍정적으로 작용하고 있습니다. 이 모멘텀이 꺾이지 않도록 관리하는 것이 중요합니다.`
      : momentum.trend === 'declining'
      ? `<b style="color:#dc2626;">하락 추세 (${momDelta}%p)</b>입니다. 최근 세션에서 정답률이 이전보다 낮아지고 있습니다. 난이도가 갑자기 올라갔거나 개념 이해 없이 진도를 나간 신호일 수 있습니다.`
      : momentum.trend === 'stable'
      ? `<b style="color:#6366f1;">안정 유지</b> 상태입니다. 정답률 변동폭이 작으며 현재 난이도와 학생의 실력이 균형을 이루고 있습니다.`
      : `세션 데이터가 6회 미만으로 아직 모멘텀을 신뢰성 있게 계산하기 어렵습니다. 더 많은 세션이 쌓이면 이 지표가 활성화됩니다.`;
    const momAction = momentum.trend === 'rising'
      ? `현재 학습 패턴(빈도, 난이도, 방식)을 유지하세요. 학생에게 성장 수치를 직접 공유하여 자기효능감을 강화하세요.`
      : momentum.trend === 'declining'
      ? `난이도를 일시적으로 낮추고 성공 경험을 먼저 회복시키세요. 이전에 잘 풀었던 유형부터 다시 시작하는 것이 효과적입니다.`
      : `현재 수준에 적합한 도전 과제를 조금씩 추가하여 상승 모멘텀을 만들어 주세요.`;

    // 평균 참여 시간
    const activeFormula = `추정 집중 시간 = 세션 총 소요 시간 − 문항당 3분 초과 유휴 구간 합산<br/>세션당 평균 = 총 추정 집중 시간 ÷ 세션 수<br/>※ 실제 이벤트 추적이 아닌 <b>간이 유휴 보정 추정치</b>`;
    const activeTheory  = `학습분석학에서 참여 시간은 <b>행동 흔적(trace) 데이터</b>의 핵심이다. 그러나 단순 체류 시간은 유휴를 포함하므로 신뢰할 수 있는 측정을 위해 유휴 보정이 필수적이다. 성인 학습자는 짧고 집중적인 세션이 효과적임이 연구로 확인된다.`;
    const activeStudent = activeTime.avgActiveMin >= 1
      ? `세션당 평균 <b style="color:#16a34a;">${activeTime.avgActiveMin}분</b> 집중(양호)이 추정됩니다.${activeTime.flaggedSessions > 0 ? ` 단, <b>${activeTime.flaggedSessions}회 세션</b>에서 3분 이상 유휴가 감지되었습니다. 해당 세션의 외부 요인(환경 방해, 피로 등)을 확인해보세요.` : ' 유휴 감지 세션이 없어 집중도가 전반적으로 양호합니다.'}`
      : `세션당 집중 시간이 <b style="color:#d97706;">1분 미만</b>으로 추정됩니다. 유휴 구간이 많아 실질적인 학습 시간이 짧을 수 있습니다. 학습 환경 및 집중 방해 요인 점검이 필요합니다.`;
    const activeAction = activeTime.avgActiveMin >= 1
      ? `현재 집중 패턴을 유지하도록 격려하세요. 유휴가 감지된 세션이 있다면 해당 시간대나 환경을 함께 확인하고 개선 방안을 논의하세요.`
      : `짧고 명확한 목표(예: "이번 세션에서 5문제 완료")를 제시하여 집중력을 높이세요. 세션 중간에 짧은 휴식을 계획적으로 배치하는 방법도 효과적입니다.`;
    const activeWarn = `이 지표는 실제 키보드/터치 이벤트를 추적하는 것이 아니라 <b>응답 간격으로 유휴를 추정</b>합니다. 생각하는 데 시간이 걸린 경우에도 유휴로 잡힐 수 있으므로 보조 지표로만 참고하세요.`;

    // 오개념 고착
    const fixatedFormula = `오개념 고착 문항 수 = revisionCount = 0 이고 isOk = false 인 문항 합계<br/>즉, <b>한 번도 답을 수정하지 않고 제출했으나 오답</b>인 문항의 수`;
    const fixatedTheory  = `자기조절학습(COPES 모델)에서 평가(Evaluation) 단계의 실패를 나타내는 지표다. 자기조절학습 연구에서 "고착(fixation)"은 <b>메타인지 부재</b>의 직접적 행동 흔적으로, 단순 오답보다 훨씬 위험한 신호다. 학습자가 자신이 틀렸음을 모르거나, 알아도 수정 시도를 포기한 상태일 수 있다.`;
    const fixatedStudent = fixatedN > 0
      ? `<b style="color:#dc2626;">${fixatedN}문항</b>에서 오개념 고착 패턴이 확인되었습니다. 이는 해당 문항들에서 학생이 자신의 오류를 인지하지 못하거나 무기력하게 반복 제출했음을 의미합니다. 단순 실수와 달리 개념 자체가 잘못 형성되어 있을 가능성이 높으므로 즉각적인 확인이 필요합니다.`
      : `오개념 고착 패턴이 감지되지 않았습니다. 메타인지가 적절히 작동하여 오답 발생 시 수정 시도가 이루어지고 있습니다. 이 건강한 학습 태도를 지속적으로 강화해주세요.`;
    const fixatedAction = fixatedN > 0
      ? `해당 ${fixatedN}문항을 직접 꺼내 학생과 함께 풀면서 <b>"왜 이 답을 선택했는지"를 구두로 확인</b>하세요. 논리적 오류를 파악하는 것이 핵심이며, 정답을 알려주기 전에 학생이 스스로 오류를 발견할 수 있도록 유도하는 소크라테스식 질문법이 효과적입니다.`
      : `오답이 발생할 때 학생이 스스로 다시 확인하는 습관을 강화하세요. "한 번 더 검토해볼까요?"와 같은 촉진 언어가 메타인지 습관 형성에 도움이 됩니다.`;
    const fixatedWarn = `이 지표는 <b>모의고사·검정고시·기하 문제지 세션</b>에서만 수집됩니다. 나눗셈·약수 세션(자유 입력 방식)은 revisionCount를 추적하지 않으므로 데이터가 없을 수 있습니다.`;

    // 자기효능감
    const selfEffFormula = `자기효능감 약화 문항 수 = revisionCount > 1 이고 isOk = true 인 문항 합계<br/>즉, <b>정답이었는데도 답을 2회 이상 수정한</b> 문항의 수`;
    const selfEffTheory  = `자기효능감(self-efficacy)은 Bandura(1997)의 사회인지이론에서 학습 지속성과 성취를 예측하는 핵심 변수다. 학습분석학에서는 행동 흔적으로 자기효능감을 간접 측정할 때 <b>정답 확인 후 수정 행동</b>이 가장 타당한 지표로 활용된다. 설문보다 오염이 적은 객관적 행동 데이터다.`;
    const selfEffStudent = selfEffN > 0
      ? `<b style="color:#d97706;">${selfEffN}문항</b>에서 정답임에도 답을 수정하는 패턴이 관찰되었습니다. 이는 실력은 있으나 자신의 판단을 신뢰하지 못하는 상태를 나타냅니다. 시험 불안이나 과거 실패 경험이 이 패턴을 강화했을 가능성이 있습니다.`
      : `정답 답안을 불필요하게 수정하는 패턴이 없습니다. 자신의 판단에 확신을 가지고 문제를 풀고 있는 건강한 상태입니다. 이 자신감을 어려운 문제에서도 유지할 수 있도록 지속적으로 격려하세요.`;
    const selfEffAction = selfEffN > 0
      ? `정답을 맞혔을 때 <b>"처음 생각이 맞았어요", "이 문제 잘 풀었어요"</b>와 같이 즉각적이고 구체적인 언어적 칭찬을 제공하세요. 학생이 자신의 첫 직관을 믿는 연습을 할 수 있도록 "한 번 생각하고 바로 제출해보기" 미션을 부여하는 것도 효과적입니다.`
      : `현재의 자신감 있는 풀이 태도를 칭찬하고 더 어려운 문제에도 같은 방식으로 도전하도록 권장하세요.`;
    const selfEffWarn = `자기효능감 지표 역시 <b>모의고사·기하 문제지 세션</b>에서만 수집됩니다. 데이터 수가 적을 때는 해석에 주의하세요.`;

    // 자기주도 탐색 (그래프 탐험)
    const exploreFormula = `탐색량 = 그래프 직접 조작(드래그·슬라이더·개념 전환) 횟수의 누적<br/>실질 활동 시간 = 상호작용 간격 중 <b>60초 미만 구간만</b> 합산(유휴 제외)<br/>탐색 폭 = 학생이 건드린 서로 다른 함수 개념 수(0~6)<br/>※ <b>체류 시간은 측정에서 의도적으로 제외</b>한다.`;
    const exploreTheory  = `정답이 없는 탐험형 학습은 '얼마나 오래 머물렀나'로 측정할 수 없다. 체류 시간은 진지한 탐색·막힘·유휴(배경 노출)를 구분하지 못해 <b>구인타당도(construct validity)</b>가 낮기 때문이다. 대신 <b>능동적 행동 흔적</b>(조작 횟수·유휴 보정 활동 시간·탐색한 개념 폭)으로 자기주도성과 호기심을 측정한다. 다만 탐색량 자체는 <b>성취가 아니라 학습의 선행(antecedent) 변수</b>이므로, 동일 개념의 퀴즈 정답률과 연계해 '탐색이 실제 실력 향상으로 이어졌는지' 검증해야 비로소 학습 신호로서 의미를 갖는다.`;
    const exploreStudent = !explore.has
      ? `아직 그래프 탐험 활동 기록이 없습니다. 이 학생은 탐험 도구를 거의 사용하지 않았거나, 사소한 방문(상호작용 3회 미만)만 있었습니다. 개념 설명을 글로만 읽는 것보다 직접 그래프를 움직여보는 경험이 시각적 이해에 도움이 됩니다.`
      : `최근 누적 <b style="color:#2563eb;">${explore.sessions}회</b> 탐험에서 <b>${explore.totalInteractions}회</b> 상호작용(세션당 평균 ${explore.perSession}회), 실질 조작 시간 <b>${explore.activeMin}분</b>이 집계되었습니다. 6개 함수 개념 중 <b>${explore.breadth}개</b>를 탐색했습니다. ${
          explore.conceptLink.some(c=>c.quizRate!=null)
            ? '탐색-성취 연계: ' + explore.conceptLink.filter(c=>c.quizRate!=null).slice(0,4).map(c=>`<b>${c.concept}</b>(탐색 ${c.explores}회 · 퀴즈 ${c.quizRate}%)`).join(', ') + ' — 탐색이 많은 개념에서 정답률이 함께 높다면 탐험이 실력으로 전이되고 있다는 신호입니다.'
            : '아직 동일 개념의 퀴즈 데이터가 없어 탐색-성취 연계는 표시되지 않습니다. 탐색한 개념의 문제지를 풀게 하면 전이 효과를 확인할 수 있습니다.'
        }`;
    const exploreAction = !explore.has
      ? `개념 설명 탭만으로 이해가 더딘 학생에게 "🔭 그래프 탐험"에서 슬라이더를 직접 움직여 보도록 구체적으로 안내하세요. 예: "무리함수에서 p값을 바꾸면 그래프가 어디로 움직이는지 직접 확인해 보세요."`
      : explore.breadth >= 3
      ? `탐색이 활발합니다. <b>탐색량은 성취가 아니므로</b> 칭찬은 '시도' 자체에 한정하고, 많이 탐색한 개념의 퀴즈 정답률이 함께 오르는지를 실효성 판단 기준으로 삼으세요. 탐색은 활발한데 정답률이 정체되어 있다면, 조작은 하되 원리를 언어화하지 못하는 단계일 수 있어 짧은 구두 설명을 덧붙이게 하세요.`
      : `탐색이 한두 개념에 치우쳐 있습니다. 아직 만져보지 않은 개념을 직접 조작하도록 권하고, 탐색 후 "무엇을 발견했는지" 한 문장으로 말해보게 하면 탐색이 능동적 이해로 연결됩니다.`;
    const exploreWarn = `이 지표는 <b>참여·호기심의 행동 흔적</b>일 뿐 성취도가 아닙니다. 탐색량이 많다고 실력이 보장되지 않으며, 반드시 동일 개념의 퀴즈 정답률과 함께 해석해야 합니다. 또한 사소한 방문(상호작용 3회 미만·8초 미만)은 노이즈 차단을 위해 집계에서 제외됩니다.`;

    // 영역별 성취도 상세 행
    const masteryDetailRows2 = relativeMastery.length === 0
      ? `<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8;font-size:11px;line-height:1.8;">
           아직 영역별 비교 데이터가 충분하지 않습니다.<br/>
           <b>중졸·고졸 검정고시 연습, 모의고사, 기하 문제지</b>를 각 영역 5문항 이상 풀면 이 섹션이 활성화됩니다.
         </td></tr>`
      : relativeMastery.map((m, idx) => {
          const sc  = m.myRate ?? 0;
          const clr = sc >= 80 ? '#16a34a' : sc >= 60 ? '#d97706' : '#dc2626';
          const lv  = sc >= 95 ? '우수' : sc >= 80 ? '양호' : sc >= 60 ? '발전 중' : '보충 필요';
          const reliable = m.myTotal >= 5;
          const interpText = !reliable
            ? `${m.myTotal}문항만 풀어 <b>신뢰도 낮음</b>. 최소 5문항 이상 필요`
            : sc >= 80
            ? `핵심 개념 이해가 충분합니다. 심화 응용 문제 도전을 권장합니다`
            : sc >= 60
            ? `기본 개념은 있으나 응용 실수가 있습니다. 오답 유형 분류 후 집중 보충하세요`
            : `개념 이해가 부족합니다. 교과서 기본 개념부터 단계적으로 재접근하세요`;
          const tips = {
            '무리함수':    '그래프 탐험 도구로 평행이동 패턴을 시각적으로 반복 확인하세요',
            '유리함수':    '점근선 개념을 먼저 확인한 뒤 그래프 형태와 연결하세요',
            '이차함수':    '꼭짓점 좌표 공식과 그래프의 관계를 직접 그려 확인하세요',
            '원의 방정식': '중심과 반지름 개념 확인 후 좌표평면에 직접 원을 그려보세요',
            '대칭이동':    'x축·y축·원점 대칭 3가지를 표로 정리해 비교하세요',
            '점과 직선 거리': '공식 암기보다 유도 과정을 학생이 직접 설명하게 해보세요',
            '도형과 기하': '도형 문제는 반드시 그림을 그리고 좌표를 표시하는 습관을 들이세요',
            '집합과 함수': '집합 기호(∪∩)를 벤다이어그램으로 시각화해 이해를 돕세요',
            '확률과 통계': '순열·조합의 차이를 실생활 사례로 구분하여 설명하세요',
          };
          const tip = tips[m.topic] || '관련 단원 문제를 추가로 제공하세요';
          const gapStr = m.gap != null ? (m.gap >= 0 ? '+' : '') + m.gap + '%p' : '–';
          const gapClr = m.gap != null && m.gap < 0 ? '#dc2626' : '#16a34a';
          return `<tr style="background:${idx%2===0?'white':'#f8fafc'};">
            <td style="padding:7px 9px;font-weight:700;border:1px solid #e2e8f0;vertical-align:middle;">${m.topic}</td>
            <td style="padding:7px 8px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle;">
              <div style="font-size:16px;font-weight:900;color:${clr};">${sc}%</div>
              <div style="font-size:9px;color:#94a3b8;">${m.myTotal}문항${!reliable?' ⚠️':''}</div>
            </td>
            <td style="padding:7px 8px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle;font-weight:700;font-size:10.5px;color:${clr};">${lv}</td>
            <td style="padding:7px 8px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle;font-size:10.5px;">
              <div style="color:${gapClr};font-weight:700;">${gapStr}</div>
              <div style="color:#94a3b8;font-size:9px;">${m.allRate!=null?m.allRate+'% 평균':'비교불가'}</div>
            </td>
            <td style="padding:7px 9px;border:1px solid #e2e8f0;vertical-align:top;font-size:10px;color:#334155;line-height:1.6;">
              <div style="margin-bottom:3px;">${interpText}</div>
              <div style="color:#6366f1;font-size:9.5px;">💡 ${tip}</div>
            </td>
          </tr>`;
        }).join('');

    // ══════════════════════
    // page3a: 현황 지표 상세 해설
    // ══════════════════════
    const page3a = `
    <div style="width:794px;min-height:1123px;background:white;padding:34px 40px;box-sizing:border-box;font-family:'Noto Sans KR',sans-serif;color:#1e293b;">

      ${pageHeader2('현황 지표 상세 해설', '3/5')}

      ${sH2('📊','현황 지표')}

      ${dc('현재 상태', '현재 상태',
        `${a.status.icon} ${a.status.text}`, '#3730a3',
        statusFormula, statusTheory, statusStudent, statusAction)}

      ${dc('최근 정답률', '최근 정답률',
        `${summary.rawAcc}%`, accColor,
        accFormula, accTheory, accStudent, accAction, accWarn)}

      ${dc('학습 모멘텀', '학습 모멘텀',
        `${momentumInfo.icon} ${momentumInfo.label} ${momentumInfo.delta}`, momColor,
        momFormula, momTheory, momStudent, momAction)}

      <!-- 푸터 -->
      <div style="border-top:1px solid #e2e8f0;padding-top:7px;margin-top:10px;text-align:center;color:#94a3b8;font-size:9px;">
        본 리포트는 태청야학 수학반 AI 학습 분석 엔진에 의해 자동 생성되었습니다. · 출력일: ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>`;

    // ══════════════════════
    // page3b: 행동 패턴 지표 상세 해설 (별도 페이지)
    // ══════════════════════
    const page3b_behavior = `
    <div style="width:794px;min-height:1123px;background:white;padding:34px 40px;box-sizing:border-box;font-family:'Noto Sans KR',sans-serif;color:#1e293b;">

      ${pageHeader2('행동 패턴 지표 상세 해설', '4/5')}

      ${sH2('🔍','행동 패턴 지표')}

      ${dc('평균 참여', '평균 참여 시간',
        `세션당 약 ${activeTime.avgActiveMin}분`, activeTime.avgActiveMin >= 1 ? '#16a34a' : '#d97706',
        activeFormula, activeTheory, activeStudent, activeAction, activeWarn)}

      ${dc('오개념 고착', '오개념 고착',
        fixatedN > 0 ? `⚠️ ${fixatedN}문항` : '✅ 양호', fixatedN > 0 ? '#dc2626' : '#16a34a',
        fixatedFormula, fixatedTheory, fixatedStudent, fixatedAction, fixatedWarn)}

      ${dc('자기효능감', '자기효능감',
        selfEffN > 0 ? `점검 필요 (${selfEffN}회)` : '✅ 양호', selfEffN > 0 ? '#d97706' : '#16a34a',
        selfEffFormula, selfEffTheory, selfEffStudent, selfEffAction, selfEffWarn)}

      ${dc('자기주도 탐색', '🔭 자기주도 탐색 (그래프 탐험)',
        !explore.has ? '데이터 없음' : `${explore.breadth}/6개 개념 · ${explore.activeMin}분`, !explore.has ? '#94a3b8' : explore.breadth >= 3 ? '#2563eb' : '#d97706',
        exploreFormula, exploreTheory, exploreStudent, exploreAction, exploreWarn)}

      <!-- 푸터 -->
      <div style="border-top:1px solid #e2e8f0;padding-top:7px;margin-top:10px;text-align:center;color:#94a3b8;font-size:9px;">
        본 리포트는 태청야학 수학반 AI 학습 분석 엔진에 의해 자동 생성되었습니다. · 출력일: ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>`;

    // ══════════════════════
    // page3c: 영역별 성취도 상세 해설 + 종합 해석 안내
    // ══════════════════════
    const page3c = `
    <div style="width:794px;min-height:1123px;background:white;padding:34px 40px;box-sizing:border-box;font-family:'Noto Sans KR',sans-serif;color:#1e293b;">

      ${pageHeader2('영역별 성취도 상세 해설', '5/5')}

      ${sH2('📈','영역별 성취도 상세 해설')}

      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:10.5px;line-height:1.7;color:#334155;">
        <b style="color:#3730a3;">📌 영역별 성취도란?</b><br/>
        각 수학 영역에서 풀이한 문항의 정답률을 집계한 지표입니다. 산출식: <b>해당 영역 정답 수 ÷ 해당 영역 전체 풀이 수 × 100</b><br/>
        <b>5문항 미만인 영역은 신뢰도가 낮으므로</b> 참고 수준으로만 활용하고, 5문항 이상 축적 후 해석하는 것을 권장합니다.
        전체 평균 대비 %p = 이 학생 성취율 − 전체 학생 동일 문항 평균 (전체 N≥5일 때만 표시)
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;">
        <colgroup>
          <col style="width:90px"/>
          <col style="width:80px"/>
          <col style="width:66px"/>
          <col style="width:72px"/>
          <col/>
        </colgroup>
        <tr style="background:#3730a3;color:white;">
          <th style="padding:7px 8px;text-align:center;border:1px solid #4f46e5;">영역</th>
          <th style="padding:7px 8px;text-align:center;border:1px solid #4f46e5;">성취율</th>
          <th style="padding:7px 8px;text-align:center;border:1px solid #4f46e5;">수준</th>
          <th style="padding:7px 8px;text-align:center;border:1px solid #4f46e5;">전체 대비</th>
          <th style="padding:7px 8px;text-align:left;border:1px solid #4f46e5;">해석 및 교수자 제언</th>
        </tr>
        ${masteryDetailRows2}
      </table>

      ${sH2('📋','이 해설서 활용 안내')}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 14px;">
          <div style="font-size:11px;font-weight:900;color:#166534;margin-bottom:7px;">✅ 데이터 활용 원칙</div>
          <div style="font-size:10.5px;color:#166534;line-height:1.8;">
            • 본 해설서의 모든 지표는 앱 학습 로그 기반으로 자동 생성됩니다<br/>
            • 교사의 직접 관찰·면담과 반드시 함께 종합하여 해석하세요<br/>
            • 세션 수가 많을수록 지표 신뢰도가 높아집니다<br/>
            • 단일 지표가 아닌 <b>복합적 패턴</b>을 기준으로 판단하세요
          </div>
        </div>
        <div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 14px;">
          <div style="font-size:11px;font-weight:900;color:#991b1b;margin-bottom:7px;">⚠️ 해석 주의사항</div>
          <div style="font-size:10.5px;color:#991b1b;line-height:1.8;">
            • 오개념·자기효능감: 모의고사·기하 세션에서만 수집<br/>
            • 영역 성취율: 5문항 미만 시 신뢰도 낮음<br/>
            • 모멘텀: 6회 미만 세션에서는 참고 수준<br/>
            • 참여 시간: 실제 이벤트 추적이 아닌 <b>추정치</b>
          </div>
        </div>
      </div>

      <!-- 학습분석학 이론 배경 요약 -->
      <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:900;color:#334155;margin-bottom:8px;">📚 이 리포트의 이론적 근거</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div style="font-size:10px;color:#475569;line-height:1.7;">
            <b style="color:#3730a3;">시간적 분석</b><br/>
            모멘텀·현재상태는 단일 시점이 아닌 시간의 흐름에서 방향성을 측정. 7일 시간 창 기준.
          </div>
          <div style="font-size:10px;color:#475569;line-height:1.7;">
            <b style="color:#3730a3;">자기조절학습</b><br/>
            오개념 고착은 COPES 모델의 Evaluation 단계 실패. 메타인지 부재의 직접적 행동 흔적.
          </div>
          <div style="font-size:10px;color:#475569;line-height:1.7;">
            <b style="color:#3730a3;">정서 학습 분석</b><br/>
            자기효능감은 행동 흔적(정답 후 수정)으로 간접 측정. 설문보다 오염이 적은 객관적 데이터.
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <div style="border-top:1px solid #e2e8f0;padding-top:7px;text-align:center;color:#94a3b8;font-size:9px;">
        본 리포트는 태청야학 수학반 AI 학습 분석 엔진에 의해 자동 생성되었습니다. · 출력일: ${new Date().toLocaleDateString('ko-KR')}
      </div>
    </div>`;


    const pagesHtml = mode === 'report' ? page1 + page2
                    : mode === 'detail' ? page3a + page3b_behavior + page3c
                    : page1 + page2 + page3a + page3b_behavior + page3c;  // 'all'
    renderArea.innerHTML = pagesHtml;
    await new Promise(r => setTimeout(r, 600));

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPages = renderArea.querySelectorAll('div[style*="width:794px"]');
    for(let i=0;i<pdfPages.length;i++){
      const canvas = await window.html2canvas(pdfPages[i],{scale:2,backgroundColor:'#fff',useCORS:true,allowTaint:true,windowWidth:794,scrollX:0,scrollY:0});
      if (i > 0) pdf.addPage();
      const imgData = canvas.toDataURL('image/png');
      const pdfW = 210;
      const pdfH = Math.round((canvas.height / canvas.width) * pdfW * 100) / 100;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
    }
    renderArea.innerHTML = '';
    const fileName = mode === 'report' ? `학습분석리포트_${student.name}.pdf`
                   : mode === 'detail' ? `지표상세해설_${student.name}.pdf`
                   : `학습분석_전체묶음_${student.name}.pdf`;
    pdf.save(fileName);
    setIsExporting(false);
  };

  return(<div className="p-4 pb-36 space-y-4">
    {/* 헤더 */}
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center text-xl font-bold text-gray-500">◀</button>
      <div className="flex-1">
        <div className="text-lg font-black text-gray-800">{student.name} 학생 분석</div>
        <div className="text-xs text-gray-400 font-semibold">객관 행동 로그 기반 · 최근 {Math.min(logs.length,8)}회 세션</div>
      </div>
      {/* 📄 PDF 저장 버튼 그룹 */}
      {(()=>{
        const[showMenu,setShowMenu]=React.useState(false);
        return(
          <div className="relative">
            <button onClick={()=>setShowMenu(m=>!m)} disabled={isExporting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform whitespace-nowrap flex items-center gap-1.5">
              {isExporting?'생성 중...':'📄 PDF 저장'}
              {!isExporting&&<span className="text-xs opacity-70">▾</span>}
            </button>
            {showMenu&&!isExporting&&(
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 w-52 overflow-hidden" onClick={()=>setShowMenu(false)}>
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">PDF 저장 옵션</div>
                <button onClick={()=>exportReport('report')}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-start gap-2.5 transition-colors">
                  <span className="text-lg">📊</span>
                  <div>
                    <div>학습 분석 리포트</div>
                    <div className="text-[11px] font-normal text-gray-400 mt-0.5">현황·패턴·성취도·피드백 (2쪽)</div>
                  </div>
                </button>
                <button onClick={()=>exportReport('detail')}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-start gap-2.5 transition-colors border-t border-gray-50">
                  <span className="text-lg">📖</span>
                  <div>
                    <div>지표 상세 해설서</div>
                    <div className="text-[11px] font-normal text-gray-400 mt-0.5">이 학생 맞춤 지표 심층 해설 (3쪽)</div>
                  </div>
                </button>
                <button onClick={()=>exportReport('all')}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-start gap-2.5 transition-colors border-t border-gray-100">
                  <span className="text-lg">📦</span>
                  <div>
                    <div>전체 묶음 (5쪽)</div>
                    <div className="text-[11px] font-normal text-gray-400 mt-0.5">리포트 + 해설서 합본 (5쪽)</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>

    {/* 상단 상태 카드 */}
    <div className="bg-white rounded-3xl p-5 shadow-md border-2 border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-black text-gray-800 text-xl flex-1">👤 {student.name}</span>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${LIGHT_CLS[a.status.color]}`}>{a.status.icon} {a.status.text}</span>
      </div>

      {/* 핵심 수치 3칸 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-indigo-50 rounded-2xl p-3 text-center">
          <div className="text-2xl font-black text-indigo-700">{summary.rawAcc}<span className="text-sm">%</span></div>
          <div className="text-[10px] font-bold text-indigo-500 mt-0.5">순수<br/>정답률</div>
        </div>
        <div className={`rounded-2xl p-3 text-center ${momentum.trend==='rising'?'bg-emerald-50':momentum.trend==='declining'?'bg-red-50':'bg-blue-50'}`}>
          <div className={`text-xl font-black ${momentumInfo.cls}`}>{momentumInfo.icon}</div>
          <div className={`text-[10px] font-bold mt-0.5 ${momentumInfo.cls}`}>{momentumInfo.label}<br/>{momentumInfo.delta}</div>
        </div>
        <div className="bg-gray-50 rounded-2xl p-3 text-center">
          <div className="text-xl font-black text-gray-700">{activeTime.avgActiveMin}<span className="text-sm">분</span></div>
          <div className="text-[10px] font-bold text-gray-500 mt-0.5">세션 평균<br/>참여추정</div>
        </div>
      </div>

      {/* 정답률 추이 차트 */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-xs font-bold text-gray-500">정답률 추이</span>
          {chartData.length > 0 && (
            <span className="text-xs font-black text-indigo-500">
              최근 {chartData[chartData.length-1].acc}%
            </span>
          )}
        </div>
        {chartData.length > 1 ? (() => {
          const VW=320, VH=80, PL=28, PR=12, PT=10, PB=18;
          const W=VW-PL-PR, H=VH-PT-PB;
          const n=chartData.length;
          const xOf=i=>PL + (n===1?W/2:i*(W/(n-1)));
          const yOf=v=>PT + H*(1 - v/100);
          const pts=chartData.map((d,i)=>`${xOf(i)},${yOf(d.acc)}`).join(' ');
          return(
            <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="90" style={{display:'block'}}>
              <defs>
                <linearGradient id="cGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* 70% 기준선 */}
              <line x1={PL} y1={yOf(70)} x2={VW-PR} y2={yOf(70)} stroke="#e0e7ff" strokeWidth="1" strokeDasharray="4,3"/>
              <text x={PL-3} y={yOf(70)+3} fontSize="7" fill="#c7d2fe" textAnchor="end">70</text>
              {/* 0% / 100% 보조 레이블 */}
              <text x={PL-3} y={PT+4} fontSize="7" fill="#e5e7eb" textAnchor="end">100</text>
              <text x={PL-3} y={PT+H+4} fontSize="7" fill="#e5e7eb" textAnchor="end">0</text>
              {/* 면적 */}
              <polygon
                points={`${xOf(0)},${PT+H} ${pts} ${xOf(n-1)},${PT+H}`}
                fill="url(#cGrad)"
              />
              {/* 연결선 */}
              <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* 데이터 포인트 */}
              {chartData.map((d,i)=>{
                const x=xOf(i), y=yOf(d.acc);
                const isFirst=i===0, isLast=i===n-1;
                return(
                  <g key={i}>
                    <circle cx={x} cy={y} r={isLast||isFirst?4:2.5}
                      fill={isLast?'#6366f1':'white'}
                      stroke="#6366f1" strokeWidth="1.8"/>
                    {(isFirst||isLast)&&(
                      <text x={x} y={y-(isLast?6:6)} textAnchor="middle" fontSize="8" fill="#6366f1" fontWeight="700">
                        {d.acc}%
                      </text>
                    )}
                  </g>
                );
              })}
              {/* 날짜 축 */}
              <text x={xOf(0)} y={VH-3} textAnchor="middle" fontSize="7" fill="#d1d5db">{chartData[0].date?.slice(5)}</text>
              <text x={xOf(n-1)} y={VH-3} textAnchor="middle" fontSize="7" fill="#d1d5db">{chartData[n-1].date?.slice(5)}</text>
            </svg>
          );
        })() : <div className="text-xs text-gray-400 p-4 text-center pb-4">최소 2회 이상 기록이 필요합니다.</div>}
      </div>

      {/* 탭 전환 */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            className={`flex-1 text-[11px] font-bold py-2 rounded-xl transition-all ${tab===t.k?'bg-white text-indigo-700 shadow-sm':'text-gray-500'}`}>
            {t.lbl}
          </button>
        ))}
      </div>

      {/* ── 탭 1: 종합 ── */}
      {tab==='overview'&&(
        <div className="space-y-3">
          {/* 자기평가 분포 */}
          <div className="bg-gray-50 p-3 rounded-2xl">
            <div className="text-xs font-bold text-gray-500 mb-2">🗣️ 자기평가 감정 분포 (주관적 참고용)</div>
            <div className="flex gap-2 mb-1">
              {[['easy','😊','쉬움','text-green-600'],['normal','😐','적당','text-blue-600'],['hard','😥','어려움','text-red-500']].map(([k,ico,lbl,cls])=>(
                <div key={k} className="flex-1 bg-white p-2 rounded-xl text-center shadow-sm">
                  <div className={`text-[11px] font-bold ${cls} mb-0.5`}>{ico} {lbl}</div>
                  <div className="font-black text-gray-800">{summary.feelingCount[k]||0}회</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-400 text-center">※ 학생의 주관적 보고 — 행동 데이터와 비교할 때 의미 있음</div>
          </div>

          {/* 참여 시간 추정 */}
          <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
            <div className="text-xs font-bold text-gray-500 mb-2">⏱️ 실질 참여 시간 추정 (간이 유휴 보정)</div>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                  <span>추정 참여</span><span className="text-indigo-600">{Math.round(activeTime.totalActive/60)}분</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-400 h-2 rounded-full" style={{width:`${Math.min(100,activeTime.totalActive/(activeTime.totalActive+activeTime.totalIdle+1)*100)}%`}}/>
                </div>
                {activeTime.flaggedSessions>0&&(
                  <div className="text-[10px] text-amber-600 font-bold mt-1">⚠️ {activeTime.flaggedSessions}회 세션에서 3분 이상 응답 없는 구간 감지</div>
                )}
              </div>
              <div className="text-right text-xs text-gray-400 flex-shrink-0">
                <div className="font-bold text-gray-600">{activeTime.sessionCount}세션</div>
                <div>분석 기준</div>
              </div>
            </div>
            <div className="text-[10px] text-gray-300 mt-1">※ 유휴 감지: 문항당 3분 초과분만 추정 제외. 실제 이벤트 추적 아님.</div>
          </div>

          {/* 모멘텀 */}
          {momentum.trend!=='insufficient'&&(
            <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-gray-500 mb-2">📊 학습 모멘텀 (시계열, 순수 정답률)</div>
              <div className="flex items-center gap-3">
                <span className={`font-black text-sm ${momentumInfo.cls}`}>{momentumInfo.icon} {momentumInfo.label} {momentumInfo.delta}</span>
                <span className="text-xs text-gray-400 ml-auto">이전 {momentum.avgOlder}% → 최근 {momentum.avgRecent}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 탭 2: 행동 패턴 ── */}
      {tab==='behavior'&&(
        <div className="space-y-4">
          {/* ── 망설임 패턴: 순차형(DailyPractice) ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-black text-gray-700">🖱️ 망설임 패턴</div>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">순차형 (나눗셈·약수배수)</span>
              <span className="text-[10px] text-gray-400 font-bold ml-auto">= 진짜 망설임 시간</span>
            </div>
            {!hesitation.seq.hasData?(
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-400">
                순차형 세션 기록이 없거나 firstClickMs 미수집 (새 세션부터 수집)
              </div>
            ):(
              <div className="space-y-1.5">
                {Object.entries(HESI_CFG).filter(([k])=>k!=='unknown'&&hesitation.seq.counts[k]>0).map(([k,cfg])=>{
                  const cnt=hesitation.seq.counts[k];
                  const pct=Math.round((cnt/hesitation.seq.total)*100);
                  return(
                    <div key={k} className={`p-2.5 rounded-xl border ${cfg.cls} text-xs`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black">{cfg.lbl}</span>
                        <span className="ml-auto font-black">{cnt}문항 ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-1.5 mb-1">
                        <div className="h-1.5 rounded-full bg-current opacity-40" style={{width:`${pct}%`}}/>
                      </div>
                      <div className="opacity-70">{cfg.tip}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 망설임 패턴: 리스트형(MockExam·GeoQuiz) ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-black text-gray-700">🖱️ 망설임 패턴</div>
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">리스트형 (기하·모의고사)</span>
              <span className="text-[10px] text-gray-400 font-bold ml-auto">= 세션 내 참여 순서</span>
            </div>
            <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2 font-semibold">
              ⚠️ 10문항이 동시에 화면에 표시되므로 firstClickMs는 "몇 초 만에 이 문항을 선택했냐"가 아닌 "세션 시작 후 언제 참여했냐"입니다. 순차형과 다른 척도입니다.
            </div>
            {!hesitation.lst.hasData?(
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-400">
                리스트형 세션 기록이 없거나 firstClickMs 미수집
              </div>
            ):(
              <div className="space-y-1.5">
                {Object.entries(HESI_CFG).filter(([k])=>k!=='unknown'&&hesitation.lst.counts[k]>0).map(([k,cfg])=>{
                  const cnt=hesitation.lst.counts[k];
                  const pct=Math.round((cnt/hesitation.lst.total)*100);
                  return(
                    <div key={k} className={`p-2.5 rounded-xl border ${cfg.cls} text-xs opacity-80`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black">{cfg.lbl}</span>
                        <span className="ml-auto font-black">{cnt}문항 ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/60 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-current opacity-40" style={{width:`${pct}%`}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 답안 수정 패턴 (리스트형 전용) ── */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs font-black text-gray-700">↩ 답안 수정 패턴</div>
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">리스트형 전용</span>
            </div>
            <div className="text-[10px] text-gray-400 mb-2">DailyPractice(자유입력)는 수정 횟수를 추적하지 않습니다.</div>
            {!revision.hasData?(
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-400">
                리스트형 세션 기록이 없거나 revisionCount 미수집 (새 세션부터 수집)
              </div>
            ):(
              <div className="space-y-1.5">
                {Object.entries(REV_CFG).filter(([k])=>k!=='unknown'&&revision.counts[k]>0)
                  .sort(([ka],[kb])=>['fixated','searching','uncertain_capable','reconsidered','confident'].indexOf(ka)-['fixated','searching','uncertain_capable','reconsidered','confident'].indexOf(kb))
                  .map(([k,cfg])=>{
                    const cnt=revision.counts[k];
                    const pct=Math.round((cnt/revision.total)*100);
                    return(
                      <div key={k} className={`p-2.5 rounded-xl border ${cfg.cls} text-xs`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black">{cfg.lbl}</span>
                          <span className="ml-auto font-black">{cnt}문항 ({pct}%)</span>
                        </div>
                        <div className="w-full bg-white/60 rounded-full h-1.5 mb-1">
                          <div className="h-1.5 rounded-full bg-current opacity-40" style={{width:`${pct}%`}}/>
                        </div>
                        <div className="opacity-70">{cfg.tip}</div>
                      </div>
                    );
                  })}
                {revision.counts.fixated>2&&(
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-bold">
                    🚨 오개념 고착 {revision.counts.fixated}문항 — 수정 없이 반복 오답. 즉각 개념 교정 필요.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 탭 3: 영역 성취 ── */}
      {tab==='mastery'&&(
        <div className="space-y-3">
          <div className="text-xs text-gray-500 font-semibold">
            영역별 순수 정답률 · 전체 학생 비교 (N≥5일 때 표시)
          </div>
          {qStatsLoading&&<div className="text-xs text-gray-400 text-center py-4">전체 학생 데이터 로드 중...</div>}

          {relativeMastery.length===0&&!qStatsLoading&&(
            <div className="text-center py-6 text-gray-400 text-sm">각 영역 2문항 이상 & qTopicHash 데이터 필요</div>
          )}

          {relativeMastery.map((m,i)=>{
            const hasRef=m.allRate!=null;
            const gapCls=m.gap==null?'text-gray-400':m.gap>=10?'text-emerald-600':m.gap>=-10?'text-blue-600':'text-red-600';
            const barCls=m.myRate>=75?'bg-emerald-400':m.myRate>=45?'bg-amber-400':'bg-red-400';
            return(
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-sm text-gray-800 flex-1">{m.topic}</span>
                  <span className="font-black text-sm text-indigo-700">{m.myRate}%</span>
                  {hasRef&&<span className={`text-xs font-bold ${gapCls}`}>{m.gap>=0?'+':''}{m.gap}%p vs 전체</span>}
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div className={`h-2 rounded-full ${barCls}`} style={{width:`${m.myRate}%`}}/>
                  {hasRef&&<div className="h-1 bg-gray-400/40 rounded-full -mt-1.5" style={{width:`${m.allRate}%`,marginTop:'-4px'}}/>}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                  <span>내 {m.myTotal}문항</span>
                  {hasRef?<span>전체 {m.allTotal}명 평균 {m.allRate}%</span>:<span className="text-amber-500">전체 N={m.allTotal||0} (5명 미만 → 참고 불가)</span>}
                </div>
              </div>
            );
          })}

          {!qStatsLoading&&relativeMastery.length>0&&(
            <div className="text-[10px] text-gray-300 text-center">
              ⚠️ 문제는 매 세션마다 새로 생성됩니다. "전체 학생"은 같은 토픽 유형을 풀었던 모든 학생의 집계입니다.
            </div>
          )}
        </div>
      )}

      {/* ── 탭 4: 세션 기록 ── */}
      {tab==='sessions'&&(
        <div className="text-base font-black text-gray-700 mb-2">세션 상세 기록</div>
      )}
    </div>

    {/* 세션 기록 (탭 4 또는 항상 표시) */}
    {tab==='sessions'&&(<div className="space-y-3">
      {logs.length===0&&<div className="text-center text-gray-400 py-8 font-bold">학습 기록이 없어요.</div>}
      {logs.map((log,i)=>{
        const isOpen=open===i;
        const feelIco=log.feeling==='easy'?'😊':log.feeling==='hard'?'😥':log.feeling==='normal'?'😐':'';
        const rawAcc=calcRawAccuracy(log.questions);
        const{activeSec,flagged}=estimateActiveTime(log.totalSec,log.questions?.length||10);
        return(
          <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="flex items-center p-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-sm mb-1">{fmtDate(log.date)} {log.time} {feelIco}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">{log.type}</span>
                  <span className="font-black text-indigo-600 text-xs">{log.score}</span>
                  {rawAcc!==null&&<span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full">정답률 {rawAcc}%</span>}
                  {log.totalSec&&<span className="text-xs text-gray-400">⏱️{Math.floor(activeSec/60)}분{activeSec%60}초{flagged?'(⚠️유휴있음)':''}</span>}
                </div>
              </div>
              <button onClick={()=>setOpen(isOpen?null:i)} className="text-xs text-indigo-600 font-bold px-3 py-2 bg-indigo-50 rounded-xl ml-2 flex-shrink-0">{isOpen?'닫기':'문항보기'}</button>
            </div>
            {isOpen&&log.questions&&(
              <div className="p-3 space-y-2 bg-gray-50">
                {log.questions.map((q,j)=>{
                  const hCls=q.firstClickMs!=null?HESI_CFG[classifyHesitation(q.firstClickMs,q.isOk)]?.cls:'';
                  const rCls=q.revisionCount!=null?REV_CFG[classifyRevision(q.revisionCount,q.isOk)]?.cls:'';
                  return(
                    <div key={j} className={`rounded-xl p-3 text-xs border ${q.isOk?'bg-white border-gray-200':'bg-red-50 border-red-200'}`}>
                      <div className="flex gap-2 mb-1">
                        <span className="font-black text-gray-500">Q{j+1}.</span>
                        <span className="font-bold text-gray-800 flex-1 leading-relaxed">{q.qTxt}</span>
                        <span className={`font-black text-sm flex-shrink-0 ${q.isOk?'text-green-500':'text-red-500'}`}>{q.isOk?'O':'X'}</span>
                      </div>
                      {/* 행동 지표 뱃지 */}
                      <div className="flex items-center gap-1.5 pl-6 flex-wrap mt-1">
                        {q.meta&&<span className="text-[10px] text-indigo-400 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-full">{q.meta.type}</span>}
                        {q.firstClickMs!=null&&(
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${hCls}`}>
                            🕐 {Math.round(q.firstClickMs/1000)}s
                          </span>
                        )}
                        {q.revisionCount!=null&&q.revisionCount>0&&(
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${rCls}`}>
                            ↩ {q.revisionCount}회 수정
                          </span>
                        )}
                        {q.timeSec!=null&&q.timeSec>0&&!q.firstClickMs&&(
                          <span className="text-[10px] text-gray-400 font-bold">⏱️{q.timeSec}초</span>
                        )}
                      </div>
                      {!q.isOk&&<div className="mt-1.5 pl-6 text-gray-500">내 답: {q.uAns} → <span className="text-red-600 font-bold">{q.cAns}</span></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>)}
  </div>);
}

