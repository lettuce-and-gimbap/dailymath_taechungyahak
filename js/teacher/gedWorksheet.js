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
  fs:24,cols2:false,showAns:false,format:'choice',includeConcept:true,includeExample:true,intro:true,count:3,blankConcept:false,
  qs:1,      // 문제 글자 배율 (문제 본문·보기)
  ms:1.2,     // 숫자·수식 배율 (학생이 숫자를 잘 읽도록 기본을 조금 크게)
  cs:1,      // 개념 카드 글자 배율
  /* 핵심 점 찍기(p1) 실전 문항을 만들 때 쓰는 설정 — 섞을 종류 · 식 보이기 · 모눈 · 좌표 쓰기 */
  kp:{kinds:['무리함수 시작점','유리함수 점근선 교점','이차함수 최대·최소 점'],eq:'식 숨기기',grid:'모눈 있음',write:'동그라미만'}};

/* 글자 크기 조절 — [−] 막대 [+] 와 빠른 단계 버튼. 값은 배율(1 = 100%) */
var GED_SIZE_STEPS=[['작게',.9],['보통',1],['크게',1.25],['아주 크게',1.5]];
function GedSizeCtl({label,value,min,max,onChange,steps}){
  const v=value||1;
  const set=x=>onChange(Math.round(Math.min(max,Math.max(min,x))*100)/100);
  const b='px-2.5 py-1.5 rounded-lg font-black text-xs';
  return<div className="flex flex-wrap items-center gap-1.5 bg-gray-100 rounded-xl px-3 py-1.5" style={{minHeight:'44px'}}>
    <span className="text-xs font-black text-gray-700 w-20 flex-none whitespace-nowrap">{label}</span>
    <button onClick={()=>set(v-.05)} className={b+' bg-white text-gray-700'} style={{minHeight:'34px',minWidth:'34px'}}>−</button>
    <input type="range" min={min*100} max={max*100} step="5" value={Math.round(v*100)} onChange={e=>set(+e.target.value/100)} style={{width:90,minHeight:0}}/>
    <button onClick={()=>set(v+.05)} className={b+' bg-white text-gray-700'} style={{minHeight:'34px',minWidth:'34px'}}>＋</button>
    <span className="text-xs font-black text-indigo-700 w-12 text-right whitespace-nowrap">{Math.round(v*100)}%</span>
    {(steps||GED_SIZE_STEPS).map(([t,x])=><button key={t} onClick={()=>set(x)}
      className={b+(Math.abs(v-x)<.001?' bg-indigo-600 text-white':' bg-white text-gray-600')} style={{minHeight:'34px'}}>{t}</button>)}
  </div>;
}
var GED_CONCEPT_STEPS=[['작게',.85],['보통',1],['크게',1.2],['아주 크게',1.4]];
var GED_NUM_STEPS=[['보통',1],['크게',1.2],['더 크게',1.4],['아주 크게',1.7]];

/* 유형을 세분화하면서 바뀐 id — 예전에 저장해 둔 학습지도 그대로 열리도록 옮겨 준다 */
var GED_UID_MIGRATE={
  u8:p=>((p.deg||'')==='삼차'?'u8a':'u8b'),
  u17:p=>(((p.kind||'')+(p.ask||'')).indexOf('역함수')>=0?'u17b':'u17a'),
  u18:p=>(((p.kind||'')+(p.type||'')).indexOf('무리')>=0?'u18b':'u18a')
};
/* 글을 고쳐 둔 카드(override HTML)의 그림만 새 그림으로 바꾼다 — 고친 글은 그대로 둔다 */
function gedSwapFig(html,figHtml){
  if(!html||!figHtml||typeof document==='undefined')return html;
  const t=document.createElement('template');t.innerHTML=html;
  const f=t.content.querySelector('.fig');
  const n=document.createElement('template');n.innerHTML=figHtml;const nf=n.content.firstElementChild;
  if(!f||!nf)return html;
  f.replaceWith(nf);return t.innerHTML;
}
function gedBuildFig(uid,params){
  try{const u=GED_UNITS.find(x=>x.id===uid);const r=u&&u.build(params);return r&&r.figure?r.figure:null;}catch(e){return null;}
}
/* 소급 적용 : 원의 방정식(13번)에 '그림 모양'(시험지 모양 / 격자 있음) 조건이 생기기 전에 만든 카드는
   조건이 없다. 열 때 한 번 정해 넣는다(둘을 섞어서). 시험지 모양이 된 카드는 글을 고쳐 두었더라도 그림만 바꾼다. */
function gedMigrateU13(p){
  if(p.uid!=='u13'||!p.params||p.params.grid!=null)return p;
  const grid=Math.random()<0.5?'시험지 모양(격자 없음)':'격자 있음';
  const params={...p.params,grid};
  let override=p.override;
  if(override&&override!=='1'&&grid!=='격자 있음'){const fg=gedBuildFig('u13',params);if(fg)override=gedSwapFig(override,fg);}
  return{...p,params,override};
}
/* 소급 적용 : '원과 직선의 접점' 카드는 예전에 중심(a,b)을 무시하고 늘 원점 중심으로 그렸다.
   중심을 옮겨 두었던 카드에서 글을 고쳐 둔 것은 그 글이 원점 중심 문제 기준이라 맞지 않으므로 고친 글을 걷어 내고 새로 그린다
   (고쳐 둔 글이 없는 카드는 열 때 저절로 새 문제로 그려진다). params.ask 가 표시이므로 한 번만 처리한다. */
function gedMigrateU13Tangent(p){
  if(p.uid!=='u13'||!p.params||p.params.kind!=='원과 직선의 접점')return p;
  const ask=p.params.ask,NEW=['접할 때 · 자연수 k','접할 때 · 최댓값','접할 때 · 최솟값','두 점에서 만날 때 · 최댓값','두 점에서 만날 때 · 최솟값','만나지 않을 때 · 최솟값'];
  if(ask!=null&&NEW.includes(ask))return p;                     // 이미 새 갈래
  /* 접할 때는 자연수 k 로 한정(음수 갈래 삭제). 옛 값은 모두 '접할 때 · 자연수 k' 로 옮긴다.
     - '접할 때 · 양수 k' : 답이 같으므로 고친 글을 그대로 둔다
     - '접할 때 · 음수 k' : 문장이 달라지므로 고친 글을 걷어 낸다
     - ask 없음(아주 예전) · '큰 값'/'작은 값' : 중심을 옮겨 두었고 글까지 고친 카드는 옛 문장이라 걷어 낸다 */
  const params={...p.params,ask:NEW[0]};
  const drop=p.override&&(ask==='접할 때 · 음수 k'||((ask==null||ask==='큰 값'||ask==='작은 값')&&(params.a||params.b)));
  if(drop)return{...p,params,override:null,rev:(p.rev||0)+1};
  return{...p,params};
}
function gedMigrateProblems(problems){
  return(problems||[]).map(p=>{
    const f=GED_UID_MIGRATE[p.uid];
    return gedMigrateU13Tangent(gedMigrateU13(f?{...p,uid:f(p.params||{})}:p));   // key 는 그대로 둔다 (편집해 둔 내용과 연결돼 있음)
  });
}
function gedMigrateIds(ids){
  const out=[];
  (ids||[]).forEach(id=>{
    if(id==='u8'){out.push('u8a','u8b');}
    else if(id==='u17'){out.push('u17a','u17b');}
    else if(id==='u18'){out.push('u18a','u18b');}
    else out.push(id);
  });
  return[...new Set(out)];
}

