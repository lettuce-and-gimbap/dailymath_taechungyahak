// === js/generators/high/geometry.js ===
/* --------------------------------------------------------------------
   고졸 ③ 도형의 방정식
   두 점 거리 · 내분점 · 직선 · 원 · 평행이동 · 대칭이동
   -------------------------------------------------------------------- */

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
  const pn=v=>v<0?`(${v})`:String(v);
  return{topic:'두 점 거리',q:`좌표평면 위의 두 점 A(${x1}, ${y1}), B(${x2}, ${y2}) 사이의 거리는?`,choices,answer,graph:{type:'two_point',x1,y1,x2,y2},meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
    sol:[
      `두 점 A(x₁,y₁), B(x₂,y₂) 사이의 거리 = √((x₂−x₁)²+(y₂−y₁)²)`,
      `x의 차: ${x2}−${pn(x1)} = ${x2-x1},  y의 차: ${y2}−${pn(y1)} = ${y2-y1}`,
      `거리 = √(${pn(x2-x1)}²+${pn(y2-y1)}²) = √(${(x2-x1)**2}+${(y2-y1)**2}) = √${(x2-x1)**2+(y2-y1)**2}`,
      `= ${correct}입니다.`
    ]};
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
      `P=(${m}×${pn(b)}+${n}×${pn(a)})÷(${m}+${n})=(${_add(m*b,n*a)})÷${m+n}=${m*b+n*a}÷${m+n}=${p}`,
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
      `x좌표=(${m}×${pn(bx)}+${n}×${pn(ax)})÷${s}=(${_add(m*bx,n*ax)})÷${s}=${m*bx+n*ax}÷${s}=${px}`,
      `y좌표=(${m}×${pn(by)}+${n}×${pn(ay)})÷${s}=(${_add(m*by,n*ay)})÷${s}=${m*by+n*ay}÷${s}=${py}`,
      `따라서 내분점의 좌표는 (${px}, ${py})입니다.`
    ]};
}

// 3-4. 직선의 방정식 (기울기+점)  (기출 Q12 패턴A)
function gen_line_eq(){
  const slope=pick([-2,-1,1,2]),px=pick([0,1,2,-1]),py=randInt(-3,4);
  const b=py-slope*px;
  const correct=_fmtLine(slope,b);
  /* 오답 후보를 넉넉히 준다. 모자라면 makeChoices 가 숫자를 기계적으로 바꿔
     "y=x+0" 같은 어색한 보기를 만들기 때문이다. */
  const w=[...new Set([_fmtLine(slope,b+1),_fmtLine(slope,b-1),_fmtLine(-slope,b),
    _fmtLine(slope,b+2),_fmtLine(-slope,b+1)])].filter(x=>x!==correct);
  const{choices,answer}=makeChoices(correct,w);
  const pn=v=>v<0?`(${v})`:String(v);
  return{topic:'직선 방정식',q:`기울기가 ${slope}이고 점 (${px}, ${py})를 지나는 직선의 방정식은?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
    sol:[
      `직선의 방정식 기본형: y = (기울기)×x + (y절편)`,
      `기울기 = ${slope}, 점 (${px}, ${py})를 지나므로 y절편 b를 구합니다.`,
      `점을 대입: ${py} = ${slope}×${pn(px)} + b → ${py} = ${slope*px} + b → b = ${py}−${pn(slope*px)} = ${b}`,
      `따라서 방정식은 ${correct}입니다.`
    ]};
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
  const refLine=_fmtLine(slope,refB);            // 계수 −1 이 "-1x" 로 찍히지 않게
  const correct=_fmtLine(intNewSlope,b);
  const w=[...new Set([_fmtLine(intNewSlope,b+1),_fmtLine(intNewSlope,b-1),_fmtLine(slope,b),
    _fmtLine(-intNewSlope,b),_fmtLine(intNewSlope,b+2)])].filter(x=>x!==correct);
  const{choices,answer}=makeChoices(correct,w);
  const desc=isParallel?`직선 ${refLine}에 평행하고 점 (${px}, ${py})를 지나는`:`직선 ${refLine}에 수직이고 점 (${px}, ${py})를 지나는`;
  const pnv=v=>v<0?`(${v})`:String(v);
  const yintercept_calc=`${py}−${pnv(intNewSlope)}×${pnv(px)}=${_add(py,-(intNewSlope*px))}=${b}`;
  return{topic:isParallel?'평행 직선':'수직 직선',q:`${desc} 직선의 방정식은?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
    sol:isParallel?[
      `평행한 직선은 기울기가 같습니다. 기준 직선의 기울기 = ${slope}`,
      `구하는 직선의 기울기도 ${slope}입니다.`,
      `점 (${px}, ${py})를 지나므로 y절편 b를 구합니다: ${py} = ${pnv(slope)}×${pnv(px)} + b → b = ${b}`,
      `따라서 방정식은 ${correct}입니다.`
    ]:[
      `수직인 직선의 기울기: 기준 기울기 ${slope}의 역수이고 부호를 바꿉니다. → ${intNewSlope}`,
      `(두 직선의 기울기 곱 = −1: ${slope} × ${intNewSlope} = ${slope*intNewSlope})`,
      `점 (${px}, ${py})를 지나므로 y절편 b를 구합니다: ${yintercept_calc}`,
      `따라서 방정식은 ${correct}입니다.`
    ]};
}

