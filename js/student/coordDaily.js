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
  /* openAt : 이 시각(한국 시간)부터 학생에게 열린다. 그 전에는 PREVIEW_USERS(core/constants.js)만 풀 수 있다 */
  {k:'div', badge:'응용 4', logName:'최상 내분점', lbl:'선분의 내분점', desc:'선분을 정해진 비율로 나누는 점을 찾습니다 (수직선 · 좌표평면)',
    border:'border-rose-300', chip:'bg-rose-100 text-rose-700', openAt:'2026-10-06T00:00:00+09:00', openLbl:'10/6(화)'},
  {k:'ineq',badge:'응용 5', logName:'최상 이차부등식', lbl:'이차부등식의 해', desc:'해의 범위를 수직선에 나타냅니다 (● 이상·이하 / ○ 초과·미만)',
    border:'border-rose-300', chip:'bg-rose-100 text-rose-700', openAt:'2026-10-08T00:00:00+09:00', openLbl:'10/8(목)'},
];
/* 아직 열리지 않은 유형인지 — 미리 보기 계정은 늘 열려 있다 */
var coordLevelLocked=(L,name)=>!!(L&&L.openAt&&Date.now()<Date.parse(L.openAt)&&!(PREVIEW_USERS||[]).includes(name));

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
var TOP_LEVELS=['rat','irr','quad','div','ineq'];
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
  if(lv==='div')return genDivQ();
  if(lv==='ineq')return genIneqQ();
  const G=window.GS;
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const nz=(a,b)=>{let v=0;while(!v)v=ri(a,b);return v;};
  const pk=arr=>arr[Math.floor(Math.random()*arr.length)];
  const plane=(g,items)=>G.planeSVG({xmin:-5,xmax:5,ymin:-5,ymax:5,s:36,maxW:400,grid:false,ticks:false,...g},items);

  if(lv==='rat'){
    const k=pk([1,-1,2,-2,3,-3]),p=nz(-3,3),q=nz(-3,3);
    const frac=`${k<0?'-':''}\\dfrac{${Math.abs(k)}}{`;
    const base=`y=${frac}x}`,moved=`y=${frac}${_lin(1,-p)}}${_sgn(q)}`;
    // 교사 화면(오답노트·세션기록)은 이 문자열을 KaTeX 없이 그대로 보여 주므로,
    // 위 base/moved(LaTeX)와 별개로 사람이 읽는 일반 텍스트를 q에 담는다.
    const baseTxt=`y=${k}/x`,movedTxt=`y=${k}/(${_lin(1,-p)})${_sgn(q)}`;
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
      q:`유리함수 ${baseTxt} → ${movedTxt}`,
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
    const baseTxt=`y=√x`,movedTxt=`y=√(${_lin(1,-p)})${_sgn(q)}`;
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
      q:`무리함수 ${baseTxt} → ${movedTxt}`,
      svg:plane({},items),svgAfter:plane({},items),
      choices:ch.list,ans:ch.ans,answer:`x축으로 ${p}, y축으로 ${q}`,
      sol:[`${_tx('y=\\sqrt{a(x-p)}+q')} 는 ${_tx('y=\\sqrt{ax}')} 를 <b>x축으로 p, y축으로 q</b> 만큼 옮긴 그래프입니다.`,
        `루트 안이 ${_tx(_lin(1,-p))} = x−(${p}) 이므로 x축으로 <b>${p}</b> ${p>0?'(오른쪽)':'(왼쪽)'}`,
        `루트 밖 ${_tx(_sgn(q))} → y축으로 <b>${q}</b>`,
        `그래프가 시작하는 점이 원점 (0, 0) 에서 <b>(${p}, ${q})</b> 로 옮겨졌습니다.`]};
  }

  /* quad : 정해진 범위에서 이차함수의 최댓값·최솟값
     사지선다는 그림에 실제로 찍히는 좌표 숫자(각 점의 x좌표·y좌표)에서만 고른다 — 아무 오답이나
     주지 않고 "이 값이 x좌표인지 y좌표인지, 어느 점의 것인지" 헷갈렸는지를 확인하게 한다.
     점 2개(al,be)면 x 2개·y 2개 = 4개를 그대로 선지로, 점 3개(꼭짓점이 범위 안)면
     x 3개·y 3개 = 6개 중 정답을 포함해 4개를 무작위로 고른다. */
  let a,h,k,al,be,inside,pool;
  // 범위가 꼭짓점을 품는 문제와 품지 않는 문제(한쪽으로만 올라가거나 내려가는 구간)를 반반 낸다
  const wantIn=Math.random()<0.5;
  for(let g=0;g<400;g++){
    a=pk([1,-1,1,-1,2,-2,3]);h=ri(-3,4);k=ri(-4,7);
    const w=ri(1,3);
    al=wantIn?ri(h-w+1,h-1):(Math.random()<0.5?ri(h+1,h+2):ri(h-w-2,h-w-1));be=al+w;
    if(wantIn&&!(al<h&&h<be))continue;
    if(!wantIn&&al<=h&&h<=be)continue;
    const F0=x=>a*(x-h)**2+k;
    const ys=[al,be].map(F0);
    if(Math.max(...ys.map(Math.abs),Math.abs(k))>9)continue;
    inside=al<=h&&h<=be;
    const keyXs=inside&&h!==al&&h!==be?[al,be,h]:[al,be];
    pool=new Set();keyXs.forEach(x=>{pool.add(x);pool.add(F0(x));});
    if(pool.size>=4)break;
  }
  const F=x=>a*(x-h)**2+k;
  const vals=[F(al),F(be)].concat(inside?[k]:[]);
  const mx=Math.max(...vals),mn=Math.min(...vals);
  const askMax=Math.random()<0.5,right=askMax?mx:mn;
  // 식은 완전제곱식(꼭짓점) 꼴로만 : 3(x-4)^2-5
  const poly=`${a===1?'':a===-1?'-':a}${h?`(${_lin(1,-h)})`:'x'}^2${k?_sgn(k):''}`;
  const others=[...pool].filter(v=>v!==right);
  for(let i=others.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[others[i],others[j]]=[others[j],others[i]];}
  const list=[right,...others.slice(0,3)];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  // 꼭짓점이 범위 밖이어도 점선 곡선에 꼭짓점까지 보이게 그림 범위를 넓힌다 (개형이 보여야 한다)
  const ymin=Math.min(-2,Math.floor(Math.min(...vals,k))-1),ymax=Math.max(2,Math.ceil(Math.max(...vals,k))+1);
  const xmin=Math.min(-2,al-1,h-1),xmax=Math.max(2,be+1,h+1);
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
    /* 점이 x축 위에 있으면(y=0) 곡선이 없는 쪽(위/아래)에, 아니면 축 너머 반대편에 x값을 쓴다 */
    const near=[P.x-0.4,P.x+0.4].filter(t=>t>=al&&t<=be).map(F);
    const curveUp=near.length?near.reduce((u,v)=>u+v,0)>0:a>0;
    const xAbove=P.y===0?!curveUp:P.y<0;
    if(P.x)marks.push({t:'text',x:P.x===-1&&!xAbove?P.x-0.12:P.x,y:xAbove?off*0.55:-off-0.15,s:String(P.x),anchor:'middle',size:22,color:INK,halo:true});
    /* 점이 y축 위에 있으면(x=0) 범위가 뻗은 반대쪽(좌/우)에 조금 더 떨어뜨려 y값을 쓴다 */
    if(P.y&&!seenY.has(P.y)){seenY.add(P.y);
      const side=P.x===0?(be>0?-1:1):ySide, gap=P.x===0?0.38:0.25;
      marks.push({t:'text',x:side*gap,y:P.y-off*0.35,s:String(P.y),anchor:side>0?'start':'end',size:22,color:INK,halo:true});}
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
    sol:[`완전제곱식 꼴이므로 꼭짓점은 바로 (${h}, ${k}) 입니다. ${a>0?'아래로 볼록(∪)':'위로 볼록(∩)'}`,
      inside?`꼭짓점의 x=${h} 가 범위 안에 있으므로 꼭짓점의 y값 <b>${k}</b> 도 후보입니다.`:`꼭짓점의 x=${h} 는 범위 밖이므로 <b>양 끝값만</b> 비교합니다.`,
      `양 끝 : x=${al} 일 때 y=${F(al)}, x=${be} 일 때 y=${F(be)}`,
      `후보 중 가장 큰 값 ${mx}, 가장 작은 값 ${mn} → ${askMax?'최댓값':'최솟값'} <b>${right}</b>`]};
}

