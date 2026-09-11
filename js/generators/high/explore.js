// === js/generators/high/explore.js ===
/* --------------------------------------------------------------------
   그래프 탐험용 퀴즈 생성기
   무리·유리·이차함수 · 두 점 거리 · 원 · 대칭이동 6종
   -------------------------------------------------------------------- */

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
    /* 계수 1은 감추고 0인 항은 빼서 사람이 쓰는 모양으로 적는다 (1x, +0 방지) */
    const lineStr=_pl([[la,'x'],[lb,'y'],[lc,'']]);
    const p=v=>v<0?`(${v})`:String(v);
    const t1=la*x0,t2=lb*y0;
    const sol=[
      `점과 직선 거리 공식: 직선 ax+by+c=0과 점(x₀,y₀) → 거리 = |ax₀+by₀+c| ÷ √(a²+b²)`,
      `a=${la}, b=${lb}, c=${lc}, 점=(${x0}, ${y0}) 대입`,
      `분자: |${p(la)}×${p(x0)} + ${p(lb)}×${p(y0)} + ${p(lc)}| = |${_add(t1,t2,lc)}| = ${num}`,
      `분모: √(${p(la)}²+${p(lb)}²) = √(${la**2}+${lb**2}) = √${denSq}`,
      `거리 = ${num}/√${denSq} = ${correct}`
    ];
    return{topic:'점과 직선 거리',q:`점 (${x0}, ${y0})에서 직선 ${lineStr} = 0까지의 거리는?`,choices,answer,graph:{type:'distance',ptX:x0,ptY:y0,la,lb,lc},sol};
  }
  return{topic:'점과 직선 거리',q:'점 (3, 1)에서 직선 3x − 4y + 5 = 0까지의 거리는?',choices:['2','8/5','3','12/5'],answer:0,
    graph:{type:'distance',ptX:3,ptY:1,la:3,lb:-4,lc:5},
    sol:[
      `점과 직선 거리 공식: 직선 ax+by+c=0과 점(x₀,y₀) → 거리 = |ax₀+by₀+c| ÷ √(a²+b²)`,
      `a=3, b=−4, c=5, 점=(3, 1) 대입`,
      `분자: |3×3+(−4)×1+5| = |9−4+5| = 10`,
      `분모: √(3²+(−4)²) = √(9+16) = √25 = 5`,
      `거리 = 10 ÷ 5 = 2`
    ]};
}

function genCircleQ(){
  const h=randInt(-3,3),k=randInt(-3,3),r=randInt(1,4),r2=r*r;
  const hEq=fmtCircleTerm(h,'x'),kEq=fmtCircleTerm(k,'y');
  const eq=`${hEq}+${kEq}=${r2}`;
  const qt=pick(['eq','center','radius']);
  const hSign=h===0?'':(h>0?`−${h}`:`+${-h}`);
  const kSign=k===0?'':(k>0?`−${k}`:`+${-k}`);
  if(qt==='eq'){
    const correct=eq;
    const ws=circleWrongs(h,k,r2,correct);
    const{choices,answer}=makeChoices(correct,ws);
    return{topic:'원의 방정식',q:`중심이 (${h}, ${k})이고 반지름이 ${r}인 원의 방정식은?`,choices,answer,graph:{type:'circle',h,k,r},
      sol:[
        `원의 방정식 기본형: 중심 (a, b), 반지름 r → (x−a)²+(y−b)²=r²`,
        `중심 (${h}, ${k}), 반지름 ${r}을 대입합니다.`,
        `(x${hSign})²+(y${kSign})² = ${r}² = ${r2}`,
        `따라서 방정식은 ${eq}입니다.`
      ]};
  }
  if(qt==='center'){
    const correct=`(${h}, ${k})`;
    const ws=[`(${-h}, ${k})`,`(${h}, ${-k})`,`(${-h}, ${-k})`].filter(w=>w!==correct);
    if(ws.length<3)ws.push(`(${h+1}, ${k})`);
    const{choices,answer}=makeChoices(correct,ws.slice(0,3));
    return{topic:'원의 방정식',q:`원 ${eq}의 중심의 좌표는?`,choices,answer,graph:{type:'circle',h,k,r},
      sol:[
        `원의 방정식 (x−a)²+(y−b)²=r²에서 중심은 (a, b)입니다.`,
        `${eq}를 보면 x항이 (x${hSign})² → a=${h}, y항이 (y${kSign})² → b=${k}`,
        `(주의: ${fmtCircleTerm(h,'x')}이면 중심 x좌표는 ${h}입니다. 부호를 바꾸지 마세요!)`,
        `따라서 중심의 좌표는 (${h}, ${k})입니다.`
      ]};
  }
  const correct=String(r);
  const ws2=[String(r2),String(r+1),String(r>1?r-1:r+2)].filter(w=>w!==correct);
  if(ws2.length<3)ws2.push(String(r+3));
  const{choices,answer}=makeChoices(correct,ws2.slice(0,3));
  return{topic:'원의 방정식',q:`원 ${eq}에서 반지름의 길이는?`,choices,answer,graph:{type:'circle',h,k,r},
    sol:[
      `원의 방정식 (x−a)²+(y−b)²=r²에서 우변이 r²입니다.`,
      `${eq}에서 우변이 ${r2}이므로 r² = ${r2}`,
      `r = √${r2} = ${r}`,
      `따라서 반지름의 길이는 ${r}입니다.`
    ]};
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
