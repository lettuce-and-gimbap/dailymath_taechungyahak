// === js/student/mockExam.js ===
/* --------------------------------------------------------------------
   모의고사 탭
   중졸·고졸 검정고시 모의고사 응시
   -------------------------------------------------------------------- */

/* ── 문항 하나 (2026-10-06) : 좌표 탭처럼 큰 글씨 · 시험지 모양 수식(js/math/examTex.js) · 기출 모양 그림(js/ui/examFig.js)
   q.graph 종류를 examFigSVG 가 모르면 예전 GraphPreview 로 그린다.
   q.table(표) · q.box(자료 상자) · q.choicePic('ineq' = 보기를 수직선 그림으로) · q.bigTex(가운데 큰 식, 나눗셈 연습) 를 읽는다.
   선생님 화면(teacher/logQView.js)도 이 컴포넌트를 그대로 쓴다 — 학생이 본 화면과 같게. */
var MOCK_ORD=['①','②','③','④'];
var MOCK_CSS=`.exq .katex{font-size:1.13em}.exc .katex{font-size:1.1em}.exq{word-break:normal;overflow-wrap:anywhere;min-width:0}.exq svg,.exq img{max-width:100%;height:auto}.mock-fig-menu{max-width:100%;overflow-x:auto;overflow-y:hidden}.exq .mock-fig-menu svg{max-width:none}
.extbl{border-collapse:collapse;margin:0 auto;font-size:1rem}.extbl th,.extbl td{border:1.5px solid #9aa1ad;padding:4px 12px;text-align:center}
.extbl th{background:#eceef2;font-weight:700}.extbl tr.sum td{background:#eceef2;font-weight:700}`;
function assignMockQuestionNumbers(pool,examLevel,examMode){
  if(examMode==='random'&&pool.length===20){
    if(examLevel==='high'){
      // 최근 기출의 1~4 다항식, 5~9 방정식·부등식, 10~14 좌표·기하,
      // 15~18 집합·함수, 19~20 경우의 수 흐름을 반영한다.
      const slots={'다항식 계산':[1,2,3,4],'방정식과 부등식':[5,6,7,8,9],'도형과 기하':[10,11,12,13,14],'집합과 함수':[15,16,17,18],'확률과 통계':[19,20]};
      Object.entries(slots).forEach(([domain,numbers])=>shuffle(pool.filter(q=>q._mockDomain===domain)).forEach((q,i)=>{q.examNo=numbers[i];}));
    }else{
      // 중졸은 회차마다 영역 순서가 조금 달라, 같은 유형의 실제 출제 번호 후보를 우선 배정한다.
      const preferred={'수와 연산':[1,2,8,9,15],'문자와 식':[3,4,9,10,16,17],'함수':[5,11,17,18],'기하':[5,6,12,13,18,19],'확률과 통계':[7,14,20]};
      const used=new Set();
      const records=pool.map((q,i)=>({q,i,candidates:typeof getExamQuestionNumbers==='function'?getExamQuestionNumbers(q):[]}))
        .sort((a,b)=>a.candidates.length-b.candidates.length||a.i-b.i);
      records.forEach(({q,candidates})=>{
        let no=candidates.find(n=>n>=1&&n<=20&&!used.has(n));
        if(no==null){
          const choices=(preferred[q._mockDomain]||[]).filter(n=>!used.has(n));
          const anchor=candidates.length?candidates[0]:(choices[0]||1);
          no=(choices.length?choices:Array.from({length:20},(_,i)=>i+1).filter(n=>!used.has(n)))
            .sort((a,b)=>Math.abs(a-anchor)-Math.abs(b-anchor)||a-b)[0];
        }
        q.examNo=no;used.add(no);
      });
    }
  }else pool.forEach((q,i)=>{q.examNo=i+1;});
  pool.forEach(q=>delete q._mockDomain);
  return pool.sort((a,b)=>a.examNo-b.examNo);
}
function MockQBody({q,sel,isGraded,onPick,readOnly}){
  const g=q.graph;
  const sys=g&&g.type==='system_eq';
  const fig=sys?null:examFigSVG(q);
  const sysHtml=sys?examHtml(`$\\begin{cases}${g.eqs.map(e=>_exRunTex(e)).join('\\\\')}\\end{cases}$`):null;
  const pics=q.choicePic==='ineq'?exfIneqChoices(q.choices):null;
  /* 2단 배치는 숫자·분수·짧은 값만 (식은 KaTeX 로 넓어져 2단에서 줄이 꺾인다) */
  const short=q.choices.every(c=>{const t=String(c).replace(/\s/g,'');return t.length<=6&&!/[=<>≤≥]/.test(t)||/^[−-]?\d+\/\d+$/.test(t);});
  const cols=!pics&&short?'grid-cols-2':'grid-cols-1';      // 수직선 그림 보기는 한 줄에 하나 (숫자가 작아지지 않게)
  return(<div>
    <style>{MOCK_CSS}</style>
    <div className="exq text-lg font-bold text-gray-900 leading-loose mb-3" dangerouslySetInnerHTML={{__html:examQHtml(q)}}/>
    {q.bigTex&&<div className="exq text-center text-3xl my-4" dangerouslySetInnerHTML={{__html:examHtml(`$${q.bigTex}$`)}}/>}
    {sysHtml&&<div className="text-xl text-center mb-3" dangerouslySetInnerHTML={{__html:sysHtml}}/>}
    {q.boxUnit&&<div className="text-right text-sm text-gray-600 mb-1">{q.boxUnit}</div>}
    {q.box&&(/^[-−\d.\s,]+$/.test(q.box)
      /* 자료 상자 : 숫자 사이를 넓게 띄워 한 값씩 읽히게 (기출 20번) */
      ?<div className="border-2 border-gray-400 rounded px-3 py-3 mb-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xl" style={{fontFamily:EXF_SERIF}}>{q.box.split(/[\s,]+/).filter(Boolean).map((v,i)=><span key={i}>{v.replace('-','−')}</span>)}</div>
      :<div className="border-2 border-gray-400 rounded px-4 py-3 mb-3 text-center text-lg" dangerouslySetInnerHTML={{__html:examHtml(toExamTex(q.box))}}/>)}
    {q.table&&<div className="overflow-x-auto mb-3"><table className="extbl">
      <tbody>{q.table.head&&<tr>{q.table.head.map((h,i)=><th key={i} dangerouslySetInnerHTML={{__html:examHtml(toExamTex(h))}}/>)}</tr>}
      {q.table.rows.map((r,i)=><tr key={i} className={q.table.sumRow&&i===q.table.rows.length-1?'sum':''}>{r.map((c,j)=><td key={j} dangerouslySetInnerHTML={{__html:examHtml(toExamTex(c))}}/>)}</tr>)}</tbody></table></div>}
    {fig?<div className={`flex justify-center mb-3 ${g&&g.type==='menu'?'mock-fig-menu':''}`} dangerouslySetInnerHTML={{__html:fig}}/>
      :(g&&!sys&&<div className="flex justify-center mb-3"><GraphPreview q={q}/></div>)}
    {q.choices.length>0&&<div className={`grid gap-2 ${cols}`}>
      {q.choices.map((ch,j)=>{
        let cls='bg-white border-gray-200 text-gray-800';
        if(isGraded){if(sel===j)cls=j===q.answer?'bg-green-100 border-green-500 text-green-900':'bg-red-100 border-red-400 text-red-700';else if(j===q.answer)cls='bg-green-50 border-green-400 text-green-800';}
        else if(sel===j)cls='bg-indigo-100 border-indigo-500 text-indigo-900';
        return(<button key={j} disabled={readOnly} onClick={()=>onPick&&onPick(j)}
          className={`exc text-left text-lg font-bold px-3 py-3 rounded-xl border-2 transition-all active:scale-95 ${cls}`}>
          <span className="mr-1">{MOCK_ORD[j]}</span>
          {pics?<span className="block mt-1" dangerouslySetInnerHTML={{__html:pics[j]}}/>
            :<span dangerouslySetInnerHTML={{__html:examChoiceHtml(ch)}}/>}
        </button>);
      })}
    </div>}
  </div>);
}

