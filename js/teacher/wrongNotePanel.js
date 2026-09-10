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
      const hwQs=qs.map(q=>({q:restoreQText(q)||'',choices:q.choices||[],answer:q.answer??0,topic:q.topic||'오답 재도전',explanation:q.explanation||''}));
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
              const effGraph=tryReconstructGraph(q);
              return(<label key={i} className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${on?'bg-red-50':'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={on} onChange={()=>setWrongQSel(prev=>{const s=new Set(prev);on?s.delete(i):s.add(i);return s;})} className="mt-0.5 w-4 h-4 flex-shrink-0 rounded"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 mb-0.5">{q._logDate} · {q._logType}</div>
                  <div className="text-sm font-bold text-gray-800 break-keep leading-snug">{restoreQText(q)||'(문제 없음)'}</div>
                  {effGraph&&<div className="mt-1 flex justify-center"><GraphPreview q={{...q,graph:effGraph}}/></div>}
                  {q.cAns&&<div className="text-xs text-indigo-600 mt-0.5">정답: {q.cAns}</div>}
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

  return(<div className="bg-white rounded-3xl p-5 shadow-md mb-4">
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-bold text-gray-400 uppercase">💬 학생 의견 수신함</div>
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

/* ⚠️ 현재 어디에서도 호출하지 않는다 (2026-09-11 확인).
   선생님 대시보드는 오답 노트를 StudentDetail 안에서 직접 띄운다.
   되살려 쓸 수 있게 남겨 두었고, 지울 때는 이 파일에서 이 함수만 지우면 된다. */
function FeedbackTab(){
  const[showStudentFb,setShowStudentFb]=useState(true);
  const[showRecentSessions,setShowRecentSessions]=useState(true);
  const[showFbList,setShowFbList]=useState(true);
  const[wrongQSel,setWrongQSel]=useState(new Set());
  const[wrongQShowAns,setWrongQShowAns]=useState(false);
  const[wrongQOpen,setWrongQOpen]=useState(false);
  const[sid,setSid]=useState('');
  const[student,setStudent]=useState(null);
  const[msg,setMsg]=useState('');
  const[relatedLogIdx,setRelatedLogIdx]=useState('');
  const[loading,setLoading]=useState(false);
  const[feedbacks,setFeedbacks]=useState([]);
  const[sent,setSent]=useState(false);
  const[editFbId,setEditFbId]=useState(null);
  const[editFbText,setEditFbText]=useState('');
  const[recentSessions,setRecentSessions]=useState([]);

  useEffect(()=>{
    db.collection('math_logs').orderBy('date','desc').limit(10).get().then(snap=>{
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      setRecentSessions(arr);
    }).catch(()=>{});
  },[]);

  const jumpToStudent=async(name)=>{
    setSid(name);
    setLoading(true);
    try{
      const doc=await db.collection('users').doc(name).get();
      if(doc.exists&&doc.data().role!=='admin'){
        setStudent(doc.data());
        const fbSnap=await db.collection('feedback').where('studentName','==',name).get();
        let arr=[];fbSnap.forEach(d=>arr.push({id:d.id,...d.data()}));
        arr.sort((a,b)=>{const tA=a.createdAt?.toDate?a.createdAt.toDate().getTime():new Date(a.createdAt).getTime();const tB=b.createdAt?.toDate?b.createdAt.toDate().getTime():new Date(b.createdAt).getTime();return tB-tA;});
        setFeedbacks(arr.slice(0,10));setRelatedLogIdx('');
      }
    }catch(e){}
    setLoading(false);
  };

  const search=async()=>{
    if(!sid.trim())return;
    setLoading(true);
    try{
      const doc=await db.collection('users').doc(sid.trim()).get();
      if(doc.exists && doc.data().role!=='admin'){
        setStudent(doc.data());
        const fbSnap=await db.collection('feedback').where('studentName','==',sid.trim()).get();
        let arr=[];
        fbSnap.forEach(d=>arr.push({id:d.id, ...d.data()}));
        arr.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        setFeedbacks(arr.slice(0, 10));
        setRelatedLogIdx('');
      }else{
        alert('해당 학생을 찾을 수 없거나 선생님 계정입니다.');
      }
    }catch(e){
      alert('검색 실패: ' + e.message);
    }
    setLoading(false);
  };

  const send=async()=>{
    if(!msg.trim())return;
    try{
      let logStr = '';
      if(relatedLogIdx !== '' && student?.logs?.[relatedLogIdx]) {
         const l = student.logs[relatedLogIdx];
         logStr = `${fmtDate(l.date)} ${l.time} | ${l.type} | 점수: ${l.score}`;
      }
      await db.collection('feedback').add({
        studentName: sid.trim(),
        message: msg.trim(),
        relatedLog: logStr,
        read: false,
        createdAt: new Date()
      });
      setMsg(''); setRelatedLogIdx(''); setSent(true);
      setTimeout(()=>setSent(false), 2000);
      search();
    }catch(e){
      alert('피드백 저장 실패: ' + e.message);
    }
  };

  const deleteFb=async(id)=>{
    if(!confirm('이 피드백을 정말 삭제하시겠습니까?')) return;
    try{
      await db.collection('feedback').doc(id).delete();
      search();
    }catch(e){
      alert('삭제 실패: ' + e.message);
    }
  };

  const startFbEdit=(fb)=>{setEditFbId(fb.id);setEditFbText(fb.message);};
  const saveFbEdit=async(id)=>{
    if(!editFbText.trim())return;
    try{
      await db.collection('feedback').doc(id).set({message:editFbText.trim()},{merge:true});
      setEditFbId(null);setEditFbText('');
      search();
    }catch(e){alert('수정 실패: '+e.message);}
  };

  const selLog = relatedLogIdx !== '' ? student?.logs?.[relatedLogIdx] : null;
  const allWrongQs=React.useMemo(()=>(student?.logs||[]).flatMap((l,li)=>(l.questions||[]).filter(q=>!q.isOk).map(q=>({...q,_logDate:l.date,_logType:l.type,_logIdx:li}))),[student]);

  return(<div className="p-4 pb-36 space-y-4">
    <StudentFeedbackPanel/>
    {recentSessions.length>0&&<div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-400 uppercase">🕐 최근 학습 세션 (클릭 → 바로 조회)</div>
        <button onClick={()=>setShowRecentSessions(v=>!v)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">{showRecentSessions?'접기 ▲':'펼치기 ▼'}</button>
      </div>
      {showRecentSessions&&<div className="space-y-2">
        {recentSessions.map((s,i)=>(
          <button key={s.id||i} onClick={()=>jumpToStudent(s.studentName)} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0">{(s.studentName||'?')[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-800 text-sm">{s.studentName||'?'}</div>
              <div className="text-xs text-gray-500 font-semibold truncate">{s.type||'학습'} · 점수: {s.score||'-'}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400 font-bold">{s.date||''}</div>
              <div className="text-xs text-gray-400">{s.time||''}</div>
            </div>
          </button>
        ))}
      </div>}
    </div>}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">💬 학생 피드백 & 기록</div>
      <div className="flex flex-col gap-2 mb-3">
        <input type="text" lang="ko" value={sid} onChange={e=>setSid(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="학생 이름 입력" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base font-bold focus:border-indigo-400 outline-none"/>
        <button onClick={search} className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-black text-base">{loading?'검색 중...':'🔍 학생 조회'}</button>
      </div>
      {student&&<div>
        <div className="bg-indigo-50 rounded-2xl p-4 mb-3 border border-indigo-200">
          <div className="font-black text-indigo-800 text-lg mb-1">👤 {student.name} 학생</div>
          <div className="text-sm text-indigo-600">총 레슨: {student.logs?.length||0}회 · 최근 접속: {student.lastLoginAt||student.lastDate||'없음'}</div>
        </div>

        {allWrongQs.length>0&&<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-black text-red-700">🔴 오답 문제지 생성 ({allWrongQs.length}개 오답)</div>
            <button onClick={()=>setWrongQOpen(v=>!v)} className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg font-bold">{wrongQOpen?'접기 ▲':'펼치기 ▼'}</button>
          </div>
          {wrongQOpen&&React.createElement(WrongQCategoryPanel,{allWrongQs,wrongQSel,setWrongQSel,wrongQShowAns,setWrongQShowAns,studentName:student.name})}
        </div>}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-gray-600 mb-2">📌 어떤 문제에 대한 피드백인가요? (선택사항)</div>
          <select value={relatedLogIdx} onChange={e=>setRelatedLogIdx(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-400 outline-none mb-3 bg-gray-50 text-gray-700">
            <option value="">-- 특정 기록에 연결하지 않음 (일반 피드백) --</option>
            {student.logs?.slice(0, 15).map((log, i) => (
               <option key={i} value={i}>{fmtDate(log.date)} {log.time} | {log.type} | 점수: {log.score}</option>
            ))}
          </select>

          {selLog && selLog.questions && (
             <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
               <div className="text-xs font-black text-indigo-600 mb-2">📊 해당 학습의 정오표 (틀린 문제 위주로 확인해보세요)</div>
               <div className="space-y-2">
                 {selLog.questions.map((q, j) => (
                   <div key={j} className={`p-2.5 rounded-lg text-xs border ${q.isOk ? 'bg-white border-green-200' : 'bg-red-50 border-red-200'}`}>
                     <div className="flex gap-2 items-start">
                       <span className="font-black text-gray-500 flex-shrink-0">Q{j+1}.</span>
                       <span className="font-bold text-gray-800 flex-1 leading-snug break-keep">{restoreQText(q)||''}</span>
                       <span className={`font-black flex-shrink-0 text-sm ${q.isOk ? 'text-green-500' : 'text-red-500'}`}>{q.isOk ? 'O' : 'X'}</span>
                     </div>
                     {!q.isOk && <div className="mt-1.5 pl-6 text-gray-600 leading-snug break-keep">학생 답: <span className="font-bold">{q.uAns}</span> <span className="text-gray-400">→</span> 정답: <span className="text-red-600 font-bold">{q.cAns}</span></div>}
                   </div>
                 ))}
               </div>
             </div>
          )}

          <div className="text-sm font-bold text-gray-600 mb-2">✍️ 피드백 메시지 작성</div>
          <textarea lang="ko" value={msg} onChange={e=>setMsg(e.target.value)} rows={3} placeholder="예: 나눗셈 계산은 잘했어요! 약수 부분을 좀 더 연습해봐요 😊" className="w-full border-2 border-gray-200 rounded-xl p-4 text-base font-bold resize-none focus:border-indigo-400 outline-none mb-3"/>
          <button onClick={send} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base active:scale-95 transition-transform">{sent?'✅ 전송완료!':'피드백 저장 및 전송 💌'}</button>
        </div>

        {feedbacks.length>0&&<div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-600">📬 보낸 피드백 기록</div>
            <button onClick={()=>setShowFbList(v=>!v)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">{showFbList?'접기 ▲':'펼치기 ▼'}</button>
          </div>
          {showFbList&&feedbacks.map((fb,i)=><div key={fb.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
               {fb.read
                 ? <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">학생이 읽음</span>
                 : <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">안 읽음</span>}
               <span className="text-[11px] text-gray-400 ml-auto">{fb.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || new Date(fb.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            {fb.relatedLog && <div className="text-[11px] text-indigo-600 font-black mb-2 inline-block bg-white px-2 py-1 rounded-lg border border-indigo-100 break-keep">관련: {fb.relatedLog}</div>}
            {editFbId===fb.id?(
              <div className="space-y-2">
                <textarea lang="ko" value={editFbText} onChange={e=>setEditFbText(e.target.value)} rows={3} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-base font-bold resize-none outline-none focus:border-indigo-400"/>
                <div className="flex gap-2">
                  <button onClick={()=>saveFbEdit(fb.id)} className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm">저장</button>
                  <button onClick={()=>setEditFbId(null)} className="flex-1 py-2.5 bg-gray-200 text-gray-600 rounded-xl font-bold text-sm">취소</button>
                </div>
              </div>
            ):(
              <>
                <div className="text-gray-800 font-bold text-base leading-relaxed break-keep">{fb.message}</div>
                <div className="flex gap-2 mt-3 justify-end">
                  {!fb.read&&<button onClick={()=>startFbEdit(fb)} className="text-[11px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">✏️ 수정</button>}
                  <button onClick={()=>deleteFb(fb.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
                </div>
                {!fb.read&&<div className="text-[10px] text-gray-400 mt-1.5 text-right">아직 안 읽었을 때만 수정할 수 있어요</div>}
              </>
            )}
          </div>)}
        </div>}
      </div>}
    </div>
  </div>);
}
