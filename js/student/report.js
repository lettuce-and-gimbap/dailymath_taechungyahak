// === js/student/report.js ===
/* --------------------------------------------------------------------
   학생용 학습 리포트
   세션이 끝난 뒤 보여 주는 성취 요약
   -------------------------------------------------------------------- */

/* ===== 학습 리포트 ===== */
function StudentLearningReport({userData,onClose}){
  const allLogs=userData.logs||[];
  const allQs=allLogs.flatMap(l=>l.questions||[]);
  const total=allQs.length;
  const correct=allQs.filter(q=>q.isOk).length;
  const pct=total>0?Math.round(correct/total*100):0;

  const catMap={};
  allQs.forEach(q=>{
    const cat=q.meta?.type||(q.topic?q.topic:'기타');
    if(!catMap[cat])catMap[cat]={total:0,correct:0};
    catMap[cat].total++;
    if(q.isOk)catMap[cat].correct++;
  });
  const cats=Object.entries(catMap).map(([k,v])=>({name:k,...v,pct:Math.round(v.correct/v.total*100)})).sort((a,b)=>a.pct-b.pct);
  const weak=cats.filter(c=>c.pct<60&&c.total>=2);
  const strong=cats.filter(c=>c.pct>=80&&c.total>=2);

  const encourage=pct>=80?'정말 잘하고 계세요! 꾸준히 하면 반드시 합격할 수 있습니다 😊':pct>=60?'잘 하고 계세요! 조금만 더 노력하면 더욱 좋아질 거예요 💪':'걱정하지 마세요. 천천히 꾸준히 하다 보면 반드시 늘게 됩니다 🌱';

  const reportRef=useRef(null);
  const[saving,setSaving]=useState(false);
  const saveAsJPG=async()=>{
    if(!window.html2canvas){alert('html2canvas를 불러오지 못했습니다.');return;}
    const el=reportRef.current;
    if(!el)return;
    setSaving(true);
    el.scrollTop=0;
    // React가 saving 상태로 리렌더한 뒤 잠시 기다려 레이아웃을 안정화
    await new Promise(r=>setTimeout(r,100));
    try{
      const W=el.scrollWidth;
      const fullH=el.scrollHeight;
      const canvas=await window.html2canvas(el,{
        scale:2,
        backgroundColor:'#ffffff',
        useCORS:true,
        scrollX:0,
        scrollY:0,
        width:W,
        height:fullH,
        windowWidth:W,
        windowHeight:fullH,
        onclone:(_doc,cloned)=>{
          // 컨테이너만 overflow 해제 (자식은 유지해야 progress bar 등이 정상 렌더)
          cloned.style.setProperty('position','relative','important');
          cloned.style.setProperty('top','0','important');
          cloned.style.setProperty('left','0','important');
          cloned.style.setProperty('max-height','none','important');
          cloned.style.setProperty('overflow','visible','important');
          cloned.style.setProperty('height',fullH+'px','important');
          cloned.style.setProperty('box-shadow','none','important');
          // 버튼은 레이아웃 유지하되 보이지 않게 처리 (저장 중… 문구 등 제거)
          cloned.querySelectorAll('button').forEach(b=>b.style.setProperty('visibility','hidden','important'));
        },
      });
      const a=document.createElement('a');
      a.href=canvas.toDataURL('image/jpeg',0.95);
      a.download=`학습보고서_${userData.name}.jpg`;
      a.click();
    }catch(err){alert('JPG 저장 실패: '+err.message);}
    finally{setSaving(false);}
  };

  return(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div ref={reportRef} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        <div className="bg-indigo-600 text-white px-5 py-4 rounded-t-3xl flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <div className="flex-1">
            <div className="font-black text-lg">나의 학습 리포트</div>
            <div className="text-xs text-indigo-200 font-semibold">{userData.name}님 · 총 {total}문제</div>
          </div>
          <button onClick={saveAsJPG} disabled={saving} className="px-3 py-1.5 bg-white text-indigo-700 rounded-xl font-black text-sm disabled:opacity-60">{saving?'저장 중…':'💾 JPG 저장'}</button>
          <button onClick={onClose} className="px-3 py-1.5 bg-white/20 rounded-xl font-bold text-sm">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {total===0?(
            <div className="text-center py-10 text-gray-400 text-lg font-bold">아직 풀이 기록이 없어요.<br/>문제를 풀어보세요!</div>
          ):(
            <>
              <div className="text-center py-4 bg-gray-50 rounded-2xl">
                <div className={`text-6xl font-black ${pct>=80?'text-green-600':pct>=60?'text-blue-600':'text-red-500'}`}>{pct}%</div>
                <div className="text-sm text-gray-500 mt-1 font-bold">전체 정답률 ({correct}/{total}문제)</div>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl px-4 py-3 text-base font-bold text-yellow-900 leading-relaxed">{encourage}</div>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="font-black text-gray-800 mb-3">📈 영역별 정답률</div>
                {cats.length===0?<div className="text-gray-400 text-sm">데이터가 부족합니다.</div>:cats.map(c=>(
                  <div key={c.name} className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-600 w-28 shrink-0 truncate">{c.name}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${c.pct>=80?'bg-green-500':c.pct>=60?'bg-blue-500':'bg-red-400'}`} style={{width:c.pct+'%'}}/>
                    </div>
                    <span className={`text-xs font-black w-10 text-right ${c.pct>=80?'text-green-600':c.pct>=60?'text-blue-600':'text-red-500'}`}>{c.pct}%</span>
                  </div>
                ))}
              </div>
              {weak.length>0&&(
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <div className="font-black text-red-700 mb-2">📌 더 연습하면 좋은 부분</div>
                  {weak.map(c=>(
                    <div key={c.name} className="text-sm text-red-800 font-bold mb-1">• {c.name} ({c.pct}%) — 집중 연습을 추천해요!</div>
                  ))}
                </div>
              )}
              {strong.length>0&&(
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <div className="font-black text-green-700 mb-2">🌟 잘하고 있는 부분</div>
                  {strong.map(c=>(
                    <div key={c.name} className="text-sm text-green-800 font-bold mb-1">• {c.name} ({c.pct}%) — 훌륭해요!</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
