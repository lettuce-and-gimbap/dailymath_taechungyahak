// === js/math/graphSvg.js ===
/* --------------------------------------------------------------------
   그래프 → SVG 문자열 / 그래프 기반 해설 생성
   인쇄·PDF처럼 React 없이 그려야 하는 곳에서 사용
   -------------------------------------------------------------------- */

// 그래프 데이터에서 sol 재생성 — 틀 적용 시 새 문제의 올바른 값으로 계산
function genSolFromGraph(q){
  if(Array.isArray(q.sol)&&q.sol.length)return q.sol.join('\n');
  const g=q?.graph;
  if(!g)return null;
  if(g.type==='distance'){
    const{la,lb,lc,ptX,ptY}=g;
    if(la==null||lb==null||lc==null||ptX==null||ptY==null)return null;
    const num=Math.abs(la*ptX+lb*ptY+lc);
    if(num===0)return null;
    const denSq=la**2+lb**2;
    const correct=typeof distFracStr==='function'?distFracStr(num,denSq):`${num}/√${denSq}`;
    const p=v=>v<0?`(${v})`:String(v);
    const t1=la*ptX,t2=lb*ptY,t2s=t2>=0?`+${t2}`:String(t2),lcs=lc>=0?`+${lc}`:String(lc);
    return[
      `점과 직선 거리 공식: 직선 ax+by+c=0과 점(x₀,y₀) → 거리 = |ax₀+by₀+c| ÷ √(a²+b²)`,
      `a=${la}, b=${lb}, c=${lc}, 점=(${ptX}, ${ptY}) 대입`,
      `분자: |${la}×${p(ptX)}+${lb}×${p(ptY)}+${p(lc)}| = |${t1}${t2s}${lcs}| = ${num}`,
      `분모: √(${la}²+${lb}²) = √(${la**2}+${lb**2}) = √${denSq}`,
      `거리 = ${num}/√${denSq} = ${correct}`
    ].join('\n');
  }
  return null;
}

