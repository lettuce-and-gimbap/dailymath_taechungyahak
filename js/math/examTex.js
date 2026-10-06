// === js/math/examTex.js ===
/* --------------------------------------------------------------------
   생성기 글(사람이 읽는 평문) → 검정고시 시험지 모양 수식 (2026-10-06)
   쓰는 곳 : student/mockExam.js (MockQBody) · teacher/logQView.js

   생성기의 q · choices · sol 은 기록 · 선생님 화면 · 인쇄에 글자 그대로 쓰이므로 손대지 않고,
   화면에 그릴 때만 이 변환을 거친다 (기하학 탭의 geoTex 와 같은 생각).
     toExamTex('이차함수 y=(x−1)²+3의 최솟값은?')  →  '이차함수 $y=(x-1)^{2}+3$의 최솟값은?'
     examHtml(위 결과)                              →  KaTeX HTML
   규칙
   - 한글이 끊는 자리마다 '수식 덩어리'를 잘라 $…$ 로 감싼다 (x축 → $x$축).
   - 위첨자(²³⁻¹) · 루트(√5, √(x−a)) · 분수(3/5, −1/(x−2)) · 기호(× ÷ ≤ ≥ ∪ ∩ ∠ °) 를 TeX 로 바꾼다.
   - 대문자 점·도형 이름(A, AB, ABC, O)은 시험지처럼 바로 선 글씨, 길이로 쓰인 두 글자(AB=AC)는 윗줄(선분).
   - 단위(cm · km · g …)는 바로 선 글씨로 숫자 뒤에 조금 띄워 쓴다.
   생성기가 직접 시험지 모양을 정하고 싶으면 문항에 qTex(이미 $…$ 가 들어간 글)를 넣으면 이 변환을 건너뛴다.
   -------------------------------------------------------------------- */
var _EX_SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
var _EX_SUB={'₀':'0','₁':'1','₂':'2','₃':'3'};
var _EX_SYM={'×':'\\times ','÷':'\\div ','≤':'\\le ','≥':'\\ge ','≠':'\\ne ','∪':'\\cup ','∩':'\\cap ','∘':'\\circ ',
  '∠':'\\angle ','△':'\\triangle ','∆':'\\triangle ','α':'\\alpha ','β':'\\beta ','π':'\\pi ','…':'\\cdots ','⋯':'\\cdots ',
  '·':'\\cdot ','→':'\\to ','∈':'\\in ','⊂':'\\subset ','∅':'\\varnothing ','≒':'\\fallingdotseq ','∞':'\\infty ','∽':'\\backsim ','□':'\\square '};
