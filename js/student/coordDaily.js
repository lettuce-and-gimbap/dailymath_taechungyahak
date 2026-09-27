// === js/student/coordDaily.js ===
/* --------------------------------------------------------------------
   매일 좌표 10문제
   하 : 좌표 위치 읽기 / 중 : 평행이동 / 상 : 대칭이동

   설계 원칙
   - 평행이동·대칭이동 문제에서 <b>옮겨진 점은 그림에 그리지 않는다</b>.
     그림에 답이 보이면 학생이 규칙을 익히지 않고 눈으로 세어 버린다.
     대신 정답을 확인한 뒤(피드백 화면)에 옮겨진 점을 초록색으로 보여 준다.
   - 사지선다. 오답 보기는 부호를 뒤집거나 x·y를 맞바꾼 것으로 만들어
     "부호 규칙"과 "순서"를 정확히 아는지 확인한다 (GS.coordChoices).
   - 한 번에 한 문제만 보여 준다(one-at-a-time). 그래야 문항별 소요 시간이
     의미 있는 값으로 기록된다(js/core/logMetrics.js 참고).
   -------------------------------------------------------------------- */

// Tailwind CDN이 훑어갈 수 있도록 클래스 이름은 조합하지 않고 통째로 적어 둔다
var COORD_LEVELS=[
  {k:'low', badge:'기초 1', logName:'하', lbl:'좌표 위치 읽기', desc:'그림 속 점의 좌표를 읽습니다',
    border:'border-emerald-200', chip:'bg-emerald-100 text-emerald-700'},
  {k:'mid', badge:'기초 2', logName:'중', lbl:'평행이동',       desc:'점을 옆으로·위아래로 밀어 봅니다',
    border:'border-sky-200', chip:'bg-sky-100 text-sky-700'},
  {k:'high',badge:'기초 3', logName:'상', lbl:'대칭이동',       desc:'점을 접는선에 따라 접어 봅니다',
    border:'border-violet-200', chip:'bg-violet-100 text-violet-700'},
  {k:'mix', badge:'섞기', logName:'섞기', lbl:'기초 문제 혼합 학습',  desc:'기초 1 · 2 · 3을 골고루',
    border:'border-amber-200', chip:'bg-amber-100 text-amber-700'},
  {k:'rat', badge:'응용 1', logName:'최상 유리함수', lbl:'유리함수 평행이동', desc:'점근선이 어디로 얼마나 밀렸는지 봅니다',
    border:'border-rose-300', chip:'bg-rose-100 text-rose-700'},
  {k:'irr', badge:'응용 2', logName:'최상 무리함수', lbl:'무리함수 평행이동', desc:'그래프가 시작하는 점이 어디로 얼마나 밀렸는지 봅니다',
    border:'border-rose-300', chip:'bg-rose-100 text-rose-700'},
  {k:'quad',badge:'응용 3', logName:'최상 이차함수', lbl:'이차함수 최댓값 · 최솟값', desc:'정해진 범위에서 가장 큰 값·작은 값을 찾습니다',
    border:'border-rose-300', chip:'bg-rose-100 text-rose-700'},
];

/* 좌표 보기 만들기 — GS.coordChoices는 학습지(KaTeX)용이라 "(1,\ -2)" 처럼
   수식 표기가 섞여 있다. 학생 화면에서는 그대로 읽히는 글자여야 하므로 따로 만든다.
   오답은 x·y 자리 바꾸기 / 부호 뒤집기 / 한 칸 밀기 — 실제로 학생이 하는 실수들. */
function coordChoicesPlain(X,Y){
  const f=(a,b)=>`(${a}, ${b})`;
  const correct=f(X,Y);
  const cands=[f(Y,X),f(-X,Y),f(X,-Y),f(-X,-Y),f(X+1,Y),f(X,Y+1),f(X-1,Y-1),f(Y,-X)];
  const wrongs=[];
  for(const c of cands){if(c!==correct&&wrongs.indexOf(c)<0)wrongs.push(c);if(wrongs.length===3)break;}
  let k=2;while(wrongs.length<3){const c=f(X+k,Y-k);if(c!==correct&&wrongs.indexOf(c)<0)wrongs.push(c);k++;}
  const list=[correct,...wrongs];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return{list,ans:list.indexOf(correct)};
}

/* ── 최상 : 함수 그래프 3유형 (유리함수 평행이동 · 무리함수 평행이동 · 이차함수 최대·최소) ──
   고졸 검정고시 그림처럼 모눈 없이 축만 두고, 답을 구하는 데 필요한 값만 표시한다.
   (점근선 x=p · y=q 와 그 값 / 무리함수의 시작점 / 제한된 범위의 양 끝)
   식은 KaTeX 로 그린다 — 분자가 음수면 '−' 를 분수 앞에 두고, 루트는 한 덩어리 기호로. */
