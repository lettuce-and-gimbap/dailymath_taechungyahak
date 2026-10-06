// === js/ui/examFigShapes.js ===
/* --------------------------------------------------------------------
   검정고시 시험지 모양 그림 ② — 도형 · 통계 · 이야기 그림 (2026-10-06)
   쓰는 곳 : js/ui/examFig.js 의 EXAM_FIG 에 종류를 더한다 (examFigSVG 가 함께 찾는다)
   중졸 생성기(js/generators/middle.js)의 graph 데이터를 그린다.
     factor_tree · area_shape · trip · grid_pts · sector · rot_solid · parallel · iso_tri · right_tri
     similar · tri_par · menu · dice · ballbag · lines2 · circ
   원칙은 examFig.js 와 같다 : 검정 선, 큰 글씨, 정답이 그림에 드러나지 않게.
   -------------------------------------------------------------------- */
function _sv(W,H,body){return`<svg class="exfig" viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;}
function _fsT(x,y,s,o){o=o||{};const fs=o.size||20;
  return`<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${o.anchor||'middle'}" font-family="${o.sans?EXF_SANS:EXF_SERIF}" ${o.bold?'font-weight="700"':''} ${o.italic?'font-style="italic"':''} ${o.fill?`fill="${o.fill}"`:''}>${o.math?exfMath(s,fs):s}</text>`;}
function _ln(x1,y1,x2,y2,o){o=o||{};return`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c||'#111'}" stroke-width="${o.w||2.2}" ${o.dash?`stroke-dasharray="${o.dash}"`:''}/>`;}
/* 길이 이름표 : 두 점 사이 바깥쪽에 점선 호와 글자 (기출 그림 방식) */
function _dimArc(x1,y1,x2,y2,label,side){
  const mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy);
  /* side 가 [x,y](도형 가운데)이면 그 반대쪽(바깥)으로 */
  if(Array.isArray(side))side=((-dy)*(mx-side[0])+dx*(my-side[1]))>=0?1:-1;
  const nx=-dy/L*side,ny=dx/L*side,b=Math.min(28,L*0.22);
  const cx=mx+nx*b*2,cy=my+ny*b*2;
  return`<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none" stroke="#888" stroke-width="1.3" stroke-dasharray="4 4"/>`
    +`<rect x="${mx+nx*b-24}" y="${my+ny*b-13}" width="48" height="24" fill="#fff"/>`
    /* 'x cm' 의 x 만 기울이고 단위(cm)는 곧게 */
    +_fsT(mx+nx*b,my+ny*b+7,String(label).replace(/(^|\s)([a-z])(?=\s|$)/,'$1<tspan font-style="italic">$2</tspan>'));}
/* 각 표시 (꼭짓점 P, 두 방향 각도(도), 반지름) */
function _angArc(px,py,a1,a2,r,fill){
  if((((a2-a1)%360)+360)%360>180){const t=a1;a1=a2;a2=t;}          // 늘 짧은 쪽(180° 미만)으로
  const p=a=>[px+r*Math.cos(a*Math.PI/180),py-r*Math.sin(a*Math.PI/180)];
  const[s,e]=[p(a1),p(a2)],large=0;
  return`<path d="M ${px} ${py} L ${s[0]} ${s[1]} A ${r} ${r} 0 ${large} 0 ${e[0]} ${e[1]} Z" fill="${fill||'#d9dce2'}" stroke="#111" stroke-width="1.2"/>`;}
var _deg=(x1,y1,x2,y2)=>Math.atan2(-(y2-y1),x2-x1)*180/Math.PI;

