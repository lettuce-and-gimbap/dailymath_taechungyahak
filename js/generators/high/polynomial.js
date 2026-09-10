// === js/generators/high/polynomial.js ===
/* --------------------------------------------------------------------
   고졸 ① 다항식과 복소수
   사칙연산 · 항등식 · 나머지정리 · 조립제법 · 인수분해 · 켤레복소수
   -------------------------------------------------------------------- */

/* ════════════════════════════════════════════════
   ① 다항식 영역 (6개 세부유형)
   ════════════════════════════════════════════════ */

// 1-1. 다항식 사칙연산 A±B  (기출 Q1)
function gen_poly_arith(){
  const op=pick(['+','-']);
  const [a1,b1,c1]=[randInt(1,3),randInt(-2,3),randInt(-2,3)];
  const [a2,b2,c2]=[randInt(1,3),randInt(-2,3),randInt(-2,3)];
  const [ra,rb,rc]=op==='+'?[a1+a2,b1+b2,c1+c2]:[a1-a2,b1-b2,c1-c2];
  const correct=_p2(ra,rb,rc);
  const w=[_p2(ra+1,rb,rc),_p2(ra,rb+1,rc),_p2(ra,rb,rc-1)].filter(x=>x!==correct);
  const{choices,answer}=makeChoices(correct,w);
  const pm=v=>v>=0?`+${v}`:String(v);
  return{topic:'다항식 사칙연산',q:`두 다항식 A=${_p2(a1,b1,c1)}, B=${_p2(a2,b2,c2)}에 대하여 A${op}B는?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
    sol:[
      `다항식은 같은 차수(x², x, 상수)끼리만 ${op==='+'?'더할':'뺄'} 수 있습니다.`,
      `x² 항: ${a1}${op}${a2} = ${ra}`,
      `x 항: (${b1})${op}(${b2}) = ${rb}`,
      `상수 항: (${c1})${op}(${c2}) = ${rc}`,
      `따라서 A${op}B = ${correct}입니다.`
    ]};
}

// 1-2. 항등식 — 계수 비교  (기출 Q2)
function gen_poly_identity(){
  const A=randInt(2,7),B=randInt(-5,5);
  const ans=A+B;
  const Bs=B>=0?`+${B}`:String(B);
  const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2,ans+4,ans-4].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'항등식',q:`등식 x²+ax${Bs}=x²+${A}x+b가 x에 대한 항등식일 때, 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
    sol:[
      `항등식: x에 어떤 값을 넣어도 항상 성립하려면 양변의 같은 차수 계수가 반드시 일치해야 합니다.`,
      `x² 계수 비교: 양변 모두 1 → 자동 만족.`,
      `x 계수 비교: 왼쪽 a = 오른쪽 ${A} → a = ${A}`,
      `상수 항 비교: 왼쪽 ${B} = 오른쪽 b → b = ${B}`,
      `따라서 a+b = ${A}+(${B}) = ${ans}입니다.`
    ]};
}

