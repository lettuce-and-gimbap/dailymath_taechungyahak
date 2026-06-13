function MockExamTab({userData,onUpdate}){
  const[screen,setScreen]=useState('start');
  const[examLevel,setExamLevel]=useState(null);
  const[questions,setQuestions]=useState([]);
  const[sel,setSel]=useState({});
  const[isGraded,setIsGraded]=useState(false);
  const[saved,setSaved]=useState(false);
  const[startTime,setStartTime]=useState(null);
  const[mode,setMode]=useState('');
  // ── 행동 추적 (신규) ──
  const[firstClickTimes,setFirstClickTimes]=useState({}); // {qIdx: ms from startTime to first click}
  const[revisionCounts,setRevisionCounts]=useState({});   // {qIdx: number of answer changes after first}

  const HIGH_DOMAIN_GENS={'다항식 계산':genMockPoly,'방정식과 부등식':genMockEqInequal,'도형과 기하':genMockGeometry,'집합과 함수':genMockSetFunc,'확률과 통계':genMockProbStat};
  const DOMAIN_GENS=examLevel==='middle'?MID_DOMAIN_GENS:HIGH_DOMAIN_GENS;
  const DOMAINS=Object.keys(DOMAIN_GENS);

  const computeStats=(logs)=>{
    const s={};DOMAINS.forEach(d=>s[d]={c:0,t:0});
    (logs||[]).forEach(log=>{
      if(!log.questions)return;
      log.questions.forEach(q=>{
        const type=(q.meta?.type||log.type||'').toLowerCase();
        const cat=(q.meta?.category||'').toLowerCase();
        const exact=DOMAINS.find(d=>type.includes(d.toLowerCase()));
        if(exact){s[exact].t++;if(q.isOk)s[exact].c++;return;}
        if(examLevel==='middle')return;
        if(type.includes('다항식')||cat==='poly'||type.includes('나눗셈')||type.includes('나머지')||type.includes('인수분해')||type.includes('항등식'))
          {s['다항식 계산'].t++;if(q.isOk)s['다항식 계산'].c++;}
        else if(type.includes('방정식')||type.includes('부등식')||type.includes('스토리')||type.includes('문장제')||cat==='eq'||cat==='ineq')
          {s['방정식과 부등식'].t++;if(q.isOk)s['방정식과 부등식'].c++;}
        else if(type.includes('기하')||type.includes('도형')||cat==='geometry'||type.includes('대칭')||type.includes('거리')||type.includes('직선')||type.includes('내분'))
          {s['도형과 기하'].t++;if(q.isOk)s['도형과 기하'].c++;}
        else if(type.includes('함수')||type.includes('집합')||type.includes('명제')||cat==='set'||cat==='func')
          {s['집합과 함수'].t++;if(q.isOk)s['집합과 함수'].c++;}
        else if(type.includes('확률')||type.includes('통계')||type.includes('순열')||type.includes('조합')||cat==='div'||cat==='stat'||type.includes('약수')||type.includes('배수'))
          {s['확률과 통계'].t++;if(q.isOk)s['확률과 통계'].c++;}
      });
    });
    return s;
  };

  const startExam=(examMode)=>{
    setMode(examMode);
    const stats=computeStats(userData.logs||[]);
    const weakDomains=DOMAINS.filter(d=>stats[d].t===0||(stats[d].c/stats[d].t)<0.7);
    const safeGen=(gen)=>{try{const q=gen();return q||null;}catch(e){return null;}};
    let pool=[];
    if(examMode==='weak'){
      const targets=weakDomains.length>0?weakDomains:DOMAINS;
      for(let i=0;i<10;i++){
        const dom=i<7?targets[i%targets.length]:DOMAINS[i%DOMAINS.length];
        const q=safeGen(DOMAIN_GENS[dom]);if(q)pool.push(q);
      }
    }else{
      DOMAINS.forEach(dom=>{for(let j=0;j<2;j++){const q=safeGen(DOMAIN_GENS[dom]);if(q)pool.push(q);}});
      pool=shuffle(pool);
    }
    let safety=0;
    while(pool.length<10&&safety++<50){const q=safeGen(pick(Object.values(DOMAIN_GENS)));if(q)pool.push(q);}
    setQuestions(pool.slice(0,10));setSel({});setIsGraded(false);setSaved(false);setStartTime(Date.now());setScreen('exam');
    setFirstClickTimes({});setRevisionCounts({});
  };

  const saveResult=async(feeling)=>{
    if(saved||!userData)return;
    const totalSec=Math.round((Date.now()-startTime)/1000);
    const correctCount=questions.filter((q,i)=>sel[i]===q.answer).length;
    const qs=questions.map((q,i)=>{
      const fms=firstClickTimes[i]??null;
      return{
        qTxt:q.q.length>70?q.q.slice(0,70)+'…':q.q,
        uAns:sel[i]!==undefined?q.choices[sel[i]]:'미입력',
        cAns:q.choices[q.answer],
        isOk:sel[i]===q.answer,
        // timeSec: 리스트 형식에서는 firstClickMs 환산값 사용 (균등배분 오류 수정)
        timeSec:fms!=null?Math.round(fms/1000):null,
        firstClickMs:fms,            // 세션 시작~첫 선택 ms
        revisionCount:revisionCounts[i]??0,  // 첫 선택 후 변경 횟수
        qTopicHash:getTopicHash(q),  // 크로스-학생 집계용
        explanation:easyExplanation(q),
        meta:q.meta
      };
    });
    const levelLabel=examLevel==='middle'?'중졸':'고졸';
    const typeLabel=mode==='weak'?`📝 ${levelLabel} 약점 집중 모의고사`:`📝 ${levelLabel} 랜덤 혼합 모의고사`;
    const log={date:todayStr(),time:timeStr(),type:typeLabel,score:`${correctCount} / 10`,questions:qs,totalSec,feeling};
    const newLogs=[log,...(userData.logs||[])];
    const newTodayLessons=(userData.todayLessons||0)+1;
    const activeDates=[...new Set([...(userData.activeDates||[]),todayStr()])];
    const upd={...userData,logs:newLogs,todayLessons:newTodayLessons,activeDates,lastDate:todayStr()};
    try{
      await db.collection('users').doc(upd.name).set(upd,{merge:true});
      if(onUpdate)onUpdate(upd);
      setSaved(true);
      updateQStats(qs); // fire-and-forget: qStats 집계 (실패해도 무시)
    }catch(e){alert('저장 실패. 인터넷 연결을 확인해주세요.');}
  };

  const ORD=['①','②','③','④'];
  const correctCount=questions.filter((q,i)=>sel[i]===q.answer).length;
  const answered=Object.keys(sel).length;

  if(screen==='start'){
    if(!examLevel)return(<div className="p-4 pb-36 space-y-4 fade-in">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-black mb-1">📝 검정고시 모의고사</h2>
        <p className="text-sm opacity-90">먼저 응시할 학력을 골라 주세요.</p>
      </div>
      <button onClick={()=>setExamLevel('middle')} className="w-full p-6 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-3xl text-left shadow-lg active:scale-95 transition-transform">
        <div className="text-2xl font-black">📘 중졸 모의고사</div><div className="text-sm mt-2 opacity-90">2021~2026 최근 핵심 유형 · 중학교 과정 5개 영역</div>
      </button>
      <button onClick={()=>setExamLevel('high')} className="w-full p-6 bg-gradient-to-r from-violet-500 to-indigo-700 text-white rounded-3xl text-left shadow-lg active:scale-95 transition-transform">
        <div className="text-2xl font-black">📚 고졸 모의고사</div><div className="text-sm mt-2 opacity-90">2021~2026 고졸 기출 변형 · 고등학교 과정 5개 영역</div>
      </button>
    </div>);
    const stats=computeStats(userData.logs||[]);
    const weakDomains=DOMAINS.filter(d=>stats[d].t===0||(stats[d].c/stats[d].t)<0.7);
    const GRADE_COLOR={0:'bg-gray-200',1:'bg-orange-400',2:'bg-lime-400',3:'bg-green-500',4:'bg-emerald-500'};
    const getGrade=(st)=>{if(st.t===0)return 0;const r=st.c/st.t;return r<0.4?1:r<0.7?2:r<0.9?3:4;};
    const ICONS=['🌱','🌱','🌿','🌳','🍎'];
    return(<div className="p-4 pb-36 space-y-4 fade-in">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg">
        <button onClick={()=>setExamLevel(null)} className="text-sm font-bold opacity-90 mb-3">← 학력 다시 선택</button>
        <h2 className="text-xl font-black mb-1">📝 {examLevel==='middle'?'중졸':'고졸'} 기출 혼합 모의고사</h2>
        <p className="text-sm opacity-90">2021~2026 기출 패턴 변형 · 최근 유형 우선</p>
      </div>
      {weakDomains.length>0&&(<div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="text-sm font-black text-orange-700 mb-2">🎯 현재 취약 영역 (정답률 70% 미만)</div>
        <div className="flex flex-wrap gap-2">{weakDomains.map(d=><span key={d} className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200">{d}</span>)}</div>
      </div>)}
      <div className="space-y-3">
        <button onClick={()=>startExam('weak')} className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-transform">
          🎯 약점 집중 공략 10문제
          <div className="text-xs font-normal opacity-80 mt-1">취약 영역 집중 + 기출 변형 자동 출제</div>
        </button>
        <button onClick={()=>startExam('random')} className="w-full p-5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-transform">
          🎲 랜덤 혼합 모의고사 10문제
          <div className="text-xs font-normal opacity-80 mt-1">5개 영역 골고루 · 매번 새 문제</div>
        </button>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="text-sm font-black text-gray-600 mb-3">🌳 나의 수학 나무 숲 현황</div>
        <div className="space-y-2.5">
          {DOMAINS.map(d=>{
            const st=stats[d];const g=getGrade(st);const rate=st.t===0?0:Math.round((st.c/st.t)*100);
            return(<div key={d} className="flex items-center gap-2">
              <span className="text-base w-5">{ICONS[g]}</span>
              <span className="text-xs font-bold text-gray-700 w-28 flex-shrink-0">{d}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className={`${GRADE_COLOR[g]} h-2.5 rounded-full transition-all`} style={{width:`${st.t===0?4:Math.max(4,rate)}%`}}/>
              </div>
              <span className="text-xs font-bold text-gray-500 w-14 text-right">{st.t===0?'미학습':`${rate}%`}</span>
            </div>);
          })}
        </div>
      </div>
    </div>);
  }

  if(screen==='exam'){
    return(<div className="p-4 pb-36 space-y-4 fade-in">
      <div className="sticky top-0 bg-white border-b py-3 flex items-center gap-3 z-10 -mx-4 px-4 shadow-sm">
        <button onClick={()=>setScreen('start')} className="text-gray-500 text-sm font-bold">← 나가기</button>
        <span className="flex-1 text-sm font-black text-gray-700">{examLevel==='middle'?'중졸':'고졸'} · {mode==='weak'?'🎯 약점 집중':'🎲 랜덤 혼합'} ({answered}/10)</span>
        {isGraded&&<span className="text-sm font-black text-indigo-600">{correctCount}/10점</span>}
      </div>
      {questions.map((q,i)=>{
        const isSel=sel[i]!==undefined,isCorrect=sel[i]===q.answer;
        return(<div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full bg-indigo-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{q.topic}</span>
            {(()=>{var src=getExamSource(q);return src?<span className="text-[10px] text-gray-400 font-normal ml-1">📌 {src}</span>:null;})()}
            {isGraded&&isSel&&<span className="ml-auto text-base">{isCorrect?'✅':'❌'}</span>}
          </div>
          <div className="font-bold text-gray-800 text-sm leading-relaxed mb-3">{q.q}</div>
          {/* 기하 문제 그래프 미리보기 */}
          {q.graph&&<div className="flex justify-center mb-2"><GraphPreview q={q}/></div>}
          <div className="grid grid-cols-1 gap-2">
            {q.choices.map((ch,j)=>{
              let cls='bg-gray-50 border-gray-200 text-gray-700';
              if(isGraded){if(sel[i]===j)cls=j===q.answer?'bg-green-100 border-green-400 text-green-800 font-bold':'bg-red-100 border-red-400 text-red-700';else if(j===q.answer)cls='bg-green-50 border-green-300 text-green-700 font-semibold';}
              else if(sel[i]===j)cls='bg-indigo-100 border-indigo-400 text-indigo-800 font-semibold';
              return(<button key={j} onClick={()=>{
                if(isGraded)return;
                const now=Date.now()-startTime;
                // 첫 선택: firstClickMs 기록
                if(firstClickTimes[i]===undefined) setFirstClickTimes(p=>({...p,[i]:now}));
                // 이후 선택: 이미 다른 답 선택한 경우에만 revisionCount++
                else if(sel[i]!==undefined&&sel[i]!==j) setRevisionCounts(p=>({...p,[i]:(p[i]||0)+1}));
                setSel(s=>({...s,[i]:j}));
              }}
                className={`text-left text-base px-4 py-3 rounded-xl border-2 transition-all active:scale-95 ${cls}`}>
                {ORD[j]} <MathText v={ch}/>
              </button>);
            })}
          </div>
          {isGraded&&!isCorrect&&(<div className="mt-3 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 font-bold">정답: {ORD[q.answer]} <MathText v={q.choices[q.answer]}/></div>)}
          {isGraded&&<ExplanationBox q={q}/>}
        </div>);
      })}
      {answered===10&&!isGraded&&(<div className="fade-in">
        <button onClick={()=>setIsGraded(true)} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-lg active:scale-95 transition-transform">채점하기 📝</button>
      </div>)}
      {isGraded&&!saved&&(<div className="bg-white p-6 rounded-3xl shadow-sm text-center border-2 border-indigo-100 fade-in">
        <div className="text-2xl font-black text-indigo-700 mb-1">🎯 {correctCount}/10 정답!</div>
        <div className="text-sm text-gray-500 mb-4">이번 모의고사는 어떠셨나요? 평가 후 기록이 저장됩니다.</div>
        <div className="flex gap-2 justify-center">
          <button onClick={()=>saveResult('easy')} className="flex-1 py-4 bg-green-100 text-green-700 rounded-2xl font-black active:scale-95 transition-transform">쉬웠어요 😊</button>
          <button onClick={()=>saveResult('normal')} className="flex-1 py-4 bg-blue-100 text-blue-700 rounded-2xl font-black active:scale-95 transition-transform">적당해요 😐</button>
          <button onClick={()=>saveResult('hard')} className="flex-1 py-4 bg-red-100 text-red-700 rounded-2xl font-black active:scale-95 transition-transform">어려워요 😥</button>
        </div>
      </div>)}
      {isGraded&&saved&&(<div className="text-center fade-in space-y-3">
        <div className="inline-block bg-green-100 text-green-700 font-bold px-6 py-4 rounded-2xl">✅ 학습 기록에 저장되었습니다!</div>
        <button onClick={()=>setScreen('start')} className="block w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold">다시 도전하기 →</button>
      </div>)}
    </div>);
  }
  return null;
}

/* ===== STUDENT DASHBOARD ===== */
