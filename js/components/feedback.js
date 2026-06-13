function StudentFeedbackPanel(){
  const[msgs,setMsgs]=React.useState([]);const[loading,setLoading]=React.useState(false);
  const load=async()=>{setLoading(true);try{const snap=await db.collection('studentFeedback').orderBy('sentAt','desc').limit(30).get();const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));setMsgs(arr);}catch(e){}setLoading(false);};
  React.useEffect(()=>{load();},[]);
  const fmtTime=ts=>{if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleDateString('ko-KR')+' '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});};
  const markRead=async(id)=>{try{await db.collection('studentFeedback').doc(id).set({read:true},{merge:true});setMsgs(prev=>prev.map(m=>m.id===id?{...m,read:true}:m));}catch(e){}};
  const del=async(id)=>{if(!confirm('이 의견을 삭제할까요?'))return;try{await db.collection('studentFeedback').doc(id).delete();setMsgs(prev=>prev.filter(m=>m.id!==id));}catch(e){alert('삭제 실패');}};
  return(<div className="bg-white rounded-3xl p-5 shadow-md mb-4">
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-bold text-gray-400 uppercase">💬 학생 의견 수신함</div>
      <button onClick={load} className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold">새로고침</button>
    </div>
    {loading&&<div className="text-center text-gray-400 py-4">로딩 중...</div>}
    {!loading&&msgs.length===0&&<div className="text-center text-gray-400 py-4 text-sm">받은 의견이 없어요.</div>}
    {msgs.map(m=><div key={m.id} className={`border rounded-2xl p-3.5 mb-2.5 ${m.read?'border-gray-100 bg-gray-50':'border-indigo-200 bg-indigo-50'}`}>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="font-black text-gray-800 text-sm">👤 {m.studentName}</span>
        {!m.read&&<span className="text-[11px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">NEW</span>}
        <span className="text-[11px] text-gray-400 ml-auto">{fmtTime(m.sentAt)}</span>
      </div>
      <p className="text-sm text-gray-700 font-medium leading-relaxed break-keep">{m.message}</p>
      <div className="flex gap-2 mt-2.5 justify-end">
        {!m.read&&<button onClick={()=>markRead(m.id)} className="text-[11px] px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-bold">✓ 읽음 처리</button>}
        <button onClick={()=>del(m.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
      </div>
    </div>)}
  </div>);
}
function FeedbackTab(){
  const[showStudentFb,setShowStudentFb]=useState(true);
  const[sid,setSid]=useState('');
  const[student,setStudent]=useState(null);
  const[msg,setMsg]=useState('');
  const[relatedLogIdx,setRelatedLogIdx]=useState(''); // index로 관리하여 데이터 접근 용이하게 함
  const[loading,setLoading]=useState(false);
  const[feedbacks,setFeedbacks]=useState([]);
  const[sent,setSent]=useState(false);
  const[editFbId,setEditFbId]=useState(null);
  const[editFbText,setEditFbText]=useState('');

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
        relatedLog: logStr, // 텍스트 꼬리표로 저장
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

  // 학생이 아직 읽지 않은 피드백만 수정 가능
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

  return(<div className="p-4 pb-36 space-y-4">
    <StudentFeedbackPanel/>
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">💬 학생 피드백 & 기록</div>
      <div className="flex flex-col gap-2 mb-3">
        <input type="text" value={sid} onChange={e=>setSid(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="학생 이름 입력" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base font-bold focus:border-indigo-400 outline-none"/>
        <button onClick={search} className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-black text-base">{loading?'검색 중...':'🔍 학생 조회'}</button>
      </div>
      {student&&<div>
        <div className="bg-indigo-50 rounded-2xl p-4 mb-3 border border-indigo-200">
          <div className="font-black text-indigo-800 text-lg mb-1">👤 {student.name} 학생</div>
          <div className="text-sm text-indigo-600">총 레슨: {student.logs?.length||0}회 · 최근 접속: {student.lastLoginAt||student.lastDate||'없음'}</div>
        </div>
        
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-gray-600 mb-2">📌 어떤 문제에 대한 피드백인가요? (선택사항)</div>
          <select value={relatedLogIdx} onChange={e=>setRelatedLogIdx(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-400 outline-none mb-3 bg-gray-50 text-gray-700">
            <option value="">-- 특정 기록에 연결하지 않음 (일반 피드백) --</option>
            {student.logs?.slice(0, 15).map((log, i) => (
               <option key={i} value={i}>{fmtDate(log.date)} {log.time} | {log.type} | 점수: {log.score}</option>
            ))}
          </select>

          {/* 🔥 선택된 학습 기록의 정오표 렌더링 🔥 */}
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
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} placeholder="예: 나눗셈 계산은 잘했어요! 약수 부분을 좀 더 연습해봐요 😊" className="w-full border-2 border-gray-200 rounded-xl p-4 text-base font-bold resize-none focus:border-indigo-400 outline-none mb-3"/>
          <button onClick={send} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base active:scale-95 transition-transform">{sent?'✅ 전송완료!':'피드백 저장 및 전송 💌'}</button>
        </div>
        
        {feedbacks.length>0&&<div className="mt-6"><div className="text-sm font-bold text-gray-600 mb-3">📬 보낸 피드백 기록</div>
          {feedbacks.map((fb,i)=><div key={fb.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
               {fb.read
                 ? <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">학생이 읽음</span>
                 : <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">안 읽음</span>}
               <span className="text-[11px] text-gray-400 ml-auto">{fb.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || new Date(fb.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            {fb.relatedLog && <div className="text-[11px] text-indigo-600 font-black mb-2 inline-block bg-white px-2 py-1 rounded-lg border border-indigo-100 break-keep">관련: {fb.relatedLog}</div>}
            {editFbId===fb.id?(
              <div className="space-y-2">
                <textarea value={editFbText} onChange={e=>setEditFbText(e.target.value)} rows={3} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-base font-bold resize-none outline-none focus:border-indigo-400"/>
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

