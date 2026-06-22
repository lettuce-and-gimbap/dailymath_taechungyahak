// === js/components/feedback.js ===

// 중졸·고졸 검정고시 수학 영역 자동 분류
function classifyWrongQTopic(q){
  const src=((q.topic||'')+(q.qTxt||q.q||'')+(q._logType||'')).toLowerCase();
  if(/수와\s*연산|자연수|정수|유리수|실수|분수|소수|약수|배수|최대공약수|최소공배수|소인수|집합|무한소수|순환소수/.test(src))return'수와 연산';
  if(/방정식|부등식|연립|이차방정식|이차부등식|일차방정식|일차부등식|판별식|근의 공식|절댓값 방정식/.test(src))return'방정식과 부등식';
  if(/이차함수|일차함수|유리함수|무리함수|지수함수|로그함수|함수|평행이동|대칭이동|역함수|합성함수/.test(src))return'함수';
  if(/수열|등차|등비|시그마|귀납법|점화식/.test(src))return'수열';
  if(/확률|경우의 수|조합|순열|통계|평균|분산|표준편차|도수|히스토그램|줄기잎/.test(src))return'확률과 통계';
  if(/삼각형|사각형|다각형|원|입체|도형|피타고라스|넓이|부피|겉넓이|내각|외각|평행사변형|직선|점과 직선|거리|벡터|기하/.test(src))return'기하';
  if(/삼각함수|사인|코사인|탄젠트|sin|cos|tan|호도법/.test(src))return'삼각함수';
  if(/미분|적분|극한|미적분|도함수|부정적분|정적분/.test(src))return'미적분';
  if(/인수분해|다항식|전개|문자와\s*식|식의 계산|단항식|다항식/.test(src))return'문자와 식';
  if(/지수|로그|상용로그/.test(src))return'지수·로그';
  return'기타';
}

const WRONG_Q_CATEGORY_ORDER=['수와 연산','문자와 식','방정식과 부등식','함수','수열','확률과 통계','기하','삼각함수','지수·로그','미적분','기타'];

// 구버전 데이터(q.graph 없는 기하 오답)를 qTxt에서 그래프 파라미터 복원
function tryReconstructGraph(q){
  if(q.graph)return q.graph;
  const raw=(q.qTxt||q.q||'');
  const txt=raw.replace(/−/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/²/g,'^2');
  const type=q.meta?.type||'';

  // 무리함수: "y = a√x 를 x축 방향으로 ±dx만큼, y축 방향으로 ±dy만큼 이동하면?"
  if(type==='무리함수'||txt.includes('√x')||txt.includes('무리함수')){
    const pM=txt.match(/x축 방향으로 ([+-]?\d+)/);
    const qM=txt.match(/y축 방향으로 ([+-]?\d+)/);
    if(pM&&qM){
      const aM=txt.match(/y\s*=\s*(-?\d+)√x/)||txt.match(/y\s*=\s*(-?\d+)√x/);
      const aNegM=txt.match(/y\s*=\s*-√x/)||txt.match(/y\s*=\s*-√x/);
      const a=aNegM?-1:(aM&&aM[1]?parseInt(aM[1]):1);
      return{type:'radical',a,p:parseInt(pM[1]),q:parseInt(qM[1])};
    }
  }

  // 유리함수: "y = k/x 를 x축 방향으로 ±dx만큼, y축 방향으로 ±dy만큼 이동하면?"
  if(type==='유리함수'||txt.includes('유리함수')||(txt.includes('/x')&&txt.includes('이동'))){
    const kM=txt.match(/y\s*=\s*(-?\d+)\/x/);
    const pM=txt.match(/x축 방향으로 ([+-]?\d+)/);
    const qM=txt.match(/y축 방향으로 ([+-]?\d+)/);
    if(kM&&pM&&qM)return{type:'rational',k:parseInt(kM[1]),p:parseInt(pM[1]),q:parseInt(qM[1])};
  }

  // 이차함수: "y = a(x±p)² ± q 에서 ds <= x <= de 일 때..."
  if(type.includes('이차함수')||txt.includes('이차함수')){
    const domM=txt.match(/(-?\d+)\s*<=\s*x\s*<=\s*(-?\d+)/);
    if(domM){
      const ds=parseInt(domM[1]),de=parseInt(domM[2]);
      const fM=txt.match(/y\s*=\s*(-?\d*)\s*\(x([+-]?\d*)\)\^2\s*([+-]\s*\d+)?/);
      let a=1,p=0,qv=0;
      if(fM){
        if(fM[1]==='-')a=-1;
        else if(fM[1]&&fM[1]!=='')a=parseInt(fM[1])||1;
        p=fM[2]&&fM[2]!==''?-parseInt(fM[2]):0;
        if(fM[3])qv=parseInt(fM[3].replace(/\s/g,''))||0;
      }
      return{type:'quadratic',a,p,q:qv,ds,de};
    }
  }

  // 점과 직선 거리: "점 (x0, y0)에서 직선 ax±by±c = 0까지의 거리는?"
  if(type.includes('점과직선거리')||type.includes('점과 직선')||txt.includes('까지의 거리')){
    const ptM=txt.match(/점\s*\((-?\d+),\s*(-?\d+)\)/);
    const lineM=txt.match(/직선\s*(-?\d+)x([+-]\d+)y([+-]\d+)\s*=\s*0/);
    if(ptM&&lineM)return{type:'distance',ptX:parseInt(ptM[1]),ptY:parseInt(ptM[2]),la:parseInt(lineM[1]),lb:parseInt(lineM[2]),lc:parseInt(lineM[3])};
  }

  // 원의 방정식
  if(type==='원의 방정식'||txt.includes('원의 방정식')){
    const cM=txt.match(/중심이?\s*\((-?\d+),\s*(-?\d+)\).*?반지름이?\s*(\d+)/);
    if(cM)return{type:'circle',h:parseInt(cM[1]),k:parseInt(cM[2]),r:parseInt(cM[3])};
    const xTM=txt.match(/\(x([+-]\d+)\)\^2/);
    const yTM=txt.match(/\(y([+-]\d+)\)\^2/);
    const rSqM=txt.match(/\)\^2\s*=\s*(\d+)/);
    if(rSqM){const r2=parseInt(rSqM[1]);const r=Math.round(Math.sqrt(r2));if(r*r===r2)return{type:'circle',h:xTM?-parseInt(xTM[1]):0,k:yTM?-parseInt(yTM[1]):0,r};}
  }

  // 대칭이동: "점 (px, py)를 sym에 대하여 대칭이동한 점은?"
  if(type==='대칭이동'||txt.includes('대칭이동')){
    const ptM=txt.match(/점\s*\((-?\d+),\s*(-?\d+)\)/);
    const symM=txt.match(/(x축|y축|원점|y=-x|y=x)/);
    if(ptM&&symM)return{type:'symmetry',px:parseInt(ptM[1]),py:parseInt(ptM[2]),sym:symM[1]};
  }

  return null;
}

