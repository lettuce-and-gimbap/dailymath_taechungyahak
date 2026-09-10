// === js/student/history.js ===
/* --------------------------------------------------------------------
   기록 탭
   지난 학습 회차 목록과 다시 보기
   -------------------------------------------------------------------- */

/* ===== HISTORY TAB ===== */
function HistoryTab({userData, feedbacks}){
  const allLogs=userData.logs||[];
  const fbs = feedbacks || [];
  const[open,setOpen]=useState(null);
  const[showFbs, setShowFbs] = useState(false);
  const[showAll,setShowAll]=useState(false);
  const[printLog,setPrintLog]=useState(null);
  const[showReport,setShowReport]=useState(false);
  const recentLogs=allLogs.filter(isRecentLog);
  const olderCount=allLogs.length-recentLogs.length;
  const logs=showAll?allLogs:recentLogs;

  return(<div className="p-4 pb-36 space-y-3">
    
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

    <div className="flex items-center justify-between mt-4 mb-2">
      <div className="text-lg font-black text-gray-700">📅 학습 기록 {showAll?'(전체)':'(최근 5일)'}</div>
      <div className="flex gap-2">
        <button onClick={()=>setShowReport(true)} className="text-xs font-bold px-3 py-1.5 bg-indigo-600 text-white rounded-xl">📊 나의 리포트</button>
        {olderCount>0&&<button onClick={()=>setShowAll(!showAll)} className="text-xs font-bold px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl">{showAll?'최근만 보기 ▲':`더보기 ${olderCount}개 ▼`}</button>}
      </div>
    </div>
    {allLogs.length===0&&<div className="text-center text-gray-400 py-12 text-base font-bold">아직 완료한 레슨이 없어요.<br/>문제를 풀어보세요!</div>}
    {allLogs.length>0&&logs.length===0&&<div className="text-center text-gray-400 py-8 text-sm font-bold">최근 5일간 학습 기록이 없어요.<br/>아래 '더보기'로 지난 기록을 볼 수 있어요.</div>}
    {logs.map((log,i)=>{const isOpen=open===i;return(<div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="flex-1"><div className="font-bold text-gray-800 text-base">{fmtDate(log.date)} {log.time}</div>
          <div className="text-sm text-gray-500 mt-0.5">{log.type} · 점수 {log.score}{log.totalSec?` · ⏱️ ${Math.floor(log.totalSec/60)}분 ${log.totalSec%60}초`:''}</div></div>
        <button onClick={()=>setPrintLog(log)} className="text-sm text-emerald-700 font-bold px-3 py-1.5 bg-emerald-50 rounded-xl">🖨️ 인쇄</button>
        <button onClick={()=>setOpen(isOpen?null:i)} className="text-sm text-indigo-600 font-bold px-3 py-1.5 bg-indigo-50 rounded-xl">{isOpen?'닫기':'보기'}</button>
      </div>
      {isOpen&&log.questions&&log.questions.length>0&&(<div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {log.questions.map((q,j)=><div key={j} className={`rounded-xl p-3 text-sm ${q.isOk?'bg-green-50':'bg-red-50'}`}>
          <div className="flex gap-2"><span className="font-bold text-gray-500">Q{j+1}.</span><span className="font-bold text-gray-800 flex-1">{q.qTxt}</span><span className={`font-black ${q.isOk?'text-green-600':'text-red-500'}`}>{q.isOk?'O':'X'}</span></div>
          {q.examSource&&<div className="mt-1 pl-6 text-xs text-blue-500 font-bold">📌 {q.examSource}</div>}
          {!q.isOk&&<div className="mt-1 pl-6 text-xs text-gray-500">내 답: <span dangerouslySetInnerHTML={{__html:autoMathHtml(String(q.uAns??''))}}/> → 정답: <span className="text-indigo-600 font-bold" dangerouslySetInnerHTML={{__html:autoMathHtml(String(q.cAns??''))}}/></div>}
          {q.explanation&&<div className="mt-2 pl-6 text-xs text-amber-800 leading-relaxed">💡 <span dangerouslySetInnerHTML={{__html:autoMathHtml(q.explanation)}}/></div>}
          {q.timeSec!==undefined&&<div className="mt-0.5 pl-6 text-xs text-indigo-400 font-bold">⏱️ {q.timeSec}초</div>}
        </div>)}
      </div>)}
    </div>)})}
    {printLog&&<SessionPrintModal log={printLog} onClose={()=>setPrintLog(null)}/>}
    {showReport&&<StudentLearningReport userData={userData} onClose={()=>setShowReport(false)}/>}
  </div>);
}
