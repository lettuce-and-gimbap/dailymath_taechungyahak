// === js/generators/high/probStat.js ===
/* --------------------------------------------------------------------
   고졸 ⑤ 확률과 통계
   순열 · 조합 · 기본확률 · 여사건 · 곱의법칙 · 합의법칙
   -------------------------------------------------------------------- */

/* ════════════════════════════════════════════════
   ⑤ 확률과 통계 영역 — 6가지 유형 균등 출제
   순열·조합·기본확률·여사건·곱의법칙·합의법칙
   ════════════════════════════════════════════════ */
function genMockProbStat(){
  function gcd(a,b){return b===0?a:gcd(b,a%b);}
  function frac(n,d){const g=gcd(Math.abs(n),Math.abs(d));return g===d?String(n/g):`${n/g}/${d/g}`;}

  const TYPE=Math.floor(Math.random()*6);

  // ── 0 순열 ──
  if(TYPE===0){
    const pCtxs=[
      (n,r)=>`서로 다른 ${n}장의 글자 카드 중에서 ${r}장을 골라 일렬로 나열하는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}개의 경기 종목 중에서 ${r}개를 골라 순서대로 나열하는 경우의 수는?`,
      (n,r)=>`${n}명의 학생 중에서 ${r}명을 뽑아 일렬로 세우는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}점의 작품 중에서 ${r}점을 골라 일렬로 나열하는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}곳 중에서 ${r}곳을 골라 여행할 순서를 정하는 경우의 수는? (단, 한 번 여행한 곳은 다시 가지 않는다.)`,
      (n,r)=>`서로 다른 ${n}장의 한국 문화 카드 중에서 ${r}장을 골라 일렬로 나열하는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}종류의 채소 모종 중에서 ${r}개를 골라 화분에 하나씩 심는 순서를 정하는 경우의 수는?`,
      (n,r)=>`${n}개의 팀 중에서 ${r}개 팀을 뽑아 1위·2위를 정하는 경우의 수는?`,
    ];
    const safeOpts=[[3,2],[4,2],[5,2]];
    const[n,r]=pick(safeOpts);
    let pnr=1;for(let i=n;i>n-r;i--)pnr*=i;
    const wrongs=[pnr+2,pnr-2,pnr+r*2].filter(w=>w>0&&w!==pnr).slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(pnr),wrongs);
    const pSteps=[];for(let i=n;i>n-r;i--)pSteps.push(`${i}`);
    return{topic:'순열',q:pick(pCtxs)(n,r),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
      sol:[`순열 P(n,r): n개 중 r개를 골라 순서대로 나열하는 경우의 수입니다.`,`P(${n},${r}) = ${pSteps.join('×')} = ${pnr}`,`(순서가 다르면 다른 경우로 셉니다.)`]};
  }

  // ── 1 조합 ──
  if(TYPE===1){
    const cCtxs=[
      (n,r)=>`서로 다른 ${n}개의 민속놀이 중에서 ${r}개를 선택하는 경우의 수는?`,
      (n,r)=>`${n}종류의 꽃 중에서 서로 다른 ${r}종류를 선택하는 경우의 수는?`,
      (n,r)=>`${n}가지 방과 후 프로그램 중에서 서로 다른 ${r}가지를 선택하는 경우의 수는?`,
      (n,r)=>`아이스크림 토핑 ${n}종류 중에서 서로 다른 ${r}가지를 선택하는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}개의 수학 진로 과목 중에서 ${r}과목을 선택하는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}종류의 잡곡 중에서 ${r}종류를 선택하는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}개의 문화 센터 프로그램 중에서 ${r}개를 선택하는 경우의 수는?`,
      (n,r)=>`${n}명의 후보 중에서 대표 ${r}명을 뽑는 경우의 수는?`,
      (n,r)=>`서로 다른 ${n}가지 색 중에서 ${r}가지를 골라 사용하는 경우의 수는?`,
    ];
    const safeCombs=[[4,2],[5,2],[6,2],[4,3],[5,3],[6,3]];
    const[n,r]=pick(safeCombs);
    let cnr=1;for(let i=0;i<r;i++)cnr=Math.round(cnr*(n-i)/(i+1));
    if(cnr>20)cnr=10;
    const wrongs=[cnr+2,cnr-2,cnr+4].filter(w=>w>0&&w!==cnr).slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(cnr),wrongs);
    const cNum=[];const cDen=[];for(let i=0;i<r;i++){cNum.push(n-i);cDen.push(i+1);}
    return{topic:'조합',q:pick(cCtxs)(n,r),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
      sol:[`조합 C(n,r): n개 중 r개를 순서 없이 선택하는 경우의 수입니다.`,`C(${n},${r}) = (${cNum.join('×')}) ÷ (${cDen.join('×')}) = ${cnr}`,`(순서가 달라도 같은 선택이므로, 순열값을 r!로 나눕니다.)`]};
  }

  // ── 2 기본 확률 ──
  if(TYPE===2){
    const cases=[
      {w:2,r:3,total:5,wLabel:'흰',rLabel:'빨간',obj:'공'},
      {w:3,r:2,total:5,wLabel:'파란',rLabel:'빨간',obj:'공'},
      {w:1,r:4,total:5,wLabel:'흰',rLabel:'검은',obj:'공'},
      {w:2,r:4,total:6,wLabel:'흰',rLabel:'빨간',obj:'바둑돌'},
      {w:4,r:2,total:6,wLabel:'흰',rLabel:'검은',obj:'바둑돌'},
      {w:3,r:7,total:10,wLabel:'파란',rLabel:'빨간',obj:'카드'},
      {w:4,r:6,total:10,wLabel:'흰',rLabel:'검은',obj:'공'},
      {w:2,r:8,total:10,wLabel:'빨간',rLabel:'파란',obj:'공'},
    ];
    const c=pick(cases);
    const ans=frac(c.w,c.total);
    const poolFracs=['1/2','1/3','2/3','1/4','3/4','2/5','3/5','1/5','4/5','1/6','5/6','3/10','7/10','2/10','4/10'];
    const wrongs=[...new Set(poolFracs.filter(f=>f!==ans))].slice(0,3);
    const{choices,answer}=makeChoices(ans,wrongs);
    const qCtxs=[
      `주머니에 ${c.wLabel} ${c.obj} ${c.w}개, ${c.rLabel} ${c.obj} ${c.r}개가 들어 있다. 이 주머니에서 ${c.obj} 한 개를 꺼낼 때, ${c.wLabel} ${c.obj}가 나올 확률은?`,
      `상자 안에 ${c.wLabel} ${c.obj} ${c.w}개와 ${c.rLabel} ${c.obj} ${c.r}개가 있다. 임의로 한 개를 꺼낼 때 ${c.wLabel} ${c.obj}일 확률은?`,
    ];
    return{topic:'확률',q:pick(qCtxs),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
      sol:[`확률 = (사건이 일어나는 경우의 수) ÷ (전체 경우의 수)`,`P(${c.wLabel} ${c.obj}) = ${c.w} ÷ ${c.total} = ${ans}`]};
  }

  // ── 3 여사건 확률 ──
  if(TYPE===3){
    const cases=[
      {total:6,fav:3,eventLabel:'짝수',compLabel:'짝수가 아닌 수',obj:'주사위를 한 번 던질 때',ans:'1/2',favAns:'1/2'},
      {total:6,fav:2,eventLabel:'3의 배수',compLabel:'3의 배수가 아닌 수',obj:'주사위를 한 번 던질 때',ans:'2/3',favAns:'1/3'},
      {total:6,fav:1,eventLabel:'6',compLabel:'6이 아닌 수',obj:'주사위를 한 번 던질 때',ans:'5/6',favAns:'1/6'},
      {total:5,fav:2,eventLabel:'흰 공',compLabel:'흰 공이 아닌 공',obj:'흰 공 2개, 빨간 공 3개인 주머니에서 한 개를 꺼낼 때',ans:'3/5',favAns:'2/5'},
      {total:5,fav:1,eventLabel:'빨간 공',compLabel:'빨간 공이 아닌 공',obj:'빨간 공 1개, 파란 공 4개인 주머니에서 한 개를 꺼낼 때',ans:'4/5',favAns:'1/5'},
      {total:10,fav:3,eventLabel:'3의 배수',compLabel:'3의 배수가 아닌 수',obj:'1부터 10까지 쓰인 카드 중 한 장을 뽑을 때',ans:'7/10',favAns:'3/10'},
    ];
    const c=pick(cases);
    const poolFracs=['1/2','1/3','2/3','1/4','3/4','1/5','4/5','2/5','3/5','1/6','5/6','3/10','7/10'];
    const wrongs=[...new Set(poolFracs.filter(f=>f!==c.ans&&f!==c.favAns))].slice(0,3);
    const{choices,answer}=makeChoices(c.ans,wrongs);
    const qCtxs=[
      `${c.obj}, ${c.compLabel}가 나올 확률은?`,
      `${c.obj}, ${c.eventLabel}가 나오지 않을 확률은?`,
    ];
    return{topic:'여사건',q:pick(qCtxs),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
      sol:[`여사건의 확률: P(A가 아닌 경우) = 1 - P(A)`,`P(${c.eventLabel}) = ${c.favAns}`,`P(${c.compLabel}) = 1 - ${c.favAns} = ${c.ans}`]};
  }

  // ── 4 경우의 수 — 곱의 법칙 ──
  if(TYPE===4){
    const multCases=[
      {a:3,b:2,ans:6,aLabel:'셔츠 3가지',bLabel:'바지 2가지'},
      {a:4,b:2,ans:8,aLabel:'상의 4가지',bLabel:'하의 2가지'},
      {a:2,b:5,ans:10,aLabel:'모자 2가지',bLabel:'가방 5가지'},
      {a:3,b:4,ans:12,aLabel:'음료 3가지',bLabel:'빵 4가지'},
      {a:4,b:3,ans:12,aLabel:'색연필 4가지',bLabel:'스케치북 3가지'},
      {a:5,b:2,ans:10,aLabel:'책 5권',bLabel:'읽는 순서 2가지'},
      {a:3,b:3,ans:9,aLabel:'앞면 3가지',bLabel:'뒷면 3가지'},
      {a:2,b:4,ans:8,aLabel:'경로 A 2가지',bLabel:'경로 B 4가지'},
    ];
    const multCtxs=[
      c=>`${c.aLabel}와 ${c.bLabel}가 있다. 각각 하나씩 고르는 경우의 수는?`,
      c=>`${c.aLabel}와 ${c.bLabel}가 있을 때, 각각 하나를 선택하는 방법의 수는?`,
      c=>`${c.aLabel}와 ${c.bLabel}가 있다. 한 가지씩 선택하는 모든 경우의 수는?`,
    ];
    const c=pick(multCases);
    const poolNums=[6,8,10,12,9,15,16,20].filter(v=>v!==c.ans);
    const wrongs=[...new Set(poolNums)].slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(c.ans),wrongs);
    return{topic:'경우의 수(곱)',q:pick(multCtxs)(c),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
      sol:[`곱의 법칙: 두 사건이 동시에 일어날 경우의 수 = (첫 번째 경우의 수) × (두 번째 경우의 수)`,`${c.a} × ${c.b} = ${c.ans}`]};
  }

  // ── 5 경우의 수 — 합의 법칙 ──
  const sumCases=[
    {a:3,b:2,ans:5,aLabel:'버스 3가지 노선',bLabel:'지하철 2가지 노선',desc:'집에서 학교까지'},
    {a:4,b:3,ans:7,aLabel:'A 방법 4가지',bLabel:'B 방법 3가지',desc:'목적지에 가는'},
    {a:2,b:5,ans:7,aLabel:'택시 2가지 경로',bLabel:'버스 5가지 경로',desc:'역에서 시장까지'},
    {a:5,b:4,ans:9,aLabel:'연필 5자루',bLabel:'볼펜 4자루',desc:'필기구를 한 자루 고르는'},
    {a:3,b:6,ans:9,aLabel:'한식 3가지',bLabel:'양식 6가지',desc:'식당에서 메뉴를 하나 고르는'},
    {a:4,b:5,ans:9,aLabel:'소설책 4권',bLabel:'만화책 5권',desc:'책 한 권을 고르는'},
  ];
  const sumCtxs=[
    c=>`${c.desc} 방법: ${c.aLabel}과 ${c.bLabel}이 있다. 이 중 한 가지를 선택하는 경우의 수는?`,
    c=>`${c.aLabel}과 ${c.bLabel}이 있을 때, 이 중 하나를 선택하는 방법의 수는? (중복 없음)`,
  ];
  const c=pick(sumCases);
  const poolNums=[4,5,6,7,8,9,10,11,12].filter(v=>v!==c.ans);
  const wrongs=[...new Set(poolNums)].slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(c.ans),wrongs);
  return{topic:'경우의 수(합)',q:pick(sumCtxs)(c),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
    sol:[`합의 법칙: 두 사건 중 하나가 일어나는 경우의 수 = (첫 번째 경우의 수) + (두 번째 경우의 수)`,`${c.a} + ${c.b} = ${c.ans}`]};
}
