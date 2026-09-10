// === js/teacher/notice.js ===
/* --------------------------------------------------------------------
   공지/숙제 탭
   공지 등록과 숙제 관리
   -------------------------------------------------------------------- */

function NoticeTab(){
  const[noticeText,setNoticeText]=useState('');
  const[notices,setNotices]=useState([]);
  const[homeworks,setHomeworks]=useState([]);
  const[posting,setPosting]=useState(false);

  const loadAll=async()=>{
    try{
      const now=new Date();
      const nSnap=await db.collection('notices').orderBy('createdAt','desc').limit(30).get();
      const nArr=[];nSnap.forEach(d=>nArr.push({id:d.id,...d.data()}));
      setNotices(nArr);
      const hSnap=await db.collection('homework').orderBy('createdAt','desc').limit(20).get();
      const hArr=[];hSnap.forEach(d=>hArr.push({id:d.id,...d.data()}));
      setHomeworks(hArr);
    }catch(e){}
  };
  useEffect(()=>{loadAll();},[]);

  const postNotice=async()=>{
    if(!noticeText.trim())return;
    setPosting(true);
    try{
      const now=new Date();const exp=new Date(now);exp.setDate(exp.getDate()+3);
      await db.collection('notices').add({text:noticeText.trim(),createdAt:now,expiresAt:exp});
      setNoticeText('');loadAll();
    }catch(e){alert('등록 실패');}
    setPosting(false);
  };

  const deleteNotice=async(id)=>{
    if(!window.confirm('공지를 삭제할까요?'))return;
    try{await db.collection('notices').doc(id).delete();loadAll();}catch(e){}
  };

  const deleteHomework=async(id)=>{
    if(!window.confirm('숙제를 삭제(비활성화)할까요?'))return;
    try{await db.collection('homework').doc(id).set({active:false},{merge:true});loadAll();}catch(e){}
  };

  const fmt=ts=>{if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleDateString('ko-KR');};
  const isExpired=ts=>{if(!ts)return true;const d=ts.toDate?ts.toDate():new Date(ts);return d<new Date();};

  return(<div className="p-4 space-y-5 pb-36">
    {/* 전체공지 작성 */}
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="text-sm font-black text-gray-600 mb-3">📢 전체 공지 작성</div>
      <div className="text-xs text-gray-400 mb-3">등록 후 3일간 모든 학생의 홈 화면에 표시됩니다.</div>
      <textarea value={noticeText} onChange={e=>setNoticeText(e.target.value)} placeholder="모든 학생에게 전달할 내용을 입력하세요" rows={4} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-indigo-400 mb-3"/>
      <button onClick={postNotice} disabled={posting||!noticeText.trim()} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-40 active:scale-95 transition-all">
        {posting?'등록 중...':'전체 공지 등록 📢'}
      </button>
    </div>

    {/* 등록된 공지 목록 */}
    <div>
      <div className="text-sm font-black text-gray-500 mb-2 px-1">등록된 공지 ({notices.length})</div>
      {notices.length===0&&<div className="text-center text-gray-400 py-6 text-sm">등록된 공지가 없습니다</div>}
      <div className="space-y-3">
        {notices.map(n=>{
          const expired=isExpired(n.expiresAt);
          return(<div key={n.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${expired?'border-gray-300 opacity-60':'border-indigo-400'}`}>
            <div className="flex items-center gap-2 mb-2">
              {expired?<span className="text-xs bg-gray-200 text-gray-500 font-bold px-2 py-0.5 rounded-full">만료됨</span>
                      :<span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">표시 중</span>}
              <span className="text-xs text-gray-400 ml-auto">만료: {fmt(n.expiresAt)}</span>
            </div>
            <p className="text-sm text-gray-700 font-medium leading-relaxed break-keep mb-3">{n.text}</p>
            <button onClick={()=>deleteNotice(n.id)} className="text-xs text-red-500 font-bold px-3 py-1.5 bg-red-50 rounded-lg active:scale-95">🗑️ 삭제</button>
          </div>);
        })}
      </div>
    </div>

    {/* 숙제 목록 */}
    <div>
      <div className="text-sm font-black text-gray-500 mb-2 px-1">📝 등록된 숙제 ({homeworks.length})</div>
      <div className="text-xs text-gray-400 mb-3 px-1">숙제는 학습지 탭 → 모의고사 생성 후 "숙제로 내기" 버튼으로 추가합니다.</div>
      {homeworks.length===0&&<div className="text-center text-gray-400 py-6 text-sm">등록된 숙제가 없습니다</div>}
      <div className="space-y-3">
        {homeworks.map(h=>{
          const expired=isExpired(h.expiresAt)||h.active===false;
          const done=(h.completedBy||[]).length;
          return(<div key={h.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${expired?'border-gray-300 opacity-60':'border-green-400'}`}>
            <div className="flex items-center gap-2 mb-2">
              {expired?<span className="text-xs bg-gray-200 text-gray-500 font-bold px-2 py-0.5 rounded-full">비활성</span>
                      :<span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">진행 중</span>}
              <span className="text-xs text-gray-400 ml-auto">완료: {done}명</span>
            </div>
            <div className="font-bold text-gray-800 text-sm mb-1">{h.title}</div>
            <div className="text-xs text-gray-500 mb-3">{h.level||''} · {h.questions?.length||0}문항 · 만료: {fmt(h.expiresAt)}</div>
            {!expired&&<button onClick={()=>deleteHomework(h.id)} className="text-xs text-red-500 font-bold px-3 py-1.5 bg-red-50 rounded-lg active:scale-95">🗑️ 삭제</button>}
          </div>);
        })}
      </div>
    </div>
  </div>);
}