// 그래프 데이터 → 인쇄용 SVG 문자열 (GraphPreview와 동일한 로직, React 없이)
function graphToSVGStr(g){
  if(!g)return'';

  if(g.type==='system_eq'){
    const{eqs}=g;
    const lineH=34,padX=18,padY=16,svgH=padY*2+eqs.length*lineH,svgW=280;
    const top=padY+lineH/2-2,bot=padY+(eqs.length-1)*lineH+lineH/2+2,mid=(top+bot)/2;
    const bx=10,ins=6;
    const bp=`M${bx+ins},${top} Q${bx},${top} ${bx},${top+8} L${bx},${mid-6} Q${bx},${mid} ${bx-ins},${mid} Q${bx},${mid} ${bx},${mid+6} L${bx},${bot-8} Q${bx},${bot} ${bx+ins},${bot}`;
    const eqT=eqs.map((eq,i)=>`<text x="${padX}" y="${padY+(i+0.5)*lineH+6}" font-size="15" font-weight="700" fill="#1e293b" font-family="monospace">${eq}</text>`).join('');
    return`<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:6px auto"><path d="${bp}" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${eqT}</svg>`;
  }

  const W=220,H=180,SC=22;
  let CX=W/2,CY=H/2;
  if(g.type==='circle'){CX=W/2-g.h*SC*0.5;CY=H/2+g.k*SC*0.5;}
  if(g.type==='rational'){CX=W/2-g.p*SC;CY=H/2+g.q*SC;}
  if(g.type==='two_point'){CX=W/2-((g.x1+g.x2)/2)*SC;CY=H/2+((g.y1+g.y2)/2)*SC;}
  const toSx=x=>CX+x*SC,toSy=y=>CY-y*SC;
  const ticks=[-4,-3,-2,-1,1,2,3,4],lbls=[-4,-2,2,4];
  let grd='',lbl='';
  ticks.forEach(n=>{grd+=`<line x1="${toSx(n).toFixed(1)}" y1="4" x2="${toSx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/><line x1="4" y1="${toSy(n).toFixed(1)}" x2="${W-4}" y2="${toSy(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
  lbls.forEach(n=>{lbl+=`<text x="${toSx(n).toFixed(1)}" y="${(CY+13).toFixed(1)}" text-anchor="middle" font-size="10" fill="#9ca3af" font-weight="600">${n}</text><text x="${(CX-6).toFixed(1)}" y="${(toSy(n)+3).toFixed(1)}" text-anchor="end" font-size="10" fill="#9ca3af" font-weight="600">${n}</text>`;});
  const axs=`<line x1="4" y1="${CY.toFixed(1)}" x2="${W-4}" y2="${CY.toFixed(1)}" stroke="#374151" stroke-width="1.8"/><line x1="${CX.toFixed(1)}" y1="4" x2="${CX.toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${CY.toFixed(1)} ${W-12},${(CY-3).toFixed(1)} ${W-12},${(CY+3).toFixed(1)}" fill="#374151"/><polygon points="${CX.toFixed(1)},4 ${(CX-3).toFixed(1)},12 ${(CX+3).toFixed(1)},12" fill="#374151"/><text x="${W-3}" y="${(CY+12).toFixed(1)}" font-size="9" fill="#374151" font-weight="bold">x</text><text x="${(CX+5).toFixed(1)}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
  const baseAxes=grd+lbl+axs;
  const svgWrap=i=>`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #e5e7eb;border-radius:8px;background:white;display:block;margin:6px auto">${i}</svg>`;

  if(g.type==='quadratic'){
    const{a,p,q:vq,ds,de}=g;
    const yDs=a*(ds-p)**2+vq,yDe=a*(de-p)**2+vq;
    const xLo=ds-Math.max(0.6,(de-ds)*0.12),xHi=de+Math.max(0.6,(de-ds)*0.12);
    const keyYs=[yDs,yDe,vq],rawYMin=Math.min(...keyYs),rawYMax=Math.max(...keyYs);
    const ySpan=Math.max(rawYMax-rawYMin,1),yPad=Math.max(1,ySpan*0.28);
    const yLo=rawYMin-yPad,yHi=rawYMax+yPad;
    const mg=26,qSCx=Math.min(38,Math.max(12,(W-2*mg)/(xHi-xLo))),qSCy=Math.min(38,Math.max(8,(H-2*mg)/(yHi-yLo)));
    const toQx=x=>mg+(x-xLo)*qSCx,toQy=y=>H-mg-(y-yLo)*qSCy;
    const axY=toQy(0),axX=toQx(0),axYv=axY>=4&&axY<=H-4,axXv=axX>=4&&axX<=W-4;
    const xI=[],yI=[];
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xI.push(n);
    for(let n=Math.ceil(yLo);n<=Math.floor(yHi);n++)yI.push(n);
    const xSt=Math.max(1,Math.ceil(xI.length/5)),ySt=Math.max(1,Math.ceil(yI.length/5));
    let qg='';xI.forEach(n=>{qg+=`<line x1="${toQx(n).toFixed(1)}" y1="4" x2="${toQx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    yI.forEach(n=>{qg+=`<line x1="4" y1="${toQy(n).toFixed(1)}" x2="${W-4}" y2="${toQy(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    let qa='';
    if(axYv){qa+=`<line x1="4" y1="${axY.toFixed(1)}" x2="${W-4}" y2="${axY.toFixed(1)}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${axY.toFixed(1)} ${W-12},${(axY-3).toFixed(1)} ${W-12},${(axY+3).toFixed(1)}" fill="#374151"/><text x="${W-3}" y="${Math.min(axY+12,H-2).toFixed(1)}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
      xI.forEach((n,i)=>{if(n!==0&&i%xSt===0&&toQx(n)>12&&toQx(n)<W-10)qa+=`<text x="${toQx(n).toFixed(1)}" y="${Math.min(axY+13,H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    if(axXv){qa+=`<line x1="${axX.toFixed(1)}" y1="4" x2="${axX.toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${axX.toFixed(1)},4 ${(axX-3).toFixed(1)},12 ${(axX+3).toFixed(1)},12" fill="#374151"/><text x="${(axX+5).toFixed(1)}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
      yI.forEach((n,i)=>{if(n!==0&&i%ySt===0&&toQy(n)>10&&toQy(n)<H-6)qa+=`<text x="${Math.max(axX-6,14).toFixed(1)}" y="${(toQy(n)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    const pts=[],rpPts=[];
    for(let xi=xLo;xi<=xHi;xi+=0.1){const yi=a*(xi-p)**2+vq,sx=toQx(xi),sy=toQy(yi);if(sx>=-4&&sx<=W+4&&sy>=-4&&sy<=H+4)pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let xi=ds;xi<=de;xi+=0.08){const yi=a*(xi-p)**2+vq,sx=toQx(xi),sy=toQy(yi);if(sy>=-4&&sy<=H+4)rpPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    const vxInR=p>=ds&&p<=de,cand=[{x:ds,y:yDs},{x:de,y:yDe}];
    if(vxInR)cand.push({x:p,y:vq});
    const ep=a>0?cand.reduce((m,c)=>c.y<m.y?c:m):cand.reduce((m,c)=>c.y>m.y?c:m);
    const ec=a>0?'#2563eb':'#ef4444',col=a>0?'#4f46e5':'#ef4444';
    let qc='';
    if(pts.length>1)qc+=`<polyline points="${pts.join(' ')}" fill="none" stroke="#c7d2fe" stroke-width="1.4"/>`;
    if(rpPts.length>1)qc+=`<polyline points="${rpPts.join(' ')}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
    const epSx=toQx(ep.x),epSy=toQy(ep.y);
    if(axYv)qc+=`<line x1="${epSx.toFixed(1)}" y1="${epSy.toFixed(1)}" x2="${epSx.toFixed(1)}" y2="${axY.toFixed(1)}" stroke="${ec}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axXv)qc+=`<line x1="${axX.toFixed(1)}" y1="${epSy.toFixed(1)}" x2="${epSx.toFixed(1)}" y2="${epSy.toFixed(1)}" stroke="${ec}" stroke-width="1.1" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axYv)qc+=`<text x="${epSx.toFixed(1)}" y="${Math.min(axY+13,H-2).toFixed(1)}" text-anchor="middle" font-size="10" fill="${ec}" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${ep.x}</text>`;
    if(axXv)qc+=`<text x="${Math.max(axX-5,14).toFixed(1)}" y="${(epSy+4).toFixed(1)}" text-anchor="end" font-size="10" fill="${ec}" font-weight="900" stroke="white" stroke-width="2.5" paint-order="stroke">${Math.round(ep.y*100)/100}</text>`;
    return svgWrap(qg+qa+qc);
  }

  if(g.type==='radical'){
    const{a,p,q:vq}=g;
    const aStr=a===1?'':(a===-1?'−':String(a));
    const pStr=p===0?'x':(p>0?`x−${p}`:`x+${-p}`);
    const qStr=vq===0?'':(vq>0?`+${vq}`:`−${-vq}`);
    const xLo=Math.min(0,p)-0.3,xHi=Math.max(0,p)+5.5;
    const allY=[0,vq,a*Math.sqrt(Math.max(0,xHi-p))+vq,a*Math.sqrt(xHi)];
    const yLoR=Math.min(...allY)-0.6,yHiR=Math.max(...allY)+0.8;
    const mg=22,scX=(W-2*mg)/(xHi-xLo),scY=(H-2*mg)/(yHiR-yLoR),sc=Math.min(scX,scY,28);
    const rtx=x=>mg+(x-xLo)*sc,rty=y=>H-mg-(y-yLoR)*sc;
    const axY=rty(0),axX=rtx(0),axYv=axY>=4&&axY<=H-4,axXv=axX>=4&&axX<=W-4;
    const xI=[],yI=[];
    for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xI.push(n);
    for(let n=Math.ceil(yLoR);n<=Math.floor(yHiR);n++)yI.push(n);
    let rg='';xI.forEach(n=>{rg+=`<line x1="${rtx(n).toFixed(1)}" y1="4" x2="${rtx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    yI.forEach(n=>{rg+=`<line x1="4" y1="${rty(n).toFixed(1)}" x2="${W-4}" y2="${rty(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    let ra='';
    if(axYv){ra+=`<line x1="4" y1="${axY.toFixed(1)}" x2="${W-4}" y2="${axY.toFixed(1)}" stroke="#374151" stroke-width="1.8"/><polygon points="${W-4},${axY.toFixed(1)} ${W-12},${(axY-3).toFixed(1)} ${W-12},${(axY+3).toFixed(1)}" fill="#374151"/><text x="${W-3}" y="${Math.min(axY+12,H-2).toFixed(1)}" font-size="9" fill="#374151" font-weight="bold">x</text>`;
      xI.forEach(n=>{if(n!==0&&rtx(n)>12&&rtx(n)<W-8)ra+=`<text x="${rtx(n).toFixed(1)}" y="${Math.min(axY+13,H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    if(axXv){ra+=`<line x1="${rtx(p).toFixed(1)}" y1="4" x2="${rtx(p).toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/><polygon points="${rtx(p).toFixed(1)},4 ${(rtx(p)-3).toFixed(1)},12 ${(rtx(p)+3).toFixed(1)},12" fill="#374151"/><text x="${(rtx(p)+5).toFixed(1)}" y="14" font-size="9" fill="#374151" font-weight="bold">y</text>`;
      yI.forEach(n=>{if(n!==0&&rty(n)>8&&rty(n)<H-4)ra+=`<text x="${Math.max(rtx(p)-5,14).toFixed(1)}" y="${(rty(n)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    const cRef='#9ca3af',cMain='#059669';
    const refPts=[],mainPts=[];
    for(let xi=0;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(xi);const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)refPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    for(let xi=p;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(Math.max(0,xi-p))+vq;const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)mainPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    const rLX=Math.min(xHi*0.45,3),rLY=a*Math.sqrt(Math.max(0,rLX));
    const mLX=p+Math.min(2.5,(xHi-p)*0.45),mLY=a*Math.sqrt(Math.max(0,mLX-p))+vq;
    let rc='';
    if(refPts.length>1)rc+=`<polyline points="${refPts.join(' ')}" fill="none" stroke="${cRef}" stroke-width="2" stroke-dasharray="5,3"/>`;
    if(refPts.length>3)rc+=`<text x="${(rtx(rLX)+4).toFixed(1)}" y="${(rty(rLY)+(a>0?-7:9)).toFixed(1)}" font-size="9" fill="${cRef}" font-weight="bold">y=${aStr}&#x221A;x</text>`;
    if(mainPts.length>1)rc+=`<polyline points="${mainPts.join(' ')}" fill="none" stroke="${cMain}" stroke-width="3" stroke-linecap="round"/>`;
    if(axYv)rc+=`<line x1="${rtx(p).toFixed(1)}" y1="${rty(vq).toFixed(1)}" x2="${rtx(p).toFixed(1)}" y2="${axY.toFixed(1)}" stroke="${cMain}" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>`;
    if(axXv)rc+=`<line x1="${axX.toFixed(1)}" y1="${rty(vq).toFixed(1)}" x2="${rtx(p).toFixed(1)}" y2="${rty(vq).toFixed(1)}" stroke="${cMain}" stroke-width="1.2" stroke-dasharray="3,2" opacity="0.7"/>`;
    rc+=`<circle cx="${rtx(p).toFixed(1)}" cy="${rty(vq).toFixed(1)}" r="4.5" fill="${cMain}" stroke="white" stroke-width="2"/>`;
    if(mainPts.length>3)rc+=`<text x="${(rtx(mLX)+4).toFixed(1)}" y="${(rty(mLY)+(a>0?-7:9)).toFixed(1)}" font-size="9" fill="${cMain}" font-weight="bold">y=${aStr}&#x221A;(${pStr})${qStr}</text>`;
    return svgWrap(rg+ra+rc);
  }

  if(g.type==='rational'){
    const{k,p,q:vq}=g;const eps=0.18;const ptsL=[],ptsR=[];
    for(let xi=p-6;xi<p-eps;xi+=0.12){const yi=k/(xi-p)+vq;if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4)ptsL.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);}
    for(let xi=p+eps;xi<=p+6;xi+=0.12){const yi=k/(xi-p)+vq;if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4)ptsR.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);}
    const col='#7c3aed';
    let rc=`<line x1="${toSx(p).toFixed(1)}" y1="6" x2="${toSx(p).toFixed(1)}" y2="${H-6}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.85"/><line x1="6" y1="${toSy(vq).toFixed(1)}" x2="${W-6}" y2="${toSy(vq).toFixed(1)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.85"/>`;
    rc+=`<text x="${(toSx(p)+4).toFixed(1)}" y="14" font-size="8" fill="#d97706" font-weight="bold">x=${p}</text><text x="${W-28}" y="${(toSy(vq)-4).toFixed(1)}" font-size="8" fill="#d97706" font-weight="bold">y=${vq}</text>`;
    if(ptsL.length>1)rc+=`<polyline points="${ptsL.join(' ')}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round"/>`;
    if(ptsR.length>1)rc+=`<polyline points="${ptsR.join(' ')}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linecap="round"/>`;
    return svgWrap(baseAxes+rc);
  }

  if(g.type==='circle'){
    const{h,k:ck,r}=g;const mg=26;
    const xs=[h-r,h+r,0],ys=[ck-r,ck+r,0];
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const spanX=Math.max(xmax-xmin,1),spanY=Math.max(ymax-ymin,1);
    const cSC=Math.min((W-2*mg)/spanX,(H-2*mg)/spanY,26);
    const ox=W/2-((xmin+xmax)/2)*cSC,oy=H/2+((ymin+ymax)/2)*cSC;
    const tx=x=>ox+x*cSC,ty=y=>oy-y*cSC;const col='#2563eb';
    const xTR=[],yTR=[];
    for(let n=Math.ceil(xmin);n<=Math.floor(xmax);n++)xTR.push(n);
    for(let n=Math.ceil(ymin);n<=Math.floor(ymax);n++)yTR.push(n);
    const xSt=Math.max(1,Math.round(xTR.length/5)),ySt=Math.max(1,Math.round(yTR.length/5));
    const axXv=ty(0)>=4&&ty(0)<=H-4,axYv=tx(0)>=4&&tx(0)<=W-4;
    let cg='';xTR.forEach(n=>{cg+=`<line x1="${tx(n).toFixed(1)}" y1="4" x2="${tx(n).toFixed(1)}" y2="${H-4}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    yTR.forEach(n=>{cg+=`<line x1="4" y1="${ty(n).toFixed(1)}" x2="${W-4}" y2="${ty(n).toFixed(1)}" stroke="#eef1f6" stroke-width="0.6"/>`;});
    let ca='';
    if(axXv){ca+=`<line x1="4" y1="${ty(0).toFixed(1)}" x2="${W-4}" y2="${ty(0).toFixed(1)}" stroke="#374151" stroke-width="1.8"/>`;xTR.forEach((n,i)=>{if(n!==0&&i%xSt===0)ca+=`<text x="${tx(n).toFixed(1)}" y="${Math.min(ty(0)+13,H-2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    if(axYv){ca+=`<line x1="${tx(0).toFixed(1)}" y1="4" x2="${tx(0).toFixed(1)}" y2="${H-4}" stroke="#374151" stroke-width="1.8"/>`;yTR.forEach((n,i)=>{if(n!==0&&i%ySt===0)ca+=`<text x="${Math.max(tx(0)-6,12).toFixed(1)}" y="${(ty(n)+3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-weight="600">${n}</text>`;});}
    let cc=`<circle cx="${tx(h).toFixed(1)}" cy="${ty(ck).toFixed(1)}" r="${(r*cSC).toFixed(1)}" fill="rgba(37,99,235,0.06)" stroke="${col}" stroke-width="2.5"/>`;
    cc+=`<line x1="${tx(h).toFixed(1)}" y1="${ty(ck).toFixed(1)}" x2="${tx(h+r).toFixed(1)}" y2="${ty(ck).toFixed(1)}" stroke="${col}" stroke-width="1.8" stroke-dasharray="4,3"/>`;
    cc+=`<text x="${tx(h+r/2).toFixed(1)}" y="${(ty(ck)-7).toFixed(1)}" text-anchor="middle" font-size="12" fill="${col}" font-weight="900" stroke="white" stroke-width="3" paint-order="stroke">r=${r}</text>`;
    cc+=`<circle cx="${tx(h).toFixed(1)}" cy="${ty(ck).toFixed(1)}" r="4.5" fill="${col}" stroke="white" stroke-width="2"/>`;
    cc+=`<text x="${tx(h).toFixed(1)}" y="${(ty(ck)+(ck>=0?20:-12)).toFixed(1)}" text-anchor="middle" font-size="12" fill="${col}" font-weight="900" stroke="white" stroke-width="3.5" paint-order="stroke">&#xC911;&#xC2EC;(${h},${ck})</text>`;
    return svgWrap(cg+ca+cc);
  }

  if(g.type==='distance'){
    const{ptX,ptY,la,lb,lc}=g;const col='#ea580c';
    const lp=[];
    if(Math.abs(lb)>0.001){[-5,5].forEach(xi=>{const yi=-(la*xi+lc)/lb;lp.push([toSx(xi),toSy(yi)]);});}
    else if(Math.abs(la)>0.001){const xi=-lc/la;lp.push([toSx(xi),4],[toSx(xi),H-4]);}
    const dSq=la**2+lb**2,nV=la*ptX+lb*ptY+lc;
    const fX=dSq>0?ptX-la*nV/dSq:ptX,fY=dSq>0?ptY-lb*nV/dSq:ptY;
    let dc='';
    if(lp.length===2)dc+=`<line x1="${lp[0][0].toFixed(1)}" y1="${lp[0][1].toFixed(1)}" x2="${lp[1][0].toFixed(1)}" y2="${lp[1][1].toFixed(1)}" stroke="#374151" stroke-width="2" stroke-linecap="round"/>`;
    dc+=`<line x1="${toSx(ptX).toFixed(1)}" y1="${toSy(ptY).toFixed(1)}" x2="${toSx(fX).toFixed(1)}" y2="${toSy(fY).toFixed(1)}" stroke="${col}" stroke-width="2" stroke-dasharray="4,3"/>`;
    dc+=`<circle cx="${toSx(ptX).toFixed(1)}" cy="${toSy(ptY).toFixed(1)}" r="5" fill="${col}" stroke="white" stroke-width="2"/>`;
    dc+=`<text x="${(toSx(ptX)+7).toFixed(1)}" y="${(toSy(ptY)-5).toFixed(1)}" font-size="9" fill="${col}" font-weight="bold">(${ptX},${ptY})</text>`;
    dc+=`<circle cx="${toSx(fX).toFixed(1)}" cy="${toSy(fY).toFixed(1)}" r="3" fill="white" stroke="${col}" stroke-width="2"/>`;
    const lbS=lb>=0?`+${lb}`:String(lb),lcS=lc>=0?`+${lc}`:String(lc);
    dc+=`<text x="8" y="14" font-size="9" fill="#374151" font-weight="bold">${la}x${lbS}y${lcS}=0</text>`;
    if(Math.abs(nV)>0.01&&dSq>0){
      const len=0.3,nx=-lb/Math.sqrt(dSq),ny=la/Math.sqrt(dSq),ax2=la/Math.sqrt(dSq),ay2=lb/Math.sqrt(dSq);
      const qx=fX+len*(ax2+nx),qy=fY+len*(ay2+ny);
      dc+=`<polyline points="${toSx(fX+len*ax2).toFixed(1)},${toSy(fY+len*ay2).toFixed(1)} ${toSx(qx).toFixed(1)},${toSy(qy).toFixed(1)} ${toSx(fX+len*nx).toFixed(1)},${toSy(fY+len*ny).toFixed(1)}" fill="none" stroke="${col}" stroke-width="1.5"/>`;
    }
    return svgWrap(baseAxes+dc);
  }

  if(g.type==='symmetry'){
    const{px,py,sym}=g;
    const sl=[];
    if(sym==='y=x')sl.push([toSx(-4),toSy(-4),toSx(4),toSy(4)]);
    else if(sym==='y=-x')sl.push([toSx(-4),toSy(4),toSx(4),toSy(-4)]);
    let sc2='';
    if(sl.length>0)sc2+=`<line x1="${sl[0][0].toFixed(1)}" y1="${sl[0][1].toFixed(1)}" x2="${sl[0][2].toFixed(1)}" y2="${sl[0][3].toFixed(1)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    if(sym==='원점')sc2+=`<circle cx="${toSx(0).toFixed(1)}" cy="${toSy(0).toFixed(1)}" r="5" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>`;
    sc2+=`<circle cx="${toSx(px).toFixed(1)}" cy="${toSy(py).toFixed(1)}" r="5" fill="#6b7280" stroke="white" stroke-width="2"/>`;
    sc2+=`<text x="${(toSx(px)+7).toFixed(1)}" y="${(toSy(py)-5).toFixed(1)}" font-size="9" fill="#6b7280" font-weight="bold">(${px},${py})</text>`;
    sc2+=`<text x="${(W/2).toFixed(1)}" y="${H-5}" text-anchor="middle" font-size="9" fill="#f59e0b" font-weight="bold">${sym} &#xB300;&#xCE6D;</text>`;
    return svgWrap(baseAxes+sc2);
  }

  if(g.type==='two_point'){
    const{x1,y1,x2,y2}=g;
    let tc=`<line x1="${toSx(x1).toFixed(1)}" y1="${toSy(y1).toFixed(1)}" x2="${toSx(x2).toFixed(1)}" y2="${toSy(y2).toFixed(1)}" stroke="#6366f1" stroke-width="2" stroke-dasharray="5,3"/>`;
    tc+=`<circle cx="${toSx(x1).toFixed(1)}" cy="${toSy(y1).toFixed(1)}" r="5" fill="#4f46e5" stroke="white" stroke-width="2"/>`;
    tc+=`<text x="${(toSx(x1)+8).toFixed(1)}" y="${(toSy(y1)-6).toFixed(1)}" font-size="9" font-weight="bold" fill="#4f46e5">A(${x1},${y1})</text>`;
    tc+=`<circle cx="${toSx(x2).toFixed(1)}" cy="${toSy(y2).toFixed(1)}" r="5" fill="#dc2626" stroke="white" stroke-width="2"/>`;
    tc+=`<text x="${(toSx(x2)+8).toFixed(1)}" y="${(toSy(y2)-6).toFixed(1)}" font-size="9" font-weight="bold" fill="#dc2626">B(${x2},${y2})</text>`;
    return svgWrap(baseAxes+tc);
  }

  return'';
}

function WrongQCategoryPanel({allWrongQs,wrongQSel,setWrongQSel,wrongQShowAns,setWrongQShowAns,studentName}){
  // 카테고리별로 그룹화
  const grouped=React.useMemo(()=>{
    const map={};
    allWrongQs.forEach((q,i)=>{
      const cat=classifyWrongQTopic(q);
      if(!map[cat])map[cat]=[];
      map[cat].push({q,i});
    });
    return map;
  },[allWrongQs]);

  const cats=WRONG_Q_CATEGORY_ORDER.filter(c=>grouped[c]);
  const [openCats,setOpenCats]=React.useState(new Set()); // 기본 전부 접힘

  const toggleCat=cat=>setOpenCats(prev=>{const s=new Set(prev);s.has(cat)?s.delete(cat):s.add(cat);return s;});

  const selAllCat=(cat)=>{
    const items=grouped[cat]||[];
    const allOn=items.every(({i})=>wrongQSel.has(i));
    setWrongQSel(prev=>{
      const s=new Set(prev);
      items.forEach(({i})=>allOn?s.delete(i):s.add(i));
      return s;
    });
  };

  const allOn=allWrongQs.length>0&&allWrongQs.every((_,i)=>wrongQSel.has(i));
  const selAll=()=>setWrongQSel(allOn?new Set():new Set(allWrongQs.map((_,i)=>i)));

  const ORD=['①','②','③','④'];

  const printSelected=()=>{
    const qs=Array.from(wrongQSel).map(i=>allWrongQs[i]);
    if(!qs.length)return;
    const showAns=wrongQShowAns;
    let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @page{size:A4;margin:20mm 15mm;}
      *{box-sizing:border-box;}
      body{font-family:'Noto Sans KR',sans-serif;padding:16px;color:#111;font-size:14px;}
      h1{text-align:center;font-size:20px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:16px;}
      .cat{font-size:13px;font-weight:900;color:#6d28d9;background:#ede9fe;padding:4px 10px;border-radius:6px;margin:18px 0 8px 0;}
      .q{margin-bottom:24px;page-break-inside:avoid;break-inside:avoid;}
      .qnum{font-weight:900;color:#dc2626;}
      .qtxt{font-size:14px;font-weight:700;line-height:1.6;display:inline;}
      .graph{margin:8px 0;}
      .choices{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px;margin-left:14px;}
      .choice{font-size:13px;padding:3px 0;}
      .ans{margin-top:6px;margin-left:14px;font-size:12px;color:#dc2626;font-weight:700;}
      .exp{margin-top:4px;margin-left:14px;padding:6px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:11px;color:#78350f;}
      @media print{body{padding:0;}.no-print{display:none!important;}}
    </style></head><body>
    <h1>${studentName} 학생 — 오답 문제지</h1>`;
    let num=1;
    WRONG_Q_CATEGORY_ORDER.forEach(cat=>{
      const items=(grouped[cat]||[]).filter(({i})=>wrongQSel.has(i));
      if(!items.length)return;
      html+=`<div class="cat">▶ ${cat}</div>`;
      items.forEach(({q})=>{
        const effGraph=tryReconstructGraph(q);
        const graphSvg=effGraph?`<div class="graph">${graphToSVGStr(effGraph)}</div>`:'';
        const choicesHtml=Array.isArray(q.choices)?`<div class="choices">${q.choices.map((c,j)=>`<div class="choice">${ORD[j]||String(j+1)} ${c}</div>`).join('')}</div>`:'';
        const ansText=q.cAns||(Array.isArray(q.choices)&&q.answer!=null?q.choices[q.answer]:'');
        html+=`<div class="q"><span class="qnum">${num++}.</span> <span class="qtxt">${q.qTxt||q.q||''}</span>${graphSvg}${choicesHtml}`;
        if(showAns)html+=`<div class="ans">정답: ${ansText}</div>${q.explanation?`<div class="exp">${q.explanation}</div>`:''}`;
        html+=`</div>`;
      });
    });
    html+=`</body></html>`;
    const w=window.open('','_blank','width=860,scrollbars=yes');
    if(!w){alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');return;}
    w.document.write(html);
    w.document.close();
    w.onload=()=>{setTimeout(()=>w.print(),200);};
    setTimeout(()=>w.print(),900);
  };

  const sendHomework=async()=>{
    const qs=Array.from(wrongQSel).map(i=>allWrongQs[i]);
    if(!confirm(`오답 ${qs.length}문제를 ${studentName} 학생에게 숙제로 내시겠어요?`))return;
    try{
      const now=new Date();const exp=new Date(now);exp.setDate(exp.getDate()+7);
      const hwQs=qs.map(q=>({q:q.qTxt||q.q||'',choices:q.choices||[],answer:q.answer??0,topic:q.topic||'오답 재도전',explanation:q.explanation||''}));
      await db.collection('homework').add({title:`${studentName} 학생 오답 문제지`,level:'오답',questions:hwQs,active:true,createdAt:now,expiresAt:exp,completedBy:[],assignedTo:[studentName]});
      alert('✅ 숙제로 등록되었습니다!');
    }catch(e){alert('등록 실패');}
  };

  return(<div>
    <div className="text-xs text-red-500 mb-2">유형별로 묶었습니다. 원하는 문제를 선택해 인쇄하세요.</div>
    {/* 전체 선택 / 해제 */}
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <button onClick={selAll} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${allOn?'bg-red-400 text-white':'bg-gray-100 text-gray-600'}`}>{allOn?'✓ 전체 해제':'전체 선택'}</button>
      <button onClick={()=>setWrongQSel(new Set())} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold">전체 해제</button>
      <label className="flex items-center gap-1.5 ml-auto text-xs font-bold text-gray-600">
        <input type="checkbox" checked={wrongQShowAns} onChange={e=>setWrongQShowAns(e.target.checked)}/>해설 포함
      </label>
    </div>
    {/* 카테고리별 아코디언 */}
    <div className="space-y-2 mb-3">
      {cats.map(cat=>{
        const items=grouped[cat];
        const catOn=items.every(({i})=>wrongQSel.has(i));
        const catSome=items.some(({i})=>wrongQSel.has(i));
        const isOpen=openCats.has(cat);
        return(<div key={cat} className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* 카테고리 헤더 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 cursor-pointer" onClick={()=>toggleCat(cat)}>
            <input type="checkbox" checked={catOn} ref={el=>{if(el)el.indeterminate=catSome&&!catOn;}} onChange={e=>{e.stopPropagation();selAllCat(cat);}} onClick={e=>e.stopPropagation()} className="w-4 h-4 rounded flex-shrink-0"/>
            <span className="flex-1 text-xs font-black text-gray-700">📂 {cat} <span className="text-gray-400 font-normal">({items.length}문항)</span></span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catSome?'bg-red-100 text-red-600':'bg-gray-100 text-gray-400'}`}>{items.filter(({i})=>wrongQSel.has(i)).length}개 선택</span>
            <button onClick={e=>{e.stopPropagation();selAllCat(cat);}} className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-500">{catOn?'해제':'전체'}</button>
            <span className="text-gray-400 text-xs">{isOpen?'▲':'▼'}</span>
          </div>
          {/* 문항 목록 */}
          {isOpen&&<div className="divide-y divide-gray-100">
            {items.map(({q,i})=>{
              const on=wrongQSel.has(i);
              const effGraph=tryReconstructGraph(q);
              return(<label key={i} className={`flex items-start gap-2 px-3 py-2 cursor-pointer ${on?'bg-red-50':'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={on} onChange={()=>setWrongQSel(prev=>{const s=new Set(prev);on?s.delete(i):s.add(i);return s;})} className="mt-0.5 w-4 h-4 flex-shrink-0 rounded"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 mb-0.5">{q._logDate} · {q._logType}</div>
                  <div className="text-sm font-bold text-gray-800 break-keep leading-snug">{q.qTxt||q.q||'(문제 없음)'}</div>
                  {effGraph&&<div className="mt-1 flex justify-center"><GraphPreview q={{...q,graph:effGraph}}/></div>}
                  {q.cAns&&<div className="text-xs text-indigo-600 mt-0.5">정답: {q.cAns}</div>}
                </div>
              </label>);
            })}
          </div>}
        </div>);
      })}
    </div>
    {/* 액션 버튼 */}
    {wrongQSel.size>0&&<div className="flex flex-col gap-2">
      <button onClick={printSelected} className="w-full py-3 bg-red-500 text-white rounded-2xl font-black text-sm active:scale-95">
        🖨️ 선택 오답 {wrongQSel.size}개 인쇄 ({wrongQShowAns?'해설 포함':'문제만'})
      </button>
      <button onClick={sendHomework} className="w-full py-3 bg-amber-500 text-white rounded-2xl font-black text-sm active:scale-95">
        📝 선택 오답 {wrongQSel.size}개 → {studentName} 학생에게 숙제로 내기
      </button>
    </div>}
  </div>);
}

function StudentFeedbackPanel(){
  const[msgs,setMsgs]=React.useState([]);
  const[loading,setLoading]=React.useState(false);
  const[collapsed,setCollapsed]=React.useState(true);
  const[selIds,setSelIds]=React.useState(new Set());

  const load=async()=>{
    setLoading(true);setSelIds(new Set());
    try{const snap=await db.collection('studentFeedback').orderBy('sentAt','desc').limit(30).get();const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));setMsgs(arr);}catch(e){}
    setLoading(false);
  };
  React.useEffect(()=>{load();},[]);

  const fmtTime=ts=>{if(!ts)return'';const d=ts.toDate?ts.toDate():new Date(ts);return d.toLocaleDateString('ko-KR')+' '+d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});};
  const markRead=async(id)=>{try{await db.collection('studentFeedback').doc(id).set({read:true},{merge:true});setMsgs(prev=>prev.map(m=>m.id===id?{...m,read:true}:m));}catch(e){}};

  const del=async(id)=>{
    if(!confirm('이 의견을 삭제할까요?'))return;
    try{await db.collection('studentFeedback').doc(id).delete();setMsgs(prev=>prev.filter(m=>m.id!==id));setSelIds(prev=>{const s=new Set(prev);s.delete(id);return s;});}catch(e){alert('삭제 실패');}
  };

  const delSelected=async()=>{
    if(selIds.size===0)return;
    if(!confirm(`선택한 ${selIds.size}개 의견을 삭제할까요?`))return;
    try{
      await Promise.all([...selIds].map(id=>db.collection('studentFeedback').doc(id).delete()));
      setMsgs(prev=>prev.filter(m=>!selIds.has(m.id)));
      setSelIds(new Set());
    }catch(e){alert('일부 삭제 실패');}
  };

  const toggleSel=(id)=>setSelIds(prev=>{const s=new Set(prev);s.has(id)?s.delete(id):s.add(id);return s;});
  const allChecked=msgs.length>0&&msgs.every(m=>selIds.has(m.id));
  const toggleAll=()=>setSelIds(allChecked?new Set():new Set(msgs.map(m=>m.id)));

  return(<div className="bg-white rounded-3xl p-5 shadow-md mb-4">
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-bold text-gray-400 uppercase">💬 학생 의견 수신함</div>
      <div className="flex gap-2 flex-wrap justify-end">
        {selIds.size>0&&<button onClick={delSelected} className="text-xs px-3 py-1 bg-red-500 text-white rounded-lg font-bold">🗑️ 선택 {selIds.size}개 삭제</button>}
        <button onClick={load} className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-bold">새로고침</button>
        <button onClick={()=>setCollapsed(v=>!v)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">{collapsed?'펼치기 ▼':'접기 ▲'}</button>
      </div>
    </div>
    {!collapsed&&<>
    {loading&&<div className="text-center text-gray-400 py-4">로딩 중...</div>}
    {!loading&&msgs.length===0&&<div className="text-center text-gray-400 py-4 text-sm">받은 의견이 없어요.</div>}
    {!loading&&msgs.length>0&&<div className="flex items-center gap-2 mb-2 px-1">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 cursor-pointer select-none">
        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 rounded"/>전체선택
      </label>
      {selIds.size>0&&<span className="text-xs text-red-500 font-bold">{selIds.size}개 선택됨</span>}
    </div>}
    {msgs.map(m=><div key={m.id} className={`border rounded-2xl p-3.5 mb-2.5 ${selIds.has(m.id)?'border-red-300 bg-red-50':m.read?'border-gray-100 bg-gray-50':'border-indigo-200 bg-indigo-50'}`}>
      <div className="flex items-start gap-2 mb-1.5">
        <input type="checkbox" checked={selIds.has(m.id)} onChange={()=>toggleSel(m.id)} className="w-4 h-4 mt-0.5 flex-shrink-0 rounded cursor-pointer"/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-gray-800 text-sm">👤 {m.studentName}</span>
            {!m.read&&<span className="text-[11px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">NEW</span>}
            <span className="text-[11px] text-gray-400 ml-auto">{fmtTime(m.sentAt)}</span>
          </div>
          <p className="text-sm text-gray-700 font-medium leading-relaxed break-keep">{m.message}</p>
          <div className="flex gap-2 mt-2.5 justify-end">
            {!m.read&&<button onClick={()=>markRead(m.id)} className="text-[11px] px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-bold">✓ 읽음 처리</button>}
            <button onClick={()=>del(m.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
          </div>
        </div>
      </div>
    </div>)}
    </>}
  </div>);
}
function FeedbackTab(){
  const[showStudentFb,setShowStudentFb]=useState(true);
  const[showRecentSessions,setShowRecentSessions]=useState(true);
  const[showFbList,setShowFbList]=useState(true);
  const[wrongQSel,setWrongQSel]=useState(new Set());
  const[wrongQShowAns,setWrongQShowAns]=useState(false);
  const[wrongQOpen,setWrongQOpen]=useState(false);
  const[sid,setSid]=useState('');
  const[student,setStudent]=useState(null);
  const[msg,setMsg]=useState('');
  const[relatedLogIdx,setRelatedLogIdx]=useState('');
  const[loading,setLoading]=useState(false);
  const[feedbacks,setFeedbacks]=useState([]);
  const[sent,setSent]=useState(false);
  const[editFbId,setEditFbId]=useState(null);
  const[editFbText,setEditFbText]=useState('');
  const[recentSessions,setRecentSessions]=useState([]);

  useEffect(()=>{
    db.collection('math_logs').orderBy('date','desc').limit(10).get().then(snap=>{
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      setRecentSessions(arr);
    }).catch(()=>{});
  },[]);

  const jumpToStudent=async(name)=>{
    setSid(name);
    setLoading(true);
    try{
      const doc=await db.collection('users').doc(name).get();
      if(doc.exists&&doc.data().role!=='admin'){
        setStudent(doc.data());
        const fbSnap=await db.collection('feedback').where('studentName','==',name).get();
        let arr=[];fbSnap.forEach(d=>arr.push({id:d.id,...d.data()}));
        arr.sort((a,b)=>{const tA=a.createdAt?.toDate?a.createdAt.toDate().getTime():new Date(a.createdAt).getTime();const tB=b.createdAt?.toDate?b.createdAt.toDate().getTime():new Date(b.createdAt).getTime();return tB-tA;});
        setFeedbacks(arr.slice(0,10));setRelatedLogIdx('');
      }
    }catch(e){}
    setLoading(false);
  };

  const search=async()=>{
    if(!sid.trim())return;
    setLoading(true);
    try{
      const doc=await db.collection('users').doc(sid.trim()).get();
      if(doc.exists && doc.data().role!=='admin'){
        setStudent(doc.data());
        const fbSnap=await db.collection('feedback').where('studentName','==',sid.trim()).get();
        let arr=[];
        fbSnap.forEach(d=>arr.push({id:d.id, ...d.data()}));
        arr.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
        setFeedbacks(arr.slice(0, 10));
        setRelatedLogIdx('');
      }else{
        alert('해당 학생을 찾을 수 없거나 선생님 계정입니다.');
      }
    }catch(e){
      alert('검색 실패: ' + e.message);
    }
    setLoading(false);
  };

  const send=async()=>{
    if(!msg.trim())return;
    try{
      let logStr = '';
      if(relatedLogIdx !== '' && student?.logs?.[relatedLogIdx]) {
         const l = student.logs[relatedLogIdx];
         logStr = `${fmtDate(l.date)} ${l.time} | ${l.type} | 점수: ${l.score}`;
      }
      await db.collection('feedback').add({
        studentName: sid.trim(),
        message: msg.trim(),
        relatedLog: logStr,
        read: false,
        createdAt: new Date()
      });
      setMsg(''); setRelatedLogIdx(''); setSent(true);
      setTimeout(()=>setSent(false), 2000);
      search();
    }catch(e){
      alert('피드백 저장 실패: ' + e.message);
    }
  };

  const deleteFb=async(id)=>{
    if(!confirm('이 피드백을 정말 삭제하시겠습니까?')) return;
    try{
      await db.collection('feedback').doc(id).delete();
      search();
    }catch(e){
      alert('삭제 실패: ' + e.message);
    }
  };

  const startFbEdit=(fb)=>{setEditFbId(fb.id);setEditFbText(fb.message);};
  const saveFbEdit=async(id)=>{
    if(!editFbText.trim())return;
    try{
      await db.collection('feedback').doc(id).set({message:editFbText.trim()},{merge:true});
      setEditFbId(null);setEditFbText('');
      search();
    }catch(e){alert('수정 실패: '+e.message);}
  };

  const selLog = relatedLogIdx !== '' ? student?.logs?.[relatedLogIdx] : null;
  const allWrongQs=React.useMemo(()=>(student?.logs||[]).flatMap((l,li)=>(l.questions||[]).filter(q=>!q.isOk).map(q=>({...q,_logDate:l.date,_logType:l.type,_logIdx:li}))),[student]);

  return(<div className="p-4 pb-36 space-y-4">
    <StudentFeedbackPanel/>
    {recentSessions.length>0&&<div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-400 uppercase">🕐 최근 학습 세션 (클릭 → 바로 조회)</div>
        <button onClick={()=>setShowRecentSessions(v=>!v)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">{showRecentSessions?'접기 ▲':'펼치기 ▼'}</button>
      </div>
      {showRecentSessions&&<div className="space-y-2">
        {recentSessions.map((s,i)=>(
          <button key={s.id||i} onClick={()=>jumpToStudent(s.studentName)} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] transition-all">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0">{(s.studentName||'?')[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-800 text-sm">{s.studentName||'?'}</div>
              <div className="text-xs text-gray-500 font-semibold truncate">{s.type||'학습'} · 점수: {s.score||'-'}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400 font-bold">{s.date||''}</div>
              <div className="text-xs text-gray-400">{s.time||''}</div>
            </div>
          </button>
        ))}
      </div>}
    </div>}
    <div className="bg-white rounded-3xl p-5 shadow-md">
      <div className="text-sm font-bold text-gray-400 uppercase mb-3">💬 학생 피드백 & 기록</div>
      <div className="flex flex-col gap-2 mb-3">
        <input type="text" lang="ko" value={sid} onChange={e=>setSid(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="학생 이름 입력" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base font-bold focus:border-indigo-400 outline-none"/>
        <button onClick={search} className="w-full py-3 bg-indigo-500 text-white rounded-2xl font-black text-base">{loading?'검색 중...':'🔍 학생 조회'}</button>
      </div>
      {student&&<div>
        <div className="bg-indigo-50 rounded-2xl p-4 mb-3 border border-indigo-200">
          <div className="font-black text-indigo-800 text-lg mb-1">👤 {student.name} 학생</div>
          <div className="text-sm text-indigo-600">총 레슨: {student.logs?.length||0}회 · 최근 접속: {student.lastLoginAt||student.lastDate||'없음'}</div>
        </div>

        {allWrongQs.length>0&&<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-black text-red-700">🔴 오답 문제지 생성 ({allWrongQs.length}개 오답)</div>
            <button onClick={()=>setWrongQOpen(v=>!v)} className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg font-bold">{wrongQOpen?'접기 ▲':'펼치기 ▼'}</button>
          </div>
          {wrongQOpen&&React.createElement(WrongQCategoryPanel,{allWrongQs,wrongQSel,setWrongQSel,wrongQShowAns,setWrongQShowAns,studentName:student.name})}
        </div>}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-4">
          <div className="text-sm font-bold text-gray-600 mb-2">📌 어떤 문제에 대한 피드백인가요? (선택사항)</div>
          <select value={relatedLogIdx} onChange={e=>setRelatedLogIdx(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-bold focus:border-indigo-400 outline-none mb-3 bg-gray-50 text-gray-700">
            <option value="">-- 특정 기록에 연결하지 않음 (일반 피드백) --</option>
            {student.logs?.slice(0, 15).map((log, i) => (
               <option key={i} value={i}>{fmtDate(log.date)} {log.time} | {log.type} | 점수: {log.score}</option>
            ))}
          </select>

          {selLog && selLog.questions && (
             <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
               <div className="text-xs font-black text-indigo-600 mb-2">📊 해당 학습의 정오표 (틀린 문제 위주로 확인해보세요)</div>
               <div className="space-y-2">
                 {selLog.questions.map((q, j) => (
                   <div key={j} className={`p-2.5 rounded-lg text-xs border ${q.isOk ? 'bg-white border-green-200' : 'bg-red-50 border-red-200'}`}>
                     <div className="flex gap-2 items-start">
                       <span className="font-black text-gray-500 flex-shrink-0">Q{j+1}.</span>
                       <span className="font-bold text-gray-800 flex-1 leading-snug break-keep">{q.qTxt}</span>
                       <span className={`font-black flex-shrink-0 text-sm ${q.isOk ? 'text-green-500' : 'text-red-500'}`}>{q.isOk ? 'O' : 'X'}</span>
                     </div>
                     {!q.isOk && <div className="mt-1.5 pl-6 text-gray-600 leading-snug break-keep">학생 답: <span className="font-bold">{q.uAns}</span> <span className="text-gray-400">→</span> 정답: <span className="text-red-600 font-bold">{q.cAns}</span></div>}
                   </div>
                 ))}
               </div>
             </div>
          )}

          <div className="text-sm font-bold text-gray-600 mb-2">✍️ 피드백 메시지 작성</div>
          <textarea lang="ko" value={msg} onChange={e=>setMsg(e.target.value)} rows={3} placeholder="예: 나눗셈 계산은 잘했어요! 약수 부분을 좀 더 연습해봐요 😊" className="w-full border-2 border-gray-200 rounded-xl p-4 text-base font-bold resize-none focus:border-indigo-400 outline-none mb-3"/>
          <button onClick={send} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base active:scale-95 transition-transform">{sent?'✅ 전송완료!':'피드백 저장 및 전송 💌'}</button>
        </div>

        {feedbacks.length>0&&<div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-gray-600">📬 보낸 피드백 기록</div>
            <button onClick={()=>setShowFbList(v=>!v)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">{showFbList?'접기 ▲':'펼치기 ▼'}</button>
          </div>
          {showFbList&&feedbacks.map((fb,i)=><div key={fb.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
               {fb.read
                 ? <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">학생이 읽음</span>
                 : <span className="text-[11px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold">안 읽음</span>}
               <span className="text-[11px] text-gray-400 ml-auto">{fb.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || new Date(fb.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            {fb.relatedLog && <div className="text-[11px] text-indigo-600 font-black mb-2 inline-block bg-white px-2 py-1 rounded-lg border border-indigo-100 break-keep">관련: {fb.relatedLog}</div>}
            {editFbId===fb.id?(
              <div className="space-y-2">
                <textarea lang="ko" value={editFbText} onChange={e=>setEditFbText(e.target.value)} rows={3} className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2 text-base font-bold resize-none outline-none focus:border-indigo-400"/>
                <div className="flex gap-2">
                  <button onClick={()=>saveFbEdit(fb.id)} className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm">저장</button>
                  <button onClick={()=>setEditFbId(null)} className="flex-1 py-2.5 bg-gray-200 text-gray-600 rounded-xl font-bold text-sm">취소</button>
                </div>
              </div>
            ):(
              <>
                <div className="text-gray-800 font-bold text-base leading-relaxed break-keep">{fb.message}</div>
                <div className="flex gap-2 mt-3 justify-end">
                  {!fb.read&&<button onClick={()=>startFbEdit(fb)} className="text-[11px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">✏️ 수정</button>}
                  <button onClick={()=>deleteFb(fb.id)} className="text-[11px] px-3 py-1.5 bg-red-50 text-red-500 rounded-lg font-bold">🗑️ 삭제</button>
                </div>
                {!fb.read&&<div className="text-[10px] text-gray-400 mt-1.5 text-right">아직 안 읽었을 때만 수정할 수 있어요</div>}
              </>
            )}
          </div>)}
        </div>}
      </div>}
    </div>
  </div>);
}

/* ===== 배움 글귀 스플래시 (로그인 직후 노출) ===== */
var LEARN_QUOTES=[
  "오늘 한 걸음이 어제보다 더 멀리 데려다줍니다.",
  "배움에 늦은 때란 없습니다. 시작한 지금이 가장 빠른 때예요.",
  "천천히 가도 괜찮아요. 멈추지만 않으면 도착합니다.",
  "어제는 몰랐던 것을 오늘 알게 되었다면, 그것으로 충분합니다.",
  "틀려도 괜찮아요. 틀린 만큼 더 단단해집니다.",
  "작은 물방울이 모여 바위를 뚫습니다. 당신의 오늘이 그렇습니다.",
  "한 글자, 한 숫자가 모여 큰 세상을 열어줍니다.",
  "당신은 이미 충분히 잘하고 있어요.",
  "모르는 것을 묻는 용기가 가장 큰 배움입니다.",
  "나이는 숫자일 뿐, 배움에는 끝이 없습니다.",
  "오늘 펼친 공책 한 장이 내일의 자신감이 됩니다.",
  "포기하지 않은 당신이 이미 승리자입니다.",
  "조금 느려도 괜찮아요. 꽃마다 피는 계절이 다르니까요.",
  "어렵게 느껴지는 건 새로운 것을 배우고 있다는 증거예요.",
  "당신의 노력은 결코 사라지지 않습니다. 차곡차곡 쌓이고 있어요.",
  "작게 시작한 일이 가장 멀리 갑니다.",
  "오늘 배운 것 하나가 당신을 어제보다 자유롭게 합니다.",
  "다시 해보는 것, 그것이 진짜 실력입니다.",
  "잘 모르겠으면 잠시 쉬어도 됩니다. 내일 다시 만나면 돼요.",
  "당신이 배우는 모습은 누군가에게 큰 용기가 됩니다.",
  "한 번에 다 알 필요 없어요. 천천히, 하나씩이면 충분합니다.",
  "오늘의 작은 성취를 스스로 칭찬해 주세요.",
  "길을 잃은 게 아니라, 새로운 길을 배우는 중입니다.",
  "배움은 나이를 묻지 않고, 마음을 봅니다.",
  "어제의 나보다 한 뼘 자란 오늘의 나를 응원합니다.",
  "모든 위대한 것은 작은 시작에서 비롯됩니다.",
  "당신의 속도가 가장 알맞은 속도입니다.",
  "펜을 든 손이 가장 빛나는 손입니다.",
  "실수는 배움의 다른 이름입니다. 두려워하지 마세요.",
  "오늘도 배우러 온 당신, 정말 멋집니다.",
  {text:"교육은 세상을 바꾸는 데 쓸 수 있는 가장 강력한 무기입니다.",author:"넬슨 만델라"},
  {text:"교육을 통해 농부의 딸은 의사가 되고, 광부의 아들은 광산의 책임자가 될 수 있습니다.",author:"넬슨 만델라"},
  {text:"희망은 강력한 무기입니다.",author:"넬슨 만델라"},
  {text:"교육은 삶을 돕는 일로 이해되어야 합니다.",author:"마리아 몬테소리"},
  {text:"아이의 마음은 지식을 흡수할 수 있고, 스스로를 가르칠 힘이 있습니다.",author:"마리아 몬테소리"},
  {text:"손은 인간 지성의 도구입니다.",author:"마리아 몬테소리"},
  {text:"개별적인 활동은 발달을 자극하고 만들어 내는 중요한 힘입니다.",author:"마리아 몬테소리"},
  {text:"독립을 향한 정복은 자연스러운 발달의 기본 단계입니다.",author:"마리아 몬테소리"},
  {text:"사람은 끊임없는 활동을 통해 독립을 이루고, 꾸준한 노력으로 자유로워집니다.",author:"마리아 몬테소리"},
  {text:"발달은 활동에서 옵니다. 환경은 스스로 경험하고 싶게 만드는 관심거리로 풍부해야 합니다.",author:"마리아 몬테소리"},
  {text:"사람은 환경에서 직접 경험함으로써 온전히 발달할 수 있습니다.",author:"마리아 몬테소리"},
  {text:"교육의 첫째 임무는 삶을 북돋우면서도 삶이 스스로 펼쳐지도록 자유롭게 두는 것입니다.",author:"마리아 몬테소리"},
  {text:"성공의 비결은 무엇이 옳은지 알아차리고 그것을 해낼 수 있도록 돕는 데 있습니다.",author:"마리아 몬테소리"},
  {text:"스스로 해낼 수 있다고 느끼는 순간, 사람은 새로운 힘을 얻습니다.",author:"마리아 몬테소리"},
  {text:"교사를 진정한 교사로 만드는 것은 인간을 향한 사랑입니다.",author:"마리아 몬테소리"},
  {text:"교육은 듣고 외우는 일이 아니라, 스스로 움직이며 만들어 가는 과정입니다.",author:"존 듀이"},
  {text:"교육은 미래의 삶을 준비하는 일이 아니라, 지금 살아가는 삶 그 자체입니다.",author:"존 듀이"},
  {text:"교육은 경험을 끊임없이 다시 조직하고 새롭게 만드는 일입니다.",author:"존 듀이"},
  {text:"생각하는 사람은 실패에서도 성공만큼 많은 것을 배웁니다.",author:"존 듀이"},
  {text:"배움은 수동적으로 받아들이는 것이 아니라 능동적으로 탐구하는 데서 시작됩니다.",author:"존 듀이"},
  {text:"가르침과 배움은 파는 일과 사는 일처럼 서로 함께 이루어지는 과정입니다.",author:"존 듀이"},
  {text:"삶의 모든 만남에서 배우려는 관심은 중요한 도덕적 태도입니다.",author:"존 듀이"},
  {text:"새로운 사실과 진리를 발견하는 길은 끈기 있게 질문하고 탐구하는 데 있습니다.",author:"존 듀이"},
  {text:"낙관은 성취로 이끄는 믿음입니다. 희망 없이는 아무것도 이룰 수 없습니다.",author:"헬렌 켈러"},
  {text:"지식은 사랑이며, 빛이며, 볼 수 있게 하는 힘입니다.",author:"헬렌 켈러"},
  {text:"혼자서는 아주 적은 일을 할 수 있지만, 함께하면 훨씬 많은 일을 할 수 있습니다.",author:"헬렌 켈러"},
  {text:"삶은 대담한 모험이거나, 아무것도 아닙니다.",author:"헬렌 켈러"},
  {text:"장애물을 넘기 위해 들인 모든 노력은 우리에게 힘과 자신감을 줍니다.",author:"부커 T. 워싱턴"},
  {text:"학교는 책만 공부하는 곳이 아니라, 실제의 일을 배우는 곳이어야 합니다.",author:"부커 T. 워싱턴"},
  {text:"어려움이 클수록 그것을 이겨 냈을 때의 성공도 더 커집니다.",author:"부커 T. 워싱턴"}
];
var QUOTE_BGS=[
  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
  'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  'linear-gradient(135deg,#30cfd0 0%,#330867 100%)',
  'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)',
  'linear-gradient(135deg,#5ee7df 0%,#b490ca 100%)',
  'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
  'linear-gradient(135deg,#84fab0 0%,#8fd3f4 100%)'
];


