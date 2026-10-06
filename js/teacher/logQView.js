// === js/teacher/logQView.js ===
/* --------------------------------------------------------------------
   기록 속 한 문항을 '학생이 본 문제 화면 그대로' 보여 준다 (해설은 빼고) — 2026-10-05
   쓰는 곳 : teacher/studentDetail.js (세션 기록 → 문항보기) · teacher/wrongNotePanel.js (오답 목록)

   기록 종류에 따라 다시 그리는 방법이 다르다.
   - 좌표 10문제 : 기록에는 글만 있으므로 생성기를 씨앗으로 다시 돌린다 (coordReplay — student/coordDaily.js).
                  식은 KaTeX, 그림은 학생이 문제를 풀 때 본 그림(정답 점은 숨긴 그림), 보기 그림도 그대로.
   - 기하학(기하: …) : 식 qTex · 그림 graph · 보기 순서 choices 가 있으면 그대로. 예전 기록(qTex 없음)은
                  기하 생성기(GEO_GENS)를 씨앗으로 돌려 같은 문제를 찾아 식과 보기를 얻는다.
   - 모의고사 · 문제풀기 검정고시 연습 : 학생 화면과 같은 MockQBody(student/mockExam.js)로 그린다.
   - 문제풀기 검정고시 · 모의고사 : 문제 글 + 그림(graph) + 보기(choices). 그림이 없는 예전 기록은
                  글에서 그림 조건을 읽어 내거나(tryReconstructGraph), 생성기를 씨앗으로 돌려 찾는다.
   - 그 밖(나눗셈·약수 등) : 문제 글 그대로.
   보기는 학생 화면의 채점 뒤 모양처럼 정답은 초록, 학생이 고른 오답은 빨강으로 칠한다.
   -------------------------------------------------------------------- */
var LQ_ORD=['①','②','③','④','⑤'];

/* 보기 한 칸의 색 — 정답 초록 · 고른 오답 빨강 · 나머지 흐리게 */
function lqChoiceCls(i,ansIdx,pickIdx){
  if(i===ansIdx)return'bg-emerald-500 border-emerald-500 text-white';
  if(i===pickIdx)return'bg-red-100 border-red-300 text-red-600';
  return'bg-white border-gray-200 text-gray-500';
}
function lqPickIdx(choices,uAns){const u=String(uAns==null?'':uAns);return(choices||[]).findIndex(c=>String(c)===u);}
function LqNote({children}){return<div className="text-[11px] font-bold text-gray-400 mt-2">{children}</div>;}
function LqLoading(){return<div className="text-xs font-bold text-gray-400 py-3 text-center">문제 화면을 다시 그리는 중…</div>;}

/* 씨앗 찾기 결과를 기다렸다가 그리는 공용 훅 */
function useReplay(fn,deps){
  const[st,setSt]=useState({busy:true,r:null});
  useEffect(()=>{let live=true;setSt({busy:true,r:null});
    Promise.resolve().then(fn).then(r=>{if(live)setSt({busy:false,r});},()=>{if(live)setSt({busy:false,r:null});});
    return()=>{live=false;};},deps);
  return st;
}

