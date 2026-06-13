function DailyPracticeTab({userData,onUpdate}){
  const[screen,setScreen]=useState('menu');// menu | session | done
  const[session,setSession]=useState(null);
  const[ver,setVer]=useState(userData.ver||0);
  const[rangeMin,setRangeMin]=useState(userData.rangeMin||10);
  const[rangeMax,setRangeMax]=useState(userData.rangeMax||99);
  const[divMin,setDivMin]=useState(userData.divRangeMin||10);
  const[divMax,setDivMax]=useState(userData.divRangeMax||99);
  const[goal,setGoal]=useState(userData.goal||3);

  const saveSettings=()=>{
  const upd={...userData,ver,
    rangeMin: rangeMin===''?1:Math.max(1,Number(rangeMin)),
    rangeMax: rangeMax===''?2:Math.max(2,Number(rangeMax)),
    divRangeMin: divMin===''?1:Math.max(1,Number(divMin)),
    divRangeMax: divMax===''?2:Math.max(2,Number(divMax)),
    goal};
  saveUser(upd);onUpdate(upd);
};  
  const startSession=()=>{
  // 빈 칸이면 자동 채움: 왼쪽=1, 오른쪽=왼쪽+1
  const effRMin = rangeMin===''||Number(rangeMin)<1 ? 1 : Math.floor(Number(rangeMin));
  const effRMax = rangeMax===''||Number(rangeMax)<=effRMin ? effRMin+1 : Math.floor(Number(rangeMax));
  const effDMin = divMin===''||Number(divMin)<1 ? 1 : Math.floor(Number(divMin));
  const effDMax = divMax===''||Number(divMax)<=effDMin ? effDMin+1 : Math.floor(Number(divMax));
  setRangeMin(effRMin); setRangeMax(effRMax);
  setDivMin(effDMin);   setDivMax(effDMax);
  const divCountIdxs=[];while(divCountIdxs.length<2){const r=randInt(1,10);if(!divCountIdxs.includes(r))divCountIdxs.push(r)}
  setSession({qNum:1,correct:0,wrong:0,startTime:Date.now(),qStartTime:Date.now(),questions:[],divCountIdxs,currentQ:null,selectedMC:null,fb:null,phase:'question'});
  setScreen('session');
};

  if(screen==='menu')return<PracticeMenu ver={ver} setVer={v=>{setVer(v)}} rangeMin={rangeMin} setRangeMin={setRangeMin} rangeMax={rangeMax} setRangeMax={setRangeMax} divMin={divMin} setDivMin={setDivMin} divMax={divMax} setDivMax={setDivMax} goal={goal} setGoal={setGoal} todayLessons={userData.todayLessons} onSave={saveSettings} onStart={startSession}/>;
  if(screen==='session')return<PracticeSession session={session} setSession={setSession} ver={ver} rangeMin={rangeMin} rangeMax={rangeMax} divMin={divMin} divMax={divMax} userData={userData} onUpdate={onUpdate} onDone={(result)=>{setScreen('done');}} onBack={()=>setScreen('menu')}/>;
  if(screen==='done')return<PracticeDone userData={userData} onAgain={startSession} onHome={()=>setScreen('menu')}/>;
  return null;
}

