// === js/teacher/gedWorksheet.js ===
/* --------------------------------------------------------------------
   만능 학습지 탭
   좌표 중심 + 고졸 검정고시 전 유형 학습지 작업대
   -------------------------------------------------------------------- */

/* =====================================================================
   만능 학습지 편집실 (선생님 탭) — 여러 장 보관(작업대) 방식
   - 좌표 중심 프리셋 + 고졸 검정고시 20문항 전 유형 선택
   - [학습지 만들기]를 누르면 새 학습지가 "추가"된다. 이전 학습지는 지워지지 않고 접힌 채 남는다.
   - 학습지마다 : 접기/펼치기 토글 · 저장(클라우드) · 반출(인쇄/PDF · 새 탭 · JSON) · 삭제
   - 유형별 [개념] → [예제] → [실전 n문항] 자동 생성, 문항별 조건 편집 / 새 숫자 / 추가 / 삭제
   - 글자 편집 모드(내용 덮어쓰기), 정답 보기, 사지선다·서술형 전환, 2단 인쇄, 글자 크기
   - localStorage 자동 임시저장(v1 단일 학습지 데이터는 자동으로 옮겨 온다)
   ===================================================================== */
var GED_LS_KEY='ged_sheet_builder_v2';

var GED_LS_KEY_V1='ged_sheet_builder_v1';

var GED_DEF_CFG={title:'고졸 검정고시 수학 · 좌표 완전정복 학습지',subtitle:'좌표 기초 · 대칭이동 · 평행이동 · 이차함수 · 원의 방정식 · 유리·무리함수 · 내분점 — 2024년 이후 출제 유형 중심',
  fs:24,cols2:false,showAns:false,format:'choice',includeConcept:true,includeExample:true,intro:true,count:3};

