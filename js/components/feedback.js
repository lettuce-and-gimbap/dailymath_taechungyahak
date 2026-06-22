// === js/components/feedback.js ===

// 중졸·고졸 검정고시 수학 영역 자동 분류
function classifyWrongQTopic(q){
  const src=((q.topic||'')+(q.qTxt||q.q||'')+(q._logType||'')).toLowerCase();
  if(/수와\s*연산|자연수|정수|유리수|실수|분수|소수|약수|배수|최대공약수|최소공배수|소인수|집합|무한소수|순환소수/.test(src))return'수와 연산';
  if(/방정식|부등식|연립|이차방정식|이차부등식|일차방정식|일차부등식|판별식|근의 공식|절댓값 방정식/.test(src))return'방정식과 부등식';
  if(/이차함수|일차함수|유리함수|무리함수|지수함수|로그함수|함수|평행이동|대칭이동|역함수|합성함수/.test(src))return'함수';
  if(/수열|등차|등비|시그마|귀납법|점화식/.test(src))return'수열';
  if(/확률|경우의 수|조합|순열|통계|평균|분산|표준편차|도수|히스토그램|줄기잎/.test(src))return'확률과 통계';
  if(/삼각형|사각형|다각형|원|입체|도형|피타고라스|넓이|부피|겉넓이|내각|외각|평행사변형|직선|점과 직선|거리|벡터|기하/.test(src))return'기하';
  if(/삼각함수|사인|코사인|탄젠트|sin|cos|tan|호도법/.test(src))return'삼각함수';
  if(/미분|적분|극한|미적분|도함수|부정적분|정적분/.test(src))return'미적분';
  if(/인수분해|다항식|전개|문자와\s*식|식의 계산|단항식|다항식/.test(src))return'문자와 식';
  if(/지수|로그|상용로그/.test(src))return'지수·로그';
  return'기타';
}

