// === js/generators/high/equation.js ===
/* --------------------------------------------------------------------
   고졸 ② 방정식과 부등식
   이차방정식 · 근과 계수 · 삼·사차방정식 · 최대최소 · 연립 · 부등식
   -------------------------------------------------------------------- */

// 2-3. 이차방정식 중근  (기출 Q5/Q6 패턴)
function gen_quad_double_root(){
  // x²+ax+b=0이 중근 → D=a²−4b=0 → b=a²/4 → a를 짝수로
  const a0=pick([2,4,6,-2,-4,-6]);
  const b0=a0**2/4;
  const ans=Math.abs(a0); // 보통 양수 물음
  const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2<0?ans+4:ans-2,ans+4].filter(w=>w!==ans).slice(0,3).map(String));
  const aS=a0>=0?`+${a0}x`:`${a0}x`;
  return{topic:'이차방정식 중근',q:`이차방정식 x²${aS}+${b0}=0이 중근을 가질 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `중근: 이차방정식의 두 근이 같은 경우. 판별식 D = a²−4b = 0 이 조건입니다.`,
      `이 식에서 a=${a0}, b=${b0}이므로 D = ${a0}²−4×${b0} = ${a0*a0}−${4*b0} = 0. ✓`,
      `검산: x²${aS}+${b0} = (x+${a0/2})² = 0 → x = ${-a0/2} (중근)`,
      `문제에서 a의 값(양수)을 묻고 있으므로 |${a0}| = ${ans}입니다.`
    ]};
}

// 2-4. 근과 계수 — 비에타  (기출 Q6)
function gen_quad_vieta(){
  const p=randInt(2,8),q=randInt(-6,7);
  const askSum=Math.random()<0.5;
  const ans=askSum?-p:q; // x²+px+q=0 → α+β=−p, αβ=q
  const label=askSum?'α+β':'αβ';
  const ps=p>=0?`+${p}x`:p<0?`${p}x`:''
  const qs=q>=0?`+${q}`:String(q);
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2,ans-2].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'이차방정식 근과 계수',q:`이차방정식 x²${ps}${qs}=0의 두 근을 α, β라고 할 때, ${label}의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `근과 계수의 관계(비에타 공식): x²+px+q=0의 두 근 α, β에 대해`,
      `α+β = −(x의 계수) = −${p} = ${-p}`,
      `αβ = 상수 항 = ${q}`,
      askSum
        ? `문제에서 α+β를 묻고 있으므로 정답은 ${-p}입니다.`
        : `문제에서 αβ를 묻고 있으므로 정답은 ${q}입니다.`
    ]};
}

// 2-5. 두 수를 근으로 하는 이차방정식  (기출 Q6/Q7)
function gen_from_roots(){
  const r1=randInt(1,5),r2=randInt(1,5);
  const r2v=r1===r2?r2+1:r2;
  const sum=r1+r2v, prod=r1*r2v;
  const ask=pick(['sum','prod']);
  const ans=ask==='sum'?sum:prod;
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1<0?ans+2:ans-1,ask==='sum'?prod:sum].filter(w=>w!==ans).slice(0,3).map(String));
  if(ask==='sum'){
    return{topic:'두 근→이차방정식',q:`두 수 ${r1}, ${r2v}를 근으로 하고 x²의 계수가 1인 이차방정식이 x²−ax+${prod}=0일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
      sol:[
        `두 근이 ${r1}, ${r2v}인 이차방정식 → (x−${r1})(x−${r2v})=0으로 씁니다.`,
        `전개: x²−(${r1}+${r2v})x+${r1}×${r2v} = x²−${sum}x+${prod} = 0`,
        `x의 계수는 −${sum}이므로 방정식의 형태 x²−ax+... 에서 a = ${sum}입니다.`,
        `따라서 a = ${ans}입니다.`
      ]};
  }
  return{topic:'두 근→이차방정식',q:`두 수 ${r1}, ${r2v}를 근으로 하고 x²의 계수가 1인 이차방정식이 x²−${sum}x+a=0일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `두 근이 ${r1}, ${r2v}인 이차방정식 → (x−${r1})(x−${r2v})=0으로 씁니다.`,
      `전개: x²−(${r1}+${r2v})x+${r1}×${r2v} = x²−${sum}x+${prod} = 0`,
      `상수 항이 ${prod}이므로 방정식의 형태 x²−...x+a에서 a = ${prod}입니다.`,
      `따라서 a = ${ans}입니다.`
    ]};
}

