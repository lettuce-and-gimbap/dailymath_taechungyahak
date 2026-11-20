// === js/student/practice.js ===
/* --------------------------------------------------------------------
   문제풀기 탭
   메뉴 · 문항 만들기 · 풀이 과정 · 숫자 키패드 · 세션 진행
   -------------------------------------------------------------------- */

function buildPracticeRanges(userData){
  const saved=userData.practiceRanges||{},rMin=userData.rangeMin||10,rMax=userData.rangeMax||99,dMin=userData.divRangeMin||10,dMax=userData.divRangeMax||99;
  return{0:saved[0]||{min:rMin,max:rMax},1:saved[1]||{min:rMin,max:rMax},2:saved[2]||{min:rMin,max:rMax},3:saved[3]||{min:dMin,max:dMax}};
}
function normalizePracticeVer(value){return Number(value)===4?3:[0,1,2,3].includes(Number(value))?Number(value):0;}

function DailyPracticeTab({userData,onUpdate,onSessionActive,autoResume,onAutoResumed,unified=false}){
  const[screen,setScreen]=useState('menu');
  const[unifiedLevel,setUnifiedLevel]=useState(null);
  const[unifiedSection,setUnifiedSection]=useState(null);
  const[session,setSession]=useState(null);
  const[ver,setVer]=useState(()=>normalizePracticeVer(userData.ver||0));
  const[verTopic,setVerTopic]=useState(null);
  const[practiceRanges,setPracticeRanges]=useState(()=>buildPracticeRanges(userData));
  const[goal,setGoal]=useState(userData.goal||3);

  const savedRaw=(()=>{try{return JSON.parse(localStorage.getItem('yakHakSavedSession_'+userData.name));}catch{return null;}})();
  const[savedData,setSavedData]=useState(savedRaw);

  const saveSettings=()=>{
  const normalized=Object.fromEntries(Object.entries(practiceRanges).map(([k,r])=>{const min=r.min===''?1:Math.max(1,Number(r.min)||1),max=r.max===''?min+1:Math.max(min+1,Number(r.max)||min+1);return[k,{min,max}];}));
  const upd={...userData,ver,practiceRanges:normalized,
    rangeMin:normalized[0].min,rangeMax:normalized[0].max,
    divRangeMin:normalized[3].min,divRangeMax:normalized[3].max,goal};
  saveUser(upd);onUpdate(upd);
};
  const startSession=()=>{
  const active=practiceRanges[ver]||{min:10,max:99};
  const min=active.min===''||Number(active.min)<1?1:Math.floor(Number(active.min));
  const max=active.max===''||Number(active.max)<=min?min+1:Math.floor(Number(active.max));
  setPracticeRanges(prev=>({...prev,[ver]:{min,max}}));
  const divCountIdxs=[];while(divCountIdxs.length<2){const r=randInt(1,10);if(!divCountIdxs.includes(r))divCountIdxs.push(r)}
  setSession({qNum:1,correct:0,wrong:0,startTime:Date.now(),qStartTime:Date.now(),questions:[],divCountIdxs,currentQ:null,selectedMC:null,fb:null,phase:'question',verTopic:verTopic||null,rangeMin:min,rangeMax:max,divMin:min,divMax:max});
  setScreen('session');
  onSessionActive?.(true);
};

  const resumeSession=()=>{
  if(!savedData)return;
  const savedVer=normalizePracticeVer(savedData.ver),r=buildPracticeRanges(userData)[savedVer];
  const rangeMin=savedData.rangeMin??savedData.divMin??r.min,rangeMax=savedData.rangeMax??savedData.divMax??r.max;
  setVer(savedVer);
  setSession({qNum:savedData.qNum||1,correct:savedData.correctCount||0,wrong:savedData.wrongCount||0,startTime:Date.now(),qStartTime:Date.now(),questions:[],divCountIdxs:savedData.divCountIdxs||[3,7],currentQ:null,selectedMC:null,fb:null,phase:'question',verTopic:null,rangeMin,rangeMax,divMin:rangeMin,divMax:rangeMax});
  setScreen('session');
  onSessionActive?.(true);
};

  /* 하던 공부 알림에서 [이어서]를 눌러 들어오면 메뉴를 거치지 않고 바로 이어 푼다 */
  useEffect(()=>{if(autoResume){if(savedData)resumeSession();onAutoResumed?.();}},[autoResume]);

  const handleBack=()=>{
    setScreen('menu');
    onSessionActive?.(false);
    setSavedData(()=>{try{return JSON.parse(localStorage.getItem('yakHakSavedSession_'+userData.name));}catch{return null;}});
  };

  if(unified&&screen==='wrong-note')return <StudentWrongNotePractice userData={userData} onBack={()=>setScreen('menu')}/>;
  if(unified&&screen==='menu')return<UnifiedPracticeMenu userData={userData} section={unifiedSection} setSection={setUnifiedSection}
    savedData={savedData} onResume={resumeSession} onArithmetic={v=>{setVer(v);setVerTopic(null);setScreen('arithmetic');}}
    onCoordinate={k=>{setUnifiedLevel(k);setScreen('coordinate');}} onWrongNote={()=>setScreen('wrong-note')} onSetTopic={topic=>{if(!canAccessRestrictedPractice(userData.name))return;setVerTopic(topic);setScreen('focused-set');}}/>;
  if(unified&&screen==='coordinate')return<CoordDailyTab userData={userData} onUpdate={onUpdate} initialLevel={unifiedLevel} onExit={()=>setScreen('menu')}/>;
  if(unified&&screen==='focused-set'&&canAccessRestrictedPractice(userData.name))return<FocusedSetPractice topic={verTopic} userData={userData} onUpdate={onUpdate} onBack={()=>setScreen('menu')}/>;
  if(unified&&screen==='arithmetic')return<PracticeMenu ver={ver} setVer={setVer} rangeSettings={practiceRanges} setRangeSettings={setPracticeRanges} goal={goal} setGoal={setGoal} todayLessons={userData.todayLessons} onSave={saveSettings} onStart={startSession} savedData={null} onResume={resumeSession} selectedOnly onBack={()=>setScreen('menu')}/>;
  if(screen==='menu')return<PracticeMenu ver={ver} setVer={v=>{setVer(normalizePracticeVer(v));setVerTopic(null);}} rangeSettings={practiceRanges} setRangeSettings={setPracticeRanges} goal={goal} setGoal={setGoal} todayLessons={userData.todayLessons} onSave={saveSettings} onStart={startSession} savedData={savedData} onResume={resumeSession}/>;
  if(screen==='session')return<PracticeSession session={session} setSession={setSession} ver={ver} rangeMin={session.rangeMin} rangeMax={session.rangeMax} divMin={session.divMin} divMax={session.divMax} userData={userData} onUpdate={onUpdate} onDone={(result)=>{setScreen('done');onSessionActive?.(false);}} onBack={handleBack}/>;
  if(screen==='done')return<PracticeDone userData={userData} onAgain={startSession} onHome={()=>{setScreen('menu');onSessionActive?.(false);}}/>;
  return null;
}

