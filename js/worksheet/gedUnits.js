// === js/worksheet/gedUnits.js ===
/* =====================================================================
   만능 학습지 — 유형별 문제 엔진 (GED_AREAS / GED_UNITS)
   각 유형(unit) :
     id, tag(시험 문항 번호), area, title, src(출제 근거), coord(좌표 중심 유형 ★)
     concept : [li html...]        fields : [{k,label,min,max}|{k,label,sel:[...]}]
     def : 예제용 기본 조건          rand() : 실전용 무작위 조건
     build(p) : {q, figure?, choices, raw?, layout?, ans, answerTex|answerRaw, sol:[p...]} | {err}
   ===================================================================== */
var GED_AREAS=[
  {k:'C0',title:'좌표 기초 워밍업',desc:'좌표 읽기 · 사분면 · 직선의 그래프'},
  {k:'A', title:'영역 A · 다항식과 복소수',desc:'1번~5번'},
  {k:'B', title:'영역 B · 방정식과 부등식',desc:'6번~9번'},
  {k:'C', title:'영역 C · 도형의 방정식 (좌표평면)',desc:'10번~14번'},
  {k:'D', title:'영역 D · 집합 · 명제 · 함수',desc:'15번~18번'},
  {k:'E', title:'영역 E · 경우의 수',desc:'19번~20번'}
];

