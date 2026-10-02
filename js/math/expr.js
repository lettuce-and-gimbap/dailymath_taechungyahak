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

/* ── 기하학 탭 수식 → KaTeX (2026-10-02) ──
   생성기(generators/high/explore.js)의 q·choices·sol 은 기록·선생님 화면·인쇄에 글자 그대로 쓰이므로 손대지 않고,
   학생 화면에 '그릴 때만' TeX 로 바꿔 autoMathHtml(KaTeX)로 그린다.
   예전에는 √x · 3/x · −/- 가 글자로 섞여 나오고, 분모에 괄호가 남는 등 수식이 어색했다. */
var _texCore=s=>String(s)
  .replace(/−/g,'-')
  .replace(/√\(([^)]+)\)/g,'\\sqrt{$1}')                 // √(x-1) → √{x-1}
  .replace(/√(\d+|x)/g,'\\sqrt{$1}')                      // √13, √x
  .replace(/([0-9a-z)])²/g,'$1^2').replace(/([0-9a-z)])³/g,'$1^3')
  .replace(/₀/g,'_0');
/* 보기·정답처럼 문자열 전체가 수식인 것 */
function geoTex(v){
  let s=_texCore(v).trim();
  let m;
  if((m=s.match(/^y=(-?)(\d+)\/\(([^)]+)\)(.*)$/)))           // y=-3/(x-1)+2
    s=`y=${m[1]}\\dfrac{${m[2]}}{${m[3]}}${m[4]}`;
  else if((m=s.match(/^(-?)([0-9]+(?:\\sqrt\{\d+\})?|\\sqrt\{\d+\})\/([0-9]+|\\sqrt\{\d+\})$/)))   // 8/√13 · 2√13/13
    s=`${m[1]}\\dfrac{${m[2]}}{${m[3]}}`;
  s=s.replace(/^\((-?\d+), ?(-?\d+)\)$/,'($1,\\ $2)');      // 좌표
  return'$'+s+'$';
}
/* 글 속에 섞인 수식 조각만 골라 $…$ 로 감싼다 (풀이 줄 등) */
function inlineGeoTex(v){
  return String(v)
    .replace(/(\d+)\/√(\d+)/g,(_,a,b)=>`$\\dfrac{${a}}{\\sqrt{${b}}}$`)
    .replace(/√\(([^)]+)\)/g,(_,a)=>`$\\sqrt{${_texCore(a)}}$`)
    .replace(/√(\d+)/g,(_,a)=>`$\\sqrt{${a}}$`)
    .replace(/\(([xy])([−+-])(\d+|[a-z])\)²/g,(_,a,o,b)=>`$(${a}${o==='−'?'-':o}${b})^2$`)
    .replace(/([xy])²/g,'$$$1^2$$').replace(/r²/g,'$r^2$')
    .replace(/([0-9])²/g,'$$$1^2$$')
    .replace(/\$\$/g,'$ $');   // 붙어 있는 두 조각이 $$(블록)로 읽히지 않게
}
/* TeX 표시를 HTML 로 — 클릭 영역 안에서도 쓰는 짧은 컴포넌트 */
function TexHtml({tex,className}){return<span className={className} dangerouslySetInnerHTML={{__html:autoMathHtml(tex)}}/>;}
