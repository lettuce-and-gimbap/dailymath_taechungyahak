// === js/generators/middle.js ===
/* --------------------------------------------------------------------
   중졸 검정고시 생성기
   2021~2026 기출 유형 24종 + 영역별 묶음
   -------------------------------------------------------------------- */

function genMidPrime(){
  const cases=[
    [36,'2²×3²',[[2,18],[2,9],[3,3]]],[45,'3²×5',[[3,15],[3,5]]],
    [54,'2×3³',[[2,27],[3,9],[3,3]]],[84,'2²×3×7',[[2,42],[2,21],[3,7]]],
    [90,'2×3²×5',[[2,45],[3,15],[3,5]]],[100,'2²×5²',[[2,50],[2,25],[5,5]]]
  ];
  const[n,correct,steps]=pick(cases);
  const wrongs=shuffle(['2×3×5','2²×3×5','2×3²×7','2³×5²','3²×5²']).filter(v=>v!==correct).slice(0,3);
  const{choices,answer}=makeChoices(correct,wrongs);
  const stepStr=steps.map(([d,q])=>`${q}÷${d}=${Math.round(q/d)}`).join(' → ');
  return{topic:'소인수분해',q:`${n}을 소인수분해한 결과로 옳은 것은?`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `소인수분해: 가장 작은 소수(2, 3, 5, 7…)부터 차례대로 나눕니다.`,
      `${n} → ${stepStr} → 1`,
      `나눈 소수들을 모두 곱하면: ${correct}`,
      `따라서 ${n} = ${correct}입니다.`
    ]};
}

function genMidNumber(){
  const nums=shuffle([randInt(-7,-2),-1,0,randInt(1,5),randInt(6,10)]).slice(0,4);
  const sorted=[...nums].sort((a,b)=>a-b),pos=randInt(1,4),correct=String(sorted[pos-1]);
  const{choices,answer}=makeChoices(correct,nums.filter(v=>String(v)!==correct).map(String));
  return{topic:'수의 대소',q:`${nums.join(', ')}을 작은 수부터 차례대로 나열할 때, ${['첫','둘','셋','넷'][pos-1]}째 수는?`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `수직선에서 왼쪽에 있을수록 작은 수입니다. (음수 < 0 < 양수)`,
      `주어진 수: ${nums.join(', ')}`,
      `작은 순서대로: ${sorted.join(' < ')}`,
      `${['첫','둘','셋','넷'][pos-1]}째 수는 ${correct}입니다.`
    ]};
}

function genMidRepeating(){
  const n=randInt(1,8),correct=`${n}/9`;
  const{choices,answer}=makeChoices(correct,[`${Math.max(1,n-1)}/9`,`${n}/10`,`${Math.min(8,n+1)}/9`]);
  return{topic:'순환소수',q:`순환소수 0.${n}${n}${n}…을 기약분수로 나타낸 것은?`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `x = 0.${n}${n}${n}… 로 놓습니다.`,
      `10x = ${n}.${n}${n}${n}… 입니다.`,
      `10x − x = ${n}.${n}${n}… − 0.${n}${n}… = ${n}`,
      `9x = ${n}  →  x = ${n}/9`,
      `따라서 0.${n}${n}${n}… = ${n}/9입니다.`
    ]};
}

function genMidExponent(){
  const supMap='⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup=n=>String(n).split('').map(c=>supMap[+c]||c).join('');
  const xPow=n=>n===1?'x':`x${sup(n)}`;
  const a=randInt(2,4),b=randInt(2,5),c=randInt(1,Math.min(3,a+b-1)),ans=a+b-c;
  const wrongVals=[...new Set([ans-1,ans+1,a*b,a+b].filter(v=>v>0&&v!==ans))];
  const{choices,answer}=makeChoices(xPow(ans),wrongVals.map(xPow));
  return{topic:'지수법칙',q:`${xPow(a)} × ${xPow(b)} ÷ ${xPow(c)}을 간단히 한 것은? (단, x≠0)`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `지수법칙: 같은 밑(x)끼리 곱하면 지수를 더하고, 나누면 지수를 뺍니다.`,
      `${xPow(a)} × ${xPow(b)} = x^(${a}+${b}) = ${xPow(a+b)}`,
      `${xPow(a+b)} ÷ ${xPow(c)} = x^(${a+b}−${c}) = ${xPow(ans)}`,
      `따라서 답은 ${xPow(ans)}입니다.`
    ]};
}