var TOP_LEVELS=['rat','irr','quad'];
var _tx=t=>`<span class="tx" data-tex="${t.replace(/"/g,'&quot;')}"></span>`;
var _sgn=(v,first)=>v<0?`-${-v}`:(first?`${v}`:`+${v}`);                 // 3 → "+3", -2 → "-2"
/* 식은 글 줄 사이에 끼우지 않고 가운데 한 줄로 크게 — 분수가 윗줄과 겹치거나 식이 줄바꿈으로 잘리지 않게 */
var _eq=(...ts)=>`<div style="text-align:center;font-size:1.15em;margin:12px 0;white-space:nowrap;overflow-x:auto;overflow-y:hidden;line-height:1.4;padding:2px 0">${ts.join('<span style="margin:0 10px;color:#6b7280">⟶</span>')}</div>`;
/* 유리·무리함수 : 처음 식과 옮긴 식을 위아래로 쌓는다 (학생이 좌우로 밀지 않아도 한 화면에 보이게) */
var _eqStack=(a,b)=>`<div style="text-align:center;font-size:1.15em;margin:12px 0;line-height:1.5"><div>${a}</div><div style="color:#6b7280;font-size:0.9em;margin:2px 0">⬇ 평행이동</div><div>${b}</div></div>`;
var _lin=(a,c)=>`${a===1?'':a===-1?'-':a}x${c?_sgn(c):''}`;                // ax+c
function topShiftChoices(p,q){
  const f=(a,b)=>`x축으로 ${a}, y축으로 ${b}`;
  const right=f(p,q);const out=[];
  for(const [a,b] of [[-p,q],[p,-q],[q,p],[-p,-q],[-q,-p],[q,-p],[p+1,q],[p,q+1]]){const c=f(a,b);if(c!==right&&!out.includes(c))out.push(c);if(out.length===3)break;}
  const list=[right,...out];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return{list,ans:list.indexOf(right)};
}
function genTopQ(lv){
  const G=window.GS;
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const nz=(a,b)=>{let v=0;while(!v)v=ri(a,b);return v;};
  const pk=arr=>arr[Math.floor(Math.random()*arr.length)];
  const plane=(g,items)=>G.planeSVG({xmin:-5,xmax:5,ymin:-5,ymax:5,s:36,maxW:400,grid:false,ticks:false,...g},items);

  if(lv==='rat'){
    const k=pk([1,-1,2,-2,3,-3]),p=nz(-3,3),q=nz(-3,3);
    const frac=`${k<0?'-':''}\\dfrac{${Math.abs(k)}}{`;
    const base=`y=${frac}x}`,moved=`y=${frac}${_lin(1,-p)}}${_sgn(q)}`;
    const f=x=>k/(x-p)+q;
    // 점근선 값은 축 위에만 쓴다. 곡선과 겹치지 않도록 곡선이 축을 지나는 쪽의 반대편에 둔다.
    const x0=p-k/q,y0=q-k/p;                      // 곡선이 x축·y축과 만나는 곳
    const items=[
      {t:'vline',x:p,color:'#555',width:2,dash:'8 6'},
      {t:'hline',y:q,color:'#555',width:2,dash:'8 6'},
      {t:'fn',f,from:-5,to:p-0.03},{t:'fn',f,from:p+0.03,to:5},
      {t:'text',x:p+(x0>p?-0.4:0.4),y:(q>0||q<=-2)?-0.9:0.4,s:String(p),anchor:'middle',size:22},
      {t:'text',x:-0.3,y:y0>q?q-0.75:q+0.2,s:String(q),anchor:'end',size:22},
    ];
    const ch=topShiftChoices(p,q);
    return{lv,topic:'유리함수 평행이동',
      qHtml:`유리함수의 그래프를 평행이동하였습니다.${_eqStack(_tx(base),_tx(moved))}x축과 y축으로 각각 얼마만큼 평행이동하였습니까?`,
      q:`유리함수 ${base} → ${moved}`,
      svg:plane({},items),svgAfter:plane({},items),
      choices:ch.list,ans:ch.ans,answer:`x축으로 ${p}, y축으로 ${q}`,
      sol:[`${_tx('y=\\dfrac{k}{x-p}+q')} 는 ${_tx('y=\\dfrac{k}{x}')} 를 <b>x축으로 p, y축으로 q</b> 만큼 옮긴 그래프입니다.`,
        `분모 ${_tx(_lin(1,-p))} = x−(${p}) 이므로 x축으로 <b>${p}</b> ${p>0?'(오른쪽)':'(왼쪽)'}`,
        `뒤에 붙은 ${_tx(_sgn(q))} 이므로 y축으로 <b>${q}</b> ${q>0?'(위)':'(아래)'}`,
        `그림의 점선(점근선)이 x=0, y=0 에서 <b>x=${p}, y=${q}</b> 로 옮겨졌습니다.`]};
  }

  if(lv==='irr'){
    // x 의 계수는 1 로 고정 (검정고시 출제 범위). 원래 그래프 y=√x 와 옮긴 그래프를 함께 그린다.
    const a=1,p=nz(-2,3),q=nz(-2,4);
    const base=`y=\\sqrt{x}`,moved=`y=\\sqrt{${_lin(1,-p)}}${_sgn(q)}`;
    const f=x=>x<p?NaN:Math.sqrt(x-p)+q, f0=x=>x<0?NaN:Math.sqrt(x);
    const xmin=Math.min(-1,p-1),xmax=Math.max(6,p+5),ymin=Math.min(-1,q-1),ymax=Math.max(3,q+3);
    const items=[
      {t:'fn',f:f0,from:0,to:xmax,color:'#8a94ad',width:3},
      {t:'text',x:xmax-0.2,y:Math.sqrt(xmax-0.2)-0.55,s:'y=√x',anchor:'end',size:19,color:'#6b7280',italic:true},
      {t:'fn',f,from:p,to:xmax},
      {t:'seg',x1:p,y1:0,x2:p,y2:q,color:'#555',width:1.8,dash:'6 5'},
      {t:'seg',x1:0,y1:q,x2:p,y2:q,color:'#555',width:1.8,dash:'6 5'},
      {t:'pt',x:p,y:q,r:7,color:'#1d3b8f'},
      {t:'text',x:p,y:q>0?-0.8:0.4,s:String(p),anchor:'middle',size:22},
      {t:'text',x:p>0?-0.25:0.25,y:q-0.3,s:String(q),anchor:p>0?'end':'start',size:22},
    ];
    const plane=(g,it)=>G.planeSVG({xmin,xmax,ymin,ymax,s:36,maxW:400,grid:false,ticks:false},it);
    const ch=topShiftChoices(p,q);
    return{lv,topic:'무리함수 평행이동',
      qHtml:`무리함수의 그래프를 평행이동하였습니다.${_eqStack(_tx(base),_tx(moved))}x축과 y축으로 각각 얼마만큼 평행이동하였습니까?`,
      q:`무리함수 ${base} → ${moved}`,
      svg:plane({},items),svgAfter:plane({},items),
      choices:ch.list,ans:ch.ans,answer:`x축으로 ${p}, y축으로 ${q}`,
      sol:[`${_tx('y=\\sqrt{a(x-p)}+q')} 는 ${_tx('y=\\sqrt{ax}')} 를 <b>x축으로 p, y축으로 q</b> 만큼 옮긴 그래프입니다.`,
        `루트 안이 ${_tx(_lin(1,-p))} = x−(${p}) 이므로 x축으로 <b>${p}</b> ${p>0?'(오른쪽)':'(왼쪽)'}`,
        `루트 밖 ${_tx(_sgn(q))} → y축으로 <b>${q}</b>`,
        `그래프가 시작하는 점이 원점 (0, 0) 에서 <b>(${p}, ${q})</b> 로 옮겨졌습니다.`]};
  }

  /* quad : 정해진 범위에서 이차함수의 최댓값·최솟값 */
  let a,h,k,al,be;
  for(let g=0;g<80;g++){
    a=pk([1,-1]);h=ri(-2,2);k=ri(-3,3);al=ri(h-3,h+1);be=al+ri(2,3);
    const ys=[al,be].map(x=>a*(x-h)**2+k);
    if(Math.max(...ys.map(Math.abs),Math.abs(k))<=7&&((al<h&&h<be)||Math.random()<0.35))break;
  }
  const F=x=>a*(x-h)**2+k;
  const inside=al<=h&&h<=be;
  const vals=[F(al),F(be)].concat(inside?[k]:[]);
  const mx=Math.max(...vals),mn=Math.min(...vals);
  const askMax=Math.random()<0.5,right=askMax?mx:mn;
  const b=-2*a*h,c=a*h*h+k;
  const poly=`${a===1?'':'-'}x^2${b?(b===1?'+x':b===-1?'-x':_sgn(b)+'x'):''}${c?_sgn(c):''}`;
  const cands=[askMax?mn:mx,inside?F(Math.abs(al-h)>=Math.abs(be-h)?be:al):k,right+1,right-1,-right,right+2,right-2];
  const wr=[];for(const v of cands)if(v!==right&&!wr.includes(v)&&wr.length<3)wr.push(v);
  const list=[right,...wr];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  const ymin=Math.min(-2,Math.floor(Math.min(...vals))-1),ymax=Math.max(2,Math.ceil(Math.max(...vals))+1);
  const xmin=Math.min(-2,al-1),xmax=Math.max(2,be+1);
  /* 검정고시 그림처럼 : 범위 양 끝 점과 (범위 안이면) 꼭짓점에 점을 찍고, 각 점에서 두 축으로 점선을 내려
     x값은 x축에, y값은 y축에 같은 색으로 쓴다. 범위 밖 곡선은 점선. */
  const off=(ymax-ymin)*0.075, INK='#111';
  const keys=[al,be].concat(inside&&h!==al&&h!==be?[h]:[]).map(x=>({x,y:F(x)}));
  const ySide=be<=0?1:-1;                        // 그래프가 y축 왼쪽에만 있으면 y값은 오른쪽에 쓴다
  const seenY=new Set();
  const marks=[];
  for(const P of keys){
    if(P.y)marks.push({t:'seg',x1:P.x,y1:0,x2:P.x,y2:P.y,color:'#666',width:1.6,dash:'5 5'});
    if(P.x)marks.push({t:'seg',x1:0,y1:P.y,x2:P.x,y2:P.y,color:'#666',width:1.6,dash:'5 5'});
    if(P.x)marks.push({t:'text',x:P.x===-1?P.x-0.12:P.x,y:P.y>=0?-off-0.15:off*0.5,s:String(P.x),anchor:'middle',size:22,color:INK,halo:true});
    if(P.y&&!seenY.has(P.y)){seenY.add(P.y);
      marks.push({t:'text',x:ySide*0.25,y:P.y-off*0.35,s:String(P.y),anchor:ySide>0?'start':'end',size:22,color:INK,halo:true});}
  }
  const items=[
    {t:'fn',f:F,from:xmin,to:xmax,color:'#1d3b8f',width:2.2,dash:'6 6'},
    {t:'fn',f:F,from:al,to:be},
    ...marks.filter(m=>m.t!=='text'),
    ...keys.map(P=>({t:'pt',x:P.x,y:P.y,r:6,color:INK})),
    ...marks.filter(m=>m.t==='text'),     // 글자는 맨 위에 흰 테두리를 둘러 곡선과 겹쳐도 읽히게
  ];
  const svg=G.planeSVG({xmin,xmax,ymin,ymax,s:58,maxW:400,grid:false,ticks:false},items);   // 칸을 크게 — 1 차이 나는 값 글자끼리 겹치지 않게
  return{lv:'quad',topic:'이차함수 최대·최소',
    qHtml:`다음 범위에서 이차함수의 <b>${askMax?'최댓값':'최솟값'}</b>은?${_eq(_tx(`y=${poly}`))}<div style="text-align:center;margin-top:-6px">${_tx(`(\\,${al}\\le x\\le ${be}\\,)`)}</div>`,
    q:`${al}≤x≤${be}, y=${poly} 의 ${askMax?'최댓값':'최솟값'}`,
    svg,svgAfter:svg,choices:list.map(String),ans:list.indexOf(right),answer:String(right),
    sol:[`꼭짓점 꼴로 바꿉니다 : ${_tx(`y=${a===1?'':'-'}(${_lin(1,-h)})^2${k?_sgn(k):''}`)} → 꼭짓점 (${h}, ${k})`,
      inside?`꼭짓점의 x=${h} 가 범위 안에 있으므로 꼭짓점의 y값 <b>${k}</b> 도 후보입니다.`:`꼭짓점의 x=${h} 는 범위 밖이므로 <b>양 끝값만</b> 비교합니다.`,
      `양 끝 : x=${al} 일 때 y=${F(al)}, x=${be} 일 때 y=${F(be)}`,
      `후보 중 가장 큰 값 ${mx}, 가장 작은 값 ${mn} → ${askMax?'최댓값':'최솟값'} <b>${right}</b>`]};
}

