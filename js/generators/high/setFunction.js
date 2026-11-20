// === js/generators/high/setFunction.js ===
/* --------------------------------------------------------------------
   고졸 ④ 집합과 함수
   집합 · 명제 · 합성/역함수 · 유리함수 · 무리함수
   -------------------------------------------------------------------- */

/* ════════════════════════════════════════════════
   ④ 집합과 함수 영역 — 11개 세부유형 완전 분석
   2023~2026 Q15~Q18 전 패턴 커버
   ════════════════════════════════════════════════ */

// 4-1. 집합 원소 나열 연산 (합/교/차집합)  (기출 Q15 패턴A)
function gen_set_elements(){
  const base=[1,2,3,4,5,6,7,8,9];
  const A=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const B=shuffle([...base]).slice(0,randInt(3,4)).sort((a,b)=>a-b);
  const op=pick(['∪','∩','A−B','B−A']);
  let result,qText;
  if(op==='∪'){result=[...new Set([...A,...B])].sort((a,b)=>a-b);qText='A∪B';}
  else if(op==='∩'){result=A.filter(x=>B.includes(x));qText='A∩B';}
  else if(op==='A−B'){result=A.filter(x=>!B.includes(x));qText='A−B';}
  else{result=B.filter(x=>!A.includes(x));qText='B−A';}
  if(result.length===0)return gen_set_elements();
  const correct=`{${result.join(', ')}}`;
  const w1=`{${result.map(x=>x+1).join(', ')}}`;
  const w2=`{${A.filter(x=>!result.includes(x)).concat(result).sort((a,b)=>a-b).slice(0,result.length).join(', ')}}`;
  const w3=`{${B.filter(x=>!A.includes(x)).sort((a,b)=>a-b).concat(result).slice(0,result.length).join(', ')}}`;
  const wrongs=[w1,w2,w3].filter(w=>w!==correct&&!w.includes('undefined')&&w!=='{}');
  const{choices,answer}=makeChoices(correct,wrongs.slice(0,3));
  const opDesc={'∪':'합집합(∪): A 또는 B에 속하는 원소 모두 모읍니다.','∩':'교집합(∩): A와 B 모두에 속하는 원소만 남깁니다.','A−B':'차집합(A−B): A에 있고 B에 없는 원소만 남깁니다.','B−A':'차집합(B−A): B에 있고 A에 없는 원소만 남깁니다.'};
  return{topic:'집합 원소연산',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 ${qText}는?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      opDesc[op],
      `A={${A.join(', ')}}, B={${B.join(', ')}}`,
      op==='∪'?`A∪B = A와 B의 원소를 합치고 중복 제거: ${correct}`
      :op==='∩'?`A∩B = 둘 다 있는 원소: ${A.filter(x=>B.includes(x)).join(', ')||'없음'} → ${correct}`
      :op==='A−B'?`A−B = A에서 B와 겹치는 ${A.filter(x=>B.includes(x)).join(', ')}를 뺀 나머지: ${correct}`
      :`B−A = B에서 A와 겹치는 ${B.filter(x=>A.includes(x)).join(', ')}를 뺀 나머지: ${correct}`,
      `따라서 ${qText} = ${correct}입니다.`
    ]};
}

// 4-2. 집합 개수 n(A op B)  (기출 Q15 패턴B)
function gen_set_count(){
  const base=[1,2,3,4,5,6,7,8,9,10];
  const A=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const B=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const unionN=[...new Set([...A,...B])].length;
  const interN=A.filter(x=>B.includes(x)).length;
  const diffABN=A.filter(x=>!B.includes(x)).length;
  const op=pick(['∪','∩','A-B']);
  const ans=op==='∪'?unionN:op==='∩'?interN:diffABN;
  if(ans<1)return gen_set_count();
  const qText=op==='A-B'?'n(A−B)':`n(A${op}B)`;
  const{choices,answer}=makeChoices(String(ans),[ans+1,Math.max(0,ans-1),ans+2].filter(w=>w!==ans&&w>=0).slice(0,3).map(String));
  const inter=A.filter(x=>B.includes(x));
  return{topic:'집합 개수',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 ${qText}의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:op==='∪'?[
      `n(A∪B) = A 또는 B에 속하는 원소의 개수입니다.`,
      `A∪B = {${[...new Set([...A,...B])].sort((a,b)=>a-b).join(', ')}}`,
      `원소의 개수 = ${ans}입니다.`
    ]:op==='∩'?[
      `n(A∩B) = A와 B 모두에 속하는 원소의 개수입니다.`,
      `A∩B = {${inter.join(', ')||'∅'}}`,
      `원소의 개수 = ${ans}입니다.`
    ]:[
      `n(A−B) = A에 있고 B에 없는 원소의 개수입니다.`,
      `A−B = {${A.filter(x=>!B.includes(x)).join(', ')||'∅'}}`,
      `원소의 개수 = ${ans}입니다.`
    ]};
}