/* ── 응용 4 : 선분의 내분점 (2026-10-03) ─────────────────────────────
   기출 그림을 따른다 (2023~2026 고졸 검정고시 10·11번)
   · 수직선형 : 점 A·P·B 와 그 위의 점선 호, 호 위에 비율 숫자. P 는 찍혀 있되 좌표는 숨긴다.
                최근 회차(2025-2·2026-2)처럼 도로 표지판·허수아비 같은 이야기와 그림을 붙이기도 한다.
   · 좌표평면형 : 모눈 위에 선분 AB 만 그린다. 내분점 P 는 그리지 않는다(답이 보이면 안 되므로).
   정답이 늘 정수가 되도록 '두 점 사이 거리 = (m+n) × 한 칸' 으로 거꾸로 만든다. 비율도 늘 정수비. */
var DIV_STORIES=[
  {icon:'🪧',txt:'그림은 어느 도로의 직선 구간 일부를 수직선 위에 나타낸 것이다.',act:'최고 속도제한 표지판을 설치하려고 할 때'},
  {icon:'🌾',txt:'그림은 곧게 뻗은 어느 밭의 일부를 수직선 위에 나타낸 것이다.',act:'허수아비를 세우려고 할 때'},
  {icon:'🪑',txt:'그림은 곧게 뻗은 공원 산책로의 일부를 수직선 위에 나타낸 것이다.',act:'쉼터 의자를 놓으려고 할 때'},
  {icon:'🚏',txt:'그림은 어느 마을 길의 일부를 수직선 위에 나타낸 것이다.',act:'버스 정류장을 세우려고 할 때'},
];
var _neg=v=>v<0?`−${-v}`:String(v);          // 글자용 음수 표기 (보기·로그)
/* 숫자 뒤 조사 '로/으로' : 3·6·0 (삼·육·영)만 받침이 있어 '으로' — 기출 표기 '3 : 5로', '2 : 3으로' */
var _ro=n=>/[036]$/.test(String(n))?'으로':'로';
function _shuffleList(list){for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}