function genMidSubstitute(){
  const a=randInt(-3,5),m=randInt(2,5),b=randInt(-4,5),ans=m*a+b;
  const bS=b>=0?`+${b}`:String(b);
  const pn=v=>v<0?`(${v})`:String(v);
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+2,ans+m].map(String));
  return{topic:'식의 값',q:`a=${a}일 때, ${m}a${bS}의 값은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `식의 값: a 자리에 ${a}를 그대로 넣어 계산합니다.`,
      `${m}a${bS}에 a=${a}를 대입하면: ${m}×${pn(a)}${bS}`,
      `= ${m*a}${bS} = ${ans}`,
      `따라서 답은 ${ans}입니다.`
    ]};
}

function genMidWordExpr(){
  const price=pick([300,500,700,1200,2000]),base=pick([0,100,200]);
  const correct=base?`${price}x+${base}`:`${price}x`;
  const q=base?`무게가 ${base}g인 빈 상자에 ${price}g인 물건 x개를 넣었을 때 전체 무게를 식으로 나타낸 것은?`:`한 개에 ${price}원인 물건 x개의 가격을 식으로 나타낸 것은?`;
  const{choices,answer}=makeChoices(correct,[`${price}+x`,`${price}-x`,`${price}÷x`]);
  return{topic:'문자를 사용한 식',q,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:base?[
      `문자 x는 '개수'를 나타내므로 x를 곱해서 전체 양을 구합니다.`,
      `물건 x개의 무게: ${price}×x = ${price}x (g)`,
      `빈 상자 무게 ${base}g을 더하면 전체 무게: ${price}x + ${base} (g)`,
      `따라서 식은 ${correct}입니다.`
    ]:[
      `한 개의 가격 × 개수 = 전체 가격입니다.`,
      `${price}원짜리 물건 x개의 가격: ${price}×x = ${price}x (원)`,
      `따라서 식은 ${correct}입니다.`
    ]};
}

function genMidLinearEq(){
  const x=randInt(1,8),a=randInt(2,5),c=randInt(1,a-1),b=randInt(-5,5),d=(a-c)*x+b;
  const bS=b>=0?`+${b}`:String(b),dS=d>=0?`+${d}`:String(d);
  const coeff=a-c;
  const rhs=d-b;
  const{choices,answer}=makeChoices(String(x),[x-1,x+1,x+2].filter(v=>v>=0).map(String));
  return{topic:'일차방정식',q:`일차방정식 ${a}x${bS}=${c}x${dS}의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `x가 있는 항은 왼쪽으로, 숫자만 있는 항은 오른쪽으로 옮깁니다.`,
      `${a}x${bS}=${c}x${dS}에서 ${a}x−${c}x = ${d>=0?d:'('+d+')'}${b>=0?'−'+b:'+('+Math.abs(b)+')'}`,
      `${coeff}x = ${rhs}`,
      `x = ${rhs}÷${coeff} = ${x}`,
      `따라서 해는 x = ${x}입니다.`
    ]};
}

