// === js/student/explore.js ===
/* --------------------------------------------------------------------
   기하학 탭 화면
   개념 학습 · 그래프 탐험
   -------------------------------------------------------------------- */

function GeometryTab({userData, onUpdate}){
  const[subTab,setSubTab]=useState('learn');
  const sz=useCanvasSize();
  return(<div className="flex flex-col h-full">
    <div className="tab-scroll bg-white border-b shadow-sm flex-shrink-0">
      <div className="flex px-2 min-w-max">
        {[{k:'learn',lbl:'🔭 그래프 탐험'},{k:'concept',lbl:'📖 개념 설명'}].map(t=>(
          <button key={t.k} onClick={()=>setSubTab(t.k)} className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${subTab===t.k?'border-blue-500 text-blue-600':'border-transparent text-gray-500'}`}>{t.lbl}</button>
        ))}
      </div>
    </div>
    {subTab==='learn'&&<GeometryLearn sz={sz} userData={userData} onUpdate={onUpdate}/>}
    {subTab==='concept'&&<ConceptSection/>}
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