/* ── 내 개념 설명 (유형별 기본값) ─────────────────────────────
   학습지에서 개념 카드를 고치면 그 글이 유형 id 별로 여기에 저장되고,
   다음에 [새 학습지 추가]를 누르면 처음 설명 대신 이 글이 들어간다.
   - 브라우저(localStorage)와 Firestore(teacherSettings/gedConcepts) 두 곳에 둔다.
   - 항목 = {html, updatedAt}.  html:null 은 "처음 설명으로 되돌림" 표시(다른 기기와 맞출 때 쓴다).
   - html 은 빈칸 모드와 무관하게 보통 모드(진한 글씨)로 저장한다. 보여 줄 때 GS.conceptMode 로 바꾼다. */
var GED_CLIB_KEY='ged_concept_lib_v1';
function gedLoadCLib(){try{return JSON.parse(localStorage.getItem(GED_CLIB_KEY)||'{}')||{};}catch(e){return{};}}
function gedSaveCLibLocal(lib){try{localStorage.setItem(GED_CLIB_KEY,JSON.stringify(lib));}catch(e){}}
/* 두 저장본을 유형마다 더 최근 것으로 합친다 */
function gedMergeCLib(a,b){
  const out={...a};
  Object.keys(b||{}).forEach(k=>{const x=b[k];if(!x||typeof x!=='object')return;
    if(!out[k]||(x.updatedAt||0)>(out[k].updatedAt||0))out[k]=x;});
  return out;
}
/* 새 학습지에 넣을 개념 글 : 고른 유형 중 내 설명이 있는 것만 */
function gedCLibFor(lib,uids){
  const c={};(uids||[]).forEach(u=>{if(lib[u]&&lib[u].html)c[u]=lib[u].html;});return c;
}

