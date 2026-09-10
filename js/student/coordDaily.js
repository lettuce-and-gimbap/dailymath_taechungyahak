// === js/student/coordDaily.js ===
/* --------------------------------------------------------------------
   매일 좌표 10문제
   하 : 좌표 위치 읽기 / 중 : 평행이동 / 상 : 대칭이동

   설계 원칙
   - 평행이동·대칭이동 문제에서 <b>옮겨진 점은 그림에 그리지 않는다</b>.
     그림에 답이 보이면 학생이 규칙을 익히지 않고 눈으로 세어 버린다.
     대신 정답을 확인한 뒤(피드백 화면)에 옮겨진 점을 초록색으로 보여 준다.
   - 사지선다. 오답 보기는 부호를 뒤집거나 x·y를 맞바꾼 것으로 만들어
     "부호 규칙"과 "순서"를 정확히 아는지 확인한다 (GS.coordChoices).
   - 한 번에 한 문제만 보여 준다(one-at-a-time). 그래야 문항별 소요 시간이
     의미 있는 값으로 기록된다(js/core/logMetrics.js 참고).
   -------------------------------------------------------------------- */

// Tailwind CDN이 훑어갈 수 있도록 클래스 이름은 조합하지 않고 통째로 적어 둔다
var COORD_LEVELS=[
  {k:'low', badge:'하', lbl:'좌표 위치 읽기', desc:'그림 속 점의 좌표를 읽습니다',
    border:'border-emerald-200', chip:'bg-emerald-100 text-emerald-700'},
  {k:'mid', badge:'중', lbl:'평행이동',       desc:'점을 옆으로·위아래로 밀어 봅니다',
    border:'border-sky-200', chip:'bg-sky-100 text-sky-700'},
  {k:'high',badge:'상', lbl:'대칭이동',       desc:'점을 축·원점에 비추어 봅니다',
    border:'border-violet-200', chip:'bg-violet-100 text-violet-700'},
  {k:'mix', badge:'섞기', lbl:'섞어서 풀기',  desc:'하 · 중 · 상을 골고루',
    border:'border-amber-200', chip:'bg-amber-100 text-amber-700'},
];

/* 좌표 보기 만들기 — GS.coordChoices는 학습지(KaTeX)용이라 "(1,\ -2)" 처럼
   수식 표기가 섞여 있다. 학생 화면에서는 그대로 읽히는 글자여야 하므로 따로 만든다.
   오답은 x·y 자리 바꾸기 / 부호 뒤집기 / 한 칸 밀기 — 실제로 학생이 하는 실수들. */
function coordChoicesPlain(X,Y){
  const f=(a,b)=>`(${a}, ${b})`;
  const correct=f(X,Y);
  const cands=[f(Y,X),f(-X,Y),f(X,-Y),f(-X,-Y),f(X+1,Y),f(X,Y+1),f(X-1,Y-1),f(Y,-X)];
  const wrongs=[];
  for(const c of cands){if(c!==correct&&wrongs.indexOf(c)<0)wrongs.push(c);if(wrongs.length===3)break;}
  let k=2;while(wrongs.length<3){const c=f(X+k,Y-k);if(c!==correct&&wrongs.indexOf(c)<0)wrongs.push(c);k++;}
  const list=[correct,...wrongs];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return{list,ans:list.indexOf(correct)};
}

