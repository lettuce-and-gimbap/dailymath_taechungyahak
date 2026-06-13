function StudentDashboard({userData,onLogout,onUpdate}){
  const[tab,setTab]=useState('home');
  const[feedbacks,setFeedbacks]=useState([]);
  const[showFbModal,setShowFbModal]=useState(false);
  const TABS=[{k:'home',icon:'🏠',lbl:'홈'},{k:'practice',icon:'✏️',lbl:'문제풀기'},{k:'geometry',icon:'📐',lbl:'기하학'},{k:'exam',icon:'📝',lbl:'모의고사'},{k:'history',icon:'📅',lbl:'기록'}];

  // ── 접속 heartbeat: 30초마다 Firestore onlineStatus 갱신 ──
  useEffect(()=>{
    if(userData.role==='admin')return;
    const updateOnline=()=>{
      db.collection('onlineStatus').doc(userData.name).set({
        name:userData.name,
        lastSeen:new Date(),
        ts:Date.now()
      }).catch(()=>{});
    };
    updateOnline();
    const hb=setInterval(updateOnline,30000);
    const clearOnline=()=>{
      db.collection('onlineStatus').doc(userData.name).delete().catch(()=>{});
    };
    window.addEventListener('beforeunload',clearOnline);
    return()=>{clearInterval(hb);clearOnline();window.removeEventListener('beforeunload',clearOnline);};
  },[userData.name,userData.role]);

  // 학생 본인의 피드백 불러오기 및 안읽음 알림 체크
  useEffect(()=>{
    const fetchFb = async () => {
      try {
        const snap = await db.collection('feedback').where('studentName','==',userData.name).get();
        let arr = [];
        snap.forEach(d=>arr.push({id:d.id, ...d.data()}));
        arr.sort((a,b)=> {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        setFeedbacks(arr);
        // 안읽은 피드백이 하나라도 있으면 모달 띄우기
        if(arr.some(f => !f.read)) setShowFbModal(true);
      } catch(e) {}
    };
    fetchFb();
  },[userData.name]);

  // 확인 버튼 누르면 모두 읽음 처리
  const markAllAsRead = async () => {
    const unreads = feedbacks.filter(f => !f.read);
    for(let f of unreads) {
      await db.collection('feedback').doc(f.id).set({read: true}, {merge:true});
    }
    setFeedbacks(prev => prev.map(f => ({...f, read:true})));
    setShowFbModal(false);
  };

  return(<div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50 relative" style={{overflowX:'hidden',width:'100%',maxWidth:'100vw'}}>
    <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
      <div className="text-2xl">🎓</div>
      <h1 className="text-lg font-black text-gray-800 flex-1">태청야학 수학반</h1>
      <span className="text-sm font-bold text-gray-500">{userData.name}</span>
      <DarkToggle/>
      <button onClick={onLogout} className="text-xs text-gray-400 font-bold px-2 py-1 rounded-lg bg-gray-100">로그아웃</button>
    </header>
    <div className="flex-1 overflow-auto scroll-body">
      {tab==='home'&&<HomeTab userData={userData} onUpdate={onUpdate} onGoPractice={()=>setTab('practice')}/>}
      {tab==='practice'&&<DailyPracticeTab userData={userData} onUpdate={onUpdate}/>}
      {tab==='geometry'&&<GeometryTab userData={userData} onUpdate={onUpdate}/>}
      {tab==='exam'&&<MockExamTab userData={userData} onUpdate={onUpdate}/>}
      {/* 기록 탭으로 가져온 피드백 데이터를 넘겨줌 */}
      {tab==='history'&&<HistoryTab userData={userData} feedbacks={feedbacks}/>}
    </div>
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20 max-w-lg mx-auto">
      <div className="flex">{TABS.map(t=><button key={t.k} onClick={()=>setTab(t.k)} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${tab===t.k?'text-indigo-600':'text-gray-400'}`}><span className="text-2xl">{t.icon}</span><span className="text-xs font-bold">{t.lbl}</span></button>)}</div>
      <div className="text-center text-[10px] text-gray-300 font-semibold pb-1 tracking-wide">Made by 소명 🎓</div>
    </nav>

    {/* 피드백 도착 알림 모달 */}
    {showFbModal && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col fade-in">
          <div className="text-center mb-4 flex-shrink-0">
            <div className="text-5xl mb-2">💌</div>
            <div className="text-xl font-black text-gray-800">선생님의 피드백 도착!</div>
            <div className="text-sm text-gray-500 mt-1">새로운 피드백을 확인해보세요.</div>
          </div>
          <div className="space-y-3 mb-6 overflow-y-auto flex-1 p-1">
            {feedbacks.filter(f => !f.read).map(fb => (
              <div key={fb.id} className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 shadow-sm">
                {fb.relatedLog && <div className="text-xs text-indigo-600 font-black mb-2 bg-white px-2.5 py-1.5 rounded-lg inline-block border border-indigo-100">📋 {fb.relatedLog}</div>}
                <div className="text-gray-800 font-bold text-base leading-relaxed">{fb.message}</div>
              </div>
            ))}
          </div>
          <button onClick={markAllAsRead} className="w-full py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl active:scale-95 transition-all flex-shrink-0">확인했습니다 ✓</button>
        </div>
      </div>
    )}
  </div>);
}

/* ===== TEACHER DASHBOARD ===== */

/* ── 객관적 학습 지표 분석 엔진 (v8 재설계) ──
   설계 원칙:
   - 출제자 주관 태그(getDiffWeight) 완전 폐기
   - 학생 행동 로그(firstClickMs, revisionCount, timeSec)에서 직접 추출
   - 크로스-학생 토픽 통계(qStats)로 상대적 난이도 측정
   - 데이터 없을 때 "데이터 부족" 명시 → 가짜 지표 표시 금지

   객관 지표 4축:
   1. 실질 참여 추정      - 유휴 추정 포함 세션 시간 분석 (estimateActiveTime)
   2. 망설임 패턴 분포    - firstClickMs 기반 행동 분류
   3. 답안 수정 패턴      - revisionCount 기반 행동 분류
   4. 영역 상대 성취도    - qStats(크로스-학생) 기반 동적 난이도 대비 성취

   + 시계열 모멘텀 (순수 정답률 추이, 객관)
*/

// ── 기본 집계 (주관 가중치 없이 순수 정답률) ──
function calcRawAccuracy(questions){
  if(!questions||questions.length===0)return null;
  const c=questions.filter(q=>q.isOk).length;
  return Math.round((c/questions.length)*100);
}

// ── 시계열 모멘텀 (순수 정답률 기반 - 객관적) ──
function detectMomentum(logs){
  const sessions=logs.slice(0,10)
    .map(l=>calcRawAccuracy(l.questions))
    .filter(v=>v!==null);
  if(sessions.length<3)return{trend:'insufficient',delta:0,sessions};
  const half=Math.floor(sessions.length/2);
  const avgRecent=sessions.slice(0,half).reduce((a,b)=>a+b,0)/half;
  const avgOlder=sessions.slice(half).reduce((a,b)=>a+b,0)/(sessions.length-half);
  const delta=Math.round(avgRecent-avgOlder);
  const trend=delta>=8?'rising':delta<=-8?'declining':'stable';
  return{trend,delta,sessions,avgRecent:Math.round(avgRecent),avgOlder:Math.round(avgOlder)};
}

// ── 망설임 패턴 분포 집계 ──
function buildHesitationProfile(logs){
  const base={impulsive:0,fluent:0,effortful:0,struggling:0,moderate:0,unknown:0};
  // DailyPractice(순차 1문항씩) vs ListFormat(기하/모의고사 동시 렌더)은 firstClickMs 해석이 다름
  const isListFormat=t=>t?.includes('모의고사')||t?.includes('기하:')||t?.includes('약점');

  const seq={...base};let seqTotal=0;  // DailyPractice: 진짜 망설임 시간
  const lst={...base};let lstTotal=0;  // ListFormat: 세션 내 참여 타이밍

  logs.slice(0,8).forEach(l=>{
    const isList=isListFormat(l.type);
    if(!l.questions)return;
    l.questions.forEach(q=>{
      const cls=classifyHesitation(q.firstClickMs,q.isOk);
      if(isList){lst[cls]=(lst[cls]||0)+1;lstTotal++;}
      else{seq[cls]=(seq[cls]||0)+1;seqTotal++;}
    });
  });
  return{
    seq:{counts:seq,total:seqTotal,hasData:seqTotal>0&&seq.unknown<seqTotal},
    lst:{counts:lst,total:lstTotal,hasData:lstTotal>0&&lst.unknown<lstTotal},
  };
}

// ── 답안 수정 패턴 분포 집계 (ListFormat 전용: DailyPractice는 revisionCount 미수집) ──
function buildRevisionProfile(logs){
  const counts={fixated:0,confident:0,uncertain_capable:0,searching:0,reconsidered:0};
  let total=0;
  const isListFormat=t=>t?.includes('모의고사')||t?.includes('기하:')||t?.includes('약점');

  logs.slice(0,8).forEach(l=>{
    if(!isListFormat(l.type))return; // DailyPractice 명시적 제외
    if(!l.questions)return;
    l.questions.forEach(q=>{
      if(q.revisionCount===null||q.revisionCount===undefined)return; // 구버전 로그 무시
      const cls=classifyRevision(q.revisionCount,q.isOk);
      counts[cls]=(counts[cls]||0)+1;
      total++;
    });
  });
  return{counts,total,hasData:total>0};
}

// ── 세션별 참여 시간 집계 ──
function buildActiveTimeSummary(logs){
  let totalActive=0,totalIdle=0,flaggedSessions=0;
  const recentLogs=logs.slice(0,6);
  recentLogs.forEach(l=>{
    if(!l.totalSec)return;
    const qCount=l.questions?.length||10;
    const{activeSec,idleSec,flagged}=estimateActiveTime(l.totalSec,qCount);
    totalActive+=activeSec;
    totalIdle+=idleSec;
    if(flagged)flaggedSessions++;
  });
  return{
    totalActive,totalIdle,flaggedSessions,
    sessionCount:recentLogs.filter(l=>l.totalSec).length,
    avgActiveMin:recentLogs.length>0?Math.round(totalActive/Math.max(recentLogs.filter(l=>l.totalSec).length,1)/60):0
  };
}

/* ── 자기주도 탐색 요약 (그래프 탐험 상호작용 기반) ──
   체류 시간 대신 상호작용 횟수·실질 조작 시간·탐색 개념 폭을 집계.
   '성취도'가 아닌 '탐색 참여' 지표이며, 동일 개념 퀴즈 정답률과 연계 해석을 위한
   conceptLink를 함께 산출한다(탐색이 실제 실력으로 이어졌는지 확인하는 용도). */
var GEO_CONCEPT_LABELS={rad:'무리함수',rat:'유리함수',qua:'이차함수',dis:'점↔직선',cir:'원',sym:'대칭이동'};
function buildExploreSummary(student){
  const x=student.geoExplore;
  if(!x||!x.sessions)return{has:false};
  const conceptsObj=x.concepts||{};
  const breadth=Object.keys(conceptsObj).filter(k=>conceptsObj[k]>0).length; // 탐색한 개념 수(0~6)
  const activeMin=Math.round((x.totalActiveSec||0)/60*10)/10;
  const perSession=x.sessions>0?Math.round((x.totalInteractions||0)/x.sessions):0;

  // 탐색-성취 연계: 많이 탐색한 개념의 기하 퀴즈 정답률을 매칭
  const logs=student.logs||[];
  const quizByConcept={}; // 개념라벨 → {c,t}
  logs.forEach(l=>{
    (l.questions||[]).forEach(q=>{
      const t=q.meta?.type; if(!t)return;
      if(!quizByConcept[t])quizByConcept[t]={c:0,t:0};
      quizByConcept[t].t++; if(q.isOk)quizByConcept[t].c++;
    });
  });
  const conceptLink=Object.keys(conceptsObj)
    .filter(k=>conceptsObj[k]>0)
    .map(k=>{
      const lbl=GEO_CONCEPT_LABELS[k]||k;
      const qz=quizByConcept[lbl];
      return{concept:lbl,explores:conceptsObj[k],quizRate:qz&&qz.t>0?Math.round((qz.c/qz.t)*100):null,quizN:qz?qz.t:0};
    })
    .sort((a,b)=>b.explores-a.explores);

  return{has:true,sessions:x.sessions,activeMin,totalInteractions:x.totalInteractions||0,perSession,breadth,conceptLink};
}

// ── 크로스-학생 qStats 로드 (비동기, 교사 대시보드용) ──
async function fetchQStatsForLogs(logs){
  const hashes=new Set();
  logs.slice(0,8).forEach(l=>{
    if(!l.questions)return;
    l.questions.forEach(q=>{if(q.qTopicHash)hashes.add(q.qTopicHash);});
  });
  if(hashes.size===0)return{};
  try{
    const snap=await db.collection('qStats').get();
    const map={};
    snap.forEach(d=>{if(hashes.has(d.id))map[d.id]=d.data();});
    return map;
  }catch(e){return{};}
}

// ── 영역 상대 성취도 (qStats 기반) ──
function buildRelativeMastery(logs,qStats){
  const topicMap={};
  logs.slice(0,8).forEach(l=>{
    if(!l.questions)return;
    l.questions.forEach(q=>{
      const h=q.qTopicHash;
      if(!h)return;
      const topic=q.meta?.type||'기타';
      if(!topicMap[h])topicMap[h]={topic,myTotal:0,myCorrect:0,allTotal:0,allCorrect:0};
      topicMap[h].myTotal++;
      if(q.isOk)topicMap[h].myCorrect++;
      if(qStats[h]){
        topicMap[h].allTotal=qStats[h].total;
        topicMap[h].allCorrect=qStats[h].correct;
      }
    });
  });
  return Object.entries(topicMap)
    .filter(([,v])=>v.myTotal>=2)
    .map(([hash,v])=>{
      const myRate=Math.round((v.myCorrect/v.myTotal)*100);
      const allRate=v.allTotal>=5?Math.round((v.allCorrect/v.allTotal)*100):null; // N<5 미신뢰
      const gap=allRate!=null?myRate-allRate:null;
      return{hash,topic:v.topic,myRate,allRate,gap,myTotal:v.myTotal,allTotal:v.allTotal};
    })
    .sort((a,b)=>a.myRate-b.myRate);
}

// ── 신호등 분류 (순수 정답률 기반) ──
function analyzeStudent(sData){
  let daysInactive=999;
  if(sData.lastDate){
    const today=new Date();today.setHours(0,0,0,0);
    const last=new Date(sData.lastDate);last.setHours(0,0,0,0);
    daysInactive=Math.floor((today-last)/(1000*60*60*24));
  }
  let recentAcc=100;
  const logs=sData.logs||[];
  if(logs.length>0){
    const recentQs=logs.slice(0,3).flatMap(l=>l.questions||[]);
    if(recentQs.length>0)recentAcc=Math.round((recentQs.filter(q=>q.isOk).length/recentQs.length)*100);
  }
  let color='light-grn',icon='🟢',text='순항 중';
  if(daysInactive>=5||(recentAcc>0&&recentAcc<40)){color='light-red';icon='🔴';text='집중 케어 필요';}
  else if(daysInactive>=3||(recentAcc>=40&&recentAcc<70)){color='light-yel';icon='🟡';text='격려 필요';}
  return{daysInactive,recentAcc,status:{color,icon,text}};
}
var daysText=d=>d===0?'오늘':d===1?'어제':d===999?'기록없음':`${d}일 전`;

