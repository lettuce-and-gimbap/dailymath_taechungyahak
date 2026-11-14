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
  try{return await db.collection('questionDifficultyBookmarks').add(record);}
  catch(e){console.error('문제 어려움 표시 저장 실패',e);return false;}
}

function QuestionDifficultyBookmark({userData,question,source='문제풀이'}){
  // 문제를 바꾸면 이전 문제의 저장 상태와 문서 참조를 사용하지 않는다.
  const key=JSON.stringify([userData?.name,source,question?.qFull,question?.qTxt,question?.q,question?.choices,question?.answerIdx,question?.cSeed,question?.cLv]);
  return <QuestionDifficultyBookmarkButton key={key} userData={userData} question={question} source={source}/>;
}
function QuestionDifficultyBookmarkButton({userData,question,source}){
  const[status,setStatus]=useState('idle');
  const[bookmarkRef,setBookmarkRef]=useState(null);
  const[error,setError]=useState('');
  const toggle=async()=>{
    if(status==='saving'||status==='removing')return;
    setError('');
    if(bookmarkRef){
      setStatus('removing');
      try{await bookmarkRef.delete();setBookmarkRef(null);setStatus('idle');}
      catch(e){console.error('문제 어려움 표시 취소 실패',e);setStatus('saved');setError('취소하지 못했어요. 다시 눌러 주세요.');}
      return;
    }
    setStatus('saving');
    const ref=await saveQuestionBookmark(userData?.name,question,source);
    if(ref){setBookmarkRef(ref);setStatus('saved');}
    else{setStatus('idle');setError('저장하지 못했어요. 다시 눌러 주세요.');}
  };
  const busy=status==='saving'||status==='removing';
  return <div className="mt-3"><button type="button" onClick={toggle} disabled={busy} aria-pressed={status==='saved'}
    className={`px-3 py-2 rounded-xl border-2 text-sm font-black ${status==='saved'?'bg-emerald-50 border-emerald-300 text-emerald-800':'bg-amber-50 border-amber-300 text-amber-900'}`}>
    {status==='saved'?'✅ 저장했어요 · 다시 누르면 취소':status==='saving'?'저장 중…':status==='removing'?'취소 중…':'🔖 선생님 이 문제 어려워요!'}</button>
    {error&&<span role="alert" className="ml-2 text-xs text-red-600 font-bold">{error}</span>}</div>;
}