/* ── 문항 생성 ───────────────────────────────────────────────── */
function genCoordQ(level){
  const G=window.GS;
  const nz=(a,b)=>{let v=a+Math.floor(Math.random()*(b-a+1));let g=0;while(v===0&&g++<20)v=a+Math.floor(Math.random()*(b-a+1));return v===0?1:v;};
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pk=arr=>arr[Math.floor(Math.random()*arr.length)];
  const lv=level==='mix'?pk(['low','mid','high']):level;
  const x=nz(-5,5),y=nz(-5,5);
  const P={t:'pt',x,y,label:'P',guide:true,r:8};
  const plane=items=>G.planeSVG({xmin:-6,xmax:6,ymin:-6,ymax:6,s:30,maxW:400},items);

  /* 하 : 좌표 읽기 */
  if(lv==='low'){
    const ch=coordChoicesPlain(x,y);
    return{lv,topic:'좌표 읽기',
      q:`그림의 점 P의 좌표는?`,
      svg:plane([{...P,nolabel:true}]),
      svgAfter:plane([{...P,nolabel:false}]),
      choices:ch.list,ans:ch.ans,
      sol:[`점 P에서 <b>아래(또는 위)로 곧게</b> 내려가 x축 눈금을 읽습니다 → ${x}`,
        `점 P에서 <b>옆으로 곧게</b> 가서 y축 눈금을 읽습니다 → ${y}`,
        `좌표는 언제나 <b>(가로, 세로)</b> 순서입니다 → (${x}, ${y})`],
      answer:`(${x}, ${y})`};
  }

  /* 중 : 평행이동 — 옮긴 점은 그리지 않는다 */
  if(lv==='mid'){
    const dx=nz(-4,4),dy=nz(-4,4);
    const nx=x+dx,ny=y+dy;
    if(Math.abs(nx)>6||Math.abs(ny)>6)return genCoordQ(level);   // 그림 밖으로 나가면 다시 뽑기
    const ch=coordChoicesPlain(nx,ny);
    const way=s=>s>0?`${s}만큼`:`${-s}만큼 (음수 방향으로)`;
    return{lv,topic:'평행이동',
      q:`점 P(${x}, ${y})를 x축의 방향으로 ${dx}만큼, y축의 방향으로 ${dy}만큼 평행이동한 점의 좌표는?`,
      svg:plane([P]),
      svgAfter:plane([P,{t:'seg',x1:x,y1:y,x2:nx,y2:ny,color:G.GREEN,width:3,dash:'8 6'},
        {t:'pt',x:nx,y:ny,label:"P'",guide:true,r:8,color:G.GREEN}]),
      choices:ch.list,ans:ch.ans,
      sol:[`평행이동은 <b>더하기</b>입니다. 방향을 바꾸지 않고 그대로 밉니다.`,
        `x좌표 : ${x} + (${dx}) = <b>${nx}</b> ${dx>0?'(오른쪽으로)':'(왼쪽으로)'}`,
        `y좌표 : ${y} + (${dy}) = <b>${ny}</b> ${dy>0?'(위로)':'(아래로)'}`,
        `따라서 (${nx}, ${ny})`],
      answer:`(${nx}, ${ny})`};
  }

  /* 상 : 대칭이동 — 옮긴 점은 그리지 않는다 */
  const how=pk(['x축','y축','원점','직선 y=x']);
  let nx=x,ny=y,rule='';
  if(how==='x축'){ny=-y;rule='x축 대칭은 <b>y의 부호만</b> 바꿉니다. (위아래로 뒤집기)';}
  else if(how==='y축'){nx=-x;rule='y축 대칭은 <b>x의 부호만</b> 바꿉니다. (좌우로 뒤집기)';}
  else if(how==='원점'){nx=-x;ny=-y;rule='원점 대칭은 <b>x, y 둘 다</b> 부호를 바꿉니다.';}
  else{nx=y;ny=x;rule='직선 y=x 대칭은 <b>x와 y의 자리를 맞바꿉니다.</b> 부호는 그대로.';}
  const ch=coordChoicesPlain(nx,ny);
  const axis=how==='x축'?[{t:'hline',y:0,color:G.RED,width:3,dash:'6 5'}]
    :how==='y축'?[{t:'vline',x:0,color:G.RED,width:3,dash:'6 5'}]
    :how==='직선 y=x'?[{t:'fn',f:t=>t,color:G.RED,width:3,dash:'8 6'}]
    :[{t:'pt',x:0,y:0,r:6,color:G.RED}];
  return{lv,topic:'대칭이동',
    q:`점 P(${x}, ${y})를 ${how}에 대하여 대칭이동한 점의 좌표는?`,
    svg:plane([...axis,P]),
    svgAfter:plane([...axis,P,{t:'seg',x1:x,y1:y,x2:nx,y2:ny,color:G.GREEN,width:3,dash:'8 6'},
      {t:'pt',x:nx,y:ny,label:"P'",guide:true,r:8,color:G.GREEN}]),
    choices:ch.list,ans:ch.ans,
    sol:[rule,
      `P(${x}, ${y}) → (${nx}, ${ny})`,
      how==='직선 y=x'?`거울이 비스듬한 선이라 자리가 바뀝니다. 부호를 바꾸지 않도록 조심하세요.`
        :`거울(빨간 선)에서 <b>같은 거리만큼 반대편</b>에 찍힌다고 생각하면 그림으로도 확인됩니다.`],
    answer:`(${nx}, ${ny})`};
}