var GED_UNITS=(function(){
  const{nf,par,xm,ym,tail,tex,pr,rnd,pick,nz,CIRC,sqrtTex,sqrtTxt,shuffle,shuffleWith,mulberry,term,poly,
    numChoices,stepChoices,pickChoices,coordChoices,planeSVG,synthSVG,numlineSVG,divSVG,mapSVG,NAVY,RED,GREEN,GREY}=GS;
  const fig=svg=>`<div class="fig">${svg}</div>`;
  /* 조사 고르기 : 앞말 끝 글자에 받침이 있으면 withB(이/을), 없으면 noB(가/를).  4명이 · 4개가 · 3권을 · 2가지를 */
  const josa=(w,withB,noB)=>{const c=String(w).slice(-1).charCodeAt(0)-0xAC00;return(c>=0&&c<11172&&c%28)?withB:noB;};
  const quadName=(x,y)=>x>0&&y>0?1:(x<0&&y>0?2:(x<0&&y<0?3:(x>0&&y<0?4:0)));
  const lineTex=(a,b)=>`y=${a===1?'':(a===-1?'-':nf(a))}x${tail(b)}`;

  /* ──────────────────────────────────────────────────────────────
     삼차 · 사차방정식의 한 근 (8번) — 두 유형이 나눠 쓰는 공통 생성기
     삼차는 2026-1회 9번처럼 ${x^2} 항이 있는 꼴도 낼 수 있다.
     ────────────────────────────────────────────────────────────── */
  function buildRootDeg(p,deg){
    const r=Math.max(1,Math.min(3,p.r)),a=p.a;
    if(deg==='사차'){
      const c=-(r**4+a*r*r);
      const eq=`x^4+ax^2${tail(c)}=0`;const ch=numChoices(a);
      return{q:`사차방정식 ${tex(eq)}의 한 근이 ${tex(nf(r))}일 때, 상수 ${tex('a')}의 값은?`,
        choices:ch.list,ans:ch.ans,answerTex:nf(a),
        sol:[`${tex('x')} 자리에 ${tex(nf(r))}을 넣습니다 : ${tex(`${nf(r)}^4+a\\times ${nf(r)}^2${tail(c)}=0`)}`,
          `거듭제곱을 먼저 계산합니다 : ${tex(`${nf(r)}^4=${nf(r**4)}`)}, ${tex(`${nf(r)}^2=${nf(r*r)}`)}`,
          `${tex(`${nf(r**4)}+${nf(r*r)}a${tail(c)}=0`)} → ${tex(`${nf(r*r)}a=${nf(-(r**4+c))}`)} → ${tex('a='+nf(a))}`]};
    }
    const withSq=(p.form||'').indexOf('x²')>=0;
    const c=withSq?-(r**3+r*r+a*r):-(r**3+a*r);
    const eq=withSq?`x^3+x^2+ax${tail(c)}=0`:`x^3+ax${tail(c)}=0`;
    const ch=numChoices(a);
    const head=withSq?`${tex(`${nf(r)}^3+${nf(r)}^2+a\\times ${nf(r)}${tail(c)}=0`)}`:`${tex(`${nf(r)}^3+a\\times ${nf(r)}${tail(c)}=0`)}`;
    const left=withSq?r**3+r*r:r**3;
    return{q:`삼차방정식 ${tex(eq)}의 한 근이 ${tex(nf(r))}일 때, 상수 ${tex('a')}의 값은?`,
      choices:ch.list,ans:ch.ans,answerTex:nf(a),
      sol:[`${tex('x')} 자리에 ${tex(nf(r))}을 넣습니다 : ${head}`,
        `거듭제곱을 먼저 계산합니다 : ${tex(`${nf(r)}^3=${nf(r**3)}`)}${withSq?`, ${tex(`${nf(r)}^2=${nf(r*r)}`)}`:''}`,
        `${tex(`${nf(left)}+${nf(r)}a${tail(c)}=0`)} → ${tex(`${nf(r)}a=${nf(-(left+c))}`)} → ${tex('a='+nf(a))}`]};
  }

  return[
  /* ================================================================
     C0. 좌표 기초 워밍업 (좌표 중심 ★)
     ================================================================ */
  { id:'c1', tag:'기초 1', area:'C0', title:'좌표평면 위의 점 읽기', src:'모든 좌표 문제의 출발점', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['점의 좌표 읽기','x좌표만 읽기','y좌표만 읽기']},{k:'x',label:'점의 x',min:-5,max:5},{k:'y',label:'점의 y',min:-5,max:5}],
    def:{kind:'점의 좌표 읽기',x:3,y:2},
    rand(){return{kind:pick(['점의 좌표 읽기','점의 좌표 읽기','x좌표만 읽기','y좌표만 읽기']),x:nz(-5,5),y:nz(-5,5)};},
    build(p){
      const kind=p.kind||'점의 좌표 읽기';
      // 한 좌표만 읽는 유형 — 읽는 방향을 한 번에 하나씩만 연습시킨다
      if(kind!=='점의 좌표 읽기'){
        const onlyX=kind[0]==='x',v=onlyX?p.x:p.y,ch1=numChoices(v);
        return{q:`그림과 같이 좌표평면 위에 점 ${tex('\\mathrm{P}')}가 있다. 점 ${tex('\\mathrm{P}')}의 ${onlyX?'x':'y'}좌표는?`,
          figure:fig(planeSVG({xmin:-6,xmax:6,ymin:-6,ymax:6,s:34},[{t:'pt',x:p.x,y:p.y,label:'P',guide:true,nolabel:true,r:8}])),
          choices:ch1.list,ans:ch1.ans,answerTex:nf(v),layout:'one',
          sol:[onlyX?`점 P에서 <b>아래(또는 위)로 곧게</b> 내려가 x축과 만나는 눈금을 읽습니다.`
                    :`점 P에서 <b>옆으로 곧게</b> 가서 y축과 만나는 눈금을 읽습니다.`,
            `${onlyX?'x':'y'}좌표는 ${tex(nf(v))} 입니다.`,
            `(x, y) 순서로 쓰면 ${tex(`\\mathrm{P}${pr(p.x,p.y)}`)} 이지만, 이 문제는 ${onlyX?'앞':'뒤'} 숫자 하나만 묻고 있습니다.`]};
      }
      const ch=coordChoices(p.x,p.y);
      const q=`그림과 같이 좌표평면 위에 점 ${tex('\\mathrm{P}')}가 있다. 점 ${tex('\\mathrm{P}')}의 좌표는?`;
      const figure=fig(planeSVG({xmin:-6,xmax:6,ymin:-6,ymax:6,s:34},[{t:'pt',x:p.x,y:p.y,label:'P',guide:true,nolabel:true,r:8}]));
      const sol=[
        `점 P에서 <b>아래(또는 위)로 곧게</b> 내려가 x축과 만나는 눈금을 읽습니다 → ${tex(nf(p.x))}`,
        `점 P에서 <b>옆으로 곧게</b> 가서 y축과 만나는 눈금을 읽습니다 → ${tex(nf(p.y))}`,
        `(x, y) 순서로 쓰면 ${tex(`\\mathrm{P}${pr(p.x,p.y)}`)} 입니다.`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:pr(p.x,p.y),layout:'one'};
    }
  },
  { id:'c2', tag:'기초 2', area:'C0', title:'사분면과 부호', src:'대칭이동(14번)의 밑바탕', coord:true,
    fields:[{k:'x',label:'점의 x',min:-5,max:5},{k:'y',label:'점의 y',min:-5,max:5},{k:'kind',label:'문제 종류',sel:['그대로','x축 대칭','y축 대칭','원점 대칭']}],
    def:{x:-3,y:2,kind:'그대로'},
    rand(){return{x:nz(-5,5),y:nz(-5,5),kind:pick(['그대로','그대로','x축 대칭','y축 대칭','원점 대칭'])};},
    build(p){
      if(p.x===0||p.y===0)return{err:'축 위의 점은 사분면에 속하지 않습니다. 0이 아닌 수를 넣어 주세요.'};
      let X=p.x,Y=p.y,how='';
      if(p.kind==='x축 대칭'){Y=-p.y;how='x축 대칭은 y의 부호만 바꿉니다.';}
      else if(p.kind==='y축 대칭'){X=-p.x;how='y축 대칭은 x의 부호만 바꿉니다.';}
      else if(p.kind==='원점 대칭'){X=-p.x;Y=-p.y;how='원점 대칭은 x, y 둘 다 부호를 바꿉니다.';}
      const qn=quadName(X,Y);
      const names=['제1사분면','제2사분면','제3사분면','제4사분면'];
      const q=p.kind==='그대로'
        ?`점 ${tex(pr(p.x,p.y))}은 제몇 사분면 위의 점인가?`
        :`점 ${tex(pr(p.x,p.y))}을 <b>${p.kind}</b>이동한 점은 제몇 사분면 위의 점인가?`;
      const items=[{t:'text',x:2.2,y:2.8,s:'제1',size:22,color:'#888'},{t:'text',x:-3.6,y:2.8,s:'제2',size:22,color:'#888'},{t:'text',x:-3.6,y:-3.2,s:'제3',size:22,color:'#888'},{t:'text',x:2.2,y:-3.2,s:'제4',size:22,color:'#888'},
        {t:'pt',x:p.x,y:p.y,label:'P',guide:true,r:8}];
      const figure=fig(planeSVG({xmin:-6,xmax:6,ymin:-6,ymax:6,s:32},items));
      const sol=[
        `점 P${tex(pr(p.x,p.y))}의 부호는 (${p.x>0?'+':'−'}, ${p.y>0?'+':'−'}) 입니다.`,
        ...(how?[how+` → ${tex(pr(X,Y))}, 부호는 (${X>0?'+':'−'}, ${Y>0?'+':'−'})`]:[]),
        `(${X>0?'+':'−'}, ${Y>0?'+':'−'}) 는 <b>${names[qn-1]}</b>입니다.`];
      return{q,figure,choices:names,raw:true,layout:'two',ans:qn-1,sol,answerRaw:names[qn-1]};
    }
  },
  { id:'c3', tag:'기초 3', area:'C0', title:'직선의 그래프 읽기 (기울기와 y절편)', src:'12번 직선의 방정식 밑바탕', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['그래프 읽기','식 세우기']},{k:'a',label:'기울기 a',min:-3,max:3},{k:'b',label:'y절편 b',min:-4,max:4}],
    def:{kind:'그래프 읽기',a:2,b:-1},
    rand(){return{kind:pick(['그래프 읽기','그래프 읽기','식 세우기']),a:nz(-3,3),b:nz(-4,4)};},
    build(p){
      if(p.a===0)return{err:'기울기가 0이면 가로선이 됩니다. 0이 아닌 수를 넣어 주세요.'};
      const a=p.a,b=p.b,f=x=>a*x+b;
      const items=[{t:'fn',f},{t:'pt',x:0,y:b,guide:true,label:'',r:7},{t:'pt',x:1,y:a+b,guide:true,r:7,color:GREEN}];
      const lim=Math.max(5,Math.abs(a+b)+1,Math.abs(b)+1);
      const figure=fig(planeSVG({xmin:-lim,xmax:lim,ymin:-lim,ymax:lim,s:Math.min(34,Math.floor(340/lim))},items));
      if(p.kind==='그래프 읽기'){
        const ans=a+b,ch=numChoices(ans);
        const q=`그림은 일차함수 ${tex('y=ax+b')}의 그래프이다. 두 상수 ${tex('a,\\ b')}에 대하여 ${tex('a+b')}의 값은?`;
        const sol=[
          `직선이 y축과 만나는 눈금(빨간 점)을 읽으면 ${tex(nf(b))} → y절편 ${tex('b='+nf(b))}`,
          `오른쪽으로 1칸 가면(초록 점) y가 ${nf(b)}에서 ${nf(a+b)}로 → ${a>0?'올라가므로':'내려가므로'} 기울기 ${tex('a='+nf(a))}`,
          `따라서 ${tex(`a+b=${par(a)}+${par(b)}=${nf(ans)}`)}`];
        return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
      }
      const correct=lineTex(a,b);
      const ch=pickChoices(correct,[lineTex(b,a),lineTex(-a,b),lineTex(a,-b),lineTex(-a,-b)].filter(s=>s!==correct&&!(b===0&&s===lineTex(a,0))),k=>lineTex(a+k,b));
      const q=`기울기가 ${tex(nf(a))}이고 ${tex('y')}절편이 ${tex(nf(b))}인 직선의 방정식은?`;
      const sol=[`직선의 식은 ${tex('y=(\\text{기울기})x+(y\\text{절편})')} 입니다.`,`기울기 자리에 ${tex(nf(a))}, y절편 자리에 ${tex(nf(b))}를 넣습니다.`,`따라서 ${tex(correct)}`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:correct,layout:'two'};
    }
  },

  /* ================================================================
     영역 A. 다항식과 복소수
     ================================================================ */
  { id:'u1', tag:'1번', area:'A', title:'다항식의 계산', src:'2023~2026 매회 1번',
    fields:[{k:'kind',label:'문제 종류',sel:['A+B (합)','A−B (차)','2A+B','A−2B','A+B (x² 꼴)']},
      {k:'p',label:'A의 최고차 계수',min:1,max:3},{k:'a',label:'A의 x 계수',min:-6,max:6},{k:'q',label:'B의 최고차 계수',min:1,max:3},{k:'b',label:'B의 x 계수',min:-6,max:6}],
    def:{kind:'A+B (합)',p:1,a:4,q:1,b:-2},
    rand(){const kind=pick(['A+B (합)','A+B (합)','A−B (차)','A−B (차)','2A+B','A−2B','A+B (x² 꼴)']);
      let p=rnd(1,2),q=rnd(1,2),a=rnd(-5,5),b=rnd(-5,5);
      if(kind.indexOf('−')>=0){if(p===q)p=q+1;if(a===b)b=a-rnd(1,3);}if(a===0)a=1;if(b===0)b=-2;return{kind,p,a,q,b};},
    build(p){
      // 예전 저장본 호환 : op(+/−) 만 있던 시절의 조건을 kind로 옮긴다
      const kind=p.kind||(p.op==='−'?'A−B (차)':'A+B (합)');
      const mA=kind==='2A+B'?2:1, mB=kind==='A−2B'?2:1, sg=kind.indexOf('−')>=0?-1:1;
      const hi=kind==='A+B (x² 꼴)'?'x^2':'x^3';           // 2022-1회 1번은 x² 다항식으로 출제됨
      const c3=mA*p.p+sg*mB*p.q, c1=mA*p.a+sg*mB*p.b;
      if(c3===0&&c1===0)return{err:'결과가 0이 됩니다. 계수를 바꿔 주세요.'};
      const A=poly([[p.p,hi],[p.a,'x']]),B=poly([[p.q,hi],[p.b,'x']]),res=poly([[c3,hi],[c1,'x']]);
      let off=rnd(0,3);const lo=c1-off;
      const list=[0,1,2,3].map(i=>poly([[c3,hi],[lo+i,'x']]));
      const opTex=kind==='2A+B'?'2A+B':kind==='A−2B'?'A-2B':(sg>0?'A+B':'A-B');
      const q=`두 다항식 ${tex('A='+A)}, ${tex('B='+B)}에 대하여 ${tex(opTex)}는?`;
      const pre=mA>1?`먼저 ${tex('A')}를 2배 : ${tex('2A='+poly([[2*p.p,hi],[2*p.a,'x']]))}`
        :(mB>1?`먼저 ${tex('B')}를 2배 : ${tex('2B='+poly([[2*p.q,hi],[2*p.b,'x']]))}`:'');
      const sol=[...(pre?[pre]:[]),
        `${tex(hi)}끼리 먼저 : ${tex(`${nf(mA*p.p)}${sg>0?'+':'-'}${nf(mB*p.q)}=${nf(c3)}`)} → ${tex(poly([[c3,hi]]))}`,
        `${tex('x')}끼리 다음 : ${tex(`${par(mA*p.a)}${sg>0?'+':'-'}${par(mB*p.b)}=${nf(c1)}`)} → ${tex(c1===0?'0':poly([[c1,'x']]))}`,
        `둘을 붙여 쓰면 ${tex(opTex+'='+res)}`];
      return{q,choices:list,ans:off,sol,answerTex:res,layout:'two'};
    }
  },
  { id:'u2', tag:'2번', area:'A', title:'항등식', src:'2023~2026 매회 2번',
    fields:[{k:'kind',label:'문제 종류',sel:['a+b 구하기','a만 구하기','b만 구하기','곱셈 전개형 (합·차 공식)','곱셈 전개형 (두 일차식)']},
      {k:'p',label:'왼쪽 x 계수',min:-6,max:6},{k:'q',label:'오른쪽 상수항',min:-6,max:6},{k:'lead',label:'x² 계수',min:1,max:3},
      {k:'m',label:'[전개형] 괄호 안 수 m',min:1,max:5},{k:'n',label:'[전개형] 괄호 안 수 n',min:-5,max:5}],
    def:{kind:'a+b 구하기',p:2,q:1,lead:1,m:1,n:-1},
    rand(){const kind=pick(['a+b 구하기','a+b 구하기','a+b 구하기','a만 구하기','b만 구하기','곱셈 전개형 (합·차 공식)','곱셈 전개형 (두 일차식)']);
      let p=rnd(-4,5),q=rnd(-4,5);if(p===0)p=3;if(q===0)q=2;
      let n=rnd(-5,5);if(n===0)n=2;return{kind,p,q,lead:rnd(1,2),m:rnd(1,5),n};},
    build(p){
      const kind=p.kind||'a+b 구하기';
      /* ── 곱셈 전개형 : (x+m)(x−m)=x²+a 처럼 왼쪽을 펼쳐서 짝을 맞추는 유형 (2022-1회 2번) ── */
      if(kind==='곱셈 전개형 (합·차 공식)'){
        const m=p.m||1,a=-m*m,ch=numChoices(a);
        const q=`등식 ${tex(`(x+${nf(m)})(x-${nf(m)})=x^2+a`)}가 ${tex('x')}에 대한 항등식일 때, 상수 ${tex('a')}의 값은?`;
        const sol=[`합·차 공식 ${tex('(x+m)(x-m)=x^2-m^2')}을 씁니다.`,
          `${tex(`(x+${nf(m)})(x-${nf(m)})=x^2-${nf(m*m)}`)}`,
          `${tex('x^2+a')}와 짝을 맞추면 ${tex('a='+nf(a))}`];
        return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(a)};
      }
      if(kind==='곱셈 전개형 (두 일차식)'){
        const m=p.m||1,n=p.n||2,A=m+n,B=m*n,ans=A+B,ch=numChoices(ans);
        const q=`등식 ${tex(`(x${tail(m)})(x${tail(n)})=x^2+ax+b`)}가 ${tex('x')}에 대한 항등식일 때, 두 상수 ${tex('a')}, ${tex('b')}에 대하여 ${tex('a+b')}의 값은?`;
        const sol=[`왼쪽을 펼칩니다 : ${tex(`(x${tail(m)})(x${tail(n)})=x^2+(${nf(m)}${term(n,'',false)})x+(${par(m)}\\times${par(n)})`)}`,
          `정리하면 ${tex(`x^2${term(A,'x',false)}${term(B,'',false)}`)} → ${tex('a='+nf(A))}, ${tex('b='+nf(B))}`,
          `따라서 ${tex(`a+b=${par(A)}+${par(B)}=${nf(ans)}`)}`];
        return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
      }
      /* ── 기본형 : 양변 계수 비교 ── */
      const L=poly([[p.lead,'x^2'],[p.p,'x']])+'+a',R=poly([[p.lead,'x^2']])+'+bx'+term(p.q,'',false);
      const a=p.q,b=p.p;
      const ask=kind==='a만 구하기'?'a':kind==='b만 구하기'?'b':'a+b';
      const ans=ask==='a'?a:ask==='b'?b:a+b,ch=numChoices(ans);
      const q=ask==='a+b'
        ?`등식 ${tex(L+'='+R)}이 ${tex('x')}에 대한 항등식일 때, 두 상수 ${tex('a')}, ${tex('b')}에 대하여 ${tex('a+b')}의 값은?`
        :`등식 ${tex(L+'='+R)}이 ${tex('x')}에 대한 항등식일 때, 상수 ${tex(ask)}의 값은?`;
      const sol=[`${tex('x')} 자리 짝 맞추기 : 왼쪽은 ${tex(nf(b))}, 오른쪽은 ${tex('b')} → ${tex('b='+nf(b))}`,
        `맨 뒤 숫자 짝 맞추기 : 왼쪽은 ${tex('a')}, 오른쪽은 ${tex(nf(a))} → ${tex('a='+nf(a))}`,
        ask==='a+b'?`따라서 ${tex(`a+b=${par(a)}+${par(b)}=${nf(ans)}`)}`:`묻는 것은 ${tex(ask)} 하나이므로 ${tex(ask+'='+nf(ans))}`];
      return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  },
  { id:'u3', tag:'3번', area:'A', title:'나머지정리 · 조립제법', src:'2023~2026 매회 3번',
    fields:[{k:'kind',label:'문제 종류',sel:['나머지 R (조립제법 표)','몫 구하기 (조립제법 표)','나머지정리 (대입)','나누어떨어지는 조건']},
      {k:'k',label:'나누는 수 k (x−k)',min:-3,max:3},{k:'b',label:'x² 계수',min:-5,max:5},{k:'c',label:'x 계수',min:-6,max:6},{k:'d',label:'상수항',min:-6,max:6}],
    def:{kind:'나머지 R (조립제법 표)',k:1,b:2,c:4,d:-1},
    rand(){return{kind:pick(['나머지 R (조립제법 표)','나머지 R (조립제법 표)','몫 구하기 (조립제법 표)','나머지정리 (대입)','나누어떨어지는 조건']),
      k:pick([-2,-1,1,2,3]),b:rnd(-3,4),c:rnd(-4,5),d:rnd(-5,5)};},
    build(p){
      if(p.k===0)return{err:'나누는 수 k는 0이 아니어야 합니다.'};
      const kind=p.kind||'나머지 R (조립제법 표)';
      const q2=p.b+p.k,q3=p.c+p.k*q2,R=p.d+p.k*q3;const products=[p.k,p.k*q2,p.k*q3];
      const P=poly([[1,'x^3'],[p.b,'x^2'],[p.c,'x'],[p.d,'']]);const div=p.k>=0?`x-${nf(p.k)}`:`x+${nf(-p.k)}`;
      const quot=poly([[1,'x^2'],[q2,'x'],[q3,'']]);
      const table=fig(synthSVG(nf(p.k),[1,p.b,p.c,p.d].map(nf),products.map(nf),[1,q2,q3,R].map(nf),true));
      const steps=[`내려쓰기 : 첫 칸 1을 그대로 내려씁니다.`,
        `곱하고 더하기 : ${tex(`${par(p.k)}\\times 1=${nf(products[0])}`)}, ${tex(`${par(p.b)}+${par(products[0])}=${nf(q2)}`)}`,
        `다시 : ${tex(`${par(p.k)}\\times ${par(q2)}=${nf(products[1])}`)}, ${tex(`${par(p.c)}+${par(products[1])}=${nf(q3)}`)}`,
        `마지막 : ${tex(`${par(p.k)}\\times ${par(q3)}=${nf(products[2])}`)}, ${tex(`${par(p.d)}+${par(products[2])}=${nf(R)}`)}`];

      /* ── 몫 구하기 (2022-1회 3번) : 맨 아랫줄에서 나머지를 뺀 앞쪽이 몫 ── */
      if(kind==='몫 구하기 (조립제법 표)'){
        const wrongs=[poly([[1,'x^2'],[q2,'x'],[R,'']]),poly([[1,'x^2'],[q3,'x'],[q2,'']]),
          poly([[2,'x'],[q2,'']]),poly([[1,'x^2'],[q2+1,'x'],[q3,'']]),poly([[1,'x'],[q2,'']])];
        const ch=pickChoices(quot,wrongs,i=>poly([[1,'x^2'],[q2+i,'x'],[q3-i,'']]));
        return{q:`다음은 조립제법을 이용하여 다항식 ${tex(P)}을 일차식 ${tex(div)}로 나누어 몫과 나머지를 구하는 과정이다. 이때, 몫은?`,
          figure:table,choices:ch.list,ans:ch.ans,layout:'two',
          sol:[...steps,`맨 아랫줄은 ${tex(`1,\\ ${nf(q2)},\\ ${nf(q3)},\\ ${nf(R)}`)} 입니다.`,
            `<b>마지막 칸은 나머지</b>이고, 그 앞의 수들이 <b>몫의 계수</b>입니다 → ${tex(`1,\\ ${nf(q2)},\\ ${nf(q3)}`)}`,
            `삼차식을 일차식으로 나누었으므로 몫은 이차식 : ${tex(quot)}`],
          answerTex:quot};
      }
      /* ── 나머지정리 (표 없이 대입) ── */
      if(kind==='나머지정리 (대입)'){
        const ch=numChoices(R);
        return{q:`다항식 ${tex(P)}을 일차식 ${tex(div)}로 나누었을 때, 나머지는?`,
          choices:ch.list,ans:ch.ans,answerTex:nf(R),
          sol:[`나머지정리 : ${tex(`P(x)`)}를 ${tex(div)}로 나눈 나머지는 ${tex(`P(${nf(p.k)})`)} 입니다.`,
            `${tex(`P(${nf(p.k)})=${par(p.k)}^3${term(p.b,'',false)}\\times${par(p.k)}^2${term(p.c,'',false)}\\times${par(p.k)}${term(p.d,'',false)}`)}`,
            `계산하면 ${tex('='+nf(R))}`,
            `조립제법으로 확인해도 맨 아래 마지막 칸이 ${tex(nf(R))} 입니다.`]};
      }
      /* ── 나누어떨어지는 조건 (2021-2회 3번) : 나머지 = 0 이 되도록 상수항을 되찾는다 ── */
      if(kind==='나누어떨어지는 조건'){
        const aVal=-(p.k*q3);                                  // d 자리에 들어갈 값
        const Pa=poly([[1,'x^3'],[p.b,'x^2'],[p.c,'x']])+'+a';
        const ch=numChoices(aVal);
        return{q:`다항식 ${tex(Pa)}가 ${tex(div)}로 나누어떨어질 때, 상수 ${tex('a')}의 값은?`,
          choices:ch.list,ans:ch.ans,answerTex:nf(aVal),
          sol:[`나누어떨어진다 = <b>나머지가 0</b> 이라는 뜻입니다.`,
            `나머지정리에 의해 ${tex(`P(${nf(p.k)})=0`)} 이어야 합니다.`,
            `${tex(`${par(p.k)}^3${term(p.b,'',false)}\\times${par(p.k)}^2${term(p.c,'',false)}\\times${par(p.k)}+a=0`)}`,
            `${tex(`${nf(p.k*q3)}+a=0`)} → ${tex('a='+nf(aVal))}`]};
      }
      /* ── 기본형 : 나머지 R ── */
      const ch=numChoices(R);
      return{q:`다음은 조립제법을 이용하여 다항식 ${tex(P)}을 일차식 ${tex(div)}로 나누었을 때의 몫과 나머지를 구하는 과정이다. 이때, 나머지 ${tex('R')}의 값은?`,
        figure:table,choices:ch.list,ans:ch.ans,answerTex:nf(R),
        sol:[...steps,`맨 아래 마지막 칸이 나머지이므로 ${tex('R='+nf(R))} (몫은 ${tex(quot)})`,
          `확인 : ${tex('x='+nf(p.k))}을 대입해도 나머지가 나옵니다(나머지정리).`]};
    }
  },
  { id:'u4', tag:'4번', area:'A', title:'다항식의 인수분해', src:'2023~2026 매회 4번',
    fields:[{k:'kind',label:'문제 종류',sel:['세제곱의 합 (앞 괄호 a)','세제곱의 차 (앞 괄호 a)','세제곱 공식 (뒤 괄호 a)','완전세제곱 (x−a)³','완전세제곱 (x+a)³']},
      {k:'a',label:'a 값',min:2,max:5}],
    def:{kind:'세제곱의 합 (앞 괄호 a)',a:2},
    rand(){return{kind:pick(['세제곱의 합 (앞 괄호 a)','세제곱의 차 (앞 괄호 a)','세제곱 공식 (뒤 괄호 a)','완전세제곱 (x−a)³','완전세제곱 (x+a)³']),a:rnd(2,5)};},
    build(p){
      const kind=p.kind||(p.sg==='−'?'세제곱의 차 (앞 괄호 a)':'세제곱의 합 (앞 괄호 a)');
      const a=p.a,cube=a*a*a,sq=a*a,ch=numChoices(a);

      /* ── 완전세제곱 (2022-1회 4번) : x³−3ax²+3a²x−a³=(x−a)³ ── */
      if(kind.indexOf('완전세제곱')===0){
        const minus=kind.indexOf('−')>=0;
        const s=minus?-1:1;                                    // (x+sa)³
        const left=poly([[1,'x^3'],[3*s*a,'x^2'],[3*sq,'x'],[s*cube,'']]);
        const right=minus?'(x-a)^3':'(x+a)^3';
        return{q:`다항식 ${tex(left)}을 인수분해한 식이 ${tex(right)}일 때, 상수 ${tex('a')}의 값은?`,
          choices:ch.list,ans:ch.ans,answerTex:nf(a),
          sol:[`공식 ${tex(minus?'(x-a)^3=x^3-3ax^2+3a^2x-a^3':'(x+a)^3=x^3+3ax^2+3a^2x+a^3')}`,
            `맨 뒤 숫자를 봅니다 : ${tex(nf(s*cube))}${minus?`는 ${tex(`-${nf(a)}^3`)}`:`은 ${tex(`${nf(a)}^3`)}`} → ${tex('a='+nf(a))}`,
            `${tex('x^2')} 자리로 확인 : ${tex(`3a=${nf(3*a)}`)} 이므로 ${tex('a='+nf(a))} 가 맞습니다.`]};
      }

      /* ── 세제곱의 합·차 ── */
      const plus=kind.indexOf('합')>=0||kind==='세제곱 공식 (뒤 괄호 a)';
      const left=`x^3${plus?'+':'-'}${nf(cube)}`;

      // 뒤 괄호의 상수를 묻는 형태 (2021-2회 4번) : a = (밑)²
      if(kind==='세제곱 공식 (뒤 괄호 a)'){
        const right=`(x+${nf(a)})(x^2-${nf(a)}x+a)`;
        const ch2=numChoices(sq);
        return{q:`다항식 ${tex(left)}을 인수분해한 식이 ${tex(right)}일 때, 상수 ${tex('a')}의 값은?`,
          choices:ch2.list,ans:ch2.ans,answerTex:nf(sq),
          sol:[`${tex(nf(cube))}은 ${tex(`${nf(a)}^3`)}이므로 세제곱의 합 공식을 씁니다.`,
            `${tex(`x^3+${nf(a)}^3=(x+${nf(a)})(x^2-${nf(a)}x+${nf(a)}^2)`)}`,
            `뒤 괄호의 맨 뒤는 ${tex(`${nf(a)}^2=${nf(sq)}`)} → ${tex('a='+nf(sq))}`]};
      }
      const right=plus?`(x+a)(x^2-${nf(a)}x+${nf(sq)})`:`(x-a)(x^2+${nf(a)}x+${nf(sq)})`;
      return{q:`다항식 ${tex(left)}을 인수분해한 식이 ${tex(right)}일 때, 상수 ${tex('a')}의 값은?`,
        choices:ch.list,ans:ch.ans,answerTex:nf(a),
        sol:[`${tex(nf(cube))}은 ${tex(`${nf(a)}^3`)}이므로 ${tex(`${left}=x^3${plus?'+':'-'}${nf(a)}^3`)}`,
          `공식 ${tex(plus?'x^3+a^3=(x+a)(x^2-ax+a^2)':'x^3-a^3=(x-a)(x^2+ax+a^2)')}에 ${tex('a='+nf(a))}을 넣으면 ${tex(plus?`(x+${nf(a)})(x^2-${nf(a)}x+${nf(sq)})`:`(x-${nf(a)})(x^2+${nf(a)}x+${nf(sq)})`)}`,
          `문제의 식과 나란히 비교하면 ${tex('a='+nf(a))}`]};
    }
  },
  { id:'u5', tag:'5번', area:'A', title:'허수와 켤레복소수', src:'2023~2026 매회 5번',
    fields:[{k:'kind',label:'문제 종류',sel:['켤레복소수 a+b','켤레복소수 a만','i 곱셈 후 실수부','i² 포함 계산','복소수 상등']},
      {k:'p',label:'실수 부분',min:-5,max:5},{k:'q',label:'허수 부분 (i의 계수)',min:-5,max:5}],
    def:{kind:'켤레복소수 a+b',p:2,q:-1},
    rand(){return{kind:pick(['켤레복소수 a+b','켤레복소수 a+b','켤레복소수 a만','i 곱셈 후 실수부','i² 포함 계산','복소수 상등']),
      p:rnd(1,5),q:pick([-3,-2,-1,1,2,3])};},
    build(p){
      if(p.q===0)return{err:'허수 부분이 0이면 켤레복소수 문제가 되지 않습니다.'};
      const kind=p.kind||'켤레복소수 a+b';
      const z=poly([[p.p,''],[p.q,'i']]),conj=poly([[p.p,''],[-p.q,'i']]);

      /* ── i를 곱해서 펼치는 유형 (2021-2회 5번) : i(1+ki)=a+i ── */
      if(kind==='i 곱셈 후 실수부'){
        const k=Math.abs(p.q)||2,ans=-k,ch=numChoices(ans);
        return{q:`${tex(`i(1+${nf(k)}i)=a+i`)}일 때, 실수 ${tex('a')}의 값은? (단, ${tex('i=\\sqrt{-1}')})`,
          choices:ch.list,ans:ch.ans,answerTex:nf(ans),
          sol:[`괄호를 펼칩니다 : ${tex(`i(1+${nf(k)}i)=i+${nf(k)}i^2`)}`,
            `${tex('i^2=-1')} 이므로 ${tex(`${nf(k)}i^2=${nf(-k)}`)}`,
            `정리하면 ${tex(`${nf(-k)}+i`)} → ${tex('a+i')}와 짝을 맞추면 ${tex('a='+nf(ans))}`]};
      }
      /* ── i²을 정리하는 유형 (2022-1회 5번) : p−i+i²=a−i ── */
      if(kind==='i² 포함 계산'){
        const ans=p.p-1,ch=numChoices(ans);
        return{q:`${tex(`${nf(p.p)}-i+i^2=a-i`)}일 때, 실수 ${tex('a')}의 값은? (단, ${tex('i=\\sqrt{-1}')})`,
          choices:ch.list,ans:ch.ans,answerTex:nf(ans),
          sol:[`${tex('i^2=-1')} 을 먼저 바꿔 넣습니다.`,
            `${tex(`${nf(p.p)}-i+i^2=${nf(p.p)}-i-1`)}`,
            `실수끼리 정리하면 ${tex(`${nf(ans)}-i`)} → ${tex('a-i')}와 짝을 맞추면 ${tex('a='+nf(ans))}`]};
      }
      /* ── 복소수 상등 ── */
      if(kind==='복소수 상등'){
        const ans=p.p+p.q,ch=numChoices(ans);
        return{q:`${tex(`a+bi=${z}`)}일 때, 두 실수 ${tex('a')}, ${tex('b')}에 대하여 ${tex('a+b')}의 값은? (단, ${tex('i=\\sqrt{-1}')})`,
          choices:ch.list,ans:ch.ans,answerTex:nf(ans),
          sol:[`복소수가 같으려면 <b>실수 부분끼리, 허수 부분끼리</b> 같아야 합니다.`,
            `실수 부분 : ${tex('a='+nf(p.p))} / 허수 부분 : ${tex('b='+nf(p.q))}`,
            `따라서 ${tex(`a+b=${par(p.p)}+${par(p.q)}=${nf(ans)}`)}`]};
      }
      /* ── 켤레복소수 ── */
      const a=p.p,b=-p.q,onlyA=kind==='켤레복소수 a만';
      const ans=onlyA?a:a+b,ch=numChoices(ans);
      const q=onlyA
        ?`복소수 ${tex(z)}의 켤레복소수가 ${tex('a'+(b>=0?'+':'-')+nf(Math.abs(b))+'i')}일 때, 실수 ${tex('a')}의 값은? (단, ${tex('i=\\sqrt{-1}')})`
        :`복소수 ${tex(z)}의 켤레복소수가 ${tex('a+bi')}일 때, 두 실수 ${tex('a')}, ${tex('b')}에 대하여 ${tex('a+b')}의 값은? (단, ${tex('i=\\sqrt{-1}')})`;
      const sol=[`${tex('i')} 앞의 부호만 뒤집습니다 : ${tex(z)}의 켤레복소수는 ${tex(conj)}`,
        onlyA?`${tex('a')} 자리는 실수 부분이므로 ${tex('a='+nf(a))}`:`${tex('a+bi')}와 나란히 놓으면 ${tex('a='+nf(a))}, ${tex('b='+nf(b))}`,
        onlyA?`따라서 ${tex('a='+nf(ans))}`:`따라서 ${tex(`a+b=${par(a)}+${par(b)}=${nf(ans)}`)}`];
      return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  },

  /* ================================================================
     영역 B. 방정식과 부등식
     ================================================================ */
  { id:'u6', tag:'6번', area:'B', title:'이차방정식의 해 (중근 · 한 근 대입)', src:'2023~2026 매회 6번',
    fields:[{k:'kind',label:'문제 종류',sel:['중근','한 근 대입','두 근의 합 α+β','두 근의 곱 αβ','두 근으로 방정식 세우기']},
      {k:'k',label:'중근용 k (c=k²)',min:1,max:5},{k:'sg',label:'x항 부호',sel:['+','−']},{k:'r',label:'대입용 근 r',min:1,max:3},{k:'a',label:'대입용 a',min:-4,max:4},
      {k:'r1',label:'[근과 계수] 근 1',min:-5,max:5},{k:'r2',label:'[근과 계수] 근 2',min:-5,max:5}],
    def:{kind:'중근',k:2,sg:'+',r:1,a:3,r1:-1,r2:5},
    rand(){let a=rnd(-3,4);if(a===0)a=2;let r1=nz(-5,4),r2=nz(-4,5);if(r1===r2)r2=r1+1;
      return{kind:pick(['중근','중근','한 근 대입','한 근 대입','두 근의 합 α+β','두 근의 곱 αβ','두 근으로 방정식 세우기']),
        k:rnd(1,4),sg:pick(['+','−']),r:rnd(1,3),a,r1,r2};},
    build(p){
      const kind=p.kind||'중근';
      /* ── 근과 계수의 관계 (2021-2회 6번, 2022-1회 6번) ── */
      if(kind==='두 근의 합 α+β'||kind==='두 근의 곱 αβ'||kind==='두 근으로 방정식 세우기'){
        const r1=p.r1,r2=p.r2;
        if(r1===r2)return{err:'두 근이 서로 달라야 합니다.'};
        const B=-(r1+r2),C=r1*r2;                    // x²+Bx+C=0
        const eq=`x^2${term(B,'x',false)}${term(C,'',false)}=0`;
        if(kind==='두 근으로 방정식 세우기'){
          const ans=r1+r2,ch=numChoices(ans);
          return{q:`두 수 ${tex(nf(r1))}, ${tex(nf(r2))}를 근으로 하고 ${tex('x^2')}의 계수가 1인 이차방정식이 ${tex(`x^2-ax${term(C,'',false)}=0`)}일 때, 상수 ${tex('a')}의 값은?`,
            choices:ch.list,ans:ch.ans,answerTex:nf(ans),
            sol:[`두 근이 ${tex(nf(r1))}, ${tex(nf(r2))}이면 ${tex(`(x${tail(-r1)})(x${tail(-r2)})=0`)}`,
              `펼치면 ${tex(eq)}`,
              `${tex(`x^2-ax${term(C,'',false)}=0`)}과 짝을 맞추면 ${tex(`-a=${nf(B)}`)} → ${tex('a='+nf(ans))}`,
              `빠른 길 : ${tex('a')}는 <b>두 근의 합</b>입니다 → ${tex(`${par(r1)}+${par(r2)}=${nf(ans)}`)}`]};
        }
        const sum=kind==='두 근의 합 α+β';
        const ans=sum?r1+r2:C,ch=numChoices(ans);
        return{q:`이차방정식 ${tex(eq)}의 두 근을 ${tex('\\alpha')}, ${tex('\\beta')}라고 할 때, ${tex(sum?'\\alpha+\\beta':'\\alpha\\beta')}의 값은?`,
          choices:ch.list,ans:ch.ans,answerTex:nf(ans),
          sol:[`이차방정식 ${tex('x^2+bx+c=0')}에서 <b>두 근의 합은 ${tex('-b')}</b>, <b>두 근의 곱은 ${tex('c')}</b> 입니다.`,
            sum?`${tex('x')}의 계수가 ${tex(nf(B))}이므로 ${tex(`\\alpha+\\beta=-${par(B)}=${nf(ans)}`)}`
               :`상수항이 ${tex(nf(C))}이므로 ${tex(`\\alpha\\beta=${nf(ans)}`)}`,
            `직접 풀어 확인 : 두 근은 ${tex(nf(r1))}, ${tex(nf(r2))} → ${tex(sum?`${par(r1)}+${par(r2)}=${nf(ans)}`:`${par(r1)}\\times${par(r2)}=${nf(ans)}`)}`]};
      }
      if(kind==='중근'){
        const k=p.k,c=k*k,a=2*k,plus=p.sg==='+';
        const eq=`x^2${plus?'+':'-'}ax+${nf(c)}=0`;const ch=numChoices(a);
        const q=`이차방정식 ${tex(eq)}이 중근을 가질 때, 양수 ${tex('a')}의 값은?`;
        const sol=[`${tex(nf(c))}은 ${tex(`${nf(k)}^2`)}이므로 접힌 모양은 ${tex(`(x${plus?'+':'-'}${nf(k)})^2`)}이어야 합니다.`,
          `${tex(`(x${plus?'+':'-'}${nf(k)})^2=x^2${plus?'+':'-'}${nf(a)}x+${nf(c)}`)} → ${tex('a='+nf(a))}`,
          `판별식으로 확인 : ${tex(`a^2-4\\times ${nf(c)}=0`)} → ${tex(`a^2=${nf(4*c)}`)} → 양수 ${tex('a='+nf(a))}`];
        return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(a)};
      }
      const r=p.r,a=p.a,c=-(r*r+a*r);const eqTex=`x^2+ax${tail(c)}=0`;const ch=numChoices(a);
      const q=`이차방정식 ${tex(eqTex)}의 한 근이 ${tex(nf(r))}일 때, 상수 ${tex('a')}의 값은?`;
      const sol=[`${tex('x')} 자리에 ${tex(nf(r))}을 넣습니다 : ${tex(`${nf(r)}^2+a\\times ${nf(r)}${tail(c)}=0`)}`,
        `${tex(`${nf(r*r)}+${nf(r)}a${tail(c)}=0`)} → ${tex(`${nf(r)}a=${nf(-(r*r+c))}`)} → ${tex('a='+nf(a))}`];
      return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(a)};
    }
  },
  { id:'u7', tag:'7번', area:'B', title:'이차함수의 최댓값 · 최솟값', src:'2023~2026 매회 7번', coord:true,
    fields:[{k:'a',label:'볼록 방향',sel:['아래로 볼록 (a=1)','위로 볼록 (a=-1)']},{k:'p',label:'꼭짓점 x (p)',min:-3,max:4},{k:'q',label:'꼭짓점 y (q)',min:-4,max:4},{k:'lo',label:'범위 시작',min:-4,max:4},{k:'hi',label:'범위 끝',min:-3,max:6},{k:'ask',label:'문제 종류',sel:['최솟값','최댓값']}],
    def:{a:'아래로 볼록 (a=1)',p:1,q:-2,lo:0,hi:3,ask:'최솟값'},
    rand(){const a=pick(['아래로 볼록 (a=1)','아래로 볼록 (a=1)','위로 볼록 (a=-1)']);const p=rnd(-1,3),q=rnd(-3,3);const lo=p-rnd(0,2),hi=p+rnd(1,3);
      const ask=a.includes('-1')?pick(['최댓값','최댓값','최솟값']):pick(['최솟값','최솟값','최댓값']);return{a,p,q,lo,hi:hi===lo?hi+1:hi,ask};},
    build(p){
      if(p.lo>=p.hi)return{err:'범위 시작이 끝보다 작아야 합니다.'};
      const a=String(p.a).includes('-1')?-1:1;const f=x=>a*(x-p.p)**2+p.q;
      const inside=p.p>=p.lo&&p.p<=p.hi;
      const cand=[[p.lo,f(p.lo)],[p.hi,f(p.hi)]];if(inside)cand.push([p.p,p.q]);
      const isMin=p.ask==='최솟값';let best=cand[0];for(const c of cand)if(isMin?c[1]<best[1]:c[1]>best[1])best=c;
      const ans=best[1],ch=numChoices(ans);
      const expr=`y=${a===-1?'-':''}${p.p===0?'x^2':`(${xm(p.p)})^2`}${tail(p.q)}`;
      const q=`${tex(`${nf(p.lo)} \\le x \\le ${nf(p.hi)}`)}일 때, 이차함수 ${tex(expr)}의 <b>${p.ask}</b>은?`;
      const ys=cand.map(c=>c[1]).concat([p.q]);
      const ymax=Math.max(...ys,1)+1,ymin=Math.min(...ys,-1)-1,xmin=Math.min(p.lo,-1)-1,xmax=Math.max(p.hi,1)+1;
      const items=[{t:'fn',f,color:GREY,dash:true,width:2.8},{t:'fn',f,from:p.lo,to:p.hi,width:5},
        {t:'pt',x:p.lo,y:f(p.lo),guide:true,color:NAVY,r:7},{t:'pt',x:p.hi,y:f(p.hi),guide:true,color:NAVY,r:7}];
      /* 기출 그림에는 '꼭짓점' 같은 글자 없이 점과 안내 점선만 그려진다 */
      if(inside)items.push({t:'pt',x:p.p,y:p.q,guide:true,r:8});
      const figure=fig(planeSVG({xmin,xmax,ymin,ymax,s:34,maxW:420},items));
      const sol=[
        `꼭짓점은 ${tex(pr(p.p,p.q))}이고, ${a>0?'a가 양수라 아래로 볼록한 U 모양':'a가 음수라 위로 볼록한 ∩ 모양'}입니다.`,
        inside?`범위 ${tex(`${nf(p.lo)} \\le x \\le ${nf(p.hi)}`)} 안에 꼭짓점 ${tex('x='+nf(p.p))}가 <b>들어 있습니다.</b> 후보는 양 끝점과 꼭짓점입니다.`
              :`범위 안에 꼭짓점이 <b>없습니다.</b> 이럴 때는 굵은 점으로 표시된 시작점과 끝점만 비교하면 됩니다.`,
        ...cand.map(([x,y])=>`${tex('x='+nf(x))} → ${tex(`y=${a===-1?'-':''}(${par(x)}${p.p>0?'-'+nf(p.p):(p.p<0?'+'+nf(-p.p):'')})^2${tail(p.q)}=${nf(y)}`)}`),
        `가장 ${isMin?'작은':'큰'} 값은 ${tex('x='+nf(best[0]))}일 때 ${tex(nf(ans))}이므로 ${p.ask}은 ${tex(nf(ans))}`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  },
  { id:'u8a', tag:'8번', area:'B', title:'삼차방정식의 한 근', src:'2026-1회 9번 · 2025-2회 8번 계열',
    fields:[{k:'form',label:'문제 종류',sel:['x³+ax+c 꼴','x³+x²+ax+c 꼴 (기출형)']},
      {k:'r',label:'주어진 근 r',min:1,max:3},{k:'a',label:'정답 a',min:-6,max:9}],
    def:{form:'x³+ax+c 꼴',r:1,a:4},
    rand(){let a=rnd(-4,8);if(a===0)a=1;return{form:pick(['x³+ax+c 꼴','x³+x²+ax+c 꼴 (기출형)']),r:rnd(1,2),a};},
    build(p){return buildRootDeg(p,'삼차');}
  },
  { id:'u8b', tag:'8번', area:'B', title:'사차방정식의 한 근', src:'2026-2회 8번 · 2024-1회 8번 계열',
    fields:[{k:'r',label:'주어진 근 r',min:1,max:2},{k:'a',label:'정답 a',min:-4,max:9}],
    def:{r:1,a:4},
    rand(){let a=rnd(-3,8);if(a===0)a=1;return{r:pick([1,1,1,2]),a};},
    build(p){return buildRootDeg(p,'사차');}
  },
  { id:'u9', tag:'9번', area:'B', title:'이차부등식의 해', src:'2023~2026 매회 9·10번',
    fields:[{k:'kind',label:'문제 종류',sel:['수직선 그림 고르기','해 고르기 (식으로)','절댓값 부등식 (수직선)','연립부등식 (해의 끝 a)']},
      {k:'r1',label:'작은 근',min:-5,max:4},{k:'r2',label:'큰 근',min:-4,max:5},{k:'sign',label:'부등호',sel:['≤','≥','<','>']}],
    def:{kind:'수직선 그림 고르기',r1:-1,r2:2,sign:'≤'},
    rand(){const r1=rnd(-4,2);return{kind:pick(['수직선 그림 고르기','수직선 그림 고르기','해 고르기 (식으로)','해 고르기 (식으로)','절댓값 부등식 (수직선)','연립부등식 (해의 끝 a)']),
      r1,r2:r1+rnd(1,4),sign:pick(['≤','≥','<','>'])};},
    build(p){
      if(p.r1>=p.r2)return{err:'작은 근이 큰 근보다 작아야 합니다.'};
      const kind=p.kind||'수직선 그림 고르기';

      /* ── 연립부등식 (2021-2회 9번) : 두 일차부등식을 각각 풀어 겹치는 구간 ── */
      if(kind==='연립부등식 (해의 끝 a)'){
        const B=p.r1,A=p.r2,k=rnd(2,4);                       // (k+1)x<kx+A , (k+1)x>kx+B
        const ch=numChoices(A);
        const sys=`\\begin{cases}${nf(k+1)}x<${nf(k)}x${tail(A)}\\\\ ${nf(k+1)}x>${nf(k)}x${tail(B)}\\end{cases}`;
        return{q:`연립부등식 ${tex(sys)}의 해가 ${tex(`${nf(B)}<x<a`)}일 때, 상수 ${tex('a')}의 값은?`,
          choices:ch.list,ans:ch.ans,answerTex:nf(A),
          sol:[`위 식 : ${tex(`${nf(k+1)}x-${nf(k)}x${tail(A)}>0`)} 꼴로 옮기면 ${tex('x<'+nf(A))}`,
            `아래 식 : 같은 방법으로 옮기면 ${tex('x>'+nf(B))}`,
            `두 해가 겹치는 구간은 ${tex(`${nf(B)}<x<${nf(A)}`)}`,
            `${tex(`${nf(B)}<x<a`)}와 짝을 맞추면 ${tex('a='+nf(A))}`]};
      }
      /* ── 절댓값 부등식 (2021-2회 10번) : |x−c| ≤ d → c−d ≤ x ≤ c+d ── */
      if(kind==='절댓값 부등식 (수직선)'){
        const c=Math.round((p.r1+p.r2)/2),d=Math.max(1,Math.round((p.r2-p.r1)/2));
        const lo=c-d,hi=c+d,closed2=p.sign==='≤'||p.sign==='≥',ge=p.sign==='≥'||p.sign==='>';
        const sgTex2=ge?(closed2?'\\ge':'>'):(closed2?'\\le':'<');
        const opts2=[{h:numlineSVG(lo,hi,'in',closed2),ok:!ge},{h:numlineSVG(lo,hi,'out',closed2),ok:ge},
          {h:numlineSVG(lo-1,hi+1,'in',closed2),ok:false},{h:numlineSVG(lo-1,hi+1,'out',closed2),ok:false}];
        const sh2=shuffle(opts2),ans2=sh2.findIndex(o=>o.ok);
        const lt2=closed2?'\\le':'<',gt2=closed2?'\\ge':'>';
        const at=ge?`x ${lt2} ${nf(lo)}\\ \\text{또는}\\ x ${gt2} ${nf(hi)}`:`${nf(lo)} ${lt2} x ${lt2} ${nf(hi)}`;
        return{q:`부등식 ${tex(`|${xm(c)}| ${sgTex2} ${nf(d)}`)}의 해를 수직선 위에 나타낸 것은?`,
          choices:sh2.map(o=>`<span class="cs">${o.h}</span>`),raw:true,layout:'two',ans:ans2,answerTex:at,
          sol:[`절댓값은 <b>${tex(nf(c))}에서 얼마나 떨어져 있는가</b>를 뜻합니다.`,
            ge?`${tex(nf(d))}보다 <b>멀리</b> 있는 곳이므로 바깥쪽 두 갈래입니다.`
               :`${tex(nf(d))}보다 <b>가까운</b> 곳이므로 ${tex(nf(c))}를 가운데 두고 양옆으로 ${tex(nf(d))}칸입니다.`,
            `${tex(`${nf(c)}-${nf(d)}=${nf(lo)}`)}, ${tex(`${nf(c)}+${nf(d)}=${nf(hi)}`)} → ${tex(at)}`,
            closed2?'등호가 있으므로 끝점은 까만 점입니다.':'등호가 없으므로 끝점은 빈 점입니다.']};
      }

      const{r1,r2}=p,closed=p.sign==='≤'||p.sign==='≥',inside=p.sign==='≤'||p.sign==='<';

      /* ── 해를 식으로 고르는 형태 (2022-1회 10번) ── */
      if(kind==='해 고르기 (식으로)'){
        const lt=closed?'\\le':'<',gt=closed?'\\ge':'>';
        const fac0=`(${xm(r1)})(${xm(r2)})`,sg0={'≤':'\\le','≥':'\\ge','<':'<','>':'>'}[p.sign];
        const correct=inside?`${nf(r1)} ${lt} x ${lt} ${nf(r2)}`:`x ${lt} ${nf(r1)}\\ \\text{또는}\\ x ${gt} ${nf(r2)}`;
        const wrongs=[inside?`x ${lt} ${nf(r1)}\\ \\text{또는}\\ x ${gt} ${nf(r2)}`:`${nf(r1)} ${lt} x ${lt} ${nf(r2)}`,
          `x ${lt} ${nf(r1)}`,`x ${gt} ${nf(r2)}`,`${nf(-r2)} ${lt} x ${lt} ${nf(-r1)}`];
        const ch0=pickChoices(correct,wrongs,i=>`x ${gt} ${nf(r1+i)}`);
        return{q:`이차부등식 ${tex(fac0+' '+sg0+' 0')}의 해는?`,
          choices:ch0.list,ans:ch0.ans,layout:'two',answerTex:correct,
          sol:[`괄호를 0으로 만드는 수 : ${tex('x='+nf(r1))}, ${tex('x='+nf(r2))}`,
            `부등호가 ${tex(sg0+' 0')}이므로 ${inside?'두 수 <b>사이</b>':'두 수의 <b>바깥쪽</b>'}가 답입니다.`,
            `따라서 ${tex(correct)}`]};
      }
      const fac=`(${xm(r1)})(${xm(r2)})`,sgTex={'≤':'\\le','≥':'\\ge','<':'<','>':'>'}[p.sign];
      let alt=[-r2,-r1];if(alt[0]===r1&&alt[1]===r2)alt=[r1-1,r2-1];
      const opts=[{h:numlineSVG(r1,r2,'in',closed),ok:inside},{h:numlineSVG(r1,r2,'out',closed),ok:!inside},{h:numlineSVG(alt[0],alt[1],'in',closed),ok:false},{h:numlineSVG(alt[0],alt[1],'out',closed),ok:false}];
      const sh=shuffle(opts);const ans=sh.findIndex(o=>o.ok);
      const q=`이차부등식 ${tex(fac+' '+sgTex+' 0')}의 해를 수직선 위에 나타낸 것은?`;
      const lt=closed?'\\le':'<',gt=closed?'\\ge':'>';
      const answerTex=inside?`${nf(r1)} ${lt} x ${lt} ${nf(r2)}`:`x ${lt} ${nf(r1)}\\ \\text{또는}\\ x ${gt} ${nf(r2)}`;
      const sol=[`괄호를 0으로 만드는 수 : ${tex(xm(r1)+'=0')} → ${tex('x='+nf(r1))}, ${tex(xm(r2)+'=0')} → ${tex('x='+nf(r2))}`,
        `부등호가 ${tex(sgTex+' 0')}이므로 ${inside?'두 수 사이':'두 수의 바깥쪽'}이 답입니다. ${closed?'등호가 있어 끝점을 까만 점으로 찍습니다.':'등호가 없어 끝점은 빈 점입니다.'}`,
        `따라서 ${tex(answerTex)}`];
      return{q,choices:sh.map(o=>`<span class="cs">${o.h}</span>`),raw:true,layout:'two',ans,sol,answerTex};
    }
  },

  /* ================================================================
     영역 C. 도형의 방정식 (좌표평면 ★)
     ================================================================ */
  { id:'u10', tag:'10번', area:'C', title:'두 점 사이의 거리', src:'2023~2026 매회 11번 계열', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['두 점 사이의 거리','원점에서의 거리','실생활 상황 (두 지점)']},
      {k:'x1',label:'A의 x',min:-3,max:4},{k:'y1',label:'A의 y',min:-3,max:4},{k:'tri',label:'가로·세로 차',sel:['3,4','4,3','6,8','8,6','1,1','2,2']}],
    def:{kind:'두 점 사이의 거리',x1:1,y1:1,tri:'3,4'},
    rand(){return{kind:pick(['두 점 사이의 거리','두 점 사이의 거리','원점에서의 거리','실생활 상황 (두 지점)']),
      x1:rnd(-2,3),y1:rnd(-2,3),tri:pick(['3,4','4,3','3,4','4,3','6,8','8,6'])};},
    build(p){
      const kind=p.kind||'두 점 사이의 거리';
      const org=kind==='원점에서의 거리';
      const[dx,dy]=p.tri.split(',').map(Number);
      const bx=org?0:p.x1,by=org?0:p.y1;                       // 원점 유형이면 A를 원점으로
      const x2=bx+dx,y2=by+dy,d2=dx*dx+dy*dy,d=Math.sqrt(d2);
      const ch=GS.isInt(d)?numChoices(d):pickChoices(sqrtTex(d2),[sqrtTex(d2+1),sqrtTex(d2-1),nf(dx+dy)],k=>sqrtTex(d2+k+1));
      const spot=pick(['두 학교','두 정류장','두 가게','도서관과 우체국']);
      const q=org
        ?`좌표평면 위의 원점 ${tex('\\mathrm{O}')}와 점 ${tex(`\\mathrm{B}${pr(x2,y2)}`)} 사이의 거리는?`
        :(kind==='실생활 상황 (두 지점)'
          ?`그림은 어느 ${spot}의 위치를 좌표평면 위에 두 점 ${tex(`\\mathrm{A}${pr(bx,by)}`)}, ${tex(`\\mathrm{B}${pr(x2,y2)}`)}로 나타낸 것이다. 두 점 ${tex('\\mathrm{A}')}, ${tex('\\mathrm{B}')} 사이의 거리는?`
          :`좌표평면 위의 두 점 ${tex(`\\mathrm{A}${pr(bx,by)}`)}, ${tex(`\\mathrm{B}${pr(x2,y2)}`)} 사이의 거리는?`);
      p={...p,x1:bx,y1:by};
      const xmin=Math.min(p.x1,x2,0)-1,xmax=Math.max(p.x1,x2,0)+1,ymin=Math.min(p.y1,y2,0)-1,ymax=Math.max(p.y1,y2,0)+1;
      const items=[{t:'seg',x1:p.x1,y1:p.y1,x2,y2},{t:'seg',x1:p.x1,y1:p.y1,x2,y2:p.y1,color:GREEN,width:3,dash:'8 6'},{t:'seg',x1:x2,y1:p.y1,x2,y2,color:GREEN,width:3,dash:'8 6'},
        {t:'pt',x:p.x1,y:p.y1,label:'A',guide:true,lx:-26,ly:-12},{t:'pt',x:x2,y:y2,label:'B',guide:true},
        {t:'text',x:(p.x1+x2)/2,y:p.y1-0.75,s:nf(dx),size:20,color:GREEN,anchor:'middle'},{t:'text',x:x2+0.35,y:(p.y1+y2)/2,s:nf(dy),size:20,color:GREEN}];
      const figure=fig(planeSVG({xmin,xmax,ymin,ymax,s:34,maxW:420},items));
      const sol=[`가로 차 : ${tex(`${nf(x2)}-${par(p.x1)}=${nf(dx)}`)}, 세로 차 : ${tex(`${nf(y2)}-${par(p.y1)}=${nf(dy)}`)} (초록 점선)`,
        `${tex(`\\overline{\\mathrm{AB}}=\\sqrt{${nf(dx)}^2+${nf(dy)}^2}=\\sqrt{${nf(dx*dx)}+${nf(dy*dy)}}=\\sqrt{${nf(d2)}}=${sqrtTex(d2)}`)}`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:sqrtTex(d2)};
    }
  },
  { id:'u11', tag:'11번', area:'C', title:'선분의 내분점', src:'2023~2026 매회 11번', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['수직선','좌표평면','중점 (수직선)','중점 (좌표평면)']},{k:'m',label:'m',min:1,max:4},{k:'n',label:'n',min:1,max:5},
      {k:'a',label:'[수직선] A의 좌표',min:-3,max:5},{k:'t',label:'[수직선] 한 조각 길이',min:1,max:2},
      {k:'x1',label:'[좌표] A의 x',min:-5,max:3},{k:'y1',label:'[좌표] A의 y',min:-5,max:3},{k:'tx',label:'[좌표] 조각 가로',min:-2,max:2},{k:'ty',label:'[좌표] 조각 세로',min:-2,max:2}],
    def:{kind:'좌표평면',m:1,n:2,a:1,t:1,x1:-2,y1:-1,tx:2,ty:1},
    /* 손으로 조각을 하나씩 짚어 셀 수 있는 난이도로 맞춘다.
       - 조각 수(m+n)가 많으면 한 조각 길이를 1로 두어 눈금을 그대로 세면 답이 나오게 한다
       - 수직선의 A는 0 이상, 좌표평면의 B는 격자 안(±5)에 머물게 한다  (기출 : A(1), B(9)를 3:5 등) */
    rand(){
      let m=rnd(1,4),n=rnd(1,5);if(n===m&&Math.random()<0.5)n=m+1;
      /* 기출의 비는 늘 기약비(3:5, 4:3, 2:1 …)이므로 약분해 둔다 */
      const gcd=(a,b)=>b===0?a:gcd(b,a%b);const g=gcd(m,n);m=m/g;n=n/g;
      const sum=m+n;
      const t=sum>=4?1:pick([1,2]);
      const step=sum>=5?1:pick([1,2]);
      const tx=pick([-step,step]),ty=pick([-step,step]);
      const pickStart=d=>{const span=Math.abs(d)*sum;let lo,hi;
        if(d>0){lo=-5;hi=5-span;}else{lo=-5+span;hi=5;}
        if(lo>hi){lo=hi=Math.round((lo+hi)/2);}
        return rnd(lo,hi);};
      return{kind:pick(['수직선','수직선','좌표평면','좌표평면','중점 (수직선)','중점 (좌표평면)']),
        m,n,a:rnd(0,3),t,x1:pickStart(tx),y1:pickStart(ty),tx,ty};},
    build(p){
      /* 중점은 1:1 내분점과 같다 — m, n 을 1로 고정하고 문장만 '중점'으로 바꾼다 (2022-1회 11번) */
      const mid=(p.kind||'').indexOf('중점')===0;
      if(mid)p={...p,m:1,n:1,kind:p.kind.indexOf('수직선')>=0?'수직선':'좌표평면'};
      const{m,n}=p;
      if(p.kind==='수직선'){
        const b=p.a+p.t*(m+n),P=p.a+p.t*m;const ch=numChoices(P);
        const q=mid
          ?`수직선 위의 두 점 ${tex(`\\mathrm{A}(${nf(p.a)})`)}, ${tex(`\\mathrm{B}(${nf(b)})`)}에 대하여 선분 AB의 중점의 좌표는?`
          :`수직선 위의 두 점 ${tex(`\\mathrm{A}(${nf(p.a)})`)}, ${tex(`\\mathrm{B}(${nf(b)})`)}에 대하여 선분 AB를 ${tex(`${nf(m)}:${nf(n)}`)}으로 내분하는 점 P의 좌표는?`;
        const figure=fig(divSVG(p.a,b,m,n));
        const sol=[`조각 세기 : 선분 길이 ${tex(`${nf(b)}-${par(p.a)}=${nf(b-p.a)}`)}를 ${tex(`${nf(m)}+${nf(n)}=${nf(m+n)}`)}조각으로 나누면 한 조각은 ${tex(nf(p.t))}`,
          `A에서 ${tex(nf(m))}조각 : ${tex(`${nf(p.a)}+${nf(m)}\\times ${nf(p.t)}=${nf(P)}`)}`,
          `공식 확인 : ${tex(`\\dfrac{${nf(m)}\\times ${par(b)}+${nf(n)}\\times ${par(p.a)}}{${nf(m)}+${nf(n)}}=\\dfrac{${nf(m*b+n*p.a)}}{${nf(m+n)}}=${nf(P)}`)}`];
        return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:nf(P)};
      }
      if(p.tx===0&&p.ty===0)return{err:'조각의 가로·세로가 모두 0이면 A와 B가 같은 점이 됩니다.'};
      const x2=p.x1+p.tx*(m+n),y2=p.y1+p.ty*(m+n),sx=p.x1+p.tx*m,sy=p.y1+p.ty*m;
      const ch=coordChoices(sx,sy);
      const q=mid
        ?`좌표평면 위의 두 점 ${tex(`\\mathrm{A}${pr(p.x1,p.y1)}`)}, ${tex(`\\mathrm{B}${pr(x2,y2)}`)}에 대하여 선분 ${tex('\\mathrm{AB}')}의 중점의 좌표는?`
        :`좌표평면 위의 두 점 ${tex(`\\mathrm{A}${pr(p.x1,p.y1)}`)}, ${tex(`\\mathrm{B}${pr(x2,y2)}`)}에 대하여 선분 ${tex('\\mathrm{AB}')}를 ${tex(`${nf(m)}:${nf(n)}`)}으로 내분하는 점의 좌표는?`;
      const lim=Math.max(5,Math.abs(p.x1),Math.abs(x2),Math.abs(p.y1),Math.abs(y2))+1;
      const items=[{t:'seg',x1:p.x1,y1:p.y1,x2,y2},{t:'pt',x:p.x1,y:p.y1,label:'A',guide:true},{t:'pt',x:x2,y:y2,label:'B',guide:true}];
      const figure=fig(planeSVG({xmin:-lim,xmax:lim,ymin:-lim,ymax:lim,s:Math.min(34,Math.floor(340/lim))},items));
      const sol=[`먼저 A에서 B까지 <b>가로로 몇 칸, 세로로 몇 칸</b> 가는지 눈금을 셉니다 : 가로 ${nf(p.tx*(m+n))}칸, 세로 ${nf(p.ty*(m+n))}칸`,
        `이것을 ${tex(`${nf(m)}+${nf(n)}=${nf(m+n)}`)}조각으로 똑같이 나누면 한 조각은 <b>가로 ${nf(p.tx)}칸, 세로 ${nf(p.ty)}칸</b>입니다.`,
        `A에서 ${tex(nf(m))}조각만큼만 갑니다 : ${tex(`(${nf(p.x1)}+${nf(p.tx)}\\times ${nf(m)},\\ ${nf(p.y1)}+${nf(p.ty)}\\times ${nf(m)})=${pr(sx,sy)}`)}`,
        `공식으로 확인 : ${tex('x')}는 ${tex(`\\dfrac{${nf(m)}\\times ${par(x2)}+${nf(n)}\\times ${par(p.x1)}}{${nf(m+n)}}=${nf(sx)}`)} , ${tex('y')}는 ${tex(`\\dfrac{${nf(m)}\\times ${par(y2)}+${nf(n)}\\times ${par(p.y1)}}{${nf(m+n)}}=${nf(sy)}`)}`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:pr(sx,sy),layout:'two'};
    }
  },
  { id:'u12', tag:'12번', area:'C', title:'점과 직선 사이의 거리', src:'2025~2026 12번', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['원점과 직선','점과 직선']},
      {k:'ab',label:'x, y 계수',sel:['3,4','4,3']},{k:'d',label:'정답(거리)',min:1,max:4},{k:'sg',label:'상수항 부호',sel:['−','+']},
      {k:'px',label:'[점과 직선] 점의 x',min:-4,max:4},{k:'py',label:'[점과 직선] 점의 y',min:-4,max:4}],
    def:{kind:'원점과 직선',ab:'4,3',d:3,sg:'−',px:1,py:1},
    rand(){return{kind:pick(['원점과 직선','원점과 직선','점과 직선']),ab:pick(['3,4','4,3']),d:rnd(1,4),sg:pick(['−','−','+']),px:nz(-3,3),py:nz(-3,3)};},
    build(p){
      const kind=p.kind||'원점과 직선';
      /* ── 원점이 아닌 점에서의 거리 : 상수항을 거꾸로 맞춰 답이 정수가 되게 한다 ── */
      if(kind==='점과 직선'){
        const[a,b]=p.ab.split(',').map(Number);
        const c=5*p.d-(a*p.px+b*p.py);
        const line=`${nf(a)}x+${nf(b)}y${tail(c)}=0`,ch=numChoices(p.d);
        const val=a*p.px+b*p.py+c;
        const Fx=p.px-a*val/25,Fy=p.py-b*val/25;
        const lim=Math.max(5,Math.abs(p.px)+2,Math.abs(p.py)+2,Math.ceil(Math.abs(Fx))+1,Math.ceil(Math.abs(Fy))+1);
        const items=[{t:'fn',f:x=>(-a*x-c)/b},{t:'seg',x1:p.px,y1:p.py,x2:Fx,y2:Fy,color:RED,dash:'8 6',width:3.4},
          {t:'pt',x:p.px,y:p.py,label:'P',guide:true},{t:'pt',x:Fx,y:Fy,r:6}];
        return{q:`점 ${tex(`\\mathrm{P}${pr(p.px,p.py)}`)}와 직선 ${tex(line)} 사이의 거리는?`,
          figure:fig(planeSVG({xmin:-lim,xmax:lim,ymin:-lim,ymax:lim,s:Math.min(32,Math.floor(340/lim))},items)),
          choices:ch.list,ans:ch.ans,answerTex:nf(p.d),
          sol:[`공식 : 점 ${tex('(x_1,y_1)')}과 직선 ${tex('ax+by+c=0')} 사이의 거리는 ${tex('\\dfrac{|ax_1+by_1+c|}{\\sqrt{a^2+b^2}}')}`,
            `위 : ${tex(`|${nf(a)}\\times${par(p.px)}+${nf(b)}\\times${par(p.py)}${tail(c)}|=|${nf(val)}|=${nf(Math.abs(val))}`)}`,
            `아래 : ${tex(`\\sqrt{${nf(a)}^2+${nf(b)}^2}=\\sqrt{${nf(a*a+b*b)}}=5`)}`,
            `따라서 ${tex(`\\dfrac{${nf(Math.abs(val))}}{5}=${nf(p.d)}`)} (그림의 빨간 점선 길이)`]};
      }
      const[a,b]=p.ab.split(',').map(Number),c=(p.sg==='−'?-1:1)*5*p.d;
      const line=`${nf(a)}x+${nf(b)}y${tail(c)}=0`;const ch=numChoices(p.d);
      const q=`원점과 직선 ${tex(line)} 사이의 거리는?`;
      const Fx=-a*c/25,Fy=-b*c/25,xi=-c/a,yi=-c/b;
      const xmin=Math.floor(Math.min(0,xi,Fx))-1,xmax=Math.ceil(Math.max(0,xi,Fx))+1,ymin=Math.floor(Math.min(0,yi,Fy))-1,ymax=Math.ceil(Math.max(0,yi,Fy))+1;
      const len=Math.sqrt(Fx*Fx+Fy*Fy);const u=[-Fx/len,-Fy/len],v=[b/5,-a/5];
      const items=[{t:'fn',f:x=>(-a*x-c)/b},{t:'seg',x1:0,y1:0,x2:Fx,y2:Fy,color:RED,dash:'8 6',width:3.4},{t:'rangle',x:Fx,y:Fy,u,v},{t:'pt',x:Fx,y:Fy,r:6},
        {t:'text',x:xi+0.3,y:yi*0.5+0.3,s:line.replace('=0','=0'),size:18}];
      const figure=fig(planeSVG({xmin,xmax,ymin,ymax,s:34,maxW:420},items));
      const sol=[`공식에 넣습니다 : ${tex(`\\dfrac{|${nf(c)}|}{\\sqrt{${nf(a)}^2+${nf(b)}^2}}`)}`,
        `${tex(`=\\dfrac{${nf(Math.abs(c))}}{\\sqrt{${nf(a*a)}+${nf(b*b)}}}=\\dfrac{${nf(Math.abs(c))}}{5}=${nf(p.d)}`)} (그림의 빨간 점선 길이)`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:nf(p.d)};
    }
  },
  { id:'u13', tag:'13번', area:'C', title:'원의 방정식', src:'2023~2026 매회 13번', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['반지름 주어짐','x축에 접함','y축에 접함','원점을 지남','원과 직선의 접점','지름의 양 끝점']},
      {k:'a',label:'중심 x',min:-4,max:4},{k:'b',label:'중심 y',min:-4,max:4},{k:'r',label:'반지름 r',min:1,max:4},{k:'dir',label:'[접점] 직선 종류',sel:['x=a','y=a']},
      {k:'ex',label:'[지름] 반가로',min:1,max:4},{k:'ey',label:'[지름] 반세로',min:0,max:4}],
    def:{kind:'반지름 주어짐',a:1,b:2,r:3,dir:'x=a',ex:2,ey:2},
    rand(){const kind=pick(['반지름 주어짐','반지름 주어짐','x축에 접함','y축에 접함','원점을 지남','원과 직선의 접점','지름의 양 끝점']);
      let a=nz(-3,3),b=nz(-3,3);if(kind==='원점을 지남'){const t=pick([[3,4],[4,3],[1,1],[2,1],[1,2]]);a=t[0]*pick([1,-1]);b=t[1]*pick([1,-1]);}
      if(kind==='지름의 양 끝점'){a=rnd(-2,2);b=rnd(-2,2);}
      return{kind,a,b,r:rnd(1,4),dir:pick(['x=a','x=a','y=a']),ex:rnd(1,3),ey:rnd(0,3)};},
    build(p){
      /* ── 지름의 양 끝 점이 주어진 원 (2021-2회 13번) : 중심 = 두 점의 중점, r² = (지름/2)² ── */
      if(p.kind==='지름의 양 끝점'){
        const ex=p.ex||2,ey=(p.ey===undefined?2:p.ey);
        if(ex===0&&ey===0)return{err:'반가로·반세로가 모두 0이면 두 점이 같아집니다.'};
        const Ax=p.a-ex,Ay=p.b-ey,Bx=p.a+ex,By=p.b+ey,R2=ex*ex+ey*ey,R=Math.sqrt(R2);
        const eqOf2=(a,b,k)=>`(${xm(a)})^2+(${ym(b)})^2=${nf(k)}`;
        const eq2=eqOf2(p.a,p.b,R2);
        const ch2=pickChoices(eq2,[eqOf2(-p.a,-p.b,R2),eqOf2(-p.a,p.b,R2),eqOf2(p.a,-p.b,R2),eqOf2(p.a,p.b,4*R2),eqOf2(Ax,Ay,R2)],k=>eqOf2(p.a,p.b,R2+k));
        const lim2=Math.ceil(Math.max(Math.abs(Ax),Math.abs(Bx),Math.abs(Ay),Math.abs(By)))+1;
        const items2=[{t:'circle',cx:p.a,cy:p.b,r:R},{t:'seg',x1:Ax,y1:Ay,x2:Bx,y2:By,color:GREEN,width:3.4},
          {t:'pt',x:Ax,y:Ay,label:'A',guide:true},{t:'pt',x:Bx,y:By,label:'B',guide:true},{t:'pt',x:p.a,y:p.b,r:6,color:'#000'}];
        return{q:`두 점 ${tex(`\\mathrm{A}${pr(Ax,Ay)}`)}, ${tex(`\\mathrm{B}${pr(Bx,By)}`)}을 지름의 양 끝 점으로 하는 원의 방정식은?`,
          figure:fig(planeSVG({xmin:-lim2,xmax:lim2,ymin:-lim2,ymax:lim2,s:Math.min(32,Math.floor(340/lim2)),maxW:420},items2)),
          choices:ch2.list,ans:ch2.ans,layout:'two',answerTex:eq2,
          sol:[`지름의 양 끝 점을 알면 <b>중심은 두 점의 중점</b>입니다.`,
            `중심 : ${tex(`\\left(\\dfrac{${nf(Ax)}+${par(Bx)}}{2},\\ \\dfrac{${nf(Ay)}+${par(By)}}{2}\\right)=${pr(p.a,p.b)}`)}`,
            `반지름은 중심에서 A까지의 거리 : ${tex(`\\sqrt{${nf(ex)}^2+${nf(ey)}^2}=\\sqrt{${nf(R2)}}`)} → ${tex(`r^2=${nf(R2)}`)}`,
            `따라서 ${tex(eq2)}`]};
      }
      if(p.kind==='원과 직선의 접점'){
        const r=p.r,r2=r*r,vert=p.dir==='x=a';const ch=numChoices(r);
        const q=`직선 ${tex(p.dir)}와 원 ${tex(`x^2+y^2=${nf(r2)}`)}가 한 점에서 만날 때, 양수 ${tex('a')}의 값은?`;
        const R=r+2,items=[{t:'circle',cx:0,cy:0,r},{t:'pt',x:0,y:0,r:5,color:'#000'},{t:'text',x:-R+0.2,y:-R+0.8,s:`x²+y²=${nf(r2)}`,size:19}];
        if(vert)items.push({t:'vline',x:r,label:'x=a',dash:'',color:NAVY},{t:'seg',x1:0,y1:0,x2:r,y2:0,color:GREEN,width:4,dash:'9 6'});
        else items.push({t:'hline',y:r,label:'y=a',dash:'',color:NAVY},{t:'seg',x1:0,y1:0,x2:0,y2:r,color:GREEN,width:4,dash:'9 6'});
        const figure=fig(planeSVG({xmin:-R,xmax:R,ymin:-R,ymax:R,s:32},items));
        const sol=[`원의 반지름 : ${tex(`x^2+y^2=${nf(r2)}=${nf(r)}^2`)} → ${tex('r='+nf(r))}`,
          `${vert?'세로':'가로'}선 ${tex(p.dir)}가 원에 딱 닿으려면(접하려면) 원점에서 ${tex('a')}만큼 떨어진 거리가 반지름과 같아야 합니다. (초록 점선)`,
          `따라서 ${tex('a='+nf(r))}`];
        return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:nf(r)};
      }
      let R2,why,Rtx,Rtt;
      if(p.kind==='반지름 주어짐'){R2=p.r*p.r;why=`반지름을 문제에서 바로 주었습니다. 길이는 ${nf(p.r)}입니다.`;}
      else if(p.kind==='x축에 접함'){if(p.b===0)return{err:'x축에 접하려면 중심 y가 0이 아니어야 합니다.'};R2=p.b*p.b;why=`x축(가로선)에 딱 붙어 있으므로, 중심에서 x축까지의 세로 거리가 곧 반지름입니다. 중심의 y가 ${par(p.b)}이니 길이는 ${nf(Math.abs(p.b))}입니다.`;}
      else if(p.kind==='y축에 접함'){if(p.a===0)return{err:'y축에 접하려면 중심 x가 0이 아니어야 합니다.'};R2=p.a*p.a;why=`y축(세로선)에 딱 붙어 있으므로, 중심에서 y축까지의 가로 거리가 곧 반지름입니다. 중심의 x가 ${par(p.a)}이니 길이는 ${nf(Math.abs(p.a))}입니다.`;}
      else{if(p.a===0&&p.b===0)return{err:'중심이 원점이면 원점을 지나는 원이 될 수 없습니다.'};R2=p.a*p.a+p.b*p.b;why=`원이 원점을 지나므로, 중심에서 원점까지의 거리가 반지름입니다. 가로 ${nf(Math.abs(p.a))}, 세로 ${nf(Math.abs(p.b))}인 직각삼각형의 빗변이므로 길이는 ${tex(`\\sqrt{${nf(p.a*p.a)}+${nf(p.b*p.b)}}=${sqrtTex(R2)}`)}입니다.`;}
      const R=Math.sqrt(R2);Rtx=sqrtTex(R2);Rtt=sqrtTxt(R2);
      const eqOf=(a,b,k)=>`(${xm(a)})^2+(${ym(b)})^2=${nf(k)}`;
      const eq=p.a===0&&p.b===0?`x^2+y^2=${nf(R2)}`:eqOf(p.a,p.b,R2);
      const cands=[eqOf(-p.a,-p.b,R2),eqOf(p.b,p.a,R2),eqOf(p.a,p.b,(Math.round(R)+1)**2),eqOf(p.a,p.b,R2===R?R2+1:Math.round(R)),eqOf(-p.a,p.b,R2)];
      const ch=pickChoices(eq,cands,k=>eqOf(p.a,p.b,R2+k));
      const cond={'반지름 주어짐':`반지름의 길이가 ${tex(nf(p.r))}인`,'x축에 접함':'x축에 접하는','y축에 접함':'y축에 접하는','원점을 지남':'원점을 지나는'}[p.kind];
      const q=`중심의 좌표가 ${tex(pr(p.a,p.b))}이고 ${cond} 원의 방정식은?`;
      const lim=Math.ceil(Math.max(Math.abs(p.a)+R,Math.abs(p.b)+R))+1;
      /* 기출 그림에는 '중심' 같은 글자 없이 점과 안내 점선만 그려진다 */
      const items=[{t:'circle',cx:p.a,cy:p.b,r:R},{t:'pt',x:p.a,y:p.b,guide:true,r:7}];
      if(p.kind==='x축에 접함')items.push({t:'seg',x1:p.a,y1:p.b,x2:p.a,y2:0,color:GREEN,width:4,dash:'9 6'},{t:'pt',x:p.a,y:0,color:GREEN,r:6});
      else if(p.kind==='y축에 접함')items.push({t:'seg',x1:p.a,y1:p.b,x2:0,y2:p.b,color:GREEN,width:4,dash:'9 6'},{t:'pt',x:0,y:p.b,color:GREEN,r:6});
      else if(p.kind==='원점을 지남')items.push({t:'seg',x1:p.a,y1:p.b,x2:0,y2:0,color:GREEN,width:4,dash:'9 6'},{t:'seg',x1:p.a,y1:p.b,x2:p.a,y2:0,color:GREY,width:2.4,dash:'6 5'},{t:'seg',x1:0,y1:0,x2:p.a,y2:0,color:GREY,width:2.4,dash:'6 5'});
      else items.push({t:'seg',x1:p.a,y1:p.b,x2:p.a+R,y2:p.b,color:GREEN,width:4,dash:'9 6'},{t:'text',x:p.a+R/2,y:p.b+0.35,s:'r='+nf(R),size:19,color:GREEN,anchor:'middle'});
      const figure=fig(planeSVG({xmin:-lim,xmax:lim,ymin:-lim,ymax:lim,s:Math.min(34,Math.floor(340/lim)),maxW:420},items));
      const sol=[`원의 기본 모양은 ${tex('(x-a)^2+(y-b)^2=r^2')}입니다. 중심 ${tex(pr(p.a,p.b))}를 자리에 넣습니다. (괄호 안 부호는 반대!)`,
        why,
        `오른쪽에는 반지름을 <b>두 번 곱한 값</b>을 씁니다. ${tex(`${Rtx}\\times${Rtx}=${nf(R2)}`)}`,
        `따라서 ${tex(eq)}`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:eq,layout:'two'};
    }
  },
  { id:'u14', tag:'14번', area:'C', title:'점의 대칭이동 · 평행이동', src:'2023~2026 매회 14번', coord:true,
    fields:[{k:'op',label:'문제 종류',sel:['x축 대칭','y축 대칭','원점 대칭','직선 y=x 대칭','평행이동']},{k:'x',label:'점의 x',min:-5,max:5},{k:'y',label:'점의 y',min:-5,max:5},{k:'dx',label:'[평행이동] x축 방향',min:-4,max:4},{k:'dy',label:'[평행이동] y축 방향',min:-4,max:4}],
    def:{op:'원점 대칭',x:2,y:3,dx:1,dy:2},
    rand(){let dx=rnd(-3,3),dy=rnd(-3,3);if(dx===0)dx=1;if(dy===0)dy=-2;return{op:pick(['x축 대칭','y축 대칭','원점 대칭','직선 y=x 대칭','평행이동','평행이동']),x:nz(-4,4),y:nz(-4,4),dx,dy};},
    build(p){
      let X,Y,how;
      if(p.op==='x축 대칭'){X=p.x;Y=-p.y;how='x축을 접었으니 x는 그대로, y만 부호가 바뀝니다.';}
      else if(p.op==='y축 대칭'){X=-p.x;Y=p.y;how='y축을 접었으니 y는 그대로, x만 부호가 바뀝니다.';}
      else if(p.op==='원점 대칭'){X=-p.x;Y=-p.y;how='원점 대칭은 두 번 접는 것이라 x, y 둘 다 부호가 바뀝니다.';}
      else if(p.op==='직선 y=x 대칭'){X=p.y;Y=p.x;how='직선 y=x 대칭은 x와 y의 자리를 서로 바꿉니다.';}
      else{X=p.x+p.dx;Y=p.y+p.dy;how=`평행이동은 밀기입니다. x에는 x축 방향 값 ${par(p.dx)}를, y에는 y축 방향 값 ${par(p.dy)}를 그대로 더합니다. ${tex(`(${nf(p.x)}+${par(p.dx)},\\ ${nf(p.y)}+${par(p.dy)})`)}`;}
      const q=p.op==='평행이동'
        ?`좌표평면 위의 점 ${tex(pr(p.x,p.y))}을 ${tex('x')}축의 방향으로 ${tex(nf(p.dx))}만큼, ${tex('y')}축의 방향으로 ${tex(nf(p.dy))}만큼 평행이동한 점의 좌표는?`
        :`좌표평면 위의 점 ${tex(pr(p.x,p.y))}을 <b>${p.op.replace(' 대칭','')}</b>에 대하여 대칭이동한 점의 좌표는?`;
      const ch=coordChoices(X,Y);
      const lim=Math.max(6,Math.abs(X)+1,Math.abs(Y)+1);
      const items=[{t:'pt',x:p.x,y:p.y,label:'P',guide:true,r:8}];
      if(p.op==='직선 y=x 대칭')items.push({t:'fn',f:x=>x,color:GREY,width:3,dash:'9 7'},{t:'text',x:lim-1.6,y:lim-0.6,s:'y=x',size:19,color:'#777',italic:true});
      const figure=fig(planeSVG({xmin:-lim,xmax:lim,ymin:-lim,ymax:lim,s:Math.min(34,Math.floor(340/lim))},items));
      const sol=[`점 P의 자리를 먼저 눈으로 찾습니다. x축에서 ${par(p.x)}, y축에서 ${par(p.y)}인 곳입니다.`,how,`따라서 옮겨진 점은 ${tex(pr(X,Y))}입니다.`];
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:pr(X,Y),layout:'one'};
    }
  },

  /* ================================================================
     영역 D. 집합 · 명제 · 함수
     ================================================================ */
  { id:'u15', tag:'15번', area:'D', title:'집합', src:'2023~2026 매회 15번',
    fields:[{k:'kind',label:'문제 종류',sel:['n(A∪B) 개수','n(A∩B) 개수','n(A−B) 개수','n(A) 개수','n(A∪B)+n(A∩B)','A∪B 원소','A∩B 원소','A−B 원소 (차집합)']},
      {k:'nA',label:'n(A)',min:2,max:5},{k:'nB',label:'n(B)',min:2,max:5},{k:'k',label:'겹치는 개수',min:1,max:4},
      {k:'num',label:'원소 종류',sel:['글자 (a, b, c)','숫자 (1, 2, 3)']}],
    def:{kind:'n(A∪B) 개수',nA:2,nB:3,k:1,num:'글자 (a, b, c)'},
    rand(){const nA=rnd(2,4),nB=rnd(2,4);
      /* 차집합이 빈 집합이 되지 않도록 겹치는 개수를 n(A) 보다 작게 잡는다 */
      const k=rnd(1,Math.max(1,Math.min(nA-1,nB)));
      return{kind:pick(['n(A∪B) 개수','n(A∪B) 개수','n(A∩B) 개수','n(A−B) 개수','n(A) 개수','n(A∪B)+n(A∩B)','A∪B 원소','A∩B 원소','A−B 원소 (차집합)']),
        nA,nB,k,num:pick(['글자 (a, b, c)','숫자 (1, 2, 3)'])};},
    build(p){
      if(p.k>Math.min(p.nA,p.nB))return{err:'겹치는 개수는 두 집합 원소 개수보다 클 수 없습니다.'};
      // 예전 저장본 호환 : ask('합집합'/'교집합') → kind
      const kind=p.kind||(p.ask==='교집합'?'n(A∩B) 개수':'n(A∪B) 개수');
      const L=(p.num&&p.num.indexOf('숫자')===0)?'12345678'.split(''):'abcdefg'.split('');
      const A=L.slice(0,p.nA),B=[...A.slice(p.nA-p.k),...L.slice(p.nA,p.nA+p.nB-p.k)];
      const st=arr=>`\\{${arr.join(',\\ ')}\\}`;
      const uni=[...new Set([...A,...B])],inter=A.filter(x=>B.includes(x)),diff=A.filter(x=>!B.includes(x));
      const head=`두 집합 ${tex('A='+st(A))}, ${tex('B='+st(B))}에 대하여 `;

      /* ── 결과 집합 자체를 고르는 형태 (2022-1회 15번) ── */
      if(kind.indexOf('원소')>=0){
        const isU=kind[0]==='A'&&kind.indexOf('∪')>=0;
        const isI=kind.indexOf('∩')>=0, isD=kind.indexOf('−')>=0;
        const target=isU?uni:isI?inter:diff, symbol=isU?'A\\cup B':isI?'A\\cap B':'A-B';
        if(target.length===0)return{err:'결과가 공집합이 됩니다. 겹치는 개수를 줄여 주세요.'};
        const correct=st(target);
        const wrongs=[st(uni),st(inter),st(diff),st(B.filter(x=>!A.includes(x))),st(A),st(B)]
          .filter((s,i,arr)=>s!==correct&&arr.indexOf(s)===i);
        const ch=pickChoices(correct,wrongs,i=>st(L.slice(0,Math.max(1,target.length+((i%2)?1:-1)))));
        return{q:head+`${tex(symbol)}는?`,choices:ch.list,ans:ch.ans,layout:'two',answerTex:correct,
          sol:[isU?`합집합은 두 바구니를 한데 붓고 겹치는 것은 한 번만 씁니다.`
              :isI?`교집합은 <b>양쪽 모두</b>에 들어 있는 것만 고릅니다.`
              :`차집합 ${tex('A-B')}는 <b>A에는 있고 B에는 없는</b> 것만 고릅니다.`,
            `A와 B를 나란히 놓고 하나씩 확인합니다. 겹치는 것은 ${tex(st(inter))}`,
            `따라서 ${tex(symbol+'='+correct)}`]};
      }
      /* ── 원소의 개수만 묻는 형태 (2026-2회 15번 · 2025-1회 14번 계열) ── */
      if(kind==='n(A) 개수'){
        const ans0=A.length,ch0=numChoices(ans0);
        return{q:head+`${tex('n(A)')}의 값은?`,choices:ch0.list,ans:ch0.ans,answerTex:nf(ans0),
          sol:[`${tex('n(A)')}는 집합 A 안에 들어 있는 <b>원소의 개수</b>를 뜻합니다.`,
            `${tex('A='+st(A))}의 원소를 하나씩 세어 봅니다.`,
            `따라서 ${tex('n(A)='+nf(ans0))}`]};
      }
      if(kind==='n(A−B) 개수'){
        if(diff.length===0)return{err:'A의 원소가 모두 B에도 있어 차집합이 공집합이 됩니다. 겹치는 개수를 줄여 주세요.'};
        const ans0=diff.length,ch0=numChoices(ans0);
        return{q:head+`${tex('n(A-B)')}의 값은?`,choices:ch0.list,ans:ch0.ans,answerTex:nf(ans0),
          sol:[`${tex('A-B')}는 <b>A에는 있고 B에는 없는</b> 것만 모은 집합입니다.`,
            `A의 원소를 하나씩 보면서 B에도 있는 것(${tex(st(inter))})을 지웁니다 → ${tex('A-B='+st(diff))}`,
            `남은 것을 세면 ${tex('n(A-B)='+nf(ans0))} (계산으로는 ${tex(`${nf(p.nA)}-${nf(p.k)}=${nf(ans0)}`)})`]};
      }
      if(kind==='n(A∪B)+n(A∩B)'){
        const ans0=uni.length+inter.length,ch0=numChoices(ans0);
        return{q:head+`${tex('n(A\\cup B)+n(A\\cap B)')}의 값은?`,choices:ch0.list,ans:ch0.ans,answerTex:nf(ans0),
          sol:[`합집합 : ${tex('A\\cup B='+st(uni))} → ${tex('n(A\\cup B)='+nf(uni.length))}`,
            `교집합 : ${tex('A\\cap B='+st(inter))} → ${tex('n(A\\cap B)='+nf(inter.length))}`,
            `두 개수를 더하면 ${tex(`${nf(uni.length)}+${nf(inter.length)}=${nf(ans0)}`)}`,
            `<b>빠른 방법</b> : 겹친 것을 한 번 빼고 한 번 더했으므로 ${tex('n(A\\cup B)+n(A\\cap B)=n(A)+n(B)')} 입니다. ${tex(`${nf(p.nA)}+${nf(p.nB)}=${nf(ans0)}`)}`]};
      }
      const isU=kind.indexOf('∪')>=0,ans=isU?uni.length:inter.length;const ch=numChoices(ans);
      const sol=isU?[`두 바구니를 부으면 ${tex('A\\cup B='+st(uni))} (겹치는 ${tex(st(inter))}는 한 번만)`,`개수를 세면 ${tex('n(A\\cup B)='+nf(ans))}`,`공식 확인 : ${tex(`${nf(p.nA)}+${nf(p.nB)}-${nf(p.k)}=${nf(ans)}`)}`]
        :[`둘 다에 들어 있는 것만 고르면 ${tex('A\\cap B='+st(inter))}`,`개수를 세면 ${tex('n(A\\cap B)='+nf(ans))}`];
      return{q:head+`${tex(isU?'n(A\\cup B)':'n(A\\cap B)')}의 값은?`,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  },
  { id:'u16', tag:'16번', area:'D', title:'명제', src:'2023~2026 매회 16번',
    fields:[{k:'kind',label:'문제 종류',sel:['명제 고르기','역','대우','부정 (아닌 것)','필요·충분조건']},{k:'seed',label:'문제 번호 (바꾸면 다른 문제)',min:1,max:999}],
    def:{kind:'명제 고르기',seed:7},
    rand(){return{kind:pick(['명제 고르기','명제 고르기','역','역','대우','부정 (아닌 것)','필요·충분조건']),seed:rnd(1,999)};},
    build(p){
      const rng=mulberry(p.seed*7919+11);const T=['ㄱ','ㄴ','ㄷ','ㄹ'];
      if(p.kind==='명제 고르기'){
        const P=[tex('2+3=5'),'삼각형의 세 내각의 크기의 합은 '+tex('360^\\circ')+'이다.','4는 짝수이다.','10은 홀수이다.','서울은 대한민국의 수도이다.',tex('1+1=3'),'정사각형의 네 변의 길이는 모두 같다.','12는 5의 배수이다.',tex('7')+'은 소수이다.','한 시간은 60분이다.'];
        const N=['10은 큰 수이다.','잔치국수는 맛있다.','수학은 재미있다.','오늘은 날씨가 좋다.','그 사람은 키가 크다.','이 꽃은 예쁘다.','3은 작은 수이다.','여름은 덥다.'];
        const ps=shuffleWith(rng,P).slice(0,2),ns=shuffleWith(rng,N).slice(0,2);
        const items=shuffleWith(rng,[{s:ps[0],ok:true},{s:ps[1],ok:true},{s:ns[0],ok:false},{s:ns[1],ok:false}]);
        const okIdx=items.map((it,i)=>it.ok?i:-1).filter(i=>i>=0);const correct=okIdx.map(i=>T[i]).join(', ');
        const pairs=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)pairs.push(`${T[i]}, ${T[j]}`);
        const others=shuffleWith(rng,pairs.filter(x=>x!==correct)).slice(0,3);const chs=shuffleWith(rng,[correct,...others]).sort();
        const ans=chs.indexOf(correct);
        const q=`명제인 것을 &lt;보기&gt;에서 고른 것은?`;
        const figure=`<div class="fig" style="text-align:left"><div class="boxk"><div style="text-align:center;font-size:.85em;margin-bottom:4px">&lt;보 기&gt;</div>${items.map((it,i)=>`<div>${T[i]}. ${it.s}</div>`).join('')}</div></div>`;
        const sol=[`참·거짓을 정할 수 있는 문장만 고릅니다.`,...items.map((it,i)=>`${T[i]} : ${it.ok?'참인지 거짓인지 정할 수 있음 → 명제':'사람마다 다름 → 명제 아님'}`),`따라서 ${correct}`];
        return{q,figure,choices:chs,raw:true,layout:'one',ans,sol,answerRaw:correct};
      }
      if(p.kind==='대우'||p.kind==='역'||p.kind==='부정 (아닌 것)'){
        const mode=p.kind==='역'?'역':(p.kind==='대우'?'대우':'부정');
        const C=(c,e)=>({c,e}),M=(a,b)=>C(tex(a)+'이면',tex(b)+'이다');
        const pool=[{p:M('x=2','x=2'),q:M('x^2=4','x^2=4'),np:M('x\\ne 2','x\\ne 2'),nq:M('x^2\\ne 4','x^2\\ne 4')},
          {p:C('a가 4의 배수이면','a는 4의 배수이다'),q:C('a가 2의 배수이면','a는 2의 배수이다'),np:C('a가 4의 배수가 아니면','a는 4의 배수가 아니다'),nq:C('a가 2의 배수가 아니면','a는 2의 배수가 아니다')},
          {p:C('두 삼각형이 합동이면','두 삼각형은 합동이다'),q:C('두 삼각형의 넓이가 같으면','두 삼각형의 넓이는 같다'),np:C('두 삼각형이 합동이 아니면','두 삼각형은 합동이 아니다'),nq:C('두 삼각형의 넓이가 같지 않으면','두 삼각형의 넓이는 같지 않다')},
          {p:M('x>3','x>3'),q:M('x>1','x>1'),np:M('x\\le 3','x\\le 3'),nq:M('x\\le 1','x\\le 1')},
          {p:C('비가 오면','비가 온다'),q:C('땅이 젖으면','땅이 젖는다'),np:C('비가 오지 않으면','비가 오지 않는다'),nq:C('땅이 젖지 않으면','땅이 젖지 않는다')}];
        const e=pool[Math.floor(rng()*pool.length)];const mk=(A,B)=>`${A.c} ${B.e}.`;
        // 역 : 앞뒤만 바꿈 / 대우 : 앞뒤 바꾸고 둘 다 부정 / 부정(이) : 앞뒤 그대로 두고 둘 다 부정
        const target=mode==='역'?mk(e.q,e.p):mode==='대우'?mk(e.nq,e.np):mk(e.np,e.nq);
        const opts=[{s:mk(e.q,e.p),ok:mode==='역'},{s:mk(e.np,e.nq),ok:mode==='부정'},
          {s:mk(e.nq,e.np),ok:mode==='대우'},{s:mk(e.p,e.nq),ok:false}];
        const sh=shuffleWith(rng,opts),ans=sh.findIndex(o=>o.ok);
        const q=`명제 '${mk(e.p,e.q)}'의 ${mode==='부정'?'부정':mode}은?`;
        const sol=mode==='역'
          ?[`역 = <b>앞뒤만 바꿉니다.</b> 부정하지 않습니다.`,`앞의 '${e.p.e}'와 뒤의 '${e.q.e}'의 자리를 맞바꿉니다.`,`따라서 '${target}'`]
          :mode==='대우'
          ?[`대우 = 앞뒤를 바꾸고 둘 다 부정합니다.`,`뒤의 '${e.q.e}'를 부정해 앞에 놓고, 앞의 '${e.p.e}'를 부정해 뒤에 놓습니다.`,`따라서 '${target}'`]
          :[`부정(이) = <b>앞뒤는 그대로</b> 두고 둘 다 부정합니다.`,`'${e.p.e}'를 부정, '${e.q.e}'를 부정합니다.`,`따라서 '${target}'`];
        return{q,choices:sh.map(o=>o.s),raw:true,layout:'two',ans,sol,answerRaw:target};
      }
      const pool=[{p:tex('x=2'),q:tex('x^2=4'),a:0},{p:tex('x^2=4'),q:tex('x=2'),a:1},{p:tex('x=2'),q:tex('2x=4'),a:2},{p:'a는 4의 배수',q:'a는 2의 배수',a:0},{p:'a는 2의 배수',q:'a는 4의 배수',a:1},{p:tex('x>2'),q:tex('x>0'),a:0},{p:tex('x+1=3'),q:tex('x=2'),a:2}];
      const e=pool[Math.floor(rng()*pool.length)];const names=['충분조건','필요조건','필요충분조건','어느 조건도 아니다'];
      const q=`두 조건 ${tex('p')} : ${e.p}, ${tex('q')} : ${e.q}에 대하여 ${tex('p')}는 ${tex('q')}이기 위한 무슨 조건인가?`;
      const why=[`${tex('p')}가 맞으면 ${tex('q')}도 반드시 맞지만, 거꾸로는 아닙니다(${tex('p \\Rightarrow q')}만 참). 화살표가 나가는 ${tex('p')}는 충분조건.`,
        `${tex('q')}가 맞으면 ${tex('p')}도 맞지만 거꾸로는 아닙니다(${tex('q \\Rightarrow p')}만 참). 화살표를 받는 ${tex('p')}는 필요조건.`,
        `양쪽 모두 성립합니다(${tex('p \\Leftrightarrow q')}). 필요충분조건.`][e.a];
      return{q,choices:names,raw:true,layout:'two',ans:e.a,sol:[why],answerRaw:names[e.a]};
    }
  },
  { id:'u17a', tag:'17번', area:'D', title:'합성함수', src:'2026-2회 17번 · 2025-1회 16번 계열',
    fields:[{k:'kind',label:'문제 종류',sel:['합성함수 (g∘f)','합성함수 (f∘f)']},{k:'x0',label:'출발 원소 (1~4)',min:1,max:4},{k:'seed',label:'화살표 배치 번호',min:1,max:999}],
    def:{kind:'합성함수 (g∘f)',x0:3,seed:5},
    rand(){return{kind:pick(['합성함수 (g∘f)','합성함수 (g∘f)','합성함수 (g∘f)','합성함수 (f∘f)']),x0:rnd(1,4),seed:rnd(1,999)};},
    build(p){
      /* 합성함수 전용 — 역함수는 u17b 가 맡는다 (예전 저장본의 kind 도 여기서 받아 준다) */
      const kind=(p.kind&&p.kind.indexOf('합성')===0)?p.kind:'합성함수 (g∘f)';
      const rng=mulberry(p.seed*104729+3);const X=[1,2,3,4],Y=['a','b','c','d'],Z=[5,6,7,8];
      const fy=shuffleWith(rng,Y),gz=shuffleWith(rng,Z);
      const fp=X.map((x,i)=>[x,fy[i]]),gp=Y.map((y,i)=>[y,gz[i]]);
      const f=x=>fp.find(q=>q[0]===x)[1],g=y=>gp.find(q=>q[0]===y)[1],finv=y=>fp.find(q=>q[1]===y)[0];
      const x0=Math.min(4,Math.max(1,p.x0));

      /* ── 같은 집합 안에서 두 번 타는 f∘f (2021-2회 17번) ── */
      if(kind==='합성함수 (f∘f)'){
        let hp=X.map((x,i)=>[x,shuffleWith(rng,X)[i]]);
        // 자기 자신으로 가는 화살표가 두 개 이상이면 문제가 싱거워지므로 한 번 섞어 준다
        if(hp.filter(([a,b])=>a===b).length>2)hp=X.map((x,i)=>[x,X[(i+1)%4]]);
        const h=x=>hp.find(q=>q[0]===x)[1];
        const ans=h(h(x0)),chs=X.map(nf);
        return{q:`함수 ${tex('f:X\\to X')}가 그림과 같을 때, ${tex(`(f\\circ f)(${nf(x0)})`)}의 값은?`,
          figure:fig(mapSVG([{name:'X',items:X},{name:'X',items:X}],[{name:'f',pairs:hp}])),
          choices:chs,ans:X.indexOf(ans),answerTex:nf(ans),layout:'one',
          sol:[`${tex('(f\\circ f)')}는 화살표를 <b>두 번</b> 타는 것입니다.`,
            `첫 번째 : ${tex(`f(${nf(x0)})=${nf(h(x0))}`)}`,
            `두 번째 : ${tex(`f(${nf(h(x0))})=${nf(ans)}`)}`,
            `따라서 ${tex(`(f\\circ f)(${nf(x0)})=${nf(ans)}`)}`]};
      }
      if(kind==='합성함수 (g∘f)'){
        const ans=g(f(x0));const chs=Z.map(nf);
        const q=`두 함수 ${tex('f:X\\to Y')}, ${tex('g:Y\\to Z')}가 그림과 같을 때, ${tex(`(g\\circ f)(${nf(x0)})`)}의 값은?`;
        const figure=fig(mapSVG([{name:'X',items:X},{name:'Y',items:Y},{name:'Z',items:Z}],[{name:'f',pairs:fp},{name:'g',pairs:gp}]));
        const sol=[`먼저 ${tex('f')} : ${tex(`f(${nf(x0)})=${f(x0)}`)} (${nf(x0)}에서 나간 화살표가 ${f(x0)}에 도착)`,`다음 ${tex('g')} : ${tex(`g(${f(x0)})=${nf(ans)}`)}`,`따라서 ${tex(`(g\\circ f)(${nf(x0)})=g(f(${nf(x0)}))=${nf(ans)}`)}`];
        return{q,figure,choices:chs,ans:Z.indexOf(ans),sol,answerTex:nf(ans),layout:'one'};
      }
      return{err:'합성함수 종류를 골라 주세요.'};
    }
  },
  { id:'u17b', tag:'17번', area:'D', title:'역함수', src:'2026-1회 17번 · 2025-2회 17번 계열',
    fields:[{k:'ycase',label:'도착 집합',sel:['숫자 (2, 4, 6, 8)','글자 (a, b, c, d)']},
      {k:'x0',label:'도착 원소 자리 (1~4)',min:1,max:4},{k:'seed',label:'화살표 배치 번호',min:1,max:999}],
    def:{ycase:'숫자 (2, 4, 6, 8)',x0:3,seed:5},
    rand(){return{ycase:pick(['숫자 (2, 4, 6, 8)','숫자 (2, 4, 6, 8)','글자 (a, b, c, d)']),x0:rnd(1,4),seed:rnd(1,999)};},
    build(p){
      const rng=mulberry(p.seed*104729+3);
      const X=[1,2,3,4];
      const Y=(p.ycase&&p.ycase.indexOf('글자')===0)?['a','b','c','d']:[2,4,6,8];
      const fy=shuffleWith(rng,Y);const fp=X.map((x,i)=>[x,fy[i]]);
      const finv=y=>fp.find(q=>q[1]===y)[0];
      const x0=Math.min(4,Math.max(1,p.x0));
      const y0=Y[x0-1],ans=finv(y0);const chs=X.map(nf);
      const q=`함수 ${tex('f:X\\to Y')}가 그림과 같을 때, ${tex(`f^{-1}(${y0})`)}의 값은? (단, ${tex('f^{-1}')}는 ${tex('f')}의 역함수이다.)`;
      const figure=fig(mapSVG([{name:'X',items:X},{name:'Y',items:Y}],[{name:'f',pairs:fp}]));
      const sol=[`${tex(`f^{-1}(${y0})`)}는 <b>${y0}에 도착한 화살표가 어디에서 출발했는지</b> 묻는 것입니다.`,
        `화살촉의 반대 방향으로 손가락을 따라가 봅니다.`,
        `${y0}로 가는 화살표는 ${nf(ans)}에서 출발하므로 ${tex(`f^{-1}(${y0})=${nf(ans)}`)}`];
      return{q,figure,choices:chs,ans:X.indexOf(ans),sol,answerTex:nf(ans),layout:'one'};
    }
  },
  { id:'u18a', tag:'18번', area:'D', title:'유리함수의 평행이동', src:'2026-1회 18번 · 2025-1회 18번 계열', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['유리함수 평행이동','유리함수 점근선 (a 구하기)']},
      {k:'k',label:'분자 k',min:-3,max:3},{k:'m',label:'x축 방향 m',min:-4,max:4},{k:'n',label:'y축 방향 n',min:-4,max:4}],
    def:{kind:'유리함수 평행이동',k:2,m:1,n:2},
    rand(){return{kind:pick(['유리함수 평행이동','유리함수 평행이동','유리함수 점근선 (a 구하기)']),k:nz(-3,3),m:nz(-3,3),n:nz(-3,3)};},
    build(p){
      /* 유리함수 전용 — 무리함수는 u18b 가 맡는다 (예전 저장본의 kind 도 여기서 받아 준다) */
      const kind=(p.kind&&p.kind.indexOf('유리함수')===0)?p.kind:'유리함수 평행이동';

      /* ── 점근선으로 상수를 찾는 형태 (2021-2회 18번) ── */
      if(kind==='유리함수 점근선 (a 구하기)'){
        if(p.k===0)return{err:'분자 k는 0이 아니어야 합니다.'};
        const m=p.m,n=p.n,ch2=numChoices(m);
        const fS2=`y=\\dfrac{${nf(p.k)}}{x-a}${tail(n)}`;
        const f2=x=>p.k/(x-m)+n;
        const items2=[{t:'vline',x:m,label:'x='+nf(m)},{t:'hline',y:n,label:'y='+nf(n)},
          {t:'fn',f:f2,from:-9,to:m-0.03,width:4.6},{t:'fn',f:f2,from:m+0.03,to:9,width:4.6},{t:'pt',x:m,y:n,r:6,hollow:true}];
        return{q:`유리함수 ${tex(fS2)}의 그래프의 점근선은 두 직선 ${tex('x='+nf(m))}, ${tex('y='+nf(n))}이다. 상수 ${tex('a')}의 값은?`,
          figure:fig(planeSVG({xmin:-6,xmax:6,ymin:-6,ymax:6,s:32},items2)),
          choices:ch2.list,ans:ch2.ans,answerTex:nf(m),
          sol:[`유리함수 ${tex('y=\\dfrac{k}{x-a}+n')}의 점근선은 ${tex('x=a')}, ${tex('y=n')} 입니다.`,
            `문제에서 세로 점근선이 ${tex('x='+nf(m))}이라고 했으므로 ${tex('a='+nf(m))}`,
            `가로 점근선 ${tex('y='+nf(n))}은 식의 맨 뒤 ${tex(nf(n))}과 이미 맞습니다.`]};
      }
      const m=p.m,n=p.n,ans=m+n,ch=numChoices(ans),irr=false;
      p={...p,type:irr?'무리함수':'유리함수'};
      let fS,base,items,g,sol;
      if(irr){
        fS=`y=\\sqrt{${xm(m)}}${tail(n)}`;base='y=\\sqrt{x}';
        const f=x=>Math.sqrt(x-m)+n;
        g={xmin:Math.min(-2,m-1),xmax:Math.max(7,m+5),ymin:Math.min(-2,n-2),ymax:Math.max(5,n+3),s:34,maxW:430};
        items=[{t:'fn',f:x=>Math.sqrt(x),from:0,color:GREY,dash:'8 6',width:3},{t:'fn',f,from:m,width:5},{t:'pt',x:0,y:0,color:'#8c97a6',r:6},{t:'pt',x:m,y:n,label:'시작점',guide:true,r:8,lx:-8,ly:-16},
          {t:'text',x:Math.min(g.xmax-2.4,4.5),y:Math.sqrt(4.5)+0.5,s:'y=√x',size:18,color:'#777'}];
        sol=[`그래프가 휘어진 모양은 볼 필요가 없습니다. 오직 <b>시작점</b>만 봅니다.`,
          `원래 ${tex('y=\\sqrt{x}')}의 시작점은 원점 ${tex('(0,\\ 0)')}입니다. (회색 점선)`,
          `옮겨진 그래프의 시작점은 ${tex(pr(m,n))}입니다. 원점에서 가로로 ${nf(m)}, 세로로 ${nf(n)}만큼 움직였습니다. → ${tex(`m=${nf(m)},\\ n=${nf(n)}`)}`,
          `따라서 ${tex(`m+n=${nf(m)}+${par(n)}=${nf(ans)}`)}`];
      }else{
        if(p.k===0)return{err:'분자 k는 0이 아니어야 합니다.'};
        fS=`y=\\dfrac{${nf(p.k)}}{${xm(m)}}${tail(n)}`;base=`y=\\dfrac{${nf(p.k)}}{x}`;
        const f=x=>p.k/(x-m)+n;
        g={xmin:-6,xmax:6,ymin:-6,ymax:6,s:32};
        items=[{t:'vline',x:m,label:'x='+nf(m)},{t:'hline',y:n,label:'y='+nf(n)},{t:'fn',f,from:-9,to:m-0.03,width:4.6},{t:'fn',f,from:m+0.03,to:9,width:4.6},{t:'pt',x:m,y:n,r:6,hollow:true}];
        sol=[`그래프 모양은 신경 쓰지 않아도 됩니다. x축, y축 말고 <b>빨간 점선(점근선)</b>만 보면 됩니다.`,
          `세로 점선이 ${tex('x='+nf(m))}에 있습니다. 원래 세로 점선은 y축(x=0)이었으니 ${m>0?'오른쪽':'왼쪽'}으로 ${nf(Math.abs(m))}만큼 밀린 것입니다. → ${tex('m='+nf(m))}`,
          `가로 점선이 ${tex('y='+nf(n))}에 있습니다. 원래는 x축(y=0)이었으니 ${n>0?'위':'아래'}로 ${nf(Math.abs(n))}만큼 밀린 것입니다. → ${tex('n='+nf(n))}`,
          `따라서 ${tex(`m+n=${nf(m)}+${par(n)}=${nf(ans)}`)}`];
      }
      const q=`${p.type} ${tex(fS)}의 그래프는 ${p.type} ${tex(base)}의 그래프를 ${tex('x')}축의 방향으로 ${tex('m')}만큼, ${tex('y')}축의 방향으로 ${tex('n')}만큼 평행이동한 것이다. 두 상수 ${tex('m,\\ n')}에 대하여 ${tex('m+n')}의 값은?`;
      const figure=fig(planeSVG(g,items));
      return{q,figure,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  },
  { id:'u18b', tag:'18번', area:'D', title:'무리함수의 평행이동', src:'2026-2회 18번 · 2025-2회 18번 계열', coord:true,
    fields:[{k:'kind',label:'문제 종류',sel:['무리함수 평행이동','무리함수 시작점']},
      {k:'m',label:'x축 방향 m',min:-4,max:5},{k:'n',label:'y축 방향 n',min:-4,max:6}],
    def:{kind:'무리함수 평행이동',m:2,n:5},
    rand(){return{kind:pick(['무리함수 평행이동','무리함수 평행이동','무리함수 시작점']),m:nz(-2,4),n:nz(-2,5)};},
    build(p){
      const kind=(p.kind&&p.kind.indexOf('무리함수')===0)?p.kind:'무리함수 평행이동';
      const m=p.m,n=p.n;
      const f=x=>Math.sqrt(x-m)+n;
      const g={xmin:Math.min(-2,m-1),xmax:Math.max(7,m+5),ymin:Math.min(-2,n-2),ymax:Math.max(5,n+3),s:34,maxW:430};

      /* ── 시작점 좌표 자체를 묻는 형태 ── */
      if(kind==='무리함수 시작점'){
        const ch3=coordChoices(m,n);
        return{q:`무리함수 ${tex(`y=\\sqrt{${xm(m)}}${tail(n)}`)}의 그래프의 시작점의 좌표는?`,
          figure:fig(planeSVG(g,[{t:'fn',f,from:m,width:5},{t:'pt',x:m,y:n,guide:true,r:8,nolabel:true}])),
          choices:ch3.list,ans:ch3.ans,answerTex:pr(m,n),layout:'two',
          sol:[`${tex('y=\\sqrt{x-m}+n')}의 시작점은 ${tex('(m,\\ n)')} 입니다.`,
            `${tex('x')} 옆의 수는 <b>부호를 뒤집어</b> 읽습니다 : ${tex(xm(m))} → ${tex('m='+nf(m))}`,
            `맨 뒤의 수가 그대로 ${tex('n='+nf(n))} → 시작점 ${tex(pr(m,n))}`]};
      }

      /* ── 평행이동한 양 m, n 을 읽어 m+n 을 구하는 기출 형태 ── */
      const ans=m+n,ch=numChoices(ans);
      const fS=`y=\\sqrt{${xm(m)}}${tail(n)}`;
      const items=[{t:'fn',f:x=>Math.sqrt(x),from:0,color:GREY,dash:'8 6',width:3},{t:'fn',f,from:m,width:5},
        {t:'pt',x:0,y:0,color:'#8c97a6',r:6},{t:'pt',x:m,y:n,label:'시작점',guide:true,r:8,lx:-8,ly:-16},
        {t:'text',x:Math.min(g.xmax-2.4,4.5),y:Math.sqrt(4.5)+0.5,s:'y=√x',size:18,color:'#777'}];
      return{q:`무리함수 ${tex(fS)}의 그래프는 무리함수 ${tex('y=\\sqrt{x}')}의 그래프를 ${tex('x')}축의 방향으로 ${tex('m')}만큼, ${tex('y')}축의 방향으로 ${tex('n')}만큼 평행이동한 것이다. 두 상수 ${tex('m,\\ n')}에 대하여 ${tex('m+n')}의 값은?`,
        figure:fig(planeSVG(g,items)),choices:ch.list,ans:ch.ans,answerTex:nf(ans),
        sol:[`그래프가 휘어진 모양은 볼 필요가 없습니다. 오직 <b>시작점</b>만 봅니다.`,
          `원래 ${tex('y=\\sqrt{x}')}의 시작점은 원점 ${tex('(0,\\ 0)')}입니다. (회색 점선)`,
          `옮겨진 그래프의 시작점은 ${tex(pr(m,n))}입니다. 원점에서 가로로 ${nf(m)}, 세로로 ${nf(n)}만큼 움직였습니다. → ${tex(`m=${nf(m)},\\ n=${nf(n)}`)}`,
          `따라서 ${tex(`m+n=${nf(m)}+${par(n)}=${nf(ans)}`)}`]};
    }
  },

  /* ================================================================
     영역 E. 경우의 수
     ================================================================ */
  { id:'u19', tag:'19번', area:'E', title:'순열', src:'2023~2026 매회 19번',
    fields:[{k:'c',label:'문제 종류 (경우)',sel:['4개 중 2개','4개 중 3개','5개 중 2개','3개 중 3개','4개 중 4개','5개 중 3개','6개 중 2개','6개 중 3개']},{k:'seed',label:'상황 번호',min:1,max:99}],
    def:{c:'4개 중 3개',seed:1},
    // 기출에 반복해서 나온 3종(4P2 · 4P3 · 5P2)에 가중치를 두되, 연습용 확장 유형도 섞는다
    rand(){return{c:pick(['4개 중 2개','4개 중 3개','5개 중 2개','4개 중 2개','4개 중 3개','5개 중 2개','3개 중 3개','5개 중 3개','6개 중 2개']),seed:rnd(1,99)};},
    build(p){
      const[n,r]=p.c.match(/\d+/g).map(Number);let ans=1;for(let i=0;i<r;i++)ans*=(n-i);
      const ctx=[{a:'과목별 학습 자료',u:'개',v:'택하여 순서대로 학습하는'},{a:'서로 다른 책',u:'권',v:'택하여 책꽂이에 나란히 꽂는'},{a:'서로 다른 꽃',u:'송이',v:'골라 화단에 순서대로 심는'},{a:'후보',u:'명',v:'뽑아 1등, 2등'+(r===3?', 3등':'')+'을 정하는'},{a:'서로 다른 색의 깃발',u:'개',v:'골라 순서대로 세우는'}];
      const e=ctx[(p.seed-1)%ctx.length];const ch=stepChoices(ans,2);
      const q=`${e.a} ${nf(n)}${e.u}${josa(e.u,'이','가')} 있다. 이 중에서 서로 다른 ${nf(r)}${e.u}${josa(e.u,'을','를')} ${e.v} 경우의 수는?`;
      const fac=Array.from({length:r},(_,i)=>nf(n-i)).join('\\times ');
      const sol=[`순서가 있으므로 순열입니다. ${tex(`{}_{${nf(n)}}\\mathrm{P}_{${nf(r)}}`)}`,`${tex(nf(n))}부터 1씩 줄이며 ${tex(nf(r))}개를 곱합니다 : ${tex(`${fac}=${nf(ans)}`)}`];
      return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  },
  { id:'u20', tag:'20번', area:'E', title:'조합', src:'2023~2026 매회 20번',
    fields:[{k:'c',label:'문제 종류 (경우)',sel:['4개 중 2개','5개 중 3개','5개 중 2개','4개 중 3개','6개 중 2개','6개 중 3개','5개 중 4개','6개 중 4개']},{k:'seed',label:'상황 번호',min:1,max:99}],
    def:{c:'5개 중 3개',seed:1},
    // 기출 4종에 가중치를 두되, 연습용 확장 유형도 섞는다
    rand(){return{c:pick(['4개 중 2개','5개 중 3개','5개 중 2개','4개 중 3개','4개 중 2개','5개 중 3개','6개 중 2개','6개 중 3개']),seed:rnd(1,99)};},
    build(p){
      const[n,r]=p.c.match(/\d+/g).map(Number);let num=1,den=1;for(let i=0;i<r;i++){num*=(n-i);den*=(i+1);}const ans=num/den;
      const ctx=[{a:'스포츠 클럽 활동에서 운영하는 종목',u:'개',v:'선택하는'},{a:'서로 다른 과일',u:'개',v:'고르는'},{a:'학생',u:'명',v:'대표로 뽑는'},{a:'서로 다른 동아리',u:'개',v:'가입하는'},{a:'서로 다른 반찬',u:'가지',v:'고르는'}];
      const e=ctx[(p.seed-1)%ctx.length];const ch=stepChoices(ans,2);
      const q=`어느 학교의 ${e.a} ${nf(n)}${e.u}${josa(e.u,'이','가')} 있다. 이 중에서 서로 다른 ${nf(r)}${e.u}${josa(e.u,'을','를')} ${e.v} 경우의 수는?`;
      const fn=Array.from({length:r},(_,i)=>nf(n-i)).join('\\times '),fd=Array.from({length:r},(_,i)=>nf(r-i)).join('\\times ');
      const sol=[`순서를 따지지 않으므로 조합입니다. ${tex(`{}_{${nf(n)}}\\mathrm{C}_{${nf(r)}}`)}`,`${tex(`\\dfrac{${fn}}{${fd}}=\\dfrac{${nf(num)}}{${nf(den)}}=${nf(ans)}`)}`];
      return{q,choices:ch.list,ans:ch.ans,sol,answerTex:nf(ans)};
    }
  }
  ];
})();