function gedNewRec(u,idx,params){return{key:`${u.id}-${idx}-${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,uid:u.id,idx,params,override:null,rev:0};}

function gedSafeBuild(u,p){try{const r=u.build(p);return r&&!r.err?r:null;}catch(e){return null;}}

function gedSheetId(){return 's'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

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

/* 문항 목록 → 유형별 묶음 + 실전 문항 번호 매기기 */
function gedGroups(problems){
  const gs=[];let no=0;
  GED_UNITS.forEach(u=>{const recs=(problems||[]).filter(p=>p.uid===u.id);if(!recs.length)return;
    gs.push({unit:u,recs:recs.map(r=>({...r,no:r.idx===0?'예제':++no}))});});
  return gs;
}

function gedFmtTime(ts){if(!ts)return'';const d=ts&&ts.toDate?ts.toDate():new Date(ts);
  return`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}

function gedSafeName(s){return String(s||'학습지').replace(/[\\/:*?"<>|]/g,'_').slice(0,60);}

/* 새 학습지 한 장 만들기 */
function gedMakeSheet(cfg,problems,docId){
  return{id:gedSheetId(),cfg:{...cfg},problems,docId:docId||null,collapsed:false,edit:false,showCtrl:true,createdAt:Date.now()};
}

/* localStorage 복원 (v2 → 없으면 v1 단일 학습지를 한 장으로 옮겨 옴) */
function gedLoadInit(){
  const def={setupCfg:{...GED_DEF_CFG},selected:GED_PRESETS[0].ids,sheets:[]};
  try{
    const d=JSON.parse(localStorage.getItem(GED_LS_KEY)||'null');
    if(d&&Array.isArray(d.sheets))
      return{setupCfg:{...GED_DEF_CFG,...(d.setupCfg||{})},selected:(d.selected&&d.selected.length?d.selected:def.selected),
        sheets:d.sheets.map(s=>({...gedMakeSheet({...GED_DEF_CFG,...(s.cfg||{})},[],s.docId),...s,
          cfg:{...GED_DEF_CFG,...(s.cfg||{})},problems:(s.problems||[]).map(p=>({...p,rev:0}))}))};
    const v1=JSON.parse(localStorage.getItem(GED_LS_KEY_V1)||'null');
    if(v1&&v1.cfg&&Array.isArray(v1.problems)&&v1.problems.length){
      const sh=gedMakeSheet({...GED_DEF_CFG,...v1.cfg},v1.problems.map(p=>({...p,rev:0})),v1.docId);
      return{setupCfg:{...GED_DEF_CFG,...v1.cfg},selected:(v1.selected&&v1.selected.length?v1.selected:def.selected),sheets:[sh]};
    }
  }catch(e){}
  return def;
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

/* ─────────────────────────────────────────────────────────────
   학습지 한 장 : 머리글(항상 보임) + 도구막대 + 미리보기(펼쳤을 때만)
   ───────────────────────────────────────────────────────────── */
function GedSheetView({sheet,seq,busy,ops}){
  const{id,cfg,problems,collapsed,edit,showCtrl,docId}=sheet;
  const ref=useRef();
  const groups=useMemo(()=>gedGroups(problems),[problems]);
  const totalQ=problems.filter(p=>p.idx!==0).length;
  useEffect(()=>{if(!collapsed&&ref.current)ref.current.querySelectorAll('.card.concept').forEach(el=>GS.renderTex(el));},[collapsed,problems,cfg.includeConcept,cfg.intro]);

  const setCfg=patch=>ops.setCfg(id,patch);
  const cls=['gsheet',cfg.showAns?'':'noans',cfg.cols2?'cols2':'',cfg.format==='open'?'open':'',edit?'edit':''].filter(Boolean).join(' ');
  const Btn=({on,children,...rest})=><button {...rest} className={`px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${on?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'}`} style={{minHeight:'40px'}}>{children}</button>;

  return<div id={'ged-sheet-'+id} className={`bg-white rounded-3xl shadow-sm border-2 ${collapsed?'border-gray-100':'border-indigo-200'} overflow-hidden`}>
    {/* ── 머리글 : 접었을 때도 항상 보임 ── */}
    <div className={`p-3 ${collapsed?'':'bg-indigo-50/60 border-b border-indigo-100'}`}>
      <button onClick={()=>ops.toggle(id)} className="w-full flex items-center gap-2 text-left" style={{minHeight:'48px'}}>
        <span className="text-lg w-6 text-indigo-600 font-black flex-none">{collapsed?'▶':'▼'}</span>
        <span className="text-[11px] font-black text-white bg-indigo-500 rounded-lg px-2 py-1 flex-none">{seq}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-black text-gray-800 truncate">{cfg.title||'제목 없는 학습지'}</span>
          <span className="block text-[11px] text-gray-500 font-bold truncate">
            {groups.length}유형 · 실전 {totalQ}문항 · {gedFmtTime(sheet.createdAt)}
            {docId?<span className="text-emerald-600"> · ☁ 저장됨</span>:<span className="text-amber-600"> · 저장 안 됨</span>}
            {collapsed?' · 눌러서 펼치기':''}
          </span>
        </span>
      </button>
      {/* ── 학습지별 : 저장 / 반출 / 삭제 ── */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <button onClick={()=>ops.saveCloud(id)} disabled={busy} className="flex-1 py-2 px-2 bg-emerald-500 text-white rounded-xl font-black text-xs" style={{minHeight:'42px'}}>💾 {docId?'덮어쓰기':'저장'}</button>
        <button onClick={()=>ops.openDoc(id,true)} className="flex-1 py-2 px-2 bg-gray-900 text-white rounded-xl font-black text-xs" style={{minHeight:'42px'}}>🖨️ 인쇄/PDF</button>
        <button onClick={()=>ops.openDoc(id,false)} className="flex-1 py-2 px-2 bg-sky-500 text-white rounded-xl font-black text-xs" style={{minHeight:'42px'}}>↗️ 새 탭</button>
        <button onClick={()=>ops.exportJSON(id)} className="py-2 px-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs" style={{minHeight:'42px'}}>📤 JSON</button>
        <button onClick={()=>ops.removeSheet(id)} className="py-2 px-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-xs" style={{minHeight:'42px'}}>🗑️ 삭제</button>
      </div>
    </div>

    {!collapsed&&<div className="p-3">
      {/* ── 이 학습지의 보기 설정 ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Btn on={cfg.showAns} onClick={()=>setCfg({showAns:!cfg.showAns})}>🔑 {cfg.showAns?'정답 숨기기':'정답 보이기'}</Btn>
        <Btn on={edit} onClick={()=>ops.setUI(id,{edit:!edit})}>✏️ {edit?'글자 편집 끄기':'글자 편집'}</Btn>
        <Btn on={showCtrl} onClick={()=>ops.setUI(id,{showCtrl:!showCtrl})}>🎛 조건 상자</Btn>
        <Btn on={cfg.cols2} onClick={()=>setCfg({cols2:!cfg.cols2})}>🖨️ 실전 2단</Btn>
        <Btn on={cfg.format==='open'} onClick={()=>setCfg({format:cfg.format==='open'?'choice':'open'})}>{cfg.format==='open'?'서술형':'사지선다'}</Btn>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl px-3" style={{minHeight:'40px'}}>글자
          <input type="range" min="16" max="40" value={cfg.fs} onChange={e=>setCfg({fs:+e.target.value})} style={{width:90,minHeight:0}}/>{cfg.fs}px</label>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-2">
        <input value={cfg.title} onChange={e=>setCfg({title:e.target.value})} placeholder="학습지 제목" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400" style={{minHeight:'42px'}}/>
        <input value={cfg.subtitle} onChange={e=>setCfg({subtitle:e.target.value})} placeholder="부제(선택)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400" style={{minHeight:'38px'}}/>
      </div>
      {edit&&<div className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mt-2 font-medium">글자 편집 모드: 문제·풀이 글을 바로 고칠 수 있습니다. 고친 카드는 노란 테두리가 되고, 조건 상자의 [↩ 생성 상태로]로 되돌릴 수 있습니다. (수식 자체는 조건 숫자로 바꾸는 편이 안전합니다)</div>}

      {/* ── 미리보기 ── */}
      <div ref={ref} className={cls+' mt-3'} style={{'--fs':cfg.fs+'px'}}>
        <h1>{cfg.title||'고졸 검정고시 수학 · 만능 학습지'}</h1>
        {cfg.subtitle&&<p className="sub">{cfg.subtitle}</p>}
        <div className="namebox"><span>이름 : ______________</span><span>날짜 : ______ 월 ______ 일</span></div>
        {cfg.intro&&<div className="card concept intro"><span className="cap">이 학습지를 쓰는 방법</span><ul>
          <li>유형마다 <b>[개념] → [예제] → [실전 문제]</b> 순서로 갑니다. 개념은 한 줄만 외우면 됩니다.</li>
          <li>좌표평면 문제는 <b>x축·y축의 눈금을 먼저 손가락으로 짚고</b>, 점의 자리를 읽는 것부터 시작합니다.</li>
          <li>대칭이동은 <b>종이접기</b>, 평행이동은 <b>밀기</b>. 이 두 마디만 기억해도 절반은 끝납니다.</li>
          <li>실전 문제는 시험지와 똑같은 모양입니다. 답을 고르고, 점선 상자에 풀이를 써 보세요.</li></ul></div>}
        {groups.map(g=>{const u=g.unit;const ex=g.recs.filter(r=>r.idx===0),qs=g.recs.filter(r=>r.idx!==0);
          const cardProps={edit,showCtrl,onParam:(k,f,v)=>ops.onParam(id,k,f,v),onRandom:k=>ops.onRandom(id,k),
            onRemove:k=>ops.onRemoveProb(id,k),onRevert:k=>ops.onRevert(id,k),onOverride:ops.onOverride,getOverride:ops.getOverride};
          return<div key={u.id}>
            <h2 id={'gs-'+id+'-'+u.id}>{u.tag}. {u.title}<small>{u.src}</small></h2>
            {showCtrl&&<div className="ctrl noprint"><span className="tag">유형</span>
              <button onClick={()=>ops.addProblem(id,u.id)}>＋ 실전 문항 추가</button>
              <button className="danger" onClick={()=>{if(confirm(`'${u.title}' 유형을 이 학습지에서 뺄까요?`))ops.removeUnit(id,u.id);}}>✕ 이 유형 빼기</button></div>}
            {cfg.includeConcept&&<div className="card concept" dangerouslySetInnerHTML={{__html:GS.conceptHTML(u)}}/>}
            {ex.length>0&&<h3>풀이 예시</h3>}
            {ex.map(r=><GedProblemCard key={r.key} rec={r} unit={u} no={r.no} {...cardProps}/>)}
            {qs.length>0&&<h3>실전 문제</h3>}
            {qs.length>0&&<div className="qgrid">{qs.map(r=><GedProblemCard key={r.key} rec={r} unit={u} no={r.no} {...cardProps}/>)}</div>}
          </div>;})}
        {problems.length===0&&<p className="sub">문항이 모두 빠졌습니다. 이 학습지는 삭제하거나, 설정에서 새로 만들어 주세요.</p>}
      </div>
    </div>}
  </div>;
}

/* ─────────────────────────────────────────────────────────────
   탭 본체
   ───────────────────────────────────────────────────────────── */
function GedWorksheetTab(){
  const UNITS=GED_UNITS;const byId=id=>UNITS.find(u=>u.id===id);
  const init=useMemo(gedLoadInit,[]);
  const[setupCfg,setSetupCfgRaw]=useState(init.setupCfg);
  const setSetupCfg=patch=>setSetupCfgRaw(c=>({...c,...patch}));
  const[selected,setSelected]=useState(init.selected);
  const[sheets,setSheets]=useState(init.sheets);
  const[showSetup,setShowSetup]=useState(init.sheets.length===0);
  const[showUnits,setShowUnits]=useState(false);
  const[cloudList,setCloudList]=useState([]);
  const[busy,setBusy]=useState(false);
  const[toast,setToast]=useState('');
  const[quotaWarn,setQuotaWarn]=useState(false);
  const ovRef=useRef({});
  const fileRef=useRef();
  useEffect(()=>{init.sheets.forEach(s=>(s.problems||[]).forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;}));},[]);

  const showToast=m=>{setToast(m);clearTimeout(showToast._t);showToast._t=setTimeout(()=>setToast(''),2800);};
  const withOv=ps=>ps.map(p=>({...p,override:ovRef.current[p.key]||null}));
  const getSheet=id=>sheets.find(s=>s.id===id);

  /* ---------- 자동 임시저장 ---------- */
  const saveLocal=useCallback(()=>{
    try{
      localStorage.setItem(GED_LS_KEY,JSON.stringify({setupCfg,selected,
        sheets:sheets.map(s=>({...s,problems:withOv(s.problems)}))}));
      setQuotaWarn(false);
    }catch(e){setQuotaWarn(true);}
  },[setupCfg,selected,sheets]);
  useEffect(()=>{const t=setTimeout(saveLocal,700);return()=>clearTimeout(t);},[saveLocal]);
  const ovTimer=useRef(null);

  /* ---------- 학습지 단위 조작 ---------- */
  const patchSheet=(id,fn)=>setSheets(ss=>ss.map(s=>s.id===id?fn(s):s));
  const setCfg=(id,patch)=>patchSheet(id,s=>({...s,cfg:{...s.cfg,...patch}}));
  const setUI=(id,patch)=>patchSheet(id,s=>({...s,...patch}));
  const toggle=id=>patchSheet(id,s=>({...s,collapsed:!s.collapsed}));
  const collapseAll=v=>setSheets(ss=>ss.map(s=>({...s,collapsed:v})));
  const removeSheet=id=>{
    const s=getSheet(id);if(!s)return;
    if(!confirm(`'${s.cfg.title||'제목 없는 학습지'}' 를 작업대에서 지울까요?${s.docId?'\n(클라우드에 저장된 사본은 그대로 남습니다)':'\n(저장하지 않았다면 되살릴 수 없습니다)'}`))return;
    s.problems.forEach(p=>delete ovRef.current[p.key]);
    setSheets(ss=>ss.filter(x=>x.id!==id));showToast('🗑️ 작업대에서 지웠습니다.');
  };
  const clearAll=()=>{if(!sheets.length)return;
    if(!confirm(`작업대의 학습지 ${sheets.length}장을 모두 지울까요?\n(클라우드에 저장된 사본은 그대로 남습니다)`))return;
    ovRef.current={};setSheets([]);setShowSetup(true);showToast('🔁 작업대를 비웠습니다.');};

  /* ---------- 문항 조작 ---------- */
  const mapProbs=(id,fn)=>patchSheet(id,s=>({...s,problems:fn(s.problems)}));
  const onParam=(id,key,k,v)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.map(p=>p.key===key?{...p,params:{...p.params,[k]:v},override:null,rev:p.rev+1}:p));};
  const onRandom=(id,key)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.map(p=>p.key===key?{...p,params:byId(p.uid).rand(),override:null,rev:p.rev+1}:p));};
  const onRevert=(id,key)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.map(p=>p.key===key?{...p,override:null,rev:p.rev+1}:p));};
  const onRemoveProb=(id,key)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.filter(p=>p.key!==key));};
  const addProblem=(id,uid)=>{const u=byId(uid);mapProbs(id,ps=>{const mine=ps.filter(p=>p.uid===uid);const idx=Math.max(0,...mine.map(p=>p.idx))+1;
    const[rec]=gedGenUnit(u,1,false);rec.idx=idx;const last=ps.map(p=>p.uid).lastIndexOf(uid);const out=ps.slice();out.splice(last+1,0,rec);return out;});};
  const removeUnit=(id,uid)=>mapProbs(id,ps=>{ps.filter(p=>p.uid===uid).forEach(p=>delete ovRef.current[p.key]);return ps.filter(p=>p.uid!==uid);});
  const onOverride=(key,html)=>{ovRef.current[key]=html;
    setSheets(ss=>ss.map(s=>s.problems.some(p=>p.key===key&&!p.override)?{...s,problems:s.problems.map(p=>p.key===key?{...p,override:'1'}:p)}:s));
    clearTimeout(ovTimer.current);ovTimer.current=setTimeout(saveLocal,900);};
  const getOverride=key=>ovRef.current[key]||null;

  /* ---------- 생성 : 기존 학습지는 접어 두고 새 장을 맨 위에 추가 ---------- */
  const generate=()=>{
    if(!selected.length){showToast('유형을 하나 이상 골라 주세요.');return;}
    const list=[];UNITS.forEach(u=>{if(selected.includes(u.id))list.push(...gedGenUnit(u,setupCfg.count,setupCfg.includeExample));});
    const sh=gedMakeSheet(setupCfg,list,null);
    const before=sheets.length;
    setSheets(ss=>[sh,...ss.map(s=>({...s,collapsed:true}))]);
    setShowSetup(false);
    showToast(before?`✅ 새 학습지를 추가했습니다. (기존 ${before}장은 접어 두었습니다)`:'✅ 학습지를 만들었습니다.');
    setTimeout(()=>{const el=document.getElementById('ged-sheet-'+sh.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},60);
  };
  const applyPreset=pre=>{setSelected(pre.ids);
    if(pre.k==='coord'||pre.k==='warm')setSetupCfg({title:'고졸 검정고시 수학 · 좌표 완전정복 학습지',subtitle:GED_DEF_CFG.subtitle});
    else if(pre.k==='all20'||pre.k==='full')setSetupCfg({title:'고졸 검정고시 수학 · 유형별 만능 학습지',subtitle:'1번~20번 전 유형 — 2026년 출제 형식 기준'});
    else if(pre.k==='geo')setSetupCfg({title:'고졸 검정고시 수학 · 도형의 방정식 학습지',subtitle:'두 점 사이의 거리 · 내분점 · 점과 직선 · 원 · 대칭이동과 평행이동'});};
  const toggleUnit=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):UNITS.map(u=>u.id).filter(x=>x===id||s.includes(x)));
  const toggleArea=k=>{const ids=UNITS.filter(u=>u.area===k).map(u=>u.id);const all=ids.every(i=>selected.includes(i));
    setSelected(s=>all?s.filter(x=>!ids.includes(x)):UNITS.map(u=>u.id).filter(x=>ids.includes(x)||s.includes(x)));};

  /* ---------- 반출 : 인쇄 / PDF / 새 탭 ---------- */
  const openDoc=(id,autoPrint)=>{
    const s=getSheet(id);if(!s)return;
    if(!s.problems.length){showToast('문항이 없는 학습지입니다.');return;}
    const gs=gedGroups(s.problems).map(g=>({unit:g.unit,recs:g.recs.map(r=>({...r,override:ovRef.current[r.key]||null}))}));
    const w=window.open('','_blank');
    if(!w){showToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.');return;}
    w.document.open();w.document.write(GS.docHTML(s.cfg,gs,{autoPrint}));w.document.close();
    if(autoPrint)showToast('🖨️ 인쇄창에서 "PDF로 저장"을 고르면 PDF 파일이 됩니다.');
  };
  /* ---------- 반출 : JSON ---------- */
  const exportJSON=id=>{
    const s=getSheet(id);if(!s)return;
    const data={v:2,cfg:s.cfg,selected:[...new Set(s.problems.map(p=>p.uid))],problems:withOv(s.problems)};
    const blob=new Blob([JSON.stringify(data,null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download=`${gedSafeName(s.cfg.title)}_${todayStr()}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);showToast('📤 JSON 파일을 내려받았습니다.');
  };
  const importJSON=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{try{
      const d=JSON.parse(rd.result);
      const list=Array.isArray(d.sheets)?d.sheets:(d.cfg&&Array.isArray(d.problems)?[d]:null);
      if(!list||!list.length)throw 0;
      const added=list.map(x=>{(x.problems||[]).forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;});
        return gedMakeSheet({...GED_DEF_CFG,...(x.cfg||{})},(x.problems||[]).map(p=>({...p,rev:0})),null);});
      setSheets(ss=>[...added,...ss.map(s=>({...s,collapsed:true}))]);setShowSetup(false);
      showToast(`📥 학습지 ${added.length}장을 불러왔습니다.`);
    }catch(err){showToast('❌ 파일 형식을 확인해 주세요.');}};
    rd.readAsText(f);e.target.value='';};

  /* ---------- Firestore ---------- */
  const loadList=async()=>{try{const snap=await db.collection('gedSheets').orderBy('createdAt','desc').limit(40).get();
    const arr=[];snap.forEach(d=>{const x=d.data();arr.push({id:d.id,title:x.title,createdAt:x.createdAt,count:x.count,units:x.units});});setCloudList(arr);}catch(e){}};
  useEffect(()=>{loadList();},[]);
  const saveCloud=async(id)=>{
    const s=getSheet(id);if(!s)return;
    if(!s.problems.length){showToast('문항이 없는 학습지는 저장할 수 없습니다.');return;}
    setBusy(true);
    try{
      const gs=gedGroups(s.problems);
      const data={title:s.cfg.title,cfg:s.cfg,selected:[...new Set(s.problems.map(p=>p.uid))],problems:withOv(s.problems),
        count:s.problems.filter(p=>p.idx!==0).length,units:gs.map(g=>g.unit.tag+' '+g.unit.title),updatedAt:new Date()};
      if(s.docId){await db.collection('gedSheets').doc(s.docId).set(data,{merge:true});showToast('✅ 덮어쓰기 저장했습니다.');}
      else{const ref=await db.collection('gedSheets').add({...data,createdAt:new Date()});patchSheet(id,x=>({...x,docId:ref.id}));showToast('✅ 클라우드에 저장했습니다.');}
      loadList();
    }catch(e){showToast('❌ 저장 실패. 인터넷을 확인하세요.');}
    setBusy(false);
  };
  /* 클라우드 → 작업대에 "추가"로 연다 (이미 열려 있으면 그 장으로 이동) */
  const openCloud=async(cid)=>{
    const open=sheets.find(s=>s.docId===cid);
    if(open){patchSheet(open.id,s=>({...s,collapsed:false}));
      setTimeout(()=>{const el=document.getElementById('ged-sheet-'+open.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},60);
      showToast('이미 작업대에 열려 있습니다.');return;}
    setBusy(true);
    try{const d=await db.collection('gedSheets').doc(cid).get();
      if(!d.exists){showToast('문서를 찾을 수 없습니다.');setBusy(false);return;}
      const x=d.data();(x.problems||[]).forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;});
      const sh=gedMakeSheet({...GED_DEF_CFG,...(x.cfg||{})},(x.problems||[]).map(p=>({...p,rev:0})),cid);
      setSheets(ss=>[sh,...ss.map(s=>({...s,collapsed:true}))]);setShowSetup(false);showToast('📂 작업대에 열었습니다.');
      setTimeout(()=>{const el=document.getElementById('ged-sheet-'+sh.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},60);
    }catch(e){showToast('❌ 불러오기 실패');}
    setBusy(false);
  };
  const deleteCloud=async(cid)=>{
    if(!confirm('클라우드에 저장된 이 학습지를 삭제할까요?\n(작업대에 열려 있는 장은 남지만 저장 연결이 끊깁니다)'))return;
    try{await db.collection('gedSheets').doc(cid).delete();
      setSheets(ss=>ss.map(s=>s.docId===cid?{...s,docId:null}:s));
      showToast('🗑️ 클라우드에서 삭제했습니다.');loadList();
    }catch(e){showToast('❌ 삭제 실패');}
  };

  const ops={setCfg,setUI,toggle,removeSheet,saveCloud,openDoc,exportJSON,onParam,onRandom,onRemoveProb,onRevert,addProblem,removeUnit,onOverride,getOverride};
  const Btn=({on,children,...rest})=><button {...rest} className={`px-3 py-2 rounded-xl font-bold text-xs whitespace-nowrap ${on?'bg-indigo-600 text-white':'bg-gray-100 text-gray-700'}`} style={{minHeight:'40px'}}>{children}</button>;

  return<div className="p-4 space-y-4 fade-in">
    <style>{GS.SHEET_CSS}</style>
    {toast&&<div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-xl">{toast}</div>}

    {/* ── 설정 패널 ── */}
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2">
        <div className="text-2xl">📐</div>
        <div className="flex-1"><div className="text-base font-black text-gray-800">만능 학습지 편집실</div>
          <div className="text-[11px] text-gray-500 font-medium">만들 때마다 새 학습지가 작업대에 쌓입니다. 이전 학습지는 지워지지 않아요.</div></div>
        <button onClick={()=>setShowSetup(s=>!s)} className="text-xs font-bold text-indigo-600 px-3 py-2 bg-indigo-50 rounded-xl" style={{minHeight:'36px'}}>{showSetup?'접기 ▲':'＋ 새로 만들기'}</button>
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
            {[1,2,3,4,5,6,8,10,12,15,20,25,30].map(n=><Btn key={n} on={setupCfg.count===n} onClick={()=>setSetupCfg({count:n})}>{n}문항</Btn>)}
          </div>
          {/* 직접 입력 — 버튼에 없는 수(예: 7, 40)도 쓸 수 있게 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold text-gray-400">직접 입력</span>
            <input type="number" min="1" max="50" value={setupCfg.count}
              onChange={e=>{const v=Math.max(1,Math.min(50,Number(e.target.value)||1));setSetupCfg({count:v});}}
              className="w-20 border-2 border-gray-200 rounded-xl px-2 py-1.5 text-sm font-black text-center outline-none focus:border-indigo-400"/>
            <span className="text-[11px] font-bold text-gray-400">문항 (1~50)</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Btn on={setupCfg.includeConcept} onClick={()=>setSetupCfg({includeConcept:!setupCfg.includeConcept})}>📖 개념 카드</Btn>
            <Btn on={setupCfg.includeExample} onClick={()=>setSetupCfg({includeExample:!setupCfg.includeExample})}>💡 예제(풀이 공개)</Btn>
            <Btn on={setupCfg.intro} onClick={()=>setSetupCfg({intro:!setupCfg.intro})}>📌 사용법 안내 상자</Btn>
            <Btn on={setupCfg.format==='choice'} onClick={()=>setSetupCfg({format:'choice'})}>사지선다</Btn>
            <Btn on={setupCfg.format==='open'} onClick={()=>setSetupCfg({format:'open'})}>서술형(보기 없음)</Btn>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-3">
            <input value={setupCfg.title} onChange={e=>setSetupCfg({title:e.target.value})} placeholder="학습지 제목" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400" style={{minHeight:'44px'}}/>
            <input value={setupCfg.subtitle} onChange={e=>setSetupCfg({subtitle:e.target.value})} placeholder="부제(선택)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400" style={{minHeight:'40px'}}/>
          </div>
        </div>

        <button onClick={generate} className="w-full py-4 bg-indigo-600 text-white text-base font-black rounded-2xl active:scale-95 transition-transform shadow-md" style={{minHeight:'56px'}}>
          🎲 새 학습지 추가 → {selected.length}유형 × {setupCfg.count}문항{setupCfg.includeExample?' + 예제':''}
        </button>
        <div className="flex gap-2">
          <button onClick={()=>fileRef.current.click()} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs" style={{minHeight:'40px'}}>📥 JSON 파일에서 불러오기</button>
          <input ref={fileRef} type="file" accept=".json" onChange={importJSON} style={{display:'none'}}/>
        </div>
      </div>}
    </div>

    {quotaWarn&&<div className="text-[11px] text-red-600 bg-red-50 rounded-2xl px-3 py-2 font-bold">⚠️ 임시저장 용량이 가득 찼습니다. 오래된 학습지를 삭제하거나, 클라우드/JSON으로 저장한 뒤 작업대에서 지워 주세요.</div>}

    {/* ── 작업대 : 만든 학습지들 ── */}
    {sheets.length>0&&<div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-black text-gray-700">🗂 작업대 · 학습지 {sheets.length}장</span>
      <button onClick={()=>collapseAll(true)} className="text-[11px] px-3 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold" style={{minHeight:'36px'}}>모두 접기</button>
      <button onClick={()=>collapseAll(false)} className="text-[11px] px-3 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold" style={{minHeight:'36px'}}>모두 펼치기</button>
      <button onClick={clearAll} className="text-[11px] px-3 py-2 bg-red-50 text-red-500 rounded-xl font-bold ml-auto" style={{minHeight:'36px'}}>작업대 비우기</button>
    </div>}
    {sheets.map((s,i)=><GedSheetView key={s.id} sheet={s} seq={i+1} busy={busy} ops={ops}/>)}

    {sheets.length===0&&<div className="text-center text-sm text-gray-400 font-bold py-6">아직 만든 학습지가 없어요. 위에서 프리셋을 고르고 <b>새 학습지 추가</b>를 눌러 보세요.</div>}

    {/* ── 클라우드에 저장된 학습지 ── */}
    {cloudList.length>0&&<div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2"><div className="text-sm font-black text-gray-800">☁ 클라우드에 저장된 학습지</div><button onClick={loadList} className="text-xs text-indigo-600 font-bold" style={{minHeight:'30px'}}>새로고침</button></div>
      <div className="space-y-2 max-h-72 overflow-auto">
        {cloudList.map(c=>{const open=sheets.some(s=>s.docId===c.id);
          return<div key={c.id} className={`flex items-center gap-2 p-2.5 rounded-2xl ${open?'bg-indigo-50 border border-indigo-200':'bg-gray-50'}`}>
            <div className="flex-1 min-w-0"><div className="text-xs font-black text-gray-800 truncate">{c.title}</div>
              <div className="text-[10px] text-gray-400 font-bold truncate">{gedFmtTime(c.createdAt)} · 실전 {c.count||0}문항 · {(c.units||[]).length}유형{open?' · 작업대에 열림':''}</div></div>
            <button onClick={()=>openCloud(c.id)} disabled={busy} className="text-[11px] px-3 py-2 bg-indigo-500 text-white rounded-lg font-bold" style={{minHeight:'36px'}}>{open?'이동':'열기'}</button>
            <button onClick={()=>deleteCloud(c.id)} className="text-[11px] px-2 py-2 bg-red-50 text-red-500 rounded-lg font-bold" style={{minHeight:'36px'}}>삭제</button>
          </div>;})}
      </div>
    </div>}
  </div>;
}
