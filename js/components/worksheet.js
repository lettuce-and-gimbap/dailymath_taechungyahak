function WorksheetTab(){
  const[wsType,setWsType]=useState('div');
  const[title,setTitle]=useState('');
  const[count,setCount]=useState(20);
  const[gcdMin,setGcdMin]=useState(12); const[gcdMax,setGcdMax]=useState(50);
  const[lcmMin,setLcmMin]=useState(2); const[lcmMax,setLcmMax]=useState(9);
  const[storyCounts,setStoryCounts]=useState({low:5, mid:3, high:2});
  const[opRatios,setOpRatios]=useState({add:25, sub:25, mul:25, div:25});
  const[wsList,setWsList]=useState([]);const[loading,setLoading]=useState(false);const[toast,setToast]=useState('');
  
  // 이름 수정 전용 상태
  const[editingWsId, setEditingWsId] = useState(null);
  const[editTitle, setEditTitle] = useState('');

  // 모의고사 문제지 전용 상태
  const[examSheet,setExamSheet]=useState(null); // 생성된 문제지 미리보기
  const[examMode,setExamMode]=useState('random'); // 'random' | 'weak'
  const[targetStudent,setTargetStudent]=useState(''); // 취약점 분석 대상 학생

  // 채점(Grading) 전용 상태
  const[gradeModal, setGradeModal] = useState(null);
  const[studentList, setStudentList] = useState([]);
  const[selStudent, setSelStudent] = useState('');
  const[grades, setGrades] = useState({});

  const TYPE_DESC={div:'세 자리 수 ÷ 두 자리 수 (가로셈, 나머지 있음)',gcd:'두 수의 약수, 공약수, 최대공약수 구하기',lcm:'두 수의 배수 7개씩, 공배수, 최소공배수 구하기',story:'초3~초4 맞춤형 스토리텔링 문장제 문제',mock_middle:'2021~2026 중졸 검정고시 최근 핵심 유형 변형 (10문항 사지선다)',mock_high:'2021~2026 고졸 검정고시 최근 핵심 유형 변형 (10문항 사지선다)',geo:'기하학 6파트 (무리/유리/이차함수·거리·원·대칭이동) 사지선다 문제'};

  // 영역별 정답률 계산 (학생 로그 기반)
  const HIGH_DOMAIN_GENS_T={'다항식 계산':genMockPoly,'방정식과 부등식':genMockEqInequal,'도형과 기하':genMockGeometry,'집합과 함수':genMockSetFunc,'확률과 통계':genMockProbStat};
  const DOMAIN_GENS_T=wsType==='mock_middle'?MID_DOMAIN_GENS:HIGH_DOMAIN_GENS_T;
  const DOMAINS_T=Object.keys(DOMAIN_GENS_T);
  const computeStatsT=(logs)=>{
    const s={};DOMAINS_T.forEach(d=>s[d]={c:0,t:0});
    (logs||[]).forEach(log=>{
      if(!log.questions)return;
      log.questions.forEach(q=>{
        const type=(q.meta?.type||log.type||'').toLowerCase();
        const cat=(q.meta?.category||'').toLowerCase();
        const exact=DOMAINS_T.find(d=>type.includes(d.toLowerCase()));
        if(exact){s[exact].t++;if(q.isOk)s[exact].c++;return;}
        if(wsType==='mock_middle')return;
        if(type.includes('다항식')||cat==='poly'||type.includes('항등식')||type.includes('인수분해')||type.includes('나머지'))
          {s['다항식 계산'].t++;if(q.isOk)s['다항식 계산'].c++;}
        else if(type.includes('방정식')||type.includes('부등식')||cat==='eq'||cat==='ineq')
          {s['방정식과 부등식'].t++;if(q.isOk)s['방정식과 부등식'].c++;}
        else if(type.includes('기하')||type.includes('도형')||cat==='geometry')
          {s['도형과 기하'].t++;if(q.isOk)s['도형과 기하'].c++;}
        else if(type.includes('함수')||type.includes('집합')||type.includes('명제')||cat==='set'||cat==='func')
          {s['집합과 함수'].t++;if(q.isOk)s['집합과 함수'].c++;}
        else if(type.includes('확률')||type.includes('순열')||type.includes('조합')||cat==='stat')
          {s['확률과 통계'].t++;if(q.isOk)s['확률과 통계'].c++;}
      });
    });
    return s;
  };

  // 모의고사 문제지 생성
  const createExamSheet=()=>{
    const safeGen=(gen)=>{try{const q=gen();return q||null;}catch(e){return null;}};
    let pool=[];
    if(examMode==='weak'&&targetStudent){
      const stu=studentList.find(s=>s.name===targetStudent);
      const stats=stu?computeStatsT(stu.logs||[]):{};
      const weakDomains=DOMAINS_T.filter(d=>!stats[d]||stats[d].t===0||(stats[d].c/stats[d].t)<0.7);
      const targets=weakDomains.length>0?weakDomains:DOMAINS_T;
      // ── 취약점 모드 중복 방지: 토픽 + 문제 텍스트 기준 ──
      const seenQ=new Set();
      let safety=0;
      while(pool.length<10&&safety<60){
        safety++;
        const dom=targets[pool.length%targets.length];
        const q=safeGen(DOMAIN_GENS_T[dom]);
        if(q){
          const qKey=`${q.topic}::${q.q?.slice(0,30)||''}`;
          if(!seenQ.has(qKey)){seenQ.add(qKey);pool.push(q);}
        }
      }
    }else{
      // ── 랜덤 모드: 토픽 중복 방지 + 문제 텍스트 중복 방지 ──
      const usedTopics=new Set();
      const usedQTexts=new Set();
      DOMAINS_T.forEach(dom=>{
        let added=0,retries=0;
        while(added<2&&retries<15){
          const q=safeGen(DOMAIN_GENS_T[dom]);
          if(q){
            const qKey=`${q.topic}::${q.q?.slice(0,30)||''}`;
            const topicOk=!usedTopics.has(q.topic);
            const textOk=!usedQTexts.has(qKey);
            if(topicOk&&textOk){
              usedTopics.add(q.topic);usedQTexts.add(qKey);pool.push(q);added++;
            } else if(retries>=13&&textOk){
              // 토픽 중복은 허용하되 문제 텍스트 중복은 끝까지 방지
              usedQTexts.add(qKey);pool.push(q);added++;
            }
          }
          retries++;
        }
      });
      pool=shuffle(pool);
    }
    let safety=0;
    const usedTopicsAll=new Set(pool.map(q=>q.topic));
    const usedQAll=new Set(pool.map(q=>`${q.topic}::${q.q?.slice(0,30)||''}`));
    while(pool.length<10&&safety++<30){
      const q=safeGen(pick(Object.values(DOMAIN_GENS_T)));
      if(q){
        const qKey=`${q.topic}::${q.q?.slice(0,30)||''}`;
        if(!usedQAll.has(qKey)){usedTopicsAll.add(q.topic);usedQAll.add(qKey);pool.push(q);}
        else if(safety>20){usedQAll.add(qKey);pool.push(q);} // 최후 수단
      }
    }
    const level=wsType==='mock_middle'?'중졸':'고졸';
    const t=title.trim()||`${level} 검정고시 모의고사 (${todayStr()})`;
    const mode=examMode==='weak'&&targetStudent?`취약점 공략 - ${targetStudent} 학생`:'랜덤 혼합';
    setExamSheet({title:t,mode,level,wsType,questions:pool.slice(0,10)});
    setExamSaved(false);
  };

  // 모의고사 문제지 인쇄 (브라우저 프린트)
  const printExamSheet=(showAns)=>{
    if(!examSheet)return;
    const ORD=['①','②','③','④'];
    let html=`<html><head><style>
      body{font-family:'Noto Sans KR',sans-serif;padding:32px;color:#111;}
      h1{text-align:center;font-size:22px;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:6px;}
      .meta{text-align:center;font-size:12px;color:#666;margin-bottom:24px;}
      .q{margin-bottom:22px;page-break-inside:avoid;}
      .qnum{font-weight:900;color:#4338ca;margin-right:6px;}
      .qtag{font-size:11px;background:#eef2ff;color:#4338ca;padding:2px 8px;border-radius:20px;margin-left:6px;font-weight:700;}
      .choices{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;margin-left:16px;}
      .choice{font-size:13px;padding:4px 0;}
      .ans{margin-top:6px;margin-left:16px;font-size:12px;color:#dc2626;font-weight:700;display:${showAns?'block':'none'};}
      .exp{margin-top:6px;margin-left:16px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px;line-height:1.55;color:#78350f;display:${showAns?'block':'none'};}
      @media print{body{padding:16px;} .q{margin-bottom:16px;}}
    </style></head><body>
    <h1>${examSheet.title}</h1>
    <div class="meta">${examSheet.level||'고졸'} · 출제 방식: ${examSheet.mode} · 총 10문항 · 검정고시 기출 변형</div>`;
    examSheet.questions.forEach((q,i)=>{
      html+=`<div class="q">
        <div><span class="qnum">${i+1}.</span>${q.q}<span class="qtag">${q.topic}</span></div>
        <div class="choices">${q.choices.map((c,j)=>`<div class="choice">${ORD[j]} ${c}</div>`).join('')}</div>
        <div class="ans">정답: ${ORD[q.answer]} ${q.choices[q.answer]}</div>
        <div class="exp"><b>쉬운 해설:</b> ${easyExplanation(q)}</div>
      </div>`;
    });
    html+=`</body></html>`;
    const w=window.open('','_blank','width=800,height=900');
    w.document.write(html);w.document.close();
    setTimeout(()=>w.print(),400);
  };

  // 모의고사 문제지 Firestore 저장
  const[examSaved,setExamSaved]=useState(false);
  const saveExamSheet=async()=>{
    if(!examSheet||examSaved)return;
    try{
      const ws={title:examSheet.title,wsType:examSheet.wsType||'mock_high',level:examSheet.level||'고졸',mode:examSheet.mode,questions:examSheet.questions,createdAt:new Date()};
      await db.collection('worksheets').add(ws);
      setExamSaved(true);
      showToast('✅ 저장된 문제지에 추가되었습니다!');
      loadWsList();
    }catch(e){showToast('❌ 저장 실패. 인터넷을 확인하세요.');}
  };

  useEffect(()=>{
    db.collection('users').where('role','==','student').get().then(snap => {
       const arr = []; snap.forEach(d => arr.push(d.data())); setStudentList(arr);
    });
    loadWsList(); // 학습지 탭 첫 진입 시 문제집 폴더 자동 로딩(새로고침 불필요)
  },[]);
  
  const loadWsList=async()=>{try{const snap=await db.collection('worksheets').orderBy('createdAt','desc').limit(30).get();const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));setWsList(arr)}catch(e){}};
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(''),2500)};

  const handleRatioChange = (op, val) => {
    let newVal = Math.max(0, parseInt(val) || 0);
    setOpRatios(prev => ({ ...prev, [op]: newVal }));
  };

  const create=async()=>{
    if (wsType === 'story') {
      const totalRatio = opRatios.add + opRatios.sub + opRatios.mul + opRatios.div;
      if (totalRatio !== 100) { showToast(`❌ 비율의 합이 100%가 되어야 합니다! (현재: ${totalRatio}%)`); return; }
    }
    if(wsType.startsWith('mock_')||wsType==='geo'){showToast('먼저 [생성 →] 버튼으로 문제를 만든 후 저장하세요.');setLoading(false);return;}
    setLoading(true);try{
      let qs=[];
      if (wsType === 'story') qs = generateStoryWorksheet(storyCounts, opRatios);
      else {
        // ── 학습지 중복 방지: 같은 (a,b) 쌍이 나오지 않도록 ──
        const seenPairs = new Set();
        let attempts = 0;
        const MAX_ATTEMPTS = count * 20;
        while(qs.length < count && attempts < MAX_ATTEMPTS){
          attempts++;
          let q;
          if(wsType==='gcd')       q = genGCDQuestion(gcdMin, gcdMax);
          else if(wsType==='lcm')  q = genLCMQuestion(lcmMin, lcmMax);
          else                     q = generate3By2Div();
          // 키: a와 b의 조합 (순서 무관)
          const key = wsType==='div' ? `${q.a}-${q.b}` : `${Math.min(q.a,q.b)}-${Math.max(q.a,q.b)}`;
          if(!seenPairs.has(key)){
            seenPairs.add(key);
            qs.push(q);
          }
        }
        // fallback: 중복 허용하여 나머지 채우기
        while(qs.length < count){
          if(wsType==='gcd')       qs.push(genGCDQuestion(gcdMin, gcdMax));
          else if(wsType==='lcm')  qs.push(genLCMQuestion(lcmMin, lcmMax));
          else                     qs.push(generate3By2Div());
        }
      }
      const ws={title:title.trim()||`${todayStr()} 학습지`,wsType,questions:qs,createdAt:new Date()};
      await db.collection('worksheets').add(ws);setTitle('');showToast('✅ 문제지 생성 완료!');loadWsList();
    }catch(e){showToast('❌ 생성 실패. 인터넷을 확인하세요.')}setLoading(false);
  };
  
