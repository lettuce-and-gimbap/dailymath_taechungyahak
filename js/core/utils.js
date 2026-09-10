// === js/core/utils.js ===
/* --------------------------------------------------------------------
   공용 도우미 함수
   날짜/주차 · 수 계산 · 수식 문자열 포맷 (화면·생성기 공용)
   -------------------------------------------------------------------- */

var todayStr=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

var timeStr=()=>{const d=new Date();return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};

var fmtDate=s=>{const d=new Date(s);const dy=['일','월','화','수','목','금','토'];return`${d.getMonth()+1}월 ${d.getDate()}일(${dy[d.getDay()]})`};

// 오늘로부터 며칠 전인지 (날짜 문자열 'YYYY-MM-DD' 기준, 자정 기준 정수 일수)
var daysSince=s=>{
  if(!s)return 9999;
  var d=new Date(s);if(isNaN(d))return 9999;
  var t=new Date();
  var d0=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  var t0=new Date(t.getFullYear(),t.getMonth(),t.getDate());
  return Math.round((t0-d0)/86400000);
};

var gcdFn=(a,b)=>b===0?Math.abs(a):gcdFn(b,a%b);

var lcmFn=(a,b)=>(a*b)/gcdFn(a,b);

var randInt=(lo,hi)=>Math.floor(Math.random()*(hi-lo+1))+lo;

var pick=a=>a[Math.floor(Math.random()*a.length)];

var cl5=v=>Math.max(-5,Math.min(5,Math.round(v)));

var shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

var distFracStr=(num,denSq)=>{if(num===0)return"0";const sqI=Math.round(Math.sqrt(denSq));if(sqI*sqI===denSq){if(sqI===0)return"0";const g=gcdFn(num,sqI);const n=num/g,d=sqI/g;return d===1?String(n):`${n}/${d}`}return`${num}/√${denSq}`};

// ── 수식 표기 헬퍼 ──
// 분수 텍스트: "3/4" → "³⁄₄" 스타일 대신 가독성 위해 "3/4" 유지하되 앞뒤 공백 없이
// 선지에 표시될 때 렌더러에서 수식 클래스로 감쌈
var fmtFrac=(n,d)=>d===1?String(n):`${n}/${d}`;

// 루트 표기: √ 유니코드 + 숫자 (√25=5이면 5로, 아니면 √n)
var fmtSqrt=(n)=>{const s=Math.round(Math.sqrt(n));return s*s===n?String(s):`√${n}`;};

// 원 방정식 항 포맷: (x-h)² 형태
var fmtCircleTerm=(v,sym)=>{if(v===0)return`${sym}²`;if(v>0)return`(${sym}−${v})²`;return`(${sym}+${-v})²`;};

// 원 방정식 wrongs 생성기 (중복/정답 제외 보장)
var circleWrongs=(h,k,r2,correct,extras=[])=>{
  const r=Math.round(Math.sqrt(r2));
  const hEq=fmtCircleTerm(h,'x'),kEq=fmtCircleTerm(k,'y');
  const hWr=fmtCircleTerm(-h,'x'),kWr=fmtCircleTerm(-k,'y');
  const cands=[
    `${hWr}+${kEq}=${r2}`,       // x 부호 반전
    `${hEq}+${kWr}=${r2}`,       // y 부호 반전
    `${hEq}+${kEq}=${r}`,        // r² → r
    `${hEq}+${kEq}=${r2+r}`,     // r² + r
    ...extras
  ].map(String).filter(w=>w!==correct&&w!==undefined);
  return [...new Set(cands)].slice(0,3);
};

var eqSh=p=>p>0?`−${p}`:p<0?`+${-p}`:"";

var eqSg=q=>q>0?` + ${q}`:q<0?` − ${-q}`:"";

var getKSTMonday=()=>{
  const now=new Date();const kst=new Date(now.getTime()+9*60*60*1000);
  const day=kst.getUTCDay();const diff=day===0?-6:1-day;
  const mon=new Date(kst.getTime()+diff*24*60*60*1000);
  return`${mon.getUTCFullYear()}-${String(mon.getUTCMonth()+1).padStart(2,'0')}-${String(mon.getUTCDate()).padStart(2,'0')}`;
};

var weekDatesFrom=monday=>{
  const dates=[];
  for(let i=0;i<7;i++){
    const d=new Date(monday+'T00:00:00+09:00');d.setDate(d.getDate()+i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  }return dates;
};

/* ===== 수식 자동 렌더러 ===== */
// $...$, $$...$$, {a \over b}, \sqrt{a}, x^{a} 패턴을 KaTeX HTML로 변환
var autoMathHtml=(text)=>{
  if(!text)return'';
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const K=(expr,display)=>{
    try{return window.katex?window.katex.renderToString(expr,{displayMode:display,throwOnError:false,strict:false,output:'mathml'})
      :(display?`<div style="font-style:italic;text-align:center">${esc(expr)}</div>`:`<em>${esc(expr)}</em>`);}
    catch(e){return`<em>${esc(expr)}</em>`;}
  };
  const re=/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\{[^{}]*\\over[^{}]*\}|\\sqrt\{[^}]*\}|[a-zA-Z0-9]+\^\{[^}]*\})/g;
  const parts=[];let last=0,m;
  while((m=re.exec(text))!==null){
    if(m.index>last)parts.push({t:'txt',v:text.slice(last,m.index)});
    const s=m[1];
    if(s.startsWith('$$'))parts.push({t:'display',v:s.slice(2,-2)});
    else if(s.startsWith('$'))parts.push({t:'inline',v:s.slice(1,-1)});
    else parts.push({t:'inline',v:s});
    last=m.index+s.length;
  }
  if(last<text.length)parts.push({t:'txt',v:text.slice(last)});
  return parts.map(p=>p.t==='txt'?esc(p.v).replace(/\n/g,'<br/>')
    :p.t==='display'?K(p.v,true):K(p.v,false)).join('');
};