function genMidSystem(){
  const x=randInt(1,5),y=randInt(1,5),s=x+y,d=x-y,correct=`x=${x}, y=${y}`;
  const wrongs=x===y
    ?[`x=${x+1}, y=${y}`,`x=${x}, y=${y+1}`,`x=${x+1}, y=${y+1}`]
    :[`x=${y}, y=${x}`,`x=${x+1}, y=${Math.max(0,y-1)}`,`x=${Math.max(0,x-1)}, y=${y+1}`];
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'연립방정식',q:`다음 연립방정식의 해는?`,choices,answer,graph:{type:'system_eq',eqs:[`x+y=${s}`,`x−y=${d}`]},meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `두 식을 더해서 y를 없애는 방법을 씁니다.`,
      `①+②: (x+y)+(x−y) = ${s}+(${d}) → 2x = ${s+d} → x = ${x}`,
      `①에 x=${x}를 넣으면: ${x}+y=${s} → y = ${s}−${x} = ${y}`,
      `따라서 해는 x=${x}, y=${y}입니다.`
    ]};
}

function genMidInequality(){
  const a=randInt(2,6),x=randInt(1,7),b=a*x,correct=`x≥${x}`;
  const{choices,answer}=makeChoices(correct,[`x>${x}`,`x≤${x}`,`x<${x}`]);
  return{topic:'일차부등식',q:`일차부등식 ${a}x≥${b}의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `부등식도 방정식처럼 양변에 같은 연산을 합니다. (양수로 나눌 때 부등호 방향 유지)`,
      `${a}x ≥ ${b}의 양변을 ${a}로 나눕니다.`,
      `x ≥ ${b}÷${a} = ${x}`,
      `따라서 해는 x ≥ ${x}입니다.`
    ]};
}

function genMidRadical(){
  const r=pick([2,3,5]),a=randInt(2,6),b=randInt(1,a-1),op=pick(['+','−']);
  const ans=op==='+'?a+b:a-b,correct=`${ans===1?'':ans}√${r}`;
  const{choices,answer}=makeChoices(correct,[`${a+b+1}√${r}`,`${Math.max(1,ans-1)}√${r}`,`${ans}√${r+1}`]);
  return{topic:'근호의 계산',q:`${a}√${r} ${op} ${b}√${r}을 간단히 한 것은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `√${r}이 공통으로 있으므로 √${r}을 하나로 묶어 계수끼리만 계산합니다.`,
      `${a}√${r} ${op} ${b}√${r} = (${a}${op==='+'?'+':'−'}${b})×√${r}`,
      `= ${ans}×√${r} = ${correct}`,
      `(주의: √안의 숫자가 같아야 더하거나 뺄 수 있습니다.)`
    ]};
}