// 1-3. 나머지 정리  (기출 Q3 패턴A)
function gen_poly_remainder(){
  const a=randInt(1,4),b=randInt(-4,4),c=randInt(-5,5);
  const r=pick([1,2,-1,-2]);
  const rem=a*r*r+b*r+c;
  const bs=b>=0?`+${b}x`:`${b}x`,cs=c>=0?`+${c}`:String(c);
  const rs=r>0?`x−${r}`:`x+${-r}`;
  const pn=v=>v<0?`(${v})`:String(v);
  const{choices,answer}=makeChoices(String(rem),[rem+2,rem-2,rem+4,rem-4].filter(w=>w!==rem).slice(0,3).map(String));
  return{topic:'나머지 정리',q:`다항식 ${a}x²${bs}${cs}을 ${rs}로 나누었을 때, 나머지는?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
    sol:[
      `나머지 정리: f(x)를 ${rs}로 나눈 나머지는 f(${r})로 구합니다.`,
      `f(x) = ${a}x²${bs}${cs}에서 x = ${r}을 직접 대입합니다.`,
      `f(${r}) = ${a}×${pn(r)}² + ${pn(b)}×${pn(r)} + ${pn(c)}`,
      `= ${a*r*r} + ${b*r} + ${c} = ${rem}`,
      `따라서 나머지는 ${rem}입니다.`
    ]};
}

// 1-4. 나누어떨어지는 조건 f(r)=0 → a  (기출 Q3 패턴B)
function gen_poly_divisible(){
  let r,b,c,a,att=0;
  do{
    r=pick([1,2,-1,-2]); b=randInt(-3,3); c=randInt(-4,4);
    const num=-(r**3+b*r+c), den=r*r;
    if(den>0&&num%den===0){a=num/den;break;}
    att++;
  }while(att<30);
  if(att>=30){r=2;b=-3;c=0;a=-(8-6)/4;} // fallback
  if(!Number.isInteger(a)){return gen_poly_remainder();}
  const bs=b>=0?`+${b}x`:`${b}x`,cs=c>=0?`+${c}`:String(c);
  const aS=a>=0?`+${a}x²`:`${a}x²`;
  const rs=r>0?`x−${r}`:`x+${-r}`;
  const{choices,answer}=makeChoices(String(a),[a+1,a-1,a+2,a-2].filter(w=>w!==a).slice(0,3).map(String));
  const pn=v=>v<0?`(${v})`:String(v);
  const f_r=r**3+a*r**2+b*r+c;
  return{topic:'나누어떨어지는 조건',q:`다항식 x³${aS}${bs}${cs}가 ${rs}로 나누어떨어질 때, 상수 a의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
    sol:[
      `f(x)가 (x−r)로 나누어떨어지면 나머지정리에 의해 f(r)=0입니다.`,
      `여기서 나누는 식이 ${rs}이므로 x=${r}을 f(x)에 대입합니다.`,
      `f(${r}) = ${r}³ + a×${pn(r)}² + ${b}×${pn(r)} + ${c} = 0`,
      `${r**3} + ${r**2}a + ${b*r} + ${c} = 0 → ${r**2}a = ${-(r**3+b*r+c)} → a = ${a}`,
      `따라서 a = ${a}입니다.`
    ]};
}