/* 수직선 그림 : A·P·B, 점선 호와 비율. after=true 면 P 의 좌표(초록)와 한 칸씩 나눈 눈금을 보여 준다 */
function divLineSVG({a,b,m,n,p,after,icon}){
  const W=380,top=icon?44:0,H=118+top,ly=78+top,L=34,R=W-34;
  const X=v=>Math.round((L+(v-a)/(b-a)*(R-L))*10)/10;
  const xa=X(a),xp=X(p),xb=X(b),INK='#111',GR='#15803d';
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" font-family="'Noto Sans KR',sans-serif" style="max-width:100%;height:auto">`;
  s+=`<rect width="${W}" height="${H}" fill="#fff"/>`;
  s+=`<line x1="8" y1="${ly}" x2="${W-8}" y2="${ly}" stroke="${INK}" stroke-width="2"/>`;
  s+=`<polygon points="${W-4},${ly} ${W-14},${ly-5} ${W-14},${ly+5}" fill="${INK}"/><polygon points="4,${ly} 14,${ly-5} 14,${ly+5}" fill="${INK}"/>`;
  const arc=(x1,x2,num,col)=>{const mx=(x1+x2)/2,h=Math.min(34,Math.max(18,(x2-x1)*0.32));
    return`<path d="M ${x1+7} ${ly-9} Q ${mx} ${ly-9-h*1.6} ${x2-7} ${ly-9}" fill="none" stroke="${col}" stroke-width="1.8" stroke-dasharray="4 4"/>`
      +`<rect x="${mx-11}" y="${ly-9-h*0.8-13}" width="22" height="20" fill="#fff"/><text x="${mx}" y="${ly-9-h*0.8+3}" font-size="17" text-anchor="middle" fill="${col}" font-weight="700">${num}</text>`;};
  s+=arc(xa,xp,m,after?GR:INK)+arc(xp,xb,n,INK);
  if(after){const k=(b-a)/(m+n);for(let i=1;i<m+n;i++){const x=X(a+i*k);if(Math.abs(x-xp)<1)continue;s+=`<line x1="${x}" y1="${ly-6}" x2="${x}" y2="${ly+6}" stroke="#94a3b8" stroke-width="2"/>`;}}
  [[xa,'A',INK],[xp,'P',after?GR:INK],[xb,'B',INK]].forEach(([x,t,c])=>{
    s+=`<circle cx="${x}" cy="${ly}" r="5" fill="${c}"/><text x="${x}" y="${ly-14}" font-size="18" text-anchor="middle" fill="${c}" font-weight="700">${t}</text>`;});
  s+=`<text x="${xa}" y="${ly+26}" font-size="18" text-anchor="middle" fill="${INK}">${_neg(a)}</text><text x="${xb}" y="${ly+26}" font-size="18" text-anchor="middle" fill="${INK}">${_neg(b)}</text>`;
  if(after)s+=`<text x="${xp}" y="${ly+26}" font-size="19" text-anchor="middle" fill="${GR}" font-weight="700">${_neg(p)}</text>`;
  if(icon)s+=`<text x="${xp}" y="${ly-40}" font-size="30" text-anchor="middle">${icon}</text>`;   // P 글자(ly-14) 위로 띄운다
  return s+'</svg>';
}