// 2-6. 삼·사차방정식 한 근 대입 → a  (기출 Q8)
function gen_cubic_quartic_root(){
  const deg=pick([3,4]);
  const root=pick([1,2,-1,-2]);
  if(deg===3){
    // x³+px²+qx+a=0, 한 근이 root → a=−(root³+p·root²+q·root)
    const p=randInt(-2,3),q=randInt(-3,3);
    const a=-(root**3+p*root**2+q*root);
    if(Math.abs(a)>15) return gen_cubic_quartic_root();
    const ps2=p>=0?`+${p}x²`:`${p}x²`, qs2=q>=0?`+${q}x`:`${q}x`;
    const pn=v=>v<0?`(${v})`:String(v);
    const r2=root**2,r3=root**3;
    const{choices,answer}=makeChoices(String(a),[a+2,a-2,a+4,a-4].filter(w=>w!==a).slice(0,3).map(String));
    return{topic:'삼차방정식 한 근',q:`삼차방정식 x³${ps2}${qs2}+a=0의 한 근이 ${root}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
      sol:[
        `한 근이 ${root}이므로 x=${root}을 방정식에 대입하면 등식이 성립합니다.`,
        `${root}³ + ${p}×${pn(root)}² + ${q}×${pn(root)} + a = 0`,
        `${r3} + ${p*r2} + ${q*root} + a = 0`,
        `${r3+p*r2+q*root} + a = 0 → a = ${a}`,
        `따라서 a = ${a}입니다.`
      ]};
  }
  // 사차: x⁴+px²+a=0 (짝수차수로 단순화)
  const p2=randInt(-4,4);
  const a=-(root**4+p2*root**2);
  if(Math.abs(a)>20) return gen_cubic_quartic_root();
  const p2s=p2>=0?`+${p2}x²`:`${p2}x²`;
  const pn=v=>v<0?`(${v})`:String(v);
  const r2=root**2,r4=root**4;
  const{choices,answer}=makeChoices(String(a),[a+2,a-2,a+4].filter(w=>w!==a).slice(0,3).map(String));
  return{topic:'사차방정식 한 근',q:`사차방정식 x⁴${p2s}+a=0의 한 근이 ${root}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `한 근이 ${root}이므로 x=${root}을 방정식에 대입하면 등식이 성립합니다.`,
      `${root}⁴ + ${p2}×${pn(root)}² + a = 0`,
      `${r4} + ${p2*r2} + a = 0`,
      `${r4+p2*r2} + a = 0 → a = ${a}`,
      `따라서 a = ${a}입니다.`
    ]};
}

// 2-7. 이차함수 구간 최댓/최솟값  (기출 Q7)
function gen_quad_extremum(){
  const p=pick([0,1,-1,2]),q0=randInt(-3,5),a0=pick([-1,1]);
  const lo=pick([-2,-1,0]),hi=lo+pick([2,3,4]);
  const loV=a0*(lo-p)**2+q0,hiV=a0*(hi-p)**2+q0;
  const pIn=p>=lo&&p<=hi;
  const allVals=pIn?[q0,loV,hiV]:[loV,hiV];
  if(allVals.some(v=>v<-10||v>10))return gen_quad_extremum();
  const extreme=a0>0?Math.min(...allVals):Math.max(...allVals);
  const typeStr=a0>0?'최솟값':'최댓값';
  const aStr=a0===1?'':a0===-1?'−':'';
  const fStr=p===0?`y=${aStr}x²${q0===0?'':q0>0?`+${q0}`:String(q0)}`:`y=${aStr}(x${p>0?`−${p}`:`+${-p}`})²${q0===0?'':q0>0?`+${q0}`:String(q0)}`;
  const{choices,answer}=makeChoices(String(extreme),[extreme+1,extreme-1,extreme+2,extreme-2].filter(w=>w!==extreme).slice(0,3).map(String));
  const vertexDesc=pIn?`꼭짓점 x=${p}가 구간 안에 있으므로 꼭짓점의 y값 = ${q0}도 고려합니다.`:`꼭짓점 x=${p}가 구간 밖에 있으므로 구간 끝점만 비교합니다.`;
  return{topic:'이차함수 최댓/최솟값',q:`${lo}≤x≤${hi}일 때, 이차함수 ${fStr}의 ${typeStr}은?`,choices,answer,graph:{type:'quadratic',a:a0,p,q:q0,ds:lo,de:hi},meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `이 이차함수는 a=${a0}${a0>0?'(아래로 볼록, ∪형)':'(위로 볼록, ∩형)'}이고 꼭짓점은 x=${p}, y=${q0}입니다.`,
      vertexDesc,
      `x=${lo}일 때 y=${loV},  x=${hi}일 때 y=${hiV}${pIn?`,  x=${p}(꼭짓점)일 때 y=${q0}`:''}`,
      `이 중 ${typeStr}은 ${extreme}입니다.`
    ]};
}

