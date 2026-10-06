// === js/ui/examFig.js ===
/* --------------------------------------------------------------------
   검정고시 시험지 모양 그림 (2026-10-06)
   쓰는 곳 : student/mockExam.js (MockQBody) · teacher/logQView.js
   문항의 graph 데이터(생성기가 만든 것)를 읽어 SVG 문자열을 돌려준다. 모르는 종류면 null → 예전 GraphPreview.

   그리는 원칙 (2021~2026 기출 그림을 따랐다)
   - 모눈·눈금 숫자를 깔지 않는다. 답을 구하는 데 필요한 점에만 점을 찍고, 그 점에서 두 축으로 점선을 내려
     x값은 x축 아래, y값은 y축 왼쪽에 크게 쓴다. 숫자가 서로 겹치면 한쪽을 비킨다.
   - 정답이 그림에 드러나면 안 된다 (원의 중심을 묻는데 중심 좌표를 쓰지 않는다, 내분점 P 는 찍지 않는다 등).
   - 선은 검정, 글씨는 시험지처럼 기울인 바탕체(문자)·곧은 숫자.
   - 좌표 읽기·평행이동처럼 모눈을 세어야 하는 중학교 문항만 모눈을 깐다(기출도 모눈이 있다).
   -------------------------------------------------------------------- */
var EXF_SERIF="'Times New Roman','Noto Serif','Noto Serif KR',serif";
var EXF_SANS="'Noto Sans KR',sans-serif";

/* 그림 안 수식 글자 : 'y=√(x−3)+2' · 'x^2+y^2=4' 를 tspan 으로. 문자는 기울임, 숫자·기호는 곧게 */
function exfMath(str,size){
  const esc=c=>c==='<'?'&lt;':c==='>'?'&gt;':c==='&'?'&amp;':c;
  let s=String(str).replace(/−/g,'−');
  let o='';
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='^'){const m=s.slice(i+1).match(/^(\{[^}]*\}|-?\d+)/);if(m){const t=m[1].replace(/[{}]/g,'');
      o+=`<tspan dy="${-size*0.42}" font-size="${size*0.68}">${t.replace(/-/g,'−')}</tspan><tspan dy="${size*0.42}"></tspan>`;i+=m[1].length;continue;}}
    if(c==='√'){
      let body='';if(s[i+1]==='('){let d=0,j=i+1;for(;j<s.length;j++){if(s[j]==='(')d++;else if(s[j]===')'){d--;if(!d)break;}}body=s.slice(i+2,j);i=j;}
      else{const m=s.slice(i+1).match(/^(\d+|[a-z])/);body=m?m[1]:'';i+=body.length;}
      o+=`<tspan font-style="normal">√</tspan><tspan text-decoration="overline">${body.split('').map(ch=>/[a-z]/.test(ch)?`<tspan font-style="italic">${ch}</tspan>`:esc(ch==='-'?'−':ch)).join('')}</tspan>`;continue;}
    if(/[a-zA-Z]/.test(c)&&!/[A-Z]/.test(c))o+=`<tspan font-style="italic">${c}</tspan>`;
    else o+=esc(c==='-'?'−':c);
  }
  return o;
}