function genDivQ(){
  const G=window.GS;
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pk=arr=>arr[Math.floor(Math.random()*arr.length)];
  const onPlane=Math.random()<0.5;     // 수직선형·좌표평면형 반반

  if(!onPlane){
    const story=Math.random()<0.4?pk(DIV_STORIES):null;
    let a,b,m,n,k,p,q;
    for(let g=0;g<200;g++){
      [m,n]=pk([[1,2],[2,1],[1,3],[3,1],[2,3],[3,2],[3,4],[4,3],[3,5],[5,3],[1,4],[4,1],[2,5],[5,2]]);
      k=pk([1,1,2]);a=story?ri(0,2):ri(-4,4);b=a+(m+n)*k;
      if(b>12||(m+n)*k<3)continue;
      p=a+m*k;q=a+n*k;break;           // q : 비율을 거꾸로(n:m) 쓴 실수
    }
    const wrong=[q,p+1,p-1,p+2,p-2].filter((v,i,arr)=>v!==p&&arr.indexOf(v)===i).slice(0,3);
    const list=_shuffleList([p,...wrong]);
    const head=story?`${story.txt} 수직선 위의 두 점 A(${_neg(a)}), B(${_neg(b)})에 대하여 선분 AB를 ${m} : ${n}${_ro(n)} 내분하는 점 P에 ${story.act}, 점 P의 좌표는?`
      :`수직선 위의 두 점 A(${_neg(a)}), B(${_neg(b)})에 대하여 선분 AB를 ${m} : ${n}${_ro(n)} 내분하는 점 P의 좌표는?`;
    return{lv:'div',topic:'내분점(수직선)',
      qHtml:head.replace(`${m} : ${n}${_ro(n)}`,`<b>${m} : ${n}</b>${_ro(n)}`),
      q:`수직선 A(${a}), B(${b}) 를 ${m}:${n} 으로 내분하는 점`,
      svg:divLineSVG({a,b,m,n,p,icon:story&&story.icon}),svgAfter:divLineSVG({a,b,m,n,p,after:true,icon:story&&story.icon}),
      choices:list.map(_neg),ans:list.indexOf(p),answer:_neg(p),cols:2,
      sol:[`A에서 B까지의 거리는 ${_neg(b)} − ${a<0?`(${_neg(a)})`:a} = <b>${b-a}</b> 입니다.`,
        `이 길이를 ${m}+${n} = <b>${m+n}칸</b>으로 똑같이 나누면 한 칸은 ${b-a} ÷ ${m+n} = <b>${k}</b> 입니다.`,
        `A에서 B 쪽으로 ${m}칸 → ${_neg(a)} + ${m}×${k} = <b>${_neg(p)}</b>`,
        `공식으로는 ${_tx(`\\dfrac{${m}\\times(${b})+${n}\\times(${a})}{${m}+${n}}=\\dfrac{${m*b+n*a}}{${m+n}}=${p}`)}`]};
  }

  /* 좌표평면형 : 두 점 모두 −4~5 안, 내분점도 정수 */
  let A,B,m,n,P,Q;
  for(let g=0;g<400;g++){
    [m,n]=pk([[1,2],[2,1],[1,3],[3,1],[2,3],[3,2],[1,4],[4,1]]);
    const s=m+n,kx=pk(s<=3?[1,-1,2,-2]:[1,-1]),ky=pk(s<=3?[1,-1,2,-2]:[1,-1]);
    const ax=ri(-4,5),ay=ri(-4,5),bx=ax+s*kx,by=ay+s*ky;
    if(bx<-4||bx>5||by<-4||by>5)continue;
    A=[ax,ay];B=[bx,by];P=[ax+m*kx,ay+m*ky];Q=[ax+n*kx,ay+n*ky];break;
  }
  const f=(x,y)=>`(${_neg(x)}, ${_neg(y)})`;
  const right=f(...P);
  const mid=[(A[0]+B[0])/2,(A[1]+B[1])/2];
  const cands=[f(...Q),f(P[1],P[0]),Number.isInteger(mid[0])&&Number.isInteger(mid[1])?f(...mid):null,f(P[0]+1,P[1]),f(P[0],P[1]-1),f(-P[0],P[1])]
    .filter((c,i,arr)=>c&&c!==right&&arr.indexOf(c)===i).slice(0,3);
  const list=_shuffleList([right,...cands]);
  const xs=[A[0],B[0],0],ys=[A[1],B[1],0];
  const g={xmin:Math.min(...xs)-1,xmax:Math.max(...xs)+1,ymin:Math.min(...ys)-1,ymax:Math.max(...ys)+1,s:40,maxW:380};
  const lab=(p0,p1)=>({lx:p0[0]<=p1[0]?-26:12,ly:p0[1]<=p1[1]?26:-12});
  const base=[{t:'seg',x1:A[0],y1:A[1],x2:B[0],y2:B[1],width:3.4,color:'#111'},
    {t:'pt',x:A[0],y:A[1],r:6,color:'#111',label:'A',...lab(A,B)},{t:'pt',x:B[0],y:B[1],r:6,color:'#111',label:'B',...lab(B,A)}];
  const s=m+n,steps=[];for(let i=1;i<s;i++)steps.push({t:'pt',x:A[0]+(B[0]-A[0])*i/s,y:A[1]+(B[1]-A[1])*i/s,r:4,color:'#94a3b8'});
  const after=[...base,...steps,{t:'pt',x:P[0],y:P[1],r:8,color:'#15803d',label:'P',guide:true,nolabel:false,...lab(P,B)}];
  return{lv:'div',topic:'내분점(좌표평면)',
    qHtml:`좌표평면 위의 두 점 A${f(...A)}, B${f(...B)}에 대하여 선분 AB를 <b>${m} : ${n}</b>${_ro(n)} 내분하는 점의 좌표는?`,
    q:`좌표평면 A(${A}), B(${B}) 를 ${m}:${n} 으로 내분하는 점`,
    svg:G.planeSVG(g,base),svgAfter:G.planeSVG(g,after),
    choices:list,ans:list.indexOf(right),answer:right,cols:2,
    sol:[`x좌표와 y좌표를 <b>따로따로</b> 수직선처럼 나눕니다. 선분을 ${m}+${n} = <b>${s}칸</b>으로 나누고 A에서 ${m}칸 갑니다 (회색 점이 한 칸씩).`,
      `x좌표 : ${_tx(`\\dfrac{${m}\\times(${B[0]})+${n}\\times(${A[0]})}{${s}}=\\dfrac{${m*B[0]+n*A[0]}}{${s}}=${P[0]}`)}`,
      `y좌표 : ${_tx(`\\dfrac{${m}\\times(${B[1]})+${n}\\times(${A[1]})}{${s}}=\\dfrac{${m*B[1]+n*A[1]}}{${s}}=${P[1]}`)}`,
      `따라서 내분점은 <b>${right}</b> — 비율을 거꾸로(${n} : ${m}) 쓰면 ${f(...Q)} 가 나오니 조심하세요.`]};
}

