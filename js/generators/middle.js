// === js/generators/middle.js ===
/* --------------------------------------------------------------------
   중졸 검정고시 생성기 (2026-10-06 다시 씀)
   2021-1회 ~ 2026-2회 12회분 기출을 문항 번호별로 대조해 유형을 나눴다.
     1 소인수분해 · 2 정수(계산·대소·절댓값·순서) · 3 문자와 식(식의 값·문자로 나타내기) · 4 일차방정식
     5 좌표 읽기·이동 거리 그래프 · 6 평행선·부채꼴·회전체·정다면체 · 7 도수분포표·줄기와 잎·상대도수
     8 순환소수·유한소수 · 9 지수법칙 · 10 연립방정식·일차부등식(수직선 그림) · 11 일차함수
     12 이등변삼각형·삼각형의 각 · 13 닮음·평행선과 비·피타고라스 · 14 경우의 수·확률
     15 제곱근 · 16 이차방정식 · 17 이차함수 그래프 · 18 삼각비 · 19 원의 성질 · 20 대푯값
   - 문제 글(q)은 기록·선생님 화면·인쇄에 그대로 쓰이는 평문이다. 시험지 모양 수식은 화면에서만
     js/math/examTex.js 가 바꾼다. 순환소수 점(0.7̇)처럼 평문으로 못 쓰는 것만 qTex 를 따로 준다.
   - 그림은 graph 데이터로 넘기고 js/ui/examFig.js · examFigShapes.js 가 그린다. 표는 table, 자료 상자는 box.
   - 같은 유형도 이야기(사탕 주머니·옷·빵과 음료·통학 시간…)를 여러 개 두어 매번 다르게 나온다.
   -------------------------------------------------------------------- */
var _mN=v=>v<0?`−${-v}`:String(v);               // 평문 음수 표기
var _mP=v=>v<0?`(−${-v})`:String(v);             // 괄호 친 음수
var _mS=v=>v<0?`−${-v}`:`+${v}`;                 // 부호 붙은 항
var _josa=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1);if(c>=0xAC00&&c<=0xD7A3)return(c-0xAC00)%28?a:b;
  return /[013678]$/.test(String(w))?a:b;};       // 받침 있으면 a(을/이/은), 없으면 b(를/가/는)
var _sup=n=>String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
var _pow=(b,e)=>e===1?String(b):`${b}${_sup(e)}`;
var _MM=(cat,type)=>middleMeta(cat,type);

/* ── 1. 소인수분해 ───────────────────────────────────── */
function _primeFactors(n){const f=[];let m=n;for(let p=2;m>1;p++)while(m%p===0){f.push(p);m/=p;}return f;}
function _factorStr(n){const f=_primeFactors(n),c={};f.forEach(p=>c[p]=(c[p]||0)+1);return Object.keys(c).map(Number).sort((a,b)=>a-b).map(p=>_pow(p,c[p])).join('×');}
function genMidPrime(){
  const n=pick([12,18,20,24,28,36,40,44,45,48,50,52,54,56,60,63,72,75,80,84,90,96,98,100,108]);
  const style=pick(['tree','ladder']);
  const f=_primeFactors(n),correct=_factorStr(n);
  const c={};f.forEach(p=>c[p]=(c[p]||0)+1);const ps=Object.keys(c).map(Number);
  const mk=arr=>arr.map(([p,e])=>_pow(p,e)).join('×');
  const wr=new Set();
  ps.forEach(p=>{wr.add(mk(ps.map(q=>[q,q===p?c[q]+1:c[q]])));if(c[p]>1)wr.add(mk(ps.map(q=>[q,q===p?c[q]-1:c[q]])));});
  wr.add(mk(ps.map(q=>[q,1])));wr.delete(correct);
  const ask=pick(['all','all','exp']);
  if(ask==='exp'&&ps.some(p=>c[p]>1)){
    const p=pick(ps.filter(p=>c[p]>1)),e=c[p];
    const shown=ps.map(q=>q===p?`${p}ᵃ`:_pow(q,c[q])).join('×');
    const{choices,answer}=makeChoices(String(e),[e-1,e+1,e+2].filter(v=>v>0).map(String));
    return{topic:'소인수분해',q:`다음은 ${n}${_josa(n,'을','를')} 소인수분해하는 과정을 나타낸 것이다. ${n}=${shown}일 때, 자연수 a의 값은?`,
      qTex:`다음은 $${n}$${_josa(n,'을','를')} 소인수분해하는 과정을 나타낸 것이다. $${n}=${shown.replace(/×/g,'\\times ').replace('ᵃ','^{a}').replace(/([0-9])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,(m,b,s)=>`${b}^{${s.split('').map(x=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(x)).join('')}}`)}$일 때, 자연수 $a$의 값은?`,
      choices,answer,graph:{type:'factor_tree',n,style},meta:_MM('mid_num','수와 연산'),
      sol:[`${n}을 가장 작은 소수부터 차례로 나눕니다.`,`${n} = ${correct}`,`${p}가 ${e}번 곱해졌으므로 a = ${e}입니다.`]};
  }
  const{choices,answer}=makeChoices(correct,[...wr]);
  return{topic:'소인수분해',q:`다음은 ${n}${_josa(n,'을','를')} 소인수분해하는 과정을 나타낸 것이다. ${n}${_josa(n,'을','를')} 소인수분해한 결과로 옳은 것은?`,
    choices,answer,graph:{type:'factor_tree',n,style},meta:_MM('mid_num','수와 연산'),
    sol:[`가장 작은 소수(2, 3, 5, 7…)부터 더 나눌 수 없을 때까지 나눕니다.`,`나눈 소수 : ${f.join(', ')}`,`같은 수는 거듭제곱으로 묶어 씁니다 → ${n} = ${correct}`]};
}

/* ── 2. 정수 : 계산 · 대소 · 절댓값 · 순서 ─────────────── */
function genMidNumber(){
  const t=pick(['add','mul','abs','cmp','order']);
  if(t==='add'||t==='mul'){
    const a=pick([-6,-5,-4,-3,-2,2,3,4,5,6]),b=pick([-5,-4,-3,-2,2,3,4,5]);
    const ans=t==='add'?a+b:a*b;
    const sgn=v=>v<0?`(−${-v})`:`(+${v})`;
    const{choices,answer}=makeChoices(_mN(ans),[-ans,t==='add'?a-b:a+b,t==='add'?-(a-b):-(a+b)].filter(v=>v!==ans).map(_mN));
    return{topic:'정수의 계산',q:`${sgn(a)}${t==='add'?'+':'×'}${sgn(b)}${_josa(sgn(b),'을','를')} 계산한 값은?`,choices,answer,meta:_MM('mid_num','수와 연산'),
      sol:t==='add'?[`부호가 ${a*b>0?'같은 두 수의 덧셈은 절댓값의 합에 공통 부호':'다른 두 수의 덧셈은 절댓값의 차에 절댓값이 큰 쪽의 부호'}를 붙입니다.`,`${sgn(a)}+${sgn(b)} = ${_mN(ans)}`]
        :[`곱셈은 절댓값끼리 곱하고, 부호가 같으면 +, 다르면 − 를 붙입니다.`,`${sgn(a)}×${sgn(b)} = ${_mN(ans)}`]};
  }
  if(t==='abs'){
    const vals=shuffle([pick([-7,-6,-5]),pick([-3,-2,-1]),pick([1,2]),pick([3,4])]);
    const best=vals.reduce((m,v)=>Math.abs(v)>Math.abs(m)?v:m);
    const choices=vals.map(_mN);
    return{topic:'절댓값',q:`다음 중 절댓값이 가장 큰 수는?`,choices,answer:vals.indexOf(best),meta:_MM('mid_num','수와 연산'),
      sol:[`절댓값은 수직선에서 0까지의 거리입니다. 부호를 떼고 크기만 비교합니다.`,`${vals.map(v=>`|${_mN(v)}|=${Math.abs(v)}`).join(', ')}`,`가장 큰 것은 ${_mN(best)}입니다.`]};
  }
  if(t==='cmp'){
    const ok=pick([['−5','−2','<'],['−3','0','<'],['0','3/2','<'],['−1/2','5/2','<'],['4','−6','>'],['−4','−7','>']]);
    const bad=shuffle([['−1','−2','<'],['−3','0','>'],['6','−2','<'],['0','−3/2','<'],['3','5','>'],['−4','−1','<']].filter(b=>b[0]!==ok[0])).slice(0,3);
    // bad 중 실제로 맞는 것이 섞이지 않게 값으로 확인
    const val=s=>{const v=s.replace('−','-');return v.includes('/')?eval(v):+v;};
    const truth=([a,b,o])=>o==='<'?val(a)<val(b):val(a)>val(b);
    const wrongs=bad.filter(b=>!truth(b)).map(([a,b,o])=>`${a}${o}${b}`);
    while(wrongs.length<3)wrongs.push(`${randInt(2,5)}<−${randInt(1,5)}`);
    const correct=`${ok[0]}${ok[2]}${ok[1]}`;
    const{choices,answer}=makeChoices(correct,wrongs.slice(0,3));
    return{topic:'수의 대소',q:`다음 중 수의 대소 관계가 옳은 것은?`,choices,answer,meta:_MM('mid_num','수와 연산'),
      sol:[`수직선에서 오른쪽에 있는 수가 더 큽니다. (음수 < 0 < 양수)`,`음수끼리는 절댓값이 큰 쪽이 더 작습니다.`,`옳은 것은 ${correct}입니다.`]};
  }
  const pool=shuffle([pick([-7,-5,-4]),-1,pick([1,3]),pick([4,6,11]),'-2/3','1/2']).slice(0,5);
  const v=x=>typeof x==='string'?eval(x):x,show=x=>typeof x==='string'?x.replace('-','−'):_mN(x);
  const sorted=[...pool].sort((a,b)=>v(a)-v(b));const k=randInt(2,4);
  const ans=show(sorted[k-1]);
  const{choices,answer}=makeChoices(ans,pool.map(show).filter(s=>s!==ans));
  return{topic:'수의 대소',q:`다음 수를 작은 수부터 차례대로 나열할 때, ${['','첫','두','세','네'][k]} 번째 수는?`,box:pool.map(show).join(',   '),
    choices,answer,meta:_MM('mid_num','수와 연산'),
    sol:[`음수 < 0 < 양수, 음수끼리는 절댓값이 클수록 작습니다.`,`작은 순서 : ${sorted.map(show).join(' < ')}`,`${k}번째 수는 ${ans}입니다.`]};
}