// 2-8. 연립방정식 해 → 상수  (기출 Q9)
function gen_system_eq(){
  const s=randInt(3,8);
  const xV=randInt(1,s-1),yV=s-xV;
  const t=pick([1,2]);
  if(t===1){ // {x+y=s, xy=a}, 해 x=xV, y=b
    const aVal=xV*yV,bVal=yV,ans=aVal+bVal;
    const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2,ans+4].filter(w=>w!==ans).map(String));
    return{topic:'연립방정식',q:`연립방정식의 해가 x=${xV}, y=b일 때, 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,
      graph:{type:'system_eq',eqs:[`x + y = ${s}`,`xy = a`]},
      meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
      sol:[
        `해가 x=${xV}, y=b이므로 먼저 y값을 구합니다.`,
        `첫 번째 식 x+y=${s}에 x=${xV}를 넣으면: ${xV}+y=${s} → y=${yV}이므로 b=${yV}`,
        `두 번째 식 xy=a에 x=${xV}, y=${yV}를 넣으면: a=${xV}×${yV}=${aVal}`,
        `a+b = ${aVal}+${yV} = ${ans}입니다.`
      ]};
  }
  // {x+y=s, x²−y²=a}
  const aVal=xV**2-yV**2,bVal=yV,ans=aVal+bVal;
  const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2,ans+4,ans-4].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'연립방정식',q:`연립방정식의 해가 x=${xV}, y=b일 때, 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,
    graph:{type:'system_eq',eqs:[`x + y = ${s}`,`x² − y² = a`]},
    meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `해가 x=${xV}, y=b이므로 먼저 y값을 구합니다.`,
      `첫 번째 식 x+y=${s}에 x=${xV}를 넣으면: ${xV}+y=${s} → y=${yV}이므로 b=${yV}`,
      `두 번째 식 x²−y²=a에 x=${xV}, y=${yV}를 넣으면: a=${xV}²−${yV}²=${xV**2}−${yV**2}=${aVal}`,
      `a+b = ${aVal}+(${yV}) = ${ans}입니다.`
    ]};
}

// 2-9. 이차부등식 해 범위  (기출 Q10 패턴A)
function gen_quad_ineq(){
  const r1=randInt(-3,1),r2=r1+randInt(2,5);
  const op=pick(['≤0','≥0']);
  const lhs=`(x${r1>=0?`−${r1}`:`+${-r1}`})(x${r2>=0?`−${r2}`:`+${-r2}`})`;
  const corrLE=`${r1}≤x≤${r2}`;
  const corrGE=`x≤${r1} 또는 x≥${r2}`;
  const correct=op==='≤0'?corrLE:corrGE;
  const wrong1=op==='≤0'?corrGE:corrLE;
  const wrong2=`${r1+1}≤x≤${r2}`;
  const wrong3=`x≤${r1} 또는 x≥${r2+1}`;
  const{choices,answer}=makeChoices(correct,[wrong1,wrong2,wrong3].filter(w=>w!==correct));
  return{topic:'이차부등식',q:`이차부등식 ${lhs}${op}의 해는?`,choices,answer,meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `${lhs}=0의 두 근을 구합니다: x=${r1} 또는 x=${r2}`,
      `이 두 근이 부등식의 경계점이 됩니다.`,
      op==='≤0'
        ? `${lhs}≤0 → 두 근 사이에서 0 이하가 됩니다. (∩ 모양 포물선의 아랫부분)`
        : `${lhs}≥0 → 두 근 바깥쪽에서 0 이상이 됩니다. (∩ 모양 포물선의 위쪽)`,
      `따라서 해는 ${correct}입니다.`
    ]};
}