Object.assign(EXAM_FIG,{
  /* 소인수분해 : 나뭇가지(tree) 또는 나눗셈 사다리(ladder) */
  factor_tree(g){
    const f=_primeFactors(g.n);
    if(g.style==='ladder'){
      const H=40+f.length*40,W=200;let s='',v=g.n,y=34;
      f.forEach((p,i)=>{s+=_fsT(66,y,String(p),{anchor:'end'})+_fsT(86,y,String(v),{anchor:'start'})
        +`<path d="M 74 ${y-24} Q 80 ${y-8} 74 ${y+6} L 136 ${y+6}" fill="none" stroke="#111" stroke-width="1.6"/>`;v/=p;y+=36;});
      s+=_fsT(86,y,String(v),{anchor:'start'});
      return _sv(W,H+10,s);
    }
    let s='',x=20,y=50,v=g.n;
    f.forEach((p,i)=>{
      const w=String(v).length*11;
      if(i===f.length-1){s+=`<circle cx="${x+w/2}" cy="${y-6}" r="14" fill="#d9dce2"/>`+_fsT(x+w/2,y+1,String(v));return;}
      s+=_fsT(x,y+1,String(v),{anchor:'start'});
      const sx=x+w+6;
      s+=_ln(sx,y-8,sx+26,y-28,{w:1.4})+_ln(sx,y-2,sx+26,y+20,{w:1.4});
      s+=`<circle cx="${sx+40}" cy="${y-34}" r="14" fill="#d9dce2"/>`+_fsT(sx+40,y-27,String(p));
      v/=p;x=sx+28;y+=34;});
    return _sv(x+70,y+20,s);
  },
  /* 넓이 식 : 직사각형 / 직각삼각형 — 가로·세로에 점선 호와 길이 */
  area_shape(g){
    let s='';const x0=40,y0=30,w=200,h=110;
    if(g.shape==='rect'){s+=`<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="#111" stroke-width="2.2"/>`;
      [[x0,y0],[x0+w,y0],[x0,y0+h],[x0+w,y0+h]].forEach(([x,y],i)=>{const sx=i%2?-1:1,sy=i<2?1:-1;s+=`<path d="M ${x+10*sx} ${y} L ${x+10*sx} ${y+10*sy} L ${x} ${y+10*sy}" fill="none" stroke="#111" stroke-width="1.2"/>`;});
      s+=_dimArc(x0,y0,x0+w,y0,g.w,[x0+w/2,y0+h/2])+_dimArc(x0,y0+h,x0,y0,g.h,[x0+w/2,y0+h/2]);}
    else{s+=`<path d="M ${x0} ${y0+h} L ${x0+w} ${y0+h} L ${x0+w} ${y0} Z" fill="none" stroke="#111" stroke-width="2.2"/><path d="M ${x0+w-12} ${y0+h} L ${x0+w-12} ${y0+h-12} L ${x0+w} ${y0+h-12}" fill="none" stroke="#111" stroke-width="1.2"/>`;
      s+=_dimArc(x0,y0+h,x0+w,y0+h,g.w,[x0+w*0.6,y0+h*0.6])+_dimArc(x0+w,y0+h,x0+w,y0,g.h,[x0+w*0.6,y0+h*0.6]);}
    return _sv(300,190,s);
  },
  /* 이동 거리 그래프 : 모눈, 가로 시간 · 세로 거리 */
  trip(g){
    const pts=g.pts,T=pts[pts.length-1][0],D=Math.max(...pts.map(p=>p[1]));
    const w={xmin:0,xmax:T,ymin:0,ymax:D};
    const L=58,B=44,W=380,H=280,cw=(W-L-70)/T,ch=(H-B-40)/D;
    const X=t=>L+t*cw,Y=d=>H-B-d*ch;
    let s='';
    for(let t=0;t<=T;t+=g.tStep)s+=_ln(X(t),Y(0),X(t),Y(D),{c:'#bbb',w:1,dash:t?'3 3':''});
    for(let d=0;d<=D;d+=g.dStep)s+=_ln(X(0),Y(d),X(T),Y(d),{c:'#bbb',w:1,dash:d?'3 3':''});
    s+=_ln(X(0),Y(0),X(T)+16,Y(0),{w:1.8})+_ln(X(0),Y(0),X(0),Y(D)-16,{w:1.8});
    s+=`<polygon points="${X(T)+22},${Y(0)} ${X(T)+12},${Y(0)-5} ${X(T)+12},${Y(0)+5}" fill="#111"/><polygon points="${X(0)},${Y(D)-22} ${X(0)-5},${Y(D)-12} ${X(0)+5},${Y(D)-12}" fill="#111"/>`;
    for(let t=g.tStep;t<=T;t+=g.tStep)s+=_fsT(X(t),Y(0)+24,String(t),{size:18});
    for(let d=g.dStep;d<=D;d+=g.dStep)s+=_fsT(X(0)-8,Y(d)+6,String(d),{size:18,anchor:'end'});
    s+=_fsT(X(0)-8,Y(0)+22,'O',{anchor:'end',size:18})+_fsT(X(T)+8,Y(0)+24,`(${g.tU})`,{anchor:'start',size:15,sans:true})+_fsT(X(0)-6,Y(D)-24,`(${g.dU})`,{anchor:'end',size:15,sans:true});
    s+=`<polyline points="${pts.map(([t,d])=>`${X(t)},${Y(d)}`).join(' ')}" fill="none" stroke="#111" stroke-width="2.8" stroke-linejoin="round"/>`;
    return _sv(W,H,s);
  },
  grid_pts(g){return exfGridPts(g.pts);},
  /* 부채꼴 두 개 (AOB · COD) — 묻는 쪽 값은 쓰지 않는다 */
  sector(g){
    const cx=160,cy=130,r=100;let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="2.2"/>`;
    const P=a=>[cx+r*Math.cos(a*Math.PI/180),cy-r*Math.sin(a*Math.PI/180)];
    const sec=(a0,a1,fill)=>{const[s0,s1]=[P(a0),P(a1)];return`<path d="M ${cx} ${cy} L ${s0[0]} ${s0[1]} A ${r} ${r} 0 ${a1-a0>180?1:0} 0 ${s1[0]} ${s1[1]} Z" fill="${fill}" stroke="#111" stroke-width="1.8"/>`;};
    const b0=150,b1=b0+g.a1,d0=-50,d1=d0+g.a2;
    s+=sec(b0,b1,'#e5e7eb')+sec(d0,d1,'#e5e7eb');
    const lab=(a,t)=>{const[x,y]=P(a);return _fsT(x+(x>cx?14:-14),y+(y>cy?18:-6),t,{anchor:x>cx?'start':'end',sans:true,size:18});};
    s+=lab(b0,'B')+lab(b1,'A')+lab(d0,'D')+lab(d1,'C')+_fsT(cx+6,cy+20,'O',{anchor:'start'});
    const mid=(a0,a1,k)=>P((a0+a1)/2).map((v,i)=>i?cy+(v-cy)*k:cx+(v-cx)*k);
    const[ax,ay]=mid(b0,b1,0.35);s+=_fsT(ax,ay+6,`${g.a1}°`,{size:17});
    if(g.ask!=='ang'){const[qx,qy]=mid(d0,d1,0.35);s+=_fsT(qx,qy+6,`${g.a2}°`,{size:17});}
    const[lx,ly]=mid(b0,b1,1.32);s+=_fsT(lx,ly,g.l1,{size:17});
    if(g.l2){const[mx,my]=mid(d0,d1,1.3);s+=_fsT(mx,my,g.l2,{size:17,anchor:'start'});}
    return _sv(330,260,s);
  },
  /* 회전체 : 도형과 회전축 l */
  rot_solid(g){
    const ax=170;let s=_ln(ax,30,ax,230,{w:1.6,dash:'8 5'})+_fsT(ax,24,'l',{italic:true});
    s+=`<path d="M ${ax-14} 44 A 14 6 0 1 0 ${ax+14} 44" fill="none" stroke="#111" stroke-width="1.4"/><polygon points="${ax+14},44 ${ax+8},38 ${ax+8},50" fill="#111"/>`;
    if(g.shape==='rect')s+=`<rect x="${ax}" y="70" width="80" height="130" fill="#d9dce2" stroke="#111" stroke-width="2"/>`;
    else if(g.shape==='semi')s+=`<path d="M ${ax} 70 A 66 66 0 0 0 ${ax} 202 Z" fill="#d9dce2" stroke="#111" stroke-width="2"/>`;
    else if(g.shape==='rtri')s+=`<path d="M ${ax} 70 L ${ax} 200 L ${ax+90} 200 Z" fill="#d9dce2" stroke="#111" stroke-width="2"/>`;
    else s+=`<path d="M ${ax} 80 L ${ax+50} 80 L ${ax+90} 200 L ${ax} 200 Z" fill="#d9dce2" stroke="#111" stroke-width="2"/>`;
    return _sv(330,240,s);
  },
  /* 평행선 l ∥ m 과 직선 n : 주어진 각과 ∠x */
  parallel(g){
    const y1=80,y2=190,W=340;let s=_ln(30,y1,W-30,y1)+_ln(30,y2,W-30,y2)+_fsT(20,y1+6,'l',{italic:true,anchor:'end'})+_fsT(20,y2+6,'m',{italic:true,anchor:'end'});
    const th=g.ang*Math.PI/180,k=1/Math.tan(th),x1=150,x2=x1-(y2-y1)*k;
    s+=_ln(x1+40*k,y1-40,x2-40*k,y2+40,{w:2})+_fsT(x1+40*k+8,y1-40,'n',{italic:true,anchor:'start'});
    // 위 교점의 오른쪽 위 각 = g
    s+=`<path d="M ${x1+30} ${y1} A 30 30 0 0 0 ${x1+30*Math.cos(th)} ${y1-30*Math.sin(th)}" fill="none" stroke="#111" stroke-width="1.4"/>`+_fsT(x1+38,y1-10,`${g.ang}°`,{anchor:'start',size:18});
    // ∠x : 동위각(아래 교점 오른쪽 위) · 엇각(아래 교점 왼쪽 아래) · 보각(아래 교점 왼쪽 위)
    const xa=g.kind==='동위각'?[0,g.ang]:g.kind==='엇각'?[180,180+g.ang]:[g.ang,180];
    const P=a=>[x2+26*Math.cos(a*Math.PI/180),y2-26*Math.sin(a*Math.PI/180)];
    const[a,b]=[P(xa[0]),P(xa[1])];s+=`<path d="M ${a[0]} ${a[1]} A 26 26 0 0 0 ${b[0]} ${b[1]}" fill="none" stroke="#111" stroke-width="1.4"/>`;
    const m=P((xa[0]+xa[1])/2).map((v,i)=>i?y2+(v-y2)*1.6:x2+(v-x2)*1.6);s+=_fsT(m[0],m[1]+6,'x',{italic:true});
    return _sv(W,250,s);
  },
  /* 이등변삼각형 : base(∠x 밑각) · ext(외각 ∠x) · bisect(꼭지각 이등분선) · tri(두 각 + 변) */
  iso_tri(g){
    const B=[60,200],C=[280,200],A=[170,48],G=[170,150];let s=`<path d="M ${A} L ${B} L ${C} Z" fill="none" stroke="#111" stroke-width="2.2"/>`;
    const tick=(P,Q)=>{const mx=(P[0]+Q[0])/2,my=(P[1]+Q[1])/2,dx=Q[0]-P[0],dy=Q[1]-P[1],L=Math.hypot(dx,dy);return _ln(mx-dy/L*7,my+dx/L*7,mx+dy/L*7,my-dx/L*7,{w:1.6});};
    const name=(P,t,dx,dy)=>_fsT(P[0]+dx,P[1]+dy,t,{sans:true,size:18});
    s+=name(A,'A',0,-10)+name(B,'B',-14,6)+name(C,'C',14,6);
    if(g.mode!=='tri')s+=tick(A,B)+tick(A,C);
    if(g.mode==='base'||g.mode==='ext'){
      s+=_angArc(A[0],A[1],_deg(...A,...C),_deg(...A,...B),24)+_fsT(A[0],A[1]+44,`${g.A}°`,{size:16});
      if(g.mode==='base'){s+=_angArc(B[0],B[1],0,_deg(...B,...A),26,'none')+_fsT(B[0]+38,B[1]-8,'x',{italic:true});}
      else{s+=_ln(C[0],C[1],C[0]+50,C[1])+`<path d="M ${C[0]+26} ${C[1]} A 26 26 0 0 0 ${C[0]+26*Math.cos(_deg(...C,...A)*Math.PI/180)} ${C[1]-26*Math.sin(_deg(...C,...A)*Math.PI/180)}" fill="none" stroke="#111" stroke-width="1.4"/>`+_fsT(C[0]+30,C[1]-22,'x',{italic:true,anchor:'start'});}
    }
    if(g.mode==='bisect'){const D=[170,200];s+=_ln(...A,...D,{w:1.8})+name(D,'D',0,24)+`<path d="M 170 188 L 182 188 L 182 200" fill="none" stroke="#111" stroke-width="1.2"/>`;
      if(g.lab.BD)s+=_dimArc(B[0],B[1],D[0],D[1],g.lab.BD,G);if(g.lab.BC)s+=_dimArc(B[0],B[1],C[0],C[1],g.lab.BC,G);}
    if(g.mode==='tri'){s+=_angArc(A[0],A[1],_deg(...A,...C),_deg(...A,...B),22)+_fsT(A[0],A[1]+42,`${g.A}°`,{size:16});
      s+=_angArc(B[0],B[1],0,_deg(...B,...A),24)+_fsT(B[0]+40,B[1]-8,`${g.B}°`,{size:16,anchor:'start'});
      s+=_dimArc(B[0],B[1],A[0],A[1],g.lab.AB,G)+_dimArc(A[0],A[1],C[0],C[1],g.lab.AC,G);}
    return _sv(340,250,s);
  },
  /* 직각삼각형 : 직각 C (또는 B), 세 변 이름표(있는 것만), ∠B 표시 */
  right_tri(g){
    const sc=Math.min(26,220/Math.max(g.a,g.b)*1),bx=60,by=200;
    const W=g.b*sc,H=g.a*sc,Bp=[bx,by],Cp=[bx+W,by],Ap=[bx+W,by-H];
    let s=`<path d="M ${Bp} L ${Cp} L ${Ap} Z" fill="none" stroke="#111" stroke-width="2.2"/><path d="M ${Cp[0]-12} ${by} L ${Cp[0]-12} ${by-12} L ${Cp[0]} ${by-12}" fill="none" stroke="#111" stroke-width="1.2"/>`;
    s+=_fsT(Ap[0]+12,Ap[1]+4,'A',{sans:true,size:18,anchor:'start'})+_fsT(Bp[0]-10,by+6,'B',{sans:true,size:18,anchor:'end'})+_fsT(Cp[0]+10,by+16,'C',{sans:true,size:18,anchor:'start'});
    if(g.angB)s+=_angArc(...Bp,0,_deg(...Bp,...Ap),26);
    const L=g.lab||{},G=[(Bp[0]+Cp[0]+Ap[0])/3,(Bp[1]+Cp[1]+Ap[1])/3];
    if(L.AB)s+=_dimArc(Bp[0],Bp[1],Ap[0],Ap[1],L.AB,G);
    if(L.BC)s+=_dimArc(Bp[0],Bp[1],Cp[0],Cp[1],L.BC,G);
    if(L.CA)s+=_dimArc(Cp[0],Cp[1],Ap[0],Ap[1],L.CA,G);
    return _sv(Math.max(300,bx+W+70),by+50,s);
  },
  /* 닮은 두 도형 */
  similar(g){
    const k=g.k;let s='';
    if(g.quad){const q=(x,y,c)=>`<path d="M ${x} ${y} L ${x+60*c} ${y} L ${x+50*c} ${y+40*c} L ${x-8*c} ${y+40*c} Z" fill="none" stroke="#111" stroke-width="2"/>`;
      s+=q(30,90,1)+q(150,40,k);s+=_fsT(30,84,'A',{sans:true,size:16})+_fsT(90,84,'D',{sans:true,size:16})+_fsT(22,148,'B',{sans:true,size:16})+_fsT(82,148,'C',{sans:true,size:16});
      s+=_fsT(150,34,'E',{sans:true,size:16})+_fsT(150+60*k,34,'H',{sans:true,size:16})+_fsT(142-8*k+8,48+40*k,'F',{sans:true,size:16})+_fsT(150+50*k,48+40*k,'G',{sans:true,size:16});
      s+=_fsT(52,160,g.l1,{size:16})+_fsT(150+20*k,62+40*k,g.l2,{size:16});if(g.l3)s+=_fsT(100,118,g.l3,{size:16,anchor:'start'});
      return _sv(160+70*k,70+40*k,s);}
    const t=(x,y,c,n)=>{const P=[[x,y],[x+70*c,y],[x+52*c,y-46*c]];return`<path d="M ${P[0]} L ${P[1]} L ${P[2]} Z" fill="none" stroke="#111" stroke-width="2"/>`
      +_fsT(P[0][0]-8,y+6,n[0],{sans:true,size:16,anchor:'end'})+_fsT(P[1][0]+8,y+6,n[1],{sans:true,size:16,anchor:'start'})+_fsT(P[2][0]+8,P[2][1],n[2],{sans:true,size:16,anchor:'start'});};
    const y=60+46*k;s+=t(24,y,1,['B','C','A'])+t(140,y,k,['E','F','D']);
    s+=_fsT(24+35,y+22,g.l1,{size:16})+_fsT(140+35*k,y+22,g.l2,{size:16});if(g.l3)s+=_fsT(24+68,y-30,g.l3,{size:16,anchor:'start'});
    return _sv(170+70*k,y+40,s);
  },
  /* 삼각형 안의 평행선 (DE ∥ BC) · 중점연결 (MN) */
  tri_par(g){
    const A=[150,30],B=[40,210],C=[290,210];let s=`<path d="M ${A} L ${B} L ${C} Z" fill="none" stroke="#111" stroke-width="2.2"/>`;
    const t=g.mode==='mid'?0.5:0.55,P=(U,V)=>[U[0]+(V[0]-U[0])*t,U[1]+(V[1]-U[1])*t];
    const D=P(A,B),E=P(A,C);s+=_ln(...D,...E,{w:2});
    const n=g.mode==='mid'?['M','N']:['D','E'];
    s+=_fsT(A[0],A[1]-8,'A',{sans:true,size:18})+_fsT(B[0]-8,B[1]+8,'B',{sans:true,size:18,anchor:'end'})+_fsT(C[0]+8,C[1]+8,'C',{sans:true,size:18,anchor:'start'});
    s+=_fsT(D[0]-10,D[1]+4,n[0],{sans:true,size:18,anchor:'end'})+_fsT(E[0]+10,E[1]+4,n[1],{sans:true,size:18,anchor:'start'});
    const L=g.lab||{},G=[160,150];
    if(L.BC)s+=_dimArc(B[0],B[1],C[0],C[1],L.BC,G);
    if(L.AD)s+=_dimArc(A[0],A[1],D[0],D[1],L.AD,G);if(L.DB)s+=_dimArc(D[0],D[1],B[0],B[1],L.DB,G);
    if(L.AE)s+=_dimArc(E[0],E[1],A[0],A[1],L.AE,G);if(L.EC)s+=_dimArc(C[0],C[1],E[0],E[1],L.EC,G);
    return _sv(330,260,s);
  },
  /* 메뉴판 · 채소와 과일 · 옷 : 묶음 이름과 항목 */
  menu(g){
    const gw=150,W=g.groups.length*(gw+14)+10;let s='',x=10;
    const H=60+Math.max(...g.groups.map(([,it])=>it.length))*28;
    g.groups.forEach(([name,items])=>{s+=`<rect x="${x}" y="20" width="${gw}" height="${H-30}" rx="8" fill="#fff" stroke="#555" stroke-width="1.6"/>`;
      s+=`<rect x="${x+gw/2-36}" y="8" width="72" height="26" rx="6" fill="#d9dce2" stroke="#555"/>`+_fsT(x+gw/2,27,name,{sans:true,bold:true,size:16});
      items.forEach((it,i)=>{s+=_fsT(x+gw/2,62+i*28,it,{sans:true,size:17});});x+=gw+14;});
    return _sv(W,H,s);
  },
  /* 주사위 */
  dice(g){
    const one=(x,y,n)=>{const P={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[n];
      return`<rect x="${x}" y="${y}" width="70" height="70" rx="12" fill="#fff" stroke="#111" stroke-width="2.2"/>`+P.map(([a,b])=>`<circle cx="${x+35+a*18}" cy="${y+35+b*18}" r="6.5" fill="#111"/>`).join('');};
    return g.n===2?_sv(220,100,one(20,15,5)+one(120,15,3)):_sv(120,100,one(25,15,5));
  },
  /* 주머니(또는 상자) 속 공 : 번호 공(n) 또는 두 색(colors:[흰,검]) */
  ballbag(g){
    const balls=g.n?Array.from({length:g.n},(_,i)=>String(i+1)):[...Array(g.colors[0]).fill('w'),...Array(g.colors[1]).fill('b')];
    const per=Math.min(5,Math.ceil(Math.sqrt(balls.length*1.6))),rows=Math.ceil(balls.length/per),R=17;
    const W=Math.max(220,per*2*R+90),H=rows*2*R+80;let s='';
    if(g.box)s+=`<rect x="20" y="30" width="${W-40}" height="${H-40}" rx="6" fill="#f8fafc" stroke="#111" stroke-width="2"/>`;
    else s+=`<path d="M ${W/2-40} 26 Q ${W/2} 40 ${W/2+40} 26 Q ${W-10} 60 ${W-20} ${H-30} Q ${W/2} ${H} 20 ${H-30} Q 10 60 ${W/2-40} 26 Z" fill="#f1f5f9" stroke="#111" stroke-width="2"/><path d="M ${W/2-18} 22 Q ${W/2} 4 ${W/2+18} 22" fill="none" stroke="#111" stroke-width="2"/>`;
    const sh=shuffle(balls);
    sh.forEach((b,i)=>{const r=Math.floor(i/per),c=i%per,cx=W/2+(c-(Math.min(per,sh.length-r*per)-1)/2)*2.1*R,cy=58+r*2.1*R;
      s+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${b==='b'?'#333':'#fff'}" stroke="#111" stroke-width="1.8"/>`;
      if(g.n)s+=_fsT(cx,cy+6,b,{size:16,sans:true,bold:true});});
    return _sv(W,H,s);
  },
  /* 일차함수 두 직선 (평행이동 · 연립방정식의 그래프) */
  lines2(g){
    const[[a1,b1],[a2,b2]]=g.l;const m=g.meet;
    const xs=[0,m?m[0]:0,-b1/a1,-b2/a2].filter(isFinite),ys=[b1,b2,m?m[1]:0];
    const w=exfWin(xs,ys,1.5);
    const P=exfPlane(w,{unit:Math.min(42,320/Math.max(w.xmax-w.xmin,w.ymax-w.ymin))});P.axes(false);
    P.fn(x=>a1*x+b1,w.xmin,w.xmax,{w:2.6});P.fn(x=>a2*x+b2,w.xmin,w.xmax,{w:2.6});
    const lx=[w.xmax-0.6,w.xmin+0.8];
    g.names.forEach((n,i)=>{const[a,b]=g.l[i],x=i?lx[1]:lx[0];P.text(x,a*x+b,n,{math:true,anchor:i?'start':'end',dy:-10,size:19});});
    if(m){P.dot(m[0],m[1],{r:4});P.guide(m[0],m[1]);P.xval(m[0]);P.yval(m[1]);}
    else{[b1,b2].forEach(b=>{if(b){P.dot(0,b,{r:4});P.yval(b,null,true);}});}
    return P.svg();
  },
  /* 원 : tangent(접선) · insc(원주각·중심각) · same(같은 호) · chord(현) */
  circ(g){
    const cx=200,cy=130,r=86;let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="2.2"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="#111"/>`+_fsT(cx+8,cy+6,'O',{anchor:'start',size:18});
    const P=a=>[+(cx+r*Math.cos(a*Math.PI/180)).toFixed(1),+(cy-r*Math.sin(a*Math.PI/180)).toFixed(1)];
    const nm=(Q,t,dx,dy)=>_fsT(Q[0]+dx,Q[1]+dy,t,{sans:true,size:18});
    if(g.mode==='tangent'){
      const p=g.angP||60,d=r/Math.sin(p/2*Math.PI/180),Px=[cx-d,cy],ta=90-p/2;
      const A=P(180-ta),B=P(180+ta);
      s+=_ln(...Px,...A)+_ln(...Px,...B)+_ln(A[0]+(A[0]-Px[0])*0.25,A[1]+(A[1]-Px[1])*0.25,...Px,{w:0})+_ln(...A,...B,{w:1.6});
      s+=nm(Px,'P',-12,6)+nm(A,'A',0,-10)+nm(B,'B',0,24);
      if(g.angP)s+=_angArc(...Px,-p/2,p/2,30)+_fsT(Px[0]+44,Px[1]+6,`${p}°`,{size:16,anchor:'start'});
      return _sv(400,260,s.replace(/<line[^>]*stroke-width="0"[^>]*\/>/g,''));
    }
    if(g.mode==='chord'){const A=P(235),B=P(305),M=[(A[0]+B[0])/2,(A[1]+B[1])/2];
      s+=_ln(...A,...B)+_ln(cx,cy,...M,{w:1.6})+nm(A,'A',-10,10)+nm(B,'B',10,10)+nm(M,'M',0,24)+`<path d="M ${M[0]-10} ${M[1]} L ${M[0]-10} ${M[1]-10} L ${M[0]} ${M[1]-10}" fill="none" stroke="#111" stroke-width="1.2"/>`;
      if(g.lab&&g.lab.AM)s+=_dimArc(A[0],A[1],M[0],M[1],g.lab.AM,[cx,cy]);
      return _sv(400,260,s);}
    if(g.mode==='same'){const A=P(220),B=P(320),C=P(40),D=P(130);
      s+=_ln(...A,...C)+_ln(...B,...C)+_ln(...A,...D)+_ln(...B,...D)+nm(A,'A',-10,14)+nm(B,'B',10,14)+nm(C,'C',12,-4)+nm(D,'D',-12,-4);
      s+=_angArc(...C,_deg(...C,...A),_deg(...C,...B),26)+_fsT(C[0]-34,C[1]+30,`${g.ang}°`,{size:16});
      return _sv(400,260,s);}
    const A=P(230),B=P(310),Pp=P(100);
    s+=_ln(...Pp,...A)+_ln(...Pp,...B)+_ln(cx,cy,...A,{w:1.6})+_ln(cx,cy,...B,{w:1.6})+nm(A,'A',-10,14)+nm(B,'B',10,14)+nm(Pp,'P',-10,-8);
    if(g.show==='ins')s+=_angArc(...Pp,_deg(...Pp,...A),_deg(...Pp,...B),26)+_fsT(Pp[0]+6,Pp[1]+44,`${g.cen/2}°`,{size:16});
    else s+=_angArc(cx,cy,_deg(cx,cy,...A),_deg(cx,cy,...B),20)+_fsT(cx,cy+42,`${g.cen}°`,{size:16});
    return _sv(400,260,s);
  },
});