function genMidQuadraticEq(){
  const r1=randInt(1,4),r2=randInt(5,8),known=pick([r1,r2]),ans=known===r1?r2:r1;
  const{choices,answer}=makeChoices(String(ans),[ans-1,ans+1,ans+2].filter(v=>v>0).map(String));
  return{topic:'이차방정식',q:`이차방정식 (x−${r1})(x−${r2})=0의 한 근이 ${known}이다. 다른 한 근은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `A×B=0이면 A=0 또는 B=0입니다. 두 인수 중 하나가 반드시 0이 됩니다.`,
      `(x−${r1})=0 또는 (x−${r2})=0`,
      `x=${r1} 또는 x=${r2}가 두 근입니다.`,
      `한 근이 ${known}이라고 했으므로 다른 한 근은 ${ans}입니다.`
    ]};
}

function genMidLinearFunc(){
  const a=pick([-3,-2,-1,1,2,3]),b=randInt(-4,5),ask=pick(['value','intercept']);
  // 표기 정리: a=1→x, a=-1→−x, b=0→생략, b<0→−n
  const axTerm=a===1?'x':a===-1?'−x':`${a}x`;
  const bTerm=b===0?'':b>0?`+${b}`:`−${-b}`;
  const fStr=`${axTerm}${bTerm}`;
  if(ask==='intercept'){
    const{choices,answer}=makeChoices(String(b),[b-1,b+1,a].filter(v=>v!==b).map(String));
    return{topic:'일차함수 y절편',q:`일차함수 y=${fStr}의 그래프의 y절편은?`,choices,answer,meta:middleMeta('mid_func','함수'),
      graph:{type:'linear',a,b},
      sol:[
        `y절편은 그래프가 y축과 만나는 점의 y좌표입니다. x=0을 넣어 구합니다.`,
        `y=(${a})×0${bTerm||'+0'}=${b}`,
        `따라서 y절편은 ${b}입니다. (그래프가 y축과 만나는 높이)`
      ]};
  }
  const x=randInt(-2,4),ans=a*x+b;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+1,ans+2].filter(v=>v!==ans).map(String));
  const xIn=x<0?`(${x})`:x;
  const bAdd=b===0?'':b>0?`+${b}`:`−${-b}`;
  const prodStr=`${a*x}`;
  return{topic:'일차함수',q:`일차함수 f(x)=${fStr}일 때, f(${x})의 값은?`,choices,answer,meta:middleMeta('mid_func','함수'),
    graph:{type:'linear',a,b,x0:x,y0:ans},
    sol:[
      `f(${x})은 x자리에 ${x}를 그대로 넣어 계산하라는 뜻입니다.`,
      `f(${x})=(${a})×${xIn}${bAdd}=${prodStr}${bAdd}=${ans}`,
      `따라서 f(${x})=${ans}입니다.`
    ]};
}

function genMidQuadraticDesc(){
  const a=pick([-1,1]),p=randInt(-2,2),q=randInt(-3,3);
  const eq=`y=${a===1?'':a===-1?'−':a}(x${p===0?'':p>0?`−${p}`:`+${-p}`})²${q===0?'':q>0?`+${q}`:q}`;
  const correct=`꼭짓점은 (${p}, ${q})이다.`;
  const wrongs=[`꼭짓점은 (${-p}, ${q})이다.`,`축은 x=${-p}이다.`,a>0?'위로 볼록하다.':'아래로 볼록하다.'];
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'이차함수 그래프',q:`이차함수 ${eq}의 그래프에 대한 설명으로 옳은 것은?`,choices,answer,graph:{type:'quadratic',a,p,q,ds:p-2,de:p+2},meta:middleMeta('mid_func','함수'),
    sol:[
      `y=a(x−p)²+q 꼴에서 꼭짓점은 (p, q)이고 축의 방정식은 x=p입니다.`,
      `주어진 식에서 p=${p}, q=${q}이므로 꼭짓점은 (${p}, ${q})입니다.`,
      `축의 방정식은 x=${p}입니다. (부호 주의: (x${p>0?`−${p}`:`+${-p}`})에서 p=${p})`,
      `a=${a}${a>0?'이므로 아래로 볼록':'이므로 위로 볼록'}한 포물선입니다.`,
      `따라서 옳은 것은 '꼭짓점은 (${p}, ${q})이다.'입니다.`
    ]};
}

function genMidIsosceles(){
  const top=pick([40,50,70,80,100]),ans=(180-top)/2;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,top].filter(v=>v>0&&v<180&&v!==ans).map(v=>`${v}°`));
  return{topic:'이등변삼각형',q:`AB=AC인 이등변삼각형 ABC에서 ∠A=${top}°일 때, ∠B의 크기는?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    graph:{type:'iso_triangle',apex:top,baseAng:ans},
    sol:[
      `삼각형 세 각의 크기를 모두 더하면 180°입니다.`,
      `AB=AC인 이등변삼각형은 밑각이 서로 같으므로 ∠B=∠C입니다.`,
      `∠B+∠C=180°−∠A=180°−${top}°=${180-top}°`,
      `∠B와 ∠C가 같으므로 ∠B=${180-top}°÷2=${ans}°입니다.`
    ]};
}