// 그래프(q.graph)를 SVG 문자열로 변환 — 인쇄 팝업 HTML에 직접 삽입용
function graphToSvgString(q){
  if(!q?.graph)return'';
  const g=q.graph;
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const wrap=(inner,w,h)=>
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #e5e7eb;border-radius:8px;background:white;display:block;margin:4px auto;overflow:visible">${inner}</svg>`;

  // ── 0. 연립방정식 ──
  if(g.type==='system_eq'){
    const{eqs}=g;
    const lH=34,pX=18,pY=16;
    const sH=pY*2+eqs.length*lH,sW=280;
    const top=pY+lH/2-2,bot=pY+(eqs.length-1)*lH+lH/2+2,mid=(top+bot)/2;
    const bx=10,ins=6;
    const bp=`M${bx+ins},${top} Q${bx},${top} ${bx},${top+8} L${bx},${mid-6} Q${bx},${mid} ${bx-ins},${mid} Q${bx},${mid} ${bx},${mid+6} L${bx},${bot-8} Q${bx},${bot} ${bx+ins},${bot}`;
    return wrap(`<path d="${bp}" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`+eqs.map((eq,i)=>`<text x="${pX}" y="${pY+(i+0.5)*lH+6}" font-size="15" font-weight="700" fill="#1e293b" font-family="monospace">${esc(eq)}</text>`).join(''),sW,sH);
  }

  // 공통 좌표계 (기본값, 유리함수만 CX/CY 다름)
  const W=220,H=180,SC=22;
  let CX=W/2,CY=H/2;
  if(g.type==='rational'){CX=W/2-g.p*SC;CY=H/2+g.q*SC;}
  const toSx=x=>CX+x*SC,toSy=y=>CY-y*SC;
  const axes=()=>{
    const tks=[-4,-3,-2,-1,1,2,3,4],lbls=[-4,-2,2,4];
    let s='';
    tks.forEach(n=>{s+=`<line x1="${toSx(n)}" y1="4" x2="${toSx(n)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="4" y1="${toSy(n)}" x2="${W-4}" y2="${toSy(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    lbls.forEach(n=>{s+=`<text x="${toSx(n)}" y="${CY+13}" text-anchor="middle" font-size="10" fill="#9ca3af" font-weight="600">${n}</text>`;s+=`<text x="${CX-6}" y="${toSy(n)+3}" text-anchor="end" font-size="10" fill="#9ca3af" font-weight="600">${n}</text>`;});
    s+=`<line x1="4" y1="${CY}" x2="${W-4}" y2="${CY}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<line x1="${CX}" y1="4" x2="${CX}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<polygon points="${W-4},${CY} ${W-12},${CY-3} ${W-12},${CY+3}" fill="#374151"/>`;
    s+=`<polygon points="${CX},4 ${CX-3},12 ${CX+3},12" fill="#374151"/>`;
    s+=`<text x="${W-3}" y="${CY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${CX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    return s;
  };

  // ── 1. 이차함수 ──
  if(g.type==='quadratic'){
    const{a,p,q:vq,ds,de}=g;
    const yDs=a*(ds-p)**2+vq,yDe=a*(de-p)**2+vq,vxInRange=p>=ds&&p<=de;
    const xPad=Math.max(0.6,(de-ds)*0.12),xLo=ds-xPad,xHi=de+xPad;
    const keyYs=[yDs,yDe,vq],rawYMin=Math.min(...keyYs),rawYMax=Math.max(...keyYs);
    const ySpan=Math.max(rawYMax-rawYMin,1),yPad=Math.max(1,ySpan*0.28);
    const yLo=rawYMin-yPad,yHi=rawYMax+yPad;
    const marg=26;
    const qSCx=Math.min(38,Math.max(12,(W-2*marg)/(xHi-xLo)));
    const qSCy=Math.min(38,Math.max(8,(H-2*marg)/(yHi-yLo)));
    const toQx=x=>marg+(x-xLo)*qSCx,toQy=y=>H-marg-(y-yLo)*qSCy;
    const axY=toQy(0),axX=toQx(0);
    const axXvis=axX>=4&&axX<=W-4,axYvis=axY>=4&&axY<=H-4;
    const allXI=[],allYI=[];
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)allXI.push(n);
    for(let n=Math.ceil(yLo);n<=Math.floor(yHi);n++)allYI.push(n);
    const xSt=Math.max(1,Math.ceil(allXI.length/5)),ySt=Math.max(1,Math.ceil(allYI.length/5));
    const pts=[],rPts=[];
    for(let xi=xLo;xi<=xHi;xi+=0.1){const yi=a*(xi-p)**2+vq;const sx=toQx(xi),sy=toQy(yi);if(sx>=-4&&sx<=W+4&&sy>=-4&&sy<=H+4)pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let xi=ds;xi<=de;xi+=0.08){const yi=a*(xi-p)**2+vq;const sx=toQx(xi),sy=toQy(yi);if(sy>=-4&&sy<=H+4)rPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    const cand=[{x:ds,y:yDs},{x:de,y:yDe}];
    if(vxInRange)cand.push({x:p,y:vq});
    const ext=a>0?cand.reduce((m,c)=>c.y<m.y?c:m):cand.reduce((m,c)=>c.y>m.y?c:m);
    const ec=a>0?'#2563eb':'#ef4444',color=a>0?'#4f46e5':'#ef4444';
    let s='';
    allXI.forEach(n=>s+=`<line x1="${toQx(n)}" y1="4" x2="${toQx(n)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`);
    allYI.forEach(n=>s+=`<line x1="4" y1="${toQy(n)}" x2="${W-4}" y2="${toQy(n)}" stroke="#eef1f6" stroke-width="0.6"/>`);
    if(axYvis)s+=`<line x1="4" y1="${axY}" x2="${W-4}" y2="${axY}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${axY} ${W-12},${axY-3} ${W-12},${axY+3}" fill="#374151"/><text x="${W-3}" y="${Math.min(axY+12,H-2)}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    if(axXvis)s+=`<line x1="${axX}" y1="4" x2="${axX}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${axX},4 ${axX-3},12 ${axX+3},12" fill="#374151"/><text x="${axX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    if(axYvis)allXI.filter((n,i)=>n!==0&&i%xSt===0&&toQx(n)>12&&toQx(n)<W-10).forEach(n=>s+=`<text x="${toQx(n)}" y="${Math.min(axY+13,H-2)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);
    if(axXvis)allYI.filter((n,i)=>n!==0&&i%ySt===0&&toQy(n)>10&&toQy(n)<H-6).forEach(n=>s+=`<text x="${Math.max(axX-6,14)}" y="${toQy(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);
    if(pts.length>1)s+=`<polyline points="${pts.join(' ')}" fill="none" stroke="#c7d2fe" stroke-width="1.4"/>`;
    if(rPts.length>1)s+=`<polyline points="${rPts.join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
    const exSx=toQx(ext.x),exSy=toQy(ext.y);
    if(axYvis)s+=`<line x1="${exSx}" y1="${exSy}" x2="${exSx}" y2="${axY}" stroke="${ec}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axXvis)s+=`<line x1="${axX}" y1="${exSy}" x2="${exSx}" y2="${exSy}" stroke="${ec}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axYvis)s+=`<text x="${exSx}" y="${Math.min(axY+13,H-2)}" text-anchor="middle" font-size="10" fill="${ec}" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${ext.x}</text>`;
    if(axXvis)s+=`<text x="${Math.max(axX-5,14)}" y="${exSy+4}" text-anchor="end" font-size="10" fill="${ec}" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${Math.round(ext.y*100)/100}</text>`;
    return wrap(s,W,H);
  }

  // ── 2. 무리함수 ──
  if(g.type==='radical'){
    const{a,p,q:vq}=g;
    const aStr=a===1?'':a===-1?'−':String(a);
    const pStr=p===0?'x':(p>0?`x−${p}`:`x+${-p}`);
    const qStr=vq===0?'':(vq>0?`+${vq}`:`−${-vq}`);
    const xLo=Math.min(0,p)-0.3,xHi=Math.max(0,p)+5.5;
    const allY=[0,vq,a*Math.sqrt(Math.max(0,xHi-p))+vq,a*Math.sqrt(xHi)];
    const yLoR=Math.min(...allY)-0.6,yHiR=Math.max(...allY)+0.8;
    const marg=22,scX=(W-2*marg)/(xHi-xLo),scY=(H-2*marg)/(yHiR-yLoR),sc=Math.min(scX,scY,28);
    const rtx=x=>marg+(x-xLo)*sc,rty=y=>H-marg-(y-yLoR)*sc;
    const axY=rty(0),axX=rtx(0),axYvis=axY>=4&&axY<=H-4,axXvis=axX>=4&&axX<=W-4;
    const xInts=[],yInts=[];
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xInts.push(n);
    for(let n=Math.ceil(yLoR);n<=Math.floor(yHiR);n++)yInts.push(n);
    const refPts=[],mainPts=[];
    for(let xi=0;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(xi);const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)refPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let xi=p;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(Math.max(0,xi-p))+vq;const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)mainPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    const refLX=Math.min(xHi*0.45,3),refLY=a*Math.sqrt(Math.max(0,refLX));
    const mnLX=p+Math.min(2.5,(xHi-p)*0.45),mnLY=a*Math.sqrt(Math.max(0,mnLX-p))+vq;
    const cRef='#9ca3af',cMain='#059669';
    let s='';
    xInts.forEach(n=>s+=`<line x1="${rtx(n)}" y1="4" x2="${rtx(n)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`);
    yInts.forEach(n=>s+=`<line x1="4" y1="${rty(n)}" x2="${W-4}" y2="${rty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`);
    if(axYvis)s+=`<line x1="4" y1="${axY}" x2="${W-4}" y2="${axY}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${axY} ${W-12},${axY-3} ${W-12},${axY+3}" fill="#374151"/><text x="${W-3}" y="${Math.min(axY+12,H-2)}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    if(axXvis)s+=`<line x1="${axX}" y1="4" x2="${axX}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${axX},4 ${axX-3},12 ${axX+3},12" fill="#374151"/><text x="${axX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    if(axYvis)xInts.filter(n=>n!==0&&rtx(n)>12&&rtx(n)<W-8).forEach(n=>s+=`<text x="${rtx(n)}" y="${Math.min(axY+13,H-2)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);
    if(axXvis)yInts.filter(n=>n!==0&&rty(n)>8&&rty(n)<H-4).forEach(n=>s+=`<text x="${Math.max(axX-5,14)}" y="${rty(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);
    if(refPts.length>1)s+=`<polyline points="${refPts.join(' ')}" fill="none" stroke="${cRef}" stroke-width="2" stroke-dasharray="5,3"/>`;
    if(refPts.length>3)s+=`<text x="${rtx(refLX)+4}" y="${rty(refLY)+(a>0?-7:9)}" font-size="9" fill="${cRef}" font-weight="bold">y=${aStr}√x</text>`;
    if(mainPts.length>1)s+=`<polyline points="${mainPts.join(' ')}" fill="none" stroke="${cMain}" stroke-width="3" stroke-linecap="round"/>`;
    if(axYvis)s+=`<line x1="${rtx(p)}" y1="${rty(vq)}" x2="${rtx(p)}" y2="${axY}" stroke="${cMain}" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axXvis)s+=`<line x1="${axX}" y1="${rty(vq)}" x2="${rtx(p)}" y2="${rty(vq)}" stroke="${cMain}" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>`;
    s+=`<circle cx="${rtx(p)}" cy="${rty(vq)}" r="4.5" fill="${cMain}" stroke="white" stroke-width="2"/>`;
    if(mainPts.length>3)s+=`<text x="${rtx(mnLX)+4}" y="${rty(mnLY)+(a>0?-7:9)}" font-size="9" fill="${cMain}" font-weight="bold">y=${aStr}√(${pStr})${qStr}</text>`;
    return wrap(s,W,H);
  }

  // ── 3. 유리함수 ──
  if(g.type==='rational'){
    const{k,p,q:vq}=g;
    const eps=0.18,ptsL=[],ptsR=[];
    for(let xi=p-6;xi<p-eps;xi+=0.12){const yi=k/(xi-p)+vq;if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4)ptsL.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);}
    for(let xi=p+eps;xi<=p+6;xi+=0.12){const yi=k/(xi-p)+vq;if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4)ptsR.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);}
    const color='#7c3aed';
    let s=axes();
    s+=`<line x1="${toSx(p)}" y1="6" x2="${toSx(p)}" y2="${H-6}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.85"/>`;
    s+=`<line x1="6" y1="${toSy(vq)}" x2="${W-6}" y2="${toSy(vq)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.85"/>`;
    s+=`<text x="${toSx(p)+4}" y="14" font-size="8" fill="#d97706" font-weight="bold">x=${p}</text>`;
    s+=`<text x="${W-28}" y="${toSy(vq)-4}" font-size="8" fill="#d97706" font-weight="bold">y=${vq}</text>`;
    if(ptsL.length>1)s+=`<polyline points="${ptsL.join(' ')}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>`;
    if(ptsR.length>1)s+=`<polyline points="${ptsR.join(' ')}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>`;
    return wrap(s,W,H);
  }

  // ── 4. 원 ──
  if(g.type==='circle'){
    const{h,k,r}=g;
    const margin=26;
    const xs=[h-r,h+r,0],ys=[k-r,k+r,0];
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const spanX=Math.max(xmax-xmin,1),spanY=Math.max(ymax-ymin,1);
    const cSC=Math.min((W-2*margin)/spanX,(H-2*margin)/spanY,26);
    const cxC=(xmin+xmax)/2,cyC=(ymin+ymax)/2;
    const ox=W/2-cxC*cSC,oy=H/2+cyC*cSC;
    const tx=x=>ox+x*cSC,ty=y=>oy-y*cSC;
    const color='#2563eb';
    const xTR=[],yTR=[];
    for(let n=Math.ceil(xmin);n<=Math.floor(xmax);n++)xTR.push(n);
    for(let n=Math.ceil(ymin);n<=Math.floor(ymax);n++)yTR.push(n);
    const xStep=Math.max(1,Math.round(xTR.length/5)),yStep=Math.max(1,Math.round(yTR.length/5));
    const axisXvis=ty(0)>=4&&ty(0)<=H-4,axisYvis=tx(0)>=4&&tx(0)<=W-4;
    let s='';
    xTR.forEach(n=>s+=`<line x1="${tx(n)}" y1="4" x2="${tx(n)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`);
    yTR.forEach(n=>s+=`<line x1="4" y1="${ty(n)}" x2="${W-4}" y2="${ty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`);
    if(axisXvis)s+=`<line x1="4" y1="${ty(0)}" x2="${W-4}" y2="${ty(0)}" stroke="#374151" stroke-width="1.8"/>`;
    if(axisYvis)s+=`<line x1="${tx(0)}" y1="4" x2="${tx(0)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/>`;
    if(axisXvis)xTR.filter((n,i)=>n!==0&&i%xStep===0).forEach(n=>s+=`<text x="${tx(n)}" y="${Math.min(ty(0)+13,H-2)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);
    if(axisYvis)yTR.filter((n,i)=>n!==0&&i%yStep===0).forEach(n=>s+=`<text x="${Math.max(tx(0)-6,12)}" y="${ty(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);
    s+=`<circle cx="${tx(h)}" cy="${ty(k)}" r="${r*cSC}" fill="rgba(37,99,235,0.06)" stroke="${color}" stroke-width="2.5"/>`;
    s+=`<line x1="${tx(h)}" y1="${ty(k)}" x2="${tx(h+r)}" y2="${ty(k)}" stroke="${color}" stroke-width="1.8" stroke-dasharray="4,3"/>`;
    s+=`<text x="${tx(h+r/2)}" y="${ty(k)-7}" text-anchor="middle" font-size="12" fill="${color}" font-weight="900" stroke="white" stroke-width="3" paint-order="stroke">r=${r}</text>`;
    s+=`<circle cx="${tx(h)}" cy="${ty(k)}" r="4.5" fill="${color}" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${tx(h)}" y="${ty(k)+(k>=0?20:-12)}" text-anchor="middle" font-size="12" fill="${color}" font-weight="900" stroke="white" stroke-width="3.5" paint-order="stroke">중심(${h},${k})</text>`;
    return wrap(s,W,H);
  }

  // ── 5. 점과 직선 거리 ──
  if(g.type==='distance'){
    const{ptX,ptY,la,lb,lc}=g;
    const color='#ea580c';
    const linePoints=[];
    if(Math.abs(lb)>0.001){[-5,5].forEach(xi=>{const yi=-(la*xi+lc)/lb;linePoints.push([toSx(xi),toSy(yi)]);});}
    else if(Math.abs(la)>0.001){const xi=-lc/la;linePoints.push([toSx(xi),4],[toSx(xi),H-4]);}
    const denSq=la**2+lb**2,nV=la*ptX+lb*ptY+lc;
    const fX=denSq>0?ptX-la*nV/denSq:ptX,fY=denSq>0?ptY-lb*nV/denSq:ptY;
    let s=axes();
    if(linePoints.length===2)s+=`<line x1="${linePoints[0][0]}" y1="${linePoints[0][1]}" x2="${linePoints[1][0]}" y2="${linePoints[1][1]}" stroke="#374151" stroke-width="2" stroke-linecap="round"/>`;
    s+=`<line x1="${toSx(ptX)}" y1="${toSy(ptY)}" x2="${toSx(fX)}" y2="${toSy(fY)}" stroke="${color}" stroke-width="2" stroke-dasharray="4,3"/>`;
    s+=`<circle cx="${toSx(ptX)}" cy="${toSy(ptY)}" r="5" fill="${color}" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${toSx(ptX)+7}" y="${toSy(ptY)-5}" font-size="9" fill="${color}" font-weight="bold">(${ptX},${ptY})</text>`;
    s+=`<circle cx="${toSx(fX)}" cy="${toSy(fY)}" r="3" fill="white" stroke="${color}" stroke-width="2"/>`;
    s+=`<text x="8" y="14" font-size="9" fill="#374151" font-weight="bold">${la}x${lb>=0?'+'+lb:lb}y${lc>=0?'+'+lc:lc}=0</text>`;
    return wrap(s,W,H);
  }

  // ── 6. 대칭이동 (점+축 표시) ──
  if(g.type==='symmetry'){
    const{px,py,sym}=g;
    const symLP=[];
    if(sym==='y=x'){symLP.push([toSx(-4),toSy(-4)],[toSx(4),toSy(4)]);}
    else if(sym==='y=-x'){symLP.push([toSx(-4),toSy(4)],[toSx(4),toSy(-4)]);}
    let s=axes();
    if(symLP.length===2)s+=`<line x1="${symLP[0][0]}" y1="${symLP[0][1]}" x2="${symLP[1][0]}" y2="${symLP[1][1]}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    if(sym==='원점')s+=`<circle cx="${toSx(0)}" cy="${toSy(0)}" r="5" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>`;
    s+=`<circle cx="${toSx(px)}" cy="${toSy(py)}" r="5" fill="#6b7280" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${toSx(px)+7}" y="${toSy(py)-5}" font-size="9" fill="#6b7280" font-weight="bold">(${px},${py})</text>`;
    s+=`<text x="${W/2}" y="${H-5}" text-anchor="middle" font-size="9" fill="#f59e0b" font-weight="bold">${esc(sym)} 대칭</text>`;
    return wrap(s,W,H);
  }

  // ── 6b. 두 점 사이의 거리 ──
  if(g.type==='two_point'){
    const{x1,y1,x2,y2}=g;
    const tpCX=W/2-((x1+x2)/2)*SC,tpCY=H/2+((y1+y2)/2)*SC;
    const tpx=x=>tpCX+x*SC,tpy=y=>tpCY-y*SC;
    const tks=[-4,-3,-2,-1,1,2,3,4],lbls=[-4,-2,2,4];
    let s='';
    tks.forEach(n=>{s+=`<line x1="${tpx(n)}" y1="4" x2="${tpx(n)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="4" y1="${tpy(n)}" x2="${W-4}" y2="${tpy(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    lbls.forEach(n=>{s+=`<text x="${tpx(n)}" y="${tpCY+13}" text-anchor="middle" font-size="10" fill="#9ca3af" font-weight="600">${n}</text>`;s+=`<text x="${tpCX-6}" y="${tpy(n)+3}" text-anchor="end" font-size="10" fill="#9ca3af" font-weight="600">${n}</text>`;});
    s+=`<line x1="4" y1="${tpCY}" x2="${W-4}" y2="${tpCY}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<line x1="${tpCX}" y1="4" x2="${tpCX}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<polygon points="${W-4},${tpCY} ${W-12},${tpCY-3} ${W-12},${tpCY+3}" fill="#374151"/>`;
    s+=`<polygon points="${tpCX},4 ${tpCX-3},12 ${tpCX+3},12" fill="#374151"/>`;
    s+=`<text x="${W-3}" y="${tpCY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${tpCX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    s+=`<line x1="${tpx(x1)}" y1="${tpy(y1)}" x2="${tpx(x2)}" y2="${tpy(y2)}" stroke="#6366f1" stroke-width="2" stroke-dasharray="5,3"/>`;
    s+=`<circle cx="${tpx(x1)}" cy="${tpy(y1)}" r="5" fill="#4f46e5" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${tpx(x1)+8}" y="${tpy(y1)-6}" font-size="9" font-weight="bold" fill="#4f46e5">A(${x1},${y1})</text>`;
    s+=`<circle cx="${tpx(x2)}" cy="${tpy(y2)}" r="5" fill="#dc2626" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${tpx(x2)+8}" y="${tpy(y2)-6}" font-size="9" font-weight="bold" fill="#dc2626">B(${x2},${y2})</text>`;
    return wrap(s,W,H);
  }

  // ── 7. 합성함수 ──
  if(g.type==='composite_map'){
    const{X,Y,Z,f_map,g_map,inp}=g;
    const n=X.length,svgW=320,svgH=Math.max(200,n*38+60);
    const lx=54,mx=160,rzx=266,oy=svgH/2;
    const ovalRy=Math.min(70,n*14+18),ovalRx=40;
    const spY=Math.min(32,(ovalRy*2-20)/Math.max(n-1,1));
    const baseY=oy-(n-1)*spY/2;
    const pXf=i=>({x:lx,y:baseY+i*spY}),pYf=i=>({x:mx,y:baseY+i*spY}),pZf=i=>({x:rzx,y:baseY+i*spY});
    const cG='#059669',cI='#6366f1',cR='#ef4444';
    const mkArrow=(sx2,sy2,ex2,ey2,col,thick)=>{
      const ang=Math.atan2(ey2-sy2,ex2-sx2),al=8,aw=4;
      const ax1=ex2-al*Math.cos(ang)+aw*Math.sin(ang),ay1=ey2-al*Math.sin(ang)-aw*Math.cos(ang);
      const ax2=ex2-al*Math.cos(ang)-aw*Math.sin(ang),ay2=ey2-al*Math.sin(ang)+aw*Math.cos(ang);
      return`<line x1="${sx2}" y1="${sy2}" x2="${ex2}" y2="${ey2}" stroke="${col}" stroke-width="${thick}"/><polygon points="${ex2},${ey2} ${ax1},${ay1} ${ax2},${ay2}" fill="${col}"/>`;
    };
    let s='';
    s+=`<ellipse cx="${lx}" cy="${oy}" rx="${ovalRx}" ry="${ovalRy}" fill="rgba(16,185,129,0.07)" stroke="${cG}" stroke-width="2"/>`;
    s+=`<ellipse cx="${mx}" cy="${oy}" rx="${ovalRx}" ry="${ovalRy}" fill="rgba(99,102,241,0.07)" stroke="${cI}" stroke-width="2"/>`;
    s+=`<ellipse cx="${rzx}" cy="${oy}" rx="${ovalRx}" ry="${ovalRy}" fill="rgba(239,68,68,0.07)" stroke="${cR}" stroke-width="2"/>`;
    s+=`<text x="${lx}" y="${oy-ovalRy-8}" text-anchor="middle" font-size="14" fill="${cG}" font-weight="900">X</text>`;
    s+=`<text x="${mx}" y="${oy-ovalRy-8}" text-anchor="middle" font-size="14" fill="${cI}" font-weight="900">Y</text>`;
    s+=`<text x="${rzx}" y="${oy-ovalRy-8}" text-anchor="middle" font-size="14" fill="${cR}" font-weight="900">Z</text>`;
    s+=`<text x="${(lx+mx)/2}" y="${oy-ovalRy-22}" text-anchor="middle" font-size="11" fill="${cG}" font-weight="bold">f</text>`;
    s+=`<text x="${(mx+rzx)/2}" y="${oy-ovalRy-22}" text-anchor="middle" font-size="11" fill="${cI}" font-weight="bold">g</text>`;
    X.forEach((x,i)=>{const p=pXf(i);s+=`<text x="${p.x}" y="${p.y+5}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="700">${esc(String(x))}</text>`;});
    Y.forEach((y,i)=>{const p=pYf(i);s+=`<text x="${p.x}" y="${p.y+5}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="700">${esc(String(y))}</text>`;});
    Z.forEach((z,i)=>{const p=pZf(i);s+=`<text x="${p.x}" y="${p.y+5}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="700">${esc(String(z))}</text>`;});
    f_map.forEach(([x,y])=>{const xi=X.indexOf(x),yi=Y.indexOf(y);const sp=pXf(xi),ep=pYf(yi);s+=mkArrow(sp.x+ovalRx-4,sp.y,ep.x-ovalRx+4,ep.y,cG,1.5);});
    g_map.forEach(([y,z])=>{const yi=Y.indexOf(y),zi=Z.indexOf(z);const sp=pYf(yi),ep=pZf(zi);s+=mkArrow(sp.x+ovalRx-4,sp.y,ep.x-ovalRx+4,ep.y,cI,1.5);});
    s+=`<text x="${svgW/2}" y="${svgH-6}" text-anchor="middle" font-size="11" fill="${cR}" font-weight="bold">(g∘f)(${inp}) = ?</text>`;
    return wrap(s,svgW,svgH);
  }

  // ── 8. 역함수 ──
  if(g.type==='inverse_map'){
    const{X,Y,f_map,ask_y}=g;
    const n=X.length,svgW=240,svgH=190;
    const leftCX=68,rightCX=172,ovalCY=svgH/2;
    const ovalRX=42,ovalRY=Math.min(72,n*16+16);
    const ySpacing=Math.min(28,(ovalRY*2-20)/Math.max(n-1,1));
    const baseY=ovalCY-(n-1)*ySpacing/2;
    const gXp=i=>({x:leftCX,y:baseY+i*ySpacing}),gYp=i=>({x:rightCX,y:baseY+i*ySpacing});
    const aC='#6366f1',xC='#059669',hC='#ef4444';
    let s='';
    s+=`<ellipse cx="${leftCX}" cy="${ovalCY}" rx="${ovalRX}" ry="${ovalRY}" fill="rgba(16,185,129,0.07)" stroke="${xC}" stroke-width="2"/>`;
    s+=`<ellipse cx="${rightCX}" cy="${ovalCY}" rx="${ovalRX}" ry="${ovalRY}" fill="rgba(99,102,241,0.07)" stroke="${aC}" stroke-width="2"/>`;
    s+=`<text x="${leftCX}" y="${ovalCY-ovalRY-10}" text-anchor="middle" font-size="14" fill="${xC}" font-weight="900">X</text>`;
    s+=`<text x="${rightCX}" y="${ovalCY-ovalRY-10}" text-anchor="middle" font-size="14" fill="${aC}" font-weight="900">Y</text>`;
    X.forEach((x,i)=>{const p=gXp(i);s+=`<text x="${p.x}" y="${p.y+5}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="700">${esc(String(x))}</text>`;});
    Y.forEach((y,i)=>{const p=gYp(i);s+=`<text x="${p.x}" y="${p.y+5}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="700">${esc(String(y))}</text>`;});
    f_map.forEach(([x,y])=>{
      const xi=X.indexOf(x),yi=Y.indexOf(y);
      const sp=gXp(xi),ep=gYp(yi);
      const sx2=sp.x+ovalRX-5,sy2=sp.y,ex2=ep.x-ovalRX+5,ey2=ep.y;
      const ang=Math.atan2(ey2-sy2,ex2-sx2),al=8,aw=4;
      const ax1=ex2-al*Math.cos(ang)+aw*Math.sin(ang),ay1=ey2-al*Math.sin(ang)-aw*Math.cos(ang);
      const ax2=ex2-al*Math.cos(ang)-aw*Math.sin(ang),ay2=ey2-al*Math.sin(ang)+aw*Math.cos(ang);
      s+=`<line x1="${sx2}" y1="${sy2}" x2="${ex2}" y2="${ey2}" stroke="${aC}" stroke-width="1.6"/>`;
      s+=`<polygon points="${ex2},${ey2} ${ax1},${ay1} ${ax2},${ay2}" fill="${aC}"/>`;
    });
    s+=`<text x="${svgW/2}" y="${svgH-7}" text-anchor="middle" font-size="10" fill="${hC}" font-weight="bold">f⁻¹(${ask_y}) = ?</text>`;
    return wrap(s,svgW,svgH);
  }

  // ── 9. 내분점 (수직선) ──
  if(g.type==='section_1d'){
    const{a,b,p,m,n}=g;
    const sW=280,sH=88,lx=40,rx=240,cy=50;
    const range=b-a||1,toX=v=>lx+(v-a)/range*(rx-lx);
    const ax_=toX(a),px_=toX(p),bx_=toX(b);
    let s=`<line x1="${lx-16}" y1="${cy}" x2="${rx+16}" y2="${cy}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<polygon points="${rx+16},${cy} ${rx+8},${cy-3.5} ${rx+8},${cy+3.5}" fill="#374151"/>`;
    s+=`<line x1="${ax_+2}" y1="${cy-13}" x2="${px_-2}" y2="${cy-13}" stroke="#059669" stroke-width="1.4"/>`;
    s+=`<line x1="${ax_+2}" y1="${cy-10}" x2="${ax_+2}" y2="${cy-16}" stroke="#059669" stroke-width="1.2"/>`;
    s+=`<line x1="${px_-2}" y1="${cy-10}" x2="${px_-2}" y2="${cy-16}" stroke="#059669" stroke-width="1.2"/>`;
    s+=`<text x="${(ax_+px_)/2}" y="${cy-17}" text-anchor="middle" font-size="12" fill="#059669" font-weight="bold">${m}</text>`;
    s+=`<line x1="${px_+2}" y1="${cy-13}" x2="${bx_-2}" y2="${cy-13}" stroke="#6366f1" stroke-width="1.4"/>`;
    s+=`<line x1="${px_+2}" y1="${cy-10}" x2="${px_+2}" y2="${cy-16}" stroke="#6366f1" stroke-width="1.2"/>`;
    s+=`<line x1="${bx_-2}" y1="${cy-10}" x2="${bx_-2}" y2="${cy-16}" stroke="#6366f1" stroke-width="1.2"/>`;
    s+=`<text x="${(px_+bx_)/2}" y="${cy-17}" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="bold">${n}</text>`;
    s+=`<circle cx="${ax_}" cy="${cy}" r="5" fill="#059669"/>`;
    s+=`<text x="${ax_}" y="${cy+20}" text-anchor="middle" font-size="12" fill="#059669" font-weight="bold">A(${a})</text>`;
    s+=`<circle cx="${px_}" cy="${cy}" r="6" fill="#ef4444"/>`;
    s+=`<text x="${px_}" y="${cy+20}" text-anchor="middle" font-size="12" fill="#ef4444" font-weight="bold">P( ? )</text>`;
    s+=`<circle cx="${bx_}" cy="${cy}" r="5" fill="#6366f1"/>`;
    s+=`<text x="${bx_}" y="${cy+20}" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="bold">B(${b})</text>`;
    return wrap(s,sW,sH);
  }

  // ── 10. 내분점 (좌표평면) ──
  if(g.type==='section_2d'){
    const{ax:gax,ay:gay,bx:gbx,by:gby,px:gpx,py:gpy,m,n}=g;
    const sW=240,sH=200,pad=24;
    const allX=[gax,gbx,gpx],allY=[gay,gby,gpy];
    const minX=Math.min(...allX),maxX=Math.max(...allX),minY=Math.min(...allY),maxY=Math.max(...allY);
    const spanX=Math.max(maxX-minX,1),spanY=Math.max(maxY-minY,1);
    const vxLo=Math.min(minX,-0.5)-spanX*0.25,vxHi=Math.max(maxX,0.5)+spanX*0.25;
    const vyLo=Math.min(minY,-0.5)-spanY*0.25,vyHi=Math.max(maxY,0.5)+spanY*0.25;
    const toSX=x=>pad+(x-vxLo)/(vxHi-vxLo)*(sW-2*pad);
    const toSY=y=>(sH-pad)-(y-vyLo)/(vyHi-vyLo)*(sH-2*pad);
    const sAx=toSX(gax),sAy=toSY(gay),sBx=toSX(gbx),sBy=toSY(gby),sPx=toSX(gpx),sPy=toSY(gpy);
    const ox=toSX(0),oy=toSY(0),midX=(sAx+sBx)/2,midY=(sAy+sBy)/2;
    const aLbl={dx:sAx<midX?-4:4,dy:sAy<midY?-10:14};
    const bLbl={dx:sBx<midX?-4:4,dy:sBy<midY?-10:14};
    let s='';
    if(ox>pad&&ox<sW-pad)s+=`<line x1="${ox}" y1="${pad}" x2="${ox}" y2="${sH-pad}" stroke="#d1d5db" stroke-width="1.2"/>`;
    if(oy>pad&&oy<sH-pad)s+=`<line x1="${pad}" y1="${oy}" x2="${sW-pad}" y2="${oy}" stroke="#d1d5db" stroke-width="1.2"/>`;
    if(ox>pad&&ox<sW-pad)s+=`<text x="${ox+4}" y="${pad+10}" font-size="10" fill="#9ca3af" font-weight="bold">y</text>`;
    if(oy>pad&&oy<sH-pad)s+=`<text x="${sW-pad-4}" y="${oy-4}" font-size="10" fill="#9ca3af" font-weight="bold">x</text>`;
    s+=`<line x1="${sAx}" y1="${sAy}" x2="${sBx}" y2="${sBy}" stroke="#94a3b8" stroke-width="1.8"/>`;
    s+=`<text x="${(sAx+sPx)/2}" y="${(sAy+sPy)/2-7}" text-anchor="middle" font-size="11" fill="#059669" font-weight="bold">${m}</text>`;
    s+=`<text x="${(sPx+sBx)/2}" y="${(sPy+sBy)/2-7}" text-anchor="middle" font-size="11" fill="#6366f1" font-weight="bold">${n}</text>`;
    s+=`<circle cx="${sAx}" cy="${sAy}" r="5" fill="#059669"/>`;
    s+=`<text x="${sAx+aLbl.dx}" y="${sAy+aLbl.dy}" text-anchor="${aLbl.dx<0?'end':'start'}" font-size="11" fill="#059669" font-weight="bold">A(${gax},${gay})</text>`;
    s+=`<circle cx="${sBx}" cy="${sBy}" r="5" fill="#6366f1"/>`;
    s+=`<text x="${sBx+bLbl.dx}" y="${sBy+bLbl.dy}" text-anchor="${bLbl.dx<0?'end':'start'}" font-size="11" fill="#6366f1" font-weight="bold">B(${gbx},${gby})</text>`;
    s+=`<circle cx="${sPx}" cy="${sPy}" r="6.5" fill="#ef4444"/>`;
    s+=`<text x="${sPx+5}" y="${sPy+16}" font-size="11" fill="#ef4444" font-weight="bold">P( ? )</text>`;
    return wrap(s,sW,sH);
  }

  // ── 11. 이등변삼각형 ──
  if(g.type==='iso_triangle'){
    const{apex}=g;
    const sW=220,sH=170,Ax=110,Ay=24,By=146,Bx=44,Cx2=176;
    let s=`<polygon points="${Ax},${Ay} ${Bx},${By} ${Cx2},${By}" fill="rgba(99,102,241,0.06)" stroke="#6366f1" stroke-width="2"/>`;
    s+=`<line x1="${(Ax+Bx)/2-5}" y1="${(Ay+By)/2}" x2="${(Ax+Bx)/2+5}" y2="${(Ay+By)/2}" stroke="#059669" stroke-width="2"/>`;
    s+=`<line x1="${(Ax+Cx2)/2-5}" y1="${(Ay+By)/2}" x2="${(Ax+Cx2)/2+5}" y2="${(Ay+By)/2}" stroke="#059669" stroke-width="2"/>`;
    s+=`<text x="${Ax}" y="${Ay-6}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="900">A</text>`;
    s+=`<text x="${Bx-10}" y="${By+6}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="900">B</text>`;
    s+=`<text x="${Cx2+10}" y="${By+6}" text-anchor="middle" font-size="13" fill="#1f2937" font-weight="900">C</text>`;
    s+=`<text x="${Ax}" y="${Ay+22}" text-anchor="middle" font-size="12" fill="#ef4444" font-weight="900">${apex}°</text>`;
    s+=`<text x="${Bx+18}" y="${By-8}" text-anchor="middle" font-size="12" fill="#ef4444" font-weight="900">?</text>`;
    return wrap(s,sW,sH);
  }

  // ── 12. 평행선과 각 ──
  if(g.type==='parallel_lines'){
    const{ang,kind}=g;
    const sW=240,sH=180,l_y=52,m_y=128;
    const nx1=46,ny1=170,nx2=196,ny2=14;
    const slope=(ny2-ny1)/(nx2-nx1),xAt=y=>nx1+(y-ny1)/slope;
    const Pl={x:xAt(l_y),y:l_y},Pm={x:xAt(m_y),y:m_y};
    let s=`<line x1="20" y1="${l_y}" x2="220" y2="${l_y}" stroke="#374151" stroke-width="2"/>`;
    s+=`<line x1="20" y1="${m_y}" x2="220" y2="${m_y}" stroke="#374151" stroke-width="2"/>`;
    s+=`<line x1="${nx1}" y1="${ny1}" x2="${nx2}" y2="${ny2}" stroke="#6366f1" stroke-width="2"/>`;
    s+=`<text x="210" y="${l_y-6}" font-size="12" fill="#374151" font-weight="900">l</text>`;
    s+=`<text x="210" y="${m_y-6}" font-size="12" fill="#374151" font-weight="900">m</text>`;
    s+=`<text x="${nx2+2}" y="${ny2+4}" font-size="12" fill="#6366f1" font-weight="900">n</text>`;
    s+=`<text x="${Pm.x+8}" y="${m_y-8}" font-size="12" fill="#059669" font-weight="900">∠a=${ang}°</text>`;
    s+=`<text x="${Pl.x+8}" y="${l_y-8}" font-size="12" fill="#ef4444" font-weight="900">∠b=?</text>`;
    s+=`<circle cx="${Pl.x}" cy="${Pl.y}" r="3" fill="#ef4444"/>`;
    s+=`<circle cx="${Pm.x}" cy="${Pm.y}" r="3" fill="#059669"/>`;
    s+=`<text x="${sW/2}" y="${sH-6}" text-anchor="middle" font-size="10" fill="#9ca3af" font-weight="bold">l ∥ m · ${esc(kind)}</text>`;
    return wrap(s,sW,sH);
  }

  // ── 13. 직각삼각형 ──
  if(g.type==='right_triangle'){
    const{adj,opp,hyp}=g;
    const sW=230,sH=175,Cx=58,Cy=140,Bx=190,By=140,TAx=58,TAy=30;
    let s=`<polygon points="${Cx},${Cy} ${Bx},${By} ${TAx},${TAy}" fill="rgba(99,102,241,0.06)" stroke="#6366f1" stroke-width="2"/>`;
    s+=`<rect x="${Cx}" y="${Cy-14}" width="14" height="14" fill="none" stroke="#374151" stroke-width="1.4"/>`;
    s+=`<text x="${Cx-12}" y="${Cy+12}" font-size="13" fill="#1f2937" font-weight="900">C</text>`;
    s+=`<text x="${Bx+8}" y="${By+12}" font-size="13" fill="#1f2937" font-weight="900">B</text>`;
    s+=`<text x="${TAx-12}" y="${TAy-2}" font-size="13" fill="#1f2937" font-weight="900">A</text>`;
    s+=`<text x="${(Cx+Bx)/2}" y="${By+18}" text-anchor="middle" font-size="12" fill="#059669" font-weight="900">${adj}</text>`;
    s+=`<text x="${Cx-10}" y="${(Cy+TAy)/2}" text-anchor="middle" font-size="12" fill="#059669" font-weight="900">${opp}</text>`;
    s+=`<text x="${(Bx+TAx)/2+10}" y="${(By+TAy)/2-4}" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="900">${hyp}</text>`;
    s+=`<text x="${Bx-26}" y="${By-6}" font-size="12" fill="#ef4444" font-weight="900">B</text>`;
    return wrap(s,sW,sH);
  }

  // ── 14. 일차함수 ──
  if(g.type==='linear'){
    const{a,b:b2,x0,y0}=g;
    const lW=200,lH=180,lSC=18,lCX=lW/2,lCY=lH/2;
    const ltx=x=>lCX+x*lSC,lty=y=>lCY-y*lSC;
    const xr=(lW/2-10)/lSC;
    let lx1=-xr,lx2=xr,lyy1=a*lx1+b2,lyy2=a*lx2+b2;
    const yr=(lH/2-10)/lSC;
    const cl=(x,y)=>{if(y>yr){x=(yr-b2)/a;y=yr;}else if(y<-yr){x=(-yr-b2)/a;y=-yr;}return[x,y];};
    [lx1,lyy1]=cl(lx1,lyy1);[lx2,lyy2]=cl(lx2,lyy2);
    const tks=[-4,-2,2,4];
    let s='';
    tks.forEach(n=>{s+=`<line x1="${ltx(n)}" y1="6" x2="${ltx(n)}" y2="${lH-6}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="6" y1="${lty(n)}" x2="${lW-6}" y2="${lty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    s+=`<line x1="6" y1="${lCY}" x2="${lW-6}" y2="${lCY}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<line x1="${lCX}" y1="6" x2="${lCX}" y2="${lH-6}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<text x="${lW-8}" y="${lCY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${lCX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    tks.forEach(n=>{s+=`<text x="${ltx(n)}" y="${lCY+12}" text-anchor="middle" font-size="9" fill="#9ca3af">${n}</text>`;s+=`<text x="${lCX-5}" y="${lty(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af">${n}</text>`;});
    s+=`<line x1="${ltx(lx1)}" y1="${lty(lyy1)}" x2="${ltx(lx2)}" y2="${lty(lyy2)}" stroke="#6366f1" stroke-width="2.4"/>`;
    s+=`<circle cx="${ltx(0)}" cy="${lty(b2)}" r="4" fill="#059669"/>`;
    if(x0!==undefined){s+=`<line x1="${ltx(x0)}" y1="${lty(0)}" x2="${ltx(x0)}" y2="${lty(y0)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 2"/>`;s+=`<line x1="${ltx(0)}" y1="${lty(y0)}" x2="${ltx(x0)}" y2="${lty(y0)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 2"/>`;s+=`<circle cx="${ltx(x0)}" cy="${lty(y0)}" r="5" fill="#ef4444"/>`;s+=`<text x="${ltx(x0)+6}" y="${lty(y0)-6}" font-size="11" fill="#ef4444" font-weight="900">(${x0}, ${y0})</text>`;}
    return wrap(s,lW,lH);
  }

  // ── 15. 좌표평면 점 찍기 ──
  if(g.type==='point_plot'){
    const{px:gpx,py:gpy}=g;
    const pW=190,pH=190,pSC=18,pCX=pW/2,pCY=pH/2;
    const ptx=x=>pCX+x*pSC,pty=y=>pCY-y*pSC;
    const tks=[-4,-2,2,4];
    let s='';
    tks.forEach(n=>{s+=`<line x1="${ptx(n)}" y1="6" x2="${ptx(n)}" y2="${pH-6}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="6" y1="${pty(n)}" x2="${pW-6}" y2="${pty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    [[pCX+45,pCY-50,'Ⅰ'],[pCX-45,pCY-50,'Ⅱ'],[pCX-45,pCY+55,'Ⅲ'],[pCX+45,pCY+55,'Ⅳ']].forEach(([x,y,t])=>s+=`<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#d1d5db" font-weight="900">${t}</text>`);
    s+=`<line x1="6" y1="${pCY}" x2="${pW-6}" y2="${pCY}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<line x1="${pCX}" y1="6" x2="${pCX}" y2="${pH-6}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<text x="${pW-8}" y="${pCY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${pCX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    tks.forEach(n=>{s+=`<text x="${ptx(n)}" y="${pCY+12}" text-anchor="middle" font-size="9" fill="#9ca3af">${n}</text>`;s+=`<text x="${pCX-5}" y="${pty(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af">${n}</text>`;});
    s+=`<line x1="${ptx(gpx)}" y1="${pty(0)}" x2="${ptx(gpx)}" y2="${pty(gpy)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 2"/>`;
    s+=`<line x1="${ptx(0)}" y1="${pty(gpy)}" x2="${ptx(gpx)}" y2="${pty(gpy)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 2"/>`;
    s+=`<circle cx="${ptx(gpx)}" cy="${pty(gpy)}" r="5.5" fill="#ef4444"/>`;
    s+=`<text x="${ptx(gpx)+(gpx>0?6:-6)}" y="${pty(gpy)+(gpy>0?-7:14)}" text-anchor="${gpx>0?'start':'end'}" font-size="11" fill="#ef4444" font-weight="900">P(${gpx}, ${gpy})</text>`;
    return wrap(s,pW,pH);
  }

  // ── 16. 평행이동 ──
  if(g.type==='translate_point'){
    const{px:gpx,py:gpy,rx:grx,ry:gry}=g;
    const tpW=200,tpH=200,tpSC=18,tpCX=tpW/2,tpCY=tpH/2;
    const ttx=x=>tpCX+x*tpSC,tty=y=>tpCY-y*tpSC;
    const tks=[-4,-2,2,4];
    let s='';
    tks.forEach(n=>{s+=`<line x1="${ttx(n)}" y1="6" x2="${ttx(n)}" y2="${tpH-6}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="6" y1="${tty(n)}" x2="${tpW-6}" y2="${tty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    s+=`<line x1="6" y1="${tpCY}" x2="${tpW-6}" y2="${tpCY}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<line x1="${tpCX}" y1="6" x2="${tpCX}" y2="${tpH-6}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<text x="${tpW-8}" y="${tpCY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${tpCX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    tks.forEach(n=>{s+=`<text x="${ttx(n)}" y="${tpCY+12}" text-anchor="middle" font-size="9" fill="#9ca3af">${n}</text>`;s+=`<text x="${tpCX-5}" y="${tty(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af">${n}</text>`;});
    s+=`<defs><marker id="tp_arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#6366f1"/></marker></defs>`;
    s+=`<line x1="${ttx(gpx)}" y1="${tty(gpy)}" x2="${ttx(grx)}" y2="${tty(gry)}" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#tp_arr)"/>`;
    s+=`<circle cx="${ttx(gpx)}" cy="${tty(gpy)}" r="5" fill="#6b7280" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${ttx(gpx)+(gpx>0?7:-7)}" y="${tty(gpy)-6}" text-anchor="${gpx>0?'start':'end'}" font-size="10" fill="#6b7280" font-weight="900">P(${gpx},${gpy})</text>`;
    s+=`<circle cx="${ttx(grx)}" cy="${tty(gry)}" r="5" fill="#6366f1" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${ttx(grx)+(grx>0?7:-7)}" y="${tty(gry)-6}" text-anchor="${grx>0?'start':'end'}" font-size="10" fill="#6366f1" font-weight="900">Q(${grx},${gry})</text>`;
    return wrap(s,tpW,tpH);
  }

  // ── 17. 대칭이동 (두 점) ──
  if(g.type==='symmetry_point'){
    const{px:gpx,py:gpy,rx:grx,ry:gry,sym}=g;
    const spW=200,spH=200,spSC=18,spCX=spW/2,spCY=spH/2;
    const spx=x=>spCX+x*spSC,spy=y=>spCY-y*spSC;
    const tks=[-4,-2,2,4];
    let s='';
    tks.forEach(n=>{s+=`<line x1="${spx(n)}" y1="6" x2="${spx(n)}" y2="${spH-6}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="6" y1="${spy(n)}" x2="${spW-6}" y2="${spy(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    s+=`<line x1="6" y1="${spCY}" x2="${spW-6}" y2="${spCY}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<line x1="${spCX}" y1="6" x2="${spCX}" y2="${spH-6}" stroke="#374151" stroke-width="1.6"/>`;
    s+=`<text x="${spW-8}" y="${spCY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${spCX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    tks.forEach(n=>{s+=`<text x="${spx(n)}" y="${spCY+12}" text-anchor="middle" font-size="9" fill="#9ca3af">${n}</text>`;s+=`<text x="${spCX-5}" y="${spy(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af">${n}</text>`;});
    if(sym==='x축')s+=`<line x1="6" y1="${spCY}" x2="${spW-6}" y2="${spCY}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,3"/>`;
    if(sym==='y축')s+=`<line x1="${spCX}" y1="6" x2="${spCX}" y2="${spH-6}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,3"/>`;
    if(sym==='원점')s+=`<circle cx="${spCX}" cy="${spCY}" r="6" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>`;
    s+=`<text x="${spW/2}" y="${spH-3}" text-anchor="middle" font-size="9" fill="#f59e0b" font-weight="bold">${esc(sym)} 대칭</text>`;
    s+=`<line x1="${spx(gpx)}" y1="${spy(gpy)}" x2="${spx(grx)}" y2="${spy(gry)}" stroke="#d1d5db" stroke-width="1" stroke-dasharray="3,2"/>`;
    s+=`<circle cx="${spx(gpx)}" cy="${spy(gpy)}" r="5" fill="#6b7280" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${spx(gpx)+(gpx>=0?7:-7)}" y="${spy(gpy)-6}" text-anchor="${gpx>=0?'start':'end'}" font-size="10" fill="#6b7280" font-weight="900">P(${gpx},${gpy})</text>`;
    s+=`<circle cx="${spx(grx)}" cy="${spy(gry)}" r="5" fill="#6366f1" stroke="white" stroke-width="2"/>`;
    s+=`<text x="${spx(grx)+(grx>=0?7:-7)}" y="${spy(gry)-6}" text-anchor="${grx>=0?'start':'end'}" font-size="10" fill="#6366f1" font-weight="900">Q(${grx},${gry})</text>`;
    return wrap(s,spW,spH);
  }

  // ── 18. 절댓값 부등식 좌표평면 ──
  if(g.type==='abs_ineq'){
    const{center,r:ar,lo,hi}=g;
    const aiW=220,aiH=180;
    const xSpan=hi-lo,xPad=Math.max(1,xSpan*0.3),xLo=lo-xPad,xHi=hi+xPad;
    const yHiV=ar+1.2,yLoV=-0.5;
    const marg=22,scX=(aiW-2*marg)/(xHi-xLo),scY=(aiH-2*marg)/(yHiV-yLoV),sc=Math.min(scX,scY,28);
    const atx=x=>marg+(x-xLo)*sc,aty=y=>aiH-marg-(y-yLoV)*sc;
    const axY=aty(0),axX=atx(0),axYvis=axY>=4&&axY<=aiH-4,axXvis=axX>=4&&axX<=aiW-4;
    const absPts=[],xInts=[],yInts=[];
    for(let xi=xLo;xi<=xHi;xi+=0.1){const yi=Math.abs(xi-center);const sx=atx(xi),sy=aty(yi);if(sy>=-2&&sy<=aiH+2)absPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xInts.push(n);
    for(let n=0;n<=Math.ceil(yHiV);n++)yInts.push(n);
    let s='';
    xInts.forEach(n=>s+=`<line x1="${atx(n)}" y1="4" x2="${atx(n)}" y2="${aiH-4}" stroke="#eef1f6" stroke-width="0.6"/>`);
    yInts.forEach(n=>s+=`<line x1="4" y1="${aty(n)}" x2="${aiW-4}" y2="${aty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`);
    if(axYvis){s+=`<line x1="4" y1="${axY}" x2="${aiW-4}" y2="${axY}" stroke="#374151" stroke-width="1.8"/>`;s+=`<polygon points="${aiW-4},${axY} ${aiW-12},${axY-3} ${aiW-12},${axY+3}" fill="#374151"/>`;s+=`<text x="${aiW-3}" y="${axY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;xInts.filter(n=>n!==0&&atx(n)>12&&atx(n)<aiW-10).forEach(n=>s+=`<text x="${atx(n)}" y="${Math.min(axY+12,aiH-2)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);}
    if(axXvis){s+=`<line x1="${axX}" y1="4" x2="${axX}" y2="${aiH-4}" stroke="#374151" stroke-width="1.8"/>`;s+=`<polygon points="${axX},4 ${axX-3},12 ${axX+3},12" fill="#374151"/>`;s+=`<text x="${axX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;yInts.filter(n=>n>0&&aty(n)>8&&aty(n)<aiH-4).forEach(n=>s+=`<text x="${Math.max(axX-5,12)}" y="${aty(n)+3}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`);}
    s+=`<line x1="${atx(lo)}" y1="${axY}" x2="${atx(hi)}" y2="${axY}" stroke="#6366f1" stroke-width="4" stroke-linecap="round" opacity="0.45"/>`;
    s+=`<line x1="${atx(xLo)}" y1="${aty(ar)}" x2="${atx(xHi)}" y2="${aty(ar)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    s+=`<text x="${atx(xHi)-2}" y="${aty(ar)-4}" text-anchor="end" font-size="9" fill="#d97706" font-weight="bold">y=${ar}</text>`;
    if(absPts.length>1)s+=`<polyline points="${absPts.join(' ')}" fill="none" stroke="#6366f1" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    s+=`<circle cx="${atx(center)}" cy="${aty(0)}" r="3.5" fill="#6366f1" stroke="white" stroke-width="1.5"/>`;
    s+=`<circle cx="${atx(lo)}" cy="${aty(ar)}" r="3.5" fill="white" stroke="#6366f1" stroke-width="2"/>`;
    s+=`<circle cx="${atx(hi)}" cy="${aty(ar)}" r="3.5" fill="white" stroke="#6366f1" stroke-width="2"/>`;
    s+=`<text x="${atx(lo)}" y="${axY+13}" text-anchor="middle" font-size="10" fill="#6366f1" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${lo}</text>`;
    s+=`<text x="${atx(hi)}" y="${axY+13}" text-anchor="middle" font-size="10" fill="#6366f1" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${hi}</text>`;
    return wrap(s,aiW,aiH);
  }

  // ── 19. 절댓값 부등식 수직선 ──
  if(g.type==='abs_numline'){
    const{lo,hi,ge}=g;
    const anW=260,anH=80,pad=40,axY=anH/2+8;
    const span=hi-lo,ext=Math.max(span*0.5,2);
    const xLo=lo-ext,xHi=hi+ext;
    const sc=(anW-2*pad)/(xHi-xLo),atx=x=>pad+(x-xLo)*sc;
    const loX=atx(lo),hiX=atx(hi),arrowLen=pad-6;
    let s=`<line x1="6" y1="${axY}" x2="${anW-6}" y2="${axY}" stroke="#374151" stroke-width="2"/>`;
    s+=`<polygon points="${anW-6},${axY} ${anW-14},${axY-3} ${anW-14},${axY+3}" fill="#374151"/>`;
    s+=`<polygon points="6,${axY} 14,${axY-3} 14,${axY+3}" fill="#374151"/>`;
    if(!ge){
      s+=`<rect x="${loX}" y="${axY-7}" width="${hiX-loX}" height="14" fill="rgba(99,102,241,0.2)"/>`;
      s+=`<line x1="${loX}" y1="${axY-9}" x2="${loX}" y2="${axY+9}" stroke="#374151" stroke-width="2.5"/>`;
      s+=`<line x1="${hiX}" y1="${axY-9}" x2="${hiX}" y2="${axY+9}" stroke="#374151" stroke-width="2.5"/>`;
      s+=`<circle cx="${loX}" cy="${axY}" r="5" fill="#374151"/>`;
      s+=`<circle cx="${hiX}" cy="${axY}" r="5" fill="#374151"/>`;
      s+=`<text x="${loX}" y="${axY+22}" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="900">a</text>`;
      s+=`<text x="${hiX}" y="${axY+22}" text-anchor="middle" font-size="12" fill="#374151" font-weight="900">${hi}</text>`;
    }else{
      s+=`<line x1="${loX}" y1="${axY}" x2="${Math.max(6,loX-arrowLen)}" y2="${axY}" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/>`;
      s+=`<line x1="${hiX}" y1="${axY}" x2="${Math.min(anW-6,hiX+arrowLen)}" y2="${axY}" stroke="#6366f1" stroke-width="4" stroke-linecap="round"/>`;
      s+=`<circle cx="${loX}" cy="${axY}" r="5" fill="#374151"/>`;
      s+=`<circle cx="${hiX}" cy="${axY}" r="5" fill="#374151"/>`;
      s+=`<text x="${loX}" y="${axY+22}" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="900">a</text>`;
      s+=`<text x="${hiX}" y="${axY+22}" text-anchor="middle" font-size="12" fill="#374151" font-weight="900">${hi}</text>`;
    }
    s+=`<text x="${anW-4}" y="${axY-6}" font-size="10" fill="#374151" font-weight="bold">x</text>`;
    return wrap(s,anW,anH);
  }

  // ── 20. 원과 직선 ──
  if(g.type==='circle_line'){
    const{h,k,r,lineType,lineVal}=g;
    const clW=220,clH=200,clSC=22;
    const clCX=clW/2-h*clSC*0.4,clCY=clH/2+k*clSC*0.4;
    const cltx=x=>clCX+x*clSC,clty=y=>clCY-y*clSC;
    const tks=[-5,-4,-3,-2,-1,0,1,2,3,4,5];
    const lColor='#f59e0b';
    let s='';
    tks.forEach(n=>{s+=`<line x1="${cltx(n)}" y1="4" x2="${cltx(n)}" y2="${clH-4}" stroke="#eef1f6" stroke-width="0.6"/>`;s+=`<line x1="4" y1="${clty(n)}" x2="${clW-4}" y2="${clty(n)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    s+=`<line x1="4" y1="${clCY}" x2="${clW-4}" y2="${clCY}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<polygon points="${clW-4},${clCY} ${clW-12},${clCY-3} ${clW-12},${clCY+3}" fill="#374151"/>`;
    s+=`<line x1="${clCX}" y1="4" x2="${clCX}" y2="${clH-4}" stroke="#374151" stroke-width="1.8"/>`;
    s+=`<polygon points="${clCX},4 ${clCX-3},12 ${clCX+3},12" fill="#374151"/>`;
    s+=`<text x="${clW-3}" y="${clCY+12}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
    s+=`<text x="${clCX+5}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
    s+=`<circle cx="${cltx(h)}" cy="${clty(k)}" r="${r*clSC}" fill="rgba(20,184,166,0.12)" stroke="#0d9488" stroke-width="2"/>`;
    if(lineType==='h'){s+=`<line x1="4" y1="${clty(lineVal)}" x2="${clW-4}" y2="${clty(lineVal)}" stroke="${lColor}" stroke-width="2" stroke-dasharray="6,3"/>`;s+=`<text x="${clW-6}" y="${clty(lineVal)-4}" text-anchor="end" font-size="10" fill="${lColor}" font-weight="bold">y=${lineVal}</text>`;}
    if(lineType==='v'){s+=`<line x1="${cltx(lineVal)}" y1="4" x2="${cltx(lineVal)}" y2="${clH-4}" stroke="${lColor}" stroke-width="2" stroke-dasharray="6,3"/>`;s+=`<text x="${cltx(lineVal)+4}" y="14" font-size="10" fill="${lColor}" font-weight="bold">x=${lineVal}</text>`;}
    s+=`<circle cx="${cltx(h)}" cy="${clty(k)}" r="3" fill="#0d9488"/>`;
    return wrap(s,clW,clH);
  }

  return'';
}