/* ── 좌표 10문제 ── */
function CoordLogQ({rec}){
  const st=useReplay(()=>coordReplay(rec),[rec]);
  const ref=useRef(null);
  useEffect(()=>{if(ref.current&&window.GS)GS.renderTex(ref.current);});
  if(st.busy)return<LqLoading/>;
  if(!st.r)return<LqPlain rec={rec} note="이 기록은 예전 방식으로 저장되어 그림을 다시 그리지 못했습니다."/>;
  const q=st.r.q;
  const L=COORD_LEVELS.find(l=>l.k===q.lv)||{};
  const pick=lqPickIdx(q.choices,rec.uAns);
  const one=q.cols===1||q.lv==='rat'||q.lv==='irr';
  return(<div ref={ref} className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
    <style>{`.lqv svg.plane{max-width:100%;height:auto}`}</style>
    <div className="flex items-center gap-2">
      <span className="text-xs font-black px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700">{L.badge||'좌표'}</span>
      <span className="text-xs font-bold text-gray-400">{q.topic}</span>
    </div>
    {q.qHtml
      ?<div className="text-base font-black text-gray-800 leading-loose break-keep" dangerouslySetInnerHTML={{__html:q.qHtml}}/>
      :<div className="text-base font-black text-gray-800 leading-relaxed break-keep">{q.q}</div>}
    {q.svg&&<div className="lqv flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{__html:q.svg}}/>}
    <div className={`grid gap-2 ${one?'grid-cols-1':'grid-cols-2'}`}>
      {q.choices.map((c,i)=>(
        <div key={i} className={`py-3 px-3 rounded-2xl border-2 font-black text-base text-center ${lqChoiceCls(i,q.ans,pick)}`}>
          <span className="opacity-60 mr-1">{LQ_ORD[i]}</span> {q.choiceHtml?<span className="block mt-1" dangerouslySetInnerHTML={{__html:q.choiceHtml[i]}}/>:c}
        </div>))}
    </div>
    {!st.r.exact&&<LqNote>예전 기록이라 보기 순서는 학생이 본 것과 다를 수 있습니다.</LqNote>}
  </div>);
}

/* ── 기하학 탭 ── */
var _geoReplayCache=new Map();
function geoReplay(rec){
  const txt=rec.qTxt||'';const key=txt+'|'+rec.cAns+'|'+rec.uAns;
  if(_geoReplayCache.has(key))return _geoReplayCache.get(key);
  const pr=replaySearch(GEO_GENS,q=>q.q===txt&&String(q.choices[q.answer])===String(rec.cAns)
    &&(rec.uAns==null||rec.uAns==='미입력'||q.choices.map(String).includes(String(rec.uAns))),{limit:20000});
  _geoReplayCache.set(key,pr);return pr;
}
function GeoLogQ({rec}){
  const has=!!(rec.qTex&&Array.isArray(rec.choices));
  const st=useReplay(()=>has?null:geoReplay(rec),[rec]);
  if(!has&&st.busy)return<LqLoading/>;
  const found=st.r&&st.r.q;
  const qTex=rec.qTex||(found&&found.qTex)||null;
  const choices=has?rec.choices:found?found.choices:null;
  const ansIdx=has?rec.answerIdx:found?found.answer:-1;
  const graph=rec.graph||(found&&found.graph)||tryReconstructGraph(rec);
  const pick=choices?lqPickIdx(choices,rec.uAns):-1;
  return(<div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
    <p className="text-base text-gray-800 leading-loose font-medium break-keep">{qTex?<TexHtml tex={qTex}/>:<QText v={rec.qTxt}/>}</p>
    {graph&&<div className="flex justify-center"><GraphPreview q={{graph}}/></div>}
    {choices
      ?<div className="grid grid-cols-1 gap-2">
        {choices.map((c,j)=><div key={j} className={`text-left text-base px-4 py-2.5 rounded-xl border-2 ${lqChoiceCls(j,ansIdx,pick)}`}>{LQ_ORD[j]} <TexHtml tex={geoTex(c)}/></div>)}
      </div>
      :<LqAnswers rec={rec} tex/>}
    {!has&&found&&<LqNote>예전 기록이라 보기 순서는 학생이 본 것과 다를 수 있습니다.</LqNote>}
  </div>);
}

/* ── 문제풀기 검정고시 · 모의고사 (보기가 기록에 있는 문항) ── */
var _examReplayCache=new Map();
function examGraphReplay(rec){
  const txt=rec.qFull||'';
  if(_examReplayCache.has(txt))return _examReplayCache.get(txt);
  const M=typeof MID_DOMAIN_GENS!=='undefined'?MID_DOMAIN_GENS:{};
  const gens=[genMockEqInequal,genMockGeometry,genMockSetFunc,M['문자와 식'],M['함수'],M['기하']].filter(Boolean);
  const pr=replaySearch(gens,q=>q.q===txt,{limit:30000}).then(h=>h&&h.q.graph||null);
  _examReplayCache.set(txt,pr);return pr;
}
/* 그림이 들어갈 만한 문제인지 — 그림 없는 다항식·확률 문제까지 씨앗을 찾느라 시간을 쓰지 않게 */
var LQ_GRAPHY=/좌표|그래프|그림|직선|원의|원 |함수|평행이동|대칭이동|연립|넓이|삼각형|평행선|대응|두 점/;
function ExamLogQ({rec,mock}){
  const parsed=rec.graph||tryReconstructGraph(rec);
  const need=!parsed&&LQ_GRAPHY.test(rec.qFull||'');
  const st=useReplay(()=>need?examGraphReplay(rec):null,[rec]);
  const graph=parsed||st.r;
  const choices=rec.choices||[];
  const ansIdx=rec.answerIdx!=null?rec.answerIdx:choices.map(String).indexOf(String(rec.cAns));
  const pick=lqPickIdx(choices,rec.uAns);
  const sys=graph&&graph.type==='system_eq';
  /* 모의고사 : 학생 화면과 같은 MockQBody (시험지 모양 수식 · 그림 · 표) — 채점 뒤 모양(정답 초록 · 고른 오답 빨강) */
  if(mock)return(<div className="bg-white rounded-2xl p-4 border border-gray-200">
    <MockQBody q={{q:rec.qFull,qTex:rec.qTex,choices,answer:ansIdx,graph,choicePic:rec.choicePic,table:rec.table,box:rec.box,boxUnit:rec.boxUnit}}
      sel={pick} isGraded={true} readOnly={true}/>
    {need&&st.busy&&<LqLoading/>}
  </div>);
  return(<div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
    {(rec.topic||rec.meta?.type)&&<div className="inline-block bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">📚 {rec.topic||rec.meta?.type}</div>}
    {sys&&<div className="flex justify-center"><GraphPreview q={{graph}}/></div>}
    <div className="text-base font-bold text-gray-800 leading-relaxed break-keep">{mock?<QText v={rec.qFull}/>:rec.qFull}</div>
    {graph&&!sys&&<div className="flex justify-center"><GraphPreview q={{graph}}/></div>}
    {need&&st.busy&&<LqLoading/>}
    <div className="flex flex-col gap-2">
      {choices.map((c,i)=><div key={i} className={`p-3 rounded-2xl border-2 text-base font-bold text-left leading-relaxed ${lqChoiceCls(i,ansIdx,pick)}`}>
        <span>{LQ_ORD[i]}</span> <MathText v={c}/></div>)}
    </div>
  </div>);
}

/* ── 그 밖 : 문제 글 그대로 ── */
function LqAnswers({rec,tex}){
  const show=v=>tex?<TexHtml tex={geoTex(v)}/>:String(v);
  return<div className="text-sm font-bold text-gray-600">학생 답 <span className={rec.isOk?'text-emerald-600':'text-red-600'}>{rec.uAns!=null?show(rec.uAns):'-'}</span>
    {!rec.isOk&&<> · 정답 <span className="text-emerald-600">{show(rec.cAns)}</span></>}</div>;
}
function LqPlain({rec,note}){
  const graph=tryReconstructGraph(rec);
  return(<div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
    <div className="text-base font-bold text-gray-800 leading-relaxed break-keep"><QText v={restoreQText(rec)||''}/></div>
    {graph&&<div className="flex justify-center"><GraphPreview q={{graph}}/></div>}
    <LqAnswers rec={rec}/>
    {note&&<LqNote>{note}</LqNote>}
  </div>);
}

/* 진입점 — logType : 이 문항이 들어 있는 기록의 type (오답 목록에서는 q._logType) */
function LogQView({q,logType}){
  const t=String(logType||q._logType||'');
  if(t.indexOf('좌표 10문제')===0||q.cSeed!=null)return<CoordLogQ rec={q}/>;
  if(t.indexOf('기하:')===0)return<GeoLogQ rec={q}/>;
  if(q.qFull&&Array.isArray(q.choices)&&q.choices.length)return<ExamLogQ rec={q} mock={t.indexOf('📝')===0||t.indexOf('모의고사')>=0||t.indexOf('검정고시 연습')>=0}/>;
  return<LqPlain rec={q}/>;
}