// 4-3. n(A∪B)+n(A∩B) 유형  (기출 Q14/Q15: 2024-1, 2025-1)
function gen_set_union_inter_sum(){
  const base=[1,2,3,4,5,6,7,8,9,10];
  const A=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const B=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const unionN=[...new Set([...A,...B])].length;
  const interN=A.filter(x=>B.includes(x)).length;
  const ans=unionN+interN;
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
  const interArr=A.filter(x=>B.includes(x));
  const unionArr=[...new Set([...A,...B])].sort((a,b)=>a-b);
  return{topic:'합집합+교집합 개수',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 n(A∪B)+n(A∩B)의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `n(A∪B)+n(A∩B)를 각각 구해서 더합니다.`,
      `A∪B = {${unionArr.join(', ')}} → n(A∪B) = ${unionN}`,
      `A∩B = {${interArr.join(', ')||'∅'}} → n(A∩B) = ${interN}`,
      `n(A∪B)+n(A∩B) = ${unionN}+${interN} = ${ans}입니다.`
    ]};
}

// 4-4. 집합 A=B 조건 → 상수 a  (기출 Q15: 2023-1 · 2023-2 · 2025-2)
// B 는 1~9 에서 뽑은 세 수, A 는 그 중 한 자리를 'a±d' 로 바꾼 꼴 — 위치·식·수를 매번 바꿔 수천 가지가 나온다.
function gen_set_equal_const(){
  const v=shuffle([1,2,3,4,5,6,7,8,9]).slice(0,3).sort((x,y)=>x-y),idx=randInt(0,2),d=randInt(1,3);
  let plus=Math.random()<0.5;if(plus&&v[idx]-d<1)plus=false;
  const a=plus?v[idx]-d:v[idx]+d,expr=plus?`a+${d}`:`a−${d}`;
  const Aarr=v.map((x,i)=>i===idx?expr:String(x));
  const wr=[a+1,a-1,a+2,v[idx],a+3,Math.abs(a-2)].filter((w,i,ar)=>w!==a&&w>0&&ar.indexOf(w)===i).slice(0,3);
  const{choices,answer}=makeChoices(String(a),wr.map(String));
  return{topic:'집합 상수 구하기',q:`두 집합 A={${Aarr.join(', ')}}, B={${v.join(', ')}}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`A=B이면 두 집합의 원소가 완전히 같아야 합니다.`,`A에서 이미 정해진 원소를 B와 맞추면, ${expr}는 B의 남은 원소 ${v[idx]}가 되어야 합니다.`,`${expr}=${v[idx]}이므로 a=${a}`,`따라서 a=${a}입니다.`]};
}

// 4-5. 진리집합  (기출 Q16: 2023-2 짝수 · 2024-1 n의 배수)
function gen_truth_set(){
  const n=pick([8,9,10,12,15]),U=Array.from({length:n},(_,i)=>i+1),odd=Math.random()<0.2,D=pick([2,3,4,5]);
  const keep=odd?(x=>x%2===1):(x=>x%D===0),word=odd?'홀수':(D===2?'짝수':`${D}의 배수`);
  const T=U.filter(keep),fmt=arr=>`{${arr.join(', ')}}`;
  if(T.length<2)return gen_truth_set();
  const cand=[T.slice(0,-1),U.filter(x=>!keep(x)),T.map(x=>x+1<=n?x+1:x-1).sort((x,y)=>x-y),T.slice(1),[...T,U.filter(x=>!keep(x))[0]].sort((x,y)=>x-y)]
    .map(fmt).filter((v,i,ar)=>v!==fmt(T)&&ar.indexOf(v)===i);
  const{choices,answer}=makeChoices(fmt(T),shuffle(cand).slice(0,3));
  const uText=Math.random()<0.5?`U={x|x는 ${n} 이하의 자연수}`:`U={${U.join(', ')}}`;
  return{topic:'진리집합',q:`전체집합 ${uText}일 때, 조건 "x는 ${word}이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`진리집합: 조건을 참으로 만드는 원소만 모은 집합입니다.`,`1부터 ${n}까지 중 ${word}는 ${T.join(', ')}입니다.`,`따라서 진리집합은 ${fmt(T)}입니다.`]};
}

// 4-6. 명제의 역/대우  (기출 Q16 패턴)
// ※ 고졸 검정고시에서 '역'과 '대우'만 출제됨 ('이'는 미출제)
function gen_proposition(){
  const propType=pick(['num','shape','multiple','ineq']);
  let orig,rev,contra,inv;
  if(propType==='num'){
    const n=pick([2,3,4,5,6,7]),k=pick([2,3]);
    const nk=n**k,kStr=k===2?'²':'³';
    orig=`x=${n}이면 x${kStr}=${nk}이다.`;
    rev=`x${kStr}=${nk}이면 x=${n}이다.`;
    contra=`x${kStr}≠${nk}이면 x≠${n}이다.`;
    inv=`x≠${n}이면 x${kStr}≠${nk}이다.`;
  }else if(propType==='multiple'){
    const [a,b]=pick([[4,2],[6,2],[6,3],[8,4],[9,3],[10,5],[12,6],[10,2],[12,3]]);
    orig=`자연수 n이 ${a}의 배수이면 n은 ${b}의 배수이다.`;
    rev=`자연수 n이 ${b}의 배수이면 n은 ${a}의 배수이다.`;
    contra=`자연수 n이 ${b}의 배수가 아니면 n은 ${a}의 배수가 아니다.`;
    inv=`자연수 n이 ${a}의 배수가 아니면 n은 ${b}의 배수가 아니다.`;
  }else if(propType==='ineq'){
    const [m,m2]=pick([[3,1],[5,2],[4,0],[6,3],[7,2],[5,1],[8,4]]);
    orig=`x>${m}이면 x>${m2}이다.`;
    rev=`x>${m2}이면 x>${m}이다.`;
    contra=`x≤${m2}이면 x≤${m}이다.`;
    inv=`x≤${m}이면 x≤${m2}이다.`;
  }else{
    const sp=pick([{A:'정삼각형',B:'이등변삼각형'},{A:'정사각형',B:'직사각형'},{A:'직사각형',B:'평행사변형'},{A:'평행사변형',B:'사다리꼴'},{A:'마름모',B:'평행사변형'},{A:'정사각형',B:'마름모'},{A:'정사각형',B:'사다리꼴'}]);
    const jo=w=>{const c=w.charCodeAt(w.length-1);return((c-0xAC00)%28)===0?'가':'이';};
    orig=`${sp.A}이면 ${sp.B}이다.`;
    rev=`${sp.B}이면 ${sp.A}이다.`;
    contra=`${sp.B}${jo(sp.B)} 아니면 ${sp.A}${jo(sp.A)} 아니다.`;
    inv=`${sp.A}${jo(sp.A)} 아니면 ${sp.B}${jo(sp.B)} 아니다.`;
  }
  // '이'는 출제되지 않음 — '역'·'대우'만 출제
  const askType=pick(['역','대우']);
  const correct=askType==='역'?rev:contra;
  // inv를 오답 보기로 포함해 변별력 유지
  const{choices,answer}=makeChoices(correct,[orig,rev,contra,inv].filter(w=>w!==correct).slice(0,3));
  return{topic:`명제의 ${askType}`,q:`명제 '${orig}'의 ${askType}는?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `명제를 'p이면 q이다' 꼴로 분석합니다.`,
      `원래 명제: p이면 q이다 → '${orig}'`,
      askType==='역'
        ? `역(逆): q이면 p이다 → p와 q의 위치를 바꿉니다. → '${rev}'`
        : `대우(對偶): q가 아니면 p가 아니다 → p, q 모두 부정하고 위치도 바꿉니다. → '${contra}'`,
      `(참고: 대우는 원래 명제와 참/거짓이 항상 일치합니다. 역은 일치하지 않을 수 있습니다.)`,
      `따라서 정답은 '${correct}'입니다.`
    ]};
}

// 4-7. 필요조건/충분조건/필요충분조건  (기출 Q15·16: 2024-2 · 2025-1·2 · 2026-1)
// 실제 기출은 모두 '일차 조건 p 와 이차 조건 q 의 상수 a' 한 단계짜리다 :
//   충분  p: x−2=0, q: x²−a=0 (2024-2)       → a=c²
//   필요  p: x−3=0, q: x²−ax−3=0 (2025-1)    → a=c−1
//   충분조건·필요충분  p: x=7, q: (x−a)²=0 (2026-1) → a=c
// (예전의 '두 근 중 양수 a' · 'a 의 최솟값' 꼴은 기출보다 어려워 뺐다)
function gen_nec_suff(){
  const t=pick([1,2,3]);
  const mk=(correct,wr)=>{const set=[...new Set(wr.filter(w=>w!==correct&&w>0))];for(let d=1;set.length<3;d++){if(!set.includes(correct+d))set.push(correct+d);}
    return makeChoices(String(correct),set.slice(0,3).map(String));};
  if(t===1){
    const c=pick([2,3,4,5,6]),a=c*c,sw=Math.random()<0.5;
    const{choices,answer}=mk(a,[c,2*c,a+1,a-1,c+2]);
    return{topic:'충분조건',q:`두 조건 'p: x−${c}=0', 'q: x²−a=0'에 대하여 ${sw?'q가 p이기 위한 필요조건이':'p가 q이기 위한 충분조건이'} 되도록 하는 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
      sol:[
        `p가 q이기 위한 충분조건이면 'p이면 q이다'가 참입니다. 즉 p의 해가 q의 해이기도 해야 합니다.`,
        `p: x−${c}=0 의 해는 x=${c} 입니다.`,
        `x=${c}를 q: x²−a=0 에 넣으면 ${c*c}−a=0 이므로 a=${a}`,
        `따라서 a=${a}입니다.`
      ]};
  }
  if(t===2){
    const c=pick([2,3,4,5,6]),a=c-1,sw=Math.random()<0.5;
    const{choices,answer}=mk(a,[c,c+1,a+2,2*c,c-2]);
    return{topic:'필요조건',q:`두 조건 'p: x−${c}=0', 'q: x²−ax−${c}=0'에 대하여 ${sw?'p가 q이기 위한 충분조건이':'q가 p이기 위한 필요조건이'} 되도록 하는 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
      sol:[
        `q가 p이기 위한 필요조건이면 'p이면 q이다'가 참입니다. 즉 p의 해 x=${c}가 q의 해이기도 해야 합니다.`,
        `x=${c}를 q: x²−ax−${c}=0 에 넣으면 ${c*c}−${c}a−${c}=0`,
        `${c}a=${c*c-c} 이므로 a=${a}`,
        `따라서 a=${a}입니다.`
      ]};
  }
  const c=pick([3,4,5,6,7,8,9]),a=c,sw=Math.random()<0.5;
  const{choices,answer}=mk(a,[c-1,c+1,c+2,2*c,c-2]);
  return{topic:'필요충분조건',q:`두 조건 p, q는 p: x=${c}, q: (x−a)²=0 이다. ${sw?'q는 p':'p는 q'}이기 위한 필요충분조건이 되도록 하는 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `필요충분조건이면 두 조건의 해가 정확히 같아야 합니다.`,
      `q: (x−a)²=0 의 해는 x=a 하나뿐입니다. p의 해는 x=${c} 입니다.`,
      `두 해가 같으려면 a=${a}`,
      `따라서 a=${a}입니다.`
    ]};
}

