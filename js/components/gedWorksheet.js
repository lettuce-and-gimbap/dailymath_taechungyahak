// === js/components/gedWorksheet.js ===
/* =====================================================================
   만능 학습지 편집실 (선생님 탭)
   - 좌표 중심 프리셋 + 고졸 검정고시 20문항 전 유형 선택
   - 유형별 [개념] → [예제] → [실전 n문항] 자동 생성, 문항별 조건 편집 / 새 숫자 / 삭제 / 추가
   - 글자 편집 모드(내용 덮어쓰기), 정답 보기, 사지선다·서술형 전환, 2단 인쇄, 글자 크기
   - 인쇄/PDF(새 창), 새 탭 열기, Firestore 저장/불러오기, JSON 내보내기/불러오기, 자동 임시저장
   ===================================================================== */
var GED_LS_KEY='ged_sheet_builder_v1';
var GED_DEF_CFG={title:'고졸 검정고시 수학 · 좌표 완전정복 학습지',subtitle:'좌표 기초 · 대칭이동 · 평행이동 · 이차함수 · 원의 방정식 · 유리·무리함수 · 내분점 — 2024년 이후 출제 유형 중심',
  fs:24,cols2:false,showAns:false,format:'choice',includeConcept:true,includeExample:true,intro:true,count:3};