/* ── 3. 문자와 식 : 식의 값 · 문자로 나타내기 ─────────── */
var MID_EXPR_STORIES=[
  ()=>{const p=pick([500,700,800,1200,1500]),it=pick(['막대 사탕','공책','볼펜','장미꽃','아이스크림','연필']),u=it==='장미꽃'?'송이':it==='공책'?'권':it==='볼펜'||it==='연필'?'자루':'개';
    return{q:`한 ${u}에 ${p}원인 ${it} a${u}의 가격`,unit:'원',c:`(${p}×a)`,w:[`(${p}+a)`,`(${p}−a)`,`(${p}÷a)`],sol:`(한 ${u}의 가격) × (${u} 수) = ${p}×a`};},
  ()=>{const n=pick([6,8,10,12,15]),it=pick(['사과','귤','배','감']);
    return{q:`한 상자에 ${it}${_josa(it,'이','가')} ${n}개씩 들어 있을 때, x개의 상자에 들어 있는 ${it}의 개수`,unit:'개',c:`(${n}×x)`,w:[`(${n}+x)`,`(${n}−x)`,`(${n}÷x)`],sol:`(한 상자의 개수) × (상자 수) = ${n}×x`};},
  ()=>{const b=pick([100,200,300]),w=pick([200,300,500]),it=pick(['토끼 인형','곰 인형','책','통조림']);
    return{q:`무게가 ${b}g인 빈 상자에 무게가 ${w}g인 ${it} x개를 넣었을 때, 상자 전체의 무게`,unit:'g',c:`(${w}x+${b})`,w:[`(${w}x−${b})`,`(${b}x+${w})`,`(${b}x−${w})`],sol:`${it} x개의 무게 ${w}x 에 빈 상자 ${b}g 을 더합니다.`};},
  ()=>{const v=pick([40,60,80]);
    return{q:`시속 ${v}km로 x시간 동안 달린 거리`,unit:'km',c:`(${v}×x)`,w:[`(${v}+x)`,`(${v}−x)`,`(${v}÷x)`],sol:`(거리) = (속력) × (시간) = ${v}×x`};},
  ()=>{const n=pick([3,4,5,6]);
    return{q:`한 변의 길이가 a cm인 정${['','','','삼','사','오','육'][n]}각형의 둘레의 길이`,unit:'cm',c:`(${n}×a)`,w:[`(${n}+a)`,`(a÷${n})`,`(${n}−a)`],sol:`길이가 같은 변이 ${n}개이므로 ${n}×a`};},
];
function genMidSubstitute(){
  const t=pick(['one','one','two','story','area']);
  if(t==='story'){
    const s=pick(MID_EXPR_STORIES)();
    const{choices,answer}=makeChoices(`${s.c}${s.unit}`,s.w.map(x=>x+s.unit));
    return{topic:'문자를 사용한 식',q:`다음을 문자를 사용한 식으로 바르게 나타낸 것은?`,box:s.q,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[s.sol,`따라서 ${s.c}${s.unit}입니다.`]};
  }
  if(t==='area'){
    const w=pick([4,5,6,8]),tri=Math.random()<0.5;
    const c=tri?`(${w}×a)/2 cm²`:`(${w}×a)cm²`;
    const ws=tri?[`(${w}+a)/2 cm²`,`(${w}×a)cm²`,`(${w}+a)cm²`]:[`(${w}+a)cm²`,`(2×a)cm²`,`(${w}÷a)cm²`];
    const{choices,answer}=makeChoices(c,ws);
    return{topic:'문자를 사용한 식',q:tri?`그림은 밑변의 길이가 ${w}cm, 높이가 a cm인 직각삼각형이다. 이 직각삼각형의 넓이를 문자를 사용한 식으로 나타낸 것은?`
        :`그림은 가로의 길이가 ${w}cm, 세로의 길이가 a cm인 직사각형이다. 이 직사각형의 넓이를 문자를 사용한 식으로 나타낸 것은?`,
      choices,answer,graph:{type:'area_shape',shape:tri?'rtri':'rect',w:`${w}cm`,h:'a cm'},meta:_MM('mid_alg','문자와 식'),
      sol:tri?[`(직각삼각형의 넓이) = (밑변) × (높이) ÷ 2`,`= (${w}×a)/2 cm²`]:[`(직사각형의 넓이) = (가로) × (세로)`,`= ${w}×a (cm²)`]};
  }
  if(t==='two'){
    const a=pick([-2,-1,1,2,3,4]),b=pick([-3,-1,1,2,3]),m=pick([2,3]),n=pick([1,2]);
    const sign=pick(['+','−']),ans=sign==='+'?m*a+n*b:m*a-n*b;
    const{choices,answer}=makeChoices(_mN(ans),[ans+1,ans-1,ans+2,-ans].filter(v=>v!==ans).map(_mN));
    const nb=n===1?'b':`${n}b`;
    return{topic:'식의 값',q:`a=${_mN(a)}, b=${_mN(b)}일 때, ${m}a${sign}${nb}의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`문자 자리에 수를 넣을 때 음수는 괄호로 감쌉니다.`,`${m}×${_mP(a)}${sign}${n===1?'':n+'×'}${_mP(b)} = ${_mN(ans)}`]};
  }
  const a=pick([-3,-2,-1,2,3,4,5]),m=randInt(2,5),b=pick([-4,-3,-1,1,2,3,5]),ans=m*a+b;
  const{choices,answer}=makeChoices(_mN(ans),[ans-2,ans+2,ans+m,-ans].filter(v=>v!==ans).map(_mN));
  return{topic:'식의 값',q:`a=${_mN(a)}일 때, ${m}a${_mS(b)}의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
    sol:[`a 자리에 ${_mN(a)}${a<0?'를 괄호로 감싸':'을'} 넣습니다.`,`${m}×${_mP(a)}${_mS(b)} = ${m*a}${_mS(b)} = ${_mN(ans)}`]};
}
var genMidWordExpr=genMidSubstitute;

/* ── 4. 일차방정식 ──────────────────────────────────── */
function genMidLinearEq(){
  const x=randInt(-2,7),c=randInt(1,4),a=c+randInt(1,4),b=randInt(-6,6),d=(a-c)*x+b;
  const L=_pl([[a,'x'],[b,'']]),R=_pl([[c,'x'],[d,'']]);
  const form=pick(['xx','const']);
  let q,sol;
  if(form==='const'||x===0){
    const k=randInt(2,5),s=randInt(-3,6),rhs=s-k*x;    // s − kx = rhs
    q=`일차방정식 ${s}−${k}x=${_mN(rhs)}의 해는?`;
    sol=[`상수항을 오른쪽으로 옮깁니다 : −${k}x = ${_mN(rhs)}−${_mP(s)} = ${_mN(rhs-s)}`,`양변을 −${k}로 나누면 x = ${_mN(x)}`];
  }else{
    q=`일차방정식 ${L}=${R}의 해는?`;
    sol=[`x 항은 왼쪽, 수는 오른쪽으로 옮깁니다 (옮기면 부호가 바뀝니다).`,`${_pl([[a,'x'],[-c,'x']])} = ${_mN(d)}${_mS(-b)} → ${a-c===1?'':a-c}x = ${_mN(d-b)}`,`x = ${_mN(x)}`];
  }
  const{choices,answer}=makeChoices(_mN(x),[x-1,x+1,x+2,-x].filter(v=>v!==x).map(_mN));
  return{topic:'일차방정식',q,choices,answer,meta:_MM('mid_alg','문자와 식'),sol};
}

/* ── 5. 좌표 읽기 · 이동 거리 그래프 ────────────────────── */
var MID_TRIP_STORIES=[
  {who:'어느 학생이 집에서 출발하여 학교까지 갈 때',dU:'km',tU:'분',tStep:10},
  {who:'어느 가족이 자동차를 타고 목적지까지 가는 동안',dU:'km',tU:'시간',tStep:1,dScale:50},
  {who:'어느 학생이 자전거를 타고 도서관까지 가는 동안',dU:'km',tU:'분',tStep:5},
  {who:'단축 마라톤 대회에 참가한 어느 학생이 달리는 동안',dU:'km',tU:'분',tStep:5},
  {who:'어느 등산객이 산 정상까지 걸어가는 동안',dU:'km',tU:'시간',tStep:1},
];
function genMidQuadrant(){
  const t=pick(['read','read','trip','trip','plot']);
  if(t==='trip'){
    const S=pick(MID_TRIP_STORIES),k=S.dScale||1,n=5;
    let pts=[[0,0]],d=0;const slopes=shuffle([1,1,2,1,3]).slice(0,n);
    for(let i=1;i<=n;i++){d+=pick([0,1,1,2]);pts.push([i,d]);}
    if(d<3){pts=[[0,0],[1,1],[2,2],[3,2],[4,3],[5,5]];d=5;}
    const ask=randInt(2,n-1),ans=pts[ask][1]*k;
    const tVal=ask*S.tStep;
    const{choices,answer}=makeChoices(`${ans}${S.dU}`,[ans+k,ans-k,ans+2*k,ans-2*k].filter(v=>v>0&&v!==ans).map(v=>`${v}${S.dU}`));
    return{topic:'그래프 해석',q:`다음은 ${S.who} 시간에 따른 이동 거리를 나타낸 그래프이다. 출발한 후 ${tVal}${S.tU} 동안 이동한 거리는?`,
      choices,answer,graph:{type:'trip',pts:pts.map(([a,b])=>[a*S.tStep,b*k]),tU:S.tU,dU:S.dU,tStep:S.tStep,dStep:k},meta:_MM('mid_func','함수'),
      sol:[`가로축에서 ${tVal}${S.tU}을 찾아 위로 올라가 그래프와 만나는 점을 찾습니다.`,`그 점에서 왼쪽 세로축을 읽으면 ${ans}${S.dU}입니다.`]};
  }
  const x=pick([-3,-2,-1,1,2,3]),y=pick([-3,-2,-1,1,2,3]);
  if(t==='plot'){
    const others=[[y,x],[-x,y],[x,-y],[-x,-y]].filter(([a,b])=>!(a===x&&b===y));
    const pts=shuffle([[x,y,'R'],...others.slice(0,3).map(p=>[...p,''])]).map((p,i)=>[p[0],p[1],'ABCD'[i],p[2]==='R']);
    const right=pts.findIndex(p=>p[3]);
    return{topic:'좌표와 사분면',q:`순서쌍 (${_mN(x)}, ${_mN(y)})${_josa(String(y),'을','를')} 좌표평면 위에 나타낸 점은?`,choices:['A','B','C','D'],answer:right,
      graph:{type:'grid_pts',pts:pts.map(p=>[p[0],p[1],p[2]])},meta:_MM('mid_func','함수'),
      sol:[`(x좌표, y좌표) 순서로 읽습니다. x=${_mN(x)}만큼 ${x>0?'오른쪽':'왼쪽'}, y=${_mN(y)}만큼 ${y>0?'위':'아래'}`,`그 자리에 있는 점은 ${'ABCD'[right]}입니다.`]};
  }
  const correct=`A(${_mN(x)}, ${_mN(y)})`;
  const{choices,answer}=makeChoices(correct,[`A(${_mN(y)}, ${_mN(x)})`,`A(${_mN(-x)}, ${_mN(y)})`,`A(${_mN(x)}, ${_mN(-y)})`,`A(${_mN(-x)}, ${_mN(-y)})`]);
  return{topic:'좌표와 사분면',q:`다음 좌표평면 위에 있는 점 A의 좌표는?`,choices,answer,graph:{type:'grid_pts',pts:[[x,y,'A']]},meta:_MM('mid_func','함수'),
    sol:[`점 A에서 x축으로 내려가 읽은 값이 x좌표 ${_mN(x)}, y축으로 옆으로 가서 읽은 값이 y좌표 ${_mN(y)}입니다.`,`따라서 ${correct}`]};
}

/* ── 6. 평행선과 각 · 부채꼴 · 회전체 · 정다면체 ─────────── */
function genMidParallel(){
  const t=pick(['par','par','sector','solid','poly']);
  if(t==='sector'){
    const a1=pick([20,30,40,45,60]),k=pick([2,3,4]),a2=a1*k,v1=pick([3,4,5,6,8,12]);
    const area=Math.random()<0.5,unit=area?'cm²':'cm';
    const ask=pick(['val','ang']);
    if(ask==='ang'){
      const{choices,answer}=makeChoices(`${a2}°`,[a2-10,a2+10,a2+20,a1*2===a2?a2+30:a1*2].filter(v=>v!==a2).map(v=>`${v}°`));
      return{topic:'부채꼴',q:`그림과 같이 원 O에서 부채꼴 AOB의 ${area?'넓이':'호의 길이'}는 ${v1}${unit}, 부채꼴 COD의 ${area?'넓이':'호의 길이'}는 ${v1*k}${unit}이다. ∠AOB=${a1}°일 때, ∠COD의 크기는?`,
        choices,answer,graph:{type:'sector',a1,a2,l1:`${v1}${unit}`,l2:`${v1*k}${unit}`,ask:'ang'},meta:_MM('mid_geo','기하'),
        sol:[`한 원에서 부채꼴의 ${area?'넓이':'호의 길이'}는 중심각의 크기에 정비례합니다.`,`${v1*k}÷${v1} = ${k}배이므로 ∠COD = ${a1}°×${k} = ${a2}°`]};
    }
    const ans=v1*k;
    const{choices,answer}=makeChoices(`${ans}${unit}`,[ans-v1,ans+v1,ans+2*v1].filter(v=>v>0&&v!==ans).map(v=>`${v}${unit}`));
    return{topic:'부채꼴',q:`그림과 같이 원 O에서 ∠AOB=${a1}°, ∠COD=${a2}°이다. 부채꼴 AOB의 ${area?'넓이':'호의 길이'}가 ${v1}${unit}일 때, 부채꼴 COD의 ${area?'넓이':'호의 길이'}는?`,
      choices,answer,graph:{type:'sector',a1,a2,l1:`${v1}${unit}`,ask:'val'},meta:_MM('mid_geo','기하'),
      sol:[`중심각이 ${a2}÷${a1} = ${k}배이므로 ${area?'넓이':'호의 길이'}도 ${k}배입니다.`,`${v1}×${k} = ${ans}${unit}`]};
  }
  if(t==='solid'){
    const S=pick([['rect','원기둥'],['semi','구'],['rtri','원뿔'],['trap','원뿔대']]);
    const ko=S[0]==='rect'?'직사각형 ABCD를 직선 l':S[0]==='semi'?'반원을 직선 l':S[0]==='rtri'?'직각삼각형 ABC를 직선 l':'사다리꼴 ABCD를 직선 l';
    const choices=['구','원뿔','원기둥','원뿔대'];
    return{topic:'회전체',q:`그림과 같이 ${ko}을 회전축으로 하여 1회전 시킬 때 생기는 입체도형은?`,choices,answer:choices.indexOf(S[1]),
      graph:{type:'rot_solid',shape:S[0]},meta:_MM('mid_geo','기하'),
      sol:[`평면도형을 한 직선을 축으로 1회전 시키면 회전체가 생깁니다.`,`${S[0]==='rect'?'직사각형 → 원기둥':S[0]==='semi'?'반원 → 구':S[0]==='rtri'?'직각삼각형 → 원뿔':'사다리꼴 → 원뿔대'}`]};
  }
  if(t==='poly'){
    const P=pick([['정사각형','정육면체'],['정오각형','정십이면체']]);
    const all=['정사면체','정육면체','정팔면체','정십이면체','정이십면체'];
    const choices=shuffle(all.filter(x=>x!==P[1])).slice(0,3).concat(P[1]);
    const ord=shuffle(choices);
    return{topic:'정다면체',q:`모든 면의 모양이 ${P[0]}인 정다면체는?`,choices:ord,answer:ord.indexOf(P[1]),meta:_MM('mid_geo','기하'),
      sol:[`정사면체·정팔면체·정이십면체는 정삼각형, 정육면체는 정사각형, 정십이면체는 정오각형 면입니다.`,`따라서 ${P[1]}입니다.`]};
  }
  const g=pick([35,40,45,50,55,60,65,70,75,80]);
  const kind=pick(['동위각','엇각','보각']);
  const ans=kind==='보각'?180-g:g;
  const{choices,answer}=makeChoices(`${ans}°`,[180-ans,ans+10,ans-10,90-g>0?90:ans+20].filter(v=>v>0&&v<180&&v!==ans).map(v=>`${v}°`));
  return{topic:'평행선과 각',q:`그림과 같이 평행한 두 직선 l, m이 다른 한 직선 n과 만날 때, ∠x의 크기는?`,choices,answer,
    graph:{type:'parallel',ang:g,kind},meta:_MM('mid_geo','기하'),
    sol:kind==='보각'?[`평행선에서 동위각(엇각)은 같습니다.`,`∠x 는 ${g}°와 한 직선을 이루므로 180°−${g}° = ${ans}°`]
      :[`평행한 두 직선이 다른 직선과 만날 때 ${kind}의 크기는 서로 같습니다.`,`∠x = ${g}°`]};
}

/* ── 7. 도수분포표 · 줄기와 잎 · 상대도수 ─────────────────── */
var MID_FREQ_STORIES=[
  {who:'어느 학급 학생',what:'지난 일주일 동안 독서한 시간',col:'독서 시간(시간)',unit:'시간',start:0,w:2},
  {who:'청소년',what:'하루 평균 스마트폰 사용 시간',col:'사용 시간(시간)',unit:'시간',start:0,w:1},
  {who:'어느 반 학생',what:'하루 수면 시간',col:'수면 시간(시간)',unit:'시간',start:4,w:1},
  {who:'어느 반 학생',what:'통학 시간',col:'통학 시간(분)',unit:'분',start:0,w:10},
  {who:'어느 반 학생',what:'1분 동안의 윗몸 일으키기 기록',col:'기록(회)',unit:'회',start:10,w:10},
  {who:'과자',what:'10g당 나트륨 함량',col:'나트륨 함량(mg)',unit:'mg',start:10,w:20,obj:'과자의 수(가지)',cnt:'가지'},
];
function genMidFrequency(){
  const t=pick(['table','table','stem','rel']);
  if(t==='stem'){
    const S=pick([{w:'어느 산악회원의 나이',u:'세',stems:[2,3,4,5,6],cut:40},{w:'학생들의 1분 동안 줄넘기 기록',u:'회',stems:[1,2,3,4,5],cut:30},
      {w:'학생들의 하루 휴대 전화 통화 시간',u:'분',stems:[1,2,3,4],cut:30},{w:'학생들의 수학 점수',u:'점',stems:[5,6,7,8,9],cut:80}]);
    const rows=S.stems.map(s=>[s,shuffle([0,1,2,3,4,5,6,7,8,9]).slice(0,randInt(2,5)).sort((a,b)=>a-b)]);
    const cnt=rows.filter(([s])=>s*10>=S.cut).reduce((n,[,l])=>n+l.length,0);
    const total=rows.reduce((n,[,l])=>n+l.length,0);
    const{choices,answer}=makeChoices(String(cnt),[cnt-1,cnt+1,cnt+2,cnt-2].filter(v=>v>0&&v!==cnt).map(String));
    return{topic:'줄기와 잎 그림',q:`다음은 ${S.w}을 조사하여 줄기와 잎 그림으로 나타낸 것이다. ${S.cut}${S.u} 이상인 것의 개수는? (${rows[0][0]}|${rows[0][1][0]}은 ${rows[0][0]*10+rows[0][1][0]}${S.u})`,
      table:{head:['줄기','잎'],rows:rows.map(([s,l])=>[String(s),l.join('   ')])},choices,answer,meta:_MM('mid_stat','확률과 통계'),
      sol:[`줄기는 십의 자리, 잎은 일의 자리입니다.`,`줄기 ${S.cut/10} 이상인 잎의 개수를 모두 세면 ${cnt}개입니다. (전체 ${total}개)`]};
  }
  const S=pick(MID_FREQ_STORIES);
  const k=5,ns=[];let N=pick([20,25,30,40]);
  /* 가운데 계급이 많고 양 끝이 적은 자연스러운 분포 */
  const wt=[1,2,3,2,1].map(v=>v+Math.random()*1.5),sw=wt.reduce((a,b)=>a+b,0);
  wt.forEach(v=>ns.push(Math.max(1,Math.round(v/sw*N))));
  ns[2]+=N-ns.reduce((a,b)=>a+b,0);
  if(ns[2]<1)return genMidFrequency();
  const lab=i=>i===0?`${S.start+i*S.w}이상 ~ ${S.start+(i+1)*S.w}미만`:`${S.start+i*S.w} ~ ${S.start+(i+1)*S.w}`;
  if(t==='rel'){
    const i=randInt(1,3),rel=ns[i]/N;
    if(!Number.isInteger(rel*100)||(rel*10)%1)return genMidFrequency();
    const rows=ns.map((n,j)=>[lab(j),String(n),j===i?'a':String(n/N)]);rows.push(['합계',String(N),'1']);
    const ans=String(rel);
    const{choices,answer}=makeChoices(ans,[rel+0.1,rel-0.1,rel+0.2].filter(v=>v>0&&v<1).map(v=>String(Math.round(v*10)/10)));
    return{topic:'상대도수',q:`다음은 ${S.who} ${N}${S.cnt||'명'}의 ${S.what}을 조사하여 나타낸 표이다. a의 값은?`,
      table:{head:[S.col,'학생 수(명)','상대도수'],rows,sumRow:true},choices,answer,meta:_MM('mid_stat','확률과 통계'),
      sol:[`(상대도수) = (그 계급의 도수) ÷ (도수의 총합)`,`a = ${ns[i]} ÷ ${N} = ${ans}`]};
  }
  const cut=randInt(1,k-1),above=Math.random()<0.6;
  const ans=above?ns.slice(cut).reduce((a,b)=>a+b,0):ns.slice(0,cut).reduce((a,b)=>a+b,0);
  const rows=ns.map((n,j)=>[lab(j),String(n)]);rows.push(['합계',String(N)]);
  const cv=S.start+cut*S.w;
  const{choices,answer}=makeChoices(String(ans),[ans-ns[cut]||ans+3,ans+ns[cut-1],ans+1,ans-1].filter(v=>v>0&&v!==ans).map(String));
  return{topic:'도수분포표',q:`다음은 ${S.who} ${N}${S.cnt||'명'}의 ${S.what}을 조사하여 나타낸 도수분포표이다. ${S.what.split(' ').pop()}이 ${cv}${S.unit} ${above?'이상':'미만'}인 ${S.obj?'과자':'학생'}의 수는?`,
    table:{head:[S.col,S.obj||'학생 수(명)'],rows,sumRow:true},choices,answer,meta:_MM('mid_stat','확률과 통계'),
    sol:[`${cv}${S.unit} ${above?'이상':'미만'}에 해당하는 계급의 도수를 모두 더합니다.`,`${(above?ns.slice(cut):ns.slice(0,cut)).join(' + ')} = ${ans}`]};
}

/* ── 8. 순환소수 · 유한소수 ─────────────────────────── */
function genMidRepeating(){
  const t=pick(['toFrac','toFrac','toDec','finite','finiteX','period']);
  if(t==='toFrac'){
    const n=randInt(1,8);const g=gcdFn(n,9),correct=`${n/g}/${9/g}`;
    const ws=[`${n}/10`,`${Math.min(9,n+1)}/9`,`${Math.max(1,n-1)}/9`].map(s=>{const[a,b]=s.split('/').map(Number);const gg=gcdFn(a,b);return`${a/gg}/${b/gg}`;});
    const{choices,answer}=makeChoices(correct,ws.filter(w=>w!==correct));
    return{topic:'순환소수',q:`순환소수 0.${n}̇을 기약분수로 나타낸 것은?`,qTex:`순환소수 $0.\\dot{${n}}$을 기약분수로 나타낸 것은?`,choices,answer,meta:_MM('mid_num','수와 연산'),
      sol:[`x = 0.${n}${n}${n}… 로 놓으면 10x = ${n}.${n}${n}…`,`10x − x = ${n} → 9x = ${n} → x = ${n}/9${g>1?` = ${correct}`:''}`]};
  }
  if(t==='toDec'){
    const n=randInt(1,8);if(n%3===0&&Math.random()<0.5)return genMidRepeating();
    const opts=[1,2,3,4].map(v=>`0.${v}̇`),corr=`0.${n}̇`;
    const ws=[n+1,n-1,n+2].filter(v=>v>0&&v<10).map(v=>`0.${v}̇`);
    const{choices,answer}=makeChoices(corr,ws);
    return{topic:'순환소수',q:`분수 ${n}/9를 순환소수로 나타낸 것은?`,choices,answer,choiceTex:true,meta:_MM('mid_num','수와 연산'),
      sol:[`${n}÷9 = 0.${n}${n}${n}… 이므로 ${n}이 되풀이됩니다.`,`순환마디 위에 점을 찍어 0.${n}̇ 으로 씁니다.`]};
  }
  if(t==='period'){
    const P=pick([['1/3','3','0.333…'],['2/11','18','0.1818…'],['1/7','142857','0.142857…'],['5/27','185','0.185185…'],['4/33','12','0.1212…']]);
    const{choices,answer}=makeChoices(P[1],P[1].length>2?[P[1].slice(0,2),P[1].slice(0,3),P[1]+'1']:[P[1]+'1',String(+P[1]+1),P[1][0]]);
    return{topic:'순환소수',q:`분수 ${P[0]}${_josa(P[0].slice(-1),'을','를')} 순환소수로 나타낼 때, 순환마디는?`,choices,answer,meta:_MM('mid_num','수와 연산'),
      sol:[`${P[0]} = ${P[2]}`,`되풀이되는 부분 ${P[1]}이 순환마디입니다.`]};
  }
  if(t==='finiteX'){
    const den=pick([[2,2,3],[2,3,5],[2,2,7],[3,5]]),bad=den.filter(p=>p!==2&&p!==5);
    const ans=bad.reduce((a,b)=>a*b,1);
    const dStr=Object.entries(den.reduce((m,p)=>(m[p]=(m[p]||0)+1,m),{})).map(([p,e])=>_pow(p,e)).join('×');
    const{choices,answer}=makeChoices(String(ans),[1,2,ans+1,ans*2,5].filter(v=>v!==ans).map(String));
    return{topic:'유한소수',q:`분수 x/(${dStr})를 유한소수로 나타낼 수 있을 때, x의 값이 될 수 있는 가장 작은 자연수는?`,choices,answer,meta:_MM('mid_num','수와 연산'),
      sol:[`기약분수의 분모의 소인수가 2나 5뿐이면 유한소수입니다.`,`분모의 ${bad.join(', ')}${_josa(bad[bad.length-1],'을','를')} 없애야 하므로 x는 ${ans}의 배수, 가장 작은 값은 ${ans}`]};
  }
  const fins=['1/4','1/5','3/8','2/5','7/20','1/8','3/20'],infs=['1/3','1/6','1/7','2/9','5/12','1/11'];
  const f=pick(fins),others=shuffle(infs).slice(0,3);
  const ord=shuffle([f,...others]);
  return{topic:'유한소수',q:`다음 분수 중 유한소수로 나타낼 수 있는 것은?`,choices:ord,answer:ord.indexOf(f),meta:_MM('mid_num','수와 연산'),
    sol:[`기약분수의 분모를 소인수분해했을 때 2와 5만 있으면 유한소수입니다.`,`${f} 의 분모는 2·5 뿐이므로 유한소수입니다.`]};
}

/* ── 9. 지수법칙 ─────────────────────────────────────── */
function genMidExponent(){
  const v=pick(['a','x']);const P=e=>e===1?v:`${v}${_sup(e)}`;
  const t=pick(['mul','mul3','div','pow','coef','coefPow']);
  let q,ans,ws,sol;
  if(t==='mul'){const a=randInt(2,5),b=randInt(2,5);ans=P(a+b);ws=[P(a*b),P(a+b+1),P(Math.max(1,a+b-1))];q=`${P(a)}×${P(b)}을 간단히 한 것은?`;sol=[`밑이 같은 수의 곱은 지수끼리 더합니다.`,`${a}+${b} = ${a+b} → ${ans}`];}
  else if(t==='mul3'){const a=randInt(1,4),b=randInt(2,4),c=randInt(2,4);ans=P(a+b+c);ws=[P(a*b*c),P(a+b+c+1),P(a+b+c-1)];q=`${P(a)}×${P(b)}×${P(c)}을 간단히 한 것은?`;sol=[`지수끼리 더합니다 : ${a}+${b}+${c} = ${a+b+c}`];}
  else if(t==='div'){const a=randInt(2,4),b=randInt(2,5),c=randInt(1,a+b-1);ans=P(a+b-c);ws=[P(a+b+c),P(a*b-c>0?a*b-c:a+b+1),P(a+b-c+1)];q=`${P(a)}×${P(b)}÷${P(c)}을 간단히 한 것은? (단, ${v}≠0)`;sol=[`곱하면 지수를 더하고, 나누면 지수를 뺍니다.`,`${a}+${b}−${c} = ${a+b-c}`];}
  else if(t==='pow'){const a=randInt(2,4),b=randInt(2,4);ans=P(a*b);ws=[P(a+b),P(a*b+1),P(a*b-1)];q=`(${P(a)})${_sup(b)}을 간단히 한 것은?`;sol=[`거듭제곱의 거듭제곱은 지수끼리 곱합니다.`,`${a}×${b} = ${a*b}`];}
  else if(t==='coef'){const m=randInt(2,5),n=randInt(2,4),a=randInt(1,3),b=randInt(1,3);const C=m*n;ans=`${C}${P(a+b)}`;ws=[`${m+n}${P(a+b)}`,`${C}${P(a*b)}`,`${C}${P(a+b+1)}`];
    q=`${m}${P(a)}×${n}${P(b)}을 간단히 한 것은?`;sol=[`수는 수끼리, 문자는 문자끼리 곱합니다.`,`${m}×${n} = ${C}, ${v}의 지수 ${a}+${b} = ${a+b}`];}
  else{const m=pick([2,3]),a=randInt(1,3),b=pick([2,3]);const C=m**b;ans=`${C}${P(a*b)}`;ws=[`${m*b}${P(a*b)}`,`${C}${P(a+b)}`,`${m}${P(a*b)}`];
    q=`(${m}${P(a)})${_sup(b)}을 간단히 한 것은?`;sol=[`괄호 안의 수와 문자에 모두 지수를 적용합니다.`,`${m}${_sup(b)} = ${C}, ${v}의 지수 ${a}×${b} = ${a*b}`];}
  const{choices,answer}=makeChoices(ans,ws.filter(w=>w!==ans));
  return{topic:'지수법칙',q,choices,answer,meta:_MM('mid_num','수와 연산'),sol:[...sol,`따라서 ${ans}`]};
}

/* ── 10. 연립방정식 · 일차부등식 ─────────────────────── */
function genMidSystem(){
  const x=randInt(-1,4),y=randInt(-1,5);
  const forms=[
    ()=>[`y=${_pl([[2,'x']])}`,`x+y=${3*x}`],
    ()=>[`x+y=${x+y}`,`x−y=${_mN(x-y)}`],
    ()=>[`x+y=${x+y}`,`2x−y=${_mN(2*x-y)}`],
    ()=>[`y=${_pl([[1,'x'],[y-x,'']])}`,`x+2y=${x+2*y}`],
  ];
  let eqs,X=x,Y=y;
  const f=randInt(0,3);
  if(f===0){Y=2*X;eqs=[`y=2x`,`x+y=${3*X}`];}
  else if(f===1)eqs=[`x+y=${X+Y}`,`x−y=${_mN(X-Y)}`];
  else if(f===2)eqs=[`x+y=${X+Y}`,`2x−y=${_mN(2*X-Y)}`];
  else eqs=[`y=${_pl([[1,'x'],[Y-X,'']])}`,`x+2y=${_mN(X+2*Y)}`];
  const c=(a,b)=>`x=${_mN(a)}, y=${_mN(b)}`;
  const{choices,answer}=makeChoices(c(X,Y),[c(Y,X),c(-X,Y),c(X,-Y),c(X+1,Y-1)].filter(w=>w!==c(X,Y)));
  return{topic:'연립방정식',q:`연립방정식 {${eqs.join(', ')}}의 해는?`,qTex:`연립방정식 $\\begin{cases}${eqs.map(e=>_exRunTex(e)).join('\\\\')}\\end{cases}$의 해는?`,
    choices,answer,meta:_MM('mid_alg','문자와 식'),
    sol:[`한 문자를 없애도록 두 식을 더하거나 빼거나, 한 식을 다른 식에 대입합니다.`,`풀면 x = ${_mN(X)}, y = ${_mN(Y)}`,`확인 : ${eqs.join(', ')} 에 넣으면 모두 성립합니다.`]};
}
function genMidInequality(){
  const t=pick(['solve','pic','pic','story']);
  if(t==='story'){
    const p=pick([500,700,800,1200]),T=p*randInt(4,8),it=pick(['공책','볼펜','음료수','빵']);
    const op=pick(['이상','이하','초과','미만']),sym={이상:'≥',이하:'≤',초과:'>',미만:'<'}[op];
    const correct=`${p}x${sym}${T}`;
    const others=['≥','≤','>','<'].filter(s=>s!==sym).map(s=>`${p}x${s}${T}`);
    const{choices,answer}=makeChoices(correct,others);
    return{topic:'일차부등식',q:`다음 문장을 부등식으로 옳게 나타낸 것은?`,box:`한 개에 ${p}원인 ${it} x개의 가격은 ${T}원 ${op}이다.`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`이상 ≥, 이하 ≤, 초과 >, 미만 <`,`${it} x개의 가격은 ${p}x원이므로 ${correct}`]};
  }
  const a=randInt(2,6),r=randInt(-1,4),b=a*r,k=pick([0,0,1,2,3]);
  const op=pick(['≥','≤','>','<']);
  const lhs=k?_pl([[a,'x'],[-a*k,'']]):`${a}x`,rhs=k?_mN(b-a*k):_mN(b);
  const correct=`x${op}${_mN(r)}`;
  const ws=['≥','≤','>','<'].filter(s=>s!==op).map(s=>`x${s}${_mN(r)}`);
  if(t==='pic'){
    const choices=shuffle([correct,...ws]);
    return{topic:'일차부등식',q:`일차부등식 ${lhs}${op}${rhs}의 해를 수직선 위에 나타낸 것은?`,choices,answer:choices.indexOf(correct),choicePic:'ineq',meta:_MM('mid_alg','문자와 식'),
      sol:[`양변을 정리하면 ${a}x ${op} ${b} → x ${op} ${_mN(r)}`,`${op==='≥'||op==='≤'?'같다(=)가 있으므로 ● (그 수도 포함)':'같다가 없으므로 ○ (그 수는 빠짐)'}`,`${op==='≥'||op==='>'?'오른쪽':'왼쪽'}으로 뻗은 그림을 고릅니다.`]};
  }
  const{choices,answer}=makeChoices(correct,ws);
  return{topic:'일차부등식',q:`일차부등식 ${lhs}${op}${rhs}${_josa(rhs,'을','를')} 풀면?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
    sol:[`${k?`상수항을 옮기면 ${a}x ${op} ${b}, `:''}양변을 양수 ${a}로 나누면 부등호 방향은 그대로입니다.`,`x ${op} ${_mN(r)}`]};
}

/* ── 11. 일차함수 ────────────────────────────────────── */
function genMidLinearFunc(){
  const t=pick(['fx','yint','yint','shift','aval','sysgraph']);
  if(t==='fx'){
    const a=pick([-3,-2,2,3,4,5]),b=pick([0,0,-2,1,3]),x=pick([-2,-1,2,3]);const ans=a*x+b;
    const f=_pl([[a,'x'],[b,'']]);
    const{choices,answer}=makeChoices(_mN(ans),[ans+a,ans-a,ans+1,-ans].filter(v=>v!==ans).map(_mN));
    return{topic:'일차함수',q:`함수 f(x)=${f}에 대하여 f(${_mN(x)})의 값은?`,choices,answer,meta:_MM('mid_func','함수'),
      sol:[`x 자리에 ${_mN(x)}를 넣습니다.`,`f(${_mN(x)}) = ${a}×${_mP(x)}${b?_mS(b):''} = ${_mN(ans)}`]};
  }
  if(t==='shift'){
    const a=pick([1,2,-1]),b=pick([-3,-2,2,3,4]);
    const{choices,answer}=makeChoices(_mN(b),[b+1,b-1,-b].filter(v=>v!==b).map(_mN));
    return{topic:'일차함수 평행이동',q:`일차함수 y=${_pl([[a,'x'],[b,'']])}의 그래프는 일차함수 y=${_pl([[a,'x']])}의 그래프를 y축의 방향으로 k만큼 평행이동한 것이다. 상수 k의 값은?`,
      choices,answer,graph:{type:'lines2',l:[[a,0],[a,b]],names:[`y=${_pl([[a,'x']])}`,`y=${_pl([[a,'x'],[b,'']])}`]},meta:_MM('mid_func','함수'),
      sol:[`y=ax 를 y축 방향으로 k만큼 옮기면 y=ax+k 입니다.`,`따라서 k = ${_mN(b)}`]};
  }
  if(t==='sysgraph'){
    const x=randInt(1,3),y=randInt(1,3),s=x+y,d=x-y;
    const L1=[-1,s],a2=pick([1,3]),L2=[a2,y-a2*x];
    const e2=a2===1?`x−y=${_mN(-L2[1])}`:`3x−y=${_mN(-L2[1])}`;
    const c=(a,b)=>`x=${a}, y=${b}`;
    const{choices,answer}=makeChoices(c(x,y),[c(y,x),c(x,y+1),c(x+1,y)].filter(w=>w!==c(x,y)));
    return{topic:'연립방정식의 그래프',q:`그림은 연립방정식 {x+y=${s}, ${e2}}의 해를 구하기 위해 두 일차방정식의 그래프를 좌표평면 위에 나타낸 것이다. 이 연립방정식의 해는?`,
      qTex:`그림은 연립방정식 $\\begin{cases}x+y=${s}\\\\${_exRunTex(e2)}\\end{cases}$의 해를 구하기 위해 두 일차방정식의 그래프를 좌표평면 위에 나타낸 것이다. 이 연립방정식의 해는?`,
      choices,answer,graph:{type:'lines2',l:[L1,L2],names:[`x+y=${s}`,e2],meet:[x,y]},meta:_MM('mid_func','함수'),
      sol:[`두 그래프가 만나는 점의 좌표가 연립방정식의 해입니다.`,`만나는 점 (${x}, ${y}) → x=${x}, y=${y}`]};
  }
  const a=pick([-3,-2,-1,1,2,3]),b=pick([-4,-3,-2,2,3,4]);
  if(t==='aval'&&Number.isInteger(-b/a)){
    const{choices,answer}=makeChoices(_mN(a),[...new Set([-a,a+1,a-1,b,2*a,a+2,a-2])].filter(v=>v!==a&&v!==0).slice(0,3).map(_mN));
    return{topic:'일차함수',q:`그림은 일차함수 y=ax${_mS(b)}의 그래프이다. 상수 a의 값은?`,choices,answer,graph:{type:'linear',a,b},meta:_MM('mid_func','함수'),
      sol:[`그래프가 x축과 만나는 점 (${_mN(-b/a)}, 0)을 지납니다.`,`0 = a×${_mP(-b/a)}${_mS(b)} → a = ${_mN(a)}`]};
  }
  const{choices,answer}=makeChoices(_mN(b),[-b,b+1,b-1,a].filter(v=>v!==b).map(_mN));
  return{topic:'일차함수 y절편',q:`그림은 일차함수 y=${_pl([[a,'x'],[b,'']])}의 그래프이다. 이 그래프의 y절편은?`,choices,answer,graph:{type:'linear',a,b},meta:_MM('mid_func','함수'),
    sol:[`y절편은 그래프가 y축과 만나는 점의 y좌표, 곧 x=0 일 때의 y값입니다.`,`y = ${a}×0${_mS(b)} = ${_mN(b)}`]};
}

/* ── 12. 이등변삼각형 · 삼각형의 각 ──────────────────── */
function genMidIsosceles(){
  const t=pick(['base','ext','bisect','tri']);
  if(t==='bisect'){
    const h=pick([3,4,5,6,7,8]);const ask=pick(['BC','BD']);
    const ans=ask==='BC'?2*h:h;
    const{choices,answer}=makeChoices(`${ans}cm`,[ans+1,ans-1,ans+2,ask==='BC'?h:2*h].filter(v=>v>0&&v!==ans).map(v=>`${v}cm`));
    return{topic:'이등변삼각형',q:ask==='BC'?`그림과 같이 AB=AC인 이등변삼각형 ABC에서 ∠A의 이등분선과 BC의 교점을 D라고 하자. BD=${h}cm일 때, BC의 길이는?`
        :`그림과 같이 AB=AC인 이등변삼각형 ABC에서 ∠A의 이등분선과 BC의 교점을 D라고 하자. BC=${2*h}cm일 때, BD의 길이는?`,
      choices,answer,graph:{type:'iso_tri',mode:'bisect',lab:ask==='BC'?{BD:`${h}cm`}:{BC:`${2*h}cm`}},meta:_MM('mid_geo','기하'),
      sol:[`이등변삼각형의 꼭지각의 이등분선은 밑변을 수직이등분합니다.`,ask==='BC'?`BC = 2×BD = ${ans}cm`:`BD = BC÷2 = ${ans}cm`]};
  }
  if(t==='tri'){
    const A=pick([40,50,60,70,80,100]),B=pick([30,40,50,60]);const C=180-A-B;
    if(C<=20)return genMidIsosceles();
    const s=randInt(5,9);const isoAC=B===C;
    // 두 각이 같으면 그 맞은편 변도 같다 → ∠B=∠C 이면 AB=AC
    const B2=(180-A)/2;if(!Number.isInteger(B2))return genMidIsosceles();
    const{choices,answer}=makeChoices(String(s),[s-1,s+1,s+2].map(String));
    return{topic:'이등변삼각형',q:`그림과 같이 삼각형 ABC에서 ∠A=${A}°, ∠B=${B2}°이고 AB=${s}cm일 때, x의 값은?`,
      choices,answer,graph:{type:'iso_tri',mode:'tri',A,B:B2,lab:{AB:`${s}cm`,AC:'x cm'}},meta:_MM('mid_geo','기하'),
      sol:[`∠C = 180°−${A}°−${B2}° = ${B2}° 이므로 ∠B = ∠C 입니다.`,`두 밑각이 같은 삼각형은 이등변삼각형이므로 AC = AB = ${s}cm, x = ${s}`]};
  }
  if(t==='ext'){
    const A=pick([40,50,70,80]);const base=(180-A)/2;const ext=180-base;
    if(!Number.isInteger(base))return genMidIsosceles();
    const{choices,answer}=makeChoices(`${ext}°`,[ext-10,ext+10,ext+20].map(v=>`${v}°`));
    return{topic:'이등변삼각형',q:`그림과 같이 AB=AC인 이등변삼각형 ABC에서 ∠A=${A}°일 때, ∠x의 크기는?`,
      choices,answer,graph:{type:'iso_tri',mode:'ext',A},meta:_MM('mid_geo','기하'),
      sol:[`밑각 ∠C = (180°−${A}°)÷2 = ${base}°`,`∠x 는 ∠C 의 외각이므로 180°−${base}° = ${ext}°`]};
  }
  const A=pick([20,30,40,50,70,80,100]);const ans=(180-A)/2;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,A].filter(v=>v>0&&v!==ans).map(v=>`${v}°`));
  return{topic:'이등변삼각형',q:`그림과 같이 AB=AC인 이등변삼각형 ABC에서 ∠A=${A}°일 때, ∠x의 크기는?`,
    choices,answer,graph:{type:'iso_tri',mode:'base',A},meta:_MM('mid_geo','기하'),
    sol:[`이등변삼각형의 두 밑각의 크기는 같습니다.`,`∠x = (180°−${A}°)÷2 = ${ans}°`]};
}

/* ── 13. 닮음 · 평행선과 비 · 피타고라스 ─────────────────── */
function genMidSimilarity(){
  const t=pick(['sim','sim','par','pyth','mid']);
  if(t==='pyth'){
    const[a,b,c]=pick([[6,8,10],[3,4,5],[5,12,13],[8,6,10],[9,12,15],[8,15,17]]);
    const{choices,answer}=makeChoices(String(c),[c-1,c+1,c+2].map(String));
    return{topic:'피타고라스 정리',q:`그림과 같이 직각삼각형 ABC에서 AB=${a}cm, BC=${b}cm일 때, x의 값은?`,choices,answer,
      graph:{type:'right_tri',a,b,c,lab:{AB:`${a}cm`,BC:`${b}cm`,CA:'x cm'}},meta:_MM('mid_geo','기하'),
      sol:[`직각삼각형에서 (빗변)² = (나머지 두 변의 제곱의 합)`,`x² = ${a}²+${b}² = ${a*a+b*b} → x = ${c}`]};
  }
  if(t==='mid'){
    const bc=pick([8,10,12,14,16]);
    const{choices,answer}=makeChoices(`${bc/2}cm`,[bc/2-1,bc/2+1,bc].map(v=>`${v}cm`));
    return{topic:'삼각형의 중점연결',q:`그림과 같이 삼각형 ABC에서 두 변 AB, AC의 중점을 각각 M, N이라고 하자. BC=${bc}cm일 때, MN의 길이는?`,choices,answer,
      graph:{type:'tri_par',mode:'mid',lab:{BC:`${bc}cm`}},meta:_MM('mid_geo','기하'),
      sol:[`삼각형 두 변의 중점을 이은 선분은 나머지 변과 평행하고 길이는 그 절반입니다.`,`MN = ${bc}÷2 = ${bc/2}cm`]};
  }
  if(t==='par'){
    const ad=pick([2,3,4,6]),db=pick([2,3,4]),k=pick([1,2]);const ae=ad*k,ec=db*k;
    const{choices,answer}=makeChoices(String(ec),[ec+1,ec-1,ec+2].filter(v=>v>0).map(String));
    return{topic:'평행선과 선분의 비',q:`그림과 같이 삼각형 ABC에서 변 BC에 평행한 직선이 두 변 AB, AC와 만나는 점을 각각 D, E라고 하자. AD=${ad}cm, DB=${db}cm, AE=${ae}cm, EC=x cm일 때, x의 값은?`,
      choices,answer,graph:{type:'tri_par',mode:'par',lab:{AD:`${ad}cm`,DB:`${db}cm`,AE:`${ae}cm`,EC:'x cm'}},meta:_MM('mid_geo','기하'),
      sol:[`DE ∥ BC 이면 AD : DB = AE : EC 입니다.`,`${ad} : ${db} = ${ae} : x → x = ${ec}`]};
  }
  const k=pick([2,3]),s1=randInt(2,5),s2=randInt(3,6);
  const quad=Math.random()<0.4;
  const ask=pick(['side','ratio']);
  if(ask==='ratio'){
    const corr=`1:${k}`;
    const{choices,answer}=makeChoices(corr,[`1:${k+1}`,`2:${k+1}`,`${k}:1`].filter(w=>w!==corr));
    return{topic:'닮음',q:`그림에서 ${quad?'□ABCD∽□EFGH':'△ABC∽△DEF'}일 때, 두 도형의 닮음비는?`,choices,answer,
      graph:{type:'similar',quad,k,l1:`${s1}cm`,l2:`${s1*k}cm`},meta:_MM('mid_geo','기하'),
      sol:[`대응하는 변의 길이의 비가 닮음비입니다.`,`${s1} : ${s1*k} = 1 : ${k}`]};
  }
  const ans=s2*k;
  const{choices,answer}=makeChoices(`${ans}cm`,[ans-2,ans+2,s2+k].filter(v=>v>0&&v!==ans).map(v=>`${v}cm`));
  return{topic:'닮음',q:`그림에서 ${quad?'□ABCD∽□EFGH':'△ABC∽△DEF'}일 때, ${quad?'GH':'EF'}의 길이는?`,choices,answer,
    graph:{type:'similar',quad,k,l1:`${s1}cm`,l2:`${s1*k}cm`,l3:`${s2}cm`},meta:_MM('mid_geo','기하'),
    sol:[`닮음비는 ${s1} : ${s1*k} = 1 : ${k}`,`대응하는 변도 ${k}배이므로 ${s2}×${k} = ${ans}cm`]};
}

/* ── 14. 경우의 수 · 확률 (이야기를 넓힌 곳) ──────────────── */
var MID_COUNT_STORIES=[
  ()=>{const a=randInt(2,4),b=randInt(2,4);const V=shuffle(['당근','브로콜리','양배추','오이','토마토']).slice(0,a),F=shuffle(['사과','바나나','수박','파인애플','딸기']).slice(0,b);
    return{q:`그림은 채소와 과일을 섞어서 주스를 만들기 위해 준비한 채소 ${a}가지, 과일 ${b}가지이다. 채소와 과일을 각각 한 가지씩 선택하는 경우의 수는?`,ans:a*b,
      g:{type:'menu',groups:[['채소',V],['과일',F]]},sol:`${a}×${b} = ${a*b}`};},
  ()=>{const a=randInt(2,4),b=randInt(2,3);const T=shuffle(['티셔츠','셔츠','블라우스','후드티']).slice(0,a),B=shuffle(['청바지','면바지','반바지']).slice(0,b);
    return{q:`어느 여행객이 준비한 상의 ${a}벌과 하의 ${b}벌이 있다. 이 여행객이 상의와 하의를 각각 하나씩 입는 경우의 수는?`,ans:a*b,
      g:{type:'menu',groups:[['상의',T],['하의',B]]},sol:`${a}×${b} = ${a*b}`};},
  ()=>{const a=randInt(2,4),b=randInt(2,3);const P=shuffle(['단팥빵','크림빵','소보로빵','식빵']).slice(0,a),D=shuffle(['우유','주스','두유']).slice(0,b);
    return{q:`그림은 어느 카페에서 판매하는 빵 ${a}종류와 음료 ${b}종류를 나타낸 것이다. 빵과 음료를 각각 한 가지씩 주문하는 경우의 수는?`,ans:a*b,
      g:{type:'menu',groups:[['빵',P],['음료',D]]},sol:`${a}×${b} = ${a*b}`};},
  ()=>{const a=randInt(2,3),b=randInt(2,3);
    return{q:`집에서 학교까지 가는 길은 ${a}가지, 학교에서 도서관까지 가는 길은 ${b}가지이다. 집에서 출발하여 학교를 거쳐 도서관까지 가는 경우의 수는? (단, 같은 지점은 두 번 이상 지나지 않는다.)`,ans:a*b,sol:`${a}×${b} = ${a*b}`};},
  ()=>{const s=randInt(3,6);const c=[];for(let i=1;i<=6;i++)for(let j=1;j<=6;j++)if(i+j===s)c.push(`(${i}, ${j})`);
    return{q:`서로 다른 두 개의 주사위를 동시에 던질 때, 나오는 두 눈의 수의 합이 ${s}가 되는 경우의 수는?`,ans:c.length,g:{type:'dice',n:2},sol:`${c.join(', ')} → ${c.length}가지`};},
  ()=>{const N=pick([9,10,12]),m=pick([3,4,5]);const ns=[];for(let i=1;i<=N;i++)if(i%m===0)ns.push(i);
    return{q:`1부터 ${N}까지의 자연수가 각각 하나씩 적힌 공 ${N}개가 들어 있는 주머니에서 공 한 개를 꺼낼 때, ${m}의 배수가 적힌 공이 나오는 경우의 수는?`,ans:ns.length,
      g:{type:'ballbag',n:N},sol:`${ns.join(', ')} → ${ns.length}가지`};},
  ()=>{const N=10,a=4,b=6;const ns=[];for(let i=1;i<=N;i++)if(i%a===0||i%b===0)ns.push(i);
    return{q:`1부터 10까지의 자연수가 각각 적힌 공 10개가 들어 있는 주머니에서 공 한 개를 꺼낼 때, 4의 배수 또는 6의 배수가 나오는 경우의 수는?`,ans:ns.length,
      g:{type:'ballbag',n:N},sol:`4의 배수 4, 8 · 6의 배수 6 → ${ns.length}가지`};},
];
var MID_PROB_STORIES=[
  ()=>{const a=randInt(2,5),b=randInt(3,7);const fl=pick([['포도 맛','딸기 맛','사탕'],['흰','검은','공'],['빨간','파란','구슬'],['초코','바닐라','쿠키']]);
    return{q:`주머니 속에 모양과 크기가 같은 ${fl[0]} ${fl[2]} ${a}개, ${fl[1]} ${fl[2]} ${b}개가 들어 있다. 이 주머니에서 임의로 한 개를 꺼낼 때, ${fl[0]} ${fl[2]}${_josa(fl[2],'이','가')} 나올 확률은?`,num:a,den:a+b,
      g:{type:'ballbag',colors:[a,b]},sol:`(${fl[0]} ${fl[2]} 수) ÷ (전체 수) = ${a}/${a+b}`};},
  ()=>{const N=pick([10,12]),m=pick([2,3,5]);const c=Math.floor(N/m);
    return{q:`1부터 ${N}까지의 자연수가 각각 하나씩 적힌 공 ${N}개가 들어 있는 상자에서 임의로 한 개의 공을 꺼낼 때, ${m===2?'짝수':m+'의 배수'}가 적힌 공이 나올 확률은?`,num:c,den:N,
      g:{type:'ballbag',n:N,box:true},sol:`${m===2?'짝수':m+'의 배수'}는 ${c}개이므로 ${c}/${N}`};},
  ()=>{const k=pick([['3 이상',4],['짝수',3],['5 이상',2],['소수',3],['3의 배수',2]]);
    return{q:`주사위 한 개를 한 번 던질 때, 나오는 눈의 수가 ${k[0]}일 확률은?`,num:k[1],den:6,g:{type:'dice',n:1},sol:`${k[0]}인 눈은 ${k[1]}가지이므로 ${k[1]}/6`};},
  ()=>{const n=pick([4,5,6]);
    return{q:`${n}명의 학생 중에서 제비뽑기로 대표 1명을 뽑을 때, 특정한 학생 한 명이 뽑힐 확률은?`,num:1,den:n,sol:`전체 ${n}가지 중 1가지 → 1/${n}`};},
];
function genMidProbability(){
  const S=pick(MID_PROB_STORIES)();const g=gcdFn(S.num,S.den),correct=`${S.num/g}/${S.den/g}`;
  const cand=[[S.den-S.num,S.den],[S.num,S.den+1],[S.num+1,S.den],[1,S.den],[S.num,S.den-S.num]].map(([a,b])=>{const gg=gcdFn(a,b);return`${a/gg}/${b/gg}`;});
  const{choices,answer}=makeChoices(correct,[...new Set(cand)].filter(w=>w!==correct&&!/^0\//.test(w)&&!/\/1$/.test(w)));
  return{topic:'확률',q:S.q,choices,answer,graph:S.g||undefined,meta:_MM('mid_stat','확률과 통계'),
    sol:[`(확률) = (그 일이 일어나는 경우의 수) ÷ (모든 경우의 수)`,S.sol+(g>1?` = ${correct}`:'')]};
}
function genMidCounting(){
  const S=pick(MID_COUNT_STORIES)();
  const{choices,answer}=makeChoices(String(S.ans),[S.ans+1,S.ans-1,S.ans+2,S.ans+3].filter(v=>v>0&&v!==S.ans).map(String));
  return{topic:'경우의 수',q:S.q,choices,answer,graph:S.g||undefined,meta:_MM('mid_stat','확률과 통계'),
    sol:[S.g&&S.g.type==='menu'||/길은/.test(S.q)?`두 가지를 잇따라(또는 함께) 고르면 경우의 수를 곱합니다.`:`조건에 맞는 경우를 빠짐없이 셉니다.`,S.sol]};
}

/* ── 15. 제곱근 ─────────────────────────────────────── */
function genMidRadical(){
  const t=pick(['addsub','simp','simp2','sq','mul']);
  const r=pick([2,3,5,6,7]);
  if(t==='simp'){
    const k=pick([2,3,4,5]);const n=k*k*r;
    const{choices,answer}=makeChoices(String(k),[k-1,k+1,r].filter(v=>v>0&&v!==k).map(String));
    return{topic:'제곱근',q:`√${n}=√(${k}²×${r})=a√${r}일 때, 수 a의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`근호 안의 제곱인 수는 밖으로 꺼냅니다 : √(${k}²×${r}) = ${k}√${r}`,`a = ${k}`]};
  }
  if(t==='simp2'){
    const k=pick([2,3]);const n=k*k*r;
    const{choices,answer}=makeChoices(String(n),[n-r,n+r,k*r].filter(v=>v!==n).map(String));
    return{topic:'제곱근',q:`${k}√${r}=√a일 때, a의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`근호 밖의 수를 제곱해서 안으로 넣습니다 : ${k}√${r} = √(${k}²×${r}) = √${n}`,`a = ${n}`]};
  }
  if(t==='sq'){
    const a=randInt(2,9),neg=Math.random()<0.5;
    const{choices,answer}=makeChoices(String(a),[-a,a*a,-a*a].map(_mN));
    return{topic:'제곱근',q:`√(${neg?`(−${a})`:a}²)의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`√(a²) 은 a 의 절댓값입니다.`,`√(${neg?`(−${a})`:a}²) = √${a*a} = ${a}`]};
  }
  if(t==='mul'){
    const[a,b]=pick([[2,8],[3,12],[2,18],[3,27],[5,20]]);const v=Math.sqrt(a*b);
    const{choices,answer}=makeChoices(String(v),[v+1,v-1,a*b].map(String));
    return{topic:'제곱근',q:`√${a}×√${b}의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),sol:[`√${a}×√${b} = √${a*b} = ${v}`]};
  }
  const a=randInt(2,7),b=randInt(1,a-1),op=pick(['+','−']),ans=op==='+'?a+b:a-b;
  const R=n=>n===1?`√${r}`:`${n}√${r}`;
  const{choices,answer}=makeChoices(R(ans),[R(op==='+'?a-b:a+b),R(Math.max(1,ans-1)+ (ans-1===0?2:0)),`${ans}√${r*2}`].filter(w=>w!==R(ans)));
  return{topic:'제곱근',q:`${R(a)}${op}${R(b)}${_josa('근','을','를')} 간단히 한 것은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
    sol:[`√${r} 를 하나의 문자처럼 보고 앞의 수끼리 계산합니다.`,`(${a}${op}${b})√${r} = ${R(ans)}`]};
}

