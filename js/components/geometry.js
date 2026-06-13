function GeometryTab({userData, onUpdate}){
  const[subTab,setSubTab]=useState('learn');
  const sz=useCanvasSize();
  return(<div className="flex flex-col h-full">
    <div className="tab-scroll bg-white border-b shadow-sm flex-shrink-0">
      <div className="flex px-2 min-w-max">
        {[{k:'learn',lbl:'🔭 그래프 탐험'},{k:'concept',lbl:'📖 개념 설명'},{k:'quiz',lbl:'📝 문제 풀기'}].map(t=>(
          <button key={t.k} onClick={()=>setSubTab(t.k)} className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${subTab===t.k?'border-blue-500 text-blue-600':'border-transparent text-gray-500'}`}>{t.lbl}</button>
        ))}
      </div>
    </div>
    {subTab==='learn'&&<GeometryLearn sz={sz} userData={userData} onUpdate={onUpdate}/>}
    {subTab==='concept'&&<ConceptSection/>}
    {/* 퀴즈 컴포넌트로 데이터 저장 함수를 넘겨줍니다 */}
    {subTab==='quiz'&&<GeometryQuiz userData={userData} onUpdate={onUpdate}/>}
  </div>);
}

function GeometryLearn({sz, userData, onUpdate}){
  const[tab,setTab]=useState('rad');
  const[zoom,setZoom]=useState(1);
  const[panX,setPanX]=useState(0);
  const[panY,setPanY]=useState(0);
  const[fs,setFs]=useState(false); // fullscreen
  const contentRef=useRef(null);
  const[measuredW,setMeasuredW]=useState(0);

  /* ── 탐색 활동 계측 (체류 시간이 아닌 '상호작용 기반' 측정) ──
     · 체류 시간은 유휴/배경 노출을 포함해 학습 신호로 부적절하므로 사용하지 않음
     · 대신 ①실질 조작 시간(유휴 보정) ②상호작용 횟수 ③탐색한 개념 폭을 누적
     · 성취도가 아닌 '자기주도 탐색·호기심' 지표로 분리 수집 */
  const EXPLORE_IDLE_CAP_MS=60000;  // 상호작용 간격이 60초 미만일 때만 실질 활동으로 인정
  const xpRef=useRef({count:0,activeMs:0,lastTs:0,concepts:{}});
  const tabRef=useRef('rad');
  useEffect(()=>{tabRef.current=tab;},[tab]);
  const bumpInteract=useCallback(()=>{
    const x=xpRef.current; const now=Date.now();
    if(x.lastTs){const gap=now-x.lastTs; if(gap>0&&gap<EXPLORE_IDLE_CAP_MS)x.activeMs+=gap;}
    x.lastTs=now; x.count++;
    x.concepts[tabRef.current]=(x.concepts[tabRef.current]||0)+1;
  },[]);
  // 첫 진입 개념도 한 번 기록
  useEffect(()=>{xpRef.current.concepts['rad']=(xpRef.current.concepts['rad']||0);},[]);
  // 그래프 영역의 모든 직접 조작(점 드래그·슬라이더 등)을 버블링으로 포착
  useEffect(()=>{
    const el=contentRef.current; if(!el)return;
    const h=()=>bumpInteract();
    el.addEventListener('pointerdown',h,{passive:true});
    el.addEventListener('touchstart',h,{passive:true});
    return()=>{el.removeEventListener('pointerdown',h);el.removeEventListener('touchstart',h);};
  },[bumpInteract,fs]);
  // 탐험 종료 시(언마운트) 누적치를 사용자 데이터에 병합 저장
  useEffect(()=>()=>{
    const x=xpRef.current;
    if(!userData||userData.role==='admin')return;
    // 사소한 방문(상호작용 3회 미만 또는 실질 활동 8초 미만)은 기록하지 않음 → 노이즈 차단
    if(x.count<3||x.activeMs<8000)return;
    const prev=userData.geoExplore||{sessions:0,totalActiveSec:0,totalInteractions:0,concepts:{}};
    const mergedConcepts={...(prev.concepts||{})};
    Object.keys(x.concepts).forEach(k=>{mergedConcepts[k]=(mergedConcepts[k]||0)+x.concepts[k];});
    const geoExplore={
      sessions:(prev.sessions||0)+1,
      totalActiveSec:(prev.totalActiveSec||0)+Math.round(x.activeMs/1000),
      totalInteractions:(prev.totalInteractions||0)+x.count,
      concepts:mergedConcepts,
      updatedAt:Date.now()
    };
    const upd={...userData,geoExplore};
    try{
      db.collection('users').doc(upd.name).set({geoExplore},{merge:true});
      if(onUpdate)onUpdate(upd);
    }catch(e){/* 저장 실패는 조용히 무시 (탐색 보조 지표) */}
  },[userData,onUpdate]);

  useEffect(()=>{
    if(!contentRef.current)return;
    const ro=new ResizeObserver(e=>setMeasuredW(e[0].contentRect.width));
    ro.observe(contentRef.current);
    return()=>ro.disconnect();
  },[]);

  const Active=GEO_TABS.find(t=>t.k===tab)?.C;
  const baseSC=measuredW>0?Math.floor(Math.min(measuredW,sz.W)/13):sz.SC;
  const baseSz={SC:baseSC,W:baseSC*13,H:baseSC*13};
  const onPan=useCallback((px,py)=>{setPanX(px);setPanY(py)},[]);
  const onZoom=useCallback((nz,npx,npy)=>{setZoom(Math.max(0.5,Math.min(3,nz)));if(npx!==undefined)setPanX(Math.max(-12,Math.min(12,npx)));if(npy!==undefined)setPanY(Math.max(-12,Math.min(12,npy)))},[]);
  const zoomedSz=useMemo(()=>({W:baseSz.W,H:baseSz.H,SC:Math.round(baseSz.SC*zoom),panX,panY,zoom,onPan,onZoom}),[baseSz,zoom,panX,panY,onPan,onZoom]);

  const szLive=useRef({});
  szLive.current={SC:Math.round(baseSC*zoom),W:baseSz.W,H:baseSz.H,zoom,panX,panY};
  useEffect(()=>{
    const el=contentRef.current;if(!el)return;
    const onWheel=e=>{
      const svgEl=e.target.closest('svg');if(!svgEl)return;
      e.preventDefault();
      const{SC,W,H,zoom,panX,panY}=szLive.current;
      const r=svgEl.getBoundingClientRect();
      const mx=e.clientX-r.left,my=e.clientY-r.top;
      const midMX=(mx-W/2)/SC+panX,midMY=(H/2-my)/SC+panY;
      const factor=e.deltaY>0?1/1.12:1.12;
      const nz=Math.max(0.5,Math.min(3,zoom*factor));
      const sc=nz/zoom;
      onZoom(nz,Math.max(-12,Math.min(12,midMX+(panX-midMX)/sc)),Math.max(-12,Math.min(12,midMY+(panY-midMY)/sc)));
    };
    el.addEventListener('wheel',onWheel,{passive:false});
    return()=>el.removeEventListener('wheel',onWheel);
  },[onZoom]);

  const handleTab=k=>{setTab(k);setPanX(0);setPanY(0);bumpInteract();};
  const resetAll=()=>{setZoom(1);setPanX(0);setPanY(0);};
  const hasPan=panX!==0||panY!==0;
  const tabLabel=GEO_TABS.find(t=>t.k===tab)?.lbl||'';

  // ── 전체화면 모드 ──
  if(fs)return(
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#fff',display:'flex',flexDirection:'column'}}>
      {/* 최소 상단 바 */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#1e293b',flexShrink:0}}>
        <button onClick={()=>setFs(false)} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:10,padding:'8px 16px',fontWeight:900,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
          ← 뒤로
        </button>
        <span style={{color:'#e2e8f0',fontWeight:700,fontSize:14,flex:1}}>{tabLabel}</span>
        <span style={{color:'#94a3b8',fontSize:12}}>{zoom.toFixed(1)}×</span>
        <input type="range" min={0.5} max={3} step={0.05} value={zoom} onChange={e=>setZoom(Number(e.target.value))}
          style={{width:80,accentColor:'#3b82f6'}}/>
        <button onClick={resetAll} style={{background:'#374151',color:'#9ca3af',border:'none',borderRadius:8,padding:'4px 10px',fontWeight:700,fontSize:12,cursor:'pointer'}}>초기화</button>
      </div>
      <div ref={contentRef} style={{flex:1,overflow:'hidden',padding:8,display:'flex',alignItems:'center',justifyContent:'center',paddingBottom:'env(safe-area-inset-bottom,12px)'}}>
        {Active&&<Active sz={zoomedSz}/>}
      </div>
    </div>
  );

  return(<div className="flex flex-col flex-1 overflow-auto">
    <div className="tab-scroll bg-gray-50 border-b flex-shrink-0">
      <div className="flex px-1 min-w-max">{GEO_TABS.map(t=><button key={t.k} onClick={()=>handleTab(t.k)} className={`px-3 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap ${tab===t.k?'border-blue-500 text-blue-600':'border-transparent text-gray-500'}`}>{t.lbl}</button>)}</div>
    </div>
    {/* ── 배율 조정 바: tab-scroll과 동일한 독립 가로 스크롤 컨테이너 ── */}
    <div className="tab-scroll bg-white border-b flex-shrink-0" style={{overflowX:'auto',overflowY:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:0,padding:'0',minWidth:'max-content',height:44}}>
        {/* 현재 배율 표시 */}
        <span style={{padding:'0 10px',fontWeight:900,fontSize:13,color:'#6366f1',flexShrink:0,letterSpacing:'-0.3px'}}>{zoom.toFixed(1)}×</span>
        {/* 배율 스텝 버튼들 */}
        {[0.5,0.7,1.0,1.3,1.6,2.0,2.5,3.0].map(v=>(
          <button key={v} onClick={()=>setZoom(v)}
            style={{flexShrink:0,padding:'6px 12px',fontSize:12,fontWeight:700,borderBottom:`2px solid ${Math.abs(zoom-v)<0.03?'#6366f1':'transparent'}`,color:Math.abs(zoom-v)<0.03?'#6366f1':'#94a3b8',background:'none',whiteSpace:'nowrap',height:'100%',transition:'all 0.15s'}}>
            {v}×
          </button>
        ))}
        {/* 구분선 */}
        <span style={{width:1,height:22,background:'#e2e8f0',flexShrink:0,margin:'0 4px'}}/>
        {/* 미세 조절 슬라이더 */}
        <span style={{fontSize:11,color:'#cbd5e1',flexShrink:0,paddingLeft:4}}>세밀</span>
        <input type="range" min={0.5} max={3} step={0.05} value={zoom}
          onChange={e=>setZoom(Number(e.target.value))}
          style={{width:90,flexShrink:0,accentColor:'#6366f1',margin:'0 6px'}}/>
        {/* 구분선 */}
        <span style={{width:1,height:22,background:'#e2e8f0',flexShrink:0,margin:'0 4px'}}/>
        <button onClick={resetAll} style={{flexShrink:0,padding:'4px 10px',fontSize:11,fontWeight:700,color:'#94a3b8',background:'none',whiteSpace:'nowrap'}}>초기화</button>
        <button onClick={()=>setFs(true)} style={{flexShrink:0,margin:'0 8px 0 2px',padding:'5px 12px',fontSize:11,fontWeight:700,background:'#3b82f6',color:'#fff',borderRadius:8,whiteSpace:'nowrap'}}>🔍 확대</button>
      </div>
    </div>
    {hasPan&&<div className="flex items-center justify-between px-4 py-1.5 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
      <span className="text-xs text-indigo-600 font-bold">📍 이동 중 ({panX>0?'+':''}{panX.toFixed(1)}, {panY>0?'+':''}{panY.toFixed(1)})</span>
      <button onClick={()=>{setPanX(0);setPanY(0);}} className="text-xs px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-bold">원점으로</button>
    </div>}
    <div className="px-4 pt-1 pb-0 flex-shrink-0">
      <p className="text-xs text-gray-400">💡 배경을 길게 누르면 이동 · 🔍 확대 버튼으로 전체화면</p>
    </div>
    <div ref={contentRef} className="p-4 flex-1 overflow-auto" style={{paddingBottom:'calc(6rem + env(safe-area-inset-bottom,0px))'}}>{Active&&<Active sz={zoomedSz}/>}</div>
  </div>);
}

function ConceptSection(){
  const[open,setOpen]=useState(null);
  return(<div className="p-4 space-y-3 pb-36">
    <div className="text-sm text-gray-500 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm font-semibold">어려운 수학 용어를 쉬운 말로! 각 항목을 눌러 자세히 봐요 👇</div>
    {CONCEPTS.map((c,i)=>{const cl=CMAP[c.color];const isOpen=open===i;return(
      <div key={i} className={`rounded-2xl border-2 ${cl.bd} ${cl.bg} overflow-hidden shadow-sm`}>
        <button onClick={()=>setOpen(isOpen?null:i)} className="w-full px-5 py-4 flex items-center gap-3 text-left">
          <span className="text-3xl">{c.icon}</span>
          <div className="flex-1"><div className={`font-bold text-lg ${cl.hd}`}>{c.title}</div><div className="text-sm text-gray-500 mt-0.5">{c.simple}</div></div>
          <span className="text-gray-400 text-xl">{isOpen?'▲':'▼'}</span>
        </button>
        {isOpen&&<div className="px-5 pb-5 space-y-3 border-t border-white/60">
          <div className="mt-3 space-y-2">{c.detail.map((d,j)=><div key={j} className="flex gap-2 text-base text-gray-700 bg-white/60 rounded-xl p-3"><span className="text-gray-400 flex-shrink-0">•</span><span>{d}</span></div>)}</div>
          <div className={`rounded-2xl p-3 text-center font-bold text-base ${cl.badge}`}>공식: {c.formula}</div>
          <div className="text-sm text-gray-600 bg-white rounded-xl p-3 border border-gray-200">💡 <strong>핵심:</strong> {c.tip}</div>
          <div className={`text-base font-bold ${cl.hd} bg-white rounded-xl p-3 border ${cl.bd}`}>{c.mem}</div>
        </div>}
      </div>);})}
  </div>);
}

function GeometryQuiz({userData, onUpdate}){
  const GEO_SET=[{icon:'🌿',lbl:'무리함수',gen:genRadicalQ},{icon:'🔀',lbl:'유리함수',gen:genRationalQ},{icon:'🏹',lbl:'이차함수',gen:genQuadraticQ},{icon:'📏',lbl:'점↔직선',gen:genDistanceQ},{icon:'⭕',lbl:'원',gen:genCircleQ},{icon:'🪞',lbl:'대칭이동',gen:genSymmetryQ}];
  const[concept,setConcept]=useState(null);const[problems,setProbs]=useState([]);const[sel,setSel]=useState({});
  const[isGraded, setIsGraded]=useState(false);
  const wsRef=useRef();
  const[startTime, setStartTime] = useState(Date.now());
  const[saved, setSaved] = useState(false);
  // ── 행동 추적 (신규) ──
  const[firstClickTimes,setFirstClickTimes]=useState({});
  const[revisionCounts,setRevisionCounts]=useState({});

  const gen=(cs)=>{
    setProbs(Array.from({length:5},()=>cs.gen()));
    setSel({});setIsGraded(false);setConcept(cs);setStartTime(Date.now());setSaved(false);
    setFirstClickTimes({});setRevisionCounts({});
  };
  const ORD=['①','②','③','④'];
  
  if(!concept)return(<div className="p-4 pb-36">
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-sm text-blue-700 font-semibold">📌 공부하고 싶은 개념을 선택하면 랜덤 문제 5개가 생성됩니다!</div>
    <div className="grid grid-cols-2 gap-3">
      {GEO_SET.map(cs=><button key={cs.lbl} onClick={()=>gen(cs)} className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 text-left shadow-lg active:scale-95 transition-transform">
        <div className="text-3xl mb-2">{cs.icon}</div><div className="font-bold text-base">{cs.lbl}</div>
        <div className="mt-2 text-xs bg-white/20 rounded-lg px-2 py-1 inline-block">문제 시작 →</div>
      </button>)}
    </div></div>);
    
  const correct=problems.filter((_,i)=>sel[i]===problems[i]?.answer).length;
  const answered=Object.keys(sel).length;

  const saveQuizLog = async (feeling) => {
    if(saved || !userData) return;
    const totalSec = Math.round((Date.now() - startTime) / 1000);
    const qs = problems.map((p, i) => {
      const fms = firstClickTimes[i] ?? null;
      return{
        qTxt: p.q,
        uAns: sel[i] !== undefined ? p.choices[sel[i]] : '미입력',
        cAns: p.choices[p.answer],
        isOk: sel[i] === p.answer,
        timeSec: fms!=null ? Math.round(fms/1000) : null, // 균등배분 오류 수정
        firstClickMs: fms,
        revisionCount: revisionCounts[i] ?? 0,
        qTopicHash: getTopicHash(p),
        explanation: easyExplanation(p),
        meta: { category: 'geometry', type: concept.lbl, diff: '기하' }
      };
    });
    const log = {
      date: todayStr(), time: timeStr(), type: `기하: ${concept.lbl}`,
      score: `${correct} / 5`, questions: qs, totalSec, feeling
    };
    const upd = {...userData, logs: [log, ...(userData.logs||[])]};
    try {
      await db.collection('users').doc(upd.name).set(upd, {merge:true});
      if(onUpdate) onUpdate(upd);
      setSaved(true);
      updateQStats(qs); // fire-and-forget
    } catch(e) { alert('저장 실패. 인터넷 연결을 확인해주세요.'); }
  };

  return(<div className="flex flex-col flex-1 overflow-auto">
    <div className="bg-white border-b px-3 py-2.5 flex items-center gap-2 flex-wrap sticky top-0 z-10">
      <button onClick={()=>setConcept(null)} className="text-gray-500 text-sm font-bold">← 개념선택</button>
      <span className="text-lg">{concept.icon}</span><span className="text-sm font-bold text-gray-800">{concept.lbl}</span>
      {isGraded&&<span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-bold">결과: {correct}개 정답</span>}
      <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
        <button onClick={()=>gen(concept)} className="text-xs px-2.5 py-1.5 rounded-xl bg-indigo-500 text-white font-bold">🔄 새문제</button>
      </div>
    </div>
    <div className="p-3 pb-36" ref={wsRef}>
      <div className="ws-print-area grid grid-cols-1 gap-4 max-w-xl mx-auto bg-white p-4 rounded-2xl shadow-sm">
        {problems.map((prob,i)=>{
          const isSel=sel[i]!==undefined;
          const isCorrect=sel[i]===prob.answer;
          return(
          <div key={i} className="ws-problem border-2 border-gray-200 rounded-2xl p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-indigo-500 text-white text-sm font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
              <span className="text-sm font-bold text-indigo-600">{prob.topic}</span>
              {/* 채점된 이후에만 정답(O/X) 이모지 표시 */}
              {isGraded && isSel && <span className="ml-auto text-base">{isCorrect?'✅':'❌'}</span>}
            </div>
            <p className="text-base text-gray-800 leading-relaxed mb-3 font-medium">{prob.q}</p>
            {prob.graph && <div className="flex justify-center mb-3"><GraphPreview q={prob}/></div>}
            <div className="grid grid-cols-1 gap-2.5">
                {prob.choices.map((ch,j)=>{
                  let cls='bg-gray-50 border-gray-200 text-gray-700';
                  // 채점 전/후에 따른 보기 색상 변경 로직
                  if(isGraded) {
                    if(sel[i]===j) cls = j===prob.answer ? 'bg-green-100 border-green-400 text-green-800 font-bold' : 'bg-red-100 border-red-400 text-red-700';
                    else if(j===prob.answer) cls = 'bg-green-50 border-green-300 text-green-700 font-semibold';
                  } else {
                    if(sel[i]===j) cls = 'bg-blue-100 border-blue-400 text-blue-800 font-semibold';
                  }
                  // 채점 전(!isGraded)에만 클릭 가능하게 설정
                  return <button key={j} onClick={()=>{
                    if(isGraded)return;
                    const now=Date.now()-startTime;
                    if(firstClickTimes[i]===undefined)setFirstClickTimes(p=>({...p,[i]:now}));
                    else if(sel[i]!==undefined&&sel[i]!==j)setRevisionCounts(p=>({...p,[i]:(p[i]||0)+1}));
                    setSel(s=>({...s,[i]:j}));
                  }} className={`text-left text-lg px-4 py-3 rounded-xl border transition-all ${cls}`}>{ORD[j]} <MathText v={ch}/></button>
                })}
            </div>
            {/* 채점 후에 틀렸을 경우 정답 텍스트 표시 */}
            {isGraded && !isCorrect && <div className="mt-3 text-base font-bold rounded-xl px-3 py-2 text-center border bg-red-50 text-red-700 border-red-200">정답: {ORD[prob.answer]} <MathText v={prob.choices[prob.answer]}/></div>}
            {isGraded&&<ExplanationBox q={prob}/>}
          </div>);})}
      </div>
      
      {/* 모두 풀었을 때 나타나는 [채점하기] 버튼 */}
      {answered === 5 && !isGraded && (
        <div className="mt-6 text-center fade-in">
          <button onClick={()=>{setIsGraded(true);saveQuizLog('auto');}} className="w-full max-w-sm py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-all">채점하기 📝</button>
        </div>
      )}

      {/* 채점 완료 후 나타나는 감정 기록 버튼 */}
      {isGraded && !saved && (
        <div className="mt-6 bg-white p-5 rounded-3xl shadow-sm text-center border-2 border-indigo-100 fade-in">
          <div className="text-xl font-black text-indigo-700 mb-2">🎯 총 {correct}문제 정답!</div>
          <div className="font-bold text-gray-700 mb-4 text-base">이번 기하학 퀴즈는 어떠셨나요? 평가 후 기록이 저장됩니다.</div>
          <div className="flex gap-3 justify-center">
            <button onClick={()=>saveQuizLog('easy')} className="px-5 py-4 bg-green-100 text-green-700 rounded-2xl font-black text-lg active:scale-95 transition-transform">쉬웠어요 😊</button>
            <button onClick={()=>saveQuizLog('normal')} className="px-5 py-4 bg-blue-100 text-blue-700 rounded-2xl font-black text-lg active:scale-95 transition-transform">적당했어요 😐</button>
            <button onClick={()=>saveQuizLog('hard')} className="px-5 py-4 bg-red-100 text-red-700 rounded-2xl font-black text-lg active:scale-95 transition-transform">어려웠어요 😥</button>
          </div>
        </div>
      )}
      {isGraded && saved && (
        <div className="mt-6 text-center">
          <div className="inline-block bg-green-100 text-green-700 font-bold px-6 py-3 rounded-2xl">✅ 학습 기록에 저장되었습니다!</div>
        </div>
      )}
    </div>
  </div>);
}

/* ===== MOCK EXAM TAB ===== */