var del=async(id)=>{if(!confirm('이 문제지를 삭제하시겠습니까?'))return;try{await db.collection('worksheets').doc(id).delete();showToast('🗑️ 삭제되었습니다.');loadWsList()}catch(e){}};
  
  const renameWs = async (id) => {
    if(!editTitle.trim()) { setEditingWsId(null); return; }
    try {
      await db.collection('worksheets').doc(id).update({title: editTitle.trim()});
      showToast('✅ 이름이 변경되었습니다.');
      setEditingWsId(null);
      loadWsList();
    } catch(e) { showToast('❌ 변경 실패. 인터넷을 확인하세요.'); }
  };

  // ── 오프라인 학습지 채점 제출 함수 ──
  const submitGrades = async () => {
    if(!selStudent) { alert('채점할 학생을 먼저 선택해주세요!'); return; }
    const targetStudent = studentList.find(s => s.name === selStudent);
    if(!targetStudent) return;
    
    // 문제 포맷을 로그 포맷으로 변환
    // 채점 완료 시 gradedCount 업데이트
    try{
      const wsRef=db.collection('worksheets').doc(gradeModal.id);
      await wsRef.update({gradedCount:(gradeModal.gradedCount||0)+1});
    }catch(e){}
    const qs = gradeModal.questions.map((q, i) => {
       const isStory = gradeModal.wsType === 'story';
       let qTxt = isStory ? q.txt : (q.type==='gcd' ? `${q.a}와 ${q.b} 최대공약수` : (q.type==='lcm' ? `${q.a}와 ${q.b} 최소공배수` : `${q.a} ÷ ${q.b}`));
       let cAns = isStory ? q.ans : (q.type==='gcd' ? q.gcdVal : (q.type==='lcm' ? q.lcmVal : `몫 ${q.q}, 나머지 ${q.r}`));
       let isOk = !!grades[i]; // 체크했으면 true, 아니면 false
       return {
          qTxt, 
           uAns: isOk ? '정답' : '오답 (선생님 채점)',
           cAns: String(cAns), 
           isOk, 
           explanation: easyExplanation({...q,topic:isStory?'문장제 문제':q.type||'계산 문제'}),
           timeSec: 0 // 오프라인이라 시간 측정 불가
       };
    });
    
    const correctCount = qs.filter(q => q.isOk).length;
    const log = {
        date: todayStr(), time: timeStr(), type: `학습지: ${gradeModal.title}`,
        score: `${correctCount} / ${qs.length}`, questions: qs, totalSec: 0
    };
    
    const upd = {...targetStudent, logs: [log, ...(targetStudent.logs||[])]};
    try {
        await db.collection('users').doc(upd.name).set(upd, {merge:true});
        alert(`✅ ${selStudent} 학생의 학습 기록에 추가되었습니다!`);
        setGradeModal(null);
    } catch(e) { alert('기록 저장 중 오류가 발생했습니다.'); }
  };

  // ── 모의고사 문제지 미리보기 화면 ──
  if(examSheet){
    const ORD=['①','②','③','④'];
    return(<div className="p-4 pb-36 space-y-4">
      <button onClick={()=>setExamSheet(null)} className="text-gray-500 font-bold text-sm">← 뒤로</button>
      <div className="bg-indigo-600 text-white rounded-3xl p-5 shadow-lg">
        <div className="font-black text-lg mb-1">{examSheet.title}</div>
        <div className="text-xs opacity-80">출제 방식: {examSheet.mode} · 총 10문항</div>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>printExamSheet(false)} className="flex-1 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-2xl font-black text-sm active:scale-95 transition-transform">🖨️ 문제지 인쇄</button>
        <button onClick={()=>printExamSheet(true)} className="flex-1 py-3 bg-indigo-100 border-2 border-indigo-300 text-indigo-700 rounded-2xl font-black text-sm active:scale-95 transition-transform">📋 답지 포함 인쇄</button>
      </div>
      <button onClick={saveExamSheet} disabled={examSaved} className={`w-full py-3 rounded-2xl font-black text-sm transition-all ${examSaved?'bg-green-100 text-green-700 border-2 border-green-300 cursor-default':'bg-emerald-500 text-white active:scale-95'}`}>
        {examSaved?'✅ 저장 완료 (저장된 문제지에서 확인)':'💾 문제집 폴더에 저장하기'}
      </button>
      {examSheet.questions.map((q,i)=>(
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-black flex items-center justify-center">{i+1}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{q.topic}</span>
          </div>
          <div className="text-sm font-bold text-gray-800 leading-relaxed mb-3">{q.q}</div>
          {q.graph&&<div className="flex justify-center mb-2"><GraphPreview q={q}/></div>}
          <div className="grid grid-cols-2 gap-1.5">
            {q.choices.map((c,j)=><div key={j} className={`text-xs px-3 py-2 rounded-xl border font-semibold ${j===q.answer?'bg-green-50 border-green-300 text-green-800':'bg-gray-50 border-gray-200 text-gray-600'}`}>{ORD[j]} <MathText v={c}/></div>)}
          </div>
          <div className="mt-2 text-xs text-green-700 font-black bg-green-50 px-3 py-1.5 rounded-xl inline-block">정답: {ORD[q.answer]} <MathText v={q.choices[q.answer]}/></div>
          <ExplanationBox q={q}/>
        </div>
      ))}
      <button onClick={createExamSheet} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">🎲 다시 생성하기</button>
    </div>);
  }

  // ── 모달 렌더링 ──
  if (gradeModal) {
    return (
      <div className="p-4 pb-36 space-y-4 max-w-2xl mx-auto">
        <button onClick={() => setGradeModal(null)} className="text-gray-500 font-bold mb-2">← 뒤로 가기</button>
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-indigo-100">
          <div className="text-xl font-black text-gray-800 mb-2">📝 {gradeModal.title} 채점하기</div>
          <div className="text-sm text-gray-500 mb-6">오프라인으로 푼 학습지를 채점하여 학생의 데이터로 남깁니다.</div>
          
          <div className="mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
             <div className="text-sm font-bold text-indigo-800 mb-2">학생 선택</div>
             <select value={selStudent} onChange={e=>setSelStudent(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-indigo-400">
               <option value="">학생을 선택하세요</option>
               {studentList.map(s => <option key={s.name} value={s.name}>{s.name} 학생</option>)}
             </select>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between text-xs font-bold text-gray-400 uppercase px-2">
                <span>문항 및 정답</span>
                <span>맞았나요?</span>
             </div>
             {gradeModal.questions.map((q, i) => {
                 const isStory = gradeModal.wsType === 'story';
                 const cAns = isStory ? q.ans : (q.type==='gcd' ? q.gcdVal : (q.type==='lcm' ? q.lcmVal : `몫 ${q.q}, 나머지 ${q.r}`));
                 const isChecked = !!grades[i];
                 return (
                   <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                      <div className="flex-1 overflow-hidden">
                         <div className="font-bold text-sm text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis"><span className="text-indigo-500 mr-2">{i+1}.</span>{isStory ? q.txt : '연산 문제'}</div>
                         <div className="text-xs text-red-500 font-bold mt-1">정답: {cAns}</div>
                      </div>
                      <button 
                        onClick={() => setGrades(prev => ({...prev, [i]: !prev[i]}))}
                        className={`w-12 h-12 flex-shrink-0 rounded-xl text-2xl flex items-center justify-center font-black transition-colors ${isChecked ? 'bg-green-100 text-green-600 border-2 border-green-300' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>
                        {isChecked ? 'O' : 'X'}
                      </button>
                   </div>
                 );
             })}
          </div>
          
          <button onClick={submitGrades} className="w-full mt-6 py-4 bg-indigo-600 text-white text-lg font-black rounded-2xl active:scale-95 transition-transform">
             이 학생의 기록으로 저장하기 📊
          </button>
        </div>
      </div>
    );
  }

  // ── 기존 WorksheetTab 렌더링 코드 ──
  const exportWS=async(ws,isAns)=>{
      // 모의고사(mock) 타입은 브라우저 인쇄창 활용
      if(String(ws.wsType||'').startsWith('mock')){
        const ORD=['①','②','③','④'];
        let html=`<html><head><style>
          body{font-family:'Noto Sans KR',sans-serif;padding:32px;color:#111;}
          h1{text-align:center;font-size:22px;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:6px;}
          .meta{text-align:center;font-size:12px;color:#666;margin-bottom:24px;}
          .q{margin-bottom:22px;page-break-inside:avoid;}
          .qnum{font-weight:900;color:#4338ca;margin-right:6px;}
          .qtag{font-size:11px;background:#eef2ff;color:#4338ca;padding:2px 8px;border-radius:20px;margin-left:6px;font-weight:700;}
          .choices{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;margin-left:16px;}
          .choice{font-size:13px;padding:4px 0;}
          .ans{margin-top:6px;margin-left:16px;font-size:12px;color:#dc2626;font-weight:700;display:${isAns?'block':'none'};}
          .exp{margin-top:6px;margin-left:16px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:11px;line-height:1.55;color:#78350f;display:${isAns?'block':'none'};}
          @media print{body{padding:16px;}.q{margin-bottom:16px;}}
        </style></head><body>
        <h1>${ws.title}</h1>
        <div class="meta">${ws.level||'고졸'} · 출제 방식: ${ws.mode||'랜덤 혼합'} · 총 ${ws.questions.length}문항 · 검정고시 기출 변형</div>`;
        ws.questions.forEach((q,i)=>{
          html+=`<div class="q">
            <div><span class="qnum">${i+1}.</span>${q.q}<span class="qtag">${q.topic}</span></div>
            <div class="choices">${q.choices.map((c,j)=>`<div class="choice">${ORD[j]} ${c}</div>`).join('')}</div>
            <div class="ans">정답: ${ORD[q.answer]} ${q.choices[q.answer]}</div>
            <div class="exp"><b>쉬운 해설:</b> ${easyExplanation(q)}</div>
          </div>`;
        });
        html+=`</body></html>`;
        const w=window.open('','_blank','width=800,height=900');
        w.document.write(html);w.document.close();
        setTimeout(()=>w.print(),400);
        return;
      }
      const renderArea=document.getElementById('pdf-render-area');const jsPDF=window.jspdf.jsPDF;
      // 🔥 약수/배수 (GCD/LCM) 고품질 & 와이드 PDF 렌더링 🔥
      if(ws.wsType==='gcd'||ws.wsType==='lcm'){
        const builder=ws.wsType==='gcd'?buildGCDHTML:buildLCMHTML;
        let html='';
        const perPage = 4; // 한 페이지에 4문제만 큼직하게 배치!
        for(let p=0;p*perPage<ws.questions.length;p++){
          const pageQs=ws.questions.slice(p*perPage,(p+1)*perPage);
          html+=`<div style="width:794px;min-height:1123px;background:white;padding:50px 60px;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;">
            <div style="text-align:center;font-size:26px;font-weight:900;margin-bottom:30px;border-bottom:3px solid #000;padding-bottom:15px">${ws.title} ${isAns?'- 정답':''}(${p+1}/${Math.ceil(ws.questions.length/perPage)})</div>
            <div style="flex:1; display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:30px;">
              ${pageQs.map((q,i)=>builder(q,p*perPage+i+1,isAns)).join('')}
            </div>
          </div>`;
        }
        renderArea.innerHTML=html;await new Promise(r=>setTimeout(r,200));
        const pdf=new jsPDF('p','mm','a4');const pages=renderArea.querySelectorAll('[style*="page-break"]');
        for(let i=0;i<pages.length;i++){const c=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#fff',useCORS:true,allowTaint:true,windowWidth:794,scrollX:0,scrollY:0});if(i>0)pdf.addPage();const _w=210,_h=Math.round((c.height/c.width)*_w*100)/100;pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,_w,_h,undefined,'FAST')}
        renderArea.innerHTML='';pdf.save(`${ws.title}_${isAns?'답지':'문제지'}.pdf`);return;
      }
  
      const isStory = ws.wsType === 'story';
      const isDiv = ws.wsType === 'div';
      
      if (isAns) {
        // 정답지: 나눗셈은 최대 40문항 한 페이지, 그 이후 페이지 분할
        const ansPerPage = isStory ? 30 : 40;
        let html = '';
        for(let p=0;p*ansPerPage<ws.questions.length;p++){
          const pageQs=ws.questions.slice(p*ansPerPage,(p+1)*ansPerPage);
          const cols = isStory ? 3 : 5;
          html+=`<div style="width:794px;min-min-height:1123px;background:white;padding:40px 50px;box-sizing:border-box;page-break-after:always">`;
          html+=`<div style="text-align:center;font-size:24px;font-weight:900;margin-bottom:24px;border-bottom:3px solid #000;padding-bottom:10px">${ws.title} - 정답${ws.questions.length>ansPerPage?' ('+(p+1)+'p)':''}</div>`;
          html+=`<div style="display:grid;grid-template-columns:repeat(${cols}, 1fr);gap:10px;font-size:15px;">`;
          pageQs.forEach((q,i)=>{
            const ansText=isStory?q.ans:isDiv?`몫 ${q.q}, 나머지 ${q.r}`:`${q.q}`;
            const exp=easyExplanation({...q,topic:isStory?'문장제 문제':isDiv?'나눗셈':'계산 문제'});
            html+=`<div style="padding:9px;border:1px solid #eee;border-radius:8px;background:#fafafa;"><span style="font-weight:900;color:#555;margin-right:6px;">${p*ansPerPage+i+1}.</span><b style="color:#4f46e5">${ansText}</b><div style="font-size:10px;line-height:1.45;color:#92400e;margin-top:5px;">${exp}</div></div>`;
          });
          html+=`</div></div>`;
        }
        renderArea.innerHTML=html;await new Promise(r=>setTimeout(r,200));
        const pdf=new jsPDF('p','mm','a4');const pages=renderArea.querySelectorAll('[style*="page-break"]');
        for(let i=0;i<pages.length;i++){const cv=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#fff',useCORS:true,allowTaint:true,windowWidth:794,scrollX:0,scrollY:0});if(i>0)pdf.addPage();const _w=210,_h=Math.round((cv.height/cv.width)*_w*100)/100;pdf.addImage(cv.toDataURL('image/png'),'PNG',0,0,_w,_h,undefined,'FAST')}
        renderArea.innerHTML='';pdf.save(`${ws.title}_답지.pdf`);
        return;
      }
  
      // 문제지: 나눗셈은 2열×5행(10문항/페이지), 문장제는 5문항/페이지
      const perPage = isStory ? 5 : 10;
      let html='';
      for(let p=0;p*perPage<ws.questions.length;p++){
        const pageQs=ws.questions.slice(p*perPage,(p+1)*perPage);
        if(isDiv){
          // 나눗셈: 2열 5행 가로셈 레이아웃
          html+=`<div style="width:794px;min-min-height:1123px;background:white;padding:40px 50px;box-sizing:border-box;page-break-after:always">`;
          html+=`<div style="text-align:center;font-size:24px;font-weight:900;margin-bottom:30px;border-bottom:3px solid #000;padding-bottom:10px">${ws.title} (${p+1})</div>`;
          html+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 40px;">`;
          pageQs.forEach((q,i)=>{
            html+=`<div style="display:flex;align-items:center;gap:10px;font-size:26px;font-weight:900;padding:18px;border:2px solid #e2e8f0;border-radius:12px;background:#fafafa;">
              <span style="color:#555;font-size:16px;min-width:28px;">${p*perPage+i+1}.</span>
              <span>${q.txt||((q.a||'')+'÷'+(q.b||''))}</span>
              <span style="color:#cbd5e1;margin-left:auto">=</span>
              <div style="border-bottom:2px solid #94a3b8;width:80px;"></div>
            </div>`;
          });
          html+=`</div></div>`;
        }else{
          html+=`<div style="width:794px;min-min-height:1123px;background:white;padding:40px 50px;box-sizing:border-box;page-break-after:always"><div style="text-align:center;font-size:24px;font-weight:900;margin-bottom:40px;border-bottom:3px solid #000;padding-bottom:10px">${ws.title} (${p+1})</div><div style="display:flex;flex-direction:column;gap:50px;height:calc(100% - 130px)">${pageQs.map((q,i)=>`<div style="${isStory?'font-size:18px;line-height:1.7;':'font-size:28px;'}font-weight:800;display:flex;align-items:flex-start;gap:12px"><span style="font-size:16px;font-weight:900;color:#555;min-width:36px">${p*perPage+i+1}.</span><div style="flex:1">${q.txt} ${isStory?`<span style="font-size:12px;color:#aaa;font-weight:normal;margin-left:5px;">[${q.diff}]</span>`:''}<div style="margin-top:20px;height:50px;"></div></div></div>`).join('')}</div></div>`;
        }
      }
      renderArea.innerHTML=html;await new Promise(r=>setTimeout(r,200));
      const pdf=new jsPDF('p','mm','a4');const pages=renderArea.querySelectorAll('[style*="page-break"]');
      for(let i=0;i<pages.length;i++){const cv=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#fff',useCORS:true,allowTaint:true,windowWidth:794,scrollX:0,scrollY:0});if(i>0)pdf.addPage();const _w=210,_h=Math.round((cv.height/cv.width)*_w*100)/100;pdf.addImage(cv.toDataURL('image/png'),'PNG',0,0,_w,_h,undefined,'FAST')}
      renderArea.innerHTML='';pdf.save(`${ws.title}_${isAns?'답지':'문제지'}.pdf`);
  };
  const buildGCDHTML=(q,n,isAns)=>`<div style="border:2px solid #cbd5e1; border-radius:20px; padding:25px; display:flex; flex-direction:column; background-color:#f8fafc; font-family:sans-serif;"><div style="font-size:20px; font-weight:900; color:#1e293b; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><span style="background-color:#4f46e5; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px;">${n}</span>${q.a}와(과) ${q.b}의 약수와 최대공약수</div>${isAns?`<div style="flex:1; display:flex; flex-direction:column; gap:18px; font-size:18px;"><div><b style="color:#475569;">① ${q.a}의 약수:</b> <span style="color:#111827; letter-spacing:1px; line-height:2;">${q.divisorsA.map(d=>q.common.includes(d)?`<span style="color:#ef4444; font-weight:900; border:2px solid #ef4444; border-radius:50%; display:inline-block; width:34px; height:34px; line-height:30px; text-align:center;">${d}</span>`:d).join(', ')}</span></div><div><b style="color:#475569;">② ${q.b}의 약수:</b> <span style="color:#111827; letter-spacing:1px; line-height:2;">${q.divisorsB.map(d=>q.common.includes(d)?`<span style="color:#ef4444; font-weight:900; border:2px solid #ef4444; border-radius:50%; display:inline-block; width:34px; height:34px; line-height:30px; text-align:center;">${d}</span>`:d).join(', ')}</span></div><div style="margin-top:auto; padding-top:20px; border-top:2px dashed #cbd5e1; font-size:22px;">③ 최대공약수: <b style="color:#4f46e5; font-size:28px;">${q.gcdVal}</b></div></div>`:`<div style="flex:1; display:flex; flex-direction:column; gap:28px; font-size:18px;"><div><b style="color:#475569;">① ${q.a}의 약수:</b> <div style="border-bottom:2px solid #94a3b8; width:100%; height:45px;"></div></div><div><b style="color:#475569;">② ${q.b}의 약수:</b> <div style="border-bottom:2px solid #94a3b8; width:100%; height:45px;"></div></div><div style="margin-top:auto; padding-top:10px;">③ 공약수에 ○표 하고, 최대공약수를 적으세요.<br/><div style="border-bottom:2px solid #94a3b8; width:140px; height:45px; margin-top:20px;"></div></div></div>`}</div>`;
  const buildLCMHTML=(q,n,isAns)=>`<div style="border:2px solid #cbd5e1; border-radius:20px; padding:25px; display:flex; flex-direction:column; background-color:#f8fafc; font-family:sans-serif;"><div style="font-size:20px; font-weight:900; color:#1e293b; margin-bottom:20px; display:flex; align-items:center; gap:10px;"><span style="background-color:#4f46e5; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px;">${n}</span>${q.a}와(과) ${q.b}의 배수와 최소공배수</div>${isAns?`<div style="flex:1; display:flex; flex-direction:column; gap:18px; font-size:18px;"><div><b style="color:#475569;">① ${q.a}의 배수:</b> <span style="color:#111827; letter-spacing:1px; line-height:2;">${q.multA.map(v=>q.commonMult.includes(v)?`<span style="color:#ef4444; font-weight:900; border:2px solid #ef4444; border-radius:50%; display:inline-block; width:36px; height:36px; line-height:32px; text-align:center;">${v}</span>`:v).join(', ')}</span></div><div><b style="color:#475569;">② ${q.b}의 배수:</b> <span style="color:#111827; letter-spacing:1px; line-height:2;">${q.multB.map(v=>q.commonMult.includes(v)?`<span style="color:#ef4444; font-weight:900; border:2px solid #ef4444; border-radius:50%; display:inline-block; width:36px; height:36px; line-height:32px; text-align:center;">${v}</span>`:v).join(', ')}</span></div><div style="margin-top:auto; padding-top:20px; border-top:2px dashed #cbd5e1; font-size:22px;">③ 최소공배수: <b style="color:#4f46e5; font-size:28px;">${q.lcmVal}</b></div></div>`:`<div style="flex:1; display:flex; flex-direction:column; gap:28px; font-size:18px;"><div><b style="color:#475569;">① ${q.a}의 배수 (7개):</b> <div style="border-bottom:2px solid #94a3b8; width:100%; height:45px;"></div></div><div><b style="color:#475569;">② ${q.b}의 배수 (7개):</b> <div style="border-bottom:2px solid #94a3b8; width:100%; height:45px;"></div></div><div style="margin-top:auto; padding-top:10px;">③ 공배수에 ○표 하고, 최소공배수를 적으세요.<br/><div style="border-bottom:2px solid #94a3b8; width:140px; height:45px; margin-top:20px;"></div></div></div>`}</div>`;

  return(<div className="p-4 pb-36 space-y-4">

    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">📝 새 문제지 만들기</div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[['div','나눗셈'],['gcd','약수/최대공약수'],['lcm','배수/최소공배수'],['story','문장제(초3-4)'],['mock_middle','검정고시_중졸'],['mock_high','검정고시_고졸'],['geo','기하학']].map(([k,lbl])=><button key={k} onClick={()=>setWsType(k)} className={`px-4 py-2 rounded-xl font-bold text-sm ${wsType===k?(k.startsWith('mock_')?'bg-purple-600 text-white':k==='geo'?'bg-blue-600 text-white':'bg-indigo-500 text-white'):'bg-gray-100 text-gray-600'}`}>{lbl}</button>)}
      </div>
      <div className="text-xs text-gray-500 font-semibold mb-3 bg-gray-50 rounded-xl p-2">{TYPE_DESC[wsType]}</div>
      
      {wsType === 'story' ? (
        <div className="space-y-4 mb-4 border-2 border-indigo-50 rounded-2xl p-4">
          <div>
            <div className="text-sm font-bold text-gray-700 mb-2">난이도별 문제 수 <span className="text-xs text-gray-400 font-bold">(총 {storyCounts.low + storyCounts.mid + storyCounts.high}문제)</span></div>
            <div className="space-y-2">
              {Object.entries({low:'하 (쉬움)', mid:'중 (보통)', high:'상 (어려움)'}).map(([k, lbl]) => (
                <div key={k} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-bold text-gray-600">{lbl}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={()=>setStoryCounts(p=>({...p, [k]: Math.max(0, p[k]-1)}))} className="w-9 h-9 bg-white border border-gray-200 text-indigo-600 rounded-full font-black text-lg flex items-center justify-center">−</button>
                    <span className="font-black text-gray-800 text-lg w-7 text-center">{storyCounts[k]}</span>
                    <button onClick={()=>setStoryCounts(p=>({...p, [k]: Math.min(20, p[k]+1)}))} className="w-9 h-9 bg-white border border-gray-200 text-indigo-600 rounded-full font-black text-lg flex items-center justify-center">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-700 mb-2">사칙연산 비율 (%) <span className="text-xs text-indigo-500 font-bold ml-1">합계 100% 필수</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries({add:'덧셈(+)', sub:'뺄셈(-)', mul:'곱셈(×)', div:'나눗셈(÷)'}).map(([op, lbl]) => (
                <div key={op} className="bg-gray-50 p-2 rounded-xl">
                  <div className="text-xs font-bold text-gray-500 mb-1 text-center">{lbl}</div>
                  <div className="flex items-center gap-1 justify-center">
                    <input type="number" value={opRatios[op]} onChange={(e)=>handleRatioChange(op, e.target.value)} className="w-16 text-center font-black bg-white border border-gray-200 rounded-lg p-1 outline-none focus:border-indigo-400" />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={`mt-2 text-xs font-bold text-center ${opRatios.add + opRatios.sub + opRatios.mul + opRatios.div === 100 ? 'text-green-600' : 'text-red-500'}`}>
              현재 합계: {opRatios.add + opRatios.sub + opRatios.mul + opRatios.div}%
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {!wsType.startsWith('mock_')&&wsType!=='geo'&&<div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700">문제 수:</span>
            <div className="flex items-center gap-2 bg-indigo-50 rounded-xl p-2">
              <button onClick={()=>setCount(v=>Math.max(1,v-1))} className="w-8 h-8 rounded-full bg-indigo-500 text-white font-black flex items-center justify-center">−</button>
              <input type="number" value={count} onChange={e=>setCount(Math.max(1,Math.min(100,parseInt(e.target.value)||1)))} className="w-14 text-lg font-black text-gray-800 text-center border-2 border-indigo-200 rounded-xl outline-none focus:border-indigo-400"/>
              <button onClick={()=>setCount(v=>Math.min(100,v+1))} className="w-8 h-8 rounded-full bg-indigo-500 text-white font-black flex items-center justify-center">+</button>
            </div>
          </div>}
          {wsType === 'gcd' && (
            <div className="border-2 border-indigo-50 rounded-2xl p-4 bg-gray-50">
              <div className="text-sm font-bold text-gray-700 mb-2">출제 범위 (최소~최대 숫자)</div>
              <div className="flex items-center gap-3">
                <input type="number" value={gcdMin} onChange={e=>setGcdMin(+e.target.value)} className="w-20 border border-gray-300 rounded-lg p-2 text-center font-bold outline-none focus:border-indigo-400" />
                <span className="text-gray-500 font-bold">~</span>
                <input type="number" value={gcdMax} onChange={e=>setGcdMax(+e.target.value)} className="w-20 border border-gray-300 rounded-lg p-2 text-center font-bold outline-none focus:border-indigo-400" />
              </div>
            </div>
          )}
          {wsType === 'lcm' && (
            <div className="border-2 border-indigo-50 rounded-2xl p-4 bg-gray-50">
              <div className="text-sm font-bold text-gray-700 mb-2">출제 범위 (최소~최대 숫자)</div>
              <div className="flex items-center gap-3">
                <input type="number" value={lcmMin} onChange={e=>setLcmMin(+e.target.value)} className="w-20 border border-gray-300 rounded-lg p-2 text-center font-bold outline-none focus:border-indigo-400" />
                <span className="text-gray-500 font-bold">~</span>
                <input type="number" value={lcmMax} onChange={e=>setLcmMax(+e.target.value)} className="w-20 border border-gray-300 rounded-lg p-2 text-center font-bold outline-none focus:border-indigo-400" />
              </div>
            </div>
          )}
        </div>
      )}

      {!wsType.startsWith('mock_')&&<>
        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="문제지 이름 (예: 5월 1주차 수학)" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base font-bold mb-3 focus:border-indigo-400 outline-none"/>
        <button onClick={create} disabled={loading} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">
          {loading?'생성 중...':'문제지 자동 생성 ✨'}
        </button>
      </>}
      {wsType==='geo'&&<div className="space-y-3">
        <div className="text-xs text-blue-600 font-bold bg-blue-50 rounded-xl p-3">📐 기하학 6개 파트에서 각 2문항씩 총 12문항 사지선다 생성</div>
        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="문제지 제목 (비우면 자동)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-sm outline-none focus:border-blue-400"/>
        <button onClick={()=>{
          const GEO_GEN=[genMockGeometry];
          const SUBTYPES=['직선방정식','두점거리','내분점','원방정식','대칭이동','점직선거리'];
          const pool=[];const usedT=new Set();const usedGQ=new Set();
          SUBTYPES.forEach(sub=>{
            let found=0;
            for(let tries=0;tries<15&&found<2;tries++){
              try{
                const q=genMockGeometry();
                if(!q)continue;
                const qKey=`${q.topic}::${q.q?.slice(0,25)||''}`;
                if(!usedGQ.has(qKey)){usedGQ.add(qKey);if(!usedT.has(q.topic))usedT.add(q.topic);pool.push(q);found++;}
              }catch(e){}
            }
          });
          let gs=0;
          while(pool.length<12&&gs++<50){
            try{const q=genMockGeometry();if(q){const k=`${q.topic}::${q.q?.slice(0,25)||''}`;if(!usedGQ.has(k)){usedGQ.add(k);pool.push(q);}}}catch(e){break;}
          }
          const t=title.trim()||`기하학 문제지 ${todayStr()}`;
          setExamSheet({title:t,mode:'기하학',level:'기하학',wsType:'geo',questions:pool.slice(0,12)});
          setExamSaved(false);
        }} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black text-base active:scale-95 transition-transform">
          📐 기하학 문제지 생성 →
        </button>
        {examSheet&&examSheet.mode==='기하학'&&<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 font-bold">✅ {examSheet.questions.length}문항 생성됨 — 아래 [저장·인쇄] 버튼으로 출력하세요</div>}
      </div>}
      {wsType.startsWith('mock_')&&<div className="space-y-3">
        <div className="flex gap-2">
          <button onClick={()=>setExamMode('random')} className={`flex-1 py-2 rounded-xl font-bold text-sm ${examMode==='random'?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>🎲 랜덤 혼합</button>
          <button onClick={()=>setExamMode('weak')} className={`flex-1 py-2 rounded-xl font-bold text-sm ${examMode==='weak'?'bg-orange-500 text-white':'bg-gray-100 text-gray-600'}`}>🎯 취약점 집중</button>
        </div>
        {examMode==='weak'&&<select value={targetStudent} onChange={e=>setTargetStudent(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-sm outline-none focus:border-purple-400">
          <option value="">학생 선택 (취약 영역 자동 분석)</option>
          {studentList.map(s=><option key={s.name} value={s.name}>{s.name} 학생</option>)}
        </select>}
        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="문제지 제목 (비우면 자동)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold text-sm outline-none focus:border-purple-400"/>
        <button onClick={createExamSheet} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black text-base active:scale-95 transition-transform">
          📝 {wsType==='mock_middle'?'중졸':'고졸'} 검정고시 문제지 생성 →
        </button>
        {examSheet&&<div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-800 font-bold">✅ {examSheet.questions.length}문항 생성됨 — 아래 [저장·인쇄] 버튼으로 출력하세요</div>}
      </div>}
      {toast&&<div className={`mt-3 text-center text-sm font-bold py-2 px-4 rounded-xl ${toast.includes('✅')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{toast}</div>}
    </div>
    
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-400 uppercase">📚 문제집 폴더</div>
        <button onClick={loadWsList} className="text-xs text-indigo-600 font-bold">새로고침</button>
      </div>
      {wsList.length===0&&<div className="text-center text-gray-400 py-6 font-bold">저장된 문제지가 없어요.</div>}
	{wsList.map(ws=><div key={ws.id} className="p-3.5 bg-gray-50 rounded-2xl mb-2.5">
        <div className="mb-3">
          {editingWsId === ws.id ? (
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && renameWs(ws.id)} className="flex-1 min-w-[140px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-indigo-400" autoFocus />
              <button onClick={() => renameWs(ws.id)} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold">저장</button>
              <button onClick={() => setEditingWsId(null)} className="text-xs bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-bold">취소</button>
            </div>
          ) : (
            <div className="font-bold text-gray-800 text-base flex items-center gap-2 flex-wrap break-keep">
              {ws.title}
              {ws.gradedCount>0&&<span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">✅ 채점됨 {ws.gradedCount}명</span>}
              <button onClick={() => { setEditingWsId(ws.id); setEditTitle(ws.title); }} className="text-[11px] text-gray-400 hover:text-indigo-500 transition-colors">✏️수정</button>
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">{ws.questions?.length||0}문제 · {String(ws.wsType||'').startsWith('mock')?`${ws.level||'고졸'} 검정고시 모의고사`:ws.wsType}</div>
        </div>
        {/* 4개 옵션을 제목 아래 한 줄(좁은 화면은 2x2)로 배치 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={()=>setGradeModal(ws)} className="text-sm px-3 py-2.5 bg-green-500 text-white rounded-xl font-bold">채점하기{ws.gradedCount>0?` (${ws.gradedCount})`:''}</button>
          <button onClick={()=>exportWS(ws,false)} className="text-sm px-3 py-2.5 bg-gray-800 text-white rounded-xl font-bold">문제지</button>
          <button onClick={()=>exportWS(ws,true)} className="text-sm px-3 py-2.5 bg-indigo-500 text-white rounded-xl font-bold">답지</button>
          <button onClick={()=>del(ws.id)} className="text-sm px-3 py-2.5 bg-red-100 text-red-600 rounded-xl font-bold">삭제</button>
        </div>
      </div>)}
    </div>
  </div>);
}