function gedNewRec(u,idx,params){return{key:`${u.id}-${idx}-${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,uid:u.id,idx,params,override:null,rev:0};}
function gedSafeBuild(u,p){try{const r=u.build(p);return r&&!r.err?r:null;}catch(e){return null;}}
/* 유형 하나에 대해 예제 + 실전 n문항 생성 (문제 텍스트 중복 방지) */
function gedGenUnit(u,count,withEx){
  const out=[];
  if(withEx)out.push(gedNewRec(u,0,{...u.def}));
  const seen=new Set();
  for(let i=1;i<=count;i++){
    let params=null;
    for(let t=0;t<20;t++){const c=u.rand();const r=gedSafeBuild(u,c);if(!r)continue;
      const k=r.q+'|'+(r.answerTex||r.answerRaw||'');if(!seen.has(k)){seen.add(k);params=c;break;}}
    if(!params){for(let t=0;t<10&&!params;t++){const c=u.rand();if(gedSafeBuild(u,c))params=c;}}
    out.push(gedNewRec(u,i,params||{...u.def}));
  }
  return out;
}

/* 숫자 조건 입력칸 — 포커스를 잃지 않도록 로컬 상태로 관리, 유효한 정수일 때만 부모에 반영 */
function GedNumField({label,value,min,max,onCommit}){
  const[v,setV]=useState(String(value));
  useEffect(()=>{setV(String(value));},[value]);
  const tRef=useRef(null);
  const change=e=>{const s=e.target.value;setV(s);clearTimeout(tRef.current);
    const n=parseInt(s,10);if(!isNaN(n)&&n!==value){tRef.current=setTimeout(()=>onCommit(n),350);}};
  return<label>{label}<input type="number" value={v} min={min} max={max} onChange={change} onBlur={()=>{const n=parseInt(v,10);if(!isNaN(n)&&n!==value){clearTimeout(tRef.current);onCommit(n);}}}/></label>;
}

/* 문제 카드 : 생성 HTML(또는 덮어쓴 HTML) + 조건 편집 패널 */
function GedProblemCard({rec,unit,no,edit,showCtrl,onParam,onRandom,onRemove,onRevert,onOverride,getOverride}){
  const ref=useRef();
  const paramsKey=JSON.stringify(rec.params);
  const html=useMemo(()=>getOverride(rec.key)||GS.probHTML(unit,rec.params,rec.idx,no),[paramsKey,rec.rev,rec.idx,no]);
  useEffect(()=>{GS.renderTex(ref.current);},[html]);
  const isEx=rec.idx===0;
  return<div className={`card${isEx?' ex':''}${rec.override?' overridden':''}`}>
    <div ref={ref} className="pslot" contentEditable={edit} suppressContentEditableWarning={true}
      onInput={e=>onOverride(rec.key,e.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{__html:html}}/>
    {showCtrl&&<div className="ctrl noprint">
      <span className="tag">{isEx?'예제':'실전'} 조건</span>
      {unit.fields.map(f=>f.sel
        ?<label key={f.k}>{f.label} <select value={rec.params[f.k]} onChange={e=>onParam(rec.key,f.k,e.target.value)}>{f.sel.map(o=><option key={o} value={o}>{o}</option>)}</select></label>
        :<GedNumField key={f.k} label={f.label} value={rec.params[f.k]} min={f.min} max={f.max} onCommit={n=>onParam(rec.key,f.k,n)}/>)}
      <button onClick={()=>onRandom(rec.key)}>🎲 새 숫자</button>
      {rec.override&&<button onClick={()=>onRevert(rec.key)}>↩ 생성 상태로</button>}
      <button className="danger" onClick={()=>onRemove(rec.key)}>✕ 삭제</button>
    </div>}
  </div>;
}

function GedWorksheetTab(){
  const UNITS=GED_UNITS;const byId=id=>UNITS.find(u=>u.id===id);
  const init=useMemo(()=>{try{const d=JSON.parse(localStorage.getItem(GED_LS_KEY)||'null');if(d&&d.cfg&&Array.isArray(d.problems))return d;}catch(e){}return null;},[]);
  const[cfg,setCfgRaw]=useState(init?{...GED_DEF_CFG,...init.cfg}:GED_DEF_CFG);
  const setCfg=patch=>setCfgRaw(c=>({...c,...patch}));
  const[selected,setSelected]=useState(init?.selected||GED_PRESETS[0].ids);
  const[problems,setProblems]=useState(init?.problems||[]);
  const[docId,setDocId]=useState(init?.docId||null);
  const[edit,setEdit]=useState(false);
  const[showCtrl,setShowCtrl]=useState(true);
  const[showSetup,setShowSetup]=useState(true);
  const[showUnits,setShowUnits]=useState(false);
  const[sheetList,setSheetList]=useState([]);
  const[busy,setBusy]=useState(false);
  const[toast,setToast]=useState('');
  const ovRef=useRef({});
  const sheetRef=useRef();
  const fileRef=useRef();
  useEffect(()=>{(init?.problems||[]).forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;});},[]);

  const showToast=m=>{setToast(m);clearTimeout(showToast._t);showToast._t=setTimeout(()=>setToast(''),2600);};
  const withOv=ps=>ps.map(p=>({...p,override:ovRef.current[p.key]||null}));

  /* 자동 임시저장 (localStorage) */
  const saveLocal=useCallback(()=>{try{localStorage.setItem(GED_LS_KEY,JSON.stringify({cfg,selected,problems:withOv(problems),docId}));}catch(e){}},[cfg,selected,problems,docId]);
  useEffect(()=>{const t=setTimeout(saveLocal,700);return()=>clearTimeout(t);},[saveLocal]);
  const ovTimer=useRef(null);
  const onOverride=(key,html)=>{ovRef.current[key]=html;
    setProblems(ps=>ps.some(p=>p.key===key&&!p.override)?ps.map(p=>p.key===key?{...p,override:'1'}:p):ps);
    clearTimeout(ovTimer.current);ovTimer.current=setTimeout(saveLocal,900);};
  const getOverride=key=>ovRef.current[key]||null;

  /* 개념 카드 KaTeX */
  useEffect(()=>{if(sheetRef.current)sheetRef.current.querySelectorAll('.card.concept').forEach(el=>GS.renderTex(el));},[problems,cfg.includeConcept,cfg.intro]);

  /* ---------- 생성 ---------- */
  const generate=()=>{
    if(!selected.length){showToast('유형을 하나 이상 골라 주세요.');return;}
    const list=[];UNITS.forEach(u=>{if(selected.includes(u.id))list.push(...gedGenUnit(u,cfg.count,cfg.includeExample));});
    ovRef.current={};setProblems(list);setDocId(null);setShowSetup(false);showToast(`✅ ${list.length}문항 학습지를 만들었습니다.`);
    setTimeout(()=>{sheetRef.current&&sheetRef.current.scrollIntoView({behavior:'smooth',block:'start'});},50);
  };
  const applyPreset=pre=>{setSelected(pre.ids);if(pre.k==='coord'||pre.k==='warm')setCfg({title:'고졸 검정고시 수학 · 좌표 완전정복 학습지',subtitle:GED_DEF_CFG.subtitle});
    else if(pre.k==='all20'||pre.k==='full')setCfg({title:'고졸 검정고시 수학 · 유형별 만능 학습지',subtitle:'1번~20번 전 유형 — 2026년 출제 형식 기준'});
    else if(pre.k==='geo')setCfg({title:'고졸 검정고시 수학 · 도형의 방정식 학습지',subtitle:'두 점 사이의 거리 · 내분점 · 점과 직선 · 원 · 대칭이동과 평행이동'});};
  const toggleUnit=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):UNITS.map(u=>u.id).filter(x=>x===id||s.includes(x)));
  const toggleArea=k=>{const ids=UNITS.filter(u=>u.area===k).map(u=>u.id);const all=ids.every(i=>selected.includes(i));
    setSelected(s=>all?s.filter(x=>!ids.includes(x)):UNITS.map(u=>u.id).filter(x=>ids.includes(x)||s.includes(x)));};

  /* ---------- 문항 편집 ---------- */
  const onParam=(key,k,v)=>{delete ovRef.current[key];setProblems(ps=>ps.map(p=>p.key===key?{...p,params:{...p.params,[k]:v},override:null,rev:p.rev+1}:p));};
  const onRandom=key=>{delete ovRef.current[key];setProblems(ps=>ps.map(p=>p.key===key?{...p,params:byId(p.uid).rand(),override:null,rev:p.rev+1}:p));};
  const onRevert=key=>{delete ovRef.current[key];setProblems(ps=>ps.map(p=>p.key===key?{...p,override:null,rev:p.rev+1}:p));};
  const onRemove=key=>{delete ovRef.current[key];setProblems(ps=>ps.filter(p=>p.key!==key));};
  const addProblem=uid=>{const u=byId(uid);setProblems(ps=>{const mine=ps.filter(p=>p.uid===uid);const idx=Math.max(0,...mine.map(p=>p.idx))+1;
    const[rec]=gedGenUnit(u,1,false);rec.idx=idx;const last=ps.map(p=>p.uid).lastIndexOf(uid);const out=ps.slice();out.splice(last+1,0,rec);return out;});};
  const removeUnit=uid=>{setProblems(ps=>{ps.filter(p=>p.uid===uid).forEach(p=>delete ovRef.current[p.key]);return ps.filter(p=>p.uid!==uid);});setSelected(s=>s.filter(x=>x!==uid));};

  /* ---------- 그룹/번호 ---------- */
  const groups=useMemo(()=>{const gs=[];let no=0;UNITS.forEach(u=>{const recs=problems.filter(p=>p.uid===u.id);if(!recs.length)return;
    gs.push({unit:u,recs:recs.map(r=>({...r,no:r.idx===0?'예제':++no}))});});return gs;},[problems]);
  const totalQ=problems.filter(p=>p.idx!==0).length;

  /* ---------- 인쇄 / 새 탭 ---------- */
  const openDoc=autoPrint=>{
    if(!problems.length){showToast('먼저 학습지를 만들어 주세요.');return;}
    const gs=groups.map(g=>({unit:g.unit,recs:g.recs.map(r=>({...r,override:ovRef.current[r.key]||null}))}));
    const html=GS.docHTML(cfg,gs,{autoPrint});
    const w=window.open('','_blank');
    if(!w){showToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.');return;}
    w.document.open();w.document.write(html);w.document.close();
  };

  /* ---------- Firestore ---------- */
  const loadList=async()=>{try{const snap=await db.collection('gedSheets').orderBy('createdAt','desc').limit(40).get();const arr=[];snap.forEach(d=>{const x=d.data();arr.push({id:d.id,title:x.title,createdAt:x.createdAt,count:x.count,units:x.units});});setSheetList(arr);}catch(e){}};
  useEffect(()=>{loadList();},[]);
  const saveCloud=async(asCopy)=>{
    if(!problems.length){showToast('먼저 학습지를 만들어 주세요.');return;}
    setBusy(true);
    try{
      const data={title:cfg.title,cfg,selected,problems:withOv(problems),count:totalQ,units:groups.map(g=>g.unit.tag+' '+g.unit.title),updatedAt:new Date()};
      if(docId&&!asCopy){await db.collection('gedSheets').doc(docId).set(data,{merge:true});showToast('✅ 덮어쓰기 저장했습니다.');}
      else{const ref=await db.collection('gedSheets').add({...data,createdAt:new Date()});setDocId(ref.id);showToast('✅ 클라우드에 저장했습니다.');}
      loadList();
    }catch(e){showToast('❌ 저장 실패. 인터넷을 확인하세요.');}
    setBusy(false);
  };
  const loadCloud=async(id)=>{
    setBusy(true);
    try{const d=await db.collection('gedSheets').doc(id).get();if(!d.exists){showToast('문서를 찾을 수 없습니다.');setBusy(false);return;}
      const x=d.data();ovRef.current={};(x.problems||[]).forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;});
      setCfgRaw({...GED_DEF_CFG,...(x.cfg||{})});setSelected(x.selected||[]);setProblems((x.problems||[]).map(p=>({...p,rev:0})));setDocId(id);setShowSetup(false);showToast('📂 불러왔습니다.');
    }catch(e){showToast('❌ 불러오기 실패');}
    setBusy(false);
  };
  const deleteCloud=async(id)=>{if(!confirm('이 학습지를 삭제할까요?'))return;try{await db.collection('gedSheets').doc(id).delete();if(docId===id)setDocId(null);showToast('🗑️ 삭제했습니다.');loadList();}catch(e){showToast('❌ 삭제 실패');}};

  /* ---------- JSON ---------- */
  const exportJSON=()=>{if(!problems.length){showToast('먼저 학습지를 만들어 주세요.');return;}
    const blob=new Blob([JSON.stringify({cfg,selected,problems:withOv(problems)},null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${(cfg.title||'학습지').replace(/[\\/:*?"<>|]/g,'_')}_${todayStr()}.json`;a.click();showToast('📤 JSON 파일을 내려받았습니다.');};
  const importJSON=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{try{const d=JSON.parse(rd.result);if(!d.cfg||!Array.isArray(d.problems))throw 0;ovRef.current={};d.problems.forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;});
      setCfgRaw({...GED_DEF_CFG,...d.cfg});setSelected(d.selected||[]);setProblems(d.problems.map(p=>({...p,rev:0})));setDocId(null);setShowSetup(false);showToast('📥 불러왔습니다.');}
      catch(err){showToast('❌ 파일 형식을 확인해 주세요.');}};
    rd.readAsText(f);e.target.value='';};
  const resetAll=()=>{if(!confirm('만든 학습지와 편집 내용을 모두 지우고 처음 상태로 돌립니다. 계속할까요?'))return;
    try{localStorage.removeItem(GED_LS_KEY);}catch(e){}ovRef.current={};setCfgRaw(GED_DEF_CFG);setSelected(GED_PRESETS[0].ids);setProblems([]);setDocId(null);setShowSetup(true);showToast('🔁 초기화했습니다.');};

  const fmtDate=ts=>{if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);return`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};
  const sheetCls=['gsheet',cfg.showAns?'':'noans',cfg.cols2?'cols2':'',cfg.format==='open'?'open':'',edit?'edit':''].filter(Boolean).join(' ');
  const Btn=({on,children,...rest})=><button {...rest} className={`px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${on?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'} ${rest.className||''}`} style={{minHeight:'40px'}}>{children}</button>;

  return<div className="p-4 space-y-4 fade-in">
    <style>{GS.SHEET_CSS}</style>
    {toast&&<div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-xl">{toast}</div>}

    {/* ── 설정 패널 ── */}
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2">
        <div className="text-2xl">📐</div>
        <div className="flex-1"><div className="text-base font-black text-gray-800">만능 학습지 편집실</div>
          <div className="text-[11px] text-gray-500 font-medium">좌표 중심 + 고졸 검정고시 20문항 전 유형 · 개념→예제→실전 자동 생성</div></div>
        <button onClick={()=>setShowSetup(s=>!s)} className="text-xs font-bold text-indigo-600 px-3 py-2 bg-indigo-50 rounded-xl" style={{minHeight:'36px'}}>{showSetup?'접기 ▲':'설정 ▼'}</button>
      </div>

      {showSetup&&<div className="mt-4 space-y-4">
        {/* 프리셋 */}
        <div>
          <div className="text-xs font-black text-gray-500 uppercase mb-2">1. 무엇을 담을까요? (프리셋)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GED_PRESETS.map(pre=>{const on=pre.ids.length===selected.length&&pre.ids.every(i=>selected.includes(i));
              return<button key={pre.k} onClick={()=>applyPreset(pre)} className={`text-left p-3 rounded-2xl border-2 transition-all ${on?'border-indigo-500 bg-indigo-50':'border-gray-100 bg-gray-50'}`} style={{minHeight:'54px'}}>
                <div className="text-sm font-black text-gray-800">{pre.icon} {pre.lbl} <span className="text-[10px] text-gray-400 font-bold">{pre.ids.length}유형</span></div>
                <div className="text-[11px] text-gray-500 font-medium">{pre.desc}</div></button>;})}
          </div>
          <button onClick={()=>setShowUnits(s=>!s)} className="mt-2 text-xs font-bold text-indigo-600" style={{minHeight:'32px'}}>{showUnits?'유형 목록 접기 ▲':`유형 하나하나 고르기 ▼ (현재 ${selected.length}개 선택)`}</button>
          {showUnits&&<div className="mt-2 space-y-2">
            {GED_AREAS.map(ar=>{const us=UNITS.filter(u=>u.area===ar.k);const all=us.every(u=>selected.includes(u.id));
              return<div key={ar.k} className="bg-gray-50 rounded-2xl p-3">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={all} onChange={()=>toggleArea(ar.k)} style={{width:18,height:18,minHeight:0}}/>
                  <span className="text-sm font-black text-gray-800">{ar.title}</span><span className="text-[11px] text-gray-400 font-bold">{ar.desc}</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 pl-1">
                  {us.map(u=><label key={u.id} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 py-1">
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={()=>toggleUnit(u.id)} style={{width:16,height:16,minHeight:0}}/>
                    <span>{u.tag}. {u.title}{u.coord&&<span className="text-amber-500"> ★</span>}</span></label>)}
                </div></div>;})}
            <div className="text-[11px] text-gray-400 font-medium">★ = 좌표평면 그림이 들어가는 좌표 중심 유형</div>
          </div>}
        </div>

        {/* 구성 */}
        <div>
          <div className="text-xs font-black text-gray-500 uppercase mb-2">2. 어떻게 구성할까요?</div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-gray-600">유형당 실전</span>
            {[1,2,3,4,5,6].map(n=><Btn key={n} on={cfg.count===n} onClick={()=>setCfg({count:n})}>{n}문항</Btn>)}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Btn on={cfg.includeConcept} onClick={()=>setCfg({includeConcept:!cfg.includeConcept})}>📖 개념 카드</Btn>
            <Btn on={cfg.includeExample} onClick={()=>setCfg({includeExample:!cfg.includeExample})}>💡 예제(풀이 공개)</Btn>
            <Btn on={cfg.intro} onClick={()=>setCfg({intro:!cfg.intro})}>📌 사용법 안내 상자</Btn>
            <Btn on={cfg.format==='choice'} onClick={()=>setCfg({format:'choice'})}>사지선다</Btn>
            <Btn on={cfg.format==='open'} onClick={()=>setCfg({format:'open'})}>서술형(보기 없음)</Btn>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-3">
            <input value={cfg.title} onChange={e=>setCfg({title:e.target.value})} placeholder="학습지 제목" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400" style={{minHeight:'44px'}}/>
            <input value={cfg.subtitle} onChange={e=>setCfg({subtitle:e.target.value})} placeholder="부제(선택)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400" style={{minHeight:'40px'}}/>
          </div>
        </div>

        <button onClick={generate} className="w-full py-4 bg-indigo-600 text-white text-base font-black rounded-2xl active:scale-95 transition-transform shadow-md" style={{minHeight:'56px'}}>
          🎲 {problems.length?'새로 만들기 (지금 것은 지워짐)':'학습지 만들기'} → {selected.length}유형 × {cfg.count}문항{cfg.includeExample?' + 예제':''}
        </button>
      </div>}
    </div>

    {/* ── 도구 막대 ── */}
    {problems.length>0&&<div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 sticky top-14 z-10">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-black text-gray-700 mr-1">{groups.length}유형 · 실전 {totalQ}문항</span>
        <Btn on={cfg.showAns} onClick={()=>setCfg({showAns:!cfg.showAns})}>🔑 {cfg.showAns?'정답 숨기기':'정답 보이기'}</Btn>
        <Btn on={edit} onClick={()=>setEdit(e=>!e)}>✏️ {edit?'글자 편집 끄기':'글자 편집'}</Btn>
        <Btn on={showCtrl} onClick={()=>setShowCtrl(s=>!s)}>🎛 조건 상자</Btn>
        <Btn on={cfg.cols2} onClick={()=>setCfg({cols2:!cfg.cols2})}>🖨️ 실전 2단</Btn>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl px-3" style={{minHeight:'40px'}}>글자
          <input type="range" min="16" max="40" value={cfg.fs} onChange={e=>setCfg({fs:+e.target.value})} style={{width:90,minHeight:0}}/>{cfg.fs}px</label>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button onClick={()=>openDoc(true)} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-black text-sm" style={{minHeight:'46px'}}>🖨️ 인쇄 / PDF</button>
        <button onClick={()=>openDoc(false)} className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-black text-sm" style={{minHeight:'46px'}}>↗️ 새 탭에서 열기</button>
        <button onClick={()=>saveCloud(false)} disabled={busy} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-sm" style={{minHeight:'46px'}}>💾 {docId?'덮어쓰기 저장':'클라우드 저장'}</button>
        {docId&&<button onClick={()=>saveCloud(true)} disabled={busy} className="py-3 px-3 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs" style={{minHeight:'46px'}}>사본 저장</button>}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button onClick={exportJSON} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs" style={{minHeight:'40px'}}>📤 JSON 내보내기</button>
        <button onClick={()=>fileRef.current.click()} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs" style={{minHeight:'40px'}}>📥 JSON 불러오기</button>
        <input ref={fileRef} type="file" accept=".json" onChange={importJSON} style={{display:'none'}}/>
        <button onClick={resetAll} className="py-2 px-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs" style={{minHeight:'40px'}}>🔁 초기화</button>
      </div>
      {edit&&<div className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-2 font-medium">글자 편집 모드: 문제·풀이 글을 바로 고칠 수 있습니다. 고친 카드는 노란 테두리가 되고, 조건 상자의 [↩ 생성 상태로]로 되돌릴 수 있습니다. (수식 자체는 조건 숫자로 바꾸는 편이 안전합니다)</div>}
    </div>}

    {/* ── 저장된 학습지 ── */}
    {sheetList.length>0&&<div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2"><div className="text-sm font-black text-gray-800">📂 저장된 만능 학습지</div><button onClick={loadList} className="text-xs text-indigo-600 font-bold" style={{minHeight:'30px'}}>새로고침</button></div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {sheetList.map(s=><div key={s.id} className={`flex items-center gap-2 p-2.5 rounded-2xl ${docId===s.id?'bg-indigo-50 border border-indigo-200':'bg-gray-50'}`}>
          <div className="flex-1 min-w-0"><div className="text-xs font-black text-gray-800 truncate">{s.title}</div>
            <div className="text-[10px] text-gray-400 font-bold truncate">{fmtDate(s.createdAt)} · 실전 {s.count||0}문항 · {(s.units||[]).length}유형</div></div>
          <button onClick={()=>loadCloud(s.id)} disabled={busy} className="text-[11px] px-3 py-2 bg-indigo-500 text-white rounded-lg font-bold" style={{minHeight:'36px'}}>열기</button>
          <button onClick={()=>deleteCloud(s.id)} className="text-[11px] px-2 py-2 bg-red-50 text-red-500 rounded-lg font-bold" style={{minHeight:'36px'}}>삭제</button>
        </div>)}
      </div>
    </div>}

    {/* ── 학습지 미리보기 ── */}
    {problems.length>0&&<div ref={sheetRef} className={sheetCls} style={{'--fs':cfg.fs+'px'}}>
      <h1>{cfg.title||'고졸 검정고시 수학 · 만능 학습지'}</h1>
      {cfg.subtitle&&<p className="sub">{cfg.subtitle}</p>}
      <div className="namebox"><span>이름 : ______________</span><span>날짜 : ______ 월 ______ 일</span></div>
      {cfg.intro&&<div className="card concept intro"><span className="cap">이 학습지를 쓰는 방법</span><ul>
        <li>유형마다 <b>[개념] → [예제] → [실전 문제]</b> 순서로 갑니다. 개념은 한 줄만 외우면 됩니다.</li>
        <li>좌표평면 문제는 <b>x축·y축의 눈금을 먼저 손가락으로 짚고</b>, 점의 자리를 읽는 것부터 시작합니다.</li>
        <li>대칭이동은 <b>종이접기</b>, 평행이동은 <b>밀기</b>. 이 두 마디만 기억해도 절반은 끝납니다.</li>
        <li>실전 문제는 시험지와 똑같은 모양입니다. 답을 고르고, 점선 상자에 풀이를 써 보세요.</li></ul></div>}
      {groups.map(g=>{const u=g.unit;const ex=g.recs.filter(r=>r.idx===0),qs=g.recs.filter(r=>r.idx!==0);
        return<div key={u.id}>
          <h2 id={'gs-'+u.id}>{u.tag}. {u.title}<small>{u.src}</small></h2>
          {showCtrl&&<div className="ctrl noprint"><span className="tag">유형</span>
            <button onClick={()=>addProblem(u.id)}>＋ 실전 문항 추가</button>
            <button className="danger" onClick={()=>{if(confirm(`'${u.title}' 유형을 학습지에서 뺄까요?`))removeUnit(u.id);}}>✕ 이 유형 빼기</button></div>}
          {cfg.includeConcept&&<div className="card concept" dangerouslySetInnerHTML={{__html:GS.conceptHTML(u)}}/>}
          {ex.length>0&&<h3>풀이 예시</h3>}
          {ex.map(r=><GedProblemCard key={r.key} rec={r} unit={u} no={r.no} edit={edit} showCtrl={showCtrl} onParam={onParam} onRandom={onRandom} onRemove={onRemove} onRevert={onRevert} onOverride={onOverride} getOverride={getOverride}/>)}
          {qs.length>0&&<h3>실전 문제</h3>}
          {qs.length>0&&<div className="qgrid">{qs.map(r=><GedProblemCard key={r.key} rec={r} unit={u} no={r.no} edit={edit} showCtrl={showCtrl} onParam={onParam} onRandom={onRandom} onRemove={onRemove} onRevert={onRevert} onOverride={onOverride} getOverride={getOverride}/>)}</div>}
        </div>;})}
    </div>}

    {problems.length===0&&<div className="text-center text-sm text-gray-400 font-bold py-6">아직 만든 학습지가 없어요. 위에서 프리셋을 고르고 <b>학습지 만들기</b>를 눌러 보세요.</div>}
  </div>;
}