/* ── 문항 생성 ───────────────────────────────────────────────── */
function genCoordQ(level){
  const G=window.GS;
  const nz=(a,b)=>{let v=a+Math.floor(Math.random()*(b-a+1));let g=0;while(v===0&&g++<20)v=a+Math.floor(Math.random()*(b-a+1));return v===0?1:v;};
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pk=arr=>arr[Math.floor(Math.random()*arr.length)];
  const lv=level==='mix'?pk(['low','mid','high']):level;
  if(TOP_LEVELS.includes(lv))return genTopQ(lv);
  const x=nz(-5,5),y=nz(-5,5);
  const P={t:'pt',x,y,label:'P',guide:true,r:8};
  const plane=items=>G.planeSVG({xmin:-6,xmax:6,ymin:-6,ymax:6,s:30,maxW:400},items);

  /* 하 : 좌표 읽기 */
  if(lv==='low'){
    const ch=coordChoicesPlain(x,y);
    return{lv,topic:'좌표 읽기',
      q:`그림의 점 P의 좌표는?`,
      svg:plane([{...P,nolabel:true}]),
      svgAfter:plane([{...P,nolabel:false}]),
      choices:ch.list,ans:ch.ans,
      sol:[`점 P에서 <b>아래(또는 위)로 곧게</b> 내려가 x축 눈금을 읽습니다 → ${x}`,
        `점 P에서 <b>옆으로 곧게</b> 가서 y축 눈금을 읽습니다 → ${y}`,
        `좌표는 언제나 <b>(가로, 세로)</b> 순서입니다 → (${x}, ${y})`],
      answer:`(${x}, ${y})`};
  }

  /* 중 : 평행이동 — 옮긴 점은 그리지 않는다 */
  if(lv==='mid'){
    const dx=nz(-4,4),dy=nz(-4,4);
    const nx=x+dx,ny=y+dy;
    if(Math.abs(nx)>6||Math.abs(ny)>6)return genCoordQ(level);   // 그림 밖으로 나가면 다시 뽑기
    const ch=coordChoicesPlain(nx,ny);
    const way=s=>s>0?`${s}만큼`:`${-s}만큼 (음수 방향으로)`;
    return{lv,topic:'평행이동',
      q:`점 P(${x}, ${y})를 x축의 방향으로 ${dx}만큼, y축의 방향으로 ${dy}만큼 평행이동한 점의 좌표는?`,
      svg:plane([P]),
      svgAfter:plane([P,{t:'seg',x1:x,y1:y,x2:nx,y2:ny,color:G.GREEN,width:3,dash:'8 6'},
        {t:'pt',x:nx,y:ny,label:"P'",guide:true,r:8,color:G.GREEN}]),
      choices:ch.list,ans:ch.ans,
      sol:[`평행이동은 <b>더하기</b>입니다. 방향을 바꾸지 않고 그대로 밉니다.`,
        `x좌표 : ${x} + (${dx}) = <b>${nx}</b> ${dx>0?'(오른쪽으로)':'(왼쪽으로)'}`,
        `y좌표 : ${y} + (${dy}) = <b>${ny}</b> ${dy>0?'(위로)':'(아래로)'}`,
        `따라서 (${nx}, ${ny})`],
      answer:`(${nx}, ${ny})`};
  }

  /* 상 : 대칭이동 — 옮긴 점은 그리지 않는다 */
  const how=pk(['x축','y축','원점','직선 y=x']);
  let nx=x,ny=y,rule='';
  if(how==='x축'){ny=-y;rule='x축 대칭은 <b>y의 부호만</b> 바꿉니다. (위아래로 뒤집기)';}
  else if(how==='y축'){nx=-x;rule='y축 대칭은 <b>x의 부호만</b> 바꿉니다. (좌우로 뒤집기)';}
  else if(how==='원점'){nx=-x;ny=-y;rule='원점 대칭은 <b>x, y 둘 다</b> 부호를 바꿉니다.';}
  else{nx=y;ny=x;rule='직선 y=x 대칭은 <b>x와 y의 자리를 맞바꿉니다.</b> 부호는 그대로.';}
  const ch=coordChoicesPlain(nx,ny);
  const axis=how==='x축'?[{t:'hline',y:0,color:G.RED,width:3,dash:'6 5'}]
    :how==='y축'?[{t:'vline',x:0,color:G.RED,width:3,dash:'6 5'}]
    :how==='직선 y=x'?[{t:'fn',f:t=>t,color:G.RED,width:3,dash:'8 6'}]
    :[{t:'pt',x:0,y:0,r:6,color:G.RED}];
  return{lv,topic:'대칭이동',
    q:`점 P(${x}, ${y})를 ${how}에 대하여 대칭이동한 점의 좌표는?`,
    svg:plane([...axis,P]),
    svgAfter:plane([...axis,P,{t:'seg',x1:x,y1:y,x2:nx,y2:ny,color:G.GREEN,width:3,dash:'8 6'},
      {t:'pt',x:nx,y:ny,label:"P'",guide:true,r:8,color:G.GREEN}]),
    choices:ch.list,ans:ch.ans,
    sol:[rule,
      `P(${x}, ${y}) → (${nx}, ${ny})`,
      how==='직선 y=x'?`거울이 비스듬한 선이라 자리가 바뀝니다. 부호를 바꾸지 않도록 조심하세요.`
        :`거울(빨간 선)에서 <b>같은 거리만큼 반대편</b>에 찍힌다고 생각하면 그림으로도 확인됩니다.`],
    answer:`(${nx}, ${ny})`};
}