// 3-6. 평행이동  (기출 Q14 패턴A)
function gen_translation(){
  const x=randInt(-2,4),y=randInt(-2,4);
  const px=randInt(-3,4),py=randInt(-3,4);
  const rx=x+px,ry=y+py;
  const correct=`(${rx}, ${ry})`;
  const w=[`(${rx+1}, ${ry})`,`(${rx}, ${ry-1})`,`(${x}, ${y})`].filter(w=>w!==correct);
  const{choices,answer}=makeChoices(correct,w);
  return{topic:'평행이동',q:`좌표평면 위의 점 (${x}, ${y})를 x축의 방향으로 ${px}만큼, y축의 방향으로 ${py}만큼 평행이동한 점의 좌표는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
    sol:[
      `평행이동: x축으로 a만큼, y축으로 b만큼 옮기면 → (x+a, y+b)`,
      `원래 점 (${x}, ${y})에서 x방향으로 ${px}, y방향으로 ${py} 이동`,
      `x좌표: ${x}+(${px}) = ${rx}`,
      `y좌표: ${y}+(${py}) = ${ry}`,
      `따라서 이동한 점의 좌표는 ${correct}입니다.`
    ]};
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
    const axisDesc=axis==='x'?`x축에 접하면 반지름 = 중심의 y좌표의 절댓값 = |${k}| = ${r}`:`y축에 접하면 반지름 = 중심의 x좌표의 절댓값 = |${h}| = ${r}`;
    return{topic:'원의 방정식',q:`중심의 좌표가 (${h}, ${k})이고 ${axis}축에 접하는 원의 방정식은?`,choices,answer,graph:{type:'circle',h,k,r},meta:{category:'geometry',type:'도형과 기하',diff:'기하'},
      sol:[
        `원의 방정식 기본형: (x−h)²+(y−k)²=r² (중심 (h,k), 반지름 r)`,
        axisDesc,
        `중심 (${h},${k}), r=${r} → 방정식: ${correct}`,
        `따라서 정답은 ${correct}입니다.`
      ]};
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
    return{topic:'직선과 원',q:`자연수 a에 대하여 직선 y=a와 원 x²+y²=${r*r}이 한 점에서 만날 때, a의 값은?`,choices,answer,
      graph:{type:'circle_line',h:0,k:0,r,lineType:'h',lineVal:r},
      meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
      sol:[
        `원 x²+y²=${r*r}의 중심은 원점(0,0), 반지름은 √${r*r}=${r}입니다.`,
        `직선 y=a와 원이 한 점에서 만난다 = 접한다 = 중심에서 직선까지의 거리 = 반지름`,
        `직선 y=a와 원점 사이의 거리 = |a|이므로 |a| = ${r}`,
        `a는 자연수이므로 a = ${r}입니다.`
      ]};
  }
  // 직선 x=a와 원이 만나지 않을 때 a<N인 자연수
  const N=r+2;
  const aVal=r+1;
  const{choices,answer}=makeChoices(String(aVal),[aVal-1<r?aVal+1:aVal-1,aVal+1,r].filter(w=>w!==aVal&&w>0).slice(0,3).map(String));
  return{topic:'직선과 원',q:`직선 x=a와 원 x²+y²=${r*r}이 만나지 않을 때, a<${N}인 자연수 a의 값은?`,choices,answer,
    graph:{type:'circle_line',h:0,k:0,r,lineType:'v',lineVal:aVal},
    meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
    sol:[
      `원 x²+y²=${r*r}의 중심은 원점(0,0), 반지름은 ${r}입니다.`,
      `직선 x=a와 원점 사이의 거리 = |a|입니다.`,
      `만나지 않으려면 거리 > 반지름: |a| > ${r} → a > ${r} (자연수이므로 a ≥ ${r+1})`,
      `a < ${N}인 자연수 조건과 함께: a = ${aVal}입니다.`
    ]};
}

// 3-9. 대칭이동  (기출 Q14 패턴B)
function gen_symmetry_pt(){
  const q=genSymmetryQ();
  const{graph:{px,py,sym}}=q;
  const symMap={'x축':[px,-py],'y축':[-px,py],'원점':[-px,-py],'y=x':[py,px],'y=-x':[-py,-px]};
  const [rx,ry]=symMap[sym]||[px,py];
  const solMap={
    'x축':`x축 대칭: x좌표는 그대로, y좌표 부호를 바꿉니다. (${px},${py}) → (${px},${-py})`,
    'y축':`y축 대칭: x좌표 부호를 바꾸고, y좌표는 그대로입니다. (${px},${py}) → (${-px},${py})`,
    '원점':`원점 대칭: x, y 좌표 모두 부호를 바꿉니다. (${px},${py}) → (${-px},${-py})`,
    'y=x':`y=x 대칭: x좌표와 y좌표를 서로 바꿉니다. (${px},${py}) → (${py},${px})`,
    'y=-x':`y=−x 대칭: x, y를 서로 바꾸고 부호도 바꿉니다. (${px},${py}) → (${-py},${-px})`
  };
  return{...q,meta:{category:'geometry',type:'도형과 기하',diff:'기하'},
    sol:[
      `대칭이동 규칙을 적용합니다.`,
      solMap[sym]||`${sym} 대칭이동 규칙을 적용합니다.`,
      `따라서 대칭이동한 점의 좌표는 (${rx}, ${ry})입니다.`
    ]};
}

// 3-10. 지름 끝점 → 원의 방정식  (기출 Q13: 2021-2회)
// ※ 반지름이 항상 자연수가 되도록 서로소 피타고라스 삼각수 기반 쌍만 사용
function gen_circle_diameter_pts(){
  const PAIRS=[
    {A:[-2,0],B:[2,0],h:0,k:0,r:2,r2:4},
    {A:[0,-2],B:[4,-2],h:2,k:-2,r:2,r2:4},
    {A:[-2,1],B:[2,1],h:0,k:1,r:2,r2:4},
    {A:[0,0],B:[0,4],h:0,k:2,r:2,r2:4},
    {A:[1,1],B:[5,1],h:3,k:1,r:2,r2:4},
    {A:[-3,0],B:[3,0],h:0,k:0,r:3,r2:9},
    {A:[-1,2],B:[5,2],h:2,k:2,r:3,r2:9},
    {A:[0,-1],B:[6,-1],h:3,k:-1,r:3,r2:9},
    {A:[-3,-4],B:[3,4],h:0,k:0,r:5,r2:25},
    {A:[-4,-3],B:[4,3],h:0,k:0,r:5,r2:25},
    {A:[0,-4],B:[6,4],h:3,k:0,r:5,r2:25},
    {A:[-3,0],B:[3,8],h:0,k:4,r:5,r2:25},
  ];
  const{A,B,h,k,r,r2}=pick(PAIRS);
  const hEq=fmtCircleTerm(h,'x'),kEq=fmtCircleTerm(k,'y');
  const correct=`${hEq}+${kEq}=${r2}`;
  const ws=circleWrongs(h,k,r2,correct,[`${hEq}+${kEq}=${r2-2}`,`${hEq}+${kEq}=${r2+2}`]);
  const{choices,answer}=makeChoices(correct,ws.slice(0,3));
  const pn=v=>v<0?`(${v})`:String(v);
  const h2=(A[0]+B[0]),k2=(A[1]+B[1]);
  return{topic:'원의 방정식(지름)',q:`두 점 A(${A[0]}, ${A[1]}), B(${B[0]}, ${B[1]})을 지름의 양 끝 점으로 하는 원의 방정식은?`,choices,answer,graph:{type:'circle',h,k,r},meta:{category:'geometry',type:'도형과 기하',diff:'기하'},
    sol:[
      `지름의 두 끝점 A(${A[0]},${A[1]}), B(${B[0]},${B[1]})이 주어지면 → 중심 = 두 점의 중점입니다.`,
      `중심 x좌표: (${_add(A[0],B[0])})÷2=${h2}÷2=${h},  y좌표: (${_add(A[1],B[1])})÷2=${k2}÷2=${k}`,
      `반지름 r = 중심~A 거리 = √((${h}−${pn(A[0])})²+(${k}−${pn(A[1])})²) = √${r2} = ${r}`,
      `원의 방정식: (x중심이 ${h}, y중심이 ${k}, r=${r}) → ${correct}`,
      `따라서 정답은 ${correct}입니다.`
    ]};
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
  const symDesc={'x축':`x축 대칭: 중심의 y좌표 부호만 바꿉니다. (${h},${k}) → (${nh},${nk})`,'y축':`y축 대칭: 중심의 x좌표 부호만 바꿉니다. (${h},${k}) → (${nh},${nk})`,'원점':`원점 대칭: 중심의 x, y 좌표 모두 부호를 바꿉니다. (${h},${k}) → (${nh},${nk})`};
  return{topic:'원의 대칭이동',q:`원 ${origEq}을 ${sym}에 대하여 대칭이동한 도형의 방정식은?`,choices,answer,graph:{type:'circle',h:nh,k:nk,r},meta:{category:'geometry',type:'도형과 기하',diff:'기하'},
    sol:[
      `원을 대칭이동해도 반지름은 그대로이고, 중심의 좌표만 바뀝니다.`,
      symDesc[sym],
      `새 중심 (${nh},${nk}), 반지름 ${r} → 방정식: ${correct}`,
      `따라서 정답은 ${correct}입니다.`
    ]};
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
  const lineStr=_pl([[a,'x'],[b,'y'],[c,'']]);   // 계수 1이 "1x" 로 찍히지 않게
  // 같은 dist값이 여러 케이스에 있을 수 있으므로 완전히 다른 값만 오답으로
  const wrongs=[...new Set(CASES.filter(x=>x.dist!==dist).map(x=>x.dist))].slice(0,3);
  const{choices,answer}=makeChoices(dist,wrongs);
  return{topic:'원점→직선 거리',q:`원점과 직선 ${lineStr}=0 사이의 거리는?`,choices,answer,meta:{category:'geometry',type:'도형과 기하',diff:'기초'},
    sol:[
      `점 (x₀,y₀)에서 직선 Ax+By+C=0까지의 거리 = |Ax₀+By₀+C|÷√(A²+B²)`,
      `원점 (0,0)을 대입: 거리 = |${a}×0+${b}×0${cStr}|÷√(${a}²+${b}²)`,
      `= |${c}|÷√${a*a+b*b} = ${Math.abs(c)}÷√${a*a+b*b}`,
      `= ${dist}입니다.`
    ]};
}

// 기하 디스패처
function genMockInternalPt(){return gen_internal_2d();}

function genMockLine(){return gen_line_eq();}

function genMockGeometry(){
  const gens=[
    [gen_two_point_dist,4],[gen_internal_1d,2],[gen_internal_2d,4],
    [gen_line_eq,4],[gen_parallel_perp_line,5],
    [()=>({...genDistanceQ(),meta:{category:'geometry',type:'도형과 기하',diff:'기하'}}),2],
    [gen_circle_eq_mock,5],[gen_circle_line_rel,2],[gen_symmetry_pt,5],
    [gen_circle_diameter_pts,3],[gen_circle_sym_move,2],[gen_origin_line_dist,2]
  ];
  return weightedGen(gens.map(([f,w])=>[()=>{try{return f();}catch(e){return gen_line_eq();}},w]));
}