// 4-8. 합성함수 (g∘f)(a)  (기출 Q17 패턴A)
function gen_composite_func(){
  const xBase=randInt(1,3);
  const X=[xBase,xBase+1,xBase+2];
  const yOffset=randInt(1,4);
  const Y=shuffle([xBase+yOffset,xBase+yOffset+1,xBase+yOffset+2,xBase+yOffset+3]).slice(0,3).sort((a,b)=>a-b);
  const zOffset=randInt(2,5);
  const Z=Y.map((y,i)=>y+zOffset+i);
  const fPerm=shuffle([0,1,2]),gPerm=shuffle([0,1,2]);
  const f=X.map((x,i)=>[x,Y[fPerm[i]]]);
  const g=Y.map((y,i)=>[y,Z[gPerm[i]]]);
  const inp=pick(X);
  const fx=f.find(([x])=>x===inp)[1];
  const gfx=g.find(([y])=>y===fx)[1];
  const fStr=f.map(([x,y])=>`${x}→${y}`).join(', ');
  const gStr=g.map(([y,z])=>`${y}→${z}`).join(', ');
  const{choices,answer}=makeChoices(String(gfx),[gfx+1,gfx-1,gfx+2,fx].filter(w=>w!==gfx).slice(0,3).map(String));
  return{topic:'합성함수',q:`그림과 같이 두 함수 f: X→Y, g: Y→Z가 있을 때, (g∘f)(${inp})의 값은?`,choices,answer,
    graph:{type:'composite_map',X,Y,Z,f_map:f,g_map:g,inp,fx,gfx},
    meta:{category:'func',type:'집합과 함수',diff:'기초'},
    sol:[
      `(g∘f)(${inp})는 f를 먼저 적용한 뒤, 그 결과에 g를 적용합니다.`,
      `1단계 — f(${inp}): 그림에서 X의 ${inp}이 Y의 어디로 가는지 화살표를 따라갑니다. ${inp}→${fx}이므로 f(${inp})=${fx}`,
      `2단계 — g(${fx}): Y의 ${fx}이 Z의 어디로 가는지 화살표를 따라갑니다. ${fx}→${gfx}이므로 g(${fx})=${gfx}`,
      `따라서 (g∘f)(${inp}) = g(f(${inp})) = g(${fx}) = ${gfx}입니다.`
    ]};
}

