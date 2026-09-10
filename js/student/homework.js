// === js/student/homework.js ===
/* --------------------------------------------------------------------
   숙제 세션
   선생님이 내준 문제지를 학생이 푸는 화면
   -------------------------------------------------------------------- */

/* ===== 숙제 세션 ===== */
function HomeworkSession({homework,userData,onUpdate,onDone}){
  const ORD=['①','②','③','④'];
  const[idx,setIdx]=useState(0);
  const[selected,setSelected]=useState(null);
  const[phase,setPhase]=useState('question');
  const[results,setResults]=useState([]);
  const[correctCount,setCorrectCount]=useState(0);
  const[startTime]=useState(Date.now());
  const q=homework.questions[idx];
  const total=homework.questions.length;

  const check=()=>{
    if(selected===null)return;
    const isOk=selected===q.answer;
    const newRes=[...results,{qTxt:(q.q||q.topic||'').slice(0,40),uAns:q.choices[selected],cAns:q.choices[q.answer],isOk,meta:{category:'exam5',type:q.topic||'숙제',diff:'기초'}}];
    setResults(newRes);
    const newCorrect=correctCount+(isOk?1:0);
    setCorrectCount(newCorrect);
    if(idx+1>=total){
      finishHomework(newRes,newCorrect);
      setPhase('done');
    } else {
      setPhase('feedback');
    }
  };

  const nextQ=()=>{setIdx(i=>i+1);setSelected(null);setPhase('question');};

  const finishHomework=async(res,correct)=>{
    try{
      await db.collection('homework').doc(homework.id).update({
        completedBy:firebase.firestore.FieldValue.arrayUnion(userData.name)
      });
      const log={studentName:userData.name,date:todayStr(),time:timeStr(),
        type:`숙제: ${homework.title}`,score:`${correct}/${total}`,
        questions:res,totalSec:Math.round((Date.now()-startTime)/1000),feeling:null};
      await saveLog(log);
      const upd={...userData,logs:[log,...(userData.logs||[]).slice(0,49)]};
      await saveUser(upd);onUpdate(upd);
    }catch(e){}
  };

  if(phase==='done'){
    const pct=Math.round(correctCount/total*100);
    return(
      <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center bg-gray-50 max-w-lg mx-auto">
        <div className="text-8xl mb-4">🎉</div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">숙제 완료!</h2>
        <p className="text-gray-500 text-lg mb-2 font-bold">{homework.title}</p>
        <div className="bg-white rounded-3xl p-6 shadow-md w-full max-w-xs mb-4">
          <div className="text-6xl font-black text-green-500 mb-1">{correctCount}<span className="text-2xl text-gray-400">/{total}</span></div>
          <div className="text-gray-500 font-bold mb-3">정답</div>
          <div className={`text-2xl font-black ${pct>=80?'text-green-600':pct>=60?'text-amber-500':'text-red-500'}`}>{pct}점</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white mb-6 w-full max-w-xs">
          <div className="text-2xl mb-2">🌟</div>
          <div className="font-black text-lg mb-1">
            {pct>=90?'완벽해요! 정말 대단해요! 👏':pct>=70?'정말 잘했어요! 훌륭합니다! 💪':'끝까지 풀어줘서 고마워요! 다음엔 더 잘할 거예요! 🌈'}
          </div>
          <div className="text-sm opacity-90">선생님이 기록을 확인하실 거예요!</div>
        </div>
        <button onClick={onDone} className="w-full max-w-xs py-4 bg-indigo-500 text-white rounded-2xl font-black text-xl active:scale-95 transition-transform">홈으로 🏠</button>
      </div>
    );
  }

  const pct=Math.round((idx/total)*100);
  return(
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50" style={{overflowX:'hidden'}}>
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <div className="text-lg font-black text-indigo-700 flex-1 truncate">📝 {homework.title}</div>
        <div className="text-sm font-bold text-gray-400">{idx+1}/{total}</div>
      </header>
      <div className="flex-1 p-4 space-y-4 pb-36">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-md">
          <div className="inline-block bg-indigo-100 text-indigo-700 text-xs font-black px-3 py-1 rounded-full mb-3">{q.topic||homework.level||'검정고시'}</div>
          {q.graph?.type==='system_eq'&&<div className="flex justify-center mb-3"><GraphPreview q={q}/></div>}
          <div className="text-base font-bold text-gray-800 leading-relaxed">{q.q}</div>
          {q.graph&&q.graph.type!=='system_eq'&&<div className="flex justify-center mt-3"><GraphPreview q={q}/></div>}
        </div>
        {phase==='question'&&(
          <div className="flex flex-col gap-3">
            {q.choices.map((c,i)=>(
              <button key={i} onClick={()=>setSelected(i)}
                className={`p-4 rounded-2xl border-2 text-base font-bold transition-all text-left leading-relaxed ${selected===i?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 bg-white text-gray-700'}`}>
                <span className="text-indigo-900 mr-1">{ORD[i]}</span> <MathText v={c}/>
              </button>
            ))}
            <button onClick={check} disabled={selected===null} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg disabled:opacity-40 active:scale-95 transition-all mt-2">
              제출하기 ✓
            </button>
          </div>
        )}
        {phase==='feedback'&&(
          <div className="space-y-3">
            <div className={`rounded-2xl px-5 py-4 text-base font-bold flex items-center gap-3 ${selected===q.answer?'bg-green-50 text-green-700 border-2 border-green-300':'bg-red-50 text-red-700 border-2 border-red-300'}`}>
              {selected===q.answer?'✅ 정답입니다! 잘했어요!':` ❌ 아쉬워요! 정답은 ${ORD[q.answer]} ${q.choices[q.answer]}입니다.`}
            </div>
            {Array.isArray(q.sol)&&q.sol.length>0&&(
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                <div className="text-xs font-black text-amber-600 mb-2">📖 풀이</div>
                <div className="space-y-1">{q.sol.map((s,i)=><div key={i} className="text-sm text-gray-700 font-medium">{s}</div>)}</div>
              </div>
            )}
            <button onClick={nextQ} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">
              다음 문제 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