/* 기존 두 문제 메뉴를 한곳에 모은다. */
function UnifiedPracticeMenu({userData,section,setSection,savedData,onResume,onArithmetic,onCoordinate,onSetTopic,onWrongNote}){
 const items=[
  {v:0,lbl:'기본 나눗셈',desc:'설정한 범위에서 몫을 구합니다'},
  {v:1,lbl:'심화 나눗셈 (나머지)',desc:'몫과 나머지를 구합니다'},
  {v:2,lbl:'혼합 나눗셈',desc:'나머지 있는 문제와 없는 문제를 함께 풉니다'},
  {v:3,lbl:'약수 구하기',desc:'약수를 모두 찾거나 개수를 구합니다'},
 ];
 const groups=[{id:'arithmetic',title:'사칙연산',icon:'✏️',desc:'나눗셈 · 약수'},
  {id:'coordinate',title:'좌표',icon:'📍',desc:'좌표 읽기부터 함수와 방정식까지'},
  {id:'count',title:'경우의 수',icon:'🎲',desc:'순열과 조합'},
  {id:'sets',title:'집합과 명제',icon:'🧩',desc:'집합과 명제를 나누어 연습합니다'}];
 const card=(key,badge,title,desc,onClick,locked=false)=>
  <button key={key} onClick={onClick} className="w-full text-left bg-white rounded-3xl p-4 shadow-sm border-2 border-slate-200 flex items-center gap-3 active:scale-[0.98] transition-transform">
   <span className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs text-center font-black shrink-0 px-1">{badge}</span>
   <span className="flex-1 min-w-0"><span className="block text-base font-black text-gray-800">{title}{locked?' 🔒':''}</span><span className="block text-sm font-bold text-gray-500 mt-0.5">{desc}</span></span><span className="text-2xl text-gray-300">›</span>
  </button>;
 return <div className="p-4 space-y-4 pb-36"><div><div className="text-2xl font-black text-gray-800">✏️ 오늘의 문제풀이</div><div className="text-sm font-bold text-gray-500 mt-1">풀고 싶은 유형을 골라 10문제에 도전해 보세요.</div></div>
  {savedData&&<button onClick={onResume} className="w-full text-left bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 font-black text-amber-800">📚 하던 공부 이어서 풀기 ({savedData.correctCount||0}/10) →</button>}
  <button onClick={onWrongNote} className="w-full text-left bg-rose-50 border-2 border-rose-200 rounded-3xl p-4 font-black text-rose-800">📒 오답노트만 풀기 <span className="block mt-1 text-xs">최근 기간을 정해 틀린 문제를 다시 풀어요</span></button>
  {groups.map(g=><section key={g.id} className="bg-white rounded-3xl shadow-md overflow-hidden"><button onClick={()=>setSection(section===g.id?null:g.id)} aria-expanded={section===g.id} className="w-full p-5 text-left flex items-center gap-3"><span className="text-3xl">{g.icon}</span><span className="flex-1"><span className="block text-lg font-black text-gray-800">{g.title}</span><span className="block text-sm font-bold text-gray-500">{g.desc}</span></span><span className="font-black text-indigo-500">{section===g.id?'−':'+'}</span></button>
   {section===g.id&&<div className="px-4 pb-4 space-y-2">{g.id==='arithmetic'?items.map((x,i)=>card(x.v,`유형 ${i+1}`,x.lbl,x.desc,()=>onArithmetic(x.v))):g.id==='sets'?(canAccessRestrictedPractice(userData.name)?['집합','명제'].map(topic=><button key={topic} onClick={()=>onSetTopic&&onSetTopic(topic)} className="w-full text-left bg-white rounded-3xl p-4 shadow-sm border-2 border-indigo-200 flex items-center gap-3 active:scale-[0.98] transition-transform"><span className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl shrink-0">{topic==='집합'?'∪':'⇒'}</span><span className="flex-1"><span className="block text-base font-black text-gray-800">{topic} 문제풀이</span><span className="block text-sm font-bold text-gray-500 mt-0.5">10문제 연습</span></span><span className="text-2xl text-gray-300">›</span></button>):<div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800 font-bold text-sm" role="status">🔒 앗, 선생님이 아직 작업 중이에요! 곧 공개할 예정이에요.</div>):COORD_LEVELS.filter(l=>g.id==='count'?l.k==='count3':l.k!=='count3').map(l=>card(l.k,l.badge,l.lbl,l.desc,()=>onCoordinate(l.k),coordLevelLocked(l,userData.name)))}</div>}
  </section>)}
 </div>;
}

/* 집합·명제 연습은 모의고사 화면과 상태를 공유하지 않고 문제풀이 탭 안에서 진행한다. */
function FocusedSetPractice({topic,userData,onUpdate,onBack}){
  const TOTAL=10, ORD=['①','②','③','④'];
  const seenQuestionsRef=React.useRef(new Set()),lastTopicRef=React.useRef(null);
  const makeQuestion=()=>{
    let candidate=null;
    for(let i=0;i<24;i++){
      candidate=topic==='집합'?genPracticeSetQuestion():genPracticePropositionQuestion();
      if(!seenQuestionsRef.current.has(candidate.q)&&candidate.topic!==lastTopicRef.current)break;
    }
    if(candidate){seenQuestionsRef.current.add(candidate.q);lastTopicRef.current=candidate.topic;}
    return candidate;
  };
  const[q,setQ]=useState(makeQuestion);
  const[index,setIndex]=useState(0);
  const[selected,setSelected]=useState(null);
  const[revealed,setRevealed]=useState(false);
  const[records,setRecords]=useState([]);
  const[phase,setPhase]=useState('question');
  const[startAt]=useState(Date.now());
  const[qStartAt,setQStartAt]=useState(Date.now());
  const[saving,setSaving]=useState(false);
  const savedRef=React.useRef(null);
  const finishingRef=React.useRef(false);
  const correct=records.filter(r=>r.isOk).length;
  const answer=Number(q.answer);
  const finish=async(finalRecords)=>{
    if(finishingRef.current)return;
    finishingRef.current=true;setSaving(true);
    const correctCount=finalRecords.filter(r=>r.isOk).length,wrongCount=finalRecords.length-correctCount;
    const today=todayStr(),type=`${topic} 문제풀이`;
    const log={studentName:userData.name,date:today,time:timeStr(),type,score:`${correctCount} / ${finalRecords.length}`,questions:finalRecords,totalSec:Math.round((Date.now()-startAt)/1000),feeling:null};
    const upd={...userData,totalLessons:(userData.totalLessons||0)+1,todayLessons:(userData.todayLessons||0)+1,
      todayCorrect:(userData.todayCorrect||0)+correctCount,todayWrong:(userData.todayWrong||0)+wrongCount,
      lastDate:today,activeDates:[...new Set([...(userData.activeDates||[]),today])],logs:[log,...(userData.logs||[]).slice(0,49)]};
    try{await saveUser(upd);const id=await saveLog(log);savedRef.current={id,upd};onUpdate(upd);}
    catch(e){finishingRef.current=false;alert('기록 저장에 실패했어요. 인터넷 연결을 확인해주세요.');}
    setSaving(false);setPhase('reflection');
  };
  const reveal=()=>{
    if(selected===null||revealed)return;
    setRevealed(true);
  };
  const next=()=>{
    if(!revealed)return;
    const finalRecords=[...records,{qTxt:q.q,qFull:q.q,topic:q.topic,choices:q.choices,answerIdx:answer,
      uAns:q.choices[selected],cAns:q.choices[answer],isOk:selected===answer,
      timeSec:Math.round((Date.now()-qStartAt)/1000),explanation:Array.isArray(q.sol)?q.sol.join('\n'):easyExplanation(q),meta:q.meta}];
    if(index+1>=TOTAL){setRecords(finalRecords);setPhase('saving');finish(finalRecords);return;}
    setRecords(finalRecords);setQ(makeQuestion());setIndex(index+1);setSelected(null);setRevealed(false);setQStartAt(Date.now());
  };
  if(phase==='saving')return <div className="p-4 pb-36"><div className="bg-white rounded-3xl p-6 shadow-sm text-center font-black text-gray-600">학습 기록을 저장하고 있어요…</div></div>;
  if(phase==='reflection')return <FeelingPicker title={`${topic} 연습 완료 · ${correct}/${TOTAL} 정답`} onPick={async feeling=>{setPhase('result');if(savedRef.current){const upd=await patchLogFeeling(savedRef.current.id,savedRef.current.upd,feeling);onUpdate(upd);}}}/>;
  if(phase==='result')return <div className="p-4 pb-36 space-y-4"><div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-indigo-100 text-center"><div className="text-4xl mb-2">🎯</div><h2 className="text-2xl font-black text-gray-800">{topic} 연습 완료</h2><p className="text-lg font-bold text-indigo-600 mt-2">{correct}/{TOTAL} 정답</p><p className="text-sm text-gray-500 mt-1">학습 기록이 저장되었습니다.</p></div><button onClick={onBack} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black">문제풀이 메뉴로</button></div>;
  return <div className="p-4 pb-36 space-y-4">
    <div className="flex items-center gap-3"><button onClick={onBack} className="w-11 h-11 rounded-2xl bg-white shadow-sm text-gray-500 font-black">←</button><div className="flex-1"><div className="text-lg font-black text-gray-800">{topic} 문제풀이</div><div className="text-sm font-bold text-gray-500">문제 {index+1}/{TOTAL}</div></div><div className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl">{correct+(revealed&&selected===answer?1:0)}/{TOTAL}</div></div>
    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all" style={{width:`${((index+(revealed?1:0))/TOTAL)*100}%`}}/></div>
    <div className="focused-ged-practice bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4"><span className="w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-black flex items-center justify-center">{index+1}</span><span className="text-sm font-black text-indigo-700">{topic} · {q.topic}</span></div>
      {q.practiceMarkup?<GEDPracticeMarkup className="focused-ged-question text-lg font-bold text-gray-900 leading-loose mb-4" html={q.q}/>:<div className="text-lg font-bold text-gray-900 leading-loose mb-4" dangerouslySetInnerHTML={{__html:examQHtml(q)}}/>}
      {q.figure&&<GEDPracticeMarkup className="focused-ged-figure mb-4" html={q.figure}/>}
      <div className="grid gap-2">
        {q.choices.map((choice,i)=>{const correctChoice=i===answer,isSelected=selected===i;let style='bg-white border-slate-200 text-gray-800';if(revealed&&correctChoice)style='bg-green-50 border-green-500 text-green-800';else if(revealed&&isSelected)style='bg-red-50 border-red-400 text-red-700';else if(isSelected)style='bg-indigo-50 border-indigo-400 text-indigo-800';return <button key={i} disabled={revealed} onClick={()=>setSelected(i)} className={`focused-ged-choice w-full text-left text-base font-bold px-4 py-3 rounded-2xl border-2 transition-all ${style}`}><span className="mr-2">{ORD[i]}</span>{q.practiceMarkup?<GEDPracticeMarkup className="focused-ged-choice-content" html={choice}/>:<span dangerouslySetInnerHTML={{__html:examChoiceHtml(choice)}}/>}{revealed&&correctChoice&&<span className="float-right">✅</span>}</button>;})}
      </div>
      {revealed&&(q.practiceMarkup?<GEDPracticeSolutions solutions={q.sol}/>:<ExplanationBox q={q}/>)}
      {revealed&&<QuestionDifficultyBookmark userData={userData} source={`${topic} · ${q.topic}`} question={{qFull:q.q,choices:q.choices,answerIdx:answer,explanation:Array.isArray(q.sol)?q.sol.join('\n'):'',meta:{type:q.topic}}}/>}
    </div>
    {!revealed?<button disabled={selected===null} onClick={reveal} className={`w-full py-4 rounded-2xl font-black text-lg ${selected===null?'bg-gray-200 text-gray-400':'bg-indigo-600 text-white active:scale-[0.98]'}`}>정답 확인 ✓</button>:<button onClick={next} className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-lg active:scale-[0.98]">{index+1===TOTAL?'결과 보기':'다음 문제 →'}</button>}
  </div>;
}

/* 기출 학습지의 data-tex 문법을 학생 풀이 화면에서도 KaTeX로 렌더링한다. */
function GEDPracticeMarkup({html,className=''}){
  const ref=React.useRef(null);
  useEffect(()=>{const root=ref.current;if(!root)return;root.querySelectorAll('.tx[data-tex]').forEach(el=>{const tex=el.getAttribute('data-tex');el.style.whiteSpace='nowrap';el.style.display='inline-block';el.style.maxWidth='100%';el.style.overflowX='auto';el.style.verticalAlign='middle';try{if(window.katex)window.katex.render(tex,el,{throwOnError:false,strict:false});else el.textContent=tex;}catch(_){el.textContent=tex;}});},[html]);
  return <div ref={ref} className={className} style={{minWidth:0,maxWidth:'100%',overflowWrap:'anywhere',wordBreak:'normal'}} dangerouslySetInnerHTML={{__html:String(html||'')}}/>;
}
function GEDPracticeSolutions({solutions=[]}){
  return <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 font-semibold leading-relaxed"><div className="font-black text-amber-700 mb-1.5">📖 풀이 과정</div><ol className="space-y-1">{solutions.map((s,i)=><li key={i} className="flex gap-1.5"><span className="shrink-0 font-black text-amber-600">{i+1===solutions.length?'➡':`${i+1}.`}</span><GEDPracticeMarkup className="min-w-0 flex-1" html={s}/></li>)}</ol></div>;
}

function PracticeMenu({ver,setVer,verTopic,setVerTopic,rangeSettings,setRangeSettings,goal,setGoal,todayLessons,onSave,onStart,savedData,onResume,selectedOnly=false,onBack}){
  const VER_OPTS=[{v:0,lbl:'기본 나눗셈',desc:'설정된 범위 내의 나눗셈 연산'},{v:1,lbl:'심화 나눗셈 (나머지)',desc:'몫과 나머지를 모두 구해야 해요'},{v:2,lbl:'혼합 나눗셈',desc:'나머지 있는 것과 없는 것이 섞여요'},{v:3,lbl:'약수 구하기',desc:'개수 구하기(2문제) 및 모두 구하기'}];
  const range=rangeSettings[ver]||{min:10,max:99};
  const setBound=(field,value)=>setRangeSettings(prev=>({...prev,[ver]:{...(prev[ver]||{min:10,max:99}),[field]:value}}));
  const MID_DOMAINS=['전체(혼합)','수와 연산','문자와 식','함수','기하','확률과 통계'];
  const HIGH_DOMAINS=['전체(혼합)','다항식 계산','방정식과 부등식','도형과 기하','내분점','집합과 함수','확률과 통계'];
  const domainList=ver===5?MID_DOMAINS:HIGH_DOMAINS;
  return(<div className="p-4 space-y-4 pb-36">
    {savedData&&(<button onClick={onResume} className="w-full text-left bg-amber-50 border-2 border-amber-400 rounded-3xl p-4 shadow-sm active:scale-[0.98] transition-transform flex items-center gap-3">
      <div className="text-3xl">📚</div>
      <div className="flex-1">
        <div className="font-black text-amber-800 text-base">하던 공부가 있어요!</div>
        <div className="text-sm text-amber-700 font-bold mt-0.5">이어서 풀어볼까요? (정답 {savedData.correctCount||0}/10) →</div>
      </div>
    </button>)}
    <div className="bg-indigo-600 rounded-3xl p-5 text-white mb-2">
      <div className="text-lg font-black">오늘 {todayLessons}번 완료! 더 풀어볼까요?</div>
      <div className="text-sm opacity-80 mt-1">10문제를 다 맞히면 레슨 1개 완료!</div>
    </div>
    {selectedOnly&&<button onClick={onBack} className="text-sm font-bold text-indigo-600 px-3 py-2 bg-indigo-50 rounded-xl">← 문제 유형 다시 고르기</button>}
    {selectedOnly&&<div className="text-xl font-black text-gray-800">{VER_OPTS.find(o=>o.v===ver)?.lbl}</div>}
    {/* Ver select */}
    {!selectedOnly&&<div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">📝 문제 유형</div>
      <div className="space-y-2">
        {VER_OPTS.map(({v,lbl,desc})=><button key={v} onClick={()=>setVer(v)} className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${ver===v?'border-indigo-400 bg-indigo-50':'border-gray-200 bg-gray-50'}`}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${ver===v?'border-indigo-500 bg-indigo-500':'border-gray-300'}`}>
            {ver===v&&<div className="w-2 h-2 bg-white rounded-full"/>}
          </div>
          <div><div className="text-base font-bold text-gray-800">{lbl}</div><div className="text-xs text-gray-500 mt-0.5">{desc}</div></div>
        </button>)}
      </div>
    </div>}
  {/* Settings */}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">⚙️ 범위 설정</div>
      <div className="space-y-3">
        {ver<3&&<div><div className="text-sm font-bold text-gray-600 mb-2">나눗셈 범위</div>
          <div className="flex items-center gap-3">
            <input type="number" min="1" step="1" value={range.min} placeholder="1"
              onChange={e=>{const raw=e.target.value;if(raw===''){setBound('min','');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setBound('min',v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
            <span className="text-xl font-bold text-gray-400">~</span>
            <input type="number" min="1" step="1" value={range.max} placeholder="2"
              onChange={e=>{const raw=e.target.value;if(raw===''){setBound('max','');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setBound('max',v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
          </div>
        </div>}
        {ver===3&&<div><div className="text-sm font-bold text-gray-600 mb-2">약수 구하기 숫자 범위</div>
          <div className="flex items-center gap-3">
            <input type="number" min="1" step="1" value={range.min} placeholder="1"
              onChange={e=>{const raw=e.target.value;if(raw===''){setBound('min','');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setBound('min',v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
            <span className="text-xl font-bold text-gray-400">~</span>
            <input type="number" min="1" step="1" value={range.max} placeholder="2"
              onChange={e=>{const raw=e.target.value;if(raw===''){setBound('max','');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setBound('max',v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
          </div>
        </div>}
        <div><div className="text-sm font-bold text-gray-600 mb-2">하루 목표 레슨 수</div>
          <div className="flex items-center gap-4 bg-indigo-50 rounded-2xl p-3">
            <button onClick={()=>setGoal(v=>Math.max(1,v-1))} className="w-10 h-10 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center">−</button>
            <span className="text-2xl font-black text-gray-800 flex-1 text-center">{goal}</span>
            <button onClick={()=>setGoal(v=>Math.min(10,v+1))} className="w-10 h-10 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center">+</button>
          </div>
        </div>
      </div>
      <button onClick={onSave} className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">설정 저장</button>
    </div>
    {ver>=5&&<div className="bg-indigo-50 rounded-3xl p-5 shadow-sm border-2 border-indigo-100">
      <div className="text-base font-black text-indigo-700 mb-3">🗂️ {ver===5?'중졸':'고졸'} 검정고시 — 영역 선택</div>
      <div className="grid grid-cols-2 gap-2">
        {domainList.map(d=>{
          const selected=(verTopic||'전체(혼합)')===d;
          return(<button key={d} onClick={()=>setVerTopic(d==='전체(혼합)'?null:d)}
            className={`py-3 px-2 rounded-2xl border-2 font-bold text-sm transition-all text-center leading-tight ${selected?'border-indigo-500 bg-indigo-100 text-indigo-800':'border-gray-200 bg-white text-gray-600'}`}>
            {d}
          </button>);
        })}
      </div>
      <div className="mt-3 text-xs text-indigo-400 font-bold">선택한 영역만 집중적으로 연습합니다. 10문제 완료 시 성취도에 반영됩니다.</div>
    </div>}
    <button onClick={onStart} className="w-full py-5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-3xl text-2xl font-black shadow-xl active:scale-95 transition-transform">
      문제 풀기 시작 ✏️
    </button>
  </div>);
}

function makeQ(ver,qNum,divCountIdxs,rangeMin,rangeMax,divMin,divMax,seenSet=null,domain=null){
  let qType=ver;if(qType===2)qType=Math.random()<0.5?0:1;
  const isMC=true;
  if(qType===3){
    const{target,divisors}=genDivisors(divMin,divMax,false);
    const divQType=pick(['notDiv','allDiv','count']);
    return{category:'div',target,divisors,divQType,isMC:true,
      qLogTxt:divQType==='count'?`${target}의 약수 개수`:divQType==='notDiv'?`${target}의 약수 아닌 것 고르기`:`${target}의 모든 약수`};
  }
  // ── ver:5 중졸 / ver:6 고졸 검정고시 영역 연습 ──
  if(qType===5||qType===6){
    const midLabels=Object.keys(MID_DOMAIN_GENS);
    const highLabels=['다항식 계산','방정식과 부등식','도형과 기하','집합과 함수','확률과 통계'];
    const highGens=[genMockPoly,genMockEqInequal,genMockGeometry,genMockSetFunc,genMockProbStat];
    let areaLabel,gen;
    if(domain){
      // 영역 선택 모드
      areaLabel=domain;
      if(qType===5){
        gen=()=>genMiddleMock(domain);
      } else {
        const dIdx=highLabels.indexOf(domain);
        // '내분점'은 혼합 순환(highLabels)에는 넣지 않고, 골랐을 때만 따로 낸다
        gen=domain==='내분점'?genMockInternalAny:dIdx>=0?highGens[dIdx]:highGens[Math.floor(Math.random()*highGens.length)];
      }
    } else {
      const areaLabels=qType===5?midLabels:highLabels;
      const areaIdx=(qNum-1)%areaLabels.length;
      areaLabel=areaLabels[areaIdx];
      gen=qType===5?()=>genMiddleMock(areaLabel):highGens[areaIdx];
    }
    let q=null;let tries=0;
    // seenSet이 있으면 문제 텍스트 중복 방지
    while(tries<12){
      try{q=gen();}catch(e){q=null;}
      if(!q){tries++;continue;}
      const key=q.q?.slice(0,30)||q.topic||'';
      if(!seenSet||!seenSet.has(key)){if(seenSet)seenSet.add(key);break;}
      tries++;q=null;
    }
    if(!q){try{q=qType===5?genMiddleMock():genMockProbStat();}catch(e){}}
    if(!q)q={topic:'확률',q:'3명 중 2명을 순서대로 뽑는 경우의 수는?',choices:['3','6','9','12'],answer:1,meta:{category:'stat',type:'확률과 통계',diff:'기초'}};
    return{...q,category:'exam5',isMC:true,
      qLogTxt:q.q||q.topic||areaLabel};
  }
  if(qType===0){const q=genDivBasic(rangeMin,rangeMax);return{...q,category:'math',isMC}}
  return{...genDivRemainder(rangeMin,rangeMax),category:'math',isMC};
}

/* ===== 문제 카드에 넘길 화면용 문항 (2026-10-06) =====
   나눗셈·약수 문항은 글자가 따로 없어 여기서 시험지 모양 문장과 가운데 큰 식(bigTex)을 만든다.
   보기는 섞어 둔 mcOpts 순서 그대로 (기록·채점은 mcOpts 를 쓰므로 순서가 같아야 한다). */
function practiceViewQ(q,mcOpts){
  const choices=q.isMC?mcOpts.map(o=>o.text):[];
  const answer=q.isMC?mcOpts.findIndex(o=>o.isC):-1;
  if(q.category==='exam5')return{...q,choices,answer};
  if(q.category==='math')return{q:q.hasR?'다음 나눗셈의 몫과 나머지를 구하시오.':'다음 나눗셈의 몫을 구하시오.',bigTex:`${q.a}\\div ${q.b}`,choices,answer};
  const t=q.target;
  const text=q.divQType==='count'||q.isCount?`${t}의 약수는 모두 몇 개인가?`
    :q.divQType==='notDiv'?`다음 중 ${t}의 약수가 아닌 것은?`:`${t}의 약수를 모두 쓴 것은?`;
  return{q:text,choices,answer};
}

/* ===== 풀이과정 박스 ===== */
function SolutionBox({q}){
  if(!q)return null;
  const Row=({step,children})=>(
    <div className="flex items-start gap-2 text-sm font-bold text-gray-700">
      <span className="shrink-0 bg-amber-100 text-amber-700 rounded-lg px-2 py-0.5 text-xs font-black">{step}</span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
  // 생성기가 직접 만든 단계별 해설(q.sol)이 있으면 우선 사용 — 정답과 동일한 계산값에서 나오므로 항상 일치
  if(Array.isArray(q.sol)&&q.sol.length){
    return(
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
        <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정 (천천히 따라오세요)</div>
        <div className="space-y-2">
          {q.sol.map((s,i)=><Row key={i} step={i+1===q.sol.length?'정답':`${i+1}단계`}><span dangerouslySetInnerHTML={{__html:autoMathHtml(s)}}/></Row>)}
        </div>
      </div>
    );
  }
  if(q.category==='math'){
    if(q.hasR){
      const prod=q.b*q.ansC;
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-2">
            <Row step="1단계">{q.b} × {q.ansC} = {prod}</Row>
            <Row step="2단계">{q.a} - {prod} = {q.ansR} → 나머지</Row>
            <Row step="정답"><span className="text-green-700">{q.a} ÷ {q.b} = {q.ansC} ··· {q.ansR}</span></Row>
          </div>
        </div>
      );
    }else{
      const prod=q.b*q.ansC;
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-2">
            <Row step="계산">{q.a} ÷ {q.b} = {q.ansC}</Row>
            <Row step="검산">{q.b} × {q.ansC} = {prod}</Row>
          </div>
        </div>
      );
    }
  }
  if(q.category==='div'){
    const divs=q.divisors||[];
    const tgt=q.target;
    /* 짝 목록 계산 (공통 로직) */
    const pairRows=[];
    const half=Math.ceil(divs.length/2);
    for(let i=0;i<half;i++){
      const a=divs[i],b=divs[divs.length-1-i];
      const isSelf=(a===b);
      pairRows.push({a,b,isSelf});
    }
    if(q.divQType==='count'){
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500 font-bold mb-1">곱해서 {tgt}이(가) 되는 짝을 찾아요</div>
            {pairRows.map(({a,b,isSelf},i)=>(
              <div key={i} className="text-sm font-bold text-indigo-600">
                {isSelf?`${a} × ${a} = ${tgt}  (${a}는 자기 자신과 짝)`:`${a} × ${b} = ${tgt}`}
              </div>
            ))}
            <div className="mt-2 text-xs text-gray-500 font-bold">약수 목록: {divs.join(', ')}</div>
            <div className="mt-1 text-sm font-bold text-green-700">약수의 개수 = <span className="text-green-800">{divs.length}개</span></div>
          </div>
        </div>
      );
    }else if(q.divQType==='notDiv'){
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500 font-bold mb-1">곱해서 {tgt}이(가) 되는 짝을 찾아요</div>
            {pairRows.map(({a,b,isSelf},i)=>(
              <div key={i} className="text-sm font-bold text-indigo-600">
                {isSelf?`${a} × ${a} = ${tgt}  (${a}는 자기 자신과 짝)`:`${a} × ${b} = ${tgt}`}
              </div>
            ))}
            <div className="mt-2 text-xs text-gray-500 font-bold">약수 목록: {divs.join(', ')}</div>
            <div className="mt-1 text-sm font-bold text-red-600">위 목록에 없는 수 → 약수가 아닌 것</div>
          </div>
        </div>
      );
    }else{
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500 font-bold mb-1">곱해서 {tgt}이(가) 되는 짝을 찾아요</div>
            {pairRows.map(({a,b,isSelf},i)=>(
              <div key={i} className="text-sm font-bold text-indigo-600">
                {isSelf?`${a} × ${a} = ${tgt}  (${a}는 자기 자신과 짝)`:`${a} × ${b} = ${tgt}`}
              </div>
            ))}
            <div className="mt-2 text-sm font-bold text-green-700">약수: {divs.join(', ')}</div>
          </div>
        </div>
      );
    }
  }
  return <ExplanationBox q={q}/>;
}

/* ===== 커스텀 숫자 키패드 ===== */
function NumPadInput({q,ans,setAns,activeField,setActiveField,onConfirmRequest,handleFirstAction}){
  const press=k=>{
    handleFirstAction();
    setAns(v=>{
      const fk=q.hasR?(activeField==='R'?'ansR':'ansQ'):'ansQ';
      const cur=v[fk]||'';
      if(k==='C')return{...v,[fk]:''};
      if(k==='←')return{...v,[fk]:cur.slice(0,-1)};
      if(cur.length>=4)return v;
      return{...v,[fk]:cur+k};
    });
  };
  const canSubmit=q.hasR?(ans.ansQ!==''&&ans.ansR!==''):(ans.ansQ!=='');
  const PAD=['7','8','9','4','5','6','1','2','3','C','0','←'];
  const padCls=k=>k==='C'?'bg-red-50 border-red-200 text-red-600 text-lg':k==='←'?'bg-orange-50 border-orange-200 text-orange-600 text-2xl':'bg-white border-gray-200 text-gray-900 text-2xl';
  const NUM={fontFamily:EXF_SERIF};      // 숫자는 문제 카드(시험지 모양)와 같은 글꼴
  return(
    <div className="space-y-3">
      {q.hasR?(
        <div className="flex gap-3">
          <button onClick={()=>setActiveField('Q')} className={`flex-1 py-3 rounded-2xl border-2 text-center transition-all ${activeField==='Q'?'border-indigo-500 bg-indigo-50':'border-gray-200 bg-white'}`}>
            <div className="text-xs text-gray-400 font-bold mb-1">몫</div>
            <div style={NUM} className={`text-3xl font-bold ${activeField==='Q'?'text-indigo-700':'text-gray-500'}`}>{ans.ansQ||<span className="opacity-25">_</span>}</div>
          </button>
          <button onClick={()=>setActiveField('R')} className={`flex-1 py-3 rounded-2xl border-2 text-center transition-all ${activeField==='R'?'border-indigo-500 bg-indigo-50':'border-gray-200 bg-white'}`}>
            <div className="text-xs text-gray-400 font-bold mb-1">나머지</div>
            <div style={NUM} className={`text-3xl font-bold ${activeField==='R'?'text-indigo-700':'text-gray-500'}`}>{ans.ansR||<span className="opacity-25">_</span>}</div>
          </button>
        </div>
      ):(
        <div className="w-full py-3 rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-center">
          <div className="text-xs text-gray-400 font-bold mb-1">몫</div>
          <div style={NUM} className="text-4xl font-bold text-indigo-700">{ans.ansQ||<span className="opacity-25">_</span>}</div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {PAD.map(k=>(
          <button key={k} onClick={()=>press(k)}
            style={/\d/.test(k)?NUM:undefined}
            className={`py-4 rounded-2xl border-2 font-bold shadow-sm active:scale-95 transition-all ${padCls(k)}`}>
            {k}
          </button>
        ))}
      </div>
      <button onClick={()=>{if(canSubmit)onConfirmRequest();}}
        disabled={!canSubmit}
        className={`w-full py-5 rounded-3xl text-xl font-black shadow-lg transition-all ${canSubmit?'bg-gradient-to-r from-indigo-500 to-blue-600 text-white active:scale-95':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        확인 ✓
      </button>
    </div>
  );
}

function PracticeSession({session,setSession,ver,rangeMin,rangeMax,divMin,divMax,userData,onUpdate,onBack}){
  const seenQKeysRef = React.useRef(new Set());
  const verTopic=session.verTopic||null;
  const[q,setQ]=useState(()=>{dealReset();return makeQ(ver,session.qNum,session.divCountIdxs,rangeMin,rangeMax,divMin,divMax,seenQKeysRef.current,verTopic);});   // 새 묶음 : 경우의 수 소재·종류 겹침 기록 비우기
  const[ans,setAns]=useState({ansQ:'',ansR:'',ansDiv:'',ansCount:''});
  const[fb,setFb]=useState(null);
  const[selMC,setSelMC]=useState(null);
  const[mcOpts,setMcOpts]=useState([]);
  const[phase,setPhase]=useState('question');
  const[correctCount,setCorrectCount]=useState(session.correct||0);
  const[wrongCount,setWrongCount]=useState(session.wrong||0);
  const[questions,setQuestions]=useState([]);
  const[startTime]=useState(Date.now());
  const[qStartTime,setQStartTime]=useState(Date.now());
  const[firstActionTime,setFirstActionTime]=useState(null);
  const[showConfirm,setShowConfirm]=useState(false);
  const[showExitModal,setShowExitModal]=useState(false);
  const[activeField,setActiveField]=useState('Q');   // 숫자패드 활성 필드 ('Q'|'R')
  const phaseRef=React.useRef(phase);
  const saveDataRef=React.useRef({});

  const handleFirstAction=()=>{
    if(firstActionTime===null)setFirstActionTime(Date.now());
  };

  useEffect(()=>{phaseRef.current=phase;},[phase]);
  useEffect(()=>{
    const d={ver,rangeMin,rangeMax,divMin,divMax,qNum:questions.length+1,divCountIdxs:session.divCountIdxs,correctCount,wrongCount};
    window.__yakHakActiveSession={...d,savedAt:Date.now()};
    saveDataRef.current=d;
  },[correctCount,wrongCount,questions.length]);
  useEffect(()=>()=>{window.__yakHakActiveSession=null;},[]);

  // 홈 버튼 / 비정상 종료 시 자동 저장
  useEffect(()=>{
    const autoSave=()=>{
      if(phaseRef.current==='done'||phaseRef.current==='reflection')return;
      const d=saveDataRef.current;
      if(!d||(!d.correctCount&&!d.wrongCount))return;
      localStorage.setItem('yakHakSavedSession_'+userData.name,JSON.stringify({...d,savedAt:Date.now()}));
    };
    const onVis=()=>{if(document.hidden)autoSave();};
    document.addEventListener('visibilitychange',onVis);
    window.addEventListener('pagehide',autoSave);
    window.addEventListener('beforeunload',autoSave);
    return()=>{
      document.removeEventListener('visibilitychange',onVis);
      window.removeEventListener('pagehide',autoSave);
      window.removeEventListener('beforeunload',autoSave);
    };
  },[]);

  // 모바일 뒤로가기 버튼 가로채기
  useEffect(()=>{
    history.pushState({practiceSession:true},'');
    const onPop=()=>{
      if(phaseRef.current==='done'||phaseRef.current==='reflection'){onBack();return;}
      history.pushState({practiceSession:true},'');
      setShowExitModal(true);
    };
    window.addEventListener('popstate',onPop);
    return()=>window.removeEventListener('popstate',onPop);
  },[]);

  const saveSession=()=>{
    const data={ver,rangeMin,rangeMax,divMin,divMax,
      qNum:questions.length+1,divCountIdxs:session.divCountIdxs,
      correctCount,wrongCount,savedAt:Date.now()};
    localStorage.setItem('yakHakSavedSession_'+userData.name,JSON.stringify(data));
  };

  const handleBackAttempt=()=>{
    if(phase==='done'||phase==='reflection'){onBack();return;}
    setShowExitModal(true);
  };

  useEffect(()=>{buildMCOpts()},[q]);
  const buildMCOpts=()=>{
    if(!q.isMC){setMcOpts([]);return}
    // exam5: 이미 choices 배열이 있는 모의고사 포맷
    if(q.category==='exam5'&&q.choices){
      var opts5=q.choices.map((c,i)=>({text:c,isC:i===q.answer}));
      setMcOpts(opts5);return;
    }
    let opts=[];
    if(q.category==='math'){
      const ansStr=q.hasR?`몫: ${q.ansC}, 나머지: ${q.ansR}`:`${q.ansC}`;
      opts.push({text:ansStr,isC:true});
      if(q.hasR){for(let wQ=1;opts.length<4&&wQ<=q.ansC+8;wQ++)for(let wR=0;opts.length<4&&wR<q.b;wR++){const wStr=`몫: ${wQ}, 나머지: ${wR}`;if(!opts.some(o=>o.text===wStr))opts.push({text:wStr,isC:false});}}
      else{for(let d=1;opts.length<4;d++){const wQ=q.ansC+d;if(!opts.some(o=>o.text===String(wQ)))opts.push({text:String(wQ),isC:false});}}
    }else{
      if(q.divQType==='count'||q.isCount){
        // 약수 개수 — ±1·±2 제외, ±3 이상 차이나는 오답만
        const correct=q.divisors.length;
        opts.push({text:`${correct}개`,isC:true});
        const usedNums=new Set([correct]);
        const pool=[];
        for(let d=3;d<=15;d++){if(correct-d>=1)pool.push(correct-d);pool.push(correct+d);}
        shuffle(pool).forEach(c=>{if(opts.length<4&&!usedNums.has(c)){usedNums.add(c);opts.push({text:`${c}개`,isC:false})}});
        let ext=16;while(opts.length<4){const c=correct+ext;if(!usedNums.has(c)){usedNums.add(c);opts.push({text:`${c}개`,isC:false})}ext++}
      }else if(q.divQType==='notDiv'){
        // 약수 아닌 것 — target+1 같은 뻔한 패턴 배제, 범위 안 비약수 선택
        const divSet=new Set(q.divisors);
        const cands=[];
        for(let n=2;n<q.target;n++){if(!divSet.has(n))cands.push(n);}
        // target/2 이하의 비약수 = 약수처럼 보여서 더 그럴듯한 오답
        const plausible=cands.filter(n=>n<=Math.floor(q.target/2)+1);
        const wrongNum=(plausible.length>0?shuffle(plausible):shuffle(cands))[0]||(q.target+2);
        const usedTexts=new Set([String(wrongNum)]);
        opts.push({text:String(wrongNum),isC:true});
        shuffle([...q.divisors]).forEach(d=>{const s=String(d);if(opts.length<4&&!usedTexts.has(s)){usedTexts.add(s);opts.push({text:s,isC:false})}});
      }else{
        // 약수 모두 — Set으로 중복 완전 차단, 뻔한 비약수(target±1) 삽입 금지
        const correctStr=q.divisors.join(', ');
        const usedFakes=new Set([correctStr]);
        opts.push({text:correctStr,isC:true});
        const divSet=new Set(q.divisors);
        // Fake 1: 중간 원소 제거
        if(q.divisors.length>=3){const f1=[...q.divisors];f1.splice(Math.floor(q.divisors.length/2),1);const s=f1.join(', ');if(!usedFakes.has(s)){usedFakes.add(s);opts.push({text:s,isC:false})}}
        // Fake 2: target/2 근처 비약수 삽입 (target±1 제외)
        let ins=Math.floor(q.target/2);
        while(divSet.has(ins)||Math.abs(ins-q.target)<=1||ins<=1)ins++;
        const f2=[...q.divisors,ins].sort((a,b)=>a-b);const s2=f2.join(', ');
        if(!usedFakes.has(s2)){usedFakes.add(s2);opts.push({text:s2,isC:false})}
        // Fake 3: 마지막 원소 제거
        if(q.divisors.length>=2){const f3=q.divisors.slice(0,-1);const s3=f3.join(', ');if(!usedFakes.has(s3)){usedFakes.add(s3);opts.push({text:s3,isC:false})}}
        // Fake 4: 다른 비약수 삽입 (ins와 다른 값)
        if(opts.length<4){let ins2=ins+1;while(divSet.has(ins2)||ins2===ins||Math.abs(ins2-q.target)<=1)ins2++;const f4=[...q.divisors,ins2].sort((a,b)=>a-b);const s4=f4.join(', ');if(!usedFakes.has(s4)){usedFakes.add(s4);opts.push({text:s4,isC:false})}}
      }
    }
    let fallback=1;
    while(opts.length<4){
      const text=q.divQType==='count'||q.isCount?`${q.divisors.length+fallback}개`
        :q.divQType==='notDiv'?String(q.target+fallback)
        :[...q.divisors,q.target+fallback].join(', ');
      if(!opts.some(o=>o.text===text))opts.push({text,isC:false});
      fallback++;
    }
    opts=opts.slice(0,4);
    setMcOpts(shuffle(opts));
  };

  const check=()=>{
    let isOk=false;let uAns='',cAns='';
    if(q.isMC){
      if(selMC===null)return;
      isOk=mcOpts[selMC].isC;
      uAns=mcOpts[selMC].text;
      if(q.category==='exam5'){
        cAns=q.choices?.[q.answer]||'';
      } else {
        cAns=q.category==='math'?(q.hasR?`몫: ${q.ansC}, 나머지: ${q.ansR}`:`${q.ansC}`):(q.divQType==='count'||q.isCount?`${q.divisors.length}개`:q.divQType==='notDiv'?(mcOpts.find(o=>o.isC)||{}).text  /* 틀려도 실제 정답 수를 알려 준다 */:q.divisors.join(', '));
      }
    } else if(q.category==='math'){
      if(q.hasR){const vQ=parseInt(ans.ansQ),vR=parseInt(ans.ansR);if(isNaN(vQ)||isNaN(vR))return;isOk=vQ===q.ansC&&vR===q.ansR;uAns=`몫: ${vQ}, 나머지: ${vR}`;cAns=`몫: ${q.ansC}, 나머지: ${q.ansR}`}
      else{const vQ=parseInt(ans.ansQ);if(isNaN(vQ))return;isOk=vQ===q.ansC;uAns=`${vQ}`;cAns=`${q.ansC}`}
    }else{
      if(q.isCount){const v=parseInt(ans.ansCount);if(isNaN(v))return;isOk=v===q.divisors.length;uAns=`${v}개`;cAns=`${q.divisors.length}개`}
      else{const raw=ans.ansDiv;if(!raw.trim())return;let arr=raw.split(',').map(v=>parseInt(v.trim())).filter(v=>!isNaN(v));arr=[...new Set(arr)].sort((a,b)=>a-b);isOk=arr.join(',')===q.divisors.join(',');uAns=arr.join(', ')||'(입력없음)';cAns=q.divisors.join(', ')}
    }
    const elapsed=Math.round((Date.now()-qStartTime)/1000);
    const firstActionMs=firstActionTime!=null?firstActionTime-qStartTime:null;
    
    // 🔥 학습분석용 메타데이터 저장 🔥
    // exam5: 모의고사 포맷이므로 q.meta가 이미 있음 (type: '도형과 기하' 등)
    const meta = q.category==='exam5'
      ? (q.meta || { category: 'exam5', type: q.topic||'검정고시', diff: '기초' })
      : { category: q.category, type: q.type || '연산', diff: q.diff || '기본' };
    const topicHash = getTopicHash({meta, topic: meta.type});
    const newQ={qTxt:q.qLogTxt||q.txt, uAns, cAns, isOk, timeSec:elapsed,
      firstClickMs:firstActionMs,  // DailyPractice: 진정한 망설임 시간 (one-at-a-time)
      revisionCount:null,          // 자유입력 형식 → 수정 횟수 미적용
      qTopicHash:topicHash,
      examSource:(q._src!==undefined?q._src:getExamSource(q))||null,   // 화면에 보인 출처와 같게
      explanation:Array.isArray(q.sol)&&q.sol.length?q.sol.join('\n'):easyExplanation(q),
      meta};
    if(q.isMC){newQ.qFull=q.q||q.qLogTxt||q.txt;newQ.choices=mcOpts.map(o=>String(o.text));newQ.answerIdx=mcOpts.findIndex(o=>o.isC);}
    // 검정고시(exam5)는 회차 인쇄/PDF를 위해 원문제 전체를 함께 저장 (그림·선택지·해설 포함)
    if(q.category==='exam5'){
      newQ.topic=q.topic;
      newQ.qFull=q.q;
      newQ.choices=q.choices;
      newQ.answerIdx=q.answer;
      if(q.graph)newQ.graph=q.graph;
      // 선생님 화면이 학생 화면 그대로(MockQBody) 다시 그릴 재료 — 표 · 자료 상자 · 보기 그림 · 수식
      ['choicePic','table','box','boxUnit','qTex'].forEach(k=>{if(q[k])newQ[k]=q[k];});
      if(Array.isArray(q.sol))newQ.sol=q.sol;
    }
    
    const newCorrect=correctCount+(isOk?1:0);const newWrong=wrongCount+(isOk?0:1);
    setCorrectCount(newCorrect);setWrongCount(newWrong);
    setQuestions(prev=>[...prev,newQ]);
    setFb({ok:isOk,msg:isOk?'✅ 정답입니다! 잘했어요!':`❌ 아쉬워요! 정답은 ${cAns} 입니다.`});
    setPhase('feedback');
    
    // 검정고시: 총 10문제, 나눗셈/약수: 정답 10개
    const isExam=ver>=5;
    const shouldEnd=isExam?(questions.length+1>=10):(newCorrect>=10);
    if(shouldEnd){
      // 결과가 나오는 순간 저장한다 — 소감을 안 고르고 홈으로 나가도 기록이 남게
      finishLesson([...questions,newQ],newCorrect,newWrong);
      setTimeout(()=>setPhase('reflection'), 1200);
    }
  };

  const[stampDone,setStampDone]=useState(false);   // 도장은 한 묶음에 한 번만
  const finishingRef=React.useRef(false);   // 한 묶음은 한 번만 저장한다 (연타·중복 방지)
  const savedRef=React.useRef(null);        // {id, upd} — 소감을 고르면 이 기록에 덧붙인다
  const finishLesson=async(questions,correctCount,wrongCount)=>{
    if(finishingRef.current)return;
    finishingRef.current=true;
    const feeling=null;
    const totalSec=Math.round((Date.now()-startTime)/1000);
    const today=todayStr();const newActiveDates=[...new Set([...(userData.activeDates||[]),today])];
    const typeMap=['기본 나눗셈','심화 나눗셈','혼합 나눗셈','약수 구하기'];
    
    // feeling(난이도 체감) 데이터 포함 저장
    const score=`10 / ${questions.length}`;
    const log={studentName:userData.name,date:today,time:timeStr(),type:typeMap[ver]||'나눗셈',score,questions:questions,totalSec, feeling};
    const upd={...userData,totalLessons:(userData.totalLessons||0)+1,todayLessons:(userData.todayLessons||0)+1,todayCorrect:(userData.todayCorrect||0)+correctCount,todayWrong:(userData.todayWrong||0)+wrongCount,lastDate:today,activeDates:newActiveDates,logs:[log,...(userData.logs||[]).slice(0,49)]};
    
    await saveUser(upd);const id=await saveLog(log);onUpdate(upd);
    savedRef.current={id,upd};
    localStorage.removeItem('yakHakSavedSession_'+userData.name);
    window.__yakHakActiveSession=null;
  };
  const chooseFeeling=async(feeling)=>{
    setPhase('done');
    if(savedRef.current){const upd=await patchLogFeeling(savedRef.current.id,savedRef.current.upd,feeling);onUpdate(upd);}
  };

  const nextQ=()=>{
    const isExam=ver>=5;
    if(phase==='done'||phase==='reflection'||(isExam?questions.length>=10:correctCount>=10))return;
    const nNum=questions.length+1;
    // ── 세션 내 중복 방지: 이미 출제된 문제 키 수집 ──
    const seenKeys=new Set(questions.map(pq=>{
      // ver5(exam5): q.q 텍스트 기준, 나눗셈: "a÷b", 약수: target
      return pq.meta?.type==='exam5'||pq.category==='exam5' ? pq.qTxt?.slice(0,20)||pq.topic
           : pq.category==='div' ? String(pq.target||pq.qTxt)
           : `${pq.uAns}-${pq.cAns}`;
    }));
    let nQ=null;let tries=0;
    while(tries<8){
      nQ=makeQ(ver,nNum,session.divCountIdxs,rangeMin,rangeMax,divMin,divMax,seenQKeysRef.current,verTopic);
      const newKey=nQ.category==='exam5'? (nQ.q?.slice(0,20)||nQ.topic)
                 : nQ.category==='div' ? String(nQ.target)
                 : nQ.qLogTxt||`${nQ.a}-${nQ.b}`;
      if(!seenKeys.has(newKey))break;
      tries++;
    }
    setQ(nQ);setAns({ansQ:'',ansR:'',ansDiv:'',ansCount:''});setSelMC(null);setFb(null);setPhase('question');setQStartTime(Date.now());setFirstActionTime(null);setShowConfirm(false);setActiveField('Q');
  };

  if(phase==='done')return<PracticeDone ver={ver} userData={userData} correct={correctCount} wrong={wrongCount} onAgain={()=>{finishingRef.current=false;setStampDone(false);savedRef.current=null;setPhase('question');setCorrectCount(0);setWrongCount(0);setQuestions([]);const nQ=makeQ(ver,1,session.divCountIdxs,rangeMin,rangeMax,divMin,divMax);setQ(nQ);setAns({ansQ:'',ansR:'',ansDiv:'',ansCount:''});setSelMC(null);setFb(null);setQStartTime(Date.now());}} onHome={onBack}/>;

  // 🔥 감정 성찰 (메타인지) 화면 렌더링 🔥
  // 10문제를 끝내면 '참 잘했어요' 도장을 쾅 (js/ui/stamp.js) — 소감 고르기 화면 위에 한 번 찍힌다
  if(phase==='reflection')return<>
    <FeelingPicker title="10문제 달성 완료!" onPick={chooseFeeling}/>
    {!stampDone&&<StampOverlay sub="10문제 달성!" onClose={()=>setStampDone(true)}/>}
  </>;

  const pct=(correctCount/10)*100;
  return(<div className="p-4 space-y-4 pb-36">
    <div className="flex items-center gap-3">
      <button onClick={handleBackAttempt} className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center text-xl font-bold text-gray-500">◀</button>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/></div>
      <div className="bg-indigo-100 text-indigo-700 font-black px-4 py-2 rounded-full text-base">✅ {correctCount}/10</div>
    </div>
    {/* 문제 카드 — 검정고시 · 나눗셈 · 약수 모두 같은 구성 (2026-10-06)
        머리표 → 문제 글(시험지 모양 수식) → 가운데 큰 식 → 보기(MockQBody, 채점 뒤 정답 초록 · 고른 오답 빨강) */}
    <div className="bg-white rounded-3xl p-5 shadow-md w-full">
      <div className="flex flex-col items-start gap-1 mb-3 w-full">
        <div className="inline-block bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
          {q.category==='exam5'?`📚 ${q.topic||q.meta?.type||'검정고시 영역 연습'}`:q.category==='div'?'🔢 약수 구하기':q.hasR?'➗ 나눗셈 (몫과 나머지)':'➗ 나눗셈'}
        </div>
        {q.category==='exam5'&&(()=>{var src=(q._src===undefined?(q._src=getExamSource(q)):q._src);   // 문항마다 한 번만 고른다 (다시 그릴 때마다 회차가 바뀌지 않게)
          return src?<div className="text-xs text-gray-400">📌 출처: {src}</div>:null;})()}
      </div>
      <MockQBody q={practiceViewQ(q,mcOpts)} sel={selMC} isGraded={phase==='feedback'} readOnly={phase!=='question'}
        onPick={i=>{if(phase==='question'){handleFirstAction();setSelMC(i);}}}/>
      {phase==='feedback'&&<QuestionDifficultyBookmark userData={userData} source={q.category==='exam5'?'검정고시 연습':q.category==='div'?'약수 구하기':'나눗셈'} question={{qFull:q.q||q.qLogTxt||q.txt||q.qTxt,choices:mcOpts,answerIdx:q.category==='exam5'?q.answer:(q.answerIdx??q.ans),explanation:q.explanation,meta:q.meta}}/>}
    </div>
    {fb&&<div className={`rounded-2xl px-5 py-4 text-base font-bold flex items-center gap-3 fade-in ${fb.ok?'bg-green-50 text-green-700 border-2 border-green-300':'bg-red-50 text-red-700 border-2 border-red-300'}`}>{fb.msg}</div>}
    {fb&&<SolutionBox q={q.category==='exam5'&&Array.isArray(q.sol)?{...q,sol:q.sol.map(toExamTex)}:q}/>}   {/* 풀이도 시험지 모양 수식 */}
    {phase==='question'&&(<div className="space-y-3">
      {q.isMC?(
        <React.Fragment>
          {/* 보기는 위 문제 카드(MockQBody) 안에 있다 */}
          <button onClick={()=>{if(selMC!==null)setShowConfirm(true);}}
            disabled={selMC===null}
            className={`w-full py-5 rounded-3xl text-xl font-black shadow-lg transition-all ${selMC!==null?'bg-gradient-to-r from-indigo-500 to-blue-600 text-white active:scale-95':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            확인 ✓
          </button>
        </React.Fragment>
      ):(<div className="space-y-3">
        {q.category==='math'&&<NumPadInput
          q={q} ans={ans} setAns={setAns}
          activeField={activeField} setActiveField={setActiveField}
          handleFirstAction={handleFirstAction}
          onConfirmRequest={()=>setShowConfirm(true)}
        />}
        {/* 약수 문제는 항상 사지선다 – 직접입력 없음 */}
      </div>)}
    </div>)}
    {phase==='feedback'&&correctCount<10&&<button onClick={nextQ} className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-3xl text-xl font-black shadow-lg active:scale-95 transition-transform">다음 문제 →</button>}
    {/* ── 제출 확인 바텀시트 ── */}
    {showConfirm&&(
      <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 fade-in" onClick={()=>setShowConfirm(false)}>
        <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2"/>
          <p className="text-center text-base font-black text-gray-800 leading-relaxed">
            {q.isMC
              ?(q.category==='exam5'&&selMC!==null
                /* 검정고시 : 고른 보기를 수식(또는 수직선 그림) 그대로 보여 준다 */
                ?<React.Fragment><span className="text-indigo-600">{['①','②','③','④'][selMC]}</span>{q.choicePic==='ineq'
                  ?<React.Fragment> 그림을 선택했습니다.<span className="block mt-2" dangerouslySetInnerHTML={{__html:(exfIneqChoices(mcOpts.map(o=>o.text))||[])[selMC]||''}}/></React.Fragment>
                  :<React.Fragment> 「<span className="text-indigo-600" dangerouslySetInnerHTML={{__html:examChoiceHtml(mcOpts[selMC]?.text)}}/>」를 선택했습니다.</React.Fragment>}</React.Fragment>
                :<React.Fragment>「<span className="text-indigo-600">{selMC!==null?mcOpts[selMC]?.text:''}</span>」를 선택했습니다.</React.Fragment>)
              :q.hasR
                ?<React.Fragment>몫 <span className="text-indigo-600 text-xl">{ans.ansQ}</span>, 나머지 <span className="text-indigo-600 text-xl">{ans.ansR}</span> 입력했습니다.</React.Fragment>
                :<React.Fragment><span className="text-indigo-600 text-2xl">{ans.ansQ}</span> 입력했습니다.</React.Fragment>
            }
          </p>
          <p className="text-center text-gray-500 font-bold text-sm">제출하시겠습니까?</p>
          <div className="flex gap-3">
            <button onClick={()=>setShowConfirm(false)}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-lg active:scale-95 transition-all">
              취소
            </button>
            <button onClick={()=>{setShowConfirm(false);check();}}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">
              제출
            </button>
          </div>
        </div>
      </div>
    )}
    {showExitModal&&(
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm fade-in">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">📚</div>
            <div className="text-xl font-black text-gray-800">문제 풀이 중이에요!</div>
            <div className="text-sm text-gray-500 mt-2">현재 정답 <strong>{correctCount}/10</strong>까지 왔어요.<br/>어떻게 할까요?</div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={()=>{saveSession();setShowExitModal(false);onBack();}}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">
              현재 상태 저장하기 💾
            </button>
            <button onClick={()=>{setShowExitModal(false);onBack();}}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-lg active:scale-95 transition-all">
              그만하기
            </button>
            <button onClick={()=>setShowExitModal(false)}
              className="w-full py-3 text-gray-400 font-bold text-sm">
              계속 풀기
            </button>
          </div>
        </div>
      </div>
    )}
  </div>);
}

function PracticeDone({ver,userData,correct,wrong,onAgain,onHome}){
  const isExam=ver>=5;
  return(<div className="p-4 pb-36 flex flex-col items-center justify-center min-h-screen text-center">
    <div className="text-8xl mb-4">🎉</div>
    <h2 className="text-3xl font-black text-gray-800 mb-2">레슨 완료!</h2>
    <p className="text-gray-500 text-lg mb-6">{isExam?`10문제 완료! 정답 ${correct}개`:'10문제를 모두 맞혔어요!'}</p>
    <div className="bg-white rounded-3xl p-6 shadow-md w-full max-w-xs mb-6">
      <div className="text-6xl font-black text-green-500 mb-1">{correct}</div>
      <div className="text-gray-500 font-bold">정답</div>
    </div>
    <div className="text-xl font-bold text-indigo-600 bg-indigo-50 rounded-2xl px-6 py-3 mb-6">오늘 총 {(userData.todayLessons||0)} 레슨 완료! 🌟</div>
    <button onClick={onAgain} className="w-full max-w-xs py-4 bg-indigo-500 text-white rounded-2xl font-black text-xl mb-3 active:scale-95 transition-transform">한 번 더 풀기 🔄</button>
    <button onClick={onHome} className="w-full max-w-xs py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xl active:scale-95 transition-transform">홈으로 🏠</button>
  </div>);
}
