// 학생이 문제별로 직접 표시한 어려움 기록
async function saveQuestionBookmark(studentName, question, source){
  if(!db||!studentName||!question)return false;
  const record={studentName,source:source||'문제풀이',date:todayStr(),time:timeStr(),
    topic:question.topic||question.meta?.type||question.meta?.category||source||'분류 없음',
    qFull:String(question.qFull||question.qTxt||question.q||''),
    choices:Array.isArray(question.choices)?question.choices.map(String):[],
    answerIdx:Number.isFinite(Number(question.answerIdx))?Number(question.answerIdx):null,
    explanation:String(question.explanation||question.sol||''),meta:question.meta||null,
    graph:question.graph||null,cSeed:question.cSeed||null,cLv:question.cLv||null,cGrid:question.cGrid??null,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()};
  try{await db.collection('questionDifficultyBookmarks').add(record);return true;}
  catch(e){console.error('문제 어려움 표시 저장 실패',e);return false;}
}

function QuestionDifficultyBookmark({userData,question,source='문제풀이'}){
  const[status,setStatus]=useState('idle');
  const save=async()=>{if(status==='saving'||status==='saved')return;setStatus('saving');
    setStatus(await saveQuestionBookmark(userData?.name,question,source)?'saved':'error');};
  return <div className="mt-3"><button type="button" onClick={save} disabled={status==='saving'||status==='saved'}
    className={`px-3 py-2 rounded-xl border-2 text-sm font-black ${status==='saved'?'bg-emerald-50 border-emerald-300 text-emerald-800':'bg-amber-50 border-amber-300 text-amber-900'}`}>
    {status==='saved'?'✅ 선생님께 어려운 문제로 저장했어요':status==='saving'?'저장 중…':'🔖 선생님 이 문제 어려워요!'}</button>
    {status==='error'&&<span role="alert" className="ml-2 text-xs text-red-600 font-bold">저장하지 못했어요. 다시 눌러 주세요.</span>}</div>;
}