// 평행선과 각 (동위각·엇각)  — 그림 필수 유형
function genMidParallel(){
  const g=pick([50,55,65,70,110,115,125,130]);
  const kind=pick(['동위각','엇각']);
  // 동위각·엇각은 크기가 서로 같다
  const ans=g;
  const{choices,answer}=makeChoices(`${ans}°`,[180-g,g+10,Math.abs(g-15)].filter(v=>v>0&&v<180&&v!==ans).slice(0,3).map(v=>`${v}°`));
  return{topic:'평행선과 각',q:`두 직선 l, m이 서로 평행하고 직선 n과 만난다. 그림에서 ∠a=${g}°일 때, ∠a의 ${kind}인 ∠b의 크기는?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    graph:{type:'parallel_lines',ang:g,kind},
    sol:[
      `두 직선 l, m이 평행할 때, ${kind}의 크기는 서로 같습니다.`,
      `따라서 ∠b는 ∠a와 같은 ${g}°입니다.`,
      `참고: 한 점에서 일직선을 이루는 두 각의 합은 180°이므로, ∠a의 이웃한 각은 ${180-g}°입니다.`
    ]};
}

// 순서쌍을 좌표평면에 — 사분면 찾기 (그림 필수 유형)
function genMidQuadrant(){
  const x=pick([-4,-3,-2,2,3,4]),y=pick([-4,-3,-2,2,3,4]);
  const quad=x>0&&y>0?1:x<0&&y>0?2:x<0&&y<0?3:4;
  const ko=['제1사분면','제2사분면','제3사분면','제4사분면'];
  const correct=ko[quad-1];
  const{choices,answer}=makeChoices(correct,ko.filter(v=>v!==correct));
  const xSign=x>0?'양수(+)':'음수(−)', ySign=y>0?'양수(+)':'음수(−)';
  return{topic:'좌표와 사분면',q:`좌표평면 위의 점 P(${x}, ${y})는 제몇 사분면 위의 점인가?`,choices,answer,meta:middleMeta('mid_func','함수'),
    graph:{type:'point_plot',px:x,py:y},
    sol:[
      `점의 좌표는 (x좌표, y좌표) 순서로 읽습니다. 여기서 x=${x}, y=${y}입니다.`,
      `x좌표 ${x}는 ${xSign}, y좌표 ${y}는 ${ySign}입니다.`,
      `x가 ${x>0?'오른쪽':'왼쪽'}, y가 ${y>0?'위쪽':'아래쪽'}이므로 점 P는 ${correct}에 있습니다.`
    ]};
}

function genMidSimilarity(){
  const scale=pick([2,3]),small=randInt(2,6),ans=small*scale;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+2,small+scale].filter(v=>v>0).map(String));
  return{topic:'닮음',q:`서로 닮은 두 삼각형의 닮음비가 1:${scale}이다. 작은 삼각형의 한 변이 ${small}cm일 때 대응하는 큰 삼각형의 변의 길이는?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    sol:[
      `닮음비 1:${scale}은 '작은 도형의 변 길이 × ${scale} = 큰 도형의 변 길이'를 뜻합니다.`,
      `작은 삼각형의 변이 ${small}cm이므로 큰 삼각형의 대응하는 변 = ${small} × ${scale} = ${ans}cm`,
      `따라서 정답은 ${ans}cm입니다.`
    ]};
}