/* 좌표평면 하나를 만드는 도구. win : {xmin,xmax,ymin,ymax}, unit : 1 칸의 px(자동) */
function exfPlane(win,opt){
  opt=opt||{};
  const{xmin,xmax,ymin,ymax}=win;
  const maxW=opt.maxW||380,maxH=opt.maxH||330,pad=opt.pad||34;
  /* 한 칸 크기 : 기본은 가로·세로 같게. free:true 면 세로를 따로 줄여(이차함수처럼 값이 큰 그래프) 그림이 길쭉해지지 않게 */
  const ux=Math.min(opt.unit||60,(maxW-pad*2)/(xmax-xmin));
  const uy=opt.free?Math.min(ux,(maxH-pad*2)/(ymax-ymin)):ux;
  const u=opt.free?ux:Math.min(ux,(maxH-pad*2)/(ymax-ymin)),uY=opt.free?uy:u;
  const W=Math.round((xmax-xmin)*u+pad*2),H=Math.round((ymax-ymin)*uY+pad*2);
  const X=x=>+(pad+(x-xmin)*u).toFixed(1),Y=y=>+(pad+(ymax-y)*uY).toFixed(1);
  const FS=opt.fs||22;
  const el=[],top=[],labels=[];
  const P={u,X,Y,W,H,FS,
    /* 모눈 (중학교 좌표 읽기) */
    grid(step){step=step||1;for(let i=Math.ceil(xmin);i<=xmax;i+=step)el.push(`<line x1="${X(i)}" y1="${Y(ymin)}" x2="${X(i)}" y2="${Y(ymax)}" stroke="#c9ced8" stroke-width="1"/>`);
      for(let j=Math.ceil(ymin);j<=ymax;j+=step)el.push(`<line x1="${X(xmin)}" y1="${Y(j)}" x2="${X(xmax)}" y2="${Y(j)}" stroke="#c9ced8" stroke-width="1"/>`);},
    /* 축 + 눈금 숫자(ticks 가 참일 때만) */
    axes(ticks){
      const ax=`stroke="#111" stroke-width="1.8"`;
      el.push(`<line x1="${X(xmin)-10}" y1="${Y(0)}" x2="${X(xmax)+12}" y2="${Y(0)}" ${ax}/><polygon points="${X(xmax)+20},${Y(0)} ${X(xmax)+9},${Y(0)-5} ${X(xmax)+9},${Y(0)+5}" fill="#111"/>`);
      el.push(`<line x1="${X(0)}" y1="${Y(ymin)+10}" x2="${X(0)}" y2="${Y(ymax)-12}" ${ax}/><polygon points="${X(0)},${Y(ymax)-20} ${X(0)-5},${Y(ymax)-9} ${X(0)+5},${Y(ymax)-9}" fill="#111"/>`);
      labels.push(`<text x="${X(xmax)+14}" y="${Y(0)+FS+2}" font-size="${FS}" font-style="italic" font-family="${EXF_SERIF}">x</text>`);
      labels.push(`<text x="${X(0)+9}" y="${Y(ymax)-8}" font-size="${FS}" font-style="italic" font-family="${EXF_SERIF}">y</text>`);
      labels.push(`<text x="${X(0)-6}" y="${Y(0)+FS}" font-size="${FS}" text-anchor="end" font-family="${EXF_SERIF}">O</text>`);
      if(ticks){const fs=Math.min(FS-2,u*0.62);
        for(let i=Math.ceil(xmin);i<=xmax;i++){if(!i)continue;el.push(`<line x1="${X(i)}" y1="${Y(0)-4}" x2="${X(i)}" y2="${Y(0)+4}" stroke="#111" stroke-width="1.5"/>`);
          labels.push(`<text x="${X(i)}" y="${Y(0)+fs+5}" font-size="${fs}" text-anchor="middle" font-family="${EXF_SERIF}">${i<0?'−'+(-i):i}</text>`);}
        for(let j=Math.ceil(ymin);j<=ymax;j++){if(!j)continue;el.push(`<line x1="${X(0)-4}" y1="${Y(j)}" x2="${X(0)+4}" y2="${Y(j)}" stroke="#111" stroke-width="1.5"/>`);
          labels.push(`<text x="${X(0)-7}" y="${Y(j)+fs*0.36}" font-size="${fs}" text-anchor="end" font-family="${EXF_SERIF}">${j<0?'−'+(-j):j}</text>`);}}
    },
    fn(f,from,to,o){o=o||{};let d='',open=false;const N=400;
      for(let k=0;k<=N;k++){const x=from+(to-from)*k/N,y=f(x);const ok=isFinite(y)&&y>=ymin-3&&y<=ymax+3;
        if(ok){d+=(open?' L ':' M ')+X(x)+' '+Y(y);open=true;}else open=false;}
      el.push(`<path d="${d}" fill="none" stroke="${o.color||'#111'}" stroke-width="${o.w||2.6}" ${o.dash?`stroke-dasharray="${o.dash}"`:''} stroke-linecap="round"/>`);},
    seg(x1,y1,x2,y2,o){o=o||{};el.push(`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${o.color||'#111'}" stroke-width="${o.w||2.4}" ${o.dash?`stroke-dasharray="${o.dash}"`:''}/>`);},
    vline(x,o){P.seg(x,ymin,x,ymax,o);},hline(y,o){P.seg(xmin,y,xmax,y,o);},
    circle(cx,cy,r,o){o=o||{};el.push(`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${r*u}" fill="${o.fill||'none'}" stroke="#111" stroke-width="${o.w||2.4}"/>`);},
    dot(x,y,o){o=o||{};top.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="${o.r||5.5}" fill="${o.hollow?'#fff':'#111'}" stroke="#111" stroke-width="2"/>`);},
    /* 점에서 두 축으로 점선 */
    guide(x,y){if(y)P.seg(x,0,x,y,{w:1.4,dash:'5 5',color:'#444'});if(x)P.seg(0,y,x,y,{w:1.4,dash:'5 5',color:'#444'});},
    /* 글자. math:true 면 exfMath, 아니면 그대로 */
    text(x,y,s,o){o=o||{};const fs=o.size||FS;
      labels.push(`<text x="${(o.px!=null?o.px:X(x))+(o.dx||0)}" y="${(o.py!=null?o.py:Y(y))+(o.dy||0)}" font-size="${fs}" text-anchor="${o.anchor||'middle'}" font-family="${o.sans?EXF_SANS:EXF_SERIF}" ${o.bold?'font-weight="700"':''} paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">${o.math?exfMath(s,fs):s}</text>`);},
    num(v){return v<0?'−'+(-v):String(v);},
    /* x축 값(점 아래) · y축 값(축 왼쪽) — 겹치지 않게 기억해 둔다 */
    xval(x,s,below){if(!x&&s==null)return;if(P._xs.some(t=>Math.abs(t-x)*u<FS*0.9))return;P._xs.push(x);
      if(below!==false&&x<0&&(X(0)-X(x))<FS*1.6)below=false;            // O 글자와 겹치면 축 위로
      P.text(x,0,s!=null?s:P.num(x),{dy:below===false?-8:FS+4});},
    yval(y,s,right){if(!y&&s==null)return;if(P._ys.some(t=>Math.abs(t-y)*uY<FS*0.8))return;P._ys.push(y);
      if(!right&&y<0&&(Y(y)-Y(0))<FS*1.4)right=true;
      P.text(0,y,s!=null?s:P.num(y),{anchor:right?'start':'end',dx:right?8:-8,dy:FS*0.36});},
    _xs:[],_ys:[],
    svg(){return`<svg class="exfig" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">`
      +`<rect width="${W}" height="${H}" fill="#fff"/><defs><clipPath id="exc${++exfPlane.n}"><rect x="${X(xmin)-12}" y="${Y(ymax)-12}" width="${(xmax-xmin)*u+24}" height="${(ymax-ymin)*uY+24}"/></clipPath></defs>`
      +`<g clip-path="url(#exc${exfPlane.n})">${el.join('')}</g>${top.join('')}${labels.join('')}</svg>`;}
  };
  return P;
}
exfPlane.n=0;

/* 축 범위 : 보여야 할 점들을 모두 담고 원점도 넣는다 */
function exfWin(xs,ys,m){m=m==null?1:m;return{xmin:Math.min(0,...xs)-m,xmax:Math.max(0,...xs)+m,ymin:Math.min(0,...ys)-m,ymax:Math.max(0,...ys)+m};}

/* ── 종류별 그림 ── */
var EXAM_FIG={
  /* 이차함수 y=a(x−p)²+q, 범위 [ds,de] — 범위 안은 굵게, 밖은 점선. 범위 끝 x 와 꼭짓점 x 만 쓴다(값은 학생이 구한다) */
  quadratic(g,q){
    const{a,p,ds,de}=g,k=g.q,F=x=>a*(x-p)**2+k;
    const mid=/그래프에 대한 설명|식으로 옳은/.test(q&&q.q||'');      // 중학교 '그래프 설명' — 꼭짓점·절편을 보여 준다
    const xs=[ds,de,p],ys=[F(ds),F(de),k];
    const w=exfWin(xs,ys,1);
    /* 곡선이 그림 위·아래로 잘리지 않게 : 창 양 끝에서의 곡선 높이까지 세로 범위에 넣는다 */
    const ye=[F(w.xmin),F(w.xmax)];w.ymax=Math.max(w.ymax,k+1,...ye.map(v=>v+0.5));w.ymin=Math.min(w.ymin,k-1,...ye.map(v=>v-0.5));
    const P=exfPlane(w,{maxH:320,unit:56,free:true});
    P.axes(false);
    if(mid){
      P.fn(F,w.xmin,w.xmax,{w:2.8});
      P.dot(p,k);P.guide(p,k);if(p)P.xval(p);if(k)P.yval(k,null,p<0);
      const yi=F(0);if(p&&yi>=w.ymin&&yi<=w.ymax){P.dot(0,yi);P.yval(yi,null,true);}
      (g.show||[]).forEach(([x,y])=>{if(x===p&&y===k)return;P.dot(x,y);P.guide(x,y);P.xval(x);P.yval(y);});
      return P.svg();
    }
    P.fn(F,w.xmin,w.xmax,{w:1.6,dash:'6 6',color:'#555'});P.fn(F,ds,de,{w:3.2});
    /* 범위 양 끝과 (범위 안이면) 꼭짓점 : 두 축으로 점선을 내리고 x값·y값을 모두 쓴다 (기출 그림처럼 — x만 주고 식으로 찾게 하지 않는다) */
    const keys=[ds,de].concat(p>ds&&p<de?[p]:[]);
    keys.forEach(x=>{const y=F(x);P.dot(x,y);P.guide(x,y);P.xval(x,null,y<0?false:true);P.yval(y,null,de<=0);});
    return P.svg();
  },
  /* 무리함수 : y=√x 와 옮긴 그래프, 시작점에서 두 축으로 점선, 곡선 이름표 */
  radical(g){
    const a=g.a||1,p=g.p,k=g.q,sg=a<0?-1:1;
    const f0=x=>x<0?NaN:sg*Math.sqrt(x),f=x=>x<p?NaN:sg*Math.sqrt(x-p)+k;
    const xmx=Math.max(7,p+6);
    /* 곡선 끝(오른쪽 끝)의 높이까지 넣어 위가 잘리지 않게 */
    const w={xmin:Math.min(-1,p-1),xmax:xmx,ymin:Math.min(-1,k-1,sg<0?f(xmx)-0.8:0,sg<0?f0(xmx)-0.8:0),ymax:Math.max(3.5,k+1,sg>0?f(xmx)+0.8:0,sg>0?f0(xmx)+0.8:0)};
    const P=exfPlane(w,{unit:44});P.axes(false);
    P.fn(f0,0,w.xmax,{w:2.4});P.fn(f,p,w.xmax,{w:2.8});
    P.dot(p,k);P.guide(p,k);if(p)P.xval(p,null,k<0?false:true);if(k)P.yval(k,null,p<0);
    const lx=w.xmax-0.3;
    P.text(lx,f0(lx),'y=√x',{math:true,anchor:'end',dy:sg>0?FSo(P,1.1):-10,size:20});
    P.text(lx,f(lx),`y=√(x${p<0?'+'+(-p):'−'+p})${k?(k<0?'−'+(-k):'+'+k):''}`,{math:true,anchor:'end',dy:sg>0?-12:FSo(P,1.1),size:20});
    return P.svg();
  },
  /* 유리함수 : 점근선 x=p, y=q (점선) 과 두 갈래 곡선 */
  rational(g){
    const k=g.k||1,p=g.p,q=g.q,F=x=>k/(x-p)+q;
    const w={xmin:Math.min(-1,p-4),xmax:Math.max(1,p+4),ymin:Math.min(-1,q-4),ymax:Math.max(1,q+4)};
    const P=exfPlane(w,{unit:40});P.axes(false);
    P.vline(p,{w:1.5,dash:'7 6',color:'#333'});P.hline(q,{w:1.5,dash:'7 6',color:'#333'});
    P.fn(F,w.xmin,p-0.02,{w:2.8});P.fn(F,p+0.02,w.xmax,{w:2.8});
    if(p)P.xval(p,null,q<0?false:true);if(q)P.yval(q,null,p<0);
    return P.svg();
  },
  /* 원 : 원과 중심점만 — 중심·반지름을 묻는 문제가 많아 숫자를 쓰지 않는다 */
  circle(g){
    const{h,k,r}=g;
    const w={xmin:Math.min(-1,h-r-1),xmax:Math.max(1,h+r+1),ymin:Math.min(-1,k-r-1),ymax:Math.max(1,k+r+1)};
    const P=exfPlane(w,{unit:Math.min(44,300/(2*r+3))});P.axes(false);
    P.circle(h,k,r);P.dot(h,k,{r:4});
    return P.svg();
  },
  /* 직선과 원 (기출 그림 1) : x²+y²=r² 과 직선 x=a(또는 y=a) — 이름표만 */
  circle_line(g){
    const{r,lineType,lineVal}=g;
    const w={xmin:-r-1.4,xmax:r+1.6,ymin:-r-1.4,ymax:r+1.4};
    const P=exfPlane(w,{unit:Math.min(46,300/(2*r+3))});P.axes(false);P.circle(0,0,r);
    const v=lineVal;
    if(lineType==='v'){P.vline(v,{w:2.6});P.text(v,w.ymin,'x=a',{math:true,dx:8,dy:-4,anchor:'start'});}
    else{P.hline(v,{w:2.6});P.text(w.xmin,v,'y=a',{math:true,anchor:'start',dy:-8});}
    P.text(-r*0.75,-r*0.75,`x^2+y^2=${r*r}`,{math:true,anchor:'end',dx:-6,dy:FSo(P,1.2),size:20});
    return P.svg();
  },
  /* 점과 직선 사이의 거리 : 직선 · 점 P · 수선의 발까지 점선 */
  distance(g){
    const{ptX,ptY,la,lb,lc}=g;
    const fx=x=>(-lc-la*x)/lb;
    const t=(la*ptX+lb*ptY+lc)/(la*la+lb*lb),hx=ptX-la*t,hy=ptY-lb*t;
    const xs=[ptX,hx],ys=[ptY,hy];
    const w=exfWin(xs,ys,2);
    const P=exfPlane(w,{unit:40});P.axes(false);
    P.fn(fx,w.xmin,w.xmax,{w:2.6});
    P.seg(ptX,ptY,hx,hy,{w:1.6,dash:'6 5',color:'#333'});P.dot(ptX,ptY);P.dot(hx,hy,{r:3.5});
    P.text(ptX,ptY,'P',{dx:12,dy:-10,anchor:'start'});
    return P.svg();
  },
  /* 두 점 사이의 거리 : A, B 와 선분, 두 축으로 점선과 좌표값 */
  two_point(g){
    const{x1,y1,x2,y2}=g;
    const P=exfPlane(exfWin([x1,x2],[y1,y2],1),{unit:46});P.axes(false);
    P.seg(x1,y1,x2,y2,{w:2.8});
    [[x1,y1,'A'],[x2,y2,'B']].forEach(([x,y,n])=>{P.dot(x,y);P.guide(x,y);if(x)P.xval(x,null,y<0?false:true);if(y)P.yval(y,null,x<0);
      const right=x===0?true:x>=(x1+x2)/2;     // y축 위의 점은 이름을 오른쪽에 (y값 글자와 겹치지 않게)
      P.text(x,y,n,{dx:right?12:-12,dy:-10,anchor:right?'start':'end'});});
    return P.svg();
  },
  /* 점의 대칭이동 : 점 P 와 대칭축(직선 y=x 등은 점선 이름표) — 옮긴 점은 그리지 않는다 */
  symmetry(g){
    const{px,py,sym}=g;
    const m=Math.max(Math.abs(px),Math.abs(py))+1.5;
    const P=exfPlane({xmin:-m,xmax:m,ymin:-m,ymax:m},{unit:Math.min(44,300/(2*m))});P.axes(false);
    if(sym==='y=x'){P.fn(x=>x,-m,m,{w:1.8,dash:'7 6',color:'#333'});P.text(m-0.4,m-0.4,'y=x',{math:true,anchor:'end',dy:20});}
    if(sym==='y=-x'){P.fn(x=>-x,-m,m,{w:1.8,dash:'7 6',color:'#333'});P.text(m-0.4,-m+0.4,'y=−x',{math:true,anchor:'end',dy:-8});}
    P.dot(px,py);P.guide(px,py);if(px)P.xval(px,null,py<0?false:true);if(py)P.yval(py,null,px<0);
    P.text(px,py,'P',{dx:px>=0?12:-12,dy:-10,anchor:px>=0?'start':'end'});
    return P.svg();
  },
  /* 내분점(수직선) : 좌표 탭과 같은 기출 그림 (P 의 좌표는 숨긴다) */
  section_1d(g){return typeof divLineSVG==='function'?divLineSVG({a:g.a,b:g.b,m:g.m,n:g.n,p:g.p,icon:g.icon}):null;},
  /* 내분점(좌표평면) : 모눈 위 선분 AB 만 */
  section_2d(g){
    const{ax,ay,bx,by}=g;
    const P=exfPlane(exfWin([ax,bx],[ay,by],1),{unit:40});P.grid();P.axes(true);
    P.seg(ax,ay,bx,by,{w:3});P.dot(ax,ay);P.dot(bx,by);
    P.text(ax,ay,'A',{dx:ax<=bx?-10:12,dy:ay<=by?22:-10,anchor:ax<=bx?'end':'start'});
    P.text(bx,by,'B',{dx:bx<ax?-10:12,dy:by<ay?22:-10,anchor:bx<ax?'end':'start'});
    return P.svg();
  },
  /* 절댓값 부등식 : 수직선 위 해 (회색 상자), 왼쪽 끝은 a 로 숨긴다 */
  abs_numline(g){return exfNumline({lo:g.lo,hi:g.hi,inside:!g.ge,closed:true,loLabel:'a'});},
  /* 일차함수 : 직선과 정수인 절편만 */
  linear(g){
    const{a,b}=g;const xi=-b/a;
    const xs=[0,Number.isInteger(xi)?xi:0,g.x0!=null?g.x0:0],ys=[b,g.y0!=null?g.y0:0];
    const w=exfWin(xs,ys,1.5);
    const P=exfPlane(w,{unit:Math.min(44,320/Math.max(w.xmax-w.xmin,w.ymax-w.ymin))});P.axes(false);
    P.fn(x=>a*x+b,w.xmin,w.xmax,{w:2.8});
    if(b){P.dot(0,b,{r:4});P.yval(b,null,a<0);}
    if(Number.isInteger(xi)&&xi){P.dot(xi,0,{r:4});P.xval(xi,null,a*b>0?true:false);}
    return P.svg();
  },
  /* 중학교 : 점의 위치 — 모눈과 눈금이 있는 기출 그림 */
  point_plot(g){return exfGridPts([[g.px,g.py,'P']]);},
  translate_point(g){return exfGridPts([[g.px,g.py,'P']]);},
  symmetry_point(g){return exfGridPts([[g.px,g.py,'P']]);},
};
function FSo(P,k){return Math.round(P.FS*k);}

/* 모눈 좌표평면에 점 몇 개 (이름표만, 좌표는 쓰지 않는다) */
function exfGridPts(pts){
  const m=Math.max(4,...pts.map(([x,y])=>Math.max(Math.abs(x),Math.abs(y))+1));
  const P=exfPlane({xmin:-m,xmax:m,ymin:-m,ymax:m},{unit:Math.min(36,320/(2*m)),fs:20});P.grid();P.axes(true);
  pts.forEach(([x,y,n])=>{P.dot(x,y);if(n)P.text(x,y,n,{dx:-6,dy:-9,anchor:'end',sans:true,bold:true,size:19});});
  return P.svg();
}

/* 수직선 위 해 (기출 그림 : 회색 상자 + ●/○) — 보기 그림과 절댓값 부등식 그림에 함께 쓴다
   {lo,hi?,inside,closed,loLabel?,hiLabel?, ticks:[…] } hi 가 없으면 반직선 (dir:'left'|'right') */
function exfNumline(o){
  const W=o.W||340,H=o.H||96,ly=o.ly||64,L=22,R=W-30,FS=o.fs||20;
  const vals=[o.lo,o.hi].filter(v=>v!=null);
  let t0=o.t0!=null?o.t0:Math.min(...vals)-2,t1=o.t1!=null?o.t1:Math.max(...vals)+2;
  const X=v=>+(L+(v-t0)/(t1-t0)*(R-L)).toFixed(1);
  const INK='#111',BOX='#d9dce2',bt=ly-24;
  let s=`<svg class="exfig" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">`;
  s+=`<rect width="${W}" height="${H}" fill="#fff"/>`;
  const box=(x1,x2,arrowL,arrowR)=>{let b=`<rect x="${x1}" y="${bt}" width="${x2-x1}" height="${ly-bt}" fill="${BOX}"/>`;
    b+=`<line x1="${x1}" y1="${bt}" x2="${x2}" y2="${bt}" stroke="${INK}" stroke-width="1.6"/>`;
    if(!arrowL)b+=`<line x1="${x1}" y1="${bt}" x2="${x1}" y2="${ly}" stroke="${INK}" stroke-width="1.6"/>`;
    if(!arrowR)b+=`<line x1="${x2}" y1="${bt}" x2="${x2}" y2="${ly}" stroke="${INK}" stroke-width="1.6"/>`;
    if(arrowL)b+=`<polygon points="${x1-6},${bt} ${x1+4},${bt-5} ${x1+4},${bt+5}" fill="${INK}"/>`;
    if(arrowR)b+=`<polygon points="${x2+6},${bt} ${x2-4},${bt-5} ${x2-4},${bt+5}" fill="${INK}"/>`;return b;};
  if(o.hi==null){s+=o.dir==='left'?box(L-6,X(o.lo),true,false):box(X(o.lo),R+4,false,true);}
  else if(o.inside)s+=box(X(o.lo),X(o.hi));
  else s+=box(L-6,X(o.lo),true,false)+box(X(o.hi),R+4,false,true);
  s+=`<line x1="${L-14}" y1="${ly}" x2="${R+12}" y2="${ly}" stroke="${INK}" stroke-width="1.8"/><polygon points="${R+20},${ly} ${R+9},${ly-5} ${R+9},${ly+5}" fill="${INK}"/>`;
  s+=`<polygon points="${L-20},${ly} ${L-9},${ly-5} ${L-9},${ly+5}" fill="${INK}"/>`;
  s+=`<text x="${R+10}" y="${ly+FS+4}" font-size="${FS}" font-style="italic" font-family="${EXF_SERIF}">x</text>`;
  const marks=new Set(vals);
  if(o.ticks!==false)for(let v=Math.ceil(t0);v<=t1;v++){
    if(o.sparse&&!marks.has(v))continue;
    s+=`<line x1="${X(v)}" y1="${ly-5}" x2="${X(v)}" y2="${ly+5}" stroke="${INK}" stroke-width="1.5"/>`;
    const lab=v===o.lo&&o.loLabel?`<tspan font-style="italic">${o.loLabel}</tspan>`:v===o.hi&&o.hiLabel?`<tspan font-style="italic">${o.hiLabel}</tspan>`:(v<0?'−'+(-v):v);
    s+=`<text x="${X(v)}" y="${ly+FS+6}" font-size="${FS}" text-anchor="middle" font-family="${EXF_SERIF}">${lab}</text>`;}
  vals.forEach(v=>{s+=`<circle cx="${X(v)}" cy="${ly}" r="5.5" fill="${o.closed?INK:'#fff'}" stroke="${INK}" stroke-width="2"/>`;});
  return s+'</svg>';
}

/* 보기 글자 → 수직선 그림.  'x≥3' · 'x<−1' · '1≤x≤4' · 'x≤1 또는 x≥6' · '−2<x<3' */
function exfIneqChoice(c,t0,t1){
  const s=String(c).replace(/−/g,'-').replace(/\s/g,'');
  let m;
  const cl=op=>op==='≤'||op==='≥';
  const o={t0,t1,W:300,H:84,ly:50,fs:22};
  if((m=s.match(/^(-?\d+)(<|≤)x(<|≤)(-?\d+)$/)))return exfNumline({...o,lo:+m[1],hi:+m[4],inside:true,closed:cl(m[2])});
  if((m=s.match(/^x(<|≤)(-?\d+)또는x(>|≥)(-?\d+)$/)))return exfNumline({...o,lo:+m[2],hi:+m[4],inside:false,closed:cl(m[1])});
  if((m=s.match(/^x(<|≤|>|≥)(-?\d+)$/)))return exfNumline({...o,lo:+m[2],dir:/[<≤]/.test(m[1])?'left':'right',closed:cl(m[1])});
  return null;
}
/* 보기 4개를 같은 눈금 범위로 그린다 (기출처럼 네 그림의 눈금이 같아야 비교가 된다) */
function exfIneqChoices(choices){
  const nums=choices.join(' ').replace(/−/g,'-').match(/-?\d+/g)||['0'];
  const v=nums.map(Number),t0=Math.min(...v)-1,t1=Math.max(...v)+2;
  const out=choices.map(c=>exfIneqChoice(c,t0,t1));
  return out.every(Boolean)?out:null;
}

/* 진입점 : 문항 → 그림 SVG 문자열 또는 null */
function examFigSVG(q){
  const g=q&&q.graph;if(!g||!EXAM_FIG[g.type])return null;
  try{return EXAM_FIG[g.type](g,q);}catch(e){return null;}
}

/* ── 인쇄용 HTML (선생님 학습지 탭 teacher/worksheet.js) ──
   새 창에 찍는 문자열이라 React 를 못 쓴다. MockQBody 와 같은 재료(자료 상자 · 표 · 그림 · 보기 그림)를 HTML 로. */
function examExtrasHTML(q){
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let h='';
  if(q.boxUnit)h+=`<div style="text-align:right;font-size:12px;margin-top:4px">${esc(q.boxUnit)}</div>`;
  if(q.box)h+=`<div style="border:1.5px solid #888;padding:8px 12px;margin:6px 0;text-align:center;word-spacing:16px">${esc(q.box)}</div>`;
  if(q.table){const td='border:1px solid #888;padding:3px 10px;text-align:center';
    h+=`<table style="border-collapse:collapse;margin:8px auto;font-size:13px">${q.table.head?`<tr>${q.table.head.map(c=>`<th style="${td};background:#eee">${esc(c)}</th>`).join('')}</tr>`:''}`
      +q.table.rows.map((r,i)=>`<tr>${r.map(c=>`<td style="${td}${q.table.sumRow&&i===q.table.rows.length-1?';background:#eee;font-weight:700':''}">${esc(c)}</td>`).join('')}</tr>`).join('')+'</table>';}
  const g=q.graph;
  if(g&&g.type==='system_eq')h+=`<div style="margin:6px 0 6px 24px;border-left:2px solid #333;padding-left:10px;line-height:1.7">${g.eqs.map(esc).join('<br>')}</div>`;
  else if(g){const f=examFigSVG(q)||(typeof graphToSVGStr==='function'?graphToSVGStr(g):'');if(f)h+=`<div style="margin:8px auto;max-width:300px">${f}</div>`;}
  return h;
}
/* 보기 : 수직선 그림 보기면 그림, 아니면 글 */
function examChoiceItems(q){return(q.choicePic==='ineq'&&exfIneqChoices(q.choices))||q.choices;}