/* 수식 덩어리에 들어갈 수 있는 글자 */
var _EX_MCH=/[A-Za-z0-9 ()\[\]{}|+\-−×÷=≠≤≥<>√\/²³⁴⁵⁶⁷⁸⁹⁰¹⁻₀₁₂₃.,:∠°△∆∪∩∘′'αβπ…⋯·→∈⊂∅≒∞∽̄̇]/;
var _EX_UNIT=/(\d)\s?(cm²|cm|km|mm|mg|kg|m²|g|L|mL)(?![A-Za-z])/g;

/* 괄호 짝 찾기 : s[i] 가 '(' 일 때 짝 ')' 의 위치 */
function _exClose(s,i){let d=0;for(let k=i;k<s.length;k++){if(s[k]==='(')d++;else if(s[k]===')'){d--;if(!d)return k;}}return-1;}

/* 수식 덩어리 하나(평문) → TeX */
function _exRunTex(r){
  let s=r.replace(/−/g,'-').replace(/\.\.\./g,'…');
  s=s.replace(/[{}]/g,c=>'\\'+c);                              // 집합 기호 { } 는 글자 그대로
  s=s.replace(/([a-z])̄/g,'\\bar{$1}');                       // z̄
  s=s.replace(/(\d)̇/g,'\\dot{$1}');                          // 순환소수 점 0.7̇
  /* 루트 */
  let out='';
  for(let i=0;i<s.length;i++){
    if(s[i]==='√'){
      if(s[i+1]==='('){const j=_exClose(s,i+1);if(j>0){out+=`\\sqrt{${s.slice(i+2,j)}}`;i=j;continue;}}
      const m=s.slice(i+1).match(/^(-?\d+|[a-z])/);
      if(m){out+=`\\sqrt{${m[1]}}`;i+=m[1].length;continue;}
    }
    out+=s[i];
  }
  s=out;
  /* 위첨자·아래첨자 */
  s=s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g,m=>`^{${m.split('').map(c=>_EX_SUP[c]).join('')}}`);
  s=s.replace(/[₀₁₂₃]+/g,m=>`_{${m.split('').map(c=>_EX_SUB[c]).join('')}}`);
  /* 분수 a/b — 원자 : 수 · 문자 하나 · √ · (…) */
  const ATOM='(?:\\d+(?:\\\\sqrt\\{[^}]*\\})?|\\\\sqrt\\{[^}]*\\}|[a-z]|\\([^()]*\\))';
  s=s.replace(new RegExp(`(^|[^A-Za-z0-9}])(-?)(${ATOM})\\/(${ATOM})`,'g'),(m,pre,neg,a,b)=>{
    const un=t=>t[0]==='('&&t[t.length-1]===')'?t.slice(1,-1):t;
    return`${pre}${neg}\\dfrac{${un(a)}}{${un(b)}}`;});
  /* 단위 */
  s=s.replace(/\((cm|mm|km|mg|kg|g|m|L|mL)\)/g,'(\\mathrm{$1})');
  s=s.replace(_EX_UNIT,(m,d,u)=>`${d}\\,\\mathrm{${u.replace('²','^2')}}`);
  /* 삼각비 */
  s=s.replace(/\b(sin|cos|tan)\s*/g,'\\$1 ');
  /* 대문자 이름 : 길이(AB=…, =AB)는 윗줄, 나머지는 바로 선 글씨 */
  s=s.replace(/(\\angle\s*|\\triangle\s*)?(?<![\\a-zA-Z])([A-Z]+)(?![a-zA-Z])/g,(m,pre,w,off,str)=>{
    if(pre)return`${pre}\\mathrm{${w}}`;
    const after=str.slice(off+m.length),before=str.slice(0,off);
    if(w.length===2&&(/^\s*=/.test(after)||/=\s*$/.test(before))&&!/^\s*\(/.test(after))return`\\overline{\\mathrm{${w}}}`;
    return`\\mathrm{${w}}`;});
  /* 기호 */
  s=s.replace(/[×÷≤≥≠∪∩∘∠△∆αβπ…⋯·→∈⊂∅≒∞∽□]/g,c=>_EX_SYM[c]);
  s=s.replace(/°/g,'^{\\circ}').replace(/′/g,"'");
  s=s.replace(/,\s+/g,',\\ ').replace(/:/g,'\\,:\\,');
  return s.trim();
}

/* 평문 → $…$ 가 섞인 글 */
function toExamTex(plain){
  if(plain==null)return'';
  const str=String(plain);
  let out='',i=0;
  while(i<str.length){
    if(!_EX_MCH.test(str[i])){out+=str[i++];continue;}
    let j=i;while(j<str.length&&_EX_MCH.test(str[j]))j++;
    let run=str.slice(i,j);
    /* 앞뒤 공백 · 문장부호 · 짝 없는 괄호는 글로 남긴다 */
    let lead='',tail='';
    const peelL=()=>{const m=run.match(/^[\s,.:']+/);if(m){lead+=m[0];run=run.slice(m[0].length);return true;}
      if(run[0]==='('&&_exClose(run,0)<0){lead+='(';run=run.slice(1);return true;}return false;};
    const peelR=()=>{const m=run.match(/[\s,.:']+$/);if(m){tail=m[0]+tail;run=run.slice(0,-m[0].length);return true;}
      if(run.endsWith(')')){let d=0;for(const c of run){if(c==='(')d++;else if(c===')')d--;}if(d<0){tail=')'+tail;run=run.slice(0,-1);return true;}}return false;};
    while(peelL()||peelR());
    if(run&&/[A-Za-z0-9√²³⁻∠°αβπ]/.test(run))out+=lead+'$'+_exRunTex(run)+'$'+tail;
    else out+=lead+run+tail;
    i=j;
  }
  return out;
}

/* $…$ 가 섞인 글 → HTML (KaTeX 의 보통 HTML 출력 — 시험지 글꼴) */
function examHtml(tex){
  if(!tex)return'';
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return String(tex).split(/(\$[^$]+\$)/g).map(p=>{
    if(p.length>1&&p[0]==='$'&&p[p.length-1]==='$'){
      const e=p.slice(1,-1);
      try{return window.katex?window.katex.renderToString(e,{throwOnError:false,strict:false}):`<i>${esc(e)}</i>`;}catch(_){return`<i>${esc(e)}</i>`;}
    }
    return esc(p).replace(/\n/g,'<br/>');
  }).join('');
}
/* 문항의 글 · 보기를 시험지 모양 HTML 로 (qTex 가 있으면 그것을 쓴다) */
var examQHtml=q=>examHtml(q.qTex||toExamTex(q.q));
var examChoiceHtml=c=>examHtml(toExamTex(c));