/* ── 탭 본체 ─────────────────────────────────────────────────── */
function CoordDailyTab({userData,onUpdate}){
  const TOTAL=10;
  const ORD=['①','②','③','④'];
  const[level,setLevel]=useState(null);
  const[qs,setQs]=useState([]);          // 생성된 문항
  const[idx,setIdx]=useState(0);
  const[sel,setSel]=useState(null);
  const[phase,setPhase]=useState('pick');// pick | quiz | feedback | done
  const[recs,setRecs]=useState([]);
  const[correct,setCorrect]=useState(0);
  const[startAt,setStartAt]=useState(0);
  const[qStartAt,setQStartAt]=useState(0);
  const[firstClick,setFirstClick]=useState(null);

  const today=todayStr();
  // 오늘 이미 푼 기록이 있는지 (홈의 도장과 같은 기준)
  const doneToday=(userData.logs||[]).some(l=>l.date===today&&(l.type||'').indexOf('좌표 10문제')===0);

  const start=(k)=>{
    const list=[];for(let i=0;i<TOTAL;i++)list.push(genCoordQ(k));
    setLevel(k);setQs(list);setIdx(0);setSel(null);setRecs([]);setCorrect(0);
    setStartAt(Date.now());setQStartAt(Date.now());setFirstClick(null);setPhase('quiz');
  };

  const q=qs[idx];

  const choose=(i)=>{
    if(phase!=='quiz')return;
    if(firstClick===null)setFirstClick(Date.now()-qStartAt);
    setSel(i);
  };

  const check=()=>{
    if(sel===null||!q)return;
    const isOk=sel===q.ans;
    const rec={qTxt:q.q.slice(0,60),uAns:String(q.choices[sel]),cAns:String(q.choices[q.ans]),isOk,
      timeSec:Math.round((Date.now()-qStartAt)/1000),
      firstClickMs:firstClick,revisionCount:null,
      qTopicHash:getTopicHash({meta:{type:q.topic}}),
      meta:{category:'geometry',type:q.topic,diff:q.lv==='low'?'기초':q.lv==='mid'?'기초':'기하'}};
    setRecs(r=>[...r,rec]);
    if(isOk)setCorrect(c=>c+1);
    setPhase('feedback');
  };

  const next=async()=>{
    if(idx+1<TOTAL){
      setIdx(idx+1);setSel(null);setFirstClick(null);setQStartAt(Date.now());setPhase('quiz');
      return;
    }
    // 마지막 문항 → 기록 저장
    const badge=(COORD_LEVELS.find(l=>l.k===level)||{}).badge||'';
    const all=recs;
    const totalSec=Math.round((Date.now()-startAt)/1000);
    const log={studentName:userData.name,date:today,time:timeStr(),
      type:`좌표 10문제 (${badge})`,score:`${correct} / ${TOTAL}`,questions:all,totalSec};
    const newActiveDates=[...new Set([...(userData.activeDates||[]),today])];
    const upd={...userData,
      totalLessons:(userData.totalLessons||0)+1,
      todayLessons:(userData.todayLessons||0)+1,
      todayCorrect:(userData.todayCorrect||0)+correct,
      todayWrong:(userData.todayWrong||0)+(TOTAL-correct),
      lastDate:today,activeDates:newActiveDates,
      logs:[log,...(userData.logs||[]).slice(0,49)]};
    try{await saveUser(upd);await saveLog(log);updateQStats(all.map(r=>({...r,meta:r.meta})));}catch(e){}
    onUpdate&&onUpdate(upd);
    setPhase('done');
  };

  /* ── 난이도 고르기 ── */
  if(phase==='pick'){
    return(<div className="p-4 space-y-4 pb-36">
      <style>{`svg.plane{max-width:100%;height:auto}`}</style>
      <div>
        <div className="text-2xl font-black text-gray-800">📍 오늘의 좌표 10문제</div>
        <div className="text-sm font-bold text-gray-500 mt-1">하루 10문제면 충분합니다. 좌표는 검정고시 20문항 중 5문항입니다.</div>
      </div>

      {doneToday&&(
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 flex items-center gap-3">
          <div className="text-3xl">✅</div>
          <div>
            <div className="font-black text-emerald-800 text-base">오늘 몫은 이미 마치셨어요!</div>
            <div className="text-sm font-bold text-emerald-600 mt-0.5">더 풀고 싶으시면 아래에서 다시 고르시면 됩니다.</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {COORD_LEVELS.map(l=>(
          <button key={l.k} onClick={()=>start(l.k)}
            className={`w-full text-left bg-white rounded-3xl p-5 shadow-md active:scale-[0.98] transition-transform border-2 ${l.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl ${l.chip} flex items-center justify-center text-lg font-black shrink-0`}>{l.badge}</div>
              <div className="flex-1">
                <div className="text-lg font-black text-gray-800">{l.lbl}</div>
                <div className="text-sm font-bold text-gray-500 mt-0.5">{l.desc}</div>
              </div>
              <div className="text-2xl text-gray-300">›</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4">
        <div className="text-sm font-black text-indigo-700 mb-1">💡 이렇게 나옵니다</div>
        <div className="text-sm font-bold text-indigo-600 leading-relaxed break-keep">
          옮긴 점은 <b>그림에 그려 주지 않습니다.</b> 머릿속으로 규칙을 써서 좌표를 구하고, 답을 고른 뒤에 그림으로 확인하게 됩니다.
        </div>
      </div>
    </div>);
  }

  /* ── 다 풀었을 때 ── */
  if(phase==='done'){
    const rate=Math.round(correct/TOTAL*100);
    return(<div className="p-4 space-y-4 pb-36">
      <div className="bg-white rounded-3xl p-6 shadow-md text-center">
        <div className="text-6xl mb-3">{rate>=90?'🍎':rate>=70?'🌳':rate>=40?'🌿':'🌱'}</div>
        <div className="text-2xl font-black text-gray-800">좌표 10문제 끝!</div>
        <div className="text-4xl font-black text-indigo-600 mt-3">{correct} / {TOTAL}</div>
        <div className="text-sm font-bold text-gray-500 mt-2">
          {rate>=90?'완벽합니다. 검정고시 좌표 문항은 이제 든든합니다.'
            :rate>=70?'잘하고 계세요. 틀린 것만 다시 보면 됩니다.'
            :rate>=40?'규칙을 조금씩 익히고 계세요. 내일 또 10문제!'
            :'오늘은 여기까지도 충분합니다. 부호 규칙부터 다시 봐요.'}
        </div>
      </div>
      <div className="bg-white rounded-3xl p-4 shadow-sm space-y-2">
        {recs.map((r,i)=>(
          <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${r.isOk?'bg-emerald-50':'bg-red-50'}`}>
            <div className="text-xl">{r.isOk?'⭕':'❌'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-700 truncate">{i+1}. {r.meta.type}</div>
              {!r.isOk&&<div className="text-xs font-bold text-red-500 mt-0.5">내 답 {r.uAns} · 정답 {r.cAns}</div>}
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>setPhase('pick')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">
        한 번 더 풀기
      </button>
    </div>);
  }

  /* ── 문제 화면 ── */
  const lvInfo=COORD_LEVELS.find(l=>l.k===q.lv)||COORD_LEVELS[0];
  return(<div className="p-4 space-y-4 pb-36">
    <style>{`svg.plane{max-width:100%;height:auto}`}</style>

    <div className="flex items-center gap-3">
      <button onClick={()=>setPhase('pick')} className="text-sm font-bold text-gray-400 px-3 py-2 bg-gray-100 rounded-xl">← 그만</button>
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{width:`${(idx+(phase==='feedback'?1:0))/TOTAL*100}%`}}></div>
        </div>
      </div>
      <div className="text-sm font-black text-gray-600 shrink-0">{idx+1} / {TOTAL}</div>
    </div>

    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-black px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700">{lvInfo.badge}</span>
        <span className="text-xs font-bold text-gray-400">{q.topic}</span>
      </div>
      <div className="text-lg font-black text-gray-800 leading-relaxed break-keep mb-4">{q.q}</div>
      <div className="flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{__html:phase==='feedback'?q.svgAfter:q.svg}}/>
      {phase==='quiz'&&(q.lv!=='low')&&(
        <div className="text-center text-xs font-bold text-gray-400 mt-2">옮겨진 점은 일부러 그리지 않았습니다. 규칙으로 구해 보세요.</div>
      )}
    </div>

    <div className="grid grid-cols-2 gap-3">
      {q.choices.map((c,i)=>{
        const isSel=sel===i,isAns=i===q.ans;
        let cls='bg-white border-gray-200 text-gray-700';
        if(phase==='feedback'){
          if(isAns)cls='bg-emerald-500 border-emerald-500 text-white';
          else if(isSel)cls='bg-red-100 border-red-300 text-red-600';
          else cls='bg-white border-gray-200 text-gray-400';
        }else if(isSel)cls='bg-indigo-500 border-indigo-500 text-white';
        return(
          <button key={i} onClick={()=>choose(i)} disabled={phase==='feedback'}
            className={`py-4 px-3 rounded-2xl border-2 font-black text-lg transition-all active:scale-95 ${cls}`}>
            <span className="opacity-60 mr-1">{ORD[i]}</span> {c}
          </button>
        );
      })}
    </div>

    {phase==='feedback'&&(
      <div className={`rounded-3xl p-5 border-2 ${sel===q.ans?'bg-emerald-50 border-emerald-300':'bg-amber-50 border-amber-300'}`}>
        <div className="font-black text-lg mb-2 text-gray-800">
          {sel===q.ans?'⭕ 맞았습니다!':`❌ 정답은 ${q.answer} 입니다`}
        </div>
        <ol className="space-y-1.5">
          {q.sol.map((s,i)=>(
            <li key={i} className="text-sm font-bold text-gray-700 leading-relaxed break-keep"
              dangerouslySetInnerHTML={{__html:`${i+1}. ${s}`}}/>
          ))}
        </ol>
        <div className="text-xs font-bold text-gray-400 mt-3">위 그림의 초록 점이 옮겨진 자리입니다.</div>
      </div>
    )}

    {phase==='quiz'
      ?<button onClick={check} disabled={sel===null}
        className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${sel===null?'bg-gray-200 text-gray-400':'bg-indigo-600 text-white'}`}>
        확인하기
      </button>
      :<button onClick={next}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">
        {idx+1<TOTAL?'다음 문제 →':'결과 보기 →'}
      </button>}
  </div>);
}