/* ── 16. 이차방정식 · 전개 · 인수분해 ───────────────────── */
function genMidQuadraticEq(){
  const t=pick(['other','other','other','double','expand','factor']);
  if(t==='double'){
    const r=pick([-5,-4,-3,-2,2,3,4,5,6,7]);
    const{choices,answer}=makeChoices(_mN(r),[-r,r+1,r-1].map(_mN));
    return{topic:'이차방정식',q:`이차방정식 ${_fac(r)}²=0의 근은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`${_fac(r)}² = 0 이면 ${_fac(r).replace(/[()]/g,'')} = 0`,`x = ${_mN(r)} (중근)`]};
  }
  if(t==='expand'){
    const a=randInt(1,4),b=randInt(2,5);const m=a+b;
    const{choices,answer}=makeChoices(String(m),[m-1,m+1,a*b].filter(v=>v!==m).map(String));
    return{topic:'다항식의 전개',q:`(x+${a})(x+${b})를 전개한 식이 x²+mx+${a*b}일 때, 수 m의 값은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`(x+a)(x+b) = x² + (a+b)x + ab`,`m = ${a}+${b} = ${m}`]};
  }
  if(t==='factor'){
    const a=pick([1,2,3]),sq=Math.random()<0.4;
    if(sq){const c=`(x+${a})²`;const{choices,answer}=makeChoices(c,[`(x−${a})²`,`(x+${a+1})²`,`(x+${a})(x−${a})`]);
      return{topic:'인수분해',q:`다항식 x²+${2*a}x+${a*a}${_josa(String(a*a),'을','를')} 인수분해하면?`,choices,answer,meta:_MM('mid_alg','문자와 식'),sol:[`a²+2ab+b² = (a+b)²`,`x²+${2*a}x+${a*a} = ${c}`]};}
    const b=a+randInt(1,3);const c=`(x+${a})(x+${b})`;
    const{choices,answer}=makeChoices(c,[`(x+${a})(x+${b+1})`,`(x−${a})(x−${b})`,`(x+${a+1})(x+${b})`]);
    return{topic:'인수분해',q:`다항식 x²+${a+b}x+${a*b}${_josa(String(a*b),'을','를')} 인수분해한 것은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
      sol:[`곱해서 ${a*b}, 더해서 ${a+b}인 두 수는 ${a}, ${b}`,`= ${c}`]};
  }
  const r1=pick([-5,-4,-3,-2,-1,1,2,3]),r2=pick([1,2,3,4,5,6,7].filter(v=>v!==r1));
  const known=pick([r1,r2]),ans=known===r1?r2:r1;
  const exp=Math.random()<0.4;
  const eq=exp?`x²${_pltail([[-(r1+r2),'x'],[r1*r2,'']])}=0`:`${_fac(r1)}${_fac(r2)}=0`;
  const{choices,answer}=makeChoices(_mN(ans),[ans+1,ans-1,-ans,-known].filter(v=>v!==ans).map(_mN));
  return{topic:'이차방정식',q:`이차방정식 ${eq}의 한 근이 ${_mN(known)}이다. 다른 한 근은?`,choices,answer,meta:_MM('mid_alg','문자와 식'),
    sol:[exp?`인수분해하면 ${_fac(r1)}${_fac(r2)}=0`:`AB=0 이면 A=0 또는 B=0`,`x = ${_mN(r1)} 또는 x = ${_mN(r2)}`,`다른 한 근은 ${_mN(ans)}`]};
}

/* ── 17. 이차함수 그래프 ─────────────────────────────── */
function genMidQuadraticDesc(){
  const a=pick([1,1,-1,2,-2,0.5]),p=pick([0,0,1,-1,2]),q=pick([0,1,2,-1,-2]);
  const aS=a===1?'':a===-1?'−':a===0.5?'1/2':a===-0.5?'−1/2':String(a);
  const core=p===0?'x²':`${_fac(p)}²`;
  const eq=`y=${aS}${core}${q?_mS(q):''}`;
  if(Math.random()<0.3&&p===0){
    // 그래프를 보고 식 고르기 (2026-2회 17번)
    const correct=eq,F=x=>a*x*x+q;
    const ws=[`y=${a<0?'':'−'}x²${q?_mS(q):''}`,`y=${aS}x²${q?_mS(-q):''}`,`y=${aS}x²`].filter(w=>w!==correct);
    const{choices,answer}=makeChoices(correct,ws);
    return{topic:'이차함수 그래프',q:`그림은 이차함수의 그래프이다. 이 이차함수의 식으로 옳은 것은?`,choices,answer,
      graph:{type:'quadratic',a,p:0,q,ds:-2,de:2,show:[[0,q],[1,F(1)]]},meta:_MM('mid_func','함수'),
      sol:[`꼭짓점이 (0, ${q}) 이므로 y = ax² ${q?_mS(q):''} 꼴`,`점 (1, ${F(1)}) 을 지나므로 a = ${F(1)-q}`,`따라서 ${correct}`]};
  }
  const facts=[
    [`${a>0?'아래로':'위로'} 볼록하다.`,`${a>0?'위로':'아래로'} 볼록하다.`],
    [`꼭짓점의 좌표는 (${_mN(p)}, ${_mN(q)})이다.`,`꼭짓점의 좌표는 (${_mN(-p||1)}, ${_mN(q)})이다.`],
    [`직선 x=${_mN(p)}을 축으로 한다.`,`직선 x=${_mN(p===0?1:-p)}을 축으로 한다.`],
  ];
  const X=Number.isInteger(a)?1:p+2,Y=a*(X-p)**2+q;     // a=1/2 이면 x=p+2 를 써서 y가 정수가 되게
  facts.push([`점 (${X}, ${_mN(Y)})을 지난다.`,`점 (${X}, ${_mN(Y+1)})을 지난다.`]);
  const ti=randInt(0,3);
  const correct=facts[ti][0];
  const wrongs=facts.filter((_,i)=>i!==ti).map(f=>f[1]);
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'이차함수 그래프',q:`이차함수 ${eq}의 그래프에 대한 설명으로 옳은 것은?`,choices,answer,
    graph:{type:'quadratic',a,p,q,ds:p-2,de:p+2},meta:_MM('mid_func','함수'),
    sol:[`y = a(x−p)²+q 의 꼭짓점은 (p, q), 축은 x = p`,`a ${a>0?'> 0 이면 아래로':'< 0 이면 위로'} 볼록`,`x = ${X} 일 때 y = ${_mN(Y)}`,`옳은 것 : ${correct}`]};
}

/* ── 18. 삼각비 ─────────────────────────────────────── */
function genMidTrig(){
  const[o,a,h]=pick([[3,4,5],[5,12,13],[8,15,17],[4,3,5],[12,5,13]]);   // ∠B 기준 대변 AC=o, 이웃변 BC=a, 빗변 AB=h
  const t=pick(['ratio','ratio','ratio','side']);
  if(t==='side'){
    const H=h*pick([1,2]),k=H/h;
    const{choices,answer}=makeChoices(`${a*k}cm`,[o*k,a*k+1,a*k-1].filter(v=>v>0&&v!==a*k).map(v=>`${v}cm`));
    return{topic:'삼각비',q:`그림과 같이 AB=${H}cm인 직각삼각형 ABC에서 cos B=${a}/${h}일 때, BC의 길이는?`,choices,answer,
      graph:{type:'right_tri',a:o,b:a,c:h,at:'C',lab:{AB:`${H}cm`},angB:true},meta:_MM('mid_geo','기하'),
      sol:[`cos B = (밑변) ÷ (빗변) = BC ÷ AB`,`BC = ${H}×${a}/${h} = ${a*k}cm`]};
  }
  const kind=pick(['sin','cos','tan']);
  const correct=kind==='sin'?`${o}/${h}`:kind==='cos'?`${a}/${h}`:`${o}/${a}`;
  const pool=[`${o}/${h}`,`${a}/${h}`,`${o}/${a}`,`${a}/${o}`,`${h}/${o}`].filter(v=>v!==correct);
  const{choices,answer}=makeChoices(correct,pool);
  return{topic:'삼각비',q:`그림과 같이 직각삼각형 ABC에서 AB=${h}, BC=${a}, CA=${o}일 때, ${kind} B의 값은?`,choices,answer,
    graph:{type:'right_tri',a:o,b:a,c:h,at:'C',lab:{AB:String(h),BC:String(a),CA:String(o)},angB:true},meta:_MM('mid_geo','기하'),
    sol:[`∠B 에서 보면 빗변 AB=${h}, 밑변 BC=${a}, 높이 CA=${o}`,`${kind==='sin'?'sin B = (높이)÷(빗변)':kind==='cos'?'cos B = (밑변)÷(빗변)':'tan B = (높이)÷(밑변)'} = ${correct}`]};
}

/* ── 19. 원의 성질 ──────────────────────────────────── */
function genMidCircleAngle(){
  const t=pick(['inscribed','central','same','tanAng','tanLen','chord']);
  if(t==='tanAng'){
    const p=pick([40,50,60,70,80]);const ans=(180-p)/2;
    const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,p].filter(v=>v!==ans).map(v=>`${v}°`));
    return{topic:'원의 접선',q:`그림에서 두 점 A, B는 점 P에서 원 O에 그은 두 접선의 접점이다. ∠APB=${p}°일 때, ∠PAB의 크기는?`,choices,answer,
      graph:{type:'circ',mode:'tangent',angP:p},meta:_MM('mid_geo','기하'),
      sol:[`원 밖의 한 점에서 그은 두 접선의 길이는 같으므로 PA = PB`,`△PAB 는 이등변삼각형 → ∠PAB = (180°−${p}°)÷2 = ${ans}°`]};
  }
  if(t==='tanLen'){
    const s=pick([8,10,12,14]);
    const{choices,answer}=makeChoices(`${s/2}cm`,[s/2-1,s/2+1,s].map(v=>`${v}cm`));
    return{topic:'원의 접선',q:`그림에서 두 점 A, B는 점 P에서 원 O에 그은 두 접선의 접점이다. PA와 PB의 길이의 합이 ${s}cm일 때, PA의 길이는?`,choices,answer,
      graph:{type:'circ',mode:'tangent'},meta:_MM('mid_geo','기하'),sol:[`PA = PB 이므로 PA = ${s}÷2 = ${s/2}cm`]};
  }
  if(t==='chord'){
    const am=pick([2,3,4,5,6]);
    const{choices,answer}=makeChoices(`${2*am}cm`,[am,2*am+1,2*am-1].map(v=>`${v}cm`));
    return{topic:'원의 현',q:`그림과 같이 원 O의 중심에서 현 AB에 내린 수선의 발을 M이라고 하자. AM=${am}cm일 때, AB의 길이는?`,choices,answer,
      graph:{type:'circ',mode:'chord',lab:{AM:`${am}cm`}},meta:_MM('mid_geo','기하'),sol:[`원의 중심에서 현에 내린 수선은 그 현을 이등분합니다.`,`AB = 2×AM = ${2*am}cm`]};
  }
  const ins=pick([25,30,35,40,45,50,55,60]);
  if(t==='central'){
    const{choices,answer}=makeChoices(`${ins}°`,[ins*2,ins-10,ins+10].map(v=>`${v}°`));
    return{topic:'원주각과 중심각',q:`그림과 같이 원 O에서 호 AB에 대한 중심각 ∠AOB=${ins*2}°일 때, 호 AB에 대한 원주각 ∠APB의 크기는?`,choices,answer,
      graph:{type:'circ',mode:'insc',cen:ins*2,show:'cen'},meta:_MM('mid_geo','기하'),sol:[`원주각은 중심각의 절반입니다.`,`${ins*2}°÷2 = ${ins}°`]};
  }
  if(t==='same'){
    const{choices,answer}=makeChoices(`${ins}°`,[ins*2,ins+5,ins-5].map(v=>`${v}°`));
    return{topic:'원주각',q:`그림과 같이 원 O 위에 서로 다른 네 점 A, B, C, D가 있다. 호 AB에 대한 원주각 ∠ACB=${ins}°일 때, ∠ADB의 크기는?`,choices,answer,
      graph:{type:'circ',mode:'same',ang:ins},meta:_MM('mid_geo','기하'),sol:[`한 호에 대한 원주각의 크기는 모두 같습니다.`,`∠ADB = ∠ACB = ${ins}°`]};
  }
  const{choices,answer}=makeChoices(`${ins*2}°`,[ins,ins*2-10,ins*2+10].map(v=>`${v}°`));
  return{topic:'원주각과 중심각',q:`그림의 원 O에서 호 AB에 대한 원주각 ∠APB=${ins}°일 때, 호 AB에 대한 중심각 ∠AOB의 크기는?`,choices,answer,
    graph:{type:'circ',mode:'insc',cen:ins*2,show:'ins'},meta:_MM('mid_geo','기하'),sol:[`중심각은 원주각의 2배입니다.`,`${ins}°×2 = ${ins*2}°`]};
}

/* ── 20. 대푯값 ─────────────────────────────────────── */
var MID_REP_STORIES=[
  {w:'어느 헌혈의 집에서 한 시간 동안 헌혈한 사람',v:'나이',u:'세',lo:20,hi:60},
  {w:'학생',v:'수학 점수',u:'점',lo:60,hi:100,step:5},
  {w:'학생',v:'주말 동안 봉사 활동에 참여한 시간',u:'시간',lo:2,hi:9},
  {w:'학생',v:'방학 동안 읽은 책의 권수',u:'권',lo:0,hi:6},
  {w:'학생',v:'운동화 크기',u:'mm',lo:230,hi:270,step:5},
  {w:'어느 소방서에서 최초 신고 시각부터 현장 도착 시각까지의',v:'소요 시간',u:'분',lo:3,hi:15,obs:'차례'},
  {w:'학생',v:'1분 동안 턱걸이 횟수',u:'회',lo:2,hi:12},
];
function genMidRepresentative(){
  const S=pick(MID_REP_STORIES),kind=pick(['중앙값','중앙값','최빈값','평균']);
  const st=S.step||1,R=()=>S.lo+st*randInt(0,Math.floor((S.hi-S.lo)/st));
  let data,ans,sol;
  if(kind==='중앙값'){const n=pick([5,7]);data=[];while(data.length<n){const v=R();if(!data.includes(v))data.push(v);}
    const s=[...data].sort((a,b)=>a-b);ans=s[(n-1)/2];sol=[`작은 순서로 : ${s.join(', ')}`,`${n}개의 가운데(${(n+1)/2}번째) 값 = ${ans}${S.u}`];}
  else if(kind==='최빈값'){const n=pick([6,8,10]);ans=R();data=[ans,ans,ans];while(data.length<n){const v=R();if(v!==ans&&data.filter(x=>x===v).length<2)data.push(v);}
    data=shuffle(data);sol=[`가장 많이 나타난 값을 찾습니다.`,`${ans}${S.u}이 ${data.filter(x=>x===ans).length}번으로 가장 많습니다.`];}
  else{const n=pick([4,5]);const m=S.lo+st*randInt(1,Math.floor((S.hi-S.lo)/st)-1);data=[];let sum=0;
    for(let i=0;i<n-1;i++){const v=Math.max(S.lo,Math.min(S.hi,m+st*randInt(-2,2)));data.push(v);sum+=v;}
    const last=m*n-sum;if(last<S.lo||last>S.hi||data.length&&!Number.isInteger(last))return genMidRepresentative();data.push(last);ans=m;
    sol=[`(평균) = (자료의 합) ÷ (자료의 개수)`,`(${data.join('+')})÷${n} = ${m*n}÷${n} = ${m}${S.u}`];}
  const who=S.obs?`${S.w} 것`:`${S.w} ${data.length}명의 ${S.v}를 조사하여 나타낸 것`;
  const q=S.obs?`자료는 ${S.w} 소요 시간을 ${data.length}${S.obs} 조사하여 나타낸 것이다. 이 자료의 ${kind}은?`
    :`자료는 ${S.w} ${data.length}명의 ${S.v}${_josa(S.v,'을','를')} 조사하여 나타낸 것이다. 이 자료의 ${kind}은?`;
  const ws=[...new Set([ans-st,ans+st,...data])].filter(v=>v!==ans).slice(0,5);
  const{choices,answer}=makeChoices(`${ans}${S.u}`,shuffle(ws).slice(0,3).map(v=>`${v}${S.u}`));
  return{topic:kind,q,box:data.join('      '),boxUnit:`(단위 : ${S.u})`,choices,answer,meta:_MM('mid_stat','확률과 통계'),sol};
}
function genMidSpread(){
  const sets=shuffle([[1,1,1,1,1,1],[1,2,1,2,1,2],[2,3,2,3,2,3],[2,4,2,4,2,4]]);
  const sd=a=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length);};
  const best=sets.reduce((b,a)=>sd(a)>sd(b)?a:b);
  const choices=sets.map(a=>a.join(', '));
  return{topic:'표준편차',q:`다음 중 표준편차가 가장 큰 자료는?`,choices,answer:sets.indexOf(best),meta:_MM('mid_stat','확률과 통계'),
    sol:[`자료가 평균에서 멀리 흩어져 있을수록 표준편차가 큽니다.`,`${best.join(', ')} 의 값들이 평균에서 가장 멀리 떨어져 있습니다.`]};
}

/* 예전 이름 호환 (다른 화면이 부르는 이름) */
var genMidTranslate=genMidQuadrant,genMidSymmetryPoint=genMidQuadrant;

var MID_DOMAIN_GENS={
  '수와 연산':()=>weightedGen([[genMidPrime,4],[genMidNumber,4],[genMidRepeating,4],[genMidExponent,4]]),
  '문자와 식':()=>weightedGen([[genMidSubstitute,4],[genMidLinearEq,4],[genMidSystem,3],[genMidInequality,4],[genMidRadical,4],[genMidQuadraticEq,4]]),
  '함수':()=>weightedGen([[genMidQuadrant,4],[genMidLinearFunc,5],[genMidQuadraticDesc,5]]),
  '기하':()=>weightedGen([[genMidParallel,4],[genMidIsosceles,4],[genMidSimilarity,4],[genMidTrig,4],[genMidCircleAngle,4]]),
  '확률과 통계':()=>weightedGen([[genMidFrequency,4],[genMidCounting,4],[genMidProbability,4],[genMidRepresentative,4],[genMidSpread,1]])
};

function genMiddleMock(domain){
  const key=domain||pick(Object.keys(MID_DOMAIN_GENS));
  return MID_DOMAIN_GENS[key]();
}