/* ── 응용 5 : 이차부등식의 해 (2026-10-03) ─────────────────────────
   기출 그림(2026-2회 9번)처럼 해를 수직선 위 회색 상자로 나타낸다.
   ● 채운 점 = 이상·이하(≤, ≥, 근도 해에 들어감)  ○ 빈 점 = 초과·미만(<, >, 근은 빠짐)
   보기 4개는 늘 [두 근 사이 / 바깥] × [● / ○] 네 가지 — 범위와 점 모양을 둘 다 정확히 알아야 고를 수 있다.
   정답 확인 뒤에는 포물선과 수직선을 위아래로 맞춰 그려 '왜 그 범위인지' 보여 준다. */
function ineqLineSVG({al,be,inside,closed,W=180}){
  const H=62,ly=40,xa=Math.round(W*0.32),xb=Math.round(W*0.68),INK='#111';
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" font-family="'Noto Sans KR',sans-serif" style="max-width:100%;height:auto;display:block;margin:0 auto">`;
  s+=`<rect width="${W}" height="${H}" rx="8" fill="#fff"/>`;
  const box=(x1,x2)=>`<rect x="${x1}" y="${ly-15}" width="${x2-x1}" height="15" fill="#d1d5db" stroke="${INK}" stroke-width="1.4"/>`;
  s+=inside?box(xa,xb):box(10,xa)+box(xb,W-22);
  s+=`<line x1="4" y1="${ly}" x2="${W-14}" y2="${ly}" stroke="${INK}" stroke-width="1.8"/><polygon points="${W-8},${ly} ${W-16},${ly-4} ${W-16},${ly+4}" fill="${INK}"/>`;
  s+=`<text x="${W-9}" y="${ly+17}" font-size="14" font-style="italic" fill="${INK}">x</text>`;
  [[xa,al],[xb,be]].forEach(([x,v])=>{
    s+=`<circle cx="${x}" cy="${ly}" r="5" fill="${closed?INK:'#fff'}" stroke="${INK}" stroke-width="2"/>`;
    s+=`<text x="${x}" y="${ly+19}" font-size="15" text-anchor="middle" fill="${INK}">${_neg(v)}</text>`;});
  return s+'</svg>';
}
/* 정답 확인 뒤 : 포물선(위)과 수직선(아래)을 같은 x 위치에 맞춰 그린다 */
function ineqTeachSVG(al,be,op){
  const W=360,H=300,L=24,R=W-24,lo=al-2.5,hi=be+2.5,axisY=126,nlY=258;
  const inside=op==='<'||op==='≤',closed=op==='≤'||op==='≥';
  const X=v=>L+(v-lo)/(hi-lo)*(R-L);
  const f=x=>(x-al)*(x-be);
  const D=((be-al)/2)**2,E=Math.max(f(lo),f(hi));
  const sy=Math.min(96/D,104/E),Y=v=>axisY-v*sy;
  const ok=x=>inside?f(x)<=0:f(x)>=0;
  const RED='#e11d48',GREY='#a3acb9',INK='#111';
  let s=`<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" font-family="'Noto Sans KR',sans-serif" style="max-width:100%;height:auto">`;
  s+=`<rect width="${W}" height="${H}" fill="#fff"/>`;
  // 곡선 : 해가 되는 부분은 빨갛고 굵게
  let seg='',cur=null;const N=160;
  for(let i=0;i<=N;i++){const x=lo+(hi-lo)*i/N,o=ok(x);
    if(o!==cur){if(seg)s+=`<path d="${seg}" fill="none" stroke="${cur?RED:GREY}" stroke-width="${cur?4.5:2.6}" stroke-linecap="round"/>`;seg=`M ${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)}`;cur=o;}
    else seg+=` L ${X(x).toFixed(1)} ${Y(f(x)).toFixed(1)}`;}
  s+=`<path d="${seg}" fill="none" stroke="${cur?RED:GREY}" stroke-width="${cur?4.5:2.6}" stroke-linecap="round"/>`;
  s+=`<line x1="${L-14}" y1="${axisY}" x2="${R+8}" y2="${axisY}" stroke="${INK}" stroke-width="2"/><polygon points="${R+14},${axisY} ${R+5},${axisY-5} ${R+5},${axisY+5}" fill="${INK}"/>`;
  s+=`<text x="${R+4}" y="${axisY+20}" font-size="15" font-style="italic">x</text>`;
  const cap=inside?(closed?'x축 아래 + x축에 닿는 곳 (≤ 0)':'x축보다 아래인 곳 (< 0)'):(closed?'x축 위 + x축에 닿는 곳 (≥ 0)':'x축보다 위인 곳 (> 0)');
  s+=`<text x="${W/2}" y="20" font-size="16" text-anchor="middle" fill="${RED}" font-weight="700">빨간 곡선 = ${cap}</text>`;
  // 수직선 (아래)
  const xa=X(al),xb=X(be);
  const box=(x1,x2)=>`<rect x="${x1}" y="${nlY-16}" width="${x2-x1}" height="16" fill="#fecdd3" stroke="${RED}" stroke-width="1.6"/>`;
  s+=inside?box(xa,xb):box(L-10,xa)+box(xb,R+2);
  s+=`<line x1="${L-14}" y1="${nlY}" x2="${R+8}" y2="${nlY}" stroke="${INK}" stroke-width="2"/><polygon points="${R+14},${nlY} ${R+5},${nlY-5} ${R+5},${nlY+5}" fill="${INK}"/>`;
  [[xa,al],[xb,be]].forEach(([x,v])=>{
    s+=`<line x1="${x}" y1="${axisY}" x2="${x}" y2="${nlY}" stroke="#64748b" stroke-width="1.4" stroke-dasharray="5 5"/>`;
    s+=`<circle cx="${x}" cy="${axisY}" r="5.5" fill="${closed?INK:'#fff'}" stroke="${INK}" stroke-width="2.2"/>`;
    s+=`<circle cx="${x}" cy="${nlY}" r="6" fill="${closed?INK:'#fff'}" stroke="${INK}" stroke-width="2.2"/>`;
    s+=`<text x="${x}" y="${nlY+24}" font-size="17" text-anchor="middle" font-weight="700">${_neg(v)}</text>`;});
  s+=`<text x="${W/2}" y="${H-6}" font-size="13" text-anchor="middle" fill="#475569">${closed?'● 채운 점 : 그 수도 해에 들어감 (이상·이하)':'○ 빈 점 : 그 수는 해에서 빠짐 (초과·미만)'}</text>`;
  return s+'</svg>';
}
function genIneqQ(){
  const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const pk=arr=>arr[Math.floor(Math.random()*arr.length)];
  let al,be;do{al=ri(-5,3);be=ri(al+2,Math.min(al+6,6));}while(al===0&&be===0);
  const op=pk(['≤','<','≥','>']);
  const inside=op==='<'||op==='≤',closed=op==='≤'||op==='≥';
  const opTex={'≤':'\\le','<':'<','≥':'\\ge','>':'>'}[op];
  const fac=r=>r===0?'x':`(x${r>0?'-'+r:'+'+(-r)})`;
  const expanded=Math.random()<0.25;            // 넷 중 하나는 전개된 꼴 — 인수분해부터 해야 한다
  const b1=-(al+be),c1=al*be;
  const expTex=expanded?`x^2${b1?(b1===1?'+x':b1===-1?'-x':_sgn(b1)+'x'):''}${c1?_sgn(c1):''}`:`${fac(al)}${fac(be)}`;
  const expTxt=expTex.replace(/\^2/g,'²').replace(/-/g,'−');
  const asPic=Math.random()<0.5;                // 보기 : 수직선 그림 / 글
  const T=(ins,cl)=>ins?(cl?`${_neg(al)} ≤ x ≤ ${_neg(be)}`:`${_neg(al)} < x < ${_neg(be)}`)
    :(cl?`x ≤ ${_neg(al)} 또는 x ≥ ${_neg(be)}`:`x < ${_neg(al)} 또는 x > ${_neg(be)}`);
  const combos=_shuffleList([[true,true],[true,false],[false,true],[false,false]]);
  const ans=combos.findIndex(([i,c])=>i===inside&&c===closed);
  const choices=combos.map(([i,c])=>T(i,c));
  return{lv:'ineq',topic:'이차부등식',
    qHtml:`이차부등식의 해를 ${asPic?'<b>수직선 위에 나타낸 것</b>은':'구하면'}?${_eq(_tx(`${expTex}${opTex}0`))}`,
    q:`이차부등식 ${expTxt} ${op} 0 의 해`,
    svg:'',svgAfter:ineqTeachSVG(al,be,op),
    choices,ans,answer:choices[ans],cols:asPic?2:1,
    choiceHtml:asPic?combos.map(([i,c])=>ineqLineSVG({al,be,inside:i,closed:c})):null,
    sol:[expanded?`먼저 인수분해합니다 : ${_tx(`${expTex}=${fac(al)}${fac(be)}`)} → 두 근은 x = ${_neg(al)}, x = ${_neg(be)}`
        :`${_tx(`${fac(al)}${fac(be)}=0`)} 의 두 근은 x = ${_neg(al)}, x = ${_neg(be)} 입니다.`,
      inside?`부등호가 <b>0보다 작다(${op})</b> → 아래로 볼록한 곡선이 x축 <b>아래</b>로 내려간 곳 = 두 근의 <b>사이</b>`
        :`부등호가 <b>0보다 크다(${op})</b> → 곡선이 x축 <b>위</b>로 올라간 곳 = 두 근의 <b>바깥쪽</b> (양쪽)`,
      closed?`'같다(=)'가 있으므로 두 근도 해에 들어갑니다 → <b>● 채운 점</b> (이상·이하)`
        :`'같다(=)'가 없으므로 두 근은 해에서 빠집니다 → <b>○ 빈 점</b> (초과·미만)`,
      `따라서 해는 <b>${choices[ans]}</b>`]};
}