// 4-9. 역함수 f⁻¹(a) — 화살표 그림형만  (기출 Q17 패턴B)
// ※ 2023년 2회, 2025년 1·2회, 2026년 1회 기출: 항상 그림(다이어그램)형으로 출제
function gen_inverse_func(){
  const domStart=randInt(1,3);
  const X=[domStart,domStart+1,domStart+2,domStart+3];
  const slope=pick([2,3]),intercept=pick([-1,0,1,2]);
  const f=X.map(x=>[x,slope*x+intercept]);
  const[xV,fxV]=pick(f);
  const Yvals=f.map(([,y])=>y);
  const{choices,answer}=makeChoices(String(xV),[xV+1,xV-1<domStart?xV+2:xV-1,fxV].filter(w=>w!==xV&&w>0).slice(0,3).map(String));
  return{
    topic:'역함수',
    q:`함수 f : X → Y가 그림과 같을 때, f⁻¹(${fxV})의 값은? (단, f⁻¹는 f의 역함수)`,
    choices,answer,
    meta:{category:'func',type:'집합과 함수',diff:'기초'},
    graph:{type:'inverse_map',X,Y:Yvals,f_map:f,ask_y:fxV,ans_x:xV},
    sol:[
      `f⁻¹(${fxV})은 'f를 거치면 ${fxV}가 되는 x'를 거꾸로 찾으라는 뜻입니다.`,
      `즉, f(x)=${fxV}가 되는 x를 그림에서 찾습니다. 화살표가 ${fxV}로 도착하는 출발점을 봅니다.`,
      `${xV} → ${fxV}이므로 f(${xV})=${fxV}입니다.`,
      `따라서 f⁻¹(${fxV})=${xV}입니다.`
    ]
  };
}