/* ── 탭 본체 ─────────────────────────────────────────────────── */
/* 다 풀고 나서 고르는 자기보고식 소감 — 좌표10 · 문제풀기 공용. 한 번에 누를 수 있게 크게 그린다. */
function FeelingPicker({title,onPick}){
  const OPTS=[['easy','😊','쉬웠어요','bg-green-50 border-green-300 text-green-700'],
              ['normal','😐','적당했어요','bg-blue-50 border-blue-300 text-blue-700'],
              ['hard','😥','어려웠어요','bg-red-50 border-red-300 text-red-700']];
  return(<div className="p-4 pb-36 flex flex-col items-center text-center fade-in">
    <div className="text-6xl mt-4 mb-3">🧠</div>
    <div className="text-2xl font-black text-gray-800">{title}</div>
    <div className="text-lg font-bold text-gray-500 mt-2 mb-6">오늘 푼 문제, 어떠셨나요?</div>
    <div className="w-full max-w-sm flex flex-col gap-4">
      {OPTS.map(([k,e,l,c])=>(
        <button key={k} onClick={()=>onPick(k)}
          className={`w-full flex items-center gap-4 px-6 py-6 rounded-3xl border-4 font-black text-2xl shadow-sm active:scale-95 transition-transform ${c}`}>
          <span className="text-5xl">{e}</span><span>{l}</span>
        </button>))}
    </div>
    <div className="text-sm text-gray-400 font-bold mt-5">기록은 이미 저장됐어요</div>
  </div>);
}

