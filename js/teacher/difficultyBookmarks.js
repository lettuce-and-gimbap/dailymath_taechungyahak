function DifficultyBookmarksTab(){
  const[rows,setRows]=useState([]),[loading,setLoading]=useState(true),[err,setErr]=useState(''),[student,setStudent]=useState('전체');
  const load=async()=>{setLoading(true);setErr('');try{const snap=await db.collection('questionDifficultyBookmarks').orderBy('createdAt','desc').limit(500).get();setRows(snap.docs.map(d=>({id:d.id,...d.data()})));}
    catch(e){console.error(e);setErr('어려움 표시 기록을 불러오지 못했어요. 연결 상태를 확인해 주세요.');}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const names=['전체',...new Set(rows.map(r=>r.studentName).filter(Boolean).sort())];
  const shown=student==='전체'?rows:rows.filter(r=>r.studentName===student);
  const counts={};shown.forEach(r=>{const k=r.topic||r.source||'분류 없음';counts[k]=(counts[k]||0)+1;});
  return <div className="p-4 pb-28 space-y-4"><div className="bg-white p-5 rounded-3xl shadow-sm"><h2 className="text-2xl font-black">🔖 학생이 어렵다고 표시한 문제</h2><p className="text-sm text-gray-500 mt-2">학생의 자기보고 기록입니다. 실제 정답률과 구분해 어려움 패턴을 살펴보세요.</p>
    <div className="flex gap-2 mt-4"><select className="flex-1 p-3 rounded-xl border font-bold" value={student} onChange={e=>setStudent(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select><button onClick={load} className="px-4 rounded-xl bg-indigo-600 text-white font-black">새로고침</button></div>
    {Object.keys(counts).length>0&&<div className="mt-4 flex flex-wrap gap-2">{Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=><span key={k} className="px-3 py-2 rounded-full bg-amber-50 text-amber-900 text-xs font-black">{k} · {v}회</span>)}</div>}
  </div>{loading?<div className="p-6 text-center font-bold text-gray-500">불러오는 중…</div>:err?<div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl font-bold">{err}</div>:shown.length===0?<div className="p-6 bg-white rounded-2xl text-center text-gray-500 font-bold">아직 표시된 문제가 없어요.</div>:shown.map(r=><article key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100"><div className="flex justify-between gap-2 text-xs font-bold text-gray-400"><span>{r.studentName} · {r.topic||r.source}</span><span>{r.date||''} {r.time||''}</span></div><div className="mt-3 font-bold whitespace-pre-wrap">{r.qFull||'(문제 내용 없음)'}</div>{r.choices?.length>0&&<ol className="mt-2 text-sm text-gray-600">{r.choices.map((c,i)=><li key={i}>{'①②③④'[i]||`${i+1}.`} {c}</li>)}</ol>}</article>)}</div>;
}
