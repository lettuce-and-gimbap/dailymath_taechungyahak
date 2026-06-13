function makeChoices(correct,wrongs){
  const cs=String(correct);
  const uw=[...new Set(wrongs.map(String).filter(w=>w!==cs&&w!==undefined&&w!=='undefined'))].slice(0,3);
  // fallback: cs+숫자 형태가 수식처럼 보이지 않도록 별도 처리
  let ex=1;
  while(uw.length<3){
    const fb=Number.isFinite(Number(cs))?String(Number(cs)+ex):`${cs}(${ex})`;
    if(!uw.includes(fb)&&fb!==cs)uw.push(fb);
    ex++;if(ex>20)break;
  }
  const choices=shuffle([cs,...uw.slice(0,3)]);
  return{choices,answer:choices.indexOf(cs)};
}

function answerText(q){
  if(!q)return'';
  if(Array.isArray(q.choices)){
    if(Number.isInteger(q.answer))return String(q.choices[q.answer]??'');
    return String(q.answer??'');
  }
  if(q.ans!=null)return String(q.ans);
  if(q.ansC!=null)return q.hasR?`몫 ${q.ansC}, 나머지 ${q.ansR}`:String(q.ansC);
  return'';
}
function easyExplanation(q){
  if(!q)return'';
  if(q.explanation)return q.explanation;
  const topic=String(q.topic||q.meta?.type||q.type||'문제');
  const ans=answerText(q);
  const finish=ans?` 따라서 정답은 ${ans}입니다.`:'';
  if(topic.includes('소인수분해'))return`작은 소수 2, 3, 5, 7로 차례대로 나누어 봅니다. 더 나눌 수 없을 때까지 나눈 소수들을 곱셈으로 쓰면 됩니다.${finish}`;
  if(topic.includes('절댓값')||topic.includes('수의 대소'))return`수직선에서 0보다 오른쪽에 있는 수가 더 큽니다. 절댓값은 0에서 떨어진 거리이므로 부호를 빼고 크기를 비교하면 됩니다.${finish}`;
  if(topic.includes('문자')||topic.includes('식의 값'))return`문자 자리에 문제에서 준 수를 넣습니다. 곱셈을 먼저 하고, 그다음 덧셈이나 뺄셈을 계산합니다.${finish}`;
  if(topic.includes('일차방정식')||topic.includes('연립방정식'))return`등호의 양쪽에 같은 계산을 하면서 x와 숫자를 나눕니다. 연립방정식은 두 식을 더하거나 빼서 문자 하나를 먼저 없애면 쉬워집니다.${finish}`;
  if(topic.includes('부등식'))return`방정식처럼 x만 남기되, 음수로 곱하거나 나눌 때는 부등호 방향을 반대로 바꿔야 합니다.${finish}`;
  if(topic.includes('일차함수')||topic.includes('정비례'))return`y=ax+b에서 a는 기울기, b는 y절편입니다. 표나 그래프에서 x가 변할 때 y가 얼마나 변하는지 살펴봅니다.${finish}`;
  if(topic.includes('이차함수'))return`y=a(x-p)²+q에서 꼭짓점은 (p, q), 축은 x=p입니다. a가 양수면 아래가 열린 U 모양, 음수면 위가 열린 모양입니다.${finish}`;
  if(topic.includes('이차방정식')||topic.includes('인수분해')||topic.includes('전개'))return`곱해서 끝항이 되고 더해서 가운데 항이 되는 두 수를 찾습니다. (x-a)(x-b)=0이면 x=a 또는 x=b입니다.${finish}`;
  if(topic.includes('근호')||topic.includes('제곱근'))return`루트 안에서 제곱수 4, 9, 16, 25를 찾아 밖으로 꺼냅니다. 같은 루트끼리는 앞의 수만 더하거나 뺄 수 있습니다.${finish}`;
  if(topic.includes('지수'))return`같은 문자를 곱하면 지수를 더하고, 나누면 지수를 뺍니다. 거듭제곱을 다시 거듭제곱하면 지수끼리 곱합니다.${finish}`;
  if(topic.includes('삼각비'))return`먼저 빗변, 높이, 밑변을 찾습니다. sin은 높이/빗변, cos는 밑변/빗변, tan은 높이/밑변입니다.${finish}`;
  if(topic.includes('이등변')||topic.includes('삼각형')||topic.includes('각'))return`삼각형의 세 각을 더하면 180°입니다. 이등변삼각형은 길이가 같은 두 변의 맞은편 각도 서로 같습니다.${finish}`;
  if(topic.includes('닮음'))return`닮은 도형은 대응하는 변의 길이가 같은 비율로 커지거나 작아집니다. 서로 맞는 변끼리 비례식을 세우면 됩니다.${finish}`;
  if(topic.includes('원주각')||topic.includes('중심각')||topic.includes('원'))return`같은 호를 보는 중심각은 원주각의 2배입니다. 중심에서 현에 내린 수선은 현을 똑같이 둘로 나눕니다.${finish}`;
  if(topic.includes('확률'))return`전체 경우의 수를 먼저 세고, 원하는 경우의 수를 셉니다. 확률은 '원하는 경우 ÷ 전체 경우'입니다.${finish}`;
  if(topic.includes('경우의 수')||topic.includes('순열')||topic.includes('조합'))return`선택이 이어지면 각 단계의 가짓수를 곱합니다. 순서가 중요하면 순열, 순서가 중요하지 않으면 조합으로 생각합니다.${finish}`;
  if(topic.includes('평균'))return`모든 값을 더한 뒤 자료의 개수로 나눕니다.${finish}`;
  if(topic.includes('중앙값'))return`자료를 작은 수부터 줄 세운 뒤 한가운데 있는 값을 찾습니다.${finish}`;
  if(topic.includes('최빈값'))return`자료에서 가장 자주 나온 값을 찾습니다.${finish}`;
  if(topic.includes('표준편차')||topic.includes('상관'))return`값들이 평균에서 멀리 흩어질수록 표준편차가 큽니다. 두 값이 함께 커지면 양의 상관, 하나가 커질 때 다른 하나가 작아지면 음의 상관입니다.${finish}`;
  if(topic.includes('도수')||topic.includes('그래프'))return`표나 그래프에서 문제의 기준에 맞는 칸만 찾고, 해당하는 도수를 빠짐없이 더합니다.${finish}`;
  if(topic.includes('다항식')||topic.includes('항등식')||topic.includes('나머지'))return`같은 차수의 항끼리 모아 계산합니다. 항등식은 같은 차수의 계수가 서로 같고, x-a로 나눈 나머지는 x=a를 넣어 구합니다.${finish}`;
  if(topic.includes('집합')||topic.includes('명제')||topic.includes('함수'))return`기호의 뜻을 먼저 말로 바꿔 봅니다. 합집합은 모두, 교집합은 공통, 함수는 입력값이 어디로 가는지 차례대로 따라가면 됩니다.${finish}`;
  if(topic.includes('거리')||topic.includes('좌표')||topic.includes('직선'))return`좌표는 x를 먼저, y를 나중에 읽습니다. 거리나 직선 문제는 주어진 점을 공식에 하나씩 넣어 계산합니다.${finish}`;
  return`문제에서 묻는 값과 주어진 조건을 먼저 표시합니다. 필요한 계산을 한 단계씩 하고, 마지막에 보기와 같은 값을 찾습니다.${finish}`;
}
function ExplanationBox({q,className=''}) {
  // 생성기가 만든 단계별 해설이 있으면 번호를 매겨 표시 (정답과 동일한 계산 → 항상 일치)
  if(q&&Array.isArray(q.sol)&&q.sol.length){
    return <div className={`mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 font-semibold leading-relaxed ${className}`}>
      <div className="font-black text-amber-700 mb-1.5">📖 풀이 과정</div>
      <ol className="space-y-1">
        {q.sol.map((s,i)=>(<li key={i} className="flex gap-1.5">
          <span className="shrink-0 font-black text-amber-600">{i+1===q.sol.length?'➡':`${i+1}.`}</span>
          <span>{s}</span>
        </li>))}
      </ol>
    </div>;
  }
  return <div className={`mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 font-semibold leading-relaxed ${className}`}>
    <span className="font-black text-amber-700">쉬운 해설 · </span>{easyExplanation(q)}
  </div>;
}
function genRadicalQ(){
  const a=pick([-2,-1,1,2]);const dx=pick([-3,-2,-1,1,2,3]);const dy=pick([-3,-2,-1,1,2,3]);
  const aD=a===1?'':a===-1?'−':String(a);
  const xS=v=>v>0?`x−${v}`:`x+${-v}`;const yS=v=>v>0?`+${v}`:`−${-v}`;
  const correct=`y=${aD}√(${xS(dx)})${yS(dy)}`;
  const{choices,answer}=makeChoices(correct,[`y=${aD}√(${xS(-dx)})${yS(dy)}`,`y=${aD}√(${xS(dx)})${yS(-dy)}`,`y=${aD}√(${xS(-dx)})${yS(-dy)}`]);
  return{topic:'무리함수 평행이동',q:`y = ${aD}√x 를 x축 방향으로 ${dx>0?'+':''}${dx}만큼, y축 방향으로 ${dy>0?'+':''}${dy}만큼 이동하면?`,choices,answer,graph:{type:'radical',p:dx,q:dy,a}};
}
function genRationalQ(){
  const k=pick([-3,-2,-1,1,2,3]);const dx=pick([-3,-2,-1,1,2,3]);const dy=pick([-3,-2,-1,1,2,3]);
  const xS=v=>v>0?`x−${v}`:`x+${-v}`;const yS=v=>v>0?`+${v}`:`−${-v}`;
  const correct=`y=${k}/(${xS(dx)})${yS(dy)}`;
  const{choices,answer}=makeChoices(correct,[`y=${k}/(${xS(-dx)})${yS(dy)}`,`y=${k}/(${xS(dx)})${yS(-dy)}`,`y=${k}/(${xS(-dx)})${yS(-dy)}`]);
  return{topic:'유리함수 평행이동',q:`y = ${k}/x 를 x축 방향으로 ${dx>0?'+':''}${dx}만큼, y축 방향으로 ${dy>0?'+':''}${dy}만큼 이동하면?`,choices,answer,graph:{type:'rational',p:dx,q:dy,k}};
}
function genQuadraticQ(){
  for(let t=0;t<50;t++){
    const a=pick([-2,-1,1,2]);
    const p=pick([-2,-1,0,1,2]);
    const q=pick([-3,-2,-1,0,1,2,3]); // 꼭짓점 y좌표
    // 구간을 꼭짓점 근처로 좁게 설정 (좌표평면에 잘 들어오도록)
    const half=pick([1,2]);
    const ds=p-half-pick([0,1]);
    const de=p+half+pick([0,1]);
    if(de-ds<2||de-ds>5)continue; // 너무 좁거나 너무 넓은 구간 제외
    const atDs=a*(ds-p)**2+q, atDe=a*(de-p)**2+q;
    const pIn=p>=ds&&p<=de;
    const vals=pIn?[atDs,atDe,q]:[atDs,atDe];
    if(vals.some(v=>v<-10||v>10))continue;
    // a>0 → 최솟값만, a<0 → 최댓값만
    const extreme=a>0?Math.min(...vals):Math.max(...vals);
    const others=vals.filter(v=>v!==extreme);
    const wrongs=[...new Set([...others,extreme+(a>0?1:-1),extreme+(a>0?2:-2),extreme+(a>0?-1:1)])].filter(v=>v!==extreme);
    if(wrongs.length<3)continue;
    const{choices,answer}=makeChoices(String(extreme),wrongs.slice(0,3).map(String));
    const aStr=a===1?'':a===-1?'−':String(a);
    const pStr=p===0?'':p>0?`−${p}`:`+${-p}`;
    const qStr=q===0?'':q>0?` + ${q}`:` − ${-q}`;
    const questionType=a>0?'최솟값':'최댓값';
    return{
      topic:'이차함수 '+questionType,
      q:`y = ${aStr}(x${pStr})²${qStr} 에서  ${ds} ≤ x ≤ ${de} 일 때, ${questionType}은?`,
      choices,answer,
      graph:{type:'quadratic',p,q,a,ds,de}
    };
  }
  // 폴백
  return{topic:'이차함수 최솟값',q:`y = (x−1)²+2 에서  −1 ≤ x ≤ 3 일 때, 최솟값은?`,choices:['2','3','6','11'],answer:0,graph:{type:'quadratic',p:1,q:2,a:1,ds:-1,de:3}};
}
function genDistanceQ(){
  for(let t=0;t<60;t++){
    const la=pick([-3,-2,-1,1,2,3]),lb=pick([-4,-3,-2,-1,1,2,3,4]);
    const x0=randInt(-3,3),y0=randInt(-3,3),lc=randInt(-6,6);
    const num=Math.abs(la*x0+lb*y0+lc);if(num===0)continue;
    const denSq=la**2+lb**2,correct=distFracStr(num,denSq);
    const wrongs=[];
    for(const delta of[-2,-1,1,2,3,-3,4]){const wNum=num+delta;if(wNum<=0)continue;const w=distFracStr(wNum,denSq);if(w!==correct&&!wrongs.includes(w))wrongs.push(w);if(wrongs.length>=3)break}
    if(wrongs.length<3)continue;
    const{choices,answer}=makeChoices(correct,wrongs);
    const lbD=lb>=0?`+${lb}`:String(lb),lcD=lc>=0?`+${lc}`:String(lc);
    return{topic:'점과 직선 거리',q:`점 (${x0}, ${y0})에서 직선 ${la}x${lbD}y${lcD} = 0까지의 거리는?`,choices,answer,graph:{type:'distance',ptX:x0,ptY:y0,la,lb,lc}};
  }
  return{topic:'점과 직선 거리',q:'점 (3, 1)에서 직선 3x − 4y + 5 = 0까지의 거리는?',choices:['2','8/5','3','12/5'],answer:0,graph:{type:'distance',ptX:3,ptY:1,la:3,lb:-4,lc:5}};
}
function genCircleQ(){
  const h=randInt(-3,3),k=randInt(-3,3),r=randInt(1,4),r2=r*r;
  const hEq=fmtCircleTerm(h,'x'),kEq=fmtCircleTerm(k,'y');
  const eq=`${hEq}+${kEq}=${r2}`;
  const qt=pick(['eq','center','radius']);
  if(qt==='eq'){
    const correct=eq;
    const ws=circleWrongs(h,k,r2,correct);
    const{choices,answer}=makeChoices(correct,ws);
    return{topic:'원의 방정식',q:`중심이 (${h}, ${k})이고 반지름이 ${r}인 원의 방정식은?`,choices,answer,graph:{type:'circle',h,k,r}};
  }
  if(qt==='center'){
    const correct=`(${h}, ${k})`;
    const ws=[`(${-h}, ${k})`,`(${h}, ${-k})`,`(${-h}, ${-k})`].filter(w=>w!==correct);
    if(ws.length<3)ws.push(`(${h+1}, ${k})`);
    const{choices,answer}=makeChoices(correct,ws.slice(0,3));
    return{topic:'원의 방정식',q:`원 ${eq}의 중심의 좌표는?`,choices,answer,graph:{type:'circle',h,k,r}};
  }
  const correct=String(r);
  const ws2=[String(r2),String(r+1),String(r>1?r-1:r+2)].filter(w=>w!==correct);
  if(ws2.length<3)ws2.push(String(r+3));
  const{choices,answer}=makeChoices(correct,ws2.slice(0,3));
  return{topic:'원의 방정식',q:`원 ${eq}에서 반지름의 길이는?`,choices,answer,graph:{type:'circle',h,k,r}};
}
var SYM_LIST=[{k:'x축',fn:(x,y)=>[x,-y]},{k:'y축',fn:(x,y)=>[-x,y]},{k:'원점',fn:(x,y)=>[-x,-y]},{k:'y=x',fn:(x,y)=>[y,x]},{k:'y=-x',fn:(x,y)=>[-y,-x]}];
function genSymmetryQ(){
  const px=pick([-4,-3,-2,-1,1,2,3,4]),py=pick([-4,-3,-2,-1,1,2,3,4]),sym=pick(SYM_LIST);
  const[rx,ry]=sym.fn(px,py);const correct=`(${rx}, ${ry})`;
  const wrongs=[...SYM_LIST.filter(s=>s.k!==sym.k).map(s=>{const[wx,wy]=s.fn(px,py);return`(${wx}, ${wy})`}),`(${rx+1}, ${ry})`,`(${rx}, ${ry+1})`].filter(w=>w!==correct);
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'대칭이동',q:`점 (${px}, ${py})를 ${sym.k}에 대하여 대칭이동한 점은?`,choices,answer,graph:{type:'symmetry',px,py,sym:sym.k}};
}
var GEO_GENS=[genRadicalQ,genRationalQ,genQuadraticQ,genDistanceQ,genCircleQ,genSymmetryQ];

