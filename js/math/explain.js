// === js/math/explain.js ===
/* --------------------------------------------------------------------
   해설 표시 컴포넌트
   ExplanationBox — 쉬운 해설을 접었다 펼치는 상자
   -------------------------------------------------------------------- */

function ExplanationBox({q,className=''}) {
  // 생성기가 만든 단계별 해설이 있으면 번호를 매겨 표시 (정답과 동일한 계산 → 항상 일치)
  if(q&&Array.isArray(q.sol)&&q.sol.length){
    return <div className={`mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 font-semibold leading-relaxed ${className}`}>
      <div className="font-black text-amber-700 mb-1.5">📖 풀이 과정</div>
      <ol className="space-y-1">
        {q.sol.map((s,i)=>(<li key={i} className="flex gap-1.5">
          <span className="shrink-0 font-black text-amber-600">{i+1===q.sol.length?'➡':`${i+1}.`}</span>
          <span dangerouslySetInnerHTML={{__html:autoMathHtml(s)}}/>
        </li>))}
      </ol>
    </div>;
  }
  return <div className={`mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 font-semibold leading-relaxed ${className}`}>
    <span className="font-black text-amber-700">쉬운 해설 · </span>{easyExplanation(q)}
  </div>;
}