function gedNewRec(u,idx,params){return{key:`${u.id}-${idx}-${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,uid:u.id,idx,params,override:null,rev:0};}

function gedSafeBuild(u,p){try{const r=u.build(p);return r&&!r.err?r:null;}catch(e){return null;}}

function gedSheetId(){return 's'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

/* 유형 하나에 대해 예제 + 실전 n문항 생성 (문제 텍스트 중복 방지)
   opts : 유형별 생성 설정 (지금은 핵심 점 찍기 p1 의 cfg.kp 만 쓴다. 다른 유형의 rand 는 받아도 무시한다) */
/* 겹치지 않게 나눠 뽑기 : pool 의 값을 count 번 뽑되, 모든 값이 한 번씩 나오기 전에는 같은 값을 다시 뽑지 않는다
   (count 가 pool 보다 많아지면 그다음 바퀴를 돈다 = 어쩔 수 없을 때만 최소한으로 겹친다). used = 이미 쓴 값들(예제 · 먼저 만든 카드 · 앞 유형) */
function gedSpread(count,pool,used,prefer){
  const cnt=new Map(pool.map(v=>[v,0]));
  (used||[]).forEach(v=>{if(cnt.has(v))cnt.set(v,cnt.get(v)+1);});
  const out=[];
  for(let i=0;i<count;i++){
    const min=Math.min(...cnt.values());
    let cand=pool.filter(v=>cnt.get(v)===min);
    const pref=prefer?cand.filter(v=>prefer.includes(v)):[];     // 같은 횟수끼리는 prefer(기출에 나온 것)를 먼저
    if(pref.length)cand=pref;
    const v=cand[Math.floor(Math.random()*cand.length)];
    out.push(v);cnt.set(v,min+1);
  }
  return out;
}

/* 유형 하나에 대해 예제 + 실전 n문항 생성 (문제 텍스트 중복 방지)
   opts : 유형별 생성 설정 (지금은 핵심 점 찍기 p1 의 cfg.kp 만 쓴다. 다른 유형의 rand 는 받아도 무시한다)
   usedRecs : 이미 같은 학습지에 있는 카드들 — u.plan 이 있는 유형(경우의 수 순열·조합)은 이 카드들과도 겹치지 않게 뽑는다
   u.plan(n,opts,usedParams,exParams,usedSameUnit) : 문항마다 미리 정해 둘 값 [{seed,c},…] 을 돌려준다 (상황 번호 62가지 · 문제 종류를 한 바퀴 돌 때까지 겹치지 않게) */
function gedGenUnit(u,count,withEx,opts,usedRecs){
  const out=[];
  let ex=null;
  if(withEx){ex=gedNewRec(u,0,u.exDef?u.exDef(opts):{...u.def});out.push(ex);}
  let plan=null;
  if(u.plan){try{plan=u.plan(count,opts,(usedRecs||[]).map(r=>r.params||{}),ex&&ex.params,(usedRecs||[]).filter(r=>r.uid===u.id).map(r=>r.params||{}));}catch(e){plan=null;}}
  const seen=new Set();
  for(let i=1;i<=count;i++){
    let params=null,first=null;
    /* 겹쳐서 다시 뽑을 때 reroll 이 있는 유형은 처음 뽑은 문제 종류를 지킨다 (p1 의 종류 섞기 순서가 밀리지 않게) */
    const again=()=>{const c=first&&u.reroll?u.reroll(first):u.rand(opts);return plan&&plan[i-1]?{...c,...plan[i-1]}:c;};
    for(let t=0;t<20;t++){const c=again();if(!first)first=c;const r=gedSafeBuild(u,c);if(!r)continue;
      const k=r.q+'|'+(r.answerTex||r.answerRaw||'');if(!seen.has(k)){seen.add(k);params=c;break;}}
    if(!params){for(let t=0;t<10&&!params;t++){const c=again();if(gedSafeBuild(u,c))params=c;}}
    out.push(gedNewRec(u,i,params||{...u.def}));
  }
  return out;
}

/* ───────────── 학습지 전체 다시 섞기 · 비슷한 문항 멀리 떼기 ─────────────
   문항의 '비슷함'(sig) : 문제 종류(kind = 첫 선택 조건) · 정답 · 문제 글.
   - gedPickSpread : 후보를 여러 번 뽑아 이미 쓴 종류·정답·글과 가장 덜 겹치는 것을 고른다 (순열·조합은 plan 으로 소재·종류를 돌려 쓴다).
   - gedPlaceFar   : 같은 종류·같은 정답이 가까이 놓이지 않게 자리를 채운다(앞뒤 모두 보고, 이미 자리가 정해진 문항 포함). */
function gedKindOf(u,params){
  const f=(u.fields||[]).find(f=>f.sel&&f.k!=='grid'&&f.k!=='dir'&&f.k!=='ask');
  return f?String(params[f.k]):'';
}
function gedSigOf(u,params){
  const r=gedSafeBuild(u,params);if(!r)return null;
  const sec={};(u.fields||[]).forEach(f=>{if(f.sel&&f.k!==(((u.fields||[]).find(g=>g.sel)||{}).k))sec[f.k]=String(params[f.k]);});
  return{q:String(r.q||''),ans:String(r.answerTex!==undefined?r.answerTex:(r.answerRaw!==undefined?r.answerRaw:(r.choices&&r.choices[r.ans])||'')),kind:gedKindOf(u,params),sec};
}
function gedPickSpread(u,n,opts,fixed){
  if(u.plan)return gedGenUnit(u,n,false,opts,fixed).map(r=>r.params);
  const chosen=(fixed||[]).map(p=>gedSigOf(u,p.params||p)).filter(Boolean);
  const out=[];
  for(let i=0;i<n;i++){
    let best=null,bs=1e9;
    for(let t=0;t<40;t++){
      const c=u.rand(opts),sg=gedSigOf(u,c);if(!sg)continue;
      let pen=0;chosen.forEach(o=>{if(o.q===sg.q)pen+=100;if(o.kind===sg.kind)pen+=10;if(o.ans===sg.ans)pen+=3;
        Object.keys(sg.sec||{}).forEach(k=>{if(o.sec&&o.sec[k]===sg.sec[k])pen+=1;});});   // 문제 종류 말고 다른 선택 조건(그림 모양 · 직선 방향 …)도 고르게
      if(pen<bs){bs=pen;best={c,sg};if(pen===0)break;}
    }
    if(!best){const c=u.rand(opts);best={c,sg:gedSigOf(u,c)||{q:'',ans:'',kind:gedKindOf(u,c)}};}
    out.push(best.c);chosen.push(best.sg);
  }
  return out;
}
/* fixedSigs[i] : 그 자리가 이미 정해져 있으면 sig, 비어 있으면 null. pool : 넣을 항목들 [{sig,...}] (개수 = 빈 자리 수). 빈 자리를 앞에서부터 채운다 */
function gedPlaceFar(fixedSigs,pool){
  const N=fixedSigs.length,out=new Array(N).fill(null),rest=pool.slice();
  const sigAt=i=>out[i]?out[i].sig:fixedSigs[i];
  const dist=(i,test)=>{for(let d=1;d<N;d++){const a=i-d,b=i+d;
    if(a>=0){const s=sigAt(a);if(s&&test(s))return d;}
    if(b<N&&fixedSigs[b]&&test(fixedSigs[b]))return d;}return N+1;};
  for(let i=0;i<N;i++){
    if(fixedSigs[i])continue;
    let bi=-1,bs=-1;
    const order=rest.map((_,k)=>k).sort(()=>Math.random()-0.5);
    order.forEach(k=>{const it=rest[k];
      const sc=Math.min(dist(i,s=>s.q===it.sig.q),50)*10000+Math.min(dist(i,s=>s.kind===it.sig.kind),50)*100+Math.min(dist(i,s=>s.ans===it.sig.ans),50);
      if(sc>bs){bs=sc;bi=k;}});
    out[i]=rest.splice(bi,1)[0];
  }
  return out;
}
/* 글을 고치지 않은 실전 문항의 숫자·유형을 다시 뽑는다. 글을 고쳐 둔 문항과 예제는 그대로 둔다. 돌려주는 값 {problems, rerolled:[key], kept:n} */
function gedReshuffle(problems,ov,kp){
  const out=problems.slice(),rerolled=[];let kept=0;const spread=[];
  GED_UNITS.forEach(u=>{
    const slots=out.map((p,i)=>i).filter(i=>out[i].uid===u.id&&out[i].idx!==0);
    if(!slots.length)return;
    const edited=i=>{const o=ov[out[i].key];return !!(o&&o!=='1');};
    const free=slots.filter(i=>!edited(i)),fixedRecs=slots.filter(edited).map(i=>out[i]);
    kept+=fixedRecs.length;
    const exRec=out.find(p=>p.uid===u.id&&p.idx===0);
    const fixedForPick=[...(exRec?[exRec]:[]),...fixedRecs];
    const params=gedPickSpread(u,free.length,kp,u.plan?[...spread,...fixedForPick]:fixedForPick);
    const pool=params.map(p=>({params:p,sig:gedSigOf(u,p)||{q:'',ans:'',kind:gedKindOf(u,p)}}));
    const fixedSigs=slots.map(i=>edited(i)?(gedSigOf(u,out[i].params)||{q:'',ans:'',kind:''}):null);
    const placed=gedPlaceFar(fixedSigs,pool);
    slots.forEach((i,k)=>{if(edited(i))return;const it=placed[k];
      out[i]={...out[i],params:it.params,override:null,rev:(out[i].rev||0)+1};rerolled.push(out[i].key);});
    if(u.plan)spread.push(...slots.map(i=>out[i]));
  });
  rerolled.forEach(k=>{delete ov[k];});
  /* 원의 방정식처럼 그림 모양(격자 있음/없음)이 있는 유형(gridMix)은 그것도 절반씩 무작위로 섞는다 — 글을 고쳐 둔 카드는 그림만 바꾼다 */
  const mixIds=GED_UNITS.filter(u=>u.gridMix).map(u=>u.id);
  const g=mixIds.length?gedGridAssign(out,'rand',ov,mixIds):null;
  return{problems:g?g.problems:out,rerolled,kept};
}
/* 문항은 그대로 두고 자리만 바꿔 같은 종류·같은 정답이 가까이 놓이지 않게 한다 (글을 고친 문항도 통째로 옮긴다) */
function gedSpreadOrder(problems){
  const out=problems.slice();
  GED_UNITS.forEach(u=>{
    const slots=out.map((p,i)=>i).filter(i=>out[i].uid===u.id&&out[i].idx!==0);
    if(slots.length<3)return;
    const pool=slots.map(i=>({rec:out[i],sig:gedSigOf(u,out[i].params)||{q:'',ans:'',kind:gedKindOf(u,out[i].params)}}));
    const placed=gedPlaceFar(slots.map(()=>null),pool);
    slots.forEach((i,k)=>{out[i]=placed[k].rec;});
  });
  return out;
}
/* 학습지 안 '격자(모눈) 있음/없음' 조건이 있는 모든 문항(원의 방정식 · 핵심 점 찍기) :
   'exam' = 없음 · 'grid' = 있음 · 'rand' = 절반씩 무작위. 유형마다 선택지 글이 다르므로 '없음'이 들어 있는 선택지를 없음으로 읽는다.
   글을 고쳐 둔 원의 방정식 카드는 그림만 바꾸고, 그림 구성이 다른 다른 유형의 고친 카드는 건드리지 않는다(skipped). */
function gedGridAssign(problems,mode,ov,only){
  const optsOf=u=>{const f=u.fields.find(f=>f.k==='grid');return{none:f.sel.find(o=>o.indexOf('없음')>=0),has:f.sel.find(o=>o.indexOf('없음')<0)};};
  const idxs=problems.map((p,i)=>i).filter(i=>{const u=GED_UNITS.find(x=>x.id===problems[i].uid);return u&&u.fields.some(f=>f.k==='grid')&&(!only||(only.includes(u.id)&&problems[i].idx!==0));});
  const wantNone=mode==='rand'?idxs.map((_,k)=>k%2===0).sort(()=>Math.random()-0.5):idxs.map(()=>mode==='exam');
  const out=problems.slice();let changed=0,skipped=0;
  idxs.forEach((i,k)=>{
    const p=out[i],u=GED_UNITS.find(x=>x.id===p.uid),o2=optsOf(u),g=wantNone[k]?o2.none:o2.has;
    if(p.params.grid===g)return;
    const o=ov[p.key];
    if(o&&o!=='1'){
      if(p.uid!=='u13'){skipped++;return;}
      const params={...p.params,grid:g},fg=gedBuildFig(p.uid,params);if(fg)ov[p.key]=gedSwapFig(o,fg);
      out[i]={...p,params,rev:(p.rev||0)+1};changed++;return;
    }
    out[i]={...p,params:{...p.params,grid:g},override:null,rev:(p.rev||0)+1};changed++;
  });
  return{problems:out,total:idxs.length,changed,skipped};
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
  return{id:gedSheetId(),cfg:{...cfg},problems,docId:docId||null,collapsed:false,edit:false,showCtrl:true,
    concepts:{},cRev:0,createdAt:Date.now()};
}

/* localStorage 복원 (v2 → 없으면 v1 단일 학습지를 한 장으로 옮겨 옴) */
function gedLoadInit(){
  const def={setupCfg:{...GED_DEF_CFG},selected:GED_PRESETS[0].ids,sheets:[]};
  try{
    const d=JSON.parse(localStorage.getItem(GED_LS_KEY)||'null');
    if(d&&Array.isArray(d.sheets))
      return{setupCfg:{...GED_DEF_CFG,...(d.setupCfg||{})},selected:gedMigrateIds(d.selected&&d.selected.length?d.selected:def.selected),
        sheets:d.sheets.map(s=>({...gedMakeSheet({...GED_DEF_CFG,...(s.cfg||{})},[],s.docId),...s,
          cfg:{...GED_DEF_CFG,...(s.cfg||{})},concepts:s.concepts||{},
          problems:gedMigrateProblems(s.problems).map(p=>({...p,rev:0}))}))};
    const v1=JSON.parse(localStorage.getItem(GED_LS_KEY_V1)||'null');
    if(v1&&v1.cfg&&Array.isArray(v1.problems)&&v1.problems.length){
      const sh=gedMakeSheet({...GED_DEF_CFG,...v1.cfg},gedMigrateProblems(v1.problems).map(p=>({...p,rev:0})),v1.docId);
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

/* 글자 편집 도구막대 — 서식 · 글자색 · 형광펜 · 수식(LaTeX) · 마크다운 안내. 편집 칸을 누른 뒤(또는 글을 드래그해 선택한 뒤) 누른다. */
function GedFormatBar({getRoot}){
  const COLORS=GS.EDIT_COLORS,HL=GS.EDIT_HL;
  const size=dir=>{const r=getRoot(),sel=window.getSelection();const h=sel&&sel.rangeCount?sel.anchorNode&&(sel.anchorNode.nodeType===1?sel.anchorNode:sel.anchorNode.parentElement).closest('[contenteditable="true"]'):null;
    if(!h||!r||!r.contains(h)||!GS.sizeStep(h,dir))hint();};
  const keep=e=>e.preventDefault();   // 눌러도 편집 칸의 선택이 풀리지 않게
  const hint=()=>alert('먼저 고칠 글 안을 눌러 커서를 두거나, 서식을 줄 글을 드래그해서 선택해 주세요.');
  const run=(cmd,val)=>{if(!GS.fmt(getRoot(),cmd,val))hint();};
  const B=({t,title,on,style})=><button type="button" title={title} onMouseDown={keep} onClick={on} className="px-3 rounded-lg bg-gray-100 text-gray-800 text-sm font-black" style={{minHeight:'38px',minWidth:'38px',...style}}>{t}</button>;
  const Sw=({c,title,on})=><button type="button" className="sw" title={title} onMouseDown={keep} onClick={on} style={{width:28,height:28,minWidth:0,minHeight:0,padding:0,borderRadius:999,border:'2px solid #cbd5e1',background:c==='transparent'?'repeating-linear-gradient(45deg,#fff 0 4px,#e5e7eb 4px 8px)':c,flex:'none'}}/>;
  return<div className="gfb noprint sticky top-0 z-20 bg-white border-2 border-indigo-200 rounded-2xl p-2 mt-2 shadow-md">
    <style>{`.gfb button{min-height:38px!important}.gfb button.sw{min-height:0!important;min-width:0!important}`}</style>
    <div className="flex flex-wrap gap-1.5 items-center">
      <B t="B" title="굵게 (Ctrl+B)" on={()=>run('bold')} style={{fontWeight:900}}/>
      <B t="I" title="기울임 (Ctrl+I)" on={()=>run('italic')} style={{fontStyle:'italic'}}/>
      <B t="U" title="밑줄 (Ctrl+U)" on={()=>run('underline')} style={{textDecoration:'underline'}}/>
      <B t="S" title="취소선 (Ctrl+Shift+X)" on={()=>run('strikeThrough')} style={{textDecoration:'line-through'}}/>
      <B t="A−" title="글자 줄이기 (Ctrl+[)" on={()=>size(-1)}/>
      <B t="A+" title="글자 키우기 (Ctrl+])" on={()=>size(1)}/>
      <span className="text-[11px] font-bold text-gray-500 ml-1">글자색</span>
      {COLORS.map(([c,n],i)=><Sw key={c} c={c} title={`${n} (Ctrl+Alt+${i+1})`} on={()=>run('foreColor',c)}/>)}
      <span className="text-[11px] font-bold text-gray-500 ml-1">형광펜</span>
      {HL.map(([c,n],i)=><Sw key={c} c={c} title={`${n} (Ctrl+Alt+${['7','8','9','0','-'][i]})`} on={()=>run('hiliteColor',c)}/>)}
      <B t="∑ 수식" title="커서 자리에 수식(LaTeX) 넣기" on={()=>{if(!GS.openMath(getRoot()))hint();}} style={{background:'#e0e7ff',color:'#3730a3'}}/>
      <B t="⌫ 서식 지우기" title="선택한 글의 서식 지우기" on={()=>run('removeFormat')}/>
    </div>
    <div className="text-[11px] text-gray-600 font-medium mt-1.5 leading-relaxed">
      마크다운처럼 바로 써도 됩니다 : <b>**굵게**</b> · <i>*기울임*</i> · <s>~~취소선~~</s> · <mark>==형광펜==</mark> · <b>$x^2+1$</b>(수식) — 닫는 기호를 치는 순간 바뀝니다.
      <b> 수식을 누르면 다시 고칠 수 있습니다.</b><br/>
      단축키 : <b>Ctrl+]</b> 글자 키우기 · <b>Ctrl+[</b> 줄이기(선택한 글, 없으면 커서 낱말) · <b>Ctrl+Alt+1~6</b> 글자색(빨·주·초·파·보·검) · <b>Ctrl+Alt+7·8·9·0</b> 형광펜 · <b>Ctrl+Alt+-</b> 형광펜 끄기 · <b>Ctrl+Shift+X</b> 취소선<br/> 고친 카드는 노란 테두리가 되고, 조건 상자의 [↩ 생성 상태로]로 되돌릴 수 있습니다.</div>
  </div>;
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
      onInput={e=>{GS.mdShortcut(e);onOverride(rec.key,GS.cleanHtml(e.currentTarget));}}
      onKeyDown={edit?GS.editKey:undefined} onClick={edit?GS.mathClick:undefined} onPaste={edit?GS.plainPaste:undefined}
      dangerouslySetInnerHTML={{__html:html}}/>
    {showCtrl&&<div className="ctrl noprint">
      <span className="tag">{isEx?'예제':'실전'} 조건</span>
      {unit.fields.map(f=>f.sel
        ?<label key={f.k}>{f.label} <select value={rec.params[f.k]} onChange={e=>onParam(rec.key,f.k,e.target.value)}>{f.sel.map(o=><option key={o} value={o}>{o}</option>)}</select></label>
        :<GedNumField key={f.k} label={f.label} value={rec.params[f.k]} min={f.min} max={f.max} onCommit={n=>onParam(rec.key,f.k,n)}/>)}
      {(()=>{const h=unit.hint?unit.hint(rec.params):'';return h?<div style={{flexBasis:'100%',fontSize:'12px',lineHeight:1.5,color:'#8a5a00',background:'#fff7e0',border:'1px solid #f0d9a0',borderRadius:'8px',padding:'5px 9px'}}>💡 {h}</div>:null;})()}
      <button onClick={()=>onRandom(rec.key)}>🎲 새 숫자</button>
      {rec.override&&<button onClick={()=>onRevert(rec.key)}>↩ 생성 상태로</button>}
      <button className="danger" onClick={()=>onRemove(rec.key)}>✕ 삭제</button>
    </div>}
  </div>;
}

/* 개념 카드 — 글자 편집 모드에서 설명을 직접 고칠 수 있다.
   빈칸 뚫기를 켜면 [[핵심말]]이 밑줄 빈칸이 되고, 정답 보이기를 켜면 빈칸 안의 답이 나타난다.
   고친 내용은 그 학습지에 저장되고, 동시에 '내 설명'으로 저장되어 다음 학습지에도 들어간다.
   [↩ 처음 설명으로] 는 이 카드와 '내 설명'을 모두 처음 설명으로 되돌린다. */
function GedConceptCard({unit,blank,rev,edit,showCtrl,edited,saved,getHtml,onEdit,onReset}){
  const ref=useRef();
  const html=useMemo(()=>getHtml(unit.id),[unit.id,blank,rev]);
  useEffect(()=>{GS.renderTex(ref.current);},[html]);
  return<div className={`card concept${edited?' overridden':''}`}>
    <div ref={ref} contentEditable={edit} suppressContentEditableWarning={true}
      onInput={e=>{GS.mdShortcut(e);onEdit(GS.cleanHtml(e.currentTarget));}}
      onKeyDown={edit?GS.editKey:undefined} onClick={edit?GS.mathClick:undefined} onPaste={edit?GS.plainPaste:undefined}
      dangerouslySetInnerHTML={{__html:html}}/>
    {showCtrl&&<div className="ctrl noprint"><span className="tag">개념 설명</span>
      <span style={{fontSize:'12px',color:'#666'}}>{edit?'글자를 눌러 바로 고칠 수 있습니다 · 고친 글은 다음 학습지에도 그대로 들어갑니다':'[✏️ 글자 편집]을 켜면 여기를 고칠 수 있습니다'}</span>
      {saved&&<span style={{fontSize:'12px',color:'#0a7a45',fontWeight:700}}>📌 내 설명 (다음 학습지에도 적용)</span>}
      {(edited||saved)&&<button onClick={onReset}>↩ 처음 설명으로</button>}</div>}
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

  return<div id={'ged-sheet-'+id} className={`bg-white rounded-3xl shadow-sm border-2 ${collapsed?'border-gray-100':'border-indigo-200'} overflow-clip`}>
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
        <Btn on={cfg.blankConcept} onClick={()=>setCfg({blankConcept:!cfg.blankConcept})}>✍️ 개념 빈칸</Btn>
        <Btn on={cfg.cols2} onClick={()=>setCfg({cols2:!cfg.cols2})}>🖨️ 실전 2단</Btn>
        <Btn on={cfg.format==='open'} onClick={()=>setCfg({format:cfg.format==='open'?'choice':'open'})}>{cfg.format==='open'?'서술형':'사지선다'}</Btn>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl px-3" style={{minHeight:'40px'}}>전체 글자
          <input type="range" min="16" max="40" value={cfg.fs} onChange={e=>setCfg({fs:+e.target.value})} style={{width:90,minHeight:0}}/>{cfg.fs}px</label>
      </div>
      {/* ── 학습지 전체에 한 번에 : 그림 모양 · 다시 섞기 · 비슷한 문항 떼기 ── */}
      <div className="flex flex-wrap gap-2 items-center mt-2 bg-indigo-50 rounded-2xl px-2 py-2">
        <span className="text-[11px] font-black text-indigo-700 px-1">전체 한 번에</span>
        {problems.some(p=>{const u=GED_UNITS.find(x=>x.id===p.uid);return u&&u.fields.some(f=>f.k==='grid');})&&<>
          <Btn onClick={()=>ops.setAllGrid(id,'exam')}>◯ 전체 격자 없음</Btn>
          <Btn onClick={()=>ops.setAllGrid(id,'grid')}>▦ 전체 격자 있음</Btn>
          <Btn onClick={()=>ops.setAllGrid(id,'rand')}>🎲 격자 랜덤</Btn></>}
        <Btn onClick={()=>ops.reshuffle(id)}>🔀 숫자·유형 다시 섞기</Btn>
        <Btn onClick={()=>ops.spreadOrder(id)}>↕ 비슷한 문항 멀리 떼기</Btn>
      </div>
      {/* 글자 크기 : 문제 글 / 숫자·수식 따로 — 인쇄·PDF에도 그대로 반영된다 */}
      <div className="flex flex-col gap-1.5 mt-2">
        <GedSizeCtl label="문제 글자" value={cfg.qs} min={.8} max={1.6} onChange={x=>setCfg({qs:x})}/>
        <GedSizeCtl label="개념 글자" value={cfg.cs} min={.7} max={1.6} steps={GED_CONCEPT_STEPS} onChange={x=>setCfg({cs:x})}/>
        <GedSizeCtl label="숫자·수식" value={cfg.ms} min={.8} max={2} steps={GED_NUM_STEPS} onChange={x=>setCfg({ms:x})}/>
      </div>
      <div className="grid grid-cols-1 gap-2 mt-2">
        <input value={cfg.title} onChange={e=>setCfg({title:e.target.value})} placeholder="학습지 제목" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400" style={{minHeight:'42px'}}/>
        <input value={cfg.subtitle} onChange={e=>setCfg({subtitle:e.target.value})} placeholder="부제(선택)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-indigo-400" style={{minHeight:'38px'}}/>
      </div>
      {edit&&<GedFormatBar getRoot={()=>ref.current}/>}

      {/* ── 미리보기 ── */}
      <div ref={ref} className={cls+' mt-3'} style={{'--fs':cfg.fs+'px','--qs':cfg.qs||1,'--ms':cfg.ms||1,'--cs':cfg.cs||1}}>
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
            {cfg.includeConcept&&<GedConceptCard unit={u} blank={!!cfg.blankConcept} rev={sheet.cRev||0}
              edit={edit} showCtrl={showCtrl} edited={!!(sheet.concepts&&sheet.concepts[u.id])} saved={ops.cLibHas(u.id)}
              getHtml={uid=>(sheet.concepts&&sheet.concepts[uid])?GS.conceptMode(sheet.concepts[uid],!!cfg.blankConcept):GS.conceptHTML(u,{blank:cfg.blankConcept})}
              onEdit={h=>ops.onConceptEdit(id,u.id,h)} onReset={()=>{if(confirm(`'${u.title}' 개념 설명을 처음 설명으로 되돌릴까요?\n(이 학습지와, 앞으로 만들 학습지 모두 처음 설명으로 돌아갑니다)`))ops.onConceptReset(id,u.id);}}/>}
            {cfg.includeConcept&&u.pageAfterConcept&&<div className="pgbreak"><span>여기서 다음 쪽으로 넘어갑니다</span></div>}
            {ex.length>0&&<h3>풀이 예시</h3>}
            {ex.map(r=><GedProblemCard key={r.key} rec={r} unit={u} no={r.no} {...cardProps}/>)}
            {qs.length>0&&<h3>{u.qTitle||'실전 문제'}</h3>}
            {qs.length>0&&<div className="qgrid">{qs.map(r=><GedProblemCard key={r.key} rec={r} unit={u} no={r.no} {...cardProps}/>)}</div>}
          </div>;})}
        {problems.length===0&&<p className="sub">문항이 모두 빠졌습니다. 이 학습지는 삭제하거나, 설정에서 새로 만들어 주세요.</p>}
      </div>
    </div>}
  </div>;
}

/* 핵심 점 찍기(p1) 설정 상자 — 이 유형을 골랐을 때만 보인다.
   여기서 고른 값으로 실전 문항이 만들어지고, 만든 뒤에도 문항마다 조건 상자에서 하나씩 바꿀 수 있다. */
function GedKpSetup({kp,onChange,Btn}){
  const all=GED_DEF_CFG.kp.kinds;
  const kinds=kp.kinds||all;
  const set=patch=>onChange({...kp,...patch});
  const toggleKind=k=>set({kinds:kinds.includes(k)?kinds.filter(x=>x!==k):all.filter(x=>x===k||kinds.includes(x))});
  return<div className="mt-3 bg-amber-50 rounded-2xl px-3 py-3 space-y-2">
    <div className="text-xs font-black text-amber-800">⭕ 점 찍기 연습 — 섞을 함수와 보기 방식</div>
    <div className="flex flex-wrap gap-2">{all.map(k=><Btn key={k} on={kinds.includes(k)} onClick={()=>toggleKind(k)}>{kinds.includes(k)?'✓ ':''}{k}</Btn>)}</div>
    <div className="flex flex-wrap gap-2">
      <Btn on={kp.eq==='식 보이기'} onClick={()=>set({eq:kp.eq==='식 보이기'?'식 숨기기':'식 보이기'})}>{kp.eq==='식 보이기'?'식 보이기':'식 숨기기 (그림만)'}</Btn>
      <Btn on={kp.grid!=='모눈 없음'} onClick={()=>set({grid:kp.grid==='모눈 없음'?'모눈 있음':'모눈 없음'})}>{kp.grid==='모눈 없음'?'모눈 없음 (시험지 모양)':'모눈 있음'}</Btn>
      <Btn on={kp.write==='좌표도 쓰기'} onClick={()=>set({write:kp.write==='좌표도 쓰기'?'동그라미만':'좌표도 쓰기'})}>{kp.write==='좌표도 쓰기'?'좌표도 쓰기':'동그라미만'}</Btn>
    </div>
    <div className="text-[11px] text-amber-800 font-medium">고른 함수가 문항마다 번갈아 섞여 나옵니다. 1쪽은 개념(세 함수의 동그라미 예시), 2쪽부터 연습입니다.</div>
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
  /* 고쳐 둔 글(override)은 첫 화면을 그리기 전에 채워 둔다 — 효과(useEffect)로 채우면 펼쳐져 있던 학습지가 고친 글 대신 새로 만든 글로 먼저 그려지고, 그 위에서 고치면 저장돼 있던 글이 사라진다 */
  const ovRef=useRef(null);
  if(ovRef.current===null){ovRef.current={};init.sheets.forEach(s=>(s.problems||[]).forEach(p=>{if(p.override)ovRef.current[p.key]=p.override;}));}
  const fileRef=useRef();
  const[cLib,setCLib]=useState(gedLoadCLib);          // 내 개념 설명 (유형 id → {html,updatedAt})
  const[showCLib,setShowCLib]=useState(false);

  const showToast=m=>{setToast(m);clearTimeout(showToast._t);showToast._t=setTimeout(()=>setToast(''),2800);};
  const withOv=ps=>ps.map(p=>({...p,override:ovRef.current[p.key]||null}));
  /* 개념 글은 입력이 멈춘 뒤에야 상태에 반영되므로, 그 사이(0.5초)에 저장·반출·탭 이동을 해도 빠지지 않게 보관해 두고 같이 합친다 */
  const pendC=useRef({});
  const conceptsOf=s=>{const c={...(s.concepts||{})};Object.values(pendC.current).forEach(x=>{if(x.id===s.id)c[x.uid]=x.html;});return c;};
  const savedRef=useRef(null);
  const getSheet=id=>sheets.find(s=>s.id===id);

  /* ---------- 자동 임시저장 ---------- */
  const saveLocal=useCallback(()=>{
    try{
      localStorage.setItem(GED_LS_KEY,JSON.stringify({setupCfg,selected,
        sheets:sheets.map(s=>({...s,concepts:conceptsOf(s),problems:withOv(s.problems)}))}));
      setQuotaWarn(false);
      if(savedRef.current)savedRef.current.textContent='💾 임시저장됨 '+timeStr()+':'+String(new Date().getSeconds()).padStart(2,'0');
    }catch(e){setQuotaWarn(true);}
  },[setupCfg,selected,sheets]);
  useEffect(()=>{const t=setTimeout(saveLocal,700);return()=>clearTimeout(t);},[saveLocal]);
  const ovTimer=useRef(null);
  /* 탭을 닫거나 숨길 때·다른 탭으로 옮길 때는 기다리지 않고 바로 저장한다 (마지막 1초 안의 편집이 사라지지 않게) */
  const saveNow=useRef(saveLocal);saveNow.current=saveLocal;
  useEffect(()=>{
    const f=()=>saveNow.current();
    const vis=()=>{if(document.visibilityState==='hidden')f();};
    window.addEventListener('pagehide',f);document.addEventListener('visibilitychange',vis);
    return()=>{window.removeEventListener('pagehide',f);document.removeEventListener('visibilitychange',vis);f();};
  },[]);

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
  /* reroll 이 있는 유형(p1)에서 '문제 종류'를 바꾸면 그 종류에 맞는 숫자를 새로 뽑는다
     (예전 숫자를 그대로 두면 무리함수의 점이 이차함수 범위와 안 맞아 바로 오류 카드가 된다) */
  const onParam=(id,key,k,v)=>{
    const keepOv=k==='grid'&&ovRef.current[key]&&ovRef.current[key]!=='1';   // 글을 고쳐 둔 카드 : 그림 모양만 바꾸고 고친 글은 지키지 않고 지우지도 않는다
    if(!keepOv)delete ovRef.current[key];
    mapProbs(id,ps=>ps.map(p=>{if(p.key!==key)return p;const u=byId(p.uid);
    const params0=(k==='kind'&&u.reroll)?u.reroll({...p.params,kind:v}):{...p.params,[k]:v};
    const params=u.fix?u.fix(params0,k):params0;   // 유형이 고른 조건에 맞게 다른 숫자를 맞추는 경우(원과 직선의 '구할 것')
    if(keepOv){const fg=gedBuildFig(p.uid,params);if(fg)ovRef.current[key]=gedSwapFig(ovRef.current[key],fg);return{...p,params,rev:p.rev+1};}
    // 예전에 저장된 19·20번도 조건을 고치는 순간 그림이 있는 생성기로 전환한다.
    if((u.id==='u19'||u.id==='u20')&&!params.v)params.v=3;
    // 기존 문항에서 새 상황 번호를 직접 고를 때에만 새 버전으로 전환한다.
    if((u.id==='u19'||u.id==='u20')&&k==='seed'&&Number(v)>60&&params.v<5){params.v=5;params.drawSeed=newSeed();}
    return{...p,params,override:null,rev:p.rev+1};}));};
  /* reroll 이 있는 유형(p1)은 문제 종류·보기 설정을 지키고 숫자만 바꾼다 */
  const onRandom=(id,key)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.map(p=>{if(p.key!==key)return p;const u=byId(p.uid);
    return{...p,params:u.reroll?u.reroll(p.params):u.rand(),override:null,rev:p.rev+1};}));};
  const onRevert=(id,key)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.map(p=>p.key===key?{...p,override:null,rev:p.rev+1}:p));};
  const onRemoveProb=(id,key)=>{delete ovRef.current[key];mapProbs(id,ps=>ps.filter(p=>p.key!==key));};
  const addProblem=(id,uid)=>{const u=byId(uid);patchSheet(id,s=>{const ps=s.problems;const mine=ps.filter(p=>p.uid===uid);const idx=Math.max(0,...mine.map(p=>p.idx))+1;
    const[rec]=gedGenUnit(u,1,false,s.cfg.kp,mine);rec.idx=idx;const last=ps.map(p=>p.uid).lastIndexOf(uid);const out=ps.slice();out.splice(last+1,0,rec);return{...s,problems:out};});};
  const removeUnit=(id,uid)=>mapProbs(id,ps=>{ps.filter(p=>p.uid===uid).forEach(p=>delete ovRef.current[p.key]);return ps.filter(p=>p.uid!==uid);});
  const onOverride=(key,html)=>{ovRef.current[key]=html;
    setSheets(ss=>ss.map(s=>s.problems.some(p=>p.key===key&&!p.override)?{...s,problems:s.problems.map(p=>p.key===key?{...p,override:'1'}:p)}:s));
    clearTimeout(ovTimer.current);ovTimer.current=setTimeout(saveLocal,900);};
  const getOverride=key=>ovRef.current[key]||null;

  /* ---------- 생성 : 기존 학습지는 접어 두고 새 장을 맨 위에 추가 ---------- */
  const generate=()=>{
    if(!selected.length){showToast('유형을 하나 이상 골라 주세요.');return;}
    if(selected.includes('p1')&&!(setupCfg.kp&&setupCfg.kp.kinds&&setupCfg.kp.kinds.length)){showToast('점 찍기 연습에 넣을 함수를 하나 이상 골라 주세요.');return;}
    /* 순열·조합처럼 상황(소재)을 돌려 쓰는 유형은 앞 유형에서 쓴 상황과도 겹치지 않게 서로의 카드를 넘겨 준다 */
    const list=[];const spread=[];
    UNITS.forEach(u=>{if(!selected.includes(u.id))return;
      const g=gedGenUnit(u,setupCfg.count,setupCfg.includeExample,setupCfg.kp,u.plan?spread:null);
      if(u.plan)spread.push(...g);list.push(...g);});
    const sh=gedMakeSheet(setupCfg,list,null);
    sh.concepts=gedCLibFor(cLib,selected);   // 고쳐 둔 '내 설명'이 있는 유형은 그 글로 시작
    const before=sheets.length;
    setSheets(ss=>[sh,...ss.map(s=>({...s,collapsed:true}))]);
    setShowSetup(false);
    showToast(before?`✅ 새 학습지를 추가했습니다. (기존 ${before}장은 접어 두었습니다)`:'✅ 학습지를 만들었습니다.');
    setTimeout(()=>{const el=document.getElementById('ged-sheet-'+sh.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},60);
  };
  const applyPreset=pre=>{
    /* 점 찍기 프리셋은 쪽 구성(개념 1쪽 + 2단 연습)이 달라 보기 설정도 함께 바꾼다. 다른 프리셋으로 돌아가면 기본 구성으로 되돌린다 */
    const wasKp=selected.length===1&&selected[0]==='p1';
    setSelected(pre.ids);
    if(pre.k==='kpoint'){setSetupCfg({title:'그래프의 핵심 점 찾기 — 원점 O 와 그 점에 ○',
      subtitle:'무리함수 시작점 · 유리함수 점근선 교점 · 이차함수 최대·최소 점',
      intro:false,includeConcept:true,includeExample:false,cols2:true,count:12});return;}
    if(wasKp)setSetupCfg({intro:true,includeExample:true,cols2:false,count:3});
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
    const cc=conceptsOf(s);
    const gs=gedGroups(s.problems).map(g=>({unit:g.unit,
      conceptHtml:cc[g.unit.id]||null,
      recs:g.recs.map(r=>({...r,override:ovRef.current[r.key]||null}))}));
    const w=window.open('','_blank');
    if(!w){showToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.');return;}
    w.document.open();w.document.write(GS.docHTML(s.cfg,gs,{autoPrint}));w.document.close();
    if(autoPrint)showToast('🖨️ 인쇄창에서 "PDF로 저장"을 고르면 PDF 파일이 됩니다.');
  };
  /* ---------- 반출 : JSON ---------- */
  const exportJSON=id=>{
    const s=getSheet(id);if(!s)return;
    const data={v:2,cfg:s.cfg,selected:[...new Set(s.problems.map(p=>p.uid))],problems:withOv(s.problems),concepts:conceptsOf(s)};
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
        const sh=gedMakeSheet({...GED_DEF_CFG,...(x.cfg||{})},gedMigrateProblems(x.problems).map(p=>({...p,rev:0})),null);
        sh.concepts=x.concepts||{};return sh;});
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
        concepts:conceptsOf(s),count:s.problems.filter(p=>p.idx!==0).length,units:gs.map(g=>g.unit.tag+' '+g.unit.title),updatedAt:new Date()};
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
      const sh=gedMakeSheet({...GED_DEF_CFG,...(x.cfg||{})},gedMigrateProblems(x.problems).map(p=>({...p,rev:0})),cid);
      sh.concepts=x.concepts||{};
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

  /* ---------- 내 개념 설명 : 불러오기 · 저장 ---------- */
  useEffect(()=>{
    db.collection('teacherSettings').doc('gedConcepts').get()
      .then(snap=>{if(!snap.exists)return;const d=snap.data()||{};delete d.updatedAt;
        setCLib(prev=>{const m=gedMergeCLib(prev,d);gedSaveCLibLocal(m);return m;});})
      .catch(()=>{});
  },[]);
  const putCLib=(uid,html)=>{
    const item={html,updatedAt:Date.now()};
    setCLib(prev=>{const m={...prev,[uid]:item};gedSaveCLibLocal(m);return m;});
    db.collection('teacherSettings').doc('gedConcepts').set({[uid]:item,updatedAt:Date.now()},{merge:true}).catch(()=>{});
  };
  const cLibHas=uid=>!!(cLib[uid]&&cLib[uid].html);
  const cLibCount=Object.keys(cLib).filter(cLibHas).length;
  const resetCLib=uid=>{putCLib(uid,null);const u=byId(uid);showToast(`↩ '${u?u.title:uid}' 개념 설명을 처음 설명으로 되돌렸습니다.`);};

  /* ---------- 개념 카드 편집 ---------- */
  const cTimer=useRef({});   // 카드마다 따로 (여러 카드를 이어서 고쳐도 앞 편집이 사라지지 않게)
  const onConceptEdit=(id,uid,html)=>{
    const tk=id+'|'+uid;
    clearTimeout(cTimer.current[tk]);
    const norm=GS.conceptMode(html,false);     // 빈칸 모드에서 고쳐도 보통 모드 모양으로 저장
    pendC.current[tk]={id,uid,html:norm};
    cTimer.current[tk]=setTimeout(()=>{
      delete pendC.current[tk];
      patchSheet(id,s=>({...s,concepts:{...(s.concepts||{}),[uid]:norm}}));
      putCLib(uid,norm);                       // 다음 학습지에도 이 글이 들어가게
    },500);
  };
  const onConceptReset=(id,uid)=>{
    patchSheet(id,s=>{
      const c={...(s.concepts||{})};delete c[uid];
      return{...s,concepts:c,cRev:(s.cRev||0)+1};
    });
    putCLib(uid,null);
  };

  const setAllGrid=(id,mode)=>{
    const s=getSheet(id);if(!s)return;
    const r=gedGridAssign(s.problems,mode,ovRef.current);
    if(!r.total){showToast('격자 있음/없음을 고를 수 있는 문항(원의 방정식 · 핵심 점 찍기)이 없습니다.');return;}
    patchSheet(id,sh=>({...sh,problems:r.problems}));
    r.problems.forEach(p=>{if(p.override===null)delete ovRef.current[p.key];});
    const sk=r.skipped?` (글을 고쳐 둔 ${r.skipped}개는 그대로)`:'';
    showToast((mode==='exam'?`◯ ${r.total}문항을 모두 격자 없음으로 바꿨습니다.`:mode==='grid'?`▦ ${r.total}문항을 모두 격자 있음으로 바꿨습니다.`:`🎲 ${r.total}문항에 격자 있음/없음을 절반씩 섞어 넣었습니다.`)+sk);
  };
  const reshuffle=id=>{
    const s=getSheet(id);if(!s)return;
    const cnt=s.problems.filter(p=>p.idx!==0).length;if(!cnt)return;
    const ed=s.problems.filter(p=>p.idx!==0&&ovRef.current[p.key]&&ovRef.current[p.key]!=='1').length;
    if(!confirm(`이 학습지 실전 문항 ${cnt}개의 숫자·유형을 다시 뽑습니다.\n서로 겹치지 않게 뽑고, 비슷한 문항은 번호가 멀리 떨어지게 놓습니다.${ed?`\n(글을 고쳐 둔 ${ed}개와 예제는 그대로 둡니다)`:''}\n계속할까요?`))return;
    const r=gedReshuffle(s.problems,ovRef.current,s.cfg.kp);
    r.rerolled.forEach(k=>delete ovRef.current[k]);
    patchSheet(id,sh=>({...sh,problems:r.problems}));
    showToast(`🔀 ${r.rerolled.length}문항을 다시 뽑았습니다.${r.kept?` (글을 고친 ${r.kept}개는 그대로)`:''}`);
  };
  const spreadOrder=id=>{
    const s=getSheet(id);if(!s)return;
    patchSheet(id,sh=>({...sh,problems:gedSpreadOrder(sh.problems)}));
    showToast('↕ 같은 종류·같은 정답인 문항이 가까이 놓이지 않게 번호 자리를 옮겼습니다.');
  };
  const ops={setAllGrid,reshuffle,spreadOrder,setCfg,setUI,toggle,removeSheet,saveCloud,openDoc,exportJSON,onParam,onRandom,onRemoveProb,onRevert,addProblem,removeUnit,onOverride,getOverride,onConceptEdit,onConceptReset,cLibHas};
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
          {selected.includes('p1')&&<GedKpSetup kp={setupCfg.kp||GED_DEF_CFG.kp} onChange={kp=>setSetupCfg({kp})} Btn={Btn}/>}
          <div className="flex flex-wrap gap-2 mt-2">
            <Btn on={setupCfg.includeConcept} onClick={()=>setSetupCfg({includeConcept:!setupCfg.includeConcept})}>📖 개념 카드</Btn>
            <Btn on={setupCfg.includeExample} onClick={()=>setSetupCfg({includeExample:!setupCfg.includeExample})}>💡 예제(풀이 공개)</Btn>
            <Btn on={setupCfg.intro} onClick={()=>setSetupCfg({intro:!setupCfg.intro})}>📌 사용법 안내 상자</Btn>
            <Btn on={setupCfg.blankConcept} onClick={()=>setSetupCfg({blankConcept:!setupCfg.blankConcept})}>✍️ 개념 빈칸 뚫기</Btn>
            <Btn on={setupCfg.format==='choice'} onClick={()=>setSetupCfg({format:'choice'})}>사지선다</Btn>
            <Btn on={setupCfg.format==='open'} onClick={()=>setSetupCfg({format:'open'})}>서술형(보기 없음)</Btn>
          </div>
          {/* 글자 크기 — 새 학습지의 처음 값 (만든 뒤에도 학습지마다 바꿀 수 있다) */}
          <div className="flex flex-col gap-1.5 mt-3">
            <GedSizeCtl label="문제 글자" value={setupCfg.qs} min={.8} max={1.6} onChange={x=>setSetupCfg({qs:x})}/>
            <GedSizeCtl label="개념 글자" value={setupCfg.cs} min={.7} max={1.6} steps={GED_CONCEPT_STEPS} onChange={x=>setSetupCfg({cs:x})}/>
            <GedSizeCtl label="숫자·수식" value={setupCfg.ms} min={.8} max={2} steps={GED_NUM_STEPS} onChange={x=>setSetupCfg({ms:x})}/>
          </div>
          {/* 내 개념 설명 — 고쳐 둔 설명이 새 학습지에 그대로 들어간다 */}
          <div className="mt-3 bg-emerald-50 rounded-2xl px-3 py-2">
            <button onClick={()=>setShowCLib(s=>!s)} className="w-full flex items-center gap-2 text-left" style={{minHeight:'36px'}}>
              <span className="text-xs font-black text-emerald-800 flex-1">📌 내가 고친 개념 설명 {cLibCount}개
                <span className="font-bold text-emerald-700"> — 새 학습지에 이 설명이 그대로 들어갑니다</span></span>
              <span className="text-[11px] font-bold text-emerald-700">{showCLib?'접기 ▲':'보기 ▼'}</span>
            </button>
            {showCLib&&<div className="mt-1 space-y-1">
              {cLibCount===0&&<div className="text-[11px] text-emerald-800 font-medium py-1">아직 없습니다. 학습지에서 [✏️ 글자 편집]을 켜고 개념 카드를 고치면 여기에 쌓입니다.</div>}
              {UNITS.filter(u=>cLibHas(u.id)).map(u=><div key={u.id} className="flex items-center gap-2 bg-white rounded-xl px-2 py-1">
                <span className="flex-1 text-xs font-bold text-gray-700 truncate">{u.tag}. {u.title}
                  <span className="text-[10px] text-gray-400"> · {gedFmtTime(cLib[u.id].updatedAt)} 고침</span></span>
                <button onClick={()=>{if(confirm(`'${u.title}' 개념 설명을 처음 설명으로 되돌릴까요?\n(이미 만든 학습지는 그대로 두고, 앞으로 만들 학습지부터 처음 설명이 들어갑니다)`))resetCLib(u.id);}}
                  className="text-[11px] px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold" style={{minHeight:'32px'}}>↩ 처음 설명으로</button>
              </div>)}
            </div>}
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

    <div ref={savedRef} className="text-[11px] text-gray-400 font-bold text-right -mb-2"></div>
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