function genMidTrig(){
  // 직각삼각형 ABC: 직각은 C, 각 B를 기준으로 삼각비를 구한다.
  // 변: BC = 밑변(각 B에 이웃) = adj, AC = 높이(각 B의 대변) = opp, AB = 빗변 = hyp
  const tri=pick([[3,4,5],[5,12,13],[8,15,17]]); // 서로소 삼각수만 사용(기약분수 보장)
  const[opp,adj,hyp]=tri; // opp=AC(높이), adj=BC(밑변), hyp=AB(빗변)
  const kind=pick(['sin','cos','tan']);
  // 각 B 기준: sinB=대변/빗변=opp/hyp, cosB=이웃변/빗변=adj/hyp, tanB=대변/이웃변=opp/adj
  const correct=kind==='sin'?`${opp}/${hyp}`:kind==='cos'?`${adj}/${hyp}`:`${opp}/${adj}`;
  const pool=[`${opp}/${hyp}`,`${adj}/${hyp}`,`${opp}/${adj}`,`${adj}/${opp}`].filter(v=>v!==correct);
  const{choices,answer}=makeChoices(correct,pool);
  const desc=kind==='sin'?'sin은 (높이)/(빗변)':kind==='cos'?'cos은 (밑변)/(빗변)':'tan은 (높이)/(밑변)';
  const num=kind==='sin'?opp:kind==='cos'?adj:opp;
  const den=kind==='sin'?hyp:kind==='cos'?hyp:adj;
  return{topic:'삼각비',q:`그림과 같은 직각삼각형 ABC에서 ∠C=90°이고 BC=${adj}, AC=${opp}, AB=${hyp}일 때, ${kind} B의 값은?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    graph:{type:'right_triangle',adj,opp,hyp},
    sol:[
      `각 B를 기준으로 봅니다. 직각(∠C=90°)의 맞은편 변 AB=${hyp}가 빗변입니다.`,
      `각 B에 이웃한 변(밑변)은 BC=${adj}, 각 B의 맞은편 변(높이)은 AC=${opp}입니다.`,
      `${desc} 이므로 ${kind} B = ${num}/${den}입니다.`,
      `따라서 정답은 ${correct}입니다.`
    ]};
}

function genMidCircleAngle(){
  const ins=pick([30,35,40,45,50]),ask=pick(['center','same']);
  const ans=ask==='center'?ins*2:ins;
  const q=ask==='center'?`원에서 같은 호 AB를 보는 원주각이 ${ins}°일 때 중심각의 크기는?`:`원 위의 두 점 C, D가 같은 호 AB를 볼 때, ∠ACB=${ins}°이면 ∠ADB의 크기는?`;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,ins*2].filter(v=>v!==ans&&v>0).map(v=>`${v}°`));
  return{topic:ask==='center'?'원주각과 중심각':'같은 호의 원주각',q,choices,answer,meta:middleMeta('mid_geo','기하'),
    sol:ask==='center'?[
      `원주각과 중심각의 관계: 중심각 = 원주각 × 2`,
      `같은 호 AB를 보는 원주각이 ${ins}°이므로 중심각 = ${ins}°× 2 = ${ans}°`,
      `따라서 중심각의 크기는 ${ans}°입니다.`
    ]:[
      `같은 호를 보는 원주각의 크기는 모두 같습니다.`,
      `∠ACB와 ∠ADB는 모두 같은 호 AB에 대한 원주각입니다.`,
      `따라서 ∠ADB = ∠ACB = ${ins}°입니다.`
    ]};
}

function genMidProbability(){
  const total=pick([8,10,12]),fav=pick([2,3,4,5]),g=gcdFn(fav,total),correct=`${fav/g}/${total/g}`;
  const wrongs=[];
  for(const n of[1,fav-1,fav+1,total-fav]){
    if(n<=0||n>=total||n*total===fav*total)continue;
    const gg=gcdFn(n,total),s=`${n/gg}/${total/gg}`;
    if(s!==correct&&!wrongs.includes(s))wrongs.push(s);
  }
  const{choices,answer}=makeChoices(correct,wrongs);
  const g2=gcdFn(fav,total);
  return{topic:'확률',q:`모양과 크기가 같은 공 ${total}개 중 빨간 공이 ${fav}개이다. 한 개를 꺼낼 때 빨간 공이 나올 확률은?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),
    sol:[
      `확률 = (원하는 경우의 수) ÷ (전체 경우의 수)`,
      `전체 경우의 수: 공 ${total}개 중 1개를 꺼내는 방법 = ${total}가지`,
      `빨간 공이 나오는 경우의 수: ${fav}가지`,
      `확률 = ${fav}/${total}${g2>1?` = ${fav/g2}/${total/g2} (분자·분모를 ${g2}로 약분)`:''}`,
      `따라서 정답은 ${correct}입니다.`
    ]};
}

