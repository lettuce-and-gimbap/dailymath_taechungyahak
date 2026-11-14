function StudentWrongNotePractice({userData,onBack}){
  const[days,setDays]=useState(7),[active,setActive]=useState(false),[idx,setIdx]=useState(0),[sel,setSel]=useState(null),[revealed,setRevealed]=useState(false);
  const[allLogs,setAllLogs]=useState(userData.logs||[]),[coordStage,setCoordStage]=useState(0);
  useEffect(()=>{let live=true;db.collection('math_logs').where('studentName','==',userData.name).get().then(s=>{if(!live)return;const merged=s.docs.map(d=>d.data());setAllLogs(merged.length?merged:userData.logs||[]);}).catch(()=>{});return()=>{live=false;};},[userData.name]);
  const cutoff=Date.now()-Number(days)*86400000;
  const qs=allLogs.flatMap(log=>(log.questions||[]).filter(q=>!q.isOk).map(q=>({...q,logDate:log.date,logType:log.type})))
    .filter(q=>{const t=Date.parse(q.logDate||'');return days==='all'||(!Number.isNaN(t)&&t>=cutoff);});
  const q=qs[idx];
  let coordReplay=null;try{if(q?.cSeed&&q?.cLv)coordReplay=withSeed(q.cSeed,()=>genCoordQ(q.cLv,q.cGrid==null?undefined:{circleGrid:q.cGrid}));}catch(e){console.warn('좌표 오답 그림 재생성 실패',e);}
  const start=()=>{setIdx(0);setSel(null);setRevealed(false);setCoordStage(0);setActive(true);};
  const steps=String(q?.explanation||q?.sol||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(!active)return <div className="p-4 pb-36 space-y-4"><button onClick={onBack} className="px-3 py-2 bg-gray-100 rounded-xl font-bold">← 문제풀이 메뉴</button>
    <div className="bg-white rounded-3xl p-5 shadow"><h2 className="text-2xl font-black">📒 오답노트</h2><p className="mt-2 text-gray-600 font-bold">최근 틀린 문제를 다시 풀고, 풀이와 해설을 확인해요.</p>
      <label className="block mt-5 font-black">오답 범위 <select value={days} onChange={e=>setDays(e.target.value==='all'?'all':Number(e.target.value))} className="ml-2 p-2 rounded-lg border">
        <option value={3}>최근 3일</option><option value={7}>최근 7일</option><option value={14}>최근 14일</option><option value={30}>최근 30일</option><option value="all">전체 누적</option></select></label>
      <p className="mt-3 text-sm text-gray-500">해당 범위의 오답 {qs.length}문제 · 같은 문제를 여러 번 틀린 기록은 각각 남아요.</p>
      <button disabled={!qs.length} onClick={start} className="mt-5 w-full p-4 rounded-2xl bg-indigo-600 text-white font-black disabled:bg-gray-300">오답노트 풀기</button></div></div>;
  if(!q)return <div className="p-5"><p>이 범위에는 오답 기록이 없어요.</p><button onClick={()=>setActive(false)} className="mt-4 p-3 bg-indigo-600 text-white rounded-xl">범위 다시 선택</button></div>;
  const choices=q.choices||[];const ans=Number(q.answerIdx);const graphQ={q:q.qFull||q.qTxt||q.q||'',choices,answer:ans,graph:q.graph,meta:q.meta};
  return <div className="p-4 pb-36 space-y-4"><div className="flex items-center justify-between"><button onClick={()=>setActive(false)} className="px-3 py-2 bg-gray-100 rounded-xl font-bold">← 범위</button><span className="font-black">오답 {idx+1} / {qs.length}</span></div>
    <div className="bg-white rounded-3xl p-5 shadow"><div className="text-xs text-gray-400 font-bold mb-2">{q.logDate} · {q.logType||'문제풀이'}</div>
      {choices.length?<MockQBody q={graphQ} sel={sel} isGraded={revealed} readOnly={revealed} onPick={setSel}/>:<><div className="text-lg font-bold whitespace-pre-wrap">{graphQ.q}</div><input value={sel||''} onChange={e=>setSel(e.target.value)} placeholder="답을 입력해 보세요" disabled={revealed} className="mt-3 w-full p-3 border-2 rounded-xl"/></>}
      {!revealed&&<button disabled={choices.length?sel===null:!String(sel||'').trim()} onClick={()=>setRevealed(true)} className="mt-4 w-full p-3 bg-indigo-600 text-white rounded-xl font-black disabled:bg-gray-300">정답 확인</button>}
      {revealed&&<div className="mt-4 space-y-3"><div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl font-black">{choices.length?'정답':'기록된 정답'}: {choices[ans]??q.cAns??'기록된 정답 없음'}{!choices.length&&<span className="block mt-1 text-sm">입력한 답: {sel}</span>}</div>
        <div className="font-black">단계별 해설</div>{steps.length?steps.map((s,i)=><div key={i} className="p-3 bg-slate-50 border-l-4 border-indigo-400 rounded-r-xl"><b>{i+1}단계</b> · {s}</div>):<p className="text-sm text-gray-600">이 문항에는 저장된 단계별 해설이 없어요. 정답과 당시 풀이 기록을 확인해 주세요.</p>}
        {coordReplay&&<div className="p-3 bg-indigo-50 rounded-xl"><div className="text-sm font-black text-indigo-900">좌표 풀이 그림 · {q.cGrid!=null?(q.cGrid?'격자 있음':'격자 없음'):'원래 출제 형식'}</div>
          <div key={`${q.cSeed}-${coordStage}`} className="my-2 flex justify-center" style={{opacity:1,transform:coordStage?'translateY(0) scale(1)':'translateY(0) scale(.99)',transition:'opacity .35s ease, transform .35s ease'}} dangerouslySetInnerHTML={{__html:coordStage===0?coordReplay.svg:coordReplay.svgAfter||coordReplay.svg}}/>
          <button onClick={()=>setCoordStage(coordStage?0:1)} className="px-3 py-2 bg-white rounded-lg border border-indigo-200 text-sm font-black">{coordStage?'문제 그림 보기':'풀이 그림 보기'}</button>
          <p className="mt-2 text-xs text-indigo-700">문제 그림에서 풀이 그림으로 바꾸며 점의 이동과 관계를 확인해요.</p></div>}
        <button onClick={()=>{if(idx+1<qs.length){setIdx(idx+1);setSel(null);setRevealed(false);setCoordStage(0);}else setActive(false);}} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-black">{idx+1<qs.length?'다음 오답 →':'마치기'}</button></div>}
    </div></div>;
}
