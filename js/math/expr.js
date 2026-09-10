// === js/math/expr.js ===
/* --------------------------------------------------------------------
   수식 표기 컴포넌트
   MathExpr(=MathText) · 문제 텍스트 속 분수 렌더링 QText
   -------------------------------------------------------------------- */

/* ── 수식 렌더러 MathExpr ──
   그래프 탐험이 쓰는 SqR / VF 컴포넌트 재사용 (함수선언 호이스팅으로 forward-use 가능)
   ① 단독 분수 "3/5", "2/√5"  → VF 세로분수
   ② 무리함수 선지 "y=−2√(x+2)−1"  → SqR 루트 기호
   ③ 유리함수 선지 "y=−3/(x−2)+2"  → VF 세로분수
   ④ 기타(좌표, 정수, 방정식 등)    → 텍스트 그대로 */



function MathExpr({v}){
  if(v==null) return null;
  const s=String(v);

  // ① 단독 분수: 문자열 전체가 "num/den" 형태
  const sf=s.match(/^(-?(?:√?\d+|\d+√\d+))\/(√?\d+|\d+√?\d*)$/);
  if(sf) return <VF n={sf[1]} d={sf[2]}/>;

  // ② 무리함수 선지: y=[COEFF]√([INNER])[SUFFIX]
  //    COEFF: 빈문자·"−"·"2"·"-2" 등, INNER: "x+2" 등
  const rm=s.match(/^(y=)([-−]?\d*)√\(([^)]+)\)(.*)$/);
  if(rm){
    const[,pre,co,inner,suf]=rm;
    return(
      <span style={{display:'inline-flex',alignItems:'baseline',whiteSpace:'nowrap'}}>
        <span>{pre}{co}</span>
        <SqR s={inner} sz={14}/>
        {suf&&<span>{suf}</span>}
      </span>
    );
  }

  // ③ 유리함수 선지: y=[K]/([DENOM])[SUFFIX]
  //    K: "-3","2" 등, DENOM: "x−2","x+1" 등
  const rat=s.match(/^(y=)([-−]?\d+)\/((\([^)]+\)))(.*)$/);
  if(rat){
    const[,pre,n,d,,suf]=rat;
    return(
      <span style={{display:'inline-flex',alignItems:'center',whiteSpace:'nowrap'}}>
        <span>{pre}</span>
        <VF n={n} d={d}/>
        {suf&&<span>{suf}</span>}
      </span>
    );
  }

  // ④ 기타
  return <>{s}</>;
}

// 하위 호환성을 위한 별칭
var MathText=MathExpr;

/* 문제 텍스트에서 k/x 형태의 분수를 VF로 렌더링 */
function QText({v}){
  if(!v) return null;
  const s=String(v);
  const parts=s.split(/([-−]?\d+\/x(?!\())/g);
  if(parts.length<=1) return <>{s}</>;
  return <>{parts.map((pt,i)=>{
    if(i%2===0) return <React.Fragment key={i}>{pt}</React.Fragment>;
    const num=pt.split('/')[0];
    return <VF key={i} n={num.replace('−','-')} d="x"/>;
  })}</>;
}