function genMidCounting(){
  const a=randInt(2,5),b=randInt(2,4),ans=a*b;
  const{choices,answer}=makeChoices(String(ans),[a+b,ans-1,ans+2].filter(v=>v!==ans).map(String));
  return{topic:'경우의 수',q:`윗옷 ${a}벌과 바지 ${b}벌 중에서 각각 하나씩 골라 입는 경우의 수는?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),
    sol:[
      `두 가지 선택을 동시에 할 때는 곱의 법칙: (윗옷 수) × (바지 수)를 씁니다.`,
      `윗옷 ${a}벌 중 1벌 선택: ${a}가지`,
      `바지 ${b}벌 중 1벌 선택: ${b}가지`,
      `전체 경우의 수: ${a} × ${b} = ${ans}가지`
    ]};
}

function genMidRepresentative(){
  const kind=pick(['평균','중앙값','최빈값']);
  let data,ans,sol;
  if(kind==='평균'){
    const m=randInt(4,8);data=[m-2,m,m+1,m+1];ans=m;
    const sum=(m-2)+m+(m+1)+(m+1);
    sol=[
      `평균 = (모든 자료의 합) ÷ (자료의 개수)`,
      `합: ${data.join('+')} = ${sum}`,
      `자료의 개수: ${data.length}개`,
      `평균 = ${sum} ÷ ${data.length} = ${ans}`
    ];
  }else if(kind==='중앙값'){
    data=shuffle([2,4,5,7,9]);const sorted=[2,4,5,7,9];ans=5;
    sol=[
      `중앙값: 자료를 크기 순서대로 늘어놓았을 때 가운데 값입니다.`,
      `크기 순서로 정렬: ${sorted.join(', ')}`,
      `자료 5개이므로 가운데(3번째) 값 = ${ans}`,
      `따라서 중앙값은 ${ans}입니다.`
    ];
  }else{
    data=shuffle([3,5,5,5,7,8]);ans=5;
    sol=[
      `최빈값: 자료에서 가장 많이 나타나는 값입니다.`,
      `자료: ${[3,5,5,5,7,8].join(', ')}`,
      `3은 1번, 5는 3번, 7은 1번, 8은 1번 나타납니다.`,
      `가장 많이 나오는 값은 5(3번)이므로 최빈값 = ${ans}`
    ];
  }
  const{choices,answer}=makeChoices(String(ans),[ans-1,ans+1,ans+2].map(String));
  return{topic:kind,q:`자료 ${data.join(', ')}의 ${kind}은?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),sol};
}