function PracticeMenu({ver,setVer,rangeMin,setRangeMin,rangeMax,setRangeMax,divMin,setDivMin,divMax,setDivMax,goal,setGoal,todayLessons,onSave,onStart}){
  const VER_OPTS=[{v:0,lbl:'기본 나눗셈',desc:'설정된 범위 내의 나눗셈 연산'},{v:1,lbl:'심화 나눗셈 (나머지)',desc:'몫과 나머지를 모두 구해야 해요'},{v:2,lbl:'혼합 나눗셈',desc:'나머지 있는 것과 없는 것이 섞여요'},{v:3,lbl:'약수 구하기',desc:'개수 구하기(2문제) 및 모두 구하기'},{v:4,lbl:'약수 (하드모드) 🔥',desc:'10~200 사이의 큰 수가 출제돼요'},{v:5,lbl:'중졸 검정고시 연습 📘',desc:'최근 6개년 핵심 5개 영역을 골고루 풀어요'},{v:6,lbl:'고졸 검정고시 연습 📚',desc:'고졸 기출의 5개 영역을 실전처럼 풀어요'}];
  return(<div className="p-4 space-y-4 pb-36">
    <div className="bg-indigo-600 rounded-3xl p-5 text-white mb-2">
      <div className="text-lg font-black">오늘 {todayLessons}번 완료! 더 풀어볼까요?</div>
      <div className="text-sm opacity-80 mt-1">10문제를 다 맞히면 레슨 1개 완료!</div>
    </div>
    {/* Ver select */}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">📝 문제 유형</div>
      <div className="space-y-2">
        {VER_OPTS.map(({v,lbl,desc})=><button key={v} onClick={()=>setVer(v)} className={`w-full text-left p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${ver===v?'border-indigo-400 bg-indigo-50':'border-gray-200 bg-gray-50'}`}>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${ver===v?'border-indigo-500 bg-indigo-500':'border-gray-300'}`}>
            {ver===v&&<div className="w-2 h-2 bg-white rounded-full"/>}
          </div>
          <div><div className="text-base font-bold text-gray-800">{lbl}</div><div className="text-xs text-gray-500 mt-0.5">{desc}</div></div>
        </button>)}
      </div>
    </div>
  {/* Settings */}
    {ver<5&&<div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">⚙️ 범위 설정</div>
      <div className="space-y-3">
        <div><div className="text-sm font-bold text-gray-600 mb-2">나눗셈 범위</div>
          <div className="flex items-center gap-3">
            <input type="number" min="1" step="1" value={rangeMin} placeholder="1"
              onChange={e=>{const raw=e.target.value;if(raw===''){setRangeMin('');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setRangeMin(v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
            <span className="text-xl font-bold text-gray-400">~</span>
            <input type="number" min="1" step="1" value={rangeMax} placeholder="2"
              onChange={e=>{const raw=e.target.value;if(raw===''){setRangeMax('');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setRangeMax(v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
          </div>
        </div>
        <div><div className="text-sm font-bold text-gray-600 mb-2">약수 구하기 숫자 범위</div>
          <div className="flex items-center gap-3">
            <input type="number" min="1" step="1" value={divMin} placeholder="1"
              onChange={e=>{const raw=e.target.value;if(raw===''){setDivMin('');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setDivMin(v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
            <span className="text-xl font-bold text-gray-400">~</span>
            <input type="number" min="1" step="1" value={divMax} placeholder="2"
              onChange={e=>{const raw=e.target.value;if(raw===''){setDivMax('');return;}const v=parseInt(raw,10);if(!isNaN(v)&&v>=1)setDivMax(v);}}
              className="w-20 border-2 border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-center focus:border-indigo-400 outline-none"/>
          </div>
        </div>
        <div><div className="text-sm font-bold text-gray-600 mb-2">하루 목표 레슨 수</div>
          <div className="flex items-center gap-4 bg-indigo-50 rounded-2xl p-3">
            <button onClick={()=>setGoal(v=>Math.max(1,v-1))} className="w-10 h-10 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center">−</button>
            <span className="text-2xl font-black text-gray-800 flex-1 text-center">{goal}</span>
            <button onClick={()=>setGoal(v=>Math.min(10,v+1))} className="w-10 h-10 rounded-full bg-indigo-500 text-white font-black text-xl flex items-center justify-center">+</button>
          </div>
        </div>
      </div>
      <button onClick={onSave} className="w-full mt-3 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm">설정 저장</button>
    </div>}
    {ver>=5&&<div className="bg-indigo-50 rounded-3xl p-5 shadow-sm border-2 border-indigo-100">
      <div className="text-base font-black text-indigo-700 mb-2">📚 {ver===5?'중졸':'고졸'} 검정고시 연습이란?</div>
      <div className="space-y-2 text-sm font-semibold text-indigo-600">
        {(ver===5
          ?['수와 연산','문자와 식','함수','기하','확률과 통계']
          :['다항식 계산','방정식과 부등식','도형과 기하','집합과 함수','확률과 통계']
        ).map((t,i)=><div key={t} className="flex items-start gap-2"><span>{['🔢','✏️','📈','📐','🎲'][i]}</span><span><b>{t}</b></span></div>)}
      </div>
      <div className="mt-3 text-xs text-indigo-400 font-bold">최근 출제 유형을 더 자주 만나며, 10문제 완료 시 성취도에 반영됩니다.</div>
    </div>}
    <button onClick={onStart} className="w-full py-5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-3xl text-2xl font-black shadow-xl active:scale-95 transition-transform">
      문제 풀기 시작 ✏️
    </button>
  </div>);
}

function makeQ(ver,qNum,divCountIdxs,rangeMin,rangeMax,divMin,divMax,seenSet=null){
  let qType=ver;if(qType===2)qType=Math.random()<0.5?0:1;
  const isMC=Math.random()<0.25;
  if(qType===3||qType===4){
    const{target,divisors}=genDivisors(divMin,divMax,qType===4);
    const divQType=pick(['notDiv','allDiv','count']);
    return{category:'div',target,divisors,divQType,isMC:true,
      qLogTxt:divQType==='count'?`${target}의 약수 개수`:divQType==='notDiv'?`${target}의 약수 아닌 것 고르기`:`${target}의 모든 약수`};
  }
  // ── ver:5 중졸 / ver:6 고졸 검정고시 영역 연습 ──
  if(qType===5||qType===6){
    const midLabels=Object.keys(MID_DOMAIN_GENS);
    const highLabels=['다항식 계산','방정식과 부등식','도형과 기하','집합과 함수','확률과 통계'];
    const highGens=[genMockPoly,genMockEqInequal,genMockGeometry,genMockSetFunc,genMockProbStat];
    const areaLabels=qType===5?midLabels:highLabels;
    const areaIdx=(qNum-1)%areaLabels.length;
    const gen=qType===5?()=>genMiddleMock(areaLabels[areaIdx]):highGens[areaIdx];
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
      qLogTxt:q.q?.slice(0,30)||q.topic||areaLabels[areaIdx]};
  }
  if(qType===0){const q=genDivBasic(rangeMin,rangeMax);return{...q,category:'math',isMC}}
  return{...genDivRemainder(rangeMin,rangeMax),category:'math',isMC};
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
    if(q.divQType==='count'){
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-2">
            <Row step="약수 목록">{q.target}의 약수: {divs.join(', ')}</Row>
            <Row step="개수"><span className="text-green-700">모두 {divs.length}개</span></Row>
          </div>
        </div>
      );
    }else if(q.divQType==='notDiv'){
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-2">
            <Row step="약수 목록">{q.target}의 약수: {divs.join(', ')}</Row>
            <Row step="판별"><span className="text-red-600">위 목록에 없는 수 → 약수가 아닌 것</span></Row>
          </div>
        </div>
      );
    }else{
      const pairs=[];
      const half=Math.ceil(divs.length/2);
      for(let i=0;i<half;i++){const a=divs[i],b=divs[divs.length-1-i];if(a<=b)pairs.push(`${a} × ${b} = ${q.target}`);}
      return(
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 fade-in">
          <div className="text-xs font-black text-amber-600 mb-3 tracking-wide">📖 풀이 과정</div>
          <div className="space-y-1">
            <div className="text-xs text-gray-400 font-bold mb-2">곱셈 짝으로 찾기</div>
            {pairs.map((p,i)=><div key={i} className="text-sm font-bold text-indigo-600">{p}</div>)}
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
  const padCls=k=>k==='C'?'bg-red-50 border-red-200 text-red-600 text-base':k==='←'?'bg-orange-50 border-orange-200 text-orange-600 text-xl':'bg-white border-gray-200 text-gray-800 text-xl';
  return(
    <div className="space-y-3">
      {q.hasR?(
        <div className="flex gap-3">
          <button onClick={()=>setActiveField('Q')} className={`flex-1 py-3 rounded-2xl border-2 text-center transition-all ${activeField==='Q'?'border-indigo-500 bg-indigo-50':'border-gray-200 bg-white'}`}>
            <div className="text-xs text-gray-400 font-bold mb-1">몫</div>
            <div className={`text-2xl font-black ${activeField==='Q'?'text-indigo-700':'text-gray-500'}`}>{ans.ansQ||<span className="opacity-25">_</span>}</div>
          </button>
          <button onClick={()=>setActiveField('R')} className={`flex-1 py-3 rounded-2xl border-2 text-center transition-all ${activeField==='R'?'border-indigo-500 bg-indigo-50':'border-gray-200 bg-white'}`}>
            <div className="text-xs text-gray-400 font-bold mb-1">나머지</div>
            <div className={`text-2xl font-black ${activeField==='R'?'text-indigo-700':'text-gray-500'}`}>{ans.ansR||<span className="opacity-25">_</span>}</div>
          </button>
        </div>
      ):(
        <div className="w-full py-3 rounded-2xl border-2 border-indigo-400 bg-indigo-50 text-center">
          <div className="text-3xl font-black text-indigo-700">{ans.ansQ||<span className="opacity-25">0</span>}</div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {PAD.map(k=>(
          <button key={k} onClick={()=>press(k)}
            className={`py-4 rounded-2xl border font-black shadow-sm active:scale-95 transition-all ${padCls(k)}`}>
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
  const seenQKeysRef = React.useRef(new Set()); // 세션 내 출제된 문제 텍스트 추적
  const[q,setQ]=useState(()=>makeQ(ver,session.qNum,session.divCountIdxs,rangeMin,rangeMax,divMin,divMax,seenQKeysRef.current));
  const[ans,setAns]=useState({ansQ:'',ansR:'',ansDiv:'',ansCount:''});
  const[fb,setFb]=useState(null);
  const[selMC,setSelMC]=useState(null);
  const[mcOpts,setMcOpts]=useState([]);
  // phase에 'reflection'(성찰) 단계가 추가되었습니다.
  const[phase,setPhase]=useState('question'); 
  const[correctCount,setCorrectCount]=useState(0);
  const[wrongCount,setWrongCount]=useState(0);
  const[questions,setQuestions]=useState([]);
  const[startTime]=useState(Date.now());
  const[qStartTime,setQStartTime]=useState(Date.now());
  const[firstActionTime,setFirstActionTime]=useState(null); // 첫 입력 시각 추적
  const[showConfirm,setShowConfirm]=useState(false); // 제출 확인 모달
  const[activeField,setActiveField]=useState('Q');   // 숫자패드 활성 필드 ('Q'|'R')

  // 첫 입력 이벤트 핸들러 (one-at-a-time 형식이므로 진정한 망설임 시간 측정 가능)
  const handleFirstAction=()=>{
    if(firstActionTime===null)setFirstActionTime(Date.now());
  };

  useEffect(()=>{buildMCOpts()},[q]);
  const buildMCOpts=()=>{
    if(!q.isMC){setMcOpts([]);return}
    var _twoMode=questions.length>=15;
    // exam5: 이미 choices 배열이 있는 모의고사 포맷
    if(q.category==='exam5'&&q.choices){
      var opts5=q.choices.map((c,i)=>({text:c,isC:i===q.answer}));
      if(_twoMode&&opts5.length>2){var c5=opts5.find(o=>o.isC);var w5=opts5.find(o=>!o.isC);opts5=[c5,w5].filter(Boolean);if(Math.random()<0.5)opts5=[opts5[1],opts5[0]];}
      setMcOpts(opts5);return;
    }
    let opts=[];
    if(q.category==='math'){
      const ansStr=q.hasR?`몫: ${q.ansC}, 나머지: ${q.ansR}`:`${q.ansC}`;
      opts.push({text:ansStr,isC:true});
      while(opts.length<4){const wQ=Math.max(1,q.ansC+randInt(-2,2)||1);const wR=q.hasR?Math.max(0,(q.ansR+randInt(-1,2))%q.b):0;const wStr=q.hasR?`몫: ${wQ}, 나머지: ${wR}`:`${wQ}`;if(!opts.some(o=>o.text===wStr))opts.push({text:wStr,isC:false})}
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
    if(_twoMode&&opts.length>2){var cO=opts.find(o=>o.isC);var wO=opts.find(o=>!o.isC);opts=[cO,wO].filter(Boolean);}
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
        cAns=q.category==='math'?(q.hasR?`몫: ${q.ansC}, 나머지: ${q.ansR}`:`${q.ansC}`):(q.divQType==='count'||q.isCount?`${q.divisors.length}개`:q.divQType==='notDiv'?mcOpts[selMC].isC?mcOpts[selMC].text:'(약수 아닌 것)':q.divisors.join(', '));
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
      examSource:getExamSource(q)||null,
      explanation:easyExplanation(q),
      meta};
    
    const newCorrect=correctCount+(isOk?1:0);const newWrong=wrongCount+(isOk?0:1);
    setCorrectCount(newCorrect);setWrongCount(newWrong);
    setQuestions(prev=>[...prev,newQ]);
    setFb({ok:isOk,msg:isOk?'✅ 정답입니다! 잘했어요!':`❌ 아쉬워요! 정답은 ${cAns} 입니다.`});
    setPhase('feedback');
    
    // 10문제 달성 시 바로 끝내지 않고 '감정 성찰(reflection)' 단계로 넘어감
    if(newCorrect>=10){
      setTimeout(()=>setPhase('reflection'), 1200);
    }
  };

  const finishLesson=async(feeling)=>{
    const totalSec=Math.round((Date.now()-startTime)/1000);
    const today=todayStr();const newActiveDates=[...new Set([...(userData.activeDates||[]),today])];
    const typeMap=['기본 나눗셈','심화 나눗셈','혼합 나눗셈','약수 구하기','약수(하드)','중졸 검정고시 연습','고졸 검정고시 연습'];
    
    // feeling(난이도 체감) 데이터 포함 저장
    const log={studentName:userData.name,date:today,time:timeStr(),type:typeMap[ver]||'나눗셈',score:`10 / ${questions.length}`,questions:questions,totalSec, feeling};
    const upd={...userData,totalLessons:(userData.totalLessons||0)+1,todayLessons:(userData.todayLessons||0)+1,todayCorrect:(userData.todayCorrect||0)+correctCount,todayWrong:(userData.todayWrong||0)+wrongCount,lastDate:today,activeDates:newActiveDates,logs:[log,...(userData.logs||[]).slice(0,49)]};
    
    await saveUser(upd);await saveLog(log);onUpdate(upd);
    setPhase('done');
  };

  const nextQ=()=>{
    if(phase==='done'||phase==='reflection'||correctCount>=10)return;
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
      nQ=makeQ(ver,nNum,session.divCountIdxs,rangeMin,rangeMax,divMin,divMax,seenQKeysRef.current);
      const newKey=nQ.category==='exam5'? (nQ.q?.slice(0,20)||nQ.topic)
                 : nQ.category==='div' ? String(nQ.target)
                 : nQ.qLogTxt||`${nQ.a}-${nQ.b}`;
      if(!seenKeys.has(newKey))break;
      tries++;
    }
    setQ(nQ);setAns({ansQ:'',ansR:'',ansDiv:'',ansCount:''});setSelMC(null);setFb(null);setPhase('question');setQStartTime(Date.now());setFirstActionTime(null);setShowConfirm(false);setActiveField('Q');
  };

  if(phase==='done')return<PracticeDone userData={userData} correct={correctCount} wrong={wrongCount} onAgain={()=>{setPhase('question');setCorrectCount(0);setWrongCount(0);setQuestions([]);const nQ=makeQ(ver,1,session.divCountIdxs,rangeMin,rangeMax,divMin,divMax);setQ(nQ);setAns({ansQ:'',ansR:'',ansDiv:'',ansCount:''});setSelMC(null);setFb(null);setQStartTime(Date.now());}} onHome={onBack}/>;

  // 🔥 감정 성찰 (메타인지) 화면 렌더링 🔥
  if(phase==='reflection') {
    return(
      <div className="p-4 flex flex-col items-center justify-center min-h-screen text-center pb-36 fade-in">
        <div className="text-7xl mb-6">🧠</div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">10문제 달성 완료!</h2>
        <p className="text-gray-500 mb-8 font-bold text-lg">스스로 생각하기에<br/>오늘 푼 문제들은 어떠셨나요?</p>
        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <button onClick={() => finishLesson('easy')} className="py-5 bg-green-100 text-green-700 rounded-3xl font-black text-xl shadow-sm active:scale-95 transition-all">쉬웠어요 😊</button>
          <button onClick={() => finishLesson('normal')} className="py-5 bg-blue-100 text-blue-700 rounded-3xl font-black text-xl shadow-sm active:scale-95 transition-all">적당했어요 😐</button>
          <button onClick={() => finishLesson('hard')} className="py-5 bg-red-100 text-red-700 rounded-3xl font-black text-xl shadow-sm active:scale-95 transition-all">어려웠어요 😥</button>
        </div>
      </div>
    );
  }

  const pct=(correctCount/10)*100;
  return(<div className="p-4 space-y-4 pb-36">
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center text-xl font-bold text-gray-500">◀</button>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/></div>
      <div className="bg-indigo-100 text-indigo-700 font-black px-4 py-2 rounded-full text-base">✅ {correctCount}/10</div>
    </div>
    <div className={`bg-white rounded-3xl p-6 shadow-md flex flex-col items-center justify-center ${q.category==='exam5'?(q.graph?'':'min-h-48'):'min-h-40'}`}>
      {q.category==='exam5'
        ?<div className="flex flex-col items-center gap-1 mb-4">
          <div className="inline-block bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">📚 {q.topic||q.meta?.type||'검정고시 영역 연습'}</div>
          {(()=>{var src=getExamSource(q);return src?<div className="text-xs text-gray-400">📌 출처: {src}</div>:null;})()}
        </div>
        :<div className="inline-block bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full mb-4">{q.category==='div'?'약수 구하기':'나눗셈'}</div>
      }
      {q.category==='exam5'&&<div className="text-base font-bold text-gray-800 leading-relaxed text-left px-1">{q.q}</div>}
      {q.category==='exam5'&&q.graph&&<div className="flex justify-center mt-3 w-full"><GraphPreview q={q}/></div>}
      {q.category==='math'&&<div className="text-4xl font-black text-gray-800 tracking-wide">{q.a} ÷ {q.b} = ?</div>}
      {q.category==='div'&&<div className="text-3xl font-black text-gray-800 leading-relaxed">
        <span className="text-indigo-600">{q.target}</span> 의<br/>
        {q.divQType==='count'?'약수는 모두 몇 개?':q.divQType==='notDiv'?<span className="text-sm font-bold text-red-600 block mb-1">약수가 <u>아닌</u> 것은?</span>:<span className="text-sm font-bold text-blue-600 block mb-1">약수를 <u>모두</u> 쓴 것은?</span>}
      </div>}
    </div>
    {fb&&<div className={`rounded-2xl px-5 py-4 text-base font-bold flex items-center gap-3 fade-in ${fb.ok?'bg-green-50 text-green-700 border-2 border-green-300':'bg-red-50 text-red-700 border-2 border-red-300'}`}>{fb.msg}</div>}
    {fb&&<SolutionBox q={q}/>}
    {phase==='question'&&(<div className="space-y-3">
      {q.isMC?(
        <React.Fragment>
          {q.category==='exam5'
            ?<div className="flex flex-col gap-3">
              {mcOpts.map((opt,i)=>{
                let cls='border-gray-200 bg-white text-gray-700';
                if(selMC===i) cls='border-indigo-500 bg-indigo-50 text-indigo-700';
                return(<button key={i} onClick={()=>{if(phase==='question')setSelMC(i);}}
                  className={`p-4 rounded-2xl border-2 text-base font-bold transition-all text-left leading-relaxed ${cls}`}>
                  <span className="text-indigo-900">{['①','②','③','④'][i]}</span> <span className="leading-relaxed"><MathText v={opt.text}/></span>
                </button>);
              })}
            </div>
            :<div className="grid grid-cols-2 gap-3">
              {mcOpts.map((opt,i)=>{
                let cls2='border-gray-200 bg-white text-gray-800';
                if(selMC===i) cls2='border-indigo-400 bg-indigo-50 text-indigo-700';
                return(<button key={i} onClick={()=>{if(phase==='question')setSelMC(i);}} className={`p-4 rounded-2xl border-2 text-base font-bold transition-all ${cls2}`}>{opt.text}</button>);
              })}
            </div>
          }
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
              ?<React.Fragment>「<span className="text-indigo-600">{selMC!==null?mcOpts[selMC]?.text:''}</span>」를 선택했습니다.</React.Fragment>
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
  </div>);
}

function PracticeDone({userData,correct,wrong,onAgain,onHome}){
  return(<div className="p-4 pb-36 flex flex-col items-center justify-center min-h-screen text-center">
    <div className="text-8xl mb-4">🎉</div>
    <h2 className="text-3xl font-black text-gray-800 mb-2">레슨 완료!</h2>
    <p className="text-gray-500 text-lg mb-6">10문제를 모두 맞혔어요!</p>
    <div className="bg-white rounded-3xl p-6 shadow-md w-full max-w-xs mb-6">
      <div className="text-6xl font-black text-green-500 mb-1">{correct}</div>
      <div className="text-gray-500 font-bold">정답</div>
    </div>
    <div className="text-xl font-bold text-indigo-600 bg-indigo-50 rounded-2xl px-6 py-3 mb-6">오늘 총 {(userData.todayLessons||0)} 레슨 완료! 🌟</div>
    <button onClick={onAgain} className="w-full max-w-xs py-4 bg-indigo-500 text-white rounded-2xl font-black text-xl mb-3 active:scale-95 transition-transform">한 번 더 풀기 🔄</button>
    <button onClick={onHome} className="w-full max-w-xs py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-xl active:scale-95 transition-transform">홈으로 🏠</button>
  </div>);
}

/* ===== HISTORY TAB ===== */
function HistoryTab({userData, feedbacks}){
  const logs=userData.logs||[];
  const fbs = feedbacks || [];
  const[open,setOpen]=useState(null);
  const[showFbs, setShowFbs] = useState(false); // 피드백 보관함 열기/닫기

  return(<div className="p-4 pb-36 space-y-3">
    
    {/* 선생님 피드백 보관함 (받은 피드백이 있을 때만 표시) */}
    {fbs.length > 0 && (
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-2 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <div className="font-black text-indigo-800 text-base">💌 받은 피드백 ({fbs.length})</div>
          <button onClick={()=>setShowFbs(!showFbs)} className="text-xs bg-indigo-200 text-indigo-800 px-3 py-1.5 rounded-lg font-bold">{showFbs?'접기 ▲':'펼쳐보기 ▼'}</button>
        </div>
        {showFbs && (
          <div className="space-y-3 mt-4">
            {fbs.map(fb => (
              <div key={fb.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 relative">
                {!fb.read && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></div>}
                {fb.relatedLog && <div className="text-xs text-indigo-500 font-black mb-2 inline-block bg-indigo-50 px-2 py-1 rounded">📋 {fb.relatedLog}</div>}
                <div className="text-base font-bold text-gray-800 leading-relaxed">{fb.message}</div>
                <div className="text-xs text-gray-400 mt-3 font-semibold text-right">{fb.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || new Date(fb.createdAt).toLocaleDateString('ko-KR')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    <div className="text-lg font-black text-gray-700 mt-4 mb-2">📅 학습 기록</div>
    {logs.length===0&&<div className="text-center text-gray-400 py-12 text-base font-bold">아직 완료한 레슨이 없어요.<br/>문제를 풀어보세요!</div>}
    {logs.map((log,i)=>{const isOpen=open===i;return(<div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex-1"><div className="font-bold text-gray-800 text-base">{fmtDate(log.date)} {log.time}</div>
          <div className="text-sm text-gray-500 mt-0.5">{log.type} · 점수 {log.score}{log.totalSec?` · ⏱️ ${Math.floor(log.totalSec/60)}분 ${log.totalSec%60}초`:''}</div></div>
        <button onClick={()=>setOpen(isOpen?null:i)} className="text-sm text-indigo-600 font-bold px-3 py-1.5 bg-indigo-50 rounded-xl">{isOpen?'닫기':'보기'}</button>
      </div>
      {isOpen&&log.questions&&log.questions.length>0&&(<div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {log.questions.map((q,j)=><div key={j} className={`rounded-xl p-3 text-sm ${q.isOk?'bg-green-50':'bg-red-50'}`}>
          <div className="flex gap-2"><span className="font-bold text-gray-500">Q{j+1}.</span><span className="font-bold text-gray-800 flex-1">{q.qTxt}</span><span className={`font-black ${q.isOk?'text-green-600':'text-red-500'}`}>{q.isOk?'O':'X'}</span></div>
          {q.examSource&&<div className="mt-1 pl-6 text-xs text-blue-500 font-bold">📌 {q.examSource}</div>}
          {!q.isOk&&<div className="mt-1 pl-6 text-xs text-gray-500">내 답: {q.uAns} → 정답: <span className="text-indigo-600 font-bold">{q.cAns}</span></div>}
          {q.explanation&&<div className="mt-2 pl-6 text-xs text-amber-800 leading-relaxed">💡 {q.explanation}</div>}
          {q.timeSec!==undefined&&<div className="mt-0.5 pl-6 text-xs text-indigo-400 font-bold">⏱️ {q.timeSec}초</div>}
        </div>)}
      </div>)}
    </div>)})}
  </div>);
}

/* ===== GEOMETRY TAB ===== */