// 4-10. 유리함수 점근선 → 상수  (기출 Q18 패턴A: 2021-2, 2022-2, 2023-1, 2026-1)
function gen_rational_asymptote(){
  const p=pick([2,3,4,-2,-3]),q=pick([2,3,4,-1,-2]);
  const k=pick([1,2,-1]);
  const t=pick([1,2,3]);
  const pn=v=>v<0?`(${v})`:`${v}`;
  if(t===1){
    // y=k/(x-a)+b 형태, 점근선 x=a, y=b → a+b 또는 a-b
    const op=pick(['a+b','a-b']);
    const ans=op==='a+b'?p+q:p-q;
    const kStr=k<0?'−':'';const kAbs=Math.abs(k);
    const pStr=p>0?`x−${p}`:`x+${-p}`;
    const qStr=q>=0?`+${q}`:String(q);
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2,p,q].filter(w=>w!==ans).slice(0,3).map(String));
    return{topic:'유리함수 점근선',q:`유리함수 y=${kStr}${kAbs}/(${pStr})${qStr}의 그래프의 점근선이 x=a, y=b일 때, ${op}의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'rational',k,p,q},
      sol:[
        `세로 점근선 x=a는 분모를 0으로 만드는 x값, 가로 점근선 y=b는 맨 끝 상수항입니다.`,
        `이 함수의 점근선은 x=${p}, y=${q}이므로 a=${p}, b=${q}입니다.`,
        `${op}=${op==='a+b'?`${p}+${pn(q)}`:`${p}−${pn(q)}`}=${ans}입니다.`
      ]};
  }
  if(t===2){
    // y=1/(x-a)+b가 y=1/x 이동 → a 구하기
    const aV=pick([2,3,4,-2,-3]),bV=pick([3,4,-1,-2]);
    const ans=aV;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,bV].filter(w=>w!==ans).slice(0,3).map(String));
    const pStr=aV>0?`x−${aV}`:`x+${-aV}`;
    const bStr=bV>=0?`+${bV}`:String(bV);
    return{topic:'유리함수 점근선',q:`유리함수 y=1/(${pStr})${bStr}의 그래프의 점근선이 x=${aV}, y=${bV}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'rational',k:1,p:aV,q:bV},
      sol:[
        `세로 점근선 x=a는 분모(x−a)를 0으로 만드는 x값입니다.`,
        `분모가 ${pStr}이므로 ${pStr}=0, 즉 x=${aV}에서 점근선이 생깁니다.`,
        `따라서 a=${aV}입니다.`
      ]};
  }
  // y=k/(x-a)+b가 y=k/x 이동 → a+b
  const aV=pick([1,2,3,-1,-2]),bV=pick([2,3,4,-1,-2]);
  const ans=aV+bV;
  const kStr=String(Math.abs(k));                 // 분자 (예전에는 '2'+'1/' 가 붙어 21/(x−3) 으로 찍혔다)
  const sign=k<0?'−':'';
  const pStr=aV>0?`x−${aV}`:`x+${-aV}`;
  const bStr=bV>=0?`+${bV}`:String(bV);
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
  return{topic:'유리함수 평행이동',q:`유리함수 y=${sign}${kStr}/(${pStr})${bStr}의 그래프는 y=${sign}${kStr}/x의 그래프를 x축 방향으로 a만큼, y축 방향으로 b만큼 평행이동한 것이다. 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
    graph:{type:'rational',k,p:aV,q:bV},
    sol:[
      `y=k/x를 x축으로 a만큼, y축으로 b만큼 옮기면 분모는 (x−a), 끝에 +b가 붙어 y=k/(x−a)+b가 됩니다.`,
      `주어진 식 y=${sign}${kStr}/(${pStr})${bStr}와 비교하면 a=${aV}, b=${bV}입니다.`,
      `a+b=${aV}+${pn(bV)}=${ans}입니다.`
    ]};
}

// 4-11. 무리함수 평행이동 a+b  (기출 Q18 패턴B: 2021-1, 2022-1, 2023-2, 2024-2, 2025-2)
function gen_radical_translate(){
  const a=pick([1,2,3,4]),b=pick([1,2,3,4,-1,-2]);
  const t=pick([1,2,3]);
  const pn=v=>v<0?`(${v})`:`${v}`;
  if(t===1){
    // y=√(x-a)+b는 y=√x를 x방향 a, y방향 b 이동 → a+b
    const ans=a+b;
    const bStr=b>=0?`+${b}`:String(b);
    const ws=[ans+1,ans-1,a,b,a-b].filter(w=>w!==ans).slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(ans),ws);
    return{topic:'무리함수 평행이동',q:`무리함수 y=√(x−${a})${bStr}의 그래프는 y=√x의 그래프를 x축의 방향으로 a만큼, y축의 방향으로 b만큼 평행이동한 것이다. a+b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'radical',a:1,p:a,q:b},
      sol:[
        `y=√x를 x축으로 a만큼, y축으로 b만큼 옮기면 y=√(x−a)+b가 됩니다.`,
        `주어진 식 y=√(x−${a})${bStr}와 비교하면 a=${a}, b=${b}입니다.`,
        `a+b=${a}+${pn(b)}=${ans}입니다.`
      ]};
  }
  if(t===2){
    // a-b 묻기
    const ans2=a-b;
    const bStr2=b>=0?`+${b}`:String(b);
    const{choices,answer}=makeChoices(String(ans2),[ans2+1,ans2-1,ans2+2].filter(w=>w!==ans2).map(String));
    return{topic:'무리함수 평행이동',q:`무리함수 y=√(x−${a})${bStr2}의 그래프는 y=√x의 그래프를 x축의 방향으로 a만큼, y축의 방향으로 b만큼 평행이동한 것이다. 두 상수 a, b에 대하여 a−b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'radical',a:1,p:a,q:b},
      sol:[
        `y=√(x−a)+b 꼴과 비교하면 a는 x방향 이동, b는 y방향 이동입니다.`,
        `주어진 식에서 a=${a}, b=${b}입니다.`,
        `a−b=${a}−${pn(b)}=${ans2}입니다.`
      ]};
  }
  // 상수 a의 값 직접 묻기 (시작점)
  const bStr3=b>=0?`+${b}`:String(b);
  const{choices,answer}=makeChoices(String(a),[a+1,a-1<0?a+2:a-1,a+2].filter(w=>w!==a).map(String));
  return{topic:'무리함수 상수',q:`무리함수 y=√(x−a)${bStr3}의 그래프의 시작점이 (${a}, ${b})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
    graph:{type:'radical',a:1,p:a,q:b},
    sol:[
      `무리함수 y=√(x−a)+b의 그래프는 점 (a, b)에서 시작합니다.`,
      `시작점이 (${a}, ${b})이므로 x좌표 a=${a}입니다.`,
      `따라서 상수 a=${a}입니다.`
    ]};
}