function genMidFrequency(){
  const rows=[{label:'0 이상~10 미만',n:3},{label:'10 이상~20 미만',n:7},{label:'20 이상~30 미만',n:6},{label:'30 이상~40 미만',n:4}];
  const ans=rows[2].n+rows[3].n;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+1,ans+2].map(String));
  return{topic:'도수분포표',q:`통학 시간별 학생 수가 0~10분 3명, 10~20분 7명, 20~30분 6명, 30~40분 4명일 때, 20분 이상인 학생 수는?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),
    sol:[
      `'20분 이상'이란 20분~30분 구간과 30분~40분 구간을 모두 포함합니다.`,
      `20~30분 구간: ${rows[2].n}명`,
      `30~40분 구간: ${rows[3].n}명`,
      `합계: ${rows[2].n} + ${rows[3].n} = ${ans}명`,
      `따라서 20분 이상인 학생 수는 ${ans}명입니다.`
    ]};
}

function genMidTranslate(){
  const px=pick([-3,-2,-1,1,2,3]),py=pick([-3,-2,-1,1,2,3]);
  const dx=pick([-3,-2,-1,1,2,3]),dy=pick([-3,-2,-1,1,2,3]);
  const rx=px+dx,ry=py+dy;
  const askX=Math.random()<0.5;
  const ans=askX?rx:ry;
  const wrong=[ans+1,ans-1,ans+2].filter(w=>w!==ans).slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(ans),wrong);
  const dxStr=dx>=0?`+${dx}`:String(dx),dyStr=dy>=0?`+${dy}`:String(dy);
  return{topic:'좌표평면 — 평행이동',q:`좌표평면 위의 점 P(${px}, ${py})를 x축 방향으로 ${dx}만큼, y축 방향으로 ${dy}만큼 평행이동한 점의 ${askX?'x':'y'}좌표는?`,choices,answer,
    meta:middleMeta('mid_func','함수'),
    graph:{type:'translate_point',px,py,dx,dy,rx,ry},
    sol:[
      `평행이동: x좌표에 x방향 이동량, y좌표에 y방향 이동량을 더합니다.`,
      `P(${px}, ${py}) → (${px}${dxStr}, ${py}${dyStr}) = (${rx}, ${ry})`,
      `따라서 이동한 점의 ${askX?'x':'y'}좌표는 ${ans}입니다.`
    ]};
}

function genMidSymmetryPoint(){
  const px=pick([-3,-2,-1,1,2,3]),py=pick([-3,-2,-1,1,2,3]);
  const sym=pick(['x축','y축','원점']);
  let rx,ry;
  if(sym==='x축'){rx=px;ry=-py;}
  else if(sym==='y축'){rx=-px;ry=py;}
  else{rx=-px;ry=-py;}
  const askX=Math.random()<0.5;
  const ans=askX?rx:ry;
  const wrong=[ans+1,ans-1,ans+2].filter(w=>w!==ans).slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(ans),wrong);
  return{topic:'좌표평면 — 대칭이동',q:`좌표평면 위의 점 P(${px}, ${py})를 ${sym}에 대하여 대칭이동한 점의 ${askX?'x':'y'}좌표는?`,choices,answer,
    meta:middleMeta('mid_func','함수'),
    graph:{type:'symmetry_point',px,py,rx,ry,sym},
    sol:[
      sym==='x축'?`x축 대칭: x좌표는 그대로, y좌표의 부호를 바꿉니다.`:
      sym==='y축'?`y축 대칭: y좌표는 그대로, x좌표의 부호를 바꿉니다.`:
      `원점 대칭: x좌표와 y좌표 모두 부호를 바꿉니다.`,
      `P(${px}, ${py}) → (${rx}, ${ry})`,
      `따라서 대칭이동한 점의 ${askX?'x':'y'}좌표는 ${ans}입니다.`
    ]};
}

var MID_DOMAIN_GENS={
  '수와 연산':()=>weightedGen([[genMidPrime,4],[genMidNumber,3],[genMidRepeating,3],[genMidExponent,3]]),
  '문자와 식':()=>weightedGen([[genMidLinearEq,4],[genMidSystem,4],[genMidInequality,3],[genMidSubstitute,3],[genMidWordExpr,3],[genMidRadical,4],[genMidQuadraticEq,4]]),
  '함수':()=>weightedGen([[genMidLinearFunc,5],[genMidQuadraticDesc,5],[genMidQuadrant,3],[genMidTranslate,3],[genMidSymmetryPoint,3]]),
  '기하':()=>weightedGen([[genMidIsosceles,4],[genMidSimilarity,4],[genMidTrig,5],[genMidCircleAngle,4],[genMidParallel,4]]),
  '확률과 통계':()=>weightedGen([[genMidProbability,5],[genMidCounting,4],[genMidRepresentative,5],[genMidFrequency,3]])
};

function genMiddleMock(domain){
  const key=domain||pick(Object.keys(MID_DOMAIN_GENS));
  return MID_DOMAIN_GENS[key]();
}
