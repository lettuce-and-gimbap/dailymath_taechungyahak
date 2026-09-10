// === js/teacher/analysisTab.js ===
/* --------------------------------------------------------------------
   학생관리 탭
   학생 목록 · 빠른 피드백 보내기
   -------------------------------------------------------------------- */

function StudentAnalysisTab(){
  const[students,setStudents]=useState([]);
  const[loading,setLoading]=useState(false);
  const[selected,setSelected]=useState(null);
  const[onlineMap,setOnlineMap]=useState({}); // {학생이름: lastSeen timestamp}
  const[sortBy,setSortBy]=useState('date'); // 'date' | 'name'
  const[sortAsc,setSortAsc]=useState(false);

  // 접속중 실시간 구독 (30초 이상 업데이트 없으면 오프라인 간주)
  useEffect(()=>{
    const unsub=db.collection('onlineStatus').onSnapshot(snap=>{
      const now=Date.now();
      const map={};
      snap.forEach(d=>{const ts=d.data().ts;if(ts&&now-ts<90000)map[d.id]=ts;});
      setOnlineMap(map);
    },()=>{});
    return()=>unsub();
  },[]);
  const[folders,setFolders]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('teacherFolders')||'[{"id":"all","name":"폴더없음","ids":[]}]')}
    catch{return[{id:'all',name:'폴더없음',ids:[]}]}
  });
  const[activeFolder,setActiveFolder]=useState('all');
  const[editFolderId,setEditFolderId]=useState(null);
  const[pickerOpen,setPickerOpen]=useState(null);  // 열린 학생 id

  useEffect(()=>{
    db.collection('teacherSettings').doc('folders').get().then(snap=>{
      if(snap.exists&&snap.data().folders){
        var f=snap.data().folders;
        setFolders(f);
        try{localStorage.setItem('teacherFolders',JSON.stringify(f));}catch(e){}
      }
    }).catch(()=>{});
  },[]);

  const saveFolders=f=>{
    setFolders(f);
    try{localStorage.setItem('teacherFolders',JSON.stringify(f));}catch(e){}
    db.collection('teacherSettings').doc('folders').set({folders:f,updatedAt:Date.now()}).catch(()=>{});
  };
  const customFolders=folders.filter(f=>f.id!=='all');

  const addFolder=()=>{
    const id='f'+Date.now();
    saveFolders([...folders,{id,name:'새 폴더',ids:[]}]);
    setEditFolderId(id);
  };
  const renameFolder=(id,name)=>{saveFolders(folders.map(f=>f.id===id?{...f,name:name||f.name}:f));setEditFolderId(null);};

  const deleteFolder=(fid)=>{
    if(!confirm('이 폴더를 삭제할까요?\n안에 있던 학생들은 폴더없음으로 돌아갑니다.'))return;
    saveFolders(folders.filter(f=>f.id!==fid));
    if(activeFolder===fid)setActiveFolder('all');
  };

  // 단일 폴더 배정 (중복 없음) — fid=null 이면 폴더없음
  const assignFolder=(fid,sid)=>{
    saveFolders(folders.map(f=>{
      if(f.id==='all')return f;
      if(f.id===fid)return{...f,ids:f.ids.includes(sid)?f.ids.filter(x=>x!==sid):[...f.ids,sid]};
      return{...f,ids:f.ids.filter(x=>x!==sid)}; // 다른 폴더에서 제거
    }));
  };
  const clearFolder=(sid)=>{
    saveFolders(folders.map(f=>f.id==='all'?f:{...f,ids:f.ids.filter(x=>x!==sid)}));
  };

  const deleteStudent=async(s)=>{
    if(!confirm(`${s.name||s.id} 학생을 삭제할까요?
삭제하면 데이터가 모두 사라지고
새로 회원가입해야 합니다.`))return;
    try{
      await db.collection('users').doc(s.id).delete();
      clearFolder(s.id);
      setStudents(prev=>prev.filter(x=>x.id!==s.id));
    }catch(e){alert('삭제 실패: '+e.message);}
  };

  const[recentSessions,setRecentSessions]=useState([]);
  useEffect(()=>{
    db.collection('math_logs').orderBy('date','desc').limit(10).get()
      .then(snap=>{const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));setRecentSessions(arr);})
      .catch(()=>{});
  },[]);

  const load=async()=>{
    setLoading(true);
    try{
      const snap=await db.collection('users').where('role','==','student').get();
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      arr.sort((a,b)=>(b.lastDate||'').localeCompare(a.lastDate||''));
      setStudents(arr);
    }catch(e){alert('데이터 로드 실패.')}
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  if(selected)return<StudentDetail
    student={selected}
    onBack={()=>setSelected(null)}
    folders={folders}
    customFolders={customFolders}
    onAssignFolder={(fid,sid)=>{assignFolder(fid,sid);}}
    onClearFolder={(sid)=>{clearFolder(sid);}}
    onDeleteStudent={(s)=>{deleteStudent(s);setSelected(null);}}
  />;

  const curFolder=folders.find(f=>f.id===activeFolder)||folders[0];
  // '폴더없음' 탭: 어느 커스텀 폴더에도 없는 학생
  // 커스텀 폴더 탭: 해당 폴더 ids에 포함된 학생
  const _filtered=activeFolder==='all'
    ?students.filter(s=>!customFolders.some(f=>f.ids.includes(s.id)))
    :students.filter(s=>curFolder?.ids.includes(s.id));
  const visibleStudents=[..._filtered].sort((a,b)=>{
    var cmp=sortBy==='name'
      ?(a.name||a.id).localeCompare(b.name||b.id)
      :(a.lastLoginAt||a.lastDate||'').localeCompare(b.lastLoginAt||b.lastDate||'');
    return sortAsc?cmp:-cmp;
  });
  const toggleSort=key=>{if(sortBy===key)setSortAsc(v=>!v);else{setSortBy(key);setSortAsc(key==='name');}};

  const LIGHT_CLS={'light-red':'bg-red-50 text-red-700 border border-red-200','light-yel':'bg-yellow-50 text-yellow-700 border border-yellow-200','light-grn':'bg-green-50 text-green-700 border border-green-200'};
  const STATUS_DOT={'light-red':'bg-red-400','light-yel':'bg-yellow-400','light-grn':'bg-emerald-400'};

  return(<div className="p-4 pb-36 space-y-4">

    {/* ── 학생 의견 수신함 ── */}
    <StudentFeedbackPanel/>

    {/* ── 최근 학습 세션 ── */}
    {recentSessions.length>0&&<div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-xs font-black text-gray-400 uppercase mb-2">🕐 최근 학습 세션</div>
      <div className="grid grid-cols-2 gap-1.5">
        {recentSessions.map((s,i)=>(
          <button key={s.id||i}
            onClick={()=>{const found=students.find(st=>st.name===s.studentName||st.id===s.studentName);if(found)setSelected(found);}}
            className="text-left flex flex-col gap-1 px-2.5 py-2 rounded-xl border border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">{(s.studentName||'?')[0]}</div>
              <div className="font-black text-gray-800 text-xs truncate">{s.studentName||'?'}</div>
            </div>
            <div className="text-[9px] text-gray-500 truncate">{s.type||'학습'}</div>
            <div className="flex justify-between">
              <span className="text-[9px] text-gray-400">점수: {s.score||'-'}</span>
              <span className="text-[9px] text-gray-400">{(s.date||'').slice(5)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>}

    {/* ── 학생 그리드 헤더 ── */}
    <div className="flex items-center justify-between">
      <div className="text-base font-black text-gray-800">📊 학생 관리 <span className="text-sm font-normal text-gray-400">({students.length}명)</span></div>
      <div className="flex items-center gap-1.5">
        <button onClick={()=>toggleSort('name')} className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${sortBy==='name'?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>
          이름{sortBy==='name'?(sortAsc?'↑':'↓'):''}
        </button>
        <button onClick={()=>toggleSort('date')} className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${sortBy==='date'?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>
          접속{sortBy==='date'?(sortAsc?'↑':'↓'):''}
        </button>
        <button onClick={load} className="text-sm px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold">🔄</button>
      </div>
    </div>

    {/* ── 폴더 탭 ── */}
    <div className="flex gap-1.5 flex-wrap items-center">
      <button onClick={()=>setActiveFolder('all')}
        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${activeFolder==='all'?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>
        📋 전체 <span className="opacity-70">({students.filter(s=>!customFolders.some(f=>f.ids.includes(s.id))).length})</span>
      </button>
      {customFolders.map(f=>(
        <div key={f.id} className="flex items-center gap-0.5">
          {editFolderId===f.id
            ?<input autoFocus defaultValue={f.name}
                onBlur={e=>renameFolder(f.id,e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&renameFolder(f.id,e.target.value)}
                className="border-2 border-indigo-400 rounded-lg px-2 py-0.5 text-xs font-bold w-20 outline-none"/>
            :<>
              <button onDoubleClick={()=>setEditFolderId(f.id)} onClick={()=>setActiveFolder(f.id)}
                className={`px-2.5 py-1 rounded-l-xl text-xs font-bold transition-all ${activeFolder===f.id?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>
                📁 {f.name} <span className="opacity-70">({f.ids.length})</span>
              </button>
              <button onClick={()=>deleteFolder(f.id)}
                className={`px-1 py-1 rounded-r-xl text-xs font-black transition-all ${activeFolder===f.id?'bg-indigo-400 text-white hover:bg-red-500':'bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-600'}`}>✕</button>
            </>}
        </div>
      ))}
      <button onClick={addFolder} className="px-2.5 py-1 rounded-xl text-xs font-bold bg-green-100 text-green-700">＋ 폴더</button>
    </div>
    <div className="text-[10px] text-gray-400">탭 더블클릭: 이름 수정 · ✕: 폴더 삭제 · 상세화면에서 폴더 배정/삭제</div>

    {/* 신호등 안내 */}
    <div className="flex gap-3 text-[10px] text-gray-500 flex-wrap">
      {[['🔴','집중케어','5일↑ 또는 40%↓'],['🟡','격려필요','3~4일 또는 40~69%'],['🟢','순항중','2일↓ & 70%↑']].map(([icon,lbl,desc])=>(
        <span key={lbl}>{icon} {lbl}: {desc}</span>
      ))}
    </div>

    {loading&&<div className="text-center py-8 text-gray-400 font-bold">분석 중... ⏳</div>}

    {/* ── 4×n 학생 그리드 ── */}
    {!loading&&<div className="grid grid-cols-4 gap-2">
      {visibleStudents.map(s=>{
        const a=analyzeStudent(s);
        const isOnline=!!onlineMap[s.name||s.id];
        return(
        <button key={s.id} onClick={()=>setSelected(s)}
          className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 text-center hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition-all flex flex-col items-center gap-1">
          {/* 아바타 */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center">
              {(s.name||s.id)[0]}
            </div>
            {isOnline&&<span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"/>}
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[a.status.color]}`}/>
          </div>
          {/* 이름 */}
          <div className="text-[11px] font-black text-gray-800 truncate w-full text-center">{s.name||s.id}</div>
          {/* 정답률 */}
          <div className="text-[10px] font-bold text-gray-500">{a.recentAcc}%</div>
          {/* 마지막 */}
          <div className="text-[9px] text-gray-400 truncate w-full text-center">
            {isOnline?'🟢 접속중':daysText(a.daysInactive)}
          </div>
        </button>);
      })}
    </div>}

    {!loading&&visibleStudents.length===0&&(
      <div className="text-center py-12 text-gray-400 font-bold">
        {activeFolder==='all'?'학생이 없어요.':'이 폴더에 배정된 학생이 없어요.'}
      </div>
    )}
  </div>);
}

function QuickFeedbackPanel({student}){
  const[open,setOpen]=useState(false);
  const[mode,setMode]=useState('general'); // 'general' | 'session'
  const[sessionIdx,setSessionIdx]=useState('');
  const[msg,setMsg]=useState('');
  const[sent,setSent]=useState(false);

  const selLog=mode==='session'&&sessionIdx!==''?student?.logs?.[Number(sessionIdx)]:null;

  const send=async()=>{
    if(!msg.trim())return;
    try{
      let logStr='';
      if(mode==='session'&&sessionIdx!==''&&student?.logs?.[Number(sessionIdx)]){
        const l=student.logs[Number(sessionIdx)];
        logStr=`${fmtDate(l.date)} ${l.time||''} | ${l.type||''} | 점수: ${l.score||''}`;
      }
      await db.collection('feedback').add({
        studentName:student.name,
        message:msg.trim(),
        relatedLog:logStr,
        read:false,
        createdAt:new Date()
      });
      setMsg('');setSent(true);
      setTimeout(()=>setSent(false),2000);
    }catch(e){alert('피드백 저장 실패: '+e.message);}
  };

  return(<div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 mb-4">
    <div className="flex items-center justify-between">
      <div className="text-sm font-black text-indigo-700">💌 피드백 주기</div>
      <button onClick={()=>setOpen(v=>!v)} className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-bold">
        {open?'접기 ▲':'펼치기 ▼'}
      </button>
    </div>
    {open&&<div className="mt-3 space-y-3">
      {/* 모드 선택 */}
      <div className="flex gap-2">
        <button onClick={()=>{setMode('general');setSessionIdx('');}}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${mode==='general'?'bg-indigo-600 text-white shadow':'bg-white text-gray-600 border border-gray-200'}`}>
          💬 일반 피드백
        </button>
        <button onClick={()=>setMode('session')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${mode==='session'?'bg-indigo-600 text-white shadow':'bg-white text-gray-600 border border-gray-200'}`}>
          📋 특정 세션 지정
        </button>
      </div>
      {/* 세션 선택 드롭다운 */}
      {mode==='session'&&<select value={sessionIdx} onChange={e=>setSessionIdx(e.target.value)}
        className="w-full border-2 border-gray-200 rounded-xl p-2.5 text-xs font-bold focus:border-indigo-400 outline-none bg-white">
        <option value="">-- 세션을 선택하세요 --</option>
        {(student.logs||[]).slice(0,15).map((log,i)=>(
          <option key={i} value={i}>{fmtDate(log.date)} {log.time||''} | {log.type||''} | 점수: {log.score||'-'}</option>
        ))}
      </select>}
      {/* 선택 세션 정오표 미리보기 */}
      {selLog&&selLog.questions&&<div className="bg-white border border-indigo-100 rounded-xl p-3 max-h-36 overflow-y-auto">
        <div className="text-[10px] font-black text-indigo-600 mb-1.5">📊 세션 정오표</div>
        <div className="space-y-1">
          {selLog.questions.map((q,j)=>(
            <div key={j} className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-lg ${q.isOk?'bg-green-50':'bg-red-50'}`}>
              <span className={`font-black text-sm flex-shrink-0 ${q.isOk?'text-green-500':'text-red-500'}`}>{q.isOk?'O':'X'}</span>
              <span className="text-gray-700 break-keep leading-snug">{restoreQText(q)||''}</span>
            </div>
          ))}
        </div>
      </div>}
      {/* 메시지 입력 */}
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} lang="ko"
        placeholder={mode==='session'&&selLog?`[${fmtDate(selLog.date)} ${selLog.type||''}] 세션에 대한 피드백...`:'학생에게 전달할 피드백 메시지...'}
        className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold resize-none focus:border-indigo-400 outline-none"/>
      <button onClick={send}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm active:scale-95 transition-transform">
        {sent?'✅ 전송완료!':'💌 피드백 전송'}
      </button>
    </div>}
  </div>);
}