function CoordDailyTab({userData,onUpdate}){
  const TOTAL=10;
  const ORD=['①','②','③','④'];
  const[level,setLevel]=useState(null);
  const[qs,setQs]=useState([]);          // 생성된 문항
  const[idx,setIdx]=useState(0);
  const[sel,setSel]=useState(null);
  const[phase,setPhase]=useState('pick');// pick | quiz | feedback | done
  const[recs,setRecs]=useState([]);
  const[correct,setCorrect]=useState(0);
  const[startAt,setStartAt]=useState(0);
  const[qStartAt,setQStartAt]=useState(0);
  const[firstClick,setFirstClick]=useState(null);
  const savingRef=React.useRef(false);   // 한 묶음은 한 번만 저장한다
  const savedRef=React.useRef(null);
  const texRef=React.useRef(null);   // 최상 문제의 식(KaTeX)을 그릴 자리
  React.useEffect(()=>{if(texRef.current&&window.GS)GS.renderTex(texRef.current);});     // {id, upd} — 소감을 고르면 이 기록에 덧붙인다

  const today=todayStr();
  // 오늘 이미 푼 기록이 있는지 (홈의 도장과 같은 기준)
  const doneToday=(userData.logs||[]).some(l=>l.date===today&&(l.type||'').indexOf('좌표 10문제')===0);

  const start=(k)=>{
    const list=[];for(let i=0;i<TOTAL;i++)list.push(genCoordQ(k));
    setLevel(k);setQs(list);setIdx(0);setSel(null);setRecs([]);setCorrect(0);
    setStartAt(Date.now());setQStartAt(Date.now());setFirstClick(null);setPhase('quiz');
    savingRef.current=false;savedRef.current=null;
  };

  const q=qs[idx];

  const choose=(i)=>{
    if(phase!=='quiz')return;
    if(firstClick===null)setFirstClick(Date.now()-qStartAt);
    setSel(i);
  };

  const check=()=>{
    if(sel===null||!q)return;
    const isOk=sel===q.ans;
    const rec={qTxt:q.q.slice(0,60),uAns:String(q.choices[sel]),cAns:String(q.choices[q.ans]),isOk,
      timeSec:Math.round((Date.now()-qStartAt)/1000),
      firstClickMs:firstClick,revisionCount:null,
      qTopicHash:getTopicHash({meta:{type:q.topic}}),
      meta:{category:'geometry',type:q.topic,diff:q.lv==='low'?'기초':q.lv==='mid'?'기초':'기하'}};
    const newRecs=[...recs,rec];const newCorrect=correct+(isOk?1:0);
    setRecs(newRecs);setCorrect(newCorrect);
    setPhase('feedback');
    if(idx+1>=TOTAL)saveSession(newRecs,newCorrect);
  };

  // 10번째 정답 확인 순간 저장한다 — [다음]/[한 번 더]를 안 누르고 홈으로 나가도 기록이 남게.
  // savingRef : 한 묶음은 한 번만 저장 (연타로 같은 기록이 여러 건 쌓이던 버그 방지)
  const saveSession=async(all,correct)=>{
    if(savingRef.current)return;
    savingRef.current=true;
    const L=COORD_LEVELS.find(l=>l.k===level)||{};const badge=L.logName||L.badge||'';
    const totalSec=Math.round((Date.now()-startAt)/1000);
    const log={studentName:userData.name,date:today,time:timeStr(),
      type:`좌표 10문제 (${badge})`,score:`${correct} / ${TOTAL}`,questions:all,totalSec};
    const newActiveDates=[...new Set([...(userData.activeDates||[]),today])];
    const upd={...userData,
      totalLessons:(userData.totalLessons||0)+1,
      todayLessons:(userData.todayLessons||0)+1,
      todayCorrect:(userData.todayCorrect||0)+correct,
      todayWrong:(userData.todayWrong||0)+(TOTAL-correct),
      lastDate:today,activeDates:newActiveDates,
      logs:[log,...(userData.logs||[]).slice(0,49)]};
    try{await saveUser(upd);const id=await saveLog(log);savedRef.current={id,upd};updateQStats(all.map(r=>({...r,meta:r.meta})));}catch(e){}
    onUpdate&&onUpdate(upd);
  };

  const next=()=>{
    if(idx+1<TOTAL){
      setIdx(idx+1);setSel(null);setFirstClick(null);setQStartAt(Date.now());setPhase('quiz');
      return;
    }
    setPhase('reflect');
  };
  const chooseFeeling=async(feeling)=>{
    setPhase('done');
    const sv=savedRef.current;
    if(sv){const upd=await patchLogFeeling(sv.id,sv.upd,feeling);onUpdate&&onUpdate(upd);}
  };

  /* ── 난이도 고르기 ── */
  if(phase==='pick'){
    return(<div className="p-4 space-y-4 pb-36">
      <style>{`svg.plane{max-width:100%;height:auto}`}</style>
      <div>
        <div className="text-2xl font-black text-gray-800">📍 오늘의 좌표</div>
        <div className="text-sm font-bold text-gray-500 mt-1">하루 10문제면 충분합니다. 오늘도 화이팅해보아요 😄</div>
      </div>

      {doneToday&&(
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 flex items-center gap-3">
          <div className="text-3xl">✅</div>
          <div>
            <div className="font-black text-emerald-800 text-base">오늘 몫은 이미 마치셨어요!</div>
            <div className="text-sm font-bold text-emerald-600 mt-0.5">더 풀고 싶으시면 아래에서 다시 고르시면 됩니다.</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {COORD_LEVELS.map(l=>(
          <button key={l.k} onClick={()=>start(l.k)}
            className={`w-full text-left bg-white rounded-3xl p-5 shadow-md active:scale-[0.98] transition-transform border-2 ${l.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl ${l.chip} flex items-center justify-center text-sm leading-tight text-center font-black shrink-0 px-1`}>{l.badge}</div>
              <div className="flex-1">
                <div className="text-lg font-black text-gray-800">{l.lbl}</div>
                <div className="text-sm font-bold text-gray-500 mt-0.5">{l.desc}</div>
              </div>
              <div className="text-2xl text-gray-300">›</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4">
        <div className="text-sm font-black text-indigo-700 mb-1">💡 이렇게 나옵니다</div>
        <div className="text-sm font-bold text-indigo-600 leading-relaxed break-keep">
          옮긴 점은 <b>그림에 그려 주지 않습니다.</b> 머릿속으로 규칙을 써서 좌표를 구하고, 답을 고른 뒤에 그림으로 확인하게 됩니다.
        </div>
      </div>
    </div>);
  }

  if(phase==='reflect')return<FeelingPicker title="좌표 10문제 끝!" onPick={chooseFeeling}/>;

  /* ── 다 풀었을 때 ── */
  if(phase==='done'){
    const rate=Math.round(correct/TOTAL*100);
    return(<div className="p-4 space-y-4 pb-36">
      <div className="bg-white rounded-3xl p-6 shadow-md text-center">
        <div className="text-6xl mb-3">{rate>=90?'🍎':rate>=70?'🌳':rate>=40?'🌿':'🌱'}</div>
        <div className="text-2xl font-black text-gray-800">좌표 10문제 끝!</div>
        <div className="text-4xl font-black text-indigo-600 mt-3">{correct} / {TOTAL}</div>
        <div className="text-sm font-bold text-gray-500 mt-2">
          {rate>=90?'완벽합니다. 검정고시 좌표 문항은 이제 든든합니다.'
            :rate>=70?'잘하고 계세요. 틀린 것만 다시 보면 됩니다.'
            :rate>=40?'규칙을 조금씩 익히고 계세요. 내일 또 10문제!'
            :'오늘은 여기까지도 충분합니다. 부호 규칙부터 다시 봐요.'}
        </div>
      </div>
      <div className="bg-white rounded-3xl p-4 shadow-sm space-y-2">
        {recs.map((r,i)=>(
          <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${r.isOk?'bg-emerald-50':'bg-red-50'}`}>
            <div className="text-xl">{r.isOk?'⭕':'❌'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-700 truncate">{i+1}. {r.meta.type}</div>
              {!r.isOk&&<div className="text-xs font-bold text-red-500 mt-0.5">내 답 {r.uAns} · 정답 {r.cAns}</div>}
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>setPhase('pick')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">
        한 번 더 풀기
      </button>
    </div>);
  }

  /* ── 문제 화면 ── */
  const lvInfo=COORD_LEVELS.find(l=>l.k===q.lv)||COORD_LEVELS[0];
  return(<div ref={texRef} className="p-4 space-y-4 pb-36">
    <style>{`svg.plane{max-width:100%;height:auto}`}</style>

    <div className="flex items-center gap-3">
      <button onClick={()=>setPhase('pick')} className="text-sm font-bold text-gray-400 px-3 py-2 bg-gray-100 rounded-xl">← 그만</button>
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{width:`${(idx+(phase==='feedback'?1:0))/TOTAL*100}%`}}></div>
        </div>
      </div>
      <div className="text-sm font-black text-gray-600 shrink-0">{idx+1} / {TOTAL}</div>
    </div>

    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-black px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700">{lvInfo.badge}</span>
        <span className="text-xs font-bold text-gray-400">{q.topic}</span>
      </div>
      {q.qHtml
        ?<div className="text-lg font-black text-gray-800 leading-loose break-keep mb-4" dangerouslySetInnerHTML={{__html:q.qHtml}}/>
        :<div className="text-lg font-black text-gray-800 leading-relaxed break-keep mb-4">{q.q}</div>}
      <div className="flex justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{__html:phase==='feedback'?q.svgAfter:q.svg}}/>
    </div>

    {/* 최상 유리·무리함수 보기는 글이 길어서 한 줄에 하나씩 (두 줄로 꺾이지 않게) */}
    <div className={`grid gap-3 ${q.lv==='rat'||q.lv==='irr'?'grid-cols-1':'grid-cols-2'}`}>
      {q.choices.map((c,i)=>{
        const isSel=sel===i,isAns=i===q.ans;
        let cls='bg-white border-gray-200 text-gray-700';
        if(phase==='feedback'){
          if(isAns)cls='bg-emerald-500 border-emerald-500 text-white';
          else if(isSel)cls='bg-red-100 border-red-300 text-red-600';
          else cls='bg-white border-gray-200 text-gray-400';
        }else if(isSel)cls='bg-indigo-500 border-indigo-500 text-white';
        return(
          <button key={i} onClick={()=>choose(i)} disabled={phase==='feedback'}
            className={`py-4 px-3 rounded-2xl border-2 font-black text-lg transition-all active:scale-95 ${cls}`}>
            <span className="opacity-60 mr-1">{ORD[i]}</span> {c}
          </button>
        );
      })}
    </div>

    {phase==='feedback'&&(
      <div className={`rounded-3xl p-5 border-2 ${sel===q.ans?'bg-emerald-50 border-emerald-300':'bg-amber-50 border-amber-300'}`}>
        <div className="font-black text-lg mb-2 text-gray-800">
          {sel===q.ans?'⭕ 맞았습니다!':`❌ 정답은 ${q.answer} 입니다`}
        </div>
        <ol className="space-y-1.5">
          {q.sol.map((s,i)=>(
            <li key={i} className="text-sm font-bold text-gray-700 leading-relaxed break-keep"
              dangerouslySetInnerHTML={{__html:`${i+1}. ${s}`}}/>
          ))}
        </ol>
        {(q.lv==='mid'||q.lv==='high')&&<div className="text-xs font-bold text-gray-400 mt-3">위 그림의 초록 점이 옮겨진 자리입니다.</div>}
      </div>
    )}

    {phase==='quiz'
      ?<button onClick={check} disabled={sel===null}
        className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${sel===null?'bg-gray-200 text-gray-400':'bg-indigo-600 text-white'}`}>
        확인하기
      </button>
      :<button onClick={next}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">
        {idx+1<TOTAL?'다음 문제 →':'결과 보기 →'}
      </button>}
  </div>);
}