/* ===== MOCK EXAM GENERATORS — v9 강화판 ===== */
/* 2021~2026 고졸 검정고시 전 유형 완전 분석 · 39개 세부유형 구현
   ① 다항식  ② 방정식/부등식  ③ 기하  ④ 집합/함수  ⑤ 확률/통계     */

/* ── 내부 헬퍼 ── */
var _ps=(n,first=false)=>first?String(n):(n>=0?`+${n}`:String(n)); // 부호+숫자
var _cf=(n)=>n===1?'':n===-1?'−':String(n);   // 계수(1,-1 생략)
var _fmtLine=(slope,intercept)=>{               // y=ax+b 문자열
  const ss=slope===1?'':slope===-1?'−':String(slope);
  const bs=intercept===0?'':intercept>0?`+${intercept}`:String(intercept);
  return `y=${ss}x${bs}`;
};
var _p2=(a,b,c)=>{                              // ax²+bx+c 문자열
  let s='';
  if(a!==0)s+=`${_cf(a)}x²`;
  if(b!==0)s+=`${b>0&&s?'+':''}${_cf(b)}x`;
  if(c!==0)s+=_ps(c,!s);
  return s||'0';
};

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
  return{topic:'다항식 사칙연산',q:`두 다항식 A=${_p2(a1,b1,c1)}, B=${_p2(a2,b2,c2)}에 대하여 A${op}B는?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'}};
}

// 1-2. 항등식 — 계수 비교  (기출 Q2)
function gen_poly_identity(){
  const A=randInt(2,7),B=randInt(-5,5);
  const ans=A+B;
  const Bs=B>=0?`+${B}`:String(B);
  const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2,ans+4,ans-4].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'항등식',q:`등식 x²+ax${Bs}=x²+${A}x+b가 x에 대한 항등식일 때, 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'}};
}

