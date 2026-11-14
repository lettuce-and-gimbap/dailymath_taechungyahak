// === js/teacher/wrongNotePanel.js ===
/* --------------------------------------------------------------------
   오답 노트 화면
   영역별 오답 패널 · 학생 의견 패널
   -------------------------------------------------------------------- */

function WrongQCategoryPanel({allWrongQs,wrongQSel,setWrongQSel,wrongQShowAns,setWrongQShowAns,studentName}){
  // 카테고리별로 그룹화
  const grouped=React.useMemo(()=>{
    const map={};
    allWrongQs.forEach((q,i)=>{
      const cat=classifyWrongQTopic(q);
      if(!map[cat])map[cat]=[];
      map[cat].push({q,i});
    });
    return map;
  },[allWrongQs]);

  const cats=WRONG_Q_CATEGORY_ORDER.filter(c=>grouped[c]);
  const [openCats,setOpenCats]=React.useState(new Set()); // 기본 전부 접힘
  const [randomCount,setRandomCount]=React.useState('');

  const toggleCat=cat=>setOpenCats(prev=>{const s=new Set(prev);s.has(cat)?s.delete(cat):s.add(cat);return s;});

  const selAllCat=(cat)=>{
    const items=grouped[cat]||[];
    const allOn=items.every(({i})=>wrongQSel.has(i));
    setWrongQSel(prev=>{
      const s=new Set(prev);
      items.forEach(({i})=>allOn?s.delete(i):s.add(i));
      return s;
    });
  };

  const allOn=allWrongQs.length>0&&allWrongQs.every((_,i)=>wrongQSel.has(i));
  const selAll=()=>setWrongQSel(allOn?new Set():new Set(allWrongQs.map((_,i)=>i)));

  const applyRandom=()=>{
    const cnt=parseInt(randomCount,10);
    if(!cnt||cnt<1)return;
    const total=allWrongQs.length;
    const actual=Math.min(cnt,total);
    const indices=Array.from({length:total},(_,i)=>i);
    for(let i=indices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
    setWrongQSel(new Set(indices.slice(0,actual)));
  };

  const ORD=['①','②','③','④'];

  const printSelected=()=>{
    const qs=Array.from(wrongQSel).map(i=>allWrongQs[i]);
    if(!qs.length)return;
    const showAns=wrongQShowAns;
    let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @page{size:A4;margin:20mm 15mm;}
      *{box-sizing:border-box;}
      body{font-family:'Noto Sans KR',sans-serif;padding:16px;color:#111;font-size:14px;}
      h1{text-align:center;font-size:20px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:16px;}
      .cat{font-size:13px;font-weight:900;color:#6d28d9;background:#ede9fe;padding:4px 10px;border-radius:6px;margin:18px 0 8px 0;}
      .q{margin-bottom:24px;page-break-inside:avoid;break-inside:avoid;}
      .qnum{font-weight:900;color:#dc2626;}
      .qtxt{font-size:14px;font-weight:700;line-height:1.6;display:inline;}
      .graph{margin:8px 0;}
      .choices{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px;margin-left:14px;}
      .choice{font-size:13px;padding:3px 0;}
      .ans{margin-top:6px;margin-left:14px;font-size:12px;color:#dc2626;font-weight:700;}
      .exp{margin-top:4px;margin-left:14px;padding:6px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:11px;color:#78350f;}
      @media print{body{padding:0;}.no-print{display:none!important;}}
    </style></head><body>
    <h1>${studentName} 학생 — 오답 문제지</h1>`;
    let num=1;
    WRONG_Q_CATEGORY_ORDER.forEach(cat=>{
      const items=(grouped[cat]||[]).filter(({i})=>wrongQSel.has(i));
      if(!items.length)return;
      html+=`<div class="cat">▶ ${cat}</div>`;
      items.forEach(({q})=>{
        const effGraph=tryReconstructGraph(q);
        const graphSvg=effGraph?`<div class="graph">${graphToSVGStr(effGraph)}</div>`:'';
        const choicesHtml=Array.isArray(q.choices)?`<div class="choices">${q.choices.map((c,j)=>`<div class="choice">${ORD[j]||String(j+1)} ${c}</div>`).join('')}</div>`:'';
        const ansText=q.cAns||(Array.isArray(q.choices)&&q.answer!=null?q.choices[q.answer]:'');
        html+=`<div class="q"><span class="qnum">${num++}.</span> <span class="qtxt">${restoreQText(q)||''}</span>${graphSvg}${choicesHtml}`;
        if(showAns)html+=`<div class="ans">정답: ${ansText}</div>${q.explanation?`<div class="exp">${q.explanation}</div>`:''}`;
        html+=`</div>`;
      });
    });
    html+=`</body></html>`;
    const w=window.open('','_blank','width=860,scrollbars=yes');
    if(!w){alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');return;}
    w.document.write(html);
    w.document.close();
    w.onload=()=>{setTimeout(()=>w.print(),200);};
    setTimeout(()=>w.print(),900);
  };

  const sendHomework=async()=>{
    const qs=Array.from(wrongQSel).map(i=>allWrongQs[i]);
    if(!confirm(`오답 ${qs.length}문제를 ${studentName} 학생에게 숙제로 내시겠어요?`))return;
    try{
      const now=new Date();const exp=new Date(now);exp.setDate(exp.getDate()+7);
      const hwQs=qs.map(q=>({q:restoreQText(q)||'',choices:q.choices||[],answer:q.answerIdx??q.answer??0,topic:q.topic||'오답 재도전',explanation:q.explanation||''}));
      await db.collection('homework').add({title:`${studentName} 학생 오답 문제지`,level:'오답',questions:hwQs,active:true,createdAt:now,expiresAt:exp,completedBy:[],assignedTo:[studentName]});
      alert('✅ 숙제로 등록되었습니다!');
    }catch(e){alert('등록 실패');}
  };

  return(<div>
    <div className="text-xs text-red-500 mb-2">유형별로 묶었습니다. 원하는 문제를 선택해 인쇄하세요.</div>
    {/* 전체 선택 / 해제 */}
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      <button onClick={selAll} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${allOn?'bg-red-400 text-white':'bg-gray-100 text-gray-600'}`}>{allOn?'✓ 전체 해제':'전체 선택'}</button>
      <button onClick={()=>setWrongQSel(new Set())} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold">전체 해제</button>
      <label className="flex items-center gap-1.5 ml-auto text-xs font-bold text-gray-600">
        <input type="checkbox" checked={wrongQShowAns} onChange={e=>setWrongQShowAns(e.target.checked)}/>해설 포함
      </label>
    </div>
    {/* 랜덤 출제 개수 선택 */}
    <div className="flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
      <span className="text-xs font-black text-indigo-700 flex-shrink-0">🎲 랜덤 출제</span>
      <input
        type="number" min="1" max={allWrongQs.length} value={randomCount}
        onChange={e=>setRandomCount(e.target.value)}
        placeholder={`1~${allWrongQs.length}`}
        className="w-20 text-xs border border-indigo-200 rounded-lg px-2 py-1 text-center font-bold bg-white"
      />
      <span className="text-xs text-indigo-600 font-bold">문항</span>
      <button
        onClick={applyRandom}
        disabled={!randomCount||parseInt(randomCount,10)<1}
        className="text-xs px-3 py-1 bg-indigo-500 text-white rounded-lg font-black disabled:opacity-40 active:scale-95 transition-all"
      >랜덤 선택</button>
      <span className="text-[10px] text-indigo-400 font-bold">(전체 {allWrongQs.length}개 중)</span>
    </div>
    {/* 카테고리별 아코디언 */}
    <div className="space-y-2 mb-3">
      {cats.map(cat=>{
        const items=grouped[cat];
        const catOn=items.every(({i})=>wrongQSel.has(i));
        const catSome=items.some(({i})=>wrongQSel.has(i));
        const isOpen=openCats.has(cat);
        return(<div key={cat} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* 카테고리 헤더 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer" onClick={()=>toggleCat(cat)}>
            <input type="checkbox" checked={catOn} ref={el=>{if(el)el.indeterminate=catSome&&!catOn;}} onChange={e=>{e.stopPropagation();selAllCat(cat);}} onClick={e=>e.stopPropagation()} className="w-4 h-4 rounded flex-shrink-0"/>
            <span className="flex-1 text-xs font-black text-gray-700">📂 {cat} <span className="text-gray-400 font-normal">({items.length}문항)</span></span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catSome?'bg-red-100 text-red-600':'bg-gray-100 text-gray-400'}`}>{items.filter(({i})=>wrongQSel.has(i)).length}개 선택</span>
            <button onClick={e=>{e.stopPropagation();selAllCat(cat);}} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-500">{catOn?'해제':'전체'}</button>
            <span className="text-gray-400 text-xs">{isOpen?'▲':'▼'}</span>
          </div>
          {/* 문항 목록 */}
          {isOpen&&<div className="divide-y divide-gray-100">
            {items.map(({q,i})=>{
              const on=wrongQSel.has(i);
              return(<label key={i} className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${on?'bg-red-50':'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={on} onChange={()=>setWrongQSel(prev=>{const s=new Set(prev);on?s.delete(i):s.add(i);return s;})} className="mt-0.5 w-4 h-4 flex-shrink-0 rounded"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 mb-0.5">{q._logDate} · {fmtLogType(q._logType)}</div>
                  <LogQView q={q} logType={q._logType}/>
                </div>
              </label>);
            })}
          </div>}
        </div>);
      })}
    </div>
    {/* 액션 버튼 */}
    {wrongQSel.size>0&&<div className="flex flex-col gap-2">
      <button onClick={printSelected} className="w-full py-3 bg-red-500 text-white rounded-2xl font-black text-sm active:scale-95">
        🖨️ 선택 오답 {wrongQSel.size}개 인쇄 ({wrongQShowAns?'해설 포함':'문제만'})
      </button>
      <button onClick={sendHomework} className="w-full py-3 bg-amber-500 text-white rounded-2xl font-black text-sm active:scale-95">
        📝 선택 오답 {wrongQSel.size}개 → {studentName} 학생에게 숙제로 내기
      </button>
    </div>}
  </div>);
}

function StudentFeedbackPanel(){
  const[msgs,setMsgs]=React.useState([]);
  const[loading,setLoading]=React.useState(false);
  const[collapsed,setCollapsed]=React.useState(true);
  const[selIds,setSelIds]=React.useState(new Set());

  const load=async()=>{
    setLoading(true);setSelIds(new Set());
    try{const snap=await db.collection('studentFeedback').orderBy('sentAt','desc').limit(30).get();const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));setMsgs(arr);}catch(e){}
    setLoading(false);
  };
  React.useEffect(()=>{load();},[]);

  const fmtTime=ts=>{if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleDateString('ko-KR')+' '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});};
  const markRead=async(id)=>{try{await db.collection('studentFeedback').doc(id).set({read:true},{merge:true});setMsgs(prev=>prev.map(m=>m.id===id?{...m,read:true}:m));}catch(e){}};

  const del=async(id)=>{
    if(!confirm('이 의견을 삭제할까요?'))return;
    try{await db.collection('studentFeedback').doc(id).delete();setMsgs(prev=>prev.filter(m=>m.id!==id));setSelIds(prev=>{const s=new Set(prev);s.delete(id);return s;});}catch(e){alert('삭제 실패');}
  };

  const delSelected=async()=>{
    if(selIds.size===0)return;
    if(!confirm(`선택한 ${selIds.size}개 의견을 삭제할까요?`))return;
    try{
      await Promise.all([...selIds].map(id=>db.collection('studentFeedback').doc(id).delete()));
      setMsgs(prev=>prev.filter(m=>!selIds.has(m.id)));
      setSelIds(new Set());
    }catch(e){alert('일부 삭제 실패');}
  };

  const toggleSel=(id)=>setSelIds(prev=>{const s=new Set(prev);s.has(id)?s.delete(id):s.add(id);return s;});
  const allChecked=msgs.length>0&&msgs.every(m=>selIds.has(m.id));
  const toggleAll=()=>setSelIds(allChecked?new Set():new Set(msgs.map(m=>m.id)));

  const unreadN=msgs.filter(m=>!m.read).length;   // 읽지 않은 의견이 있으면 카드 전체를 빨갛게 표시
  return(<div className={`rounded-3xl p-5 shadow-md mb-4 ${unreadN?'bg-red-50 border-2 border-red-300':'bg-white'}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`text-sm font-bold uppercase flex items-center gap-2 ${unreadN?'text-red-600':'text-gray-400'}`}>💬 학생 의견 수신함{unreadN>0&&<span className="text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-full normal-case animate-pulse">읽지 않음 {unreadN}</span>}</div>
      <div className="flex gap-2 flex-wrap justify-end">
        {selIds.size>0&&<button onClick={delSelected} className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg font-bold">🗑️ 선택 {selIds.size}개 삭제</button>}
        <button onClick={load} className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold">새로고침</button>
        <button onClick={()=>setCollapsed(v=>!v)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">{collapsed?'펼치기 ▼':'접기 ▲'}</button>
      </div>
    </div>
    {!collapsed&&<>
    {loading&&<div className="text-center text-gray-400 py-4">로딩 중...</div>}
    {!loading&&msgs.length===0&&<div className="text-center text-gray-400 py-4 text-sm">받은 의견이 없어요.</div>}
    {!loading&&msgs.length>0&&<div className="flex items-center gap-2 mb-2 px-1">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 cursor-pointer select-none">
        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded"/>전체선택
      </label>
      {selIds.size>0&&<span className="text-xs text-red-500 font-bold">{selIds.size}개 선택됨</span>}
    </div>}
    {msgs.map(m=><div key={m.id} className={`border rounded-2xl p-3.5 mb-2.5 ${selIds.has(m.id)?'border-red-300 bg-red-50':m.read?'border-gray-100 bg-gray-50':'border-indigo-200 bg-indigo-50'}`}>
      <div className="flex items-start gap-2 mb-1.5">
        <input type="checkbox" checked={selIds.has(m.id)} onChange={()=>toggleSel(m.id)} className="w-4 h-4 mt-0.5 flex-shrink-0 rounded cursor-pointer"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-gray-800 text-sm">👤 {m.studentName}</span>
            {!m.read&&<span className="text-[11px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">NEW</span>}
            <span className="text-[11px] text-gray-400 ml-auto">{fmtTime(m.sentAt)}</span>
          </div>
          <p className="text-sm text-gray-700 font-medium leading-relaxed break-keep">{m.message}</p>
          {m.voiceId&&<VoicePlayer voiceId={m.voiceId} sec={m.voiceSec}/>}
          <div className="flex gap-2 mt-2.5 justify-end">
            {!m.read&&<button onClick={()=>markRead(m.id)} className="text-[11px] px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-bold">✓ 읽음 처리</button>}
            <button onClick={()=>del(m.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
          </div>
        </div>
      </div>
    </div>)}
    </>}
  </div>);
}