// 2-10. 연립부등식 해 → 상수  (기출 Q9)
function gen_system_ineq(){
  let lo,hi,a1,b1,c2,d2,e2,att=0;
  do{
    lo=randInt(1,4); hi=lo+randInt(2,5);
    a1=randInt(2,4); b1=a1*lo;
    const diff=pick([1,2,3]); c2=diff+pick([1,2]); d2=c2-diff; e2=hi*diff;
    if(e2>0&&b1>0)break; att++;
  }while(att<20);
  if(att>=20){lo=2;hi=6;a1=3;b1=6;c2=3;d2=1;e2=12;}
  const e2s=e2>0?`+${e2}`:String(e2);
  const diff2=c2-d2;
  const{choices,answer}=makeChoices(String(hi),[hi+1,hi+2,hi-1].filter(w=>w!==hi&&w>lo).map(String));
  return{topic:'연립부등식',q:`연립부등식의 해가 ${lo}<x<a일 때, 상수 a의 값은?`,choices,answer,
    graph:{type:'system_eq',eqs:[`${a1}x > ${b1}`,`${c2}x < ${d2}x${e2s}`]},meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `각 부등식을 따로 풀고 나서 공통 범위를 구합니다.`,
      `① ${a1}x > ${b1} → x > ${b1}÷${a1} = ${lo}`,
      `② ${c2}x < ${d2}x${e2s} → ${c2}x−${d2}x < ${e2} → ${diff2}x < ${e2} → x < ${e2}÷${diff2} = ${hi}`,
      `공통 범위: ${lo} < x < ${hi}`,
      `해가 ${lo}<x<a이므로 a = ${hi}입니다.`
    ]};
}

// 2-11. 절댓값 부등식 수직선 → a  (기출 Q10 패턴B)
function gen_abs_ineq(){
  const t=pick([1,2]);
  if(t===1){ // |x−c|≤r → c−r ≤ x ≤ c+r, 수직선에서 왼쪽 끝 a를 구함
    const c=randInt(-1,3),r=randInt(1,4);
    const lo=c-r,hi=c+r;
    const cStr=c===0?'|x|':c>0?`|x−${c}|`:`|x+${-c}|`;
    const cStr2=c===0?'x':c>0?`x−${c}`:`x+${-c}`;
    const{choices,answer}=makeChoices(String(lo),[lo-1,lo+1,lo-2,hi].filter(w=>w!==lo).slice(0,3).map(String));
    return{topic:'절댓값 부등식',q:`부등식 ${cStr}≤${r}의 해를 수직선 위에 나타내면 그림과 같다. 상수 a의 값은?`,choices,answer,
      graph:{type:'abs_numline',lo,hi,ge:false},meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'},
      sol:[
        `절댓값 부등식 |f(x)|≤r은 −r ≤ f(x) ≤ r으로 바꿉니다.`,
        `${cStr} ≤ ${r} → −${r} ≤ ${cStr2} ≤ ${r}`,
        c===0?`−${r} ≤ x ≤ ${r}`:`각 변에 ${c}를 더하면: ${lo} ≤ x ≤ ${hi}`,
        `수직선에서 왼쪽 끝이 a이므로 a = ${lo}입니다.`
      ]};
  }
  // |x−c|≥r → x≤c−r 또는 x≥c+r, 수직선에서 왼쪽 경계 a를 구함
  const c=randInt(0,2),r=randInt(2,4);
  const lo=c-r,hi=c+r;
  const cStr=c===0?'|x|':c>0?`|x−${c}|`:`|x+${-c}|`;
  const cStr2=c===0?'x':c>0?`x−${c}`:`x+${-c}`;
  const{choices,answer}=makeChoices(String(lo),[lo-1,lo+1,hi,lo-2].filter(w=>w!==lo).slice(0,3).map(String));
  return{topic:'절댓값 부등식',q:`부등식 ${cStr}≥${r}의 해를 수직선 위에 나타내면 그림과 같다. 상수 a의 값은?`,choices,answer,
    graph:{type:'abs_numline',lo,hi,ge:true},meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `절댓값 부등식 |f(x)|≥r은 f(x)≤−r 또는 f(x)≥r으로 바꿉니다.`,
      `${cStr} ≥ ${r} → ${cStr2} ≤ −${r} 또는 ${cStr2} ≥ ${r}`,
      c===0?`x ≤ −${r} 또는 x ≥ ${r}`:`각 변에 ${c}를 더하면: x ≤ ${lo} 또는 x ≥ ${hi}`,
      `수직선에서 왼쪽 경계가 a이므로 a = ${lo}입니다.`
    ]};
}

// 방정식·부등식 디스패처
function genMockEqInequal(){
  return weightedGen([[gen_complex_calc,3],[gen_complex_conjugate,4],[gen_quad_double_root,1],
    [gen_quad_vieta,5],[gen_from_roots,3],[gen_cubic_quartic_root,4],
    [gen_quad_extremum,5],[gen_system_eq,4],[gen_quad_ineq,3],
    [gen_system_ineq,4],[gen_abs_ineq,4]]);
}