/* 자주 쓰는 묶음(프리셋) */
var GED_PRESETS=[
  {k:'coord',icon:'★',lbl:'좌표 완전정복',desc:'좌표 기초 3 + 좌표평면 유형 (7·10·11·12·13·14·18번)',ids:['c1','c2','c3','u7','u10','u11','u12','u13','u14','u18a','u18b']},
  {k:'warm',icon:'🌱',lbl:'좌표 워밍업',desc:'좌표 읽기·사분면·직선 + 대칭이동·거리',ids:['c1','c2','c3','u14','u10']},
  {k:'geo',icon:'📐',lbl:'도형의 방정식',desc:'10번~14번 (영역 C)',ids:['u10','u11','u12','u13','u14']},
  {k:'func',icon:'🔗',lbl:'집합과 함수',desc:'15번~18번 — 집합 · 명제 · 합성함수 · 역함수 · 유리 · 무리함수',ids:['u15','u16','u17a','u17b','u18a','u18b']},
  {k:'all20',icon:'📘',lbl:'전 영역 1~20번',desc:'고졸 검정고시 20문항 유형 전부 (세분화 반영)',ids:['u1','u2','u3','u4','u5','u6','u7','u8a','u8b','u9','u10','u11','u12','u13','u14','u15','u16','u17a','u17b','u18a','u18b','u19','u20']},
  {k:'full',icon:'🌍',lbl:'전체 (기초 포함)',desc:'좌표 기초 3 + 20문항 전 유형',ids:['c1','c2','c3','u1','u2','u3','u4','u5','u6','u7','u8a','u8b','u9','u10','u11','u12','u13','u14','u15','u16','u17a','u17b','u18a','u18b','u19','u20']}
];