/* ── 기록 → 문제 다시 만들기 (선생님 화면 · teacher/logQView.js) ──────────
   새 기록 : 남겨 둔 씨앗(cSeed)으로 같은 문제를 그대로 만든다.
   예전 기록(씨앗 없음) : 씨앗을 차례로 돌려 문제 글·정답·학생 답이 기록과 같게 나오는 것을 찾는다.
     찾는 동안은 GS.planeSVG 를 빈 함수로 바꿔 빠르게 돌고, 찾은 씨앗으로 한 번 더 제대로 그린다.
     예전 기록은 보기 순서가 남아 있지 않아, 보기 순서는 학생이 본 것과 다를 수 있다(exact:false).
   돌려주는 값 : {q, exact} 또는 null(생성기 글이 바뀐 아주 옛 기록 등) */
var COORD_TOPIC_LV={'좌표 읽기':'low','평행이동':'mid','대칭이동':'high','유리함수 평행이동':'rat','무리함수 평행이동':'irr',
  '이차함수 최대·최소':'quad','내분점(수직선)':'div','내분점(좌표평면)':'div','이차부등식':'ineq'};
var _coordReplayCache=new Map();
function coordReplay(rec){
  const full=rec.qFull||'',pre=rec.qTxt||'';
  const key=[rec.cSeed,rec.meta&&rec.meta.type,full||pre,rec.cAns,rec.uAns].join('|');
  if(_coordReplayCache.has(key))return _coordReplayCache.get(key);
  const sameText=q=>full?q.q===full:(pre&&q.q.slice(0,pre.length)===pre);
  const sameAns=q=>{const c=q.choices.map(String);
    if(rec.choices)return c.join('|')===rec.choices.join('|')&&q.ans===rec.answerIdx;
    return c[q.ans]===String(rec.cAns)&&(rec.uAns==null||c.includes(String(rec.uAns)));};
  const pr=(async()=>{
    if(rec.cSeed!=null&&rec.cLv){
      const q=withSeed(rec.cSeed,()=>genCoordQ(rec.cLv));
      if(sameText(q)&&sameAns(q))return{q,exact:true};
    }
    const lv=COORD_TOPIC_LV[rec.meta&&rec.meta.type];
    if(!lv||!(full||pre))return null;
    const G=window.GS;
    const hit=await replaySearch([()=>genCoordQ(lv)],q=>sameText(q)&&sameAns(q),
      {limit:lv==='low'?6000:80000,wrap:f=>{const P=G.planeSVG;G.planeSVG=()=>'';try{f();}finally{G.planeSVG=P;}}});
    if(!hit)return null;
    return{q:withSeed(hit.seed,()=>genCoordQ(lv)),exact:!!rec.choices};
  })();
  _coordReplayCache.set(key,pr);
  return pr;
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
  const[confirmOpen,setConfirmOpen]=useState(false);
  const[lockMsg,setLockMsg]=useState(false);          // 아직 열리지 않은 유형을 눌렀을 때
  const[stampOpen,setStampOpen]=useState(false);      // 10문제를 끝내면 '참 잘했어요' 도장   // 제출 확인 시트 — 잘못 눌러 바로 채점되는 일을 막는다
  const savingRef=React.useRef(false);   // 한 묶음은 한 번만 저장한다
  const savedRef=React.useRef(null);
  const texRef=React.useRef(null);   // 최상 문제의 식(KaTeX)을 그릴 자리
  React.useEffect(()=>{if(texRef.current&&window.GS)GS.renderTex(texRef.current);});     // {id, upd} — 소감을 고르면 이 기록에 덧붙인다

  const today=todayStr();
  // 오늘 이미 푼 기록이 있는지 (홈의 도장과 같은 기준)
  const doneToday=(userData.logs||[]).some(l=>l.date===today&&(l.type||'').indexOf('좌표 10문제')===0);

  const start=(k)=>{
    if(coordLevelLocked(COORD_LEVELS.find(l=>l.k===k),userData.name)){setLockMsg(true);return;}
    // 씨앗을 남겨 두면 선생님 화면에서 같은 문제(식·그림·보기 순서)를 그대로 다시 그릴 수 있다 (core/replay.js)
    const list=[];for(let i=0;i<TOTAL;i++){const seed=newSeed();list.push({...withSeed(seed,()=>genCoordQ(k)),seed,genLv:k});}
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
    setConfirmOpen(false);
    if(phase!=='quiz'||sel===null||!q)return;   // 연타로 두 번 채점되지 않게
    const isOk=sel===q.ans;
    const rec={qTxt:q.q.slice(0,60),qFull:q.q,uAns:String(q.choices[sel]),cAns:String(q.choices[q.ans]),isOk,
      timeSec:Math.round((Date.now()-qStartAt)/1000),
      firstClickMs:firstClick,revisionCount:null,
      qTopicHash:getTopicHash({meta:{type:q.topic}}),
      meta:{category:'geometry',type:q.topic,diff:q.lv==='low'?'기초':q.lv==='mid'?'기초':'기하'},
      cSeed:q.seed,cLv:q.genLv,choices:q.choices.map(String),answerIdx:q.ans};
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
      setIdx(idx+1);setSel(null);setFirstClick(null);setConfirmOpen(false);setQStartAt(Date.now());setPhase('quiz');
      return;
    }
    setStampOpen(true);   // 쾅 — 도장을 찍고 소감 고르기로
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
        {COORD_LEVELS.map(l=>{const locked=coordLevelLocked(l,userData.name);return(
          <button key={l.k} onClick={()=>start(l.k)}
            className={`w-full text-left bg-white rounded-3xl p-5 shadow-md active:scale-[0.98] transition-transform border-2 ${l.border}`}>
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl ${l.chip} flex items-center justify-center text-sm leading-tight text-center font-black shrink-0 px-1`}>{l.badge}</div>
              <div className="flex-1">
                <div className="text-lg font-black text-gray-800">{l.lbl}{locked&&<span className="ml-2 text-xs font-black text-gray-400">🔒 {l.openLbl} 열림</span>}</div>
                <div className="text-sm font-bold text-gray-500 mt-0.5">{l.desc}</div>
              </div>
              <div className="text-2xl text-gray-300">›</div>
            </div>
          </button>);})}
      </div>

      {lockMsg&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5" onClick={()=>setLockMsg(false)}>
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center fade-in" onClick={e=>e.stopPropagation()}>
            <div className="text-5xl mb-3">🛠️</div>
            <div className="text-xl font-black text-gray-800 leading-relaxed break-keep">앗, 선생님이 아직 학생분들을 위해 작업중이에요!<br/>얼른 보여드릴게요!</div>
            <button onClick={()=>setLockMsg(false)} className="mt-5 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">확인</button>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-4">
        <div className="text-sm font-black text-indigo-700 mb-1">💡 이렇게 나옵니다</div>
        <div className="text-sm font-bold text-indigo-600 leading-relaxed break-keep">
          옮긴 점은 <b>그림에 그려 주지 않습니다.</b> 머릿속으로 규칙을 써서 좌표를 구하고, 답을 고른 뒤에 그림으로 확인하게 됩니다.
        </div>
      </div>
    </div>);
  }

  if(phase==='reflect')return<>
    <FeelingPicker title="좌표 10문제 끝!" onPick={chooseFeeling}/>
    {stampOpen&&<StampOverlay sub={`${correct} / ${TOTAL} 맞혔어요`} onClose={()=>setStampOpen(false)}/>}
  </>;

  /* ── 다 풀었을 때 ── */
  if(phase==='done'){
    const rate=Math.round(correct/TOTAL*100);
    return(<div className="p-4 space-y-4 pb-36">
      <div className="bg-white rounded-3xl p-6 shadow-md text-center">
        <div className="mb-2"><StampBadge size={128}/></div>
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
    <div className={`grid gap-3 ${q.cols===1||q.lv==='rat'||q.lv==='irr'?'grid-cols-1':'grid-cols-2'}`}>
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
            <span className="opacity-60 mr-1">{ORD[i]}</span> {q.choiceHtml?<span className="block mt-1" dangerouslySetInnerHTML={{__html:q.choiceHtml[i]}}/>:c}
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
        {q.lv==='div'&&<div className="text-xs font-bold text-gray-400 mt-3">위 그림의 초록 P 가 내분점, 회색 눈금·점이 한 칸씩입니다.</div>}
      </div>
    )}

    {phase==='quiz'
      ?<button onClick={()=>{if(sel!==null)setConfirmOpen(true);}} disabled={sel===null}
        className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${sel===null?'bg-gray-200 text-gray-400':'bg-indigo-600 text-white'}`}>
        {sel===null?'답을 먼저 골라 주세요':'제출하기'}
      </button>
      :<button onClick={next}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">
        {idx+1<TOTAL?'다음 문제 →':'결과 보기 →'}
      </button>}

    {/* ── 제출 확인 시트 (문제풀기 탭과 같은 모양) — 바깥을 누르면 다시 고르기 ── */}
    {confirmOpen&&phase==='quiz'&&sel!==null&&(
      <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 fade-in" onClick={()=>setConfirmOpen(false)}>
        <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2"/>
          <p className="text-center text-base font-black text-gray-800 leading-relaxed">
            {q.choiceHtml?<React.Fragment><span className="text-indigo-600">{ORD[sel]}</span> 그림을 골랐습니다.<span className="block mt-2" dangerouslySetInnerHTML={{__html:q.choiceHtml[sel]}}/></React.Fragment>
              :<React.Fragment>「<span className="text-indigo-600">{ORD[sel]} {q.choices[sel]}</span>」를 골랐습니다.</React.Fragment>}
          </p>
          <p className="text-center text-gray-500 font-bold text-sm">제출하시겠습니까?</p>
          <div className="flex gap-3">
            <button onClick={()=>setConfirmOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-lg active:scale-95 transition-all">다시 고르기</button>
            <button onClick={check} className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-all">제출</button>
          </div>
        </div>
      </div>
    )}
  </div>);
}