function MockExamTab({userData,onUpdate,initialSetTopic,onInitialSetTopicStarted}){
  const[screen,setScreen]=useState('start');
  const[examLevel,setExamLevel]=useState(null);
  const[questions,setQuestions]=useState([]);
  const[sel,setSel]=useState({});
  const[isGraded,setIsGraded]=useState(false);
  const[saved,setSaved]=useState(false);
  const[feelingDone,setFeelingDone]=useState(false);
  const savingRef=React.useRef(false);   // 채점 순간 한 번만 저장
  const savedUpdRef=React.useRef(null);  // 소감을 고르면 이 기록에 덧붙인다
  const[startTime,setStartTime]=useState(null);
  const[mode,setMode]=useState('');
  const[focusTopic,setFocusTopic]=useState(null);
  const[focusIndex,setFocusIndex]=useState(0);
  const[focusFeedback,setFocusFeedback]=useState(false);
  // ── 행동 추적 (신규) ──
  const[firstClickTimes,setFirstClickTimes]=useState({}); // {qIdx: ms from startTime to first click}
  const[revisionCounts,setRevisionCounts]=useState({});   // {qIdx: number of answer changes after first}
  const[selectedDomains,setSelectedDomains]=useState([]);

  const HIGH_DOMAIN_GENS={'다항식 계산':genMockPoly,'방정식과 부등식':genMockEqInequal,'도형과 기하':genMockGeometry,'내분점':genMockInternalAny,'집합과 함수':genMockSetFunc,'확률과 통계':genMockProbStat};
  const DOMAIN_GENS=examLevel==='middle'?MID_DOMAIN_GENS:HIGH_DOMAIN_GENS;
  const DOMAINS=Object.keys(DOMAIN_GENS);
  const CORE_DOMAINS=DOMAINS.filter(d=>d!=='내분점');
  const questionCount=questions.length;

  useEffect(()=>{
    if(!initialSetTopic)return;
    setExamLevel('high');setSelectedDomains([initialSetTopic]);
    startExam('domain',[initialSetTopic],initialSetTopic);
    onInitialSetTopicStarted?.();
  },[initialSetTopic]);

  const computeStats=(logs)=>{
    const s={};DOMAINS.forEach(d=>s[d]={c:0,t:0});
    (logs||[]).forEach(log=>{
      if(!log.questions)return;
      log.questions.forEach(q=>{
        const type=(q.meta?.type||log.type||'').toLowerCase();
        const cat=(q.meta?.category||'').toLowerCase();
        const exact=DOMAINS.find(d=>type.includes(d.toLowerCase()));
        if(exact){s[exact].t++;if(q.isOk)s[exact].c++;return;}
        if(examLevel==='middle')return;
        if(type.includes('다항식')||cat==='poly'||type.includes('나눗셈')||type.includes('나머지')||type.includes('인수분해')||type.includes('항등식'))
          {s['다항식 계산'].t++;if(q.isOk)s['다항식 계산'].c++;}
        else if(type.includes('방정식')||type.includes('부등식')||type.includes('스토리')||type.includes('문장제')||cat==='eq'||cat==='ineq')
          {s['방정식과 부등식'].t++;if(q.isOk)s['방정식과 부등식'].c++;}
        else if(type.includes('기하')||type.includes('도형')||cat==='geometry'||type.includes('대칭')||type.includes('거리')||type.includes('직선')||type.includes('내분'))
          {s['도형과 기하'].t++;if(q.isOk)s['도형과 기하'].c++;}
        else if(type.includes('함수')||type.includes('집합')||type.includes('명제')||cat==='set'||cat==='func')
          {s['집합과 함수'].t++;if(q.isOk)s['집합과 함수'].c++;}
        else if(type.includes('확률')||type.includes('통계')||type.includes('순열')||type.includes('조합')||cat==='div'||cat==='stat'||type.includes('약수')||type.includes('배수'))
          {s['확률과 통계'].t++;if(q.isOk)s['확률과 통계'].c++;}
      });
    });
    return s;
  };

  const startExam=(examMode,domainList,focusTopic=null)=>{
    setMode(examMode);
    setFocusTopic(focusTopic);
    setFocusIndex(0);setFocusFeedback(false);
    const stats=computeStats(userData.logs||[]);
    const weakDomains=DOMAINS.filter(d=>stats[d].t===0||(stats[d].c/stats[d].t)<0.7);
    const safeGen=(gen)=>{try{const q=gen();return q||null;}catch(e){return null;}};
    const levelKey=examLevel==='middle'?'middle':'high';
    const targetCount=examMode==='random'?20:10;
    const focusedGen=focusTopic==='집합'?genMockSetOnly:focusTopic==='명제'?genMockPropositionOnly:null;
    const domainGenerators=focusedGen?{[focusTopic]:focusedGen}:DOMAIN_GENS;
    let pool=[];
    let targets=CORE_DOMAINS;
    if(examMode==='weak')targets=weakDomains.length>0?weakDomains:DOMAINS;
    else if(examMode==='domain')targets=domainList&&domainList.length>0?domainList:DOMAINS;
    const quotas=focusedGen?{[focusTopic]:targetCount}:mockExamDomainCounts(levelKey,targets,targetCount);
    const usedQ=new Set();
    const addQuestion=(dom,allowDuplicate)=>{
      const q=safeGen(domainGenerators[dom]);if(!q)return false;
      const key=`${q.topic}::${q.q||''}`;
      if(!allowDuplicate&&usedQ.has(key))return false;
      usedQ.add(key);pool.push({...q,_mockDomain:dom});return true;
    };
    Object.entries(quotas).forEach(([dom,count])=>{
      let added=0,attempts=0;
      while(added<count&&attempts<count*20){if(addQuestion(dom,false))added++;attempts++;}
      while(added<count&&attempts<count*22){if(addQuestion(dom,true))added++;attempts++;}
    });
    // 실패한 생성기만 같은 대상 영역에서 보충한다. 취약점 모드가 일반 영역으로 섞이지 않게 유지한다.
    const fallbackDomains=Object.keys(quotas);
    let safety=0;
    while(pool.length<targetCount&&fallbackDomains.length&&safety++<targetCount*40){addQuestion(pick(fallbackDomains),true);}
    pool=assignMockQuestionNumbers(shuffle(pool),examLevel,examMode);
    setQuestions(pool.slice(0,targetCount));setSel({});setIsGraded(false);setSaved(false);setFeelingDone(false);savingRef.current=false;savedUpdRef.current=null;setStartTime(Date.now());setScreen('exam');
    setFirstClickTimes({});setRevisionCounts({});
  };

  // 채점하는 순간 저장한다 (feeling:null) — 소감을 안 고르고 나가도 기록이 남게
  const saveResult=async(feeling)=>{
    if(savingRef.current||!userData)return;
    savingRef.current=true;
    const totalSec=Math.round((Date.now()-startTime)/1000);
    const correctCount=questions.filter((q,i)=>sel[i]===q.answer).length;
    const qs=questions.map((q,i)=>{
      const fms=firstClickTimes[i]??null;
      return{
        qTxt:q.q.length>70?q.q.slice(0,70)+'…':q.q,
        qFull:q.q,
        choices:q.choices,
        answerIdx:q.answer,
        uAns:sel[i]!==undefined?q.choices[sel[i]]:'미입력',
        cAns:q.choices[q.answer],
        isOk:sel[i]===q.answer,
        timeSec:fms!=null?Math.round(fms/1000):null,
        firstClickMs:fms,
        revisionCount:revisionCounts[i]??0,
        qTopicHash:getTopicHash(q),
        examNo:q.examNo||i+1,
        sol:Array.isArray(q.sol)&&q.sol.length?q.sol:null,
        graph:q.graph||null,   // 선생님 화면에서 문제 그림을 그대로 다시 그린다
        choicePic:q.choicePic||null,table:q.table||null,box:q.box||null,boxUnit:q.boxUnit||null,qTex:q.qTex||null,
        explanation:easyExplanation(q),
        meta:q.meta
      };
    });
    const levelLabel=examLevel==='middle'?'중졸':'고졸';
    const typeLabel=mode==='weak'?`📝 ${levelLabel} 약점 집중 모의고사`:mode==='domain'?`📝 ${levelLabel} 영역집중 [${selectedDomains.join('+')}]`:`📝 ${levelLabel} 실전 모의고사`;
    const log={date:todayStr(),time:timeStr(),type:typeLabel,score:`${correctCount} / ${questions.length}`,questions:qs,totalSec,feeling};
    const newLogs=[log,...(userData.logs||[])];
    const newTodayLessons=(userData.todayLessons||0)+1;
    const activeDates=[...new Set([...(userData.activeDates||[]),todayStr()])];
    const upd={...userData,logs:newLogs,todayLessons:newTodayLessons,activeDates,lastDate:todayStr()};
    try{
      await db.collection('users').doc(upd.name).set(upd,{merge:true});
      if(onUpdate)onUpdate(upd);
      savedUpdRef.current=upd;
      setSaved(true);
      updateQStats(qs); // fire-and-forget: qStats 집계 (실패해도 무시)
    }catch(e){savingRef.current=false;alert('저장 실패. 인터넷 연결을 확인해주세요.');}
  };
  const chooseFeeling=async(feeling)=>{
    setFeelingDone(true);
    const base=savedUpdRef.current;if(!base)return;
    const logs=[...(base.logs||[])];if(logs[0])logs[0]={...logs[0],feeling};
    const upd={...base,logs};
    try{await db.collection('users').doc(upd.name).set(upd,{merge:true});if(onUpdate)onUpdate(upd);}catch(e){}
  };

  const ORD=['①','②','③','④'];
  const correctCount=questions.filter((q,i)=>sel[i]===q.answer).length;
  const answered=Object.keys(sel).length;
  const sequential=!!focusTopic;
  const advanceFocusedQuestion=()=>{
    if(!focusFeedback){setFocusFeedback(true);return;}
    if(focusIndex+1>=questions.length){setIsGraded(true);saveResult(null);return;}
    setFocusIndex(i=>i+1);setFocusFeedback(false);
  };

  if(screen==='start'){
    if(!examLevel)return(<div className="p-4 pb-36 space-y-4 fade-in">
      <div><h2 className="text-2xl font-black text-gray-800">📝 검정고시 모의고사</h2><p className="text-sm font-bold text-gray-500 mt-1">응시할 학력을 선택해 주세요.</p></div>
      <button onClick={()=>setExamLevel('middle')} className="w-full p-4 bg-white rounded-3xl text-left shadow-sm border-2 border-slate-200 flex items-center gap-3 active:scale-[0.98] transition-transform">
        <span className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-3xl shrink-0">📘</span>
        <span className="flex-1"><span className="block text-lg font-black text-gray-800">중졸 모의고사</span><span className="block text-sm mt-1 font-bold text-gray-500">2021~2026년 기출 반복 영역 반영 · 최근 유형 변형</span></span>
        <span className="text-2xl text-gray-300">›</span>
      </button>
      <button onClick={()=>setExamLevel('high')} className="w-full p-4 bg-white rounded-3xl text-left shadow-sm border-2 border-slate-200 flex items-center gap-3 active:scale-[0.98] transition-transform">
        <span className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl shrink-0">📚</span>
        <span className="flex-1"><span className="block text-lg font-black text-gray-800">고졸 모의고사</span><span className="block text-sm mt-1 font-bold text-gray-500">2021~2026년 기출 반복 영역 반영 · 최근 유형 변형</span></span>
        <span className="text-2xl text-gray-300">›</span>
      </button>
    </div>);
    const stats=computeStats(userData.logs||[]);
    const weakDomains=DOMAINS.filter(d=>stats[d].t===0||(stats[d].c/stats[d].t)<0.7);
    const GRADE_COLOR={0:'bg-gray-200',1:'bg-orange-400',2:'bg-lime-400',3:'bg-green-500',4:'bg-emerald-500'};
    const getGrade=(st)=>{if(st.t===0)return 0;const r=st.c/st.t;return r<0.4?1:r<0.7?2:r<0.9?3:4;};
    const ICONS=['🌱','🌱','🌿','🌳','🍎'];
    return(<div className="p-4 pb-36 space-y-4 fade-in min-w-0">
      <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-200">
        <button onClick={()=>setExamLevel(null)} className="text-sm font-bold text-indigo-600 px-3 py-2 bg-indigo-50 rounded-xl mb-3">← 학력 다시 선택</button>
        <h2 className="text-xl font-black text-gray-800 mb-1">📝 {examLevel==='middle'?'중졸':'고졸'} 기출 혼합 모의고사</h2>
        <p className="text-sm font-bold text-gray-500">2021~2026년 반복 출제 영역 반영 · 생활 맥락과 그림형 문항 변형</p>
      </div>
      {weakDomains.length>0&&(<div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="text-sm font-black text-orange-700 mb-2">🎯 현재 취약 영역 (정답률 70% 미만)</div>
        <div className="flex flex-wrap gap-2">{weakDomains.map(d=><span key={d} className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200">{d}</span>)}</div>
      </div>)}
      <div className="space-y-3">
        <button onClick={()=>startExam('weak')} className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-transform">
          🎯 약점 집중 공략 10문제
          <div className="text-xs font-normal opacity-80 mt-1">취약 영역 집중 + 기출 변형 자동 출제</div>
        </button>
        <button onClick={()=>startExam('random')} className="w-full p-5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-transform">
          🎲 실전 모의고사 20문제
          <div className="text-xs font-normal opacity-80 mt-1">기출의 문항 번호별 유형 흐름을 반영한 1~20번 구성</div>
        </button>
      </div>
      <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-slate-200">
        <div className="text-lg font-black text-gray-800 mb-1">📌 영역 선택 집중 풀기</div>
        <div className="text-sm font-bold text-gray-500 mb-3">원하는 영역을 골라 그 영역의 문제를 풀어요.</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {DOMAINS.map(d=>(
            <button key={d} onClick={()=>setSelectedDomains(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d])}
              aria-pressed={selectedDomains.includes(d)}
              className={`min-h-12 px-3 py-3 rounded-2xl text-sm font-black text-left border-2 transition-all active:scale-[0.98] ${selectedDomains.includes(d)?'bg-indigo-50 text-indigo-800 border-indigo-400':'bg-white text-gray-600 border-slate-200'}`}>
              <span className="mr-2">{selectedDomains.includes(d)?'☑':'□'}</span>{d}
            </button>
          ))}
        </div>
        <button onClick={()=>{if(selectedDomains.length>0)startExam('domain',selectedDomains);}}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 ${selectedDomains.length>0?'bg-indigo-600 text-white shadow-md':'bg-gray-100 text-gray-400 cursor-default'}`}>
          {selectedDomains.length>0?`📌 선택 영역 10문제 시작 →`:'영역을 먼저 선택하세요'}
          {selectedDomains.length>0&&<div className="text-xs font-normal opacity-80 mt-1">{selectedDomains.join(' · ')}</div>}
        </button>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="text-sm font-black text-gray-600 mb-3">🌳 나의 수학 나무 숲 현황</div>
        <div className="space-y-2.5">
          {DOMAINS.map(d=>{
            const st=stats[d];const g=getGrade(st);const rate=st.t===0?0:Math.round((st.c/st.t)*100);
            return(<div key={d} className="flex items-center gap-2">
              <span className="text-base w-5">{ICONS[g]}</span>
              <span className="text-xs font-bold text-gray-700 w-28 flex-shrink-0">{d}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className={`${GRADE_COLOR[g]} h-2.5 rounded-full transition-all`} style={{width:`${st.t===0?4:Math.max(4,rate)}%`}}/>
              </div>
              <span className="text-xs font-bold text-gray-500 w-14 text-right">{st.t===0?'미학습':`${rate}%`}</span>
            </div>);
          })}
        </div>
      </div>
    </div>);
  }

  if(screen==='exam'){
    return(<div className="p-4 pb-36 space-y-4 fade-in">
      <div className="sticky top-0 bg-white border-b py-3 flex items-center gap-3 z-10 -mx-4 px-4 shadow-sm">
        <button onClick={()=>setScreen('start')} className="text-gray-500 text-sm font-bold">← 나가기</button>
        <span className="flex-1 text-sm font-black text-gray-700">{examLevel==='middle'?'중졸':'고졸'} · {mode==='weak'?'🎯 약점 집중':mode==='domain'?`📌 ${selectedDomains.join('+')}` :'🎲 실전 모의고사'} ({sequential?focusIndex+1:answered}/{questionCount})</span>
        {isGraded&&<span className="text-sm font-black text-indigo-600">{correctCount}/{questionCount}점</span>}
      </div>
      {(sequential?[questions[focusIndex]].filter(Boolean):questions).map((q)=>{
        const i=questions.indexOf(q);
        const isSel=sel[i]!==undefined,isCorrect=sel[i]===q.answer;
        return(<div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 min-w-0 overflow-visible">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{q.examNo||i+1}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{q.topic}</span>
            {(()=>{var src=(q._src===undefined?(q._src=getExamSource(q)):q._src);   // 문항마다 한 번만 고른다 (다시 그릴 때마다 회차가 바뀌지 않게)
return src?<span className="text-[10px] text-gray-400 font-normal ml-1">📌 {src}</span>:null;})()}
            {isGraded&&isSel&&<span className="ml-auto text-base">{isCorrect?'✅':'❌'}</span>}
          </div>
          <MockQBody q={q} sel={sel[i]} isGraded={isGraded||(sequential&&focusFeedback)} readOnly={sequential&&focusFeedback} onPick={j=>{
            if(isGraded||(sequential&&focusFeedback))return;
            const now=Date.now()-startTime;
            if(firstClickTimes[i]===undefined) setFirstClickTimes(p=>({...p,[i]:now}));
            else if(sel[i]!==undefined&&sel[i]!==j) setRevisionCounts(p=>({...p,[i]:(p[i]||0)+1}));
            setSel(s=>({...s,[i]:j}));
          }}/>
          {(isGraded||(sequential&&focusFeedback))&&!isCorrect&&(<div className="mt-3 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 font-bold">정답: {ORD[q.answer]} <span dangerouslySetInnerHTML={{__html:examChoiceHtml(q.choices[q.answer])}}/></div>)}
          {(isGraded||(sequential&&focusFeedback))&&<ExplanationBox q={Array.isArray(q.sol)?{...q,sol:q.sol.map(toExamTex)}:q}/>}   {/* 풀이도 시험지 모양 수식으로 */}
        </div>);
      })}
      {sequential&&!isGraded&&focusIndex<questionCount&&<button onClick={advanceFocusedQuestion} disabled={sel[focusIndex]===undefined} className={`w-full py-5 rounded-3xl font-black text-xl shadow-lg transition-all ${sel[focusIndex]===undefined?'bg-gray-200 text-gray-400':'bg-indigo-600 text-white active:scale-95'}`}>
        {!focusFeedback?'정답 확인 ✓':focusIndex+1>=questionCount?'결과 보기 📝':'다음 문제 →'}
      </button>}
      {!sequential&&answered===questionCount&&questionCount>0&&!isGraded&&(<div className="fade-in">
        <button onClick={()=>{setIsGraded(true);saveResult(null);}} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-lg active:scale-95 transition-transform">채점하기 📝</button>
      </div>)}
      {isGraded&&!feelingDone&&(<div className="bg-white p-6 rounded-3xl shadow-sm text-center border-2 border-indigo-100 fade-in">
        <div className="text-2xl font-black text-indigo-700 mb-1">🎯 {correctCount}/{questionCount} 정답!</div>
        <div className="text-sm text-gray-500 mb-4">이번 모의고사는 어떠셨나요? 기록은 저장됐어요.</div>
        <div className="flex gap-2 justify-center">
          <button onClick={()=>chooseFeeling('easy')} className="flex-1 py-4 bg-green-100 text-green-700 rounded-2xl font-black active:scale-95 transition-transform">쉬웠어요 😊</button>
          <button onClick={()=>chooseFeeling('normal')} className="flex-1 py-4 bg-blue-100 text-blue-700 rounded-2xl font-black active:scale-95 transition-transform">적당해요 😐</button>
          <button onClick={()=>chooseFeeling('hard')} className="flex-1 py-4 bg-red-100 text-red-700 rounded-2xl font-black active:scale-95 transition-transform">어려워요 😥</button>
        </div>
      </div>)}
      {isGraded&&feelingDone&&(<div className="text-center fade-in space-y-3">
        <div className="inline-block bg-green-100 text-green-700 font-bold px-6 py-4 rounded-2xl">✅ 학습 기록에 저장되었습니다!</div>
        <button onClick={()=>setScreen('start')} className="block w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold">다시 도전하기 →</button>
      </div>)}
    </div>);
  }
  return null;
}