const WRONG_Q_CATEGORY_ORDER=['수와 연산','문자와 식','방정식과 부등식','함수','수열','확률과 통계','기하','삼각함수','지수·로그','미적분','기타'];

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
  const [openCats,setOpenCats]=React.useState(()=>new Set(cats)); // 기본 전부 열림

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

  const ORD=['①','②','③','④'];

  const printSelected=()=>{
    const qs=Array.from(wrongQSel).map(i=>allWrongQs[i]);
    const showAns=wrongQShowAns;
    let html=`<html><head><style>
      body{font-family:'Noto Sans KR',sans-serif;padding:32px;color:#111;}
      h1{text-align:center;font-size:20px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:16px;}
      .cat{font-size:13px;font-weight:900;color:#6d28d9;background:#ede9fe;padding:4px 10px;border-radius:6px;margin:16px 0 8px 0;}
      .q{margin-bottom:20px;page-break-inside:avoid;}
      .qnum{font-weight:900;color:#dc2626;}
      .choices{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:6px;margin-left:14px;}
      .choice{font-size:13px;padding:3px 0;}
      .ans{margin-top:5px;margin-left:14px;font-size:12px;color:#dc2626;font-weight:700;display:${showAns?'block':'none'};}
      .exp{margin-top:4px;margin-left:14px;padding:6px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:11px;color:#78350f;display:${showAns?'block':'none'};}
    </style></head><body>
    <h1>${studentName} 학생 — 오답 문제지</h1>`;
    let num=1;
    WRONG_Q_CATEGORY_ORDER.forEach(cat=>{
      const items=(grouped[cat]||[]).filter(({i})=>wrongQSel.has(i));
      if(!items.length)return;
      html+=`<div class="cat">▶ ${cat}</div>`;
      items.forEach(({q})=>{
        const choicesHtml=Array.isArray(q.choices)?`<div class="choices">${q.choices.map((c,j)=>`<div class="choice">${ORD[j]||String(j+1)} ${c}</div>`).join('')}</div>`:'';
        const ansText=q.cAns||(Array.isArray(q.choices)&&q.answer!=null?q.choices[q.answer]:'');
        html+=`<div class="q"><span class="qnum">${num++}.</span> ${q.qTxt||q.q||''}${choicesHtml}<div class="ans">정답: ${ansText}</div><div class="exp">${q.explanation||''}</div></div>`;
      });
    });
    html+=`</body></html>`;
    const w=window.open('','_blank','width=800,height=900');
    w.document.write(html);w.document.close();setTimeout(()=>w.print(),400);
  };

  const sendHomework=async()=>{
    const qs=Array.from(wrongQSel).map(i=>allWrongQs[i]);
    if(!confirm(`오답 ${qs.length}문제를 ${studentName} 학생에게 숙제로 내시겠어요?`))return;
    try{
      const now=new Date();const exp=new Date(now);exp.setDate(exp.getDate()+7);
      const hwQs=qs.map(q=>({q:q.qTxt||q.q||'',choices:q.choices||[],answer:q.answer??0,topic:q.topic||'오답 재도전',explanation:q.explanation||''}));
      await db.collection('homework').add({title:`${studentName} 학생 오답 문제지`,level:'오답',questions:hwQs,active:true,createdAt:now,expiresAt:exp,completedBy:[],assignedTo:[studentName]});
      alert('✅ 숙제로 등록되었습니다!');
    }catch(e){alert('등록 실패');}
  };

  return(<div>
    <div className="text-xs text-red-500 mb-2">유형별로 묶었습니다. 원하는 문제를 선택해 인쇄하세요.</div>
    {/* 전체 선택 / 해제 */}
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <button onClick={selAll} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${allOn?'bg-red-400 text-white':'bg-gray-100 text-gray-600'}`}>{allOn?'✓ 전체 해제':'전체 선택'}</button>
      <button onClick={()=>setWrongQSel(new Set())} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold">전체 해제</button>
      <label className="flex items-center gap-1.5 ml-auto text-xs font-bold text-gray-600">
        <input type="checkbox" checked={wrongQShowAns} onChange={e=>setWrongQShowAns(e.target.checked)}/>해설 포함
      </label>
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
                  <div className="text-[10px] font-bold text-gray-400 mb-0.5">{q._logDate} · {q._logType}</div>
                  <div className="text-sm font-bold text-gray-800 break-keep leading-snug">{q.qTxt||q.q||'(문제 없음)'}</div>
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
  const[collapsed,setCollapsed]=React.useState(false);
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
                       <span className="font-bold text-gray-800 flex-1 leading-snug break-keep">{q.qTxt}</span>
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

/* ===== 배움 글귀 스플래시 (로그인 직후 노출) ===== */
var LEARN_QUOTES=[
  "오늘 한 걸음이 어제보다 더 멀리 데려다줍니다.",
  "배움에 늦은 때란 없습니다. 시작한 지금이 가장 빠른 때예요.",
  "천천히 가도 괜찮아요. 멈추지만 않으면 도착합니다.",
  "어제는 몰랐던 것을 오늘 알게 되었다면, 그것으로 충분합니다.",
  "틀려도 괜찮아요. 틀린 만큼 더 단단해집니다.",
  "작은 물방울이 모여 바위를 뚫습니다. 당신의 오늘이 그렇습니다.",
  "한 글자, 한 숫자가 모여 큰 세상을 열어줍니다.",
  "당신은 이미 충분히 잘하고 있어요.",
  "모르는 것을 묻는 용기가 가장 큰 배움입니다.",
  "나이는 숫자일 뿐, 배움에는 끝이 없습니다.",
  "오늘 펼친 공책 한 장이 내일의 자신감이 됩니다.",
  "포기하지 않은 당신이 이미 승리자입니다.",
  "조금 느려도 괜찮아요. 꽃마다 피는 계절이 다르니까요.",
  "어렵게 느껴지는 건 새로운 것을 배우고 있다는 증거예요.",
  "당신의 노력은 결코 사라지지 않습니다. 차곡차곡 쌓이고 있어요.",
  "작게 시작한 일이 가장 멀리 갑니다.",
  "오늘 배운 것 하나가 당신을 어제보다 자유롭게 합니다.",
  "다시 해보는 것, 그것이 진짜 실력입니다.",
  "잘 모르겠으면 잠시 쉬어도 됩니다. 내일 다시 만나면 돼요.",
  "당신이 배우는 모습은 누군가에게 큰 용기가 됩니다.",
  "한 번에 다 알 필요 없어요. 천천히, 하나씩이면 충분합니다.",
  "오늘의 작은 성취를 스스로 칭찬해 주세요.",
  "길을 잃은 게 아니라, 새로운 길을 배우는 중입니다.",
  "배움은 나이를 묻지 않고, 마음을 봅니다.",
  "어제의 나보다 한 뼘 자란 오늘의 나를 응원합니다.",
  "모든 위대한 것은 작은 시작에서 비롯됩니다.",
  "당신의 속도가 가장 알맞은 속도입니다.",
  "펜을 든 손이 가장 빛나는 손입니다.",
  "실수는 배움의 다른 이름입니다. 두려워하지 마세요.",
  "오늘도 배우러 온 당신, 정말 멋집니다.",
  {text:"교육은 세상을 바꾸는 데 쓸 수 있는 가장 강력한 무기입니다.",author:"넬슨 만델라"},
  {text:"교육을 통해 농부의 딸은 의사가 되고, 광부의 아들은 광산의 책임자가 될 수 있습니다.",author:"넬슨 만델라"},
  {text:"희망은 강력한 무기입니다.",author:"넬슨 만델라"},
  {text:"교육은 삶을 돕는 일로 이해되어야 합니다.",author:"마리아 몬테소리"},
  {text:"아이의 마음은 지식을 흡수할 수 있고, 스스로를 가르칠 힘이 있습니다.",author:"마리아 몬테소리"},
  {text:"손은 인간 지성의 도구입니다.",author:"마리아 몬테소리"},
  {text:"개별적인 활동은 발달을 자극하고 만들어 내는 중요한 힘입니다.",author:"마리아 몬테소리"},
  {text:"독립을 향한 정복은 자연스러운 발달의 기본 단계입니다.",author:"마리아 몬테소리"},
  {text:"사람은 끊임없는 활동을 통해 독립을 이루고, 꾸준한 노력으로 자유로워집니다.",author:"마리아 몬테소리"},
  {text:"발달은 활동에서 옵니다. 환경은 스스로 경험하고 싶게 만드는 관심거리로 풍부해야 합니다.",author:"마리아 몬테소리"},
  {text:"사람은 환경에서 직접 경험함으로써 온전히 발달할 수 있습니다.",author:"마리아 몬테소리"},
  {text:"교육의 첫째 임무는 삶을 북돋우면서도 삶이 스스로 펼쳐지도록 자유롭게 두는 것입니다.",author:"마리아 몬테소리"},
  {text:"성공의 비결은 무엇이 옳은지 알아차리고 그것을 해낼 수 있도록 돕는 데 있습니다.",author:"마리아 몬테소리"},
  {text:"스스로 해낼 수 있다고 느끼는 순간, 사람은 새로운 힘을 얻습니다.",author:"마리아 몬테소리"},
  {text:"교사를 진정한 교사로 만드는 것은 인간을 향한 사랑입니다.",author:"마리아 몬테소리"},
  {text:"교육은 듣고 외우는 일이 아니라, 스스로 움직이며 만들어 가는 과정입니다.",author:"존 듀이"},
  {text:"교육은 미래의 삶을 준비하는 일이 아니라, 지금 살아가는 삶 그 자체입니다.",author:"존 듀이"},
  {text:"교육은 경험을 끊임없이 다시 조직하고 새롭게 만드는 일입니다.",author:"존 듀이"},
  {text:"생각하는 사람은 실패에서도 성공만큼 많은 것을 배웁니다.",author:"존 듀이"},
  {text:"배움은 수동적으로 받아들이는 것이 아니라 능동적으로 탐구하는 데서 시작됩니다.",author:"존 듀이"},
  {text:"가르침과 배움은 파는 일과 사는 일처럼 서로 함께 이루어지는 과정입니다.",author:"존 듀이"},
  {text:"삶의 모든 만남에서 배우려는 관심은 중요한 도덕적 태도입니다.",author:"존 듀이"},
  {text:"새로운 사실과 진리를 발견하는 길은 끈기 있게 질문하고 탐구하는 데 있습니다.",author:"존 듀이"},
  {text:"낙관은 성취로 이끄는 믿음입니다. 희망 없이는 아무것도 이룰 수 없습니다.",author:"헬렌 켈러"},
  {text:"지식은 사랑이며, 빛이며, 볼 수 있게 하는 힘입니다.",author:"헬렌 켈러"},
  {text:"혼자서는 아주 적은 일을 할 수 있지만, 함께하면 훨씬 많은 일을 할 수 있습니다.",author:"헬렌 켈러"},
  {text:"삶은 대담한 모험이거나, 아무것도 아닙니다.",author:"헬렌 켈러"},
  {text:"장애물을 넘기 위해 들인 모든 노력은 우리에게 힘과 자신감을 줍니다.",author:"부커 T. 워싱턴"},
  {text:"학교는 책만 공부하는 곳이 아니라, 실제의 일을 배우는 곳이어야 합니다.",author:"부커 T. 워싱턴"},
  {text:"어려움이 클수록 그것을 이겨 냈을 때의 성공도 더 커집니다.",author:"부커 T. 워싱턴"}
];
var QUOTE_BGS=[
  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
  'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  'linear-gradient(135deg,#30cfd0 0%,#330867 100%)',
  'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)',
  'linear-gradient(135deg,#5ee7df 0%,#b490ca 100%)',
  'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
  'linear-gradient(135deg,#84fab0 0%,#8fd3f4 100%)'
];


