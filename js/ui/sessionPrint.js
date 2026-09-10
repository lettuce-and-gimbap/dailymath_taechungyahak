// === js/ui/sessionPrint.js ===
/* --------------------------------------------------------------------
   회차(세션) 인쇄·PDF 모달
   학생 기록 화면과 선생님 모드에서 공용 사용
   -------------------------------------------------------------------- */

/* ═══════════════════════════════════════════════════════════
   회차(세션) 문제 + 정답 + 해설 인쇄/PDF 모달
   - 학생 기록·선생님 모드에서 공용 사용
   - 선생님 코멘트·해설 수정 기능 포함 ($ 수식 $ 지원)
   ═══════════════════════════════════════════════════════════ */
function SessionPrintModal({log,studentName,studentId,onClose}){
  if(!log)return null;
  const ORD=['①','②','③','④','⑤'];
  const qs=log.questions||[];
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // 세션 고유 ID: Firestore에 편집 내용 저장/로드에 사용
  const sessionId=studentId
    ?`${studentId}_${(log.date||'nd')}_${(log.time||'').replace(/[^0-9]/g,'')}`
    :null;

  const[topicOverrides,setTopicOverrides]=useState({});
  const[overrideSaved,setOverrideSaved]=useState({});
  const[savedEditsMap,setSavedEditsMap]=useState({});
  const[sessionLoaded,setSessionLoaded]=useState(false);
  const[corrected,setCorrected]=useState({});
  const[printCols,setPrintCols]=useState(1);

  const[edits,setEdits]=useState(()=>{
    const init={};
    qs.forEach((q,i)=>{
      const solDefault=Array.isArray(q.sol)&&q.sol.length?q.sol.join('\n'):(q.explanation||'');
      init[i]={solText:solDefault,comment:'',editing:false,overrideApplied:false};
    });
    return init;
  });

  // 1단계: 이 세션에 저장된 편집 내용 + 오답 수정 체크 로드
  useEffect(()=>{
    if(!sessionId){setSessionLoaded(true);return;}
    db.collection('sessionEdits').doc(sessionId).get()
      .then(snap=>{
        if(snap.exists){
          const data=snap.data()||{};
          const map={};const corr={};
          qs.forEach((_,i)=>{
            if(data[`q${i}`])map[i]=data[`q${i}`];
            if(data[`corrected_q${i}`])corr[i]=true;
          });
          setSavedEditsMap(map);
          setCorrected(corr);
          setEdits(prev=>{
            const updated={...prev};
            Object.entries(map).forEach(([idx,saved])=>{
              const i=Number(idx);
              updated[i]={...updated[i],...saved};
            });
            return updated;
          });
        }
        setSessionLoaded(true);
      })
      .catch(()=>setSessionLoaded(true));
  },[sessionId]);

  // 2단계: 세션 편집 로드 완료 후 topic 오버라이드 로드
  useEffect(()=>{
    if(!sessionLoaded)return;
    db.collection('teacherSettings').doc('explanationOverrides').get()
      .then(snap=>{if(snap.exists)setTopicOverrides(snap.data()||{});})
      .catch(()=>{});
  },[sessionLoaded]);

  // topic 오버라이드를 세션 편집이 없는 문제에만 적용
  // 우선순위: ①이 문제 자체의 sol(정확한 값) ②그래프에서 재생성 ③저장된 틀 텍스트
  // comment는 다음 문제에 전파하지 않음 (각 문제별 선생님 코멘트와 별개)
  useEffect(()=>{
    if(Object.keys(topicOverrides).length===0)return;
    setEdits(prev=>{
      const updated={...prev};
      qs.forEach((q,i)=>{
        if(savedEditsMap[i])return;
        const topic=String(q.topic||q.meta?.type||'');
        const override=topicOverrides[topic];
        if(!override)return;
        const generatedSol=genSolFromGraph(q);
        const storedSol=typeof override==='object'?(override.solText||''):override;
        const solText=generatedSol||storedSol;
        if(solText){
          updated[i]={...updated[i],solText,overrideApplied:true};
        }
      });
      return updated;
    });
  },[topicOverrides]);

  const setEdit=(i,field,val)=>setEdits(prev=>({...prev,[i]:{...prev[i],[field]:val}}));

  // 편집 패널 닫을 때 Firestore에 저장
  const saveSessionEdit=async(i)=>{
    if(!sessionId)return;
    const e=edits[i]||{};
    try{
      await db.collection('sessionEdits').doc(sessionId).set(
        {[`q${i}`]:{solText:e.solText||'',comment:e.comment||''},updatedAt:Date.now()},
        {merge:true}
      );
      setSavedEditsMap(prev=>({...prev,[i]:{solText:e.solText||'',comment:e.comment||''}}));
    }catch(err){
      alert('세션 저장 실패: '+err.message);
    }
  };

  const toggleEditing=(i)=>{
    const e=edits[i]||{};
    if(e.editing)saveSessionEdit(i);
    setEdits(prev=>({...prev,[i]:{...prev[i],editing:!prev[i]?.editing}}));
  };

  // 다음 해설에 반영: 해설 풀이 틀(solText)만 저장, 코멘트는 전파하지 않음
  const saveOverride=async(i)=>{
    const q=qs[i];
    const e=edits[i]||{};
    const solText=e.solText||'';
    if(!solText.trim()){alert('해설(풀이 과정)을 먼저 입력해주세요.\n코멘트는 다음 문제에 반영되지 않습니다.');return;}
    const topic=String(q.topic||q.meta?.type||'');
    if(!topic){alert('이 문제에는 topic 정보가 없어 저장할 수 없습니다.');return;}
    try{
      await saveSessionEdit(i);
      // comment는 포함하지 않음 — 해설 풀이 틀(solText)만 다음 문제에 반영
      const overrideVal={solText,graphType:q.graph?.type||null,questionRef:q.q||q.qTxt||'',updatedAt:Date.now()};
      await db.collection('teacherSettings').doc('explanationOverrides').set(
        {[topic]:overrideVal,updatedAt:Date.now()},{merge:true}
      );
      setTopicOverrides(prev=>({...prev,[topic]:overrideVal}));
      setOverrideSaved(prev=>({...prev,[i]:true}));
      setTimeout(()=>setOverrideSaved(prev=>({...prev,[i]:false})),2500);
    }catch(err){alert('저장 실패: '+err.message);}
  };

  const renderMathHtml=txt=>{
    if(!txt)return'';
    // 마크다운 인라인 서식 적용 (HTML 이스케이프 후 적용하므로 안전)
    const applyMd=s=>s
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/__(.+?)__/g,'<strong>$1</strong>')
      .replace(/_(.+?)_/g,'<em>$1</em>')
      .replace(/~~(.+?)~~/g,'<del>$1</del>');
    const result=[];
    const s=String(txt);
    const re=/(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g;
    let lastIdx=0,m;
    while((m=re.exec(s))!==null){
      if(m.index>lastIdx)result.push(applyMd(esc(s.slice(lastIdx,m.index))));
      const token=m[1];
      const isDisplay=token.startsWith('$$');
      const inner=isDisplay?token.slice(2,-2).trim():token.slice(1,-1);
      try{
        const rendered=window.katex
          ?window.katex.renderToString(inner,{throwOnError:false,displayMode:isDisplay,strict:false,output:'mathml'})
          :isDisplay?`<div style="font-style:italic;text-align:center;margin:.4em 0">${esc(inner)}</div>`:`<em>${esc(inner)}</em>`;
        result.push(isDisplay?`<div style="text-align:center;margin:.4em 0">${rendered}</div>`:rendered);
      }catch(e){
        result.push(isDisplay?`<div style="font-style:italic;text-align:center;margin:.4em 0">${esc(inner)}</div>`:`<em>${esc(inner)}</em>`);
      }
      lastIdx=m.index+m[0].length;
    }
    if(lastIdx<s.length)result.push(applyMd(esc(s.slice(lastIdx))));
    return result.join('');
  };

  const doPrint=(mode='teacher')=>{
    const isStudent=mode==='student';
    const cols=printCols||1;
    const pw=window.open('','_blank','width=900,height=1200');
    if(!pw){alert('팝업이 차단되어 있습니다. 팝업을 허용한 후 다시 시도해주세요.');return;}
    const isLarge=mode==='teacher-large'||mode==='student';
    const showSol=!isStudent;
    const docTitle=isStudent?'검정고시 연습 문제지':mode==='teacher-large'?'검정고시 연습 문제·해설지 (큰글씨)':'검정고시 연습 문제·해설지';
    const pageGroups=[];
    for(let i=0;i<qs.length;i+=3)pageGroups.push({startIdx:i,items:qs.slice(i,i+3)});
    const total=pageGroups.length;
    const sz=isLarge
      ?{qb:'19px',ch:'17px',qn:'17px',ans:'15px',sol:'14px',meta:'12px',topic:'11px',title:'18px',footer:'12px',cont:'11px'}
      :{qb:'13px',ch:'12px',qn:'13px',ans:'12px',sol:'11.5px',meta:'11px',topic:'10px',title:'17px',footer:'11px',cont:'10px'};
    let pages='';
    for(let pi=0;pi<total;pi++){
      const{startIdx,items:pqs}=pageGroups[pi];
      const isLast=pi===total-1;
      const hdr=pi===0
        ?`<div class="title-block"><div class="title">${docTitle}</div><div class="meta">${esc((studentName?studentName+' · ':'')+esc(log.type||'연습')+' · '+fmtDate(log.date)+' '+(log.time||''))}</div></div>`
        :`<div class="cont-hdr">${esc(studentName||'연습')} · ${fmtDate(log.date)} (${pi+1}/${total} 페이지)</div>`;
      const qsHtml=pqs.map((q,j)=>{
        const i=startIdx+j;
        const e=edits[i]||{};
        const hasFull=q.qFull&&Array.isArray(q.choices);
        const correct=hasFull?q.choices[q.answerIdx]:(q.cAns||'');
        const choHtml=hasFull
          ?isStudent
            ?`<div class="choices">${q.choices.map((c,jj)=>`<div class="ch">${esc(ORD[jj]+' '+c)}</div>`).join('')}</div>`
            :`<div class="choices">${q.choices.map((c,jj)=>`<div class="${jj===q.answerIdx?'ch ok':'ch'}">${esc(ORD[jj]+' '+c)}${jj===q.answerIdx?' ✓':''}</div>`).join('')}</div>`
          :'';
        const solText=e.solText||'';
        const solHtml=(showSol&&solText)?`<div class="sol"><span class="sol-hd">📖 풀이 과정</span><div style="line-height:1.8">${renderMathHtml(solText).replace(/\n/g,'<br>')}</div></div>`:'';
        const commentHtml=(showSol&&e.comment)?`<div class="teacher-comment"><span class="tc-hd">👨‍🏫 선생님 코멘트</span><div style="line-height:1.8">${renderMathHtml(e.comment).replace(/\n/g,'<br>')}</div></div>`:'';
        const qrHtml=isStudent?'':` <span class="qr ${q.isOk?'ok':'fail'}">${q.isOk?'O':'X'}</span>`;
        const uHtml=(showSol&&!q.isOk&&q.uAns)?` <span class="u-ans">(내 답: ${esc(q.uAns)})</span>`:'';
        const ansHtml=isStudent?'':`<div class="ans">정답: ${esc(hasFull?ORD[q.answerIdx]+' ':'')}${esc(correct)}${uHtml}</div>`;
        const topicHtml=(showSol&&q.topic)?`<div class="topic">[${esc(q.topic)}]${q.examSource?' · 📌 '+esc(q.examSource):''}</div>`:'';
        const graphSvg=q.graph?graphToSvgString(q):'';
        const graphHtml=graphSvg?`<div style="text-align:center;margin:4px 0 6px">${graphSvg}</div>`:'';
        return`<div class="question"><div class="q-head"><span class="qn">${i+1}.</span><span class="qb">${esc(hasFull?q.qFull:q.qTxt)}</span>${qrHtml}</div>${topicHtml}${graphHtml}${choHtml}${ansHtml}${solHtml}${commentHtml}</div>`;
      }).join('');
      pages+=`<div class="${isLast?'page':'page pb'}">${hdr}${qsHtml}${isLast?'<div class="footer">— 태청야학 수학 학습 도우미 —</div>':''}</div>`;
    }
    pw.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>${docTitle}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      .katex svg{display:inline!important;vertical-align:middle}.katex{line-height:1.2}.katex-display{display:block;text-align:center;margin:.5em 0}
      body{font-family:'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕',sans-serif;color:#1e293b;background:white;}
      .page{padding:12mm 15mm;${cols===2?'columns:2;column-gap:24px;':''}}
      .pb{break-after:page;page-break-after:always;}
      .title-block{text-align:center;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:18px;}
      .title{font-size:${sz.title};font-weight:900;}
      .meta{font-size:${sz.meta};color:#475569;margin-top:3px;font-weight:700;}
      .cont-hdr{text-align:right;font-size:${sz.cont};color:#94a3b8;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:14px;}
      .question{break-inside:avoid;page-break-inside:avoid;margin-bottom:${isLarge?'26px':'20px'};padding-bottom:${isLarge?'18px':'14px'};border-bottom:1px solid #e2e8f0;}
      .q-head{display:flex;gap:8px;align-items:flex-start;margin-bottom:4px;}
      .qn{font-weight:900;color:#4f46e5;flex-shrink:0;min-width:22px;font-size:${sz.qn};}
      .qb{font-weight:700;line-height:1.7;flex:1;font-size:${sz.qb};}
      .qr{font-weight:900;font-size:${sz.ch};flex-shrink:0;}
      .qr.ok{color:#16a34a;}.qr.fail{color:#ef4444;}
      .topic{margin-left:26px;font-size:${sz.topic};color:#64748b;font-weight:700;margin-bottom:3px;}
      .choices{margin-left:26px;display:grid;grid-template-columns:1fr 1fr;gap:${isLarge?'6px 16px':'2px 14px'};margin:${isLarge?'8px 0':'5px 0'};}
      .ch{font-size:${sz.ch};color:#374151;line-height:${isLarge?'1.7':'1.5'};}
      .ch.ok{font-weight:900;color:#15803d;}
      .ans{margin-left:26px;margin-top:5px;font-size:${sz.ans};font-weight:900;color:#15803d;}
      .u-ans{color:#ef4444;font-weight:700;margin-left:8px;}
      .sol{margin-left:26px;margin-top:8px;font-size:${sz.sol};background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 14px;}
      .sol-hd{font-weight:900;color:#b45309;display:block;margin-bottom:4px;}
      .teacher-comment{margin-left:26px;margin-top:8px;font-size:${sz.sol};background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 14px;}
      .tc-hd{font-weight:900;color:#166534;display:block;margin-bottom:4px;}
      .footer{text-align:center;font-size:${sz.footer};color:#94a3b8;margin-top:20px;}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.pb{break-after:page;page-break-after:always;}.question{break-inside:avoid;page-break-inside:avoid;}}
    </style></head><body>${pages}<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>`);
    pw.document.close();
  };

  const toggleCorrection=async(i)=>{
    if(!sessionId||!studentId)return;
    const newVal=!corrected[i];
    setCorrected(prev=>({...prev,[i]:newVal}));
    try{
      await db.collection('sessionEdits').doc(sessionId).set(
        {[`corrected_q${i}`]:newVal,updatedAt:Date.now()},
        {merge:true}
      );
    }catch(err){
      setCorrected(prev=>({...prev,[i]:!newVal}));
      alert('오답 수정 저장 실패: '+err.message);
    }
  };

  return(
    <div className="session-print-area fixed inset-0 z-50 bg-white overflow-auto">
      <div className="no-print sticky top-0 bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shadow-md flex-wrap">
        <button onClick={onClose} className="px-3 py-1.5 bg-white/20 rounded-xl font-bold text-sm">← 닫기</button>
        <div className="flex-1 font-black text-sm">📄 회차 문제·해설 인쇄</div>
        {[1,2].map(n=><button key={n} onClick={()=>setPrintCols(n)} className={`px-2 py-1 rounded-lg text-xs font-bold border ${printCols===n?'bg-white text-indigo-700 border-white':'bg-white/20 text-white border-white/40'}`}>{n}열</button>)}
        <button onClick={()=>doPrint('student')} className="px-3 py-1.5 bg-sky-400 text-white rounded-xl font-black text-sm">📄 학생 제공용</button>
        <button onClick={()=>doPrint('teacher-large')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl font-black text-sm">🔡 큰글씨 보기</button>
        <button onClick={()=>doPrint('teacher')} className="px-3 py-1.5 bg-white text-indigo-700 rounded-xl font-black text-sm">📋 기본</button>
      </div>
      <div className="no-print px-4 pt-2 pb-1 bg-sky-50 mx-4 rounded-lg mt-2 text-xs text-sky-700 font-semibold">
        📄 <b>학생 제공용</b>: 정답·해설 없이 문제만 (큰 글씨) &nbsp;|&nbsp; 🔡 <b>큰글씨 보기</b>: 해설 포함, 학생이 읽기 쉬운 큰 글씨 &nbsp;|&nbsp; 📋 <b>기본</b>: 정답·해설 포함 기본 크기
      </div>
      <div className="no-print px-4 pt-1 text-xs text-red-500 font-semibold">- 잘림 현상이 있을 수 있습니다. 원활한 인쇄를 위해 Chrome 등 다른 브라우저를 사용해주세요 :) -</div>
      <div className="no-print px-4 pt-1 pb-1 text-xs text-indigo-600 font-semibold bg-indigo-50 mx-4 rounded-lg mt-1">✏️ 각 문제 아래 [해설 수정] 버튼으로 해설을 수정하거나 선생님 코멘트를 추가할 수 있습니다. <b>$ 수식 $</b> 수학식 · <b>**굵게**</b> · <b>*기울임*</b> · <b>~~취소선~~</b> 입력 가능. · <b>💾 저장 &amp; 완료</b>로 이 세션에 고정, <b>📚 다음 해설에 반영</b>으로 같은 유형 모든 학생에 적용됩니다.</div>

      <style dangerouslySetInnerHTML={{__html:`
        @media print {
          .no-print { display: none !important; }
          .session-print-item { page-break-inside: avoid; break-inside: avoid; }
          .print-page-group { page-break-after: always; break-after: page; }
          .print-page-group:last-child { page-break-after: auto; break-after: auto; }
          .print-page-header { page-break-inside: avoid; break-inside: avoid; }
        }
      `}}/>

      <div className="px-6 py-5 max-w-3xl mx-auto">
        {Array.from({length:Math.ceil(qs.length/3)},(_,pi)=>{
          const pageQs=qs.slice(pi*3,pi*3+3);
          const isLast=pi===Math.ceil(qs.length/3)-1;
          return(
            <div key={pi} className={isLast?'':'print-page-group'}>
              {pi===0?(
                <div className="text-center border-b-2 border-gray-800 pb-3 mb-5 print-page-header">
                  <div className="text-xl font-black text-gray-900">검정고시 연습 문제·해설지</div>
                  <div className="text-sm text-gray-600 mt-1 font-bold">
                    {studentName?`${studentName} · `:''}{log.type||'연습'} · {fmtDate(log.date)} {log.time||''} · 점수 {log.score||''}
                  </div>
                </div>
              ):(
                <div className="text-right text-xs text-gray-400 border-b border-gray-200 pb-1 mb-4 print-page-header">
                  {studentName||'연습'} · {fmtDate(log.date)} ({pi+1}/{Math.ceil(qs.length/3)} 페이지)
                </div>
              )}

              {pageQs.map((q,j)=>{
                const i=pi*3+j;
                const e=edits[i]||{};
                const hasFull=q.qFull&&Array.isArray(q.choices);
                const correctText=hasFull?q.choices[q.answerIdx]:(q.cAns||'');
                return(
                  <div key={i} className="session-print-item mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="font-black text-indigo-700">{i+1}.</span>
                      <span className="font-bold text-gray-900 leading-relaxed flex-1">{hasFull?q.qFull:q.qTxt}</span>
                      <span className={`text-xs font-black ${q.isOk?'text-green-600':'text-red-500'}`}>{q.isOk?'O':'X'}</span>
                    </div>
                    {q.topic&&<div className="ml-5 mb-1 text-xs text-gray-500 font-bold">[{q.topic}]{q.examSource?` · 📌 ${q.examSource}`:''}</div>}
                    {!q.topic&&q.examSource&&<div className="ml-5 mb-1 text-xs text-blue-600 font-bold">📌 {q.examSource}</div>}
                    {q.graph&&<div className="my-2 flex justify-center"><GraphPreview q={q}/></div>}
                    {hasFull&&(
                      <div className="ml-5 grid grid-cols-2 gap-x-4 gap-y-1 my-2">
                        {q.choices.map((c,jj)=>(
                          <div key={jj} className={`text-sm ${jj===q.answerIdx?'font-black text-green-700':'text-gray-700'}`}>
                            {ORD[jj]} {String(c)}{jj===q.answerIdx?' ✓':''}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="ml-5 mt-1 text-sm font-black text-green-700 flex flex-wrap items-center gap-2">
                      <span>정답: {hasFull?`${ORD[q.answerIdx]} `:''}{correctText}</span>
                      {!q.isOk&&q.uAns?<span className="text-red-500 font-bold">(내 답: {q.uAns})</span>:null}
                      {!q.isOk&&corrected[i]&&<span className="text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full">✅ 오답 수정 완료</span>}
                    </div>
                    {!q.isOk&&!!studentId&&(
                      <div className="no-print ml-5 mt-1.5">
                        <button
                          onClick={()=>toggleCorrection(i)}
                          className={`text-xs font-black px-3 py-1 rounded-lg border transition-all ${corrected[i]?'bg-emerald-100 text-emerald-700 border-emerald-300':'bg-orange-50 text-orange-600 border-orange-300 hover:bg-orange-100'}`}
                        >
                          {corrected[i]?'✅ 오답 수정 완료 (취소)':'✏️ 오답 수정 체크'}
                        </button>
                      </div>
                    )}
                    {e.solText?(
                      <div className="ml-5 mt-1.5 text-sm text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-amber-700">📖 풀이 과정</span>
                          {savedEditsMap[i]&&<span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">💾 저장됨</span>}
                          {e.overrideApplied&&!savedEditsMap[i]&&<span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">📚 이전 수업 풀이방식</span>}
                        </div>
                        <div className="space-y-0.5 leading-relaxed" dangerouslySetInnerHTML={{__html:renderMathHtml(e.solText).replace(/\n/g,'<br/>')}}/>
                      </div>
                    ):null}
                    {e.comment?(
                      <div className="ml-5 mt-1.5 text-sm text-gray-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div className="font-black text-green-700 mb-1">👨‍🏫 선생님 코멘트</div>
                        <div className="leading-relaxed" dangerouslySetInnerHTML={{__html:renderMathHtml(e.comment).replace(/\n/g,'<br/>')}}/>
                      </div>
                    ):null}
                    <div className="no-print ml-5 mt-2">
                      {e.editing?(
                        <div className="border border-dashed border-indigo-300 rounded-xl p-3 bg-indigo-50/60 space-y-2">
                          <div>
                            <div className="text-xs font-black text-amber-700 mb-1">📖 해설 수정 <span className="font-normal text-gray-500">($ 수식 $ 형식으로 수학식 입력 가능)</span></div>
                            <textarea value={e.solText||''} onChange={ev=>setEdit(i,'solText',ev.target.value)} rows={4} className="w-full text-sm border border-amber-200 rounded-lg p-2 font-mono resize-y bg-white" placeholder="풀이 과정을 입력하세요."/>
                          </div>
                          <div>
                            <div className="text-xs font-black text-green-700 mb-1">💬 선생님 코멘트 <span className="font-normal text-gray-500">($ 수식 $, **굵게**, *기울임*, ~~취소선~~ 입력 가능)</span></div>
                            <textarea value={e.comment||''} onChange={ev=>setEdit(i,'comment',ev.target.value)} rows={3} className="w-full text-sm border border-green-200 rounded-lg p-2 resize-y bg-white" placeholder="이 문제에 대한 선생님 코멘트를 입력하세요."/>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={()=>toggleEditing(i)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-black">{sessionId?'💾 저장 & 완료':'완료 ✓'}</button>
                            <button
                              onClick={()=>saveOverride(i)}
                              disabled={!e.solText?.trim()}
                              className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${overrideSaved[i]?'bg-green-500 text-white':'bg-amber-500 text-white disabled:opacity-40 active:scale-95'}`}
                            >
                              {overrideSaved[i]?'✅ 반영 완료!':'📚 다음 해설에 반영'}
                            </button>
                            {e.solText?.trim()&&<span className="text-[10px] text-gray-400">같은 유형 문제의 풀이 틀로 저장됩니다 (코멘트 제외)</span>}
                          </div>
                        </div>
                      ):(
                        <button onClick={()=>toggleEditing(i)} className="text-xs font-bold px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                          ✏️ {e.solText||e.comment?'해설 수정':'해설 추가'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLast&&<div className="text-center text-xs text-gray-400 mt-6">— 태청야학 수학 학습 도우미 —</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