// 1-3. 나머지 정리  (기출 Q3 패턴A)
function gen_poly_remainder(){
  const a=randInt(1,4),b=randInt(-4,4),c=randInt(-5,5);
  const r=pick([1,2,-1,-2]);
  const rem=a*r*r+b*r+c;
  const bs=b>=0?`+${b}x`:`${b}x`,cs=c>=0?`+${c}`:String(c);
  const rs=r>0?`x−${r}`:`x+${-r}`;
  const{choices,answer}=makeChoices(String(rem),[rem+2,rem-2,rem+4,rem-4].filter(w=>w!==rem).slice(0,3).map(String));
  return{topic:'나머지 정리',q:`다항식 ${a}x²${bs}${cs}을 ${rs}로 나누었을 때, 나머지는?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'}};
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
  return{topic:'나누어떨어지는 조건',q:`다항식 x³${aS}${bs}${cs}가 ${rs}로 나누어떨어질 때, 상수 a의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'}};
}

// 1-5. 인수분해 x³±n³  (기출 Q4)
function gen_poly_factor(){
  const n=pick([2,3,4]);
  const sign=pick(['+','-']);
  const cube=n**3;
  if(sign==='-'){
    const{choices,answer}=makeChoices(String(n),[n+2,n*n,n>1?n-1:n+1].filter(w=>w!==n&&w>0).map(String));
    return{topic:'인수분해',q:`다항식 x³−${cube}을 인수분해한 식이 (x−a)(x²+${n}x+${n*n})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'}};
  }
  // x³+n³=(x+n)(x²−nx+n²) → (x+n)(x²+ax+n²) → a=−n
  const ans=-n;
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,n,ans+2].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'인수분해',q:`다항식 x³+${cube}을 인수분해한 식이 (x+${n})(x²+ax+${n*n})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'}};
}

// 1-6. 조립제법 — 나머지 구하기  (기출 Q3 패턴C)
// ※ 2023~2026년 기출 기준: 조립제법은 항상 '나머지'를 묻는 유형으로 출제
function gen_poly_synthetic(){
  // x³+bx²+cx+d ÷ (x−1) → 나머지: f(1) = 1+b+c+d
  const b=randInt(-3,3),c=randInt(-3,3),d=randInt(-4,4);
  const rem=1+b+c+d;
  const bS=b>=0?`+${b}x²`:`${b}x²`,cS=c>=0?`+${c}x`:`${c}x`,dS=d>=0?`+${d}`:String(d);
  const wrongs=[rem+1,rem-1,rem+2,rem-2].filter(w=>w!==rem).slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(rem),wrongs);
  return{topic:'조립제법',q:`다음은 조립제법을 이용하여 다항식 x³${bS}${cS}${dS}을 x−1로 나누는 과정이다. 이때, 나머지는?`,choices,answer,meta:{category:'poly',type:'다항식 계산',diff:'기초'},synthetic:{b,c,d,rem}};
}

// 다항식 영역 디스패처
function genMockPoly(){
  return weightedGen([[gen_poly_arith,4],[gen_poly_identity,4],[gen_poly_remainder,4],
    [gen_poly_divisible,3],[gen_poly_factor,4],[gen_poly_synthetic,5]]);
}

/* ════════════════════════════════════════════════
   ② 방정식·부등식 영역 (11개 세부유형)
   ════════════════════════════════════════════════ */

// 2-1. 복소수 사칙연산  (기출 Q5 패턴A)
function gen_complex_calc(){
  const t=pick([1,2,3]);
  if(t===1){ // (x−a)+yi=p+qi 꼴 → x,y 값
    const a=randInt(1,4),y0=randInt(1,5),p=randInt(1,5),q=randInt(1,5);
    const x0=p+a;
    const ask=pick(['x','y','x+y']);
    const ans=ask==='x'?x0:ask==='y'?q:x0+q;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
    return{topic:'복소수',q:`등식 (x−${a})+${y0}i=${p}+${q}i를 만족하는 실수 x, y의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
  }
  if(t===2){ // i(a+bi)=c+di 형태 → a 구하기
    const a=randInt(1,4),b=randInt(1,4);
    // i(a+bi)=ai+bi²=−b+ai → real=−b, imag=a
    const{choices,answer}=makeChoices(String(a),[a+1,a-1<1?a+2:a-1,-b].filter(w=>w!==a&&w!==undefined).slice(0,3).map(String));
    return{topic:'복소수',q:`i(${a}+${b}i)=a+${a}i일 때, 실수 a의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
  }
  // 복소수 z=a+2i, z+z̄=b → 2a=b → a
  const realPart=randInt(1,5);
  const sum=2*realPart;
  const{choices,answer}=makeChoices(String(realPart),[realPart+1,realPart-1<0?realPart+2:realPart-1,sum].filter(w=>w!==realPart).slice(0,3).map(String));
  return{topic:'켤레복소수',q:`복소수 z=a+2i에 대하여 z+z̄=${sum}일 때, 실수 a의 값은? (단, i=√−1, z̄는 z의 켤레복소수)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
}

// 2-2. 켤레복소수 활용  (기출 Q5 패턴B)
function gen_complex_conjugate(){
  const a=randInt(1,6),b=randInt(1,5);
  const t=pick([1,2]);
  if(t===1){ // z=a+bi의 켤레복소수가 a−bi → a+b
    const ans=a+b;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
    return{topic:'켤레복소수',q:`복소수 ${a}+${b}i의 켤레복소수가 a+bi일 때, 두 실수 a, b에 대하여 a+b의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
  }
  // 켤레복소수가 c이면 z=c̄
  const{choices,answer}=makeChoices(String(a),[a+1,a-1<0?a+2:a-1,b].filter(w=>w!==a).slice(0,3).map(String));
  return{topic:'켤레복소수',q:`복소수 ${a}−${b}i의 켤레복소수가 a+${b}i일 때, 실수 a의 값은? (단, i=√−1)`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
}

// 2-3. 이차방정식 중근  (기출 Q5/Q6 패턴)
function gen_quad_double_root(){
  // x²+ax+b=0이 중근 → D=a²−4b=0 → b=a²/4 → a를 짝수로
  const a0=pick([2,4,6,-2,-4,-6]);
  const b0=a0**2/4;
  const ans=Math.abs(a0); // 보통 양수 물음
  const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2<0?ans+4:ans-2,ans+4].filter(w=>w!==ans).slice(0,3).map(String));
  const aS=a0>=0?`+${a0}x`:`${a0}x`;
  return{topic:'이차방정식 중근',q:`이차방정식 x²${aS}+${b0}=0이 중근을 가질 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
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
  return{topic:'이차방정식 근과 계수',q:`이차방정식 x²${ps}${qs}=0의 두 근을 α, β라고 할 때, ${label}의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
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
    return{topic:'두 근→이차방정식',q:`두 수 ${r1}, ${r2v}를 근으로 하고 x²의 계수가 1인 이차방정식이 x²−ax+${prod}=0일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
  }
  return{topic:'두 근→이차방정식',q:`두 수 ${r1}, ${r2v}를 근으로 하고 x²의 계수가 1인 이차방정식이 x²−${sum}x+a=0일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
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
    const{choices,answer}=makeChoices(String(a),[a+2,a-2,a+4,a-4].filter(w=>w!==a).slice(0,3).map(String));
    return{topic:'삼차방정식 한 근',q:`삼차방정식 x³${ps2}${qs2}+a=0의 한 근이 ${root}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
  }
  // 사차: x⁴+px²+a=0 (짝수차수로 단순화)
  const p2=randInt(-4,4);
  const a=-(root**4+p2*root**2);
  if(Math.abs(a)>20) return gen_cubic_quartic_root();
  const p2s=p2>=0?`+${p2}x²`:`${p2}x²`;
  const{choices,answer}=makeChoices(String(a),[a+2,a-2,a+4].filter(w=>w!==a).slice(0,3).map(String));
  return{topic:'사차방정식 한 근',q:`사차방정식 x⁴${p2s}+a=0의 한 근이 ${root}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
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
  return{topic:'이차함수 최댓/최솟값',q:`${lo}≤x≤${hi}일 때, 이차함수 ${fStr}의 ${typeStr}은?`,choices,answer,graph:{type:'quadratic',a:a0,p,q:q0,ds:lo,de:hi},meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
}

// 2-8. 연립방정식 해 → 상수  (기출 Q9)
function gen_system_eq(){
  const s=randInt(3,8);
  const xV=randInt(1,s-1),yV=s-xV;
  const t=pick([1,2]);
  if(t===1){ // {x+y=s, xy=a}, 해 x=xV, y=b
    const aVal=xV*yV,bVal=yV,ans=aVal+bVal;
    const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2,ans+4].filter(w=>w!==ans).map(String));
    return{topic:'연립방정식',q:`연립방정식 {x+y=${s} / xy=a}의 해가 x=${xV}, y=b일 때, 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
  }
  // {x+y=s, x²−y²=a}
  const aVal=xV**2-yV**2,bVal=yV,ans=aVal+bVal;
  const{choices,answer}=makeChoices(String(ans),[ans+2,ans-2,ans+4,ans-4].filter(w=>w!==ans).slice(0,3).map(String));
  return{topic:'연립방정식',q:`연립방정식 {x+y=${s} / x²−y²=a}의 해가 x=${xV}, y=b일 때, 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'eq',type:'방정식과 부등식',diff:'기초'}};
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
  return{topic:'이차부등식',q:`이차부등식 ${lhs}${op}의 해는?`,choices,answer,meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'}};
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
  const{choices,answer}=makeChoices(String(hi),[hi+1,hi+2,hi-1].filter(w=>w!==hi&&w>lo).map(String));
  return{topic:'연립부등식',q:`연립부등식 {${a1}x>${b1} / ${c2}x<${d2}x${e2s}}의 해가 ${lo}<x<a일 때, 상수 a의 값은?`,choices,answer,meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'}};
}

// 2-11. 절댓값 부등식 수직선 → a  (기출 Q10 패턴B)
function gen_abs_ineq(){
  const center=randInt(-2,3),r=randInt(1,4);
  const lo=center-r,hi=center+r;
  const cStr=center===0?'|x|':center>0?`|x−${center}|`:`|x+${-center}|`;
  const{choices,answer}=makeChoices(String(hi),[hi+1,hi-1,hi+2].filter(w=>w!==hi).map(String));
  return{topic:'절댓값 부등식',q:`부등식 ${cStr}≤${r}의 해를 수직선 위에 나타낼 때, 오른쪽 끝 a의 값은?`,choices,answer,meta:{category:'ineq',type:'방정식과 부등식',diff:'기초'}};
}

// 방정식·부등식 디스패처
function genMockEqInequal(){
  return weightedGen([[gen_complex_calc,3],[gen_complex_conjugate,4],[gen_quad_double_root,1],
    [gen_quad_vieta,5],[gen_from_roots,3],[gen_cubic_quartic_root,4],
    [gen_quad_extremum,5],[gen_system_eq,4],[gen_quad_ineq,3],
    [gen_system_ineq,4],[gen_abs_ineq,4]]);
}

/* ════════════════════════════════════════════════
   ③ 기하 영역 (9개 세부유형)
   ════════════════════════════════════════════════ */

// 3-1. 두 점 사이의 거리  (기출 Q11)
function gen_two_point_dist(){
  const NICE=[
    [1,1,'√2'],[1,2,'√5'],[2,1,'√5'],[2,2,'2√2'],
    [1,3,'√10'],[3,1,'√10'],[2,3,'√13'],[3,2,'√13'],
    [3,4,'5'],[4,3,'5'],[2,4,'2√5'],[4,2,'2√5'],
    [1,4,'√17'],[3,3,'3√2'],[4,4,'4√2']
  ];
  const [dx,dy,dStr]=pick(NICE);
  const x1=randInt(-3,2),y1=randInt(-3,2);
  const x2=x1+(Math.random()<0.5?dx:-dx);
  const y2=y1+(Math.random()<0.5?dy:-dy);
  const correct=dStr;
  const wrongs=shuffle(NICE.filter(([a,b])=>a!==dx||b!==dy).map(([,,s])=>s)).filter(s=>s!==correct).slice(0,3);
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'두 점 거리',q:`좌표평면 위의 두 점 A(${x1}, ${y1}), B(${x2}, ${y2}) 사이의 거리는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
}

// 3-2. 내분점 — 수직선  (기출 Q11 패턴A: 2023~)
function gen_internal_1d(){
  const mnOpts=[[1,2],[2,1],[1,3],[3,1],[2,3],[3,2],[1,1]];
  let m,n,a,b,p,att=0;
  do{
    [m,n]=pick(mnOpts); a=randInt(-2,4); b=randInt(a+2,8);
    const num=m*b+n*a, den=m+n;
    if(num%den===0){p=num/den;break;}
    att++;
  }while(att<30);
  if(att>=30){m=1;n=2;a=1;b=7;p=3;}
  const correct=String(p);
  const{choices,answer}=makeChoices(correct,[p+1,p-1<a?p+2:p-1,p+2].filter(w=>String(w)!==correct).slice(0,3).map(String));
  const pn=v=>v<0?`(${v})`:`${v}`;
  return{topic:'내분점(수직선)',q:`수직선 위의 두 점 A(${a}), B(${b})에 대하여 선분 AB를 ${m}:${n}으로 내분하는 점 P의 좌표는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'},graph:{type:'section_1d',a,b,p,m,n},
    sol:[
      `내분점 공식: 선분 AB를 m:n으로 내분하는 점은 (m×B+n×A)÷(m+n)으로 구합니다.`,
      `여기서 m=${m}, n=${n}, A=${a}, B=${b}입니다.`,
      `P=(${m}×${pn(b)}+${n}×${pn(a)})÷(${m}+${n})=(${m*b}+${n*a})÷${m+n}=${m*b+n*a}÷${m+n}=${p}`,
      `따라서 점 P의 좌표는 ${p}입니다.`
    ]};
}

// 3-3. 내분점 — 좌표평면  (기출 Q11 패턴B)
function gen_internal_2d(){
  const mnOpts=[[1,1],[1,2],[2,1],[1,3],[3,1],[2,3],[3,2]];
  let m,n,ax,ay,bx,by,px,py,att=0;
  do{
    [m,n]=pick(mnOpts); const s=m+n;
    px=randInt(-1,4); py=randInt(-1,4);
    ax=randInt(-3,2); ay=randInt(-2,3);
    const nx=px*s-n*ax, ny=py*s-n*ay;
    if(nx%m!==0||ny%m!==0){att++;continue;}
    bx=nx/m; by=ny/m;
    if((ax===bx&&ay===by)||Math.abs(bx)>8||Math.abs(by)>8){att++;continue;}
    break;
  }while(att<40);
  if(att>=40){m=1;n=2;ax=-2;ay=1;bx=4;by=7;px=0;py=3;}
  const correct=`(${px}, ${py})`;
  const wrongs=[`(${px+1}, ${py})`,`(${px}, ${py+1})`,`(${px-1}, ${py-1})`].filter(w=>w!==correct);
  const{choices,answer}=makeChoices(correct,wrongs);
  const s=m+n;
  const pn=v=>v<0?`(${v})`:`${v}`;
  return{topic:'내분점(좌표평면)',q:`좌표평면 위의 두 점 A(${ax}, ${ay}), B(${bx}, ${by})에 대하여 선분 AB를 ${m}:${n}으로 내분하는 점의 좌표는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'},graph:{type:'section_2d',ax,ay,bx,by,px,py,m,n},
    sol:[
      `내분점 공식을 x좌표, y좌표에 각각 적용합니다. m:n=${m}:${n}, A(${ax}, ${ay}), B(${bx}, ${by}).`,
      `x좌표=(${m}×${pn(bx)}+${n}×${pn(ax)})÷${s}=(${m*bx}+${n*ax})÷${s}=${m*bx+n*ax}÷${s}=${px}`,
      `y좌표=(${m}×${pn(by)}+${n}×${pn(ay)})÷${s}=(${m*by}+${n*ay})÷${s}=${m*by+n*ay}÷${s}=${py}`,
      `따라서 내분점의 좌표는 (${px}, ${py})입니다.`
    ]};
}

// 3-4. 직선의 방정식 (기울기+점)  (기출 Q12 패턴A)
function gen_line_eq(){
  const slope=pick([-2,-1,1,2]),px=pick([0,1,2,-1]),py=randInt(-3,4);
  const b=py-slope*px;
  const correct=_fmtLine(slope,b);
  const w=[_fmtLine(slope,b+1),_fmtLine(slope+1,b),_fmtLine(slope,b-1)].filter(x=>x!==correct);
  const{choices,answer}=makeChoices(correct,w);
  return{topic:'직선 방정식',q:`기울기가 ${slope}이고 점 (${px}, ${py})를 지나는 직선의 방정식은?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
}

// 3-5. 평행/수직 직선  (기출 Q12 패턴B)
function gen_parallel_perp_line(){
  const slope=pick([-2,-1,1,2]);
  const isParallel=Math.random()<0.5;
  const px=pick([0,1,2,-1,-2]),py=randInt(-4,4);
  const newSlope=isParallel?slope:(-1/slope); // 수직이면 역수부호
  const intNewSlope=Number.isInteger(newSlope)?newSlope:null;
  if(!intNewSlope) return gen_line_eq();
  const b=py-intNewSlope*px;
  const refB=b+randInt(1,4);
  const refLine=`y=${slope===1?'':slope}x${refB>=0?`+${refB}`:refB}`;
  const correct=_fmtLine(intNewSlope,b);
  const w=[_fmtLine(intNewSlope,b+1),_fmtLine(slope,b),_fmtLine(intNewSlope,b-1)].filter(x=>x!==correct);
  const{choices,answer}=makeChoices(correct,w);
  const desc=isParallel?`직선 ${refLine}에 평행하고 점 (${px}, ${py})를 지나는`:`직선 ${refLine}에 수직이고 점 (${px}, ${py})를 지나는`;
  return{topic:isParallel?'평행 직선':'수직 직선',q:`${desc} 직선의 방정식은?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
}

// 3-6. 평행이동  (기출 Q14 패턴A)
function gen_translation(){
  const x=randInt(-2,4),y=randInt(-2,4);
  const px=randInt(-3,4),py=randInt(-3,4);
  const rx=x+px,ry=y+py;
  const correct=`(${rx}, ${ry})`;
  const w=[`(${rx+1}, ${ry})`,`(${rx}, ${ry-1})`,`(${x}, ${y})`].filter(w=>w!==correct);
  const{choices,answer}=makeChoices(correct,w);
  return{topic:'평행이동',q:`좌표평면 위의 점 (${x}, ${y})를 x축의 방향으로 ${px}만큼, y축의 방향으로 ${py}만큼 평행이동한 점의 좌표는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
}

// 3-7. 원의 방정식  (기출 Q13)
function gen_circle_eq_mock(){
  const t=pick([1,2,3]);
  if(t===1){ // 중심+반지름
    const q=genCircleQ();
    return{...q,meta:{category:'geometry',type:'도형과 기하',diff:'기하'}};
  }
  if(t===2){ // x축 또는 y축에 접하는 원
    const h=randInt(-3,4),k=randInt(1,4);
    const axis=pick(['x','y']);
    const r=axis==='x'?Math.abs(k):Math.abs(h);
    if(r===0)return gen_circle_eq_mock();
    const eqH=fmtCircleTerm(h,'x'),eqK=fmtCircleTerm(k,'y');
    const correct=`${eqH}+${eqK}=${r*r}`;
    // wrongs: r대신 r², (r±1)² 등 확실히 다른 값
    const ws=new Set();
    [`${eqH}+${eqK}=${r}`,`${eqH}+${eqK}=${(r+1)*(r+1)}`,`${fmtCircleTerm(-h,'x')}+${eqK}=${r*r}`,`${eqH}+${eqK}=${r*r+2}`]
      .forEach(w=>{if(w!==correct)ws.add(w);});
    const{choices,answer}=makeChoices(correct,[...ws].slice(0,3));
    return{topic:'원의 방정식',q:`중심의 좌표가 (${h}, ${k})이고 ${axis}축에 접하는 원의 방정식은?`,choices,answer,graph:{type:'circle',h,k,r},meta:{category:'geometry',type:'도형과 기하',diff:'기하'}};
  }
  // 직선과 원의 관계
  return gen_circle_line_rel();
}

// 3-8. 직선과 원의 관계  (기출 Q11/Q13: 2024~2025~)
function gen_circle_line_rel(){
  const r=pick([2,3,4,5]);
  const t=pick([1,2]);
  if(t===1){ // 직선 y=a와 원 x²+y²=r²이 한 점에서 만날 때
    const correct=String(r);
    const{choices,answer}=makeChoices(correct,[r-1,r+1,r+2].filter(w=>w!==r&&w>0).map(String));
    return{topic:'직선과 원',q:`자연수 a에 대하여 직선 y=a와 원 x²+y²=${r*r}이 한 점에서 만날 때, a의 값은?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
  }
  // 직선 x=a와 원이 만나지 않을 때 a<N인 자연수
  const N=r+2;
  const aVal=r+1;
  const{choices,answer}=makeChoices(String(aVal),[aVal-1<r?aVal+1:aVal-1,aVal+1,r].filter(w=>w!==aVal&&w>0).slice(0,3).map(String));
  return{topic:'직선과 원',q:`직선 x=a와 원 x²+y²=${r*r}이 만나지 않을 때, a<${N}인 자연수 a의 값은?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
}

// 3-9. 대칭이동  (기출 Q14 패턴B)
function gen_symmetry_pt(){
  const q=genSymmetryQ();
  return{...q,meta:{category:'geometry',type:'도형과 기하',diff:'기하'}};
}

// 3-10. 지름 끝점 → 원의 방정식  (기출 Q13: 2021-2회)
function gen_circle_diameter_pts(){
  const PAIRS=[
    {A:[-1,-1],B:[3,3],h:1,k:1,r2:8},
    {A:[-2,-1],B:[2,3],h:0,k:1,r2:8},
    {A:[0,0],B:[4,2],h:2,k:1,r2:5},
    {A:[-2,0],B:[2,4],h:0,k:2,r2:8},
    {A:[1,-2],B:[5,2],h:3,k:0,r2:8},
    {A:[-1,-1],B:[3,1],h:1,k:0,r2:5},
    {A:[0,-2],B:[4,2],h:2,k:0,r2:8},
    {A:[-2,-2],B:[2,2],h:0,k:0,r2:8},
  ];
  const{A,B,h,k,r2}=pick(PAIRS);
  const hEq=fmtCircleTerm(h,'x'),kEq=fmtCircleTerm(k,'y');
  const correct=`${hEq}+${kEq}=${r2}`;
  const ws=circleWrongs(h,k,r2,correct,[`${hEq}+${kEq}=${r2-2}`,`${hEq}+${kEq}=${r2+2}`]);
  const{choices,answer}=makeChoices(correct,ws.slice(0,3));
  return{topic:'원의 방정식(지름)',q:`두 점 A(${A[0]}, ${A[1]}), B(${B[0]}, ${B[1]})을 지름의 양 끝 점으로 하는 원의 방정식은?`,choices,answer,graph:{type:'circle',h,k,r:Math.sqrt(r2).toFixed(2)*1},meta:{category:'geometry',type:'도형과 기하',diff:'기하'}};
}

// 3-11. 원의 대칭이동  (기출 Q13: 2025-1회)
function gen_circle_sym_move(){
  const h=pick([-3,-2,-1,1,2,3]),k=pick([1,2,3]),r=pick([1,2,3]);
  const sym=pick(['x축','y축','원점']);
  const nh=sym==='y축'||sym==='원점'?-h:h;
  const nk=sym==='x축'||sym==='원점'?-k:k;
  const mkEq=(hv,kv)=>`${fmtCircleTerm(hv,'x')}+${fmtCircleTerm(kv,'y')}=${r*r}`;
  const correct=mkEq(nh,nk);
  const cands=[mkEq(-nh,nk),mkEq(nh,-nk),mkEq(h,k),mkEq(-nh,-nk)].filter(w=>w!==correct);
  const ws=[...new Set(cands)].slice(0,3);
  const{choices,answer}=makeChoices(correct,ws);
  const origEq=mkEq(h,k);
  return{topic:'원의 대칭이동',q:`원 ${origEq}을 ${sym}에 대하여 대칭이동한 도형의 방정식은?`,choices,answer,graph:{type:'circle',h:nh,k:nk,r},meta:{category:'geometry',type:'도형과 기하',diff:'기하'}};
}

// 3-12. 원점과 직선 사이의 거리  (기출 Q11/Q12: 2025-1, 2026-1회)
function gen_origin_line_dist(){
  const CASES=[
    {a:3,b:4,c:-12,dist:'12/5'},{a:3,b:4,c:15,dist:'3'},
    {a:3,b:4,c:-5,dist:'1'},{a:3,b:4,c:-20,dist:'4'},
    {a:5,b:12,c:-13,dist:'1'},{a:1,b:1,c:-2,dist:'√2'},
    {a:3,b:4,c:-25,dist:'5'},{a:5,b:12,c:-26,dist:'2'},
    {a:3,b:4,c:10,dist:'2'},{a:4,b:3,c:-12,dist:'12/5'},
    {a:5,b:12,c:-60,dist:'12/13'},{a:3,b:4,c:-30,dist:'6'},
    {a:1,b:2,c:-5,dist:'√5'},{a:2,b:1,c:-4,dist:'4/√5'},
  ];
  const item=pick(CASES);
  const{a,b,c,dist}=item;
  const cStr=c>=0?`+${c}`:String(c);
  const bStr=b>=0?`+${b}y`:String(b)+'y';
  // 같은 dist값이 여러 케이스에 있을 수 있으므로 완전히 다른 값만 오답으로
  const wrongs=[...new Set(CASES.filter(x=>x.dist!==dist).map(x=>x.dist))].slice(0,3);
  const{choices,answer}=makeChoices(dist,wrongs);
  return{topic:'원점→직선 거리',q:`원점과 직선 ${a}x${bStr}${cStr}=0 사이의 거리는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'}};
}

// 기하 디스패처
function genMockInternalPt(){return gen_internal_2d();}
function genMockLine(){return gen_line_eq();}
function genMockGeometry(){
  const gens=[
    [gen_two_point_dist,4],[gen_internal_1d,2],[gen_internal_2d,4],
    [gen_line_eq,4],[gen_parallel_perp_line,5],[gen_translation,5],
    [()=>({...genDistanceQ(),meta:{category:'geometry',type:'도형과 기하',diff:'기하'}}),2],
    [gen_circle_eq_mock,5],[gen_circle_line_rel,2],[gen_symmetry_pt,5],
    [gen_circle_diameter_pts,3],[gen_circle_sym_move,2],[gen_origin_line_dist,2]
  ];
  return weightedGen(gens.map(([f,w])=>[()=>{try{return f();}catch(e){return gen_line_eq();}},w]));
}

/* ── 기하 그래프 미리보기 SVG ──
   q.graph 객체를 직접 읽어 정확한 그래프를 렌더링.
   graph 구조:
     이차함수: {type:'quadratic', a, p, q, ds, de}
     무리함수: {type:'radical',   a, p(=dx), q(=dy)}
     유리함수: {type:'rational',  k, p(=dx), q(=dy)}
     원:       {type:'circle',    h, k, r}
     점↔직선:  {type:'distance',  ptX, ptY, la, lb, lc}
     대칭이동: {type:'symmetry',  px, py, sym}
*/
/* ── 수식 렌더러 MathExpr ──
   그래프 탐험이 쓰는 SqR / VF 컴포넌트 재사용 (함수선언 호이스팅으로 forward-use 가능)
   ① 단독 분수 "3/5", "2/√5"  → VF 세로분수
   ② 무리함수 선지 "y=−2√(x+2)−1"  → SqR 루트 기호
   ③ 유리함수 선지 "y=−3/(x−2)+2"  → VF 세로분수
   ④ 기타(좌표, 정수, 방정식 등)    → 텍스트 그대로 */