// 1-5. 인수분해 x³±n³  (기출 Q4)
function gen_poly_factor(){
  const n=pick([2,3,4]);
  const sign=pick(['+','-']);
  const cube=n**3;
  if(sign==='-'){
    const{choices,answer}=makeChoices(String(n),[n+2,n*n,n>1?n-1:n+1].filter(w=>w!==n&&w>0).map(String));
    return{topic:'인수분해',q:`다항식 x³−${cube}을 인수분해한 식이 (x−a)(x²+${n}x+${n*n})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
      sol:[
        `세제곱 차 공식: x³−n³ = (x−n)(x²+nx+n²)`,
        `여기서 n=${n}이므로: x³−${cube} = (x−${n})(x²+${n}x+${n*n})`,
        `인수분해 된 식에서 (x−a)와 비교하면 a=${n}입니다.`
      ]};
  }
  // x³+n³=(x+n)(x²−nx+n²) → (x+n)(x²+ax+n²) → a=−n
  const ans=-n;
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,n,ans+2].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'인수분해',q:`다항식 x³+${cube}을 인수분해한 식이 (x+${n})(x²+ax+${n*n})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
    sol:[
      `세제곱 합 공식: x³+n³ = (x+n)(x²−nx+n²)`,
      `여기서 n=${n}이므로: x³+${cube} = (x+${n})(x²−${n}x+${n*n})`,
      `인수분해 된 식에서 (x²+ax+...)의 a 자리에 −${n}이 들어가므로 a=${ans}입니다.`
    ]};
}

// 1-6. 나머지 구하기 — 다양한 제수  (기출 Q3 패턴C)
function gen_poly_synthetic(){
  const a=pick([1,2,-1,3,-2]);
  const b=randInt(-3,3),c=randInt(-3,3),d=randInt(-4,4);
  const rem=a**3+b*a**2+c*a+d;
  const bS=b>=0?`+${b}x²`:`${b}x²`,cS=c>=0?`+${c}x`:`${c}x`,dS=d>=0?`+${d}`:String(d);
  const divStr=a>=0?`x−${a}`:`x+${-a}`;
  const wrongs=[rem+1,rem-1,rem+2,rem-2].filter(w=>w!==rem).slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(rem),wrongs);
  const bv=b*a**2, cv=c*a;
  return{topic:'나머지 정리',q:`다항식 x³${bS}${cS}${dS}을 ${divStr}로 나누었을 때의 나머지는?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},
    sol:[
      `나머지 정리: f(x)를 x−a로 나눈 나머지 = f(a)`,
      `f(x)=x³${bS}${cS}${dS}이므로 f(${a})를 구합니다.`,
      `f(${a})=${a}³+${b}×${a}²+${c}×${a}+${d}=${a**3}+${bv}+${cv}+${d}=${rem}`,
      `따라서 나머지는 ${rem}입니다.`
    ]};
}

// 다항식 영역 디스패처
function genMockPoly(){
  return weightedGen([[gen_poly_arith,4],[gen_poly_identity,4],[gen_poly_remainder,7],
    [gen_poly_factor,4],[gen_poly_synthetic,5]]);
}

function gen_complex_calc(){
  const t=pick([1,3]);
  if(t===1){ // (x−a)+yi=p+qi 꼴 → x,y 값
    const a=randInt(1,4),y0=randInt(1,5),p=randInt(1,5),q=randInt(1,5);
    const x0=p+a;
    const ask=pick(['x','y','x+y']);
    const ans=ask==='x'?x0:ask==='y'?q:x0+q;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
    return{topic:'복소수',q:`등식 (x−${a})+${y0}i=${p}+${q}i를 만족하는 실수 x, y의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
      sol:[
        `복소수 등식: 실수부끼리, 허수부끼리 같아야 합니다.`,
        `실수부: x−${a} = ${p} → x = ${p}+${a} = ${x0}`,
        `허수부: ${y0} = ${q} (이미 주어진 조건으로 y=${q})`,
        ask==='x'?`문제에서 x를 묻고 있으므로 정답은 ${x0}입니다.`:ask==='y'?`문제에서 y를 묻고 있으므로 정답은 ${q}입니다.`:`x+y = ${x0}+${q} = ${ans}입니다.`
      ]};
  }
  // 복소수 z=a+2i, z+z̄=b → 2a=b → a
  const realPart=randInt(1,5);
  const sum=2*realPart;
  const{choices,answer}=makeChoices(String(realPart),[realPart+1,realPart-1<0?realPart+2:realPart-1,sum].filter(w=>w!==realPart).slice(0,3).map(String));
  return{topic:'켤레복소수',q:`복소수 z=a+2i에 대하여 z+z̄=${sum}일 때, 실수 a의 값은? (단, i=√−1, z̄는 z의 켤레복소수)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `켤레복소수: z=a+2i의 켤레복소수는 z̄=a−2i (허수부 부호만 바꿈)`,
      `z+z̄ = (a+2i)+(a−2i) = 2a`,
      `2a = ${sum} → a = ${sum}÷2 = ${realPart}`,
      `따라서 a = ${realPart}입니다.`
    ]};
}

// 2-2. 켤레복소수 활용  (기출 Q5 패턴B)
function gen_complex_conjugate(){
  const a=randInt(1,6),b=randInt(1,5);
  const t=pick([1,2]);
  if(t===1){ // ${a}+${b}i의 켤레복소수를 p+qi라 할 때 p+q
    const ans=a-b; // 켤레복소수는 a−bi이므로 p=a, q=−b → p+q=a−b
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2,a+b].filter(w=>w!==ans).slice(0,3).map(String));
    return{topic:'켤레복소수',q:`복소수 ${a}+${b}i의 켤레복소수를 p+qi라 할 때, p+q의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
      sol:[
        `켤레복소수: A+Bi의 켤레복소수는 A−Bi입니다. (허수부의 부호만 바꿈)`,
        `${a}+${b}i의 켤레복소수 = ${a}−${b}i`,
        `이것을 p+qi 꼴로 쓰면: p=${a}, q=−${b}`,
        `p+q = ${a}+(−${b}) = ${ans}입니다.`
      ]};
  }
  // 켤레복소수가 c이면 z=c̄
  const{choices,answer}=makeChoices(String(a),[a+1,a-1<0?a+2:a-1,b].filter(w=>w!==a).slice(0,3).map(String));
  return{topic:'켤레복소수',q:`복소수 ${a}−${b}i의 켤레복소수가 a+${b}i일 때, 실수 a의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'},
    sol:[
      `켤레복소수: p+qi의 켤레복소수는 p−qi입니다. (허수부 부호만 바꿈)`,
      `${a}−${b}i의 켤레복소수 = ${a}+${b}i`,
      `문제에서 켤레복소수가 a+${b}i라고 했으므로 실수부를 비교합니다.`,
      `a = ${a}입니다.`
    ]};
}