// 집합·함수 디스패처 (11개 유형)
function genMockSetFunc(){
  const gens=[[gen_set_elements,5],[gen_set_count,5],[gen_set_union_inter_sum,3],
    [gen_set_equal_const,2],[gen_truth_set,2],[gen_proposition,5],[gen_nec_suff,1],
    [gen_composite_func,4],[gen_inverse_func,5],
    [gen_rational_asymptote,5],[gen_radical_translate,5]];
  return weightedGen(gens.map(([f,w])=>[()=>{try{return f();}catch(e){return gen_set_count();}},w]));
}
// 문제풀이 탭 전용 문항 생성 진입점. MockExamTab/영역 quota/모의고사 상태를 거치지 않는다.
function genPracticeGEDUnitQuestion(unitId,topic){
  const unit=typeof GED_UNITS!=='undefined'&&GED_UNITS.find(u=>u.id===unitId);
  if(!unit)throw new Error(`검정고시 ${topic} 문항 생성기(${unitId})를 찾을 수 없습니다.`);
  for(let i=0;i<30;i++){
    const params=unit.rand(),q=unit.build(params);
    if(!q||q.err||!q.q||!Array.isArray(q.choices)||q.choices.length!==4||!Number.isInteger(q.ans))continue;
    return{...q,topic:params.kind||topic,answer:q.ans,practiceMarkup:true,meta:{category:'set',type:'집합과 명제',diff:'기초'}};
  }
  throw new Error(`검정고시 ${topic} 문항을 만들지 못했습니다.`);
}
function genPracticeSetQuestion(){return genPracticeGEDUnitQuestion('u15','집합');}
function genPracticePropositionQuestion(){return genPracticeGEDUnitQuestion('u16','명제');}
