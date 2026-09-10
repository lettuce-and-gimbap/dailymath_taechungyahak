// === js/math/graphPreview.js ===
/* --------------------------------------------------------------------
   문제의 graph 데이터를 그리는 미리보기
   문제풀기·모의고사·오답노트·학습지에서 공용
   -------------------------------------------------------------------- */

/* ── 기하 그래프 미리보기 SVG ──
   q.graph 객체를 직접 읽어 정확한 그래프를 렌더링.
   graph 구조:
     이차함수: {type:'quadratic', a, p, q, ds, de}
     무리함수: {type:'radical',   a, p(=dx), q(=dy)}
     유리함수: {type:'rational',  k, p(=dx), q(=dy)}
     원:       {type:'circle',    h, k, r}
     점↔직선:  {type:'distance',  ptX, ptY, la, lb, lc}
     대칭이동: {type:'symmetry',  px, py, sym}
*/

function GraphPreview({q}){
  if(!q?.graph) return null;
  const g=q.graph;

  // ── 0. 연립방정식/연립부등식 — 세로 나열 + 왼쪽 중괄호 ──
  if(g.type==='system_eq'){
    const{eqs}=g;
    const lineH=34, padX=18, padY=16;
    const svgH=padY*2+eqs.length*lineH;
    const svgW=280;
    const bracePath=(()=>{
      const top=padY+lineH/2-2, bot=padY+(eqs.length-1)*lineH+lineH/2+2, mid=(top+bot)/2;
      const bx=10, inset=6;
      return `M${bx+inset},${top} Q${bx},${top} ${bx},${top+8} L${bx},${mid-6} Q${bx},${mid} ${bx-inset},${mid} Q${bx},${mid} ${bx},${mid+6} L${bx},${bot-8} Q${bx},${bot} ${bx+inset},${bot}`;
    })();
    return(
      <svg width={svgW} height={svgH} className="my-1 block mx-auto overflow-visible">
        <path d={bracePath} fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        {eqs.map((eq,i)=>(
          <text key={i} x={padX} y={padY+(i+0.5)*lineH+6} fontSize={15} fontWeight="700" fill="#1e293b" fontFamily="monospace">{eq}</text>
        ))}
      </svg>
    );
  }

  // 공통 좌표계 설정
  const W=220,H=180,SC=22;
  // 그래프 중심을 콘텐츠에 맞게 이동 (circle은 원의 중심 기준, 나머지 원점 기준)
  let CX=W/2, CY=H/2;
  if(g.type==='circle'){CX=W/2-g.h*SC*0.5; CY=H/2+g.k*SC*0.5;}
  if(g.type==='rational'){CX=W/2-g.p*SC; CY=H/2+g.q*SC;}
  if(g.type==='two_point'){CX=W/2-((g.x1+g.x2)/2)*SC; CY=H/2+((g.y1+g.y2)/2)*SC;}
  const toSx=x=>CX+x*SC, toSy=y=>CY-y*SC;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

  // ── 좌표축 & 격자 공통 레이어 ──
  const ticks=[-4,-3,-2,-1,1,2,3,4];
  const labelTicks=[-4,-2,2,4]; // 숫자는 듬성듬성만 표기(난잡함 방지)
  const Axes=()=>(
    <g>
      {ticks.map(n=>(
        <g key={n}>
          <line x1={toSx(n)} y1={4} x2={toSx(n)} y2={H-4} stroke="#eef1f6" strokeWidth={0.6}/>
          <line x1={4} y1={toSy(n)} x2={W-4} y2={toSy(n)} stroke="#eef1f6" strokeWidth={0.6}/>
        </g>
      ))}
      {labelTicks.map(n=>(
        <g key={'lbl'+n}>
          <text x={toSx(n)} y={CY+13} textAnchor="middle" fontSize={10} fill="#9ca3af" fontWeight="600">{n}</text>
          <text x={CX-6} y={toSy(n)+3} textAnchor="end" fontSize={10} fill="#9ca3af" fontWeight="600">{n}</text>
        </g>
      ))}
      <line x1={4} y1={CY} x2={W-4} y2={CY} stroke="#374151" strokeWidth={1.8}/>
      <line x1={CX} y1={4} x2={CX} y2={H-4} stroke="#374151" strokeWidth={1.8}/>
      <polygon points={`${W-4},${CY} ${W-12},${CY-3} ${W-12},${CY+3}`} fill="#374151"/>
      <polygon points={`${CX},4 ${CX-3},12 ${CX+3},12`} fill="#374151"/>
      <text x={W-3} y={CY+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>
      <text x={CX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>
    </g>
  );

  // ── 1. 이차함수  y = a(x−p)² + q  (구간 [ds,de] 집중 표시) ──
  if(g.type==='quadratic'){
    const{a,p,q:vq,ds,de}=g;
    const yDs=a*(ds-p)**2+vq, yDe=a*(de-p)**2+vq;
    const vxInRange=p>=ds&&p<=de;

    // ── 스케일 계산: x는 구간을 기준으로 여백 조금만 ──
    const xSpan=de-ds;                              // 구간 길이
    const xPad=Math.max(0.6, xSpan*0.12);          // x 여백(좁게)
    const xLo=ds-xPad, xHi=de+xPad;

    // y: 꼭짓점 항상 포함, 적당한 패딩
    const keyYs=[yDs,yDe,vq];                       // 끝점+꼭짓점
    const rawYMin=Math.min(...keyYs), rawYMax=Math.max(...keyYs);
    const ySpan=Math.max(rawYMax-rawYMin,1);
    const yPad=Math.max(1, ySpan*0.28);             // 위아래 여백(적당히)
    const yLo=rawYMin-yPad, yHi=rawYMax+yPad;

    // x, y 독립 스케일 (구간이 화면 너비를 꽉 채우도록)
    const marg=26;
    const qSCx=Math.min(38, Math.max(12, (W-2*marg)/(xHi-xLo)));
    const qSCy=Math.min(38, Math.max(8,  (H-2*marg)/(yHi-yLo)));
    const toQx=x=>marg+(x-xLo)*qSCx;
    const toQy=y=>H-marg-(y-yLo)*qSCy;

    const axY=toQy(0);  // x축 화면 y좌표
    const axX=toQx(0);  // y축 화면 x좌표

    // 격자·축 라벨: 정수만, 화면 안에 들어오는 것만
    const allXInts=[];for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)allXInts.push(n);
    const allYInts=[];for(let n=Math.ceil(yLo);n<=Math.floor(yHi);n++)allYInts.push(n);
    const xStep=Math.max(1,Math.ceil(allXInts.length/5));
    const yStep=Math.max(1,Math.ceil(allYInts.length/5));

    // 포물선 점 생성 (전체 구간 + 약간 밖까지)
    const pts=[], rangePts=[];
    for(let xi=xLo;xi<=xHi;xi+=0.1){
      const yi=a*(xi-p)**2+vq;
      const sx=toQx(xi),sy=toQy(yi);
      if(sx>=-4&&sx<=W+4&&sy>=-4&&sy<=H+4)pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    for(let xi=ds;xi<=de;xi+=0.08){
      const yi=a*(xi-p)**2+vq;
      const sx=toQx(xi),sy=toQy(yi);
      if(sy>=-4&&sy<=H+4)rangePts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }

    // 극값점: a>0 → 최솟값만 / a<0 → 최댓값만
    const cand=[{x:ds,y:yDs},{x:de,y:yDe}];
    if(vxInRange)cand.push({x:p,y:vq});
    const extremePt=a>0
      ? cand.reduce((m,c)=>c.y<m.y?c:m)   // 최솟값
      : cand.reduce((m,c)=>c.y>m.y?c:m);  // 최댓값
    const extremeColor=a>0?'#2563eb':'#ef4444';

    // 시작점/끝점 (극값과 겹치지 않는 것)
    const startPt={x:ds,y:yDs};
    const endPt  ={x:de,y:yDe};
    const isDsExtreme=startPt.x===extremePt.x;
    const isDeExtreme=endPt.x===extremePt.x;

    const color=a>0?'#4f46e5':'#ef4444';
    const axXvis=axX>=4&&axX<=W-4;
    const axYvis=axY>=4&&axY<=H-4;

    // 수선의 발 점선: 점 → x축, 점 → y축 (mx/my: 축 위 좌표 강조 텍스트)
    const drawDropLines=(px2,py2,lineColor,mx,my)=>{
      if(!axYvis&&!axXvis)return null;
      return(<g>
        {axYvis&&<line x1={px2} y1={py2} x2={px2} y2={axY} stroke={lineColor} strokeWidth={1.1} strokeDasharray="3,2" opacity={0.7}/>}
        {axXvis&&<line x1={axX} y1={py2} x2={px2} y2={py2} stroke={lineColor} strokeWidth={1.1} strokeDasharray="3,2" opacity={0.7}/>}
        {axYvis&&mx!=null&&<text x={px2} y={Math.min(axY+13,H-2)} textAnchor="middle" fontSize={10} fill={lineColor} fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke">{mx}</text>}
        {axXvis&&my!=null&&<text x={Math.max(axX-5,14)} y={py2+4} textAnchor="end" fontSize={10} fill={lineColor} fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke">{my}</text>}
      </g>);
    };

    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 격자 */}
        <g>
          {allXInts.map(n=><line key={'gx'+n} x1={toQx(n)} y1={4} x2={toQx(n)} y2={H-4} stroke="#eef1f6" strokeWidth={0.6}/>)}
          {allYInts.map(n=><line key={'gy'+n} x1={4} y1={toQy(n)} x2={W-4} y2={toQy(n)} stroke="#eef1f6" strokeWidth={0.6}/>)}
        </g>
        {/* x축 */}
        {axYvis&&<line x1={4} y1={axY} x2={W-4} y2={axY} stroke="#374151" strokeWidth={1.8}/>}
        {axYvis&&<polygon points={`${W-4},${axY} ${W-12},${axY-3} ${W-12},${axY+3}`} fill="#374151"/>}
        {axYvis&&<text x={W-3} y={Math.min(axY+12,H-2)} fontSize={9} fill="#374151" fontWeight="bold">x</text>}
        {/* y축 */}
        {axXvis&&<line x1={axX} y1={4} x2={axX} y2={H-4} stroke="#374151" strokeWidth={1.8}/>}
        {axXvis&&<polygon points={`${axX},4 ${axX-3},12 ${axX+3},12`} fill="#374151"/>}
        {axXvis&&<text x={axX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>}
        {/* 축 숫자 라벨 (듬성듬성, 0 제외) */}
        {axYvis&&allXInts.filter((n,i)=>n!==0&&i%xStep===0&&toQx(n)>12&&toQx(n)<W-10).map(n=>(
          <text key={'lx'+n} x={toQx(n)} y={Math.min(axY+13,H-2)} textAnchor="middle" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>
        ))}
        {axXvis&&allYInts.filter((n,i)=>n!==0&&i%yStep===0&&toQy(n)>10&&toQy(n)<H-6).map(n=>(
          <text key={'ly'+n} x={Math.max(axX-6,14)} y={toQy(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>
        ))}
        {/* 포물선 전체(옅게) */}
        {pts.length>1&&<polyline points={pts.join(' ')} fill="none" stroke="#c7d2fe" strokeWidth={1.4}/>}
        {/* 포물선 구간(진하게) */}
        {rangePts.length>1&&<polyline points={rangePts.join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"/>}
        {/* 구간 시작점 수선의 발 + 점 (극값 아닌 경우) */}
        {!isDsExtreme&&<g>
          {drawDropLines(toQx(ds),toQy(yDs),'#6b7280',ds,yDs)}
          <circle cx={toQx(ds)} cy={toQy(yDs)} r={4} fill="white" stroke="#6b7280" strokeWidth={2}/>
        </g>}
        {/* 구간 끝점 수선의 발 + 점 (극값 아닌 경우) */}
        {!isDeExtreme&&<g>
          {drawDropLines(toQx(de),toQy(yDe),'#6b7280',de,yDe)}
          <circle cx={toQx(de)} cy={toQy(yDe)} r={4} fill="white" stroke="#6b7280" strokeWidth={2}/>
        </g>}
        {/* 꼭짓점이 구간 내이고 극값이 아닌 경우 */}
        {vxInRange&&extremePt.x!==p&&<circle cx={toQx(p)} cy={toQy(vq)} r={3.5} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2,2"/>}
        {/* ★ 극값점: 수선의 발 + 축 좌표 강조 (강조 원 없음) */}
        {drawDropLines(toQx(extremePt.x),toQy(extremePt.y),extremeColor,extremePt.x,Math.round(extremePt.y*100)/100)}
      </svg>
    );
  }

  // ── 2. 무리함수  y = a√(x − p) + q ──
  if(g.type==='radical'){
    const{a,p,q:vq}=g;
    const aStr=a===1?'':a===-1?'−':String(a);
    const pStr=p===0?'x':(p>0?`x−${p}`:`x+${-p}`);
    const qStr=vq===0?'':(vq>0?`+${vq}`:`−${-vq}`);
    // 두 시작점 (0,0)과 (p,vq)가 모두 보이는 뷰포트 자동 계산
    const xLo=Math.min(0,p)-0.3, xHi=Math.max(0,p)+5.5;
    const yEnd1=a*Math.sqrt(Math.max(0,xHi-p))+vq;
    const yEnd2=a*Math.sqrt(xHi);
    const allY=[0,vq,yEnd1,yEnd2];
    const yLoR=Math.min(...allY)-0.6, yHiR=Math.max(...allY)+0.8;
    const marg=22;
    const scX=(W-2*marg)/(xHi-xLo), scY=(H-2*marg)/(yHiR-yLoR);
    const sc=Math.min(scX,scY,28);
    const rtx=x=>marg+(x-xLo)*sc, rty=y=>H-marg-(y-yLoR)*sc;
    const axY=rty(0), axX=rtx(0);
    const axYvis=axY>=4&&axY<=H-4, axXvis=axX>=4&&axX<=W-4;
    const xInts=[]; for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++) xInts.push(n);
    const yInts=[]; for(let n=Math.ceil(yLoR);n<=Math.floor(yHiR);n++) yInts.push(n);
    // 원본 곡선 y=a√x
    const refPts=[];
    for(let xi=0;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(xi);const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)refPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    // 번역 곡선 y=a√(x-p)+vq
    const mainPts=[];
    for(let xi=p;xi<=xHi;xi+=0.08){const yi=a*Math.sqrt(Math.max(0,xi-p))+vq;const sx=rtx(xi),sy=rty(yi);if(sy>=-4&&sy<=H+4&&sx<=W+4)mainPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);}
    // 레이블 위치
    const refLX=Math.min(xHi*0.45,3), refLY=a*Math.sqrt(Math.max(0,refLX));
    const mnLX=p+Math.min(2.5,(xHi-p)*0.45), mnLY=a*Math.sqrt(Math.max(0,mnLX-p))+vq;
    const cRef='#9ca3af', cMain='#059669';
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <g>{xInts.map(n=><line key={'gx'+n} x1={rtx(n)} y1={4} x2={rtx(n)} y2={H-4} stroke="#eef1f6" strokeWidth={0.6}/>)}
           {yInts.map(n=><line key={'gy'+n} x1={4} y1={rty(n)} x2={W-4} y2={rty(n)} stroke="#eef1f6" strokeWidth={0.6}/>)}</g>
        {axYvis&&<line x1={4} y1={axY} x2={W-4} y2={axY} stroke="#374151" strokeWidth={1.8}/>}
        {axYvis&&<polygon points={`${W-4},${axY} ${W-12},${axY-3} ${W-12},${axY+3}`} fill="#374151"/>}
        {axYvis&&<text x={W-3} y={Math.min(axY+12,H-2)} fontSize={9} fill="#374151" fontWeight="bold">x</text>}
        {axXvis&&<line x1={axX} y1={4} x2={axX} y2={H-4} stroke="#374151" strokeWidth={1.8}/>}
        {axXvis&&<polygon points={`${axX},4 ${axX-3},12 ${axX+3},12`} fill="#374151"/>}
        {axXvis&&<text x={axX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>}
        {axYvis&&xInts.filter(n=>n!==0&&rtx(n)>12&&rtx(n)<W-8).map(n=>(
          <text key={'lx'+n} x={rtx(n)} y={Math.min(axY+13,H-2)} textAnchor="middle" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>
        ))}
        {axXvis&&yInts.filter(n=>n!==0&&rty(n)>8&&rty(n)<H-4).map(n=>(
          <text key={'ly'+n} x={Math.max(axX-5,14)} y={rty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>
        ))}
        {/* 원본 곡선 y=a√x (회색 점선 + 레이블) */}
        {refPts.length>1&&<polyline points={refPts.join(' ')} fill="none" stroke={cRef} strokeWidth={2} strokeDasharray="5,3"/>}
        {refPts.length>3&&<text x={rtx(refLX)+4} y={rty(refLY)+(a>0?-7:9)} fontSize={9} fill={cRef} fontWeight="bold">y={aStr}√x</text>}
        {/* 번역 곡선 y=a√(x-p)+vq (녹색 실선) */}
        {mainPts.length>1&&<polyline points={mainPts.join(' ')} fill="none" stroke={cMain} strokeWidth={3} strokeLinecap="round"/>}
        {/* 시작점 → 축 수선의 발 */}
        {axYvis&&<line x1={rtx(p)} y1={rty(vq)} x2={rtx(p)} y2={axY} stroke={cMain} strokeWidth={1.2} strokeDasharray="3,2" opacity={0.7}/>}
        {axXvis&&<line x1={axX} y1={rty(vq)} x2={rtx(p)} y2={rty(vq)} stroke={cMain} strokeWidth={1.2} strokeDasharray="3,2" opacity={0.7}/>}
        <circle cx={rtx(p)} cy={rty(vq)} r={4.5} fill={cMain} stroke="white" strokeWidth={2}/>
        {/* 번역 곡선 레이블 */}
        {mainPts.length>3&&<text x={rtx(mnLX)+4} y={rty(mnLY)+(a>0?-7:9)} fontSize={9} fill={cMain} fontWeight="bold">y={aStr}√({pStr}){qStr}</text>}
      </svg>
    );
  }

  // ── 3. 유리함수  y = k / (x − p) + q ──
  if(g.type==='rational'){
    const{k,p,q:vq}=g;  // p=dx, q=dy, k=분자
    const eps=0.18;
    const ptsL=[], ptsR=[];
    for(let xi=p-6;xi<p-eps;xi+=0.12){
      const yi=k/(xi-p)+vq;
      if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4) ptsL.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);
    }
    for(let xi=p+eps;xi<=p+6;xi+=0.12){
      const yi=k/(xi-p)+vq;
      if(Math.abs(yi-vq)<=5&&toSx(xi)>=4&&toSx(xi)<=W-4) ptsR.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);
    }
    const color='#7c3aed';
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <Axes/>
        {/* 점근선 */}
        <line x1={toSx(p)} y1={6} x2={toSx(p)} y2={H-6} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.85}/>
        <line x1={6} y1={toSy(vq)} x2={W-6} y2={toSy(vq)} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.85}/>
        {/* 점근선 레이블 */}
        <text x={toSx(p)+4} y={14} fontSize={8} fill="#d97706" fontWeight="bold">x={p}</text>
        <text x={W-28} y={toSy(vq)-4} fontSize={8} fill="#d97706" fontWeight="bold">y={vq}</text>
        {ptsL.length>1&&<polyline points={ptsL.join(' ')} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round"/>}
        {ptsR.length>1&&<polyline points={ptsR.join(' ')} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round"/>}
      </svg>
    );
  }

  // ── 4. 원의 방정식  (x−h)² + (y−k)² = r²  (원이 잘리지 않게 자동 맞춤) ──
  if(g.type==='circle'){
    const{h,k,r}=g;
    const margin=26;
    // 원 전체 + 원점이 모두 보이도록 콘텐츠 범위 산정
    const xs=[h-r,h+r,0], ys=[k-r,k+r,0];
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const spanX=Math.max(xmax-xmin,1), spanY=Math.max(ymax-ymin,1);
    const cSC=Math.min((W-2*margin)/spanX,(H-2*margin)/spanY,26); // 너무 작아지지 않게 상한 26
    const cxC=(xmin+xmax)/2, cyC=(ymin+ymax)/2;
    const ox=W/2-cxC*cSC, oy=H/2+cyC*cSC; // 화면상의 원점 위치
    const tx=x=>ox+x*cSC, ty=y=>oy-y*cSC;
    const color='#2563eb';
    // 라벨 틱(원 주변 정수, 듬성듬성)
    const xTickRange=[],yTickRange=[];
    for(let n=Math.ceil(xmin);n<=Math.floor(xmax);n++) xTickRange.push(n);
    for(let n=Math.ceil(ymin);n<=Math.floor(ymax);n++) yTickRange.push(n);
    const xStep=Math.max(1,Math.round(xTickRange.length/5));
    const yStep=Math.max(1,Math.round(yTickRange.length/5));
    const axisXvis=ty(0)>=4&&ty(0)<=H-4;
    const axisYvis=tx(0)>=4&&tx(0)<=W-4;
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 격자 */}
        <g>
          {xTickRange.map(n=><line key={'gx'+n} x1={tx(n)} y1={4} x2={tx(n)} y2={H-4} stroke="#eef1f6" strokeWidth={0.6}/>)}
          {yTickRange.map(n=><line key={'gy'+n} x1={4} y1={ty(n)} x2={W-4} y2={ty(n)} stroke="#eef1f6" strokeWidth={0.6}/>)}
        </g>
        {/* 좌표축 */}
        {axisXvis&&<line x1={4} y1={ty(0)} x2={W-4} y2={ty(0)} stroke="#374151" strokeWidth={1.8}/>}
        {axisYvis&&<line x1={tx(0)} y1={4} x2={tx(0)} y2={H-4} stroke="#374151" strokeWidth={1.8}/>}
        {/* 축 라벨(듬성듬성, 0 제외) */}
        {axisXvis&&xTickRange.filter((n,i)=>n!==0&&i%xStep===0).map(n=><text key={'tx'+n} x={tx(n)} y={Math.min(ty(0)+13,H-2)} textAnchor="middle" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>)}
        {axisYvis&&yTickRange.filter((n,i)=>n!==0&&i%yStep===0).map(n=><text key={'tyl'+n} x={Math.max(tx(0)-6,12)} y={ty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>)}
        {/* 원 */}
        <circle cx={tx(h)} cy={ty(k)} r={r*cSC} fill="rgba(37,99,235,0.06)" stroke={color} strokeWidth={2.5}/>
        {/* 반지름 선 */}
        <line x1={tx(h)} y1={ty(k)} x2={tx(h+r)} y2={ty(k)} stroke={color} strokeWidth={1.8} strokeDasharray="4,3"/>
        <text x={tx(h+r/2)} y={ty(k)-7} textAnchor="middle" fontSize={12} fill={color} fontWeight="900" stroke="white" strokeWidth="3" paintOrder="stroke">r={r}</text>
        {/* 중심 */}
        <circle cx={tx(h)} cy={ty(k)} r={4.5} fill={color} stroke="white" strokeWidth={2}/>
        <text x={tx(h)} y={ty(k)+(k>=0?20:-12)} textAnchor="middle" fontSize={12} fill={color} fontWeight="900" stroke="white" strokeWidth="3.5" paintOrder="stroke">중심({h},{k})</text>
      </svg>
    );
  }

  // ── 5. 점과 직선 거리  ax + by + c = 0, 점(ptX, ptY) ──
  if(g.type==='distance'){
    const{ptX,ptY,la,lb,lc}=g;
    const color='#ea580c';
    // 직선 두 점 계산 (x=-5, x=5)
    const linePoints=[];
    if(Math.abs(lb)>0.001){
      [-5,5].forEach(xi=>{const yi=-(la*xi+lc)/lb; linePoints.push([toSx(xi),toSy(yi)]);});
    }else if(Math.abs(la)>0.001){
      const xi=-lc/la; linePoints.push([toSx(xi),4],[toSx(xi),H-4]);
    }
    // 수선의 발
    const denSq=la**2+lb**2;
    const nV=la*ptX+lb*ptY+lc;
    const fX=denSq>0?ptX-la*nV/denSq:ptX;
    const fY=denSq>0?ptY-lb*nV/denSq:ptY;
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <Axes/>
        {/* 직선 */}
        {linePoints.length===2&&<line x1={linePoints[0][0]} y1={linePoints[0][1]} x2={linePoints[1][0]} y2={linePoints[1][1]} stroke="#374151" strokeWidth={2} strokeLinecap="round"/>}
        {/* 수선 */}
        <line x1={toSx(ptX)} y1={toSy(ptY)} x2={toSx(fX)} y2={toSy(fY)} stroke={color} strokeWidth={2} strokeDasharray="4,3"/>
        {/* 점 */}
        <circle cx={toSx(ptX)} cy={toSy(ptY)} r={5} fill={color} stroke="white" strokeWidth={2}/>
        <text x={toSx(ptX)+7} y={toSy(ptY)-5} fontSize={9} fill={color} fontWeight="bold">({ptX},{ptY})</text>
        {/* 수선의 발 */}
        <circle cx={toSx(fX)} cy={toSy(fY)} r={3} fill="white" stroke={color} strokeWidth={2}/>
        {/* 직각 기호 */}
        {Math.abs(nV)>0.01&&(()=>{
          const len=0.3;
          const nx=-lb/Math.sqrt(denSq),ny=la/Math.sqrt(denSq);
          const ax=la/Math.sqrt(denSq),ay=lb/Math.sqrt(denSq);
          const qx=fX+len*(ax+nx),qy=fY+len*(ay+ny);
          return<polyline points={`${toSx(fX+len*ax)},${toSy(fY+len*ay)} ${toSx(qx)},${toSy(qy)} ${toSx(fX+len*nx)},${toSy(fY+len*ny)}`} fill="none" stroke={color} strokeWidth={1.5}/>;
        })()}
        {/* 직선 방정식 레이블 */}
        <text x={8} y={14} fontSize={9} fill="#374151" fontWeight="bold">{la}x{lb>=0?`+${lb}`:lb}y{lc>=0?`+${lc}`:lc}=0</text>
      </svg>
    );
  }

  // ── 6. 대칭이동 (원래 점 + 대칭축만 표시, 정답 점은 비공개) ──
  if(g.type==='symmetry'){
    const{px,py,sym}=g;
    const symLinePoints=[];
    if(sym==='y=x'){symLinePoints.push([toSx(-4),toSy(-4)],[toSx(4),toSy(4)]);}
    else if(sym==='y=-x'){symLinePoints.push([toSx(-4),toSy(4)],[toSx(4),toSy(-4)]);}
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <Axes/>
        {/* 대칭축 (y=x, y=-x) */}
        {symLinePoints.length===2&&<line x1={symLinePoints[0][0]} y1={symLinePoints[0][1]} x2={symLinePoints[1][0]} y2={symLinePoints[1][1]} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,3"/>}
        {/* 원점 대칭: 원점 강조 표시 */}
        {sym==='원점'&&<circle cx={toSx(0)} cy={toSy(0)} r={5} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3,2"/>}
        {/* 원래 점만 표시 — 대칭이동된 정답 점은 표시하지 않음 */}
        <circle cx={toSx(px)} cy={toSy(py)} r={5} fill="#6b7280" stroke="white" strokeWidth={2}/>
        <text x={toSx(px)+7} y={toSy(py)-5} fontSize={9} fill="#6b7280" fontWeight="bold">({px},{py})</text>
        {/* 대칭 종류 레이블 */}
        <text x={W/2} y={H-5} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight="bold">{sym} 대칭</text>
      </svg>
    );
  }

  // ── 6b. 두 점 사이의 거리 — A·B 두 점과 연결 선분 ──
  if(g.type==='two_point'){
    const{x1,y1,x2,y2}=g;
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <Axes/>
        <line x1={toSx(x1)} y1={toSy(y1)} x2={toSx(x2)} y2={toSy(y2)} stroke="#6366f1" strokeWidth={2} strokeDasharray="5,3"/>
        <circle cx={toSx(x1)} cy={toSy(y1)} r={5} fill="#4f46e5" stroke="white" strokeWidth={2}/>
        <text x={toSx(x1)+8} y={toSy(y1)-6} fontSize={9} fontWeight="bold" fill="#4f46e5">A({x1},{y1})</text>
        <circle cx={toSx(x2)} cy={toSy(y2)} r={5} fill="#dc2626" stroke="white" strokeWidth={2}/>
        <text x={toSx(x2)+8} y={toSy(y2)-6} fontSize={9} fontWeight="bold" fill="#dc2626">B({x2},{y2})</text>
      </svg>
    );
  }

  // ── 6c. 합성함수 — X·Y·Z 세 타원 + 이중 화살표 다이어그램 ──
  if(g.type==='composite_map'){
    const{X,Y,Z,f_map,g_map,inp,fx,gfx}=g;
    const n=X.length;
    const svgW=320,svgH=Math.max(200,n*38+60);
    const lx=54,mx=160,rzx=266,oy=svgH/2;
    const ovalRy=Math.min(70,n*14+18),ovalRx=40;
    const spY=Math.min(32,(ovalRy*2-20)/Math.max(n-1,1));
    const baseY=oy-(n-1)*spY/2;
    const pX=(i)=>({x:lx,y:baseY+i*spY});
    const pY=(i)=>({x:mx,y:baseY+i*spY});
    const pZ=(i)=>({x:rzx,y:baseY+i*spY});
    const cGreen='#059669',cIndigo='#6366f1',cRed='#ef4444',cGray='#9ca3af';
    const mkArrow=(sx,sy,ex,ey,color,thick)=>{
      const ang=Math.atan2(ey-sy,ex-sx),al=8,aw=4;
      const ax1=ex-al*Math.cos(ang)+aw*Math.sin(ang),ay1=ey-al*Math.sin(ang)-aw*Math.cos(ang);
      const ax2=ex-al*Math.cos(ang)-aw*Math.sin(ang),ay2=ey-al*Math.sin(ang)+aw*Math.cos(ang);
      return(<g><line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={thick}/><polygon points={`${ex},${ey} ${ax1},${ay1} ${ax2},${ay2}`} fill={color}/></g>);
    };
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 세 타원 */}
        <ellipse cx={lx} cy={oy} rx={ovalRx} ry={ovalRy} fill="rgba(16,185,129,0.07)" stroke={cGreen} strokeWidth={2}/>
        <ellipse cx={mx} cy={oy} rx={ovalRx} ry={ovalRy} fill="rgba(99,102,241,0.07)" stroke={cIndigo} strokeWidth={2}/>
        <ellipse cx={rzx} cy={oy} rx={ovalRx} ry={ovalRy} fill="rgba(239,68,68,0.07)" stroke={cRed} strokeWidth={2}/>
        {/* 집합 레이블 */}
        <text x={lx} y={oy-ovalRy-8} textAnchor="middle" fontSize={14} fill={cGreen} fontWeight="900">X</text>
        <text x={mx} y={oy-ovalRy-8} textAnchor="middle" fontSize={14} fill={cIndigo} fontWeight="900">Y</text>
        <text x={rzx} y={oy-ovalRy-8} textAnchor="middle" fontSize={14} fill={cRed} fontWeight="900">Z</text>
        {/* 함수 이름 레이블 */}
        <text x={(lx+mx)/2} y={oy-ovalRy-22} textAnchor="middle" fontSize={11} fill={cGreen} fontWeight="bold">f</text>
        <text x={(mx+rzx)/2} y={oy-ovalRy-22} textAnchor="middle" fontSize={11} fill={cIndigo} fontWeight="bold">g</text>
        {/* X 원소 */}
        {X.map((x,i)=>{const p=pX(i);return(<text key={'xi'+i} x={p.x} y={p.y+5} textAnchor="middle" fontSize={13} fill='#1f2937' fontWeight='700'>{x}</text>);})}
        {/* Y 원소 */}
        {Y.map((y,i)=>{const p=pY(i);return(<text key={'yi'+i} x={p.x} y={p.y+5} textAnchor="middle" fontSize={13} fill='#1f2937' fontWeight='700'>{y}</text>);})}
        {/* Z 원소 */}
        {Z.map((z,i)=>{const p=pZ(i);return(<text key={'zi'+i} x={p.x} y={p.y+5} textAnchor="middle" fontSize={13} fill='#1f2937' fontWeight='700'>{z}</text>);})}
        {/* f 화살표 X→Y */}
        {f_map.map(([x,y],i)=>{
          const xi=X.indexOf(x),yi=Y.indexOf(y);
          const s2=pX(xi),e2=pY(yi);
          return(<g key={'fa'+i}>{mkArrow(s2.x+ovalRx-4,s2.y,e2.x-ovalRx+4,e2.y,cGreen,1.5)}</g>);
        })}
        {/* g 화살표 Y→Z */}
        {g_map.map(([y,z],i)=>{
          const yi=Y.indexOf(y),zi=Z.indexOf(z);
          const s2=pY(yi),e2=pZ(zi);
          return(<g key={'ga'+i}>{mkArrow(s2.x+ovalRx-4,s2.y,e2.x-ovalRx+4,e2.y,cIndigo,1.5)}</g>);
        })}
        {/* 하단 힌트 */}
        <text x={svgW/2} y={svgH-6} textAnchor="middle" fontSize={11} fill={cRed} fontWeight="bold">(g∘f)({inp}) = ?</text>
      </svg>
    );
  }

  // ── 7. 역함수 — X·Y 두 타원 + 화살표 매핑 다이어그램 ──
  // 기출 참고: 2023년 2회 Q17, 2025년 1·2회 Q17, 2026년 1회 Q17
  if(g.type==='inverse_map'){
    const{X,Y,f_map,ask_y,ans_x}=g;
    const n=X.length;
    const svgW=240,svgH=190;
    const leftCX=68,rightCX=172,ovalCY=svgH/2;
    const ovalRX=42,ovalRY=Math.min(72,n*16+16);
    const ySpacing=Math.min(28,(ovalRY*2-20)/Math.max(n-1,1));
    const baseY=ovalCY-(n-1)*ySpacing/2;
    const getXpos=(i)=>({x:leftCX,y:baseY+i*ySpacing});
    const getYpos=(i)=>({x:rightCX,y:baseY+i*ySpacing});
    const highlightColor='#ef4444';
    const arrowColor='#6366f1';
    const xCircleColor='#059669';
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* X 타원 (왼쪽, 초록) */}
        <ellipse cx={leftCX} cy={ovalCY} rx={ovalRX} ry={ovalRY} fill="rgba(16,185,129,0.07)" stroke={xCircleColor} strokeWidth={2}/>
        {/* Y 타원 (오른쪽, 남색) */}
        <ellipse cx={rightCX} cy={ovalCY} rx={ovalRX} ry={ovalRY} fill="rgba(99,102,241,0.07)" stroke={arrowColor} strokeWidth={2}/>
        {/* 레이블 */}
        <text x={leftCX} y={ovalCY-ovalRY-10} textAnchor="middle" fontSize={14} fill={xCircleColor} fontWeight="900">X</text>
        <text x={rightCX} y={ovalCY-ovalRY-10} textAnchor="middle" fontSize={14} fill={arrowColor} fontWeight="900">Y</text>
        {/* X 원소 */}
        {X.map((x,i)=>{
          const pos=getXpos(i);
          return(<text key={'xi'+i} x={pos.x} y={pos.y+5} textAnchor="middle" fontSize={13} fill='#1f2937' fontWeight='700'>{x}</text>);
        })}
        {/* Y 원소 */}
        {Y.map((y,i)=>{
          const pos=getYpos(i);
          return(<text key={'yi'+i} x={pos.x} y={pos.y+5} textAnchor="middle" fontSize={13} fill='#1f2937' fontWeight='700'>{y}</text>);
        })}
        {/* 화살표 (X→Y 매핑) */}
        {f_map.map(([x,y],i)=>{
          const xi=X.indexOf(x),yi=Y.indexOf(y);
          const sp=getXpos(xi),ep=getYpos(yi);
          const sx=sp.x+ovalRX-5,sy=sp.y,ex=ep.x-ovalRX+5,ey=ep.y;
          const ang=Math.atan2(ey-sy,ex-sx);
          const al=8,aw=4;
          const ax1=ex-al*Math.cos(ang)+aw*Math.sin(ang),ay1=ey-al*Math.sin(ang)-aw*Math.cos(ang);
          const ax2=ex-al*Math.cos(ang)-aw*Math.sin(ang),ay2=ey-al*Math.sin(ang)+aw*Math.cos(ang);
          return(
            <g key={'arr'+i}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={arrowColor} strokeWidth={1.6}/>
              <polygon points={`${ex},${ey} ${ax1},${ay1} ${ax2},${ay2}`} fill={arrowColor}/>
            </g>
          );
        })}
        {/* 하단 힌트 */}
        <text x={svgW/2} y={svgH-7} textAnchor="middle" fontSize={10} fill={highlightColor} fontWeight="bold">f⁻¹({ask_y}) = ?</text>
      </svg>
    );
  }

  // ── 8. 내분점 (수직선) ──
  if(g.type==='section_1d'){
    const{a,b,p,m,n}=g;
    const svgW=280,svgH=88;
    const lx=40,rx=240,cy=50;
    const range=b-a||1;
    const toX=v=>lx+(v-a)/range*(rx-lx);
    const ax_=toX(a),px_=toX(p),bx_=toX(b);
    const midAP=(ax_+px_)/2, midPB=(px_+bx_)/2;
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 수직선 */}
        <line x1={lx-16} y1={cy} x2={rx+16} y2={cy} stroke="#374151" strokeWidth={1.8}/>
        <polygon points={`${rx+16},${cy} ${rx+8},${cy-3.5} ${rx+8},${cy+3.5}`} fill="#374151"/>
        {/* m 구간 브라켓+레이블 */}
        <line x1={ax_+2} y1={cy-13} x2={px_-2} y2={cy-13} stroke="#059669" strokeWidth={1.4}/>
        <line x1={ax_+2} y1={cy-10} x2={ax_+2} y2={cy-16} stroke="#059669" strokeWidth={1.2}/>
        <line x1={px_-2} y1={cy-10} x2={px_-2} y2={cy-16} stroke="#059669" strokeWidth={1.2}/>
        <text x={midAP} y={cy-17} textAnchor="middle" fontSize={12} fill="#059669" fontWeight="bold">{m}</text>
        {/* n 구간 브라켓+레이블 */}
        <line x1={px_+2} y1={cy-13} x2={bx_-2} y2={cy-13} stroke="#6366f1" strokeWidth={1.4}/>
        <line x1={px_+2} y1={cy-10} x2={px_+2} y2={cy-16} stroke="#6366f1" strokeWidth={1.2}/>
        <line x1={bx_-2} y1={cy-10} x2={bx_-2} y2={cy-16} stroke="#6366f1" strokeWidth={1.2}/>
        <text x={midPB} y={cy-17} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="bold">{n}</text>
        {/* A 점 */}
        <circle cx={ax_} cy={cy} r={5} fill="#059669"/>
        <text x={ax_} y={cy+20} textAnchor="middle" fontSize={12} fill="#059669" fontWeight="bold">A({a})</text>
        {/* P 점 (빨강 강조, 좌표는 학생이 구해야 하므로 ? 표시) */}
        <circle cx={px_} cy={cy} r={6} fill="#ef4444"/>
        <text x={px_} y={cy+20} textAnchor="middle" fontSize={12} fill="#ef4444" fontWeight="bold">P( ? )</text>
        {/* B 점 */}
        <circle cx={bx_} cy={cy} r={5} fill="#6366f1"/>
        <text x={bx_} y={cy+20} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="bold">B({b})</text>
      </svg>
    );
  }

  // ── 9. 내분점 (좌표평면) ──
  if(g.type==='section_2d'){
    const{ax,ay,bx,by,px,py,m,n}=g;
    const svgW=240,svgH=200;
    const pad=24;
    const allX=[ax,bx,px],allY=[ay,by,py];
    const minX=Math.min(...allX),maxX=Math.max(...allX);
    const minY=Math.min(...allY),maxY=Math.max(...allY);
    const spanX=Math.max(maxX-minX,1),spanY=Math.max(maxY-minY,1);
    // 여백 추가 (좌표축이 보일 여지 포함)
    const vxLo=Math.min(minX,-0.5)-spanX*0.25,vxHi=Math.max(maxX,0.5)+spanX*0.25;
    const vyLo=Math.min(minY,-0.5)-spanY*0.25,vyHi=Math.max(maxY,0.5)+spanY*0.25;
    const toSX=x=>pad+(x-vxLo)/(vxHi-vxLo)*(svgW-2*pad);
    const toSY=y=>(svgH-pad)-(y-vyLo)/(vyHi-vyLo)*(svgH-2*pad);
    const sAx=toSX(ax),sAy=toSY(ay);
    const sBx=toSX(bx),sBy=toSY(by);
    const sPx=toSX(px),sPy=toSY(py);
    const ox=toSX(0),oy=toSY(0);
    // 레이블 위치: 중심점 반대 방향으로 오프셋
    const midX=(sAx+sBx)/2,midY=(sAy+sBy)/2;
    const aLbl={dx:sAx<midX?-4:4,dy:sAy<midY?-10:14};
    const bLbl={dx:sBx<midX?-4:4,dy:sBy<midY?-10:14};
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 좌표축 */}
        {ox>pad&&ox<svgW-pad&&<line x1={ox} y1={pad} x2={ox} y2={svgH-pad} stroke="#d1d5db" strokeWidth={1.2}/>}
        {oy>pad&&oy<svgH-pad&&<line x1={pad} y1={oy} x2={svgW-pad} y2={oy} stroke="#d1d5db" strokeWidth={1.2}/>}
        {ox>pad&&ox<svgW-pad&&<text x={ox+4} y={pad+10} fontSize={10} fill="#9ca3af" fontWeight="bold">y</text>}
        {oy>pad&&oy<svgH-pad&&<text x={svgW-pad-4} y={oy-4} fontSize={10} fill="#9ca3af" fontWeight="bold">x</text>}
        {/* 선분 A-B */}
        <line x1={sAx} y1={sAy} x2={sBx} y2={sBy} stroke="#94a3b8" strokeWidth={1.8}/>
        {/* m 구간 레이블 (선분 위) */}
        <text x={(sAx+sPx)/2} y={(sAy+sPy)/2-7} textAnchor="middle" fontSize={11} fill="#059669" fontWeight="bold">{m}</text>
        {/* n 구간 레이블 */}
        <text x={(sPx+sBx)/2} y={(sPy+sBy)/2-7} textAnchor="middle" fontSize={11} fill="#6366f1" fontWeight="bold">{n}</text>
        {/* A 점 */}
        <circle cx={sAx} cy={sAy} r={5} fill="#059669"/>
        <text x={sAx+aLbl.dx} y={sAy+aLbl.dy} textAnchor={aLbl.dx<0?'end':'start'} fontSize={11} fill="#059669" fontWeight="bold">A({ax},{ay})</text>
        {/* B 점 */}
        <circle cx={sBx} cy={sBy} r={5} fill="#6366f1"/>
        <text x={sBx+bLbl.dx} y={sBy+bLbl.dy} textAnchor={bLbl.dx<0?'end':'start'} fontSize={11} fill="#6366f1" fontWeight="bold">B({bx},{by})</text>
        {/* P 점 (빨강 강조, 좌표는 학생이 구해야 하므로 ? 표시) */}
        <circle cx={sPx} cy={sPy} r={6.5} fill="#ef4444"/>
        <text x={sPx+5} y={sPy+16} fontSize={11} fill="#ef4444" fontWeight="bold">P( ? )</text>
      </svg>
    );
  }

  // ── 10. 이등변삼각형 (꼭지각 표시) ──
  if(g.type==='iso_triangle'){
    const{apex,baseAng}=g;
    const svgW=220,svgH=170;
    const Ax=110,Ay=24;        // 꼭짓점 A (위)
    const By=146;
    const Bx=44,Cx=176;        // 밑변 양끝 B, C
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <polygon points={`${Ax},${Ay} ${Bx},${By} ${Cx},${By}`} fill="rgba(99,102,241,0.06)" stroke="#6366f1" strokeWidth={2}/>
        {/* 같은 변 표시 (tick) */}
        <line x1={(Ax+Bx)/2-5} y1={(Ay+By)/2} x2={(Ax+Bx)/2+5} y2={(Ay+By)/2} stroke="#059669" strokeWidth={2}/>
        <line x1={(Ax+Cx)/2-5} y1={(Ay+By)/2} x2={(Ax+Cx)/2+5} y2={(Ay+By)/2} stroke="#059669" strokeWidth={2}/>
        {/* 꼭짓점 라벨 */}
        <text x={Ax} y={Ay-6} textAnchor="middle" fontSize={13} fill="#1f2937" fontWeight="900">A</text>
        <text x={Bx-10} y={By+6} textAnchor="middle" fontSize={13} fill="#1f2937" fontWeight="900">B</text>
        <text x={Cx+10} y={By+6} textAnchor="middle" fontSize={13} fill="#1f2937" fontWeight="900">C</text>
        {/* 꼭지각 A 표시 (빨강) */}
        <text x={Ax} y={Ay+22} textAnchor="middle" fontSize={12} fill="#ef4444" fontWeight="900">{apex}°</text>
        {/* 밑각 B 물음표 */}
        <text x={Bx+18} y={By-8} textAnchor="middle" fontSize={12} fill="#ef4444" fontWeight="900">?</text>
      </svg>
    );
  }

  // ── 11. 평행선과 각 (동위각·엇각) ──
  if(g.type==='parallel_lines'){
    const{ang,kind}=g;
    const svgW=240,svgH=180;
    const l_y=52, m_y=128;     // 평행한 두 직선
    // 횡단선 n: 좌하 → 우상 기울기
    const nx1=46, ny1=170, nx2=196, ny2=14;
    // 교점 (직선 m, 직선 l 과의 교점)
    const slope=(ny2-ny1)/(nx2-nx1);
    const xAt=y=>nx1+(y-ny1)/slope;
    const Pl={x:xAt(l_y),y:l_y};   // l 교점 (위)
    const Pm={x:xAt(m_y),y:m_y};   // m 교점 (아래)
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 평행선 l, m */}
        <line x1={20} y1={l_y} x2={220} y2={l_y} stroke="#374151" strokeWidth={2}/>
        <line x1={20} y1={m_y} x2={220} y2={m_y} stroke="#374151" strokeWidth={2}/>
        {/* 횡단선 n */}
        <line x1={nx1} y1={ny1} x2={nx2} y2={ny2} stroke="#6366f1" strokeWidth={2}/>
        {/* 라벨 */}
        <text x={210} y={l_y-6} fontSize={12} fill="#374151" fontWeight="900">l</text>
        <text x={210} y={m_y-6} fontSize={12} fill="#374151" fontWeight="900">m</text>
        <text x={nx2+2} y={ny2+4} fontSize={12} fill="#6366f1" fontWeight="900">n</text>
        {/* ∠a (m 교점 위쪽, 주어진 각) */}
        <text x={Pm.x+8} y={m_y-8} fontSize={12} fill="#059669" fontWeight="900">∠a={ang}°</text>
        {/* ∠b (l 교점, 묻는 각) — 동위각이면 같은 위치 관계 */}
        <text x={Pl.x+8} y={l_y-8} fontSize={12} fill="#ef4444" fontWeight="900">∠b=?</text>
        {/* 교점 강조 */}
        <circle cx={Pl.x} cy={Pl.y} r={3} fill="#ef4444"/>
        <circle cx={Pm.x} cy={Pm.y} r={3} fill="#059669"/>
        <text x={svgW/2} y={svgH-6} textAnchor="middle" fontSize={10} fill="#9ca3af" fontWeight="bold">l ∥ m · {kind}</text>
      </svg>
    );
  }

  // ── 12. 직각삼각형 (삼각비) ──
  if(g.type==='right_triangle'){
    const{adj,opp,hyp}=g;
    const svgW=230,svgH=175;
    // 직각 C는 좌하단, B는 우하단, A는 좌상단
    const Cx=58,Cy=140;          // 직각 꼭짓점
    const Bx=190,By=140;         // 밑변 끝 (각 B)
    const Ax=58,Ay=30;           // 높이 끝 (각 A)
    return(
      <svg width={svgW} height={svgH} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <polygon points={`${Cx},${Cy} ${Bx},${By} ${Ax},${Ay}`} fill="rgba(99,102,241,0.06)" stroke="#6366f1" strokeWidth={2}/>
        {/* 직각 표시 (C) */}
        <rect x={Cx} y={Cy-14} width={14} height={14} fill="none" stroke="#374151" strokeWidth={1.4}/>
        {/* 꼭짓점 라벨 */}
        <text x={Cx-12} y={Cy+12} fontSize={13} fill="#1f2937" fontWeight="900">C</text>
        <text x={Bx+8} y={By+12} fontSize={13} fill="#1f2937" fontWeight="900">B</text>
        <text x={Ax-12} y={Ay-2} fontSize={13} fill="#1f2937" fontWeight="900">A</text>
        {/* 변 길이 */}
        <text x={(Cx+Bx)/2} y={By+18} textAnchor="middle" fontSize={12} fill="#059669" fontWeight="900">{adj}</text>
        <text x={Cx-10} y={(Cy+Ay)/2} textAnchor="middle" fontSize={12} fill="#059669" fontWeight="900">{opp}</text>
        <text x={(Bx+Ax)/2+10} y={(By+Ay)/2-4} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="900">{hyp}</text>
        {/* 각 B 강조 */}
        <text x={Bx-26} y={By-6} fontSize={12} fill="#ef4444" fontWeight="900">B</text>
      </svg>
    );
  }

  // ── 13. 일차함수 그래프 (직선 + 점) ──
  if(g.type==='linear'){
    const{a,b,x0,y0}=g;
    const W=200,H=180,SC=18;
    const CX=W/2,CY=H/2;
    const tx=x=>CX+x*SC, ty=y=>CY-y*SC;
    // 보이는 x범위에서 선분 양 끝 계산 (클램프)
    const xr=(W/2-10)/SC;
    let x1=-xr,x2=xr,yy1=a*x1+b,yy2=a*x2+b;
    const yr=(H/2-10)/SC;
    const cl=(x,y)=>{ // y가 화면 밖이면 x로 보정
      if(y>yr){x=(yr-b)/a;y=yr;} else if(y<-yr){x=(-yr-b)/a;y=-yr;}
      return[x,y];
    };
    [x1,yy1]=cl(x1,yy1);[x2,yy2]=cl(x2,yy2);
    const ticks=[-4,-2,2,4];
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {/* 격자 */}
        {ticks.map(n=>(<g key={'g'+n}>
          <line x1={tx(n)} y1={6} x2={tx(n)} y2={H-6} stroke="#eef1f6" strokeWidth={0.6}/>
          <line x1={6} y1={ty(n)} x2={W-6} y2={ty(n)} stroke="#eef1f6" strokeWidth={0.6}/>
        </g>))}
        {/* 축 */}
        <line x1={6} y1={CY} x2={W-6} y2={CY} stroke="#374151" strokeWidth={1.6}/>
        <line x1={CX} y1={6} x2={CX} y2={H-6} stroke="#374151" strokeWidth={1.6}/>
        <text x={W-8} y={CY+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>
        <text x={CX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>
        {ticks.map(n=>(<g key={'t'+n}>
          <text x={tx(n)} y={CY+12} textAnchor="middle" fontSize={9} fill="#9ca3af">{n}</text>
          <text x={CX-5} y={ty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af">{n}</text>
        </g>))}
        {/* 직선 */}
        <line x1={tx(x1)} y1={ty(yy1)} x2={tx(x2)} y2={ty(yy2)} stroke="#6366f1" strokeWidth={2.4}/>
        {/* y절편 점 */}
        <circle cx={tx(0)} cy={ty(b)} r={4} fill="#059669"/>
        {/* f(x0) 점 강조 */}
        {x0!==undefined&&<g>
          <line x1={tx(x0)} y1={ty(0)} x2={tx(x0)} y2={ty(y0)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2"/>
          <line x1={tx(0)} y1={ty(y0)} x2={tx(x0)} y2={ty(y0)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2"/>
          <circle cx={tx(x0)} cy={ty(y0)} r={5} fill="#ef4444"/>
          <text x={tx(x0)+6} y={ty(y0)-6} fontSize={11} fill="#ef4444" fontWeight="900">({x0}, {y0})</text>
        </g>}
      </svg>
    );
  }

  // ── 14. 좌표평면 점 찍기 (사분면) ──
  if(g.type==='point_plot'){
    const{px,py}=g;
    const W=190,H=190,SC=18;
    const CX=W/2,CY=H/2;
    const tx=x=>CX+x*SC, ty=y=>CY-y*SC;
    const ticks=[-4,-2,2,4];
    const quadCenters=[[CX+45,CY-50,'Ⅰ'],[CX-45,CY-50,'Ⅱ'],[CX-45,CY+55,'Ⅲ'],[CX+45,CY+55,'Ⅳ']];
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {ticks.map(n=>(<g key={'g'+n}>
          <line x1={tx(n)} y1={6} x2={tx(n)} y2={H-6} stroke="#eef1f6" strokeWidth={0.6}/>
          <line x1={6} y1={ty(n)} x2={W-6} y2={ty(n)} stroke="#eef1f6" strokeWidth={0.6}/>
        </g>))}
        {/* 사분면 라벨 (옅게) */}
        {quadCenters.map(([x,y,t],i)=>(<text key={'q'+i} x={x} y={y} textAnchor="middle" fontSize={11} fill="#d1d5db" fontWeight="900">{t}</text>))}
        <line x1={6} y1={CY} x2={W-6} y2={CY} stroke="#374151" strokeWidth={1.6}/>
        <line x1={CX} y1={6} x2={CX} y2={H-6} stroke="#374151" strokeWidth={1.6}/>
        <text x={W-8} y={CY+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>
        <text x={CX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>
        {ticks.map(n=>(<g key={'t'+n}>
          <text x={tx(n)} y={CY+12} textAnchor="middle" fontSize={9} fill="#9ca3af">{n}</text>
          <text x={CX-5} y={ty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af">{n}</text>
        </g>))}
        {/* 점 P 보조선 */}
        <line x1={tx(px)} y1={ty(0)} x2={tx(px)} y2={ty(py)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2"/>
        <line x1={tx(0)} y1={ty(py)} x2={tx(px)} y2={ty(py)} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2"/>
        <circle cx={tx(px)} cy={ty(py)} r={5.5} fill="#ef4444"/>
        <text x={tx(px)+(px>0?6:-6)} y={ty(py)+(py>0?-7:14)} textAnchor={px>0?'start':'end'} fontSize={11} fill="#ef4444" fontWeight="900">P({px}, {py})</text>
      </svg>
    );
  }

  // ── 14b. 평행이동 (P → Q 두 점) ──
  if(g.type==='translate_point'){
    const{px,py,rx,ry}=g;
    const W=200,H=200,SC=18,CX=W/2,CY=H/2;
    const tx=x=>CX+x*SC,ty=y=>CY-y*SC;
    const ticks=[-4,-2,2,4];
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {ticks.map(n=>(<g key={'g'+n}><line x1={tx(n)} y1={6} x2={tx(n)} y2={H-6} stroke="#eef1f6" strokeWidth={0.6}/><line x1={6} y1={ty(n)} x2={W-6} y2={ty(n)} stroke="#eef1f6" strokeWidth={0.6}/></g>))}
        <line x1={6} y1={CY} x2={W-6} y2={CY} stroke="#374151" strokeWidth={1.6}/>
        <line x1={CX} y1={6} x2={CX} y2={H-6} stroke="#374151" strokeWidth={1.6}/>
        <text x={W-8} y={CY+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>
        <text x={CX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>
        {ticks.map(n=>(<g key={'t'+n}><text x={tx(n)} y={CY+12} textAnchor="middle" fontSize={9} fill="#9ca3af">{n}</text><text x={CX-5} y={ty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af">{n}</text></g>))}
        <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#6366f1"/></marker></defs>
        <line x1={tx(px)} y1={ty(py)} x2={tx(rx)} y2={ty(ry)} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4,3" markerEnd="url(#arr)"/>
        <circle cx={tx(px)} cy={ty(py)} r={5} fill="#6b7280" stroke="white" strokeWidth={2}/>
        <text x={tx(px)+(px>0?7:-7)} y={ty(py)-6} textAnchor={px>0?'start':'end'} fontSize={10} fill="#6b7280" fontWeight="900">P({px},{py})</text>
        <circle cx={tx(rx)} cy={ty(ry)} r={5} fill="#6366f1" stroke="white" strokeWidth={2}/>
        <text x={tx(rx)+(rx>0?7:-7)} y={ty(ry)-6} textAnchor={rx>0?'start':'end'} fontSize={10} fill="#6366f1" fontWeight="900">Q({rx},{ry})</text>
      </svg>
    );
  }
  // ── 14c. 대칭이동 (P → Q 두 점 + 대칭축) ──
  if(g.type==='symmetry_point'){
    const{px,py,rx,ry,sym}=g;
    const W=200,H=200,SC=18,CX=W/2,CY=H/2;
    const tx=x=>CX+x*SC,ty=y=>CY-y*SC;
    const ticks=[-4,-2,2,4];
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {ticks.map(n=>(<g key={'g'+n}><line x1={tx(n)} y1={6} x2={tx(n)} y2={H-6} stroke="#eef1f6" strokeWidth={0.6}/><line x1={6} y1={ty(n)} x2={W-6} y2={ty(n)} stroke="#eef1f6" strokeWidth={0.6}/></g>))}
        <line x1={6} y1={CY} x2={W-6} y2={CY} stroke="#374151" strokeWidth={1.6}/>
        <line x1={CX} y1={6} x2={CX} y2={H-6} stroke="#374151" strokeWidth={1.6}/>
        <text x={W-8} y={CY+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>
        <text x={CX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>
        {ticks.map(n=>(<g key={'t'+n}><text x={tx(n)} y={CY+12} textAnchor="middle" fontSize={9} fill="#9ca3af">{n}</text><text x={CX-5} y={ty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af">{n}</text></g>))}
        {sym==='x축'&&<line x1={6} y1={CY} x2={W-6} y2={CY} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3"/>}
        {sym==='y축'&&<line x1={CX} y1={6} x2={CX} y2={H-6} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3"/>}
        {sym==='원점'&&<circle cx={CX} cy={CY} r={6} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3,2"/>}
        <text x={W/2} y={H-3} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight="bold">{sym} 대칭</text>
        <line x1={tx(px)} y1={ty(py)} x2={tx(rx)} y2={ty(ry)} stroke="#d1d5db" strokeWidth={1} strokeDasharray="3,2"/>
        <circle cx={tx(px)} cy={ty(py)} r={5} fill="#6b7280" stroke="white" strokeWidth={2}/>
        <text x={tx(px)+(px>=0?7:-7)} y={ty(py)-6} textAnchor={px>=0?'start':'end'} fontSize={10} fill="#6b7280" fontWeight="900">P({px},{py})</text>
        <circle cx={tx(rx)} cy={ty(ry)} r={5} fill="#6366f1" stroke="white" strokeWidth={2}/>
        <text x={tx(rx)+(rx>=0?7:-7)} y={ty(ry)-6} textAnchor={rx>=0?'start':'end'} fontSize={10} fill="#6366f1" fontWeight="900">Q({rx},{ry})</text>
      </svg>
    );
  }
  // ── 15. 절댓값 부등식 좌표평면 ──
  if(g.type==='abs_ineq'){
    const{center,r,lo,hi}=g;
    const W=220,H=180,SC=22;
    const xSpan=hi-lo, xPad=Math.max(1,xSpan*0.3);
    const xLo=lo-xPad, xHi=hi+xPad;
    const yHi=r+1.2, yLo=-0.5;
    const marg=22;
    const scX=(W-2*marg)/(xHi-xLo), scY=(H-2*marg)/(yHi-yLo);
    const sc=Math.min(scX,scY,28);
    const tx=x=>marg+(x-xLo)*sc, ty=y=>H-marg-(y-yLo)*sc;
    const axY=ty(0), axX=tx(0);
    const axYvis=axY>=4&&axY<=H-4, axXvis=axX>=4&&axX<=W-4;
    const absPts=[];
    for(let xi=xLo;xi<=xHi;xi+=0.1){
      const yi=Math.abs(xi-center);
      const sx=tx(xi),sy=ty(yi);
      if(sy>=-2&&sy<=H+2)absPts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    const rLineX1=tx(xLo), rLineX2=tx(xHi);
    const rY=ty(r);
    const solX1=tx(lo), solX2=tx(hi);
    const xInts=[];for(let n=Math.ceil(xLo);n<=Math.floor(xHi);n++)xInts.push(n);
    const yInts=[];for(let n=0;n<=Math.ceil(yHi);n++)yInts.push(n);
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {xInts.map(n=><line key={'gx'+n} x1={tx(n)} y1={4} x2={tx(n)} y2={H-4} stroke="#eef1f6" strokeWidth={0.6}/>)}
        {yInts.map(n=><line key={'gy'+n} x1={4} y1={ty(n)} x2={W-4} y2={ty(n)} stroke="#eef1f6" strokeWidth={0.6}/>)}
        {axYvis&&<line x1={4} y1={axY} x2={W-4} y2={axY} stroke="#374151" strokeWidth={1.8}/>}
        {axYvis&&<polygon points={`${W-4},${axY} ${W-12},${axY-3} ${W-12},${axY+3}`} fill="#374151"/>}
        {axYvis&&<text x={W-3} y={axY+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>}
        {axXvis&&<line x1={axX} y1={4} x2={axX} y2={H-4} stroke="#374151" strokeWidth={1.8}/>}
        {axXvis&&<polygon points={`${axX},4 ${axX-3},12 ${axX+3},12`} fill="#374151"/>}
        {axXvis&&<text x={axX+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>}
        {axYvis&&xInts.filter(n=>n!==0&&tx(n)>12&&tx(n)<W-10).map(n=>(
          <text key={'lx'+n} x={tx(n)} y={Math.min(axY+12,H-2)} textAnchor="middle" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>
        ))}
        {axXvis&&yInts.filter(n=>n>0&&ty(n)>8&&ty(n)<H-4).map(n=>(
          <text key={'ly'+n} x={Math.max(axX-5,12)} y={ty(n)+3} textAnchor="end" fontSize={9} fill="#9ca3af" fontWeight="600">{n}</text>
        ))}
        <line x1={solX1} y1={axY} x2={solX2} y2={axY} stroke="#6366f1" strokeWidth={4} strokeLinecap="round" opacity={0.45}/>
        <line x1={rLineX1} y1={rY} x2={rLineX2} y2={rY} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5,3"/>
        <text x={rLineX2-2} y={rY-4} textAnchor="end" fontSize={9} fill="#d97706" fontWeight="bold">y={r}</text>
        {absPts.length>1&&<polyline points={absPts.join(' ')} fill="none" stroke="#6366f1" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>}
        <circle cx={tx(center)} cy={ty(0)} r={3.5} fill="#6366f1" stroke="white" strokeWidth={1.5}/>
        <circle cx={tx(lo)} cy={rY} r={3.5} fill="white" stroke="#6366f1" strokeWidth={2}/>
        <circle cx={tx(hi)} cy={rY} r={3.5} fill="white" stroke="#6366f1" strokeWidth={2}/>
        <text x={tx(lo)} y={axY+13} textAnchor="middle" fontSize={10} fill="#6366f1" fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke">{lo}</text>
        <text x={tx(hi)} y={axY+13} textAnchor="middle" fontSize={10} fill="#6366f1" fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke">{hi}</text>
      </svg>
    );
  }

  // ── 16. 절댓값 부등식 수직선 (a 표시) ──
  if(g.type==='abs_numline'){
    const{lo,hi,ge}=g;
    const W=260,H=80;
    const pad=40, axY=H/2+8;
    const span=hi-lo, ext=Math.max(span*0.5,2);
    const xLo=lo-ext, xHi=hi+ext;
    const sc=(W-2*pad)/(xHi-xLo);
    const tx=x=>pad+(x-xLo)*sc;
    const loX=tx(lo), hiX=tx(hi);
    const arrowLen=pad-6;
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <line x1={6} y1={axY} x2={W-6} y2={axY} stroke="#374151" strokeWidth={2}/>
        <polygon points={`${W-6},${axY} ${W-14},${axY-3} ${W-14},${axY+3}`} fill="#374151"/>
        <polygon points={`6,${axY} 14,${axY-3} 14,${axY+3}`} fill="#374151"/>
        {!ge?(
          <>
            <rect x={loX} y={axY-7} width={hiX-loX} height={14} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth={0}/>
            <line x1={loX} y1={axY-9} x2={loX} y2={axY+9} stroke="#374151" strokeWidth={2.5}/>
            <line x1={hiX} y1={axY-9} x2={hiX} y2={axY+9} stroke="#374151" strokeWidth={2.5}/>
            <circle cx={loX} cy={axY} r={5} fill="#374151"/>
            <circle cx={hiX} cy={axY} r={5} fill="#374151"/>
            <text x={loX} y={axY+22} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="900">a</text>
            <text x={hiX} y={axY+22} textAnchor="middle" fontSize={12} fill="#374151" fontWeight="900">{hi}</text>
          </>
        ):(
          <>
            <line x1={loX} y1={axY} x2={Math.max(6,loX-arrowLen)} y2={axY} stroke="#6366f1" strokeWidth={4} strokeLinecap="round"/>
            <line x1={hiX} y1={axY} x2={Math.min(W-6,hiX+arrowLen)} y2={axY} stroke="#6366f1" strokeWidth={4} strokeLinecap="round"/>
            <circle cx={loX} cy={axY} r={5} fill="#374151"/>
            <circle cx={hiX} cy={axY} r={5} fill="#374151"/>
            <text x={loX} y={axY+22} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="900">a</text>
            <text x={hiX} y={axY+22} textAnchor="middle" fontSize={12} fill="#374151" fontWeight="900">{hi}</text>
          </>
        )}
        <text x={W-4} y={axY-6} fontSize={10} fill="#374151" fontWeight="bold">x</text>
      </svg>
    );
  }

  // ── 17. 원과 직선 ──
  if(g.type==='circle_line'){
    const{h,k,r,lineType,lineVal}=g;
    const W=220,H=200,SC=22;
    const cx=W/2-h*SC*0.4, cy=H/2+k*SC*0.4;
    const toSx=x=>cx+x*SC, toSy=y=>cy-y*SC;
    const ticks=[-5,-4,-3,-2,-1,0,1,2,3,4,5];
    const lColor='#f59e0b';
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        {ticks.map(n=>(
          <g key={n}>
            <line x1={toSx(n)} y1={4} x2={toSx(n)} y2={H-4} stroke="#eef1f6" strokeWidth={0.6}/>
            <line x1={4} y1={toSy(n)} x2={W-4} y2={toSy(n)} stroke="#eef1f6" strokeWidth={0.6}/>
          </g>
        ))}
        <line x1={4} y1={cy} x2={W-4} y2={cy} stroke="#374151" strokeWidth={1.8}/>
        <polygon points={`${W-4},${cy} ${W-12},${cy-3} ${W-12},${cy+3}`} fill="#374151"/>
        <line x1={cx} y1={4} x2={cx} y2={H-4} stroke="#374151" strokeWidth={1.8}/>
        <polygon points={`${cx},4 ${cx-3},12 ${cx+3},12`} fill="#374151"/>
        <text x={W-3} y={cy+12} fontSize={9} fill="#374151" fontWeight="bold">x</text>
        <text x={cx+5} y={14} fontSize={9} fill="#374151" fontWeight="bold">y</text>
        <circle cx={toSx(h)} cy={toSy(k)} r={r*SC} fill="rgba(20,184,166,0.12)" stroke="#0d9488" strokeWidth={2}/>
        {lineType==='h'&&(
          <>
            <line x1={4} y1={toSy(lineVal)} x2={W-4} y2={toSy(lineVal)} stroke={lColor} strokeWidth={2} strokeDasharray="6,3"/>
            <text x={W-6} y={toSy(lineVal)-4} textAnchor="end" fontSize={10} fill={lColor} fontWeight="bold">y={lineVal}</text>
          </>
        )}
        {lineType==='v'&&(
          <>
            <line x1={toSx(lineVal)} y1={4} x2={toSx(lineVal)} y2={H-4} stroke={lColor} strokeWidth={2} strokeDasharray="6,3"/>
            <text x={toSx(lineVal)+4} y={14} fontSize={10} fill={lColor} fontWeight="bold">x={lineVal}</text>
          </>
        )}
        <circle cx={toSx(h)} cy={toSy(k)} r={3} fill="#0d9488"/>
      </svg>
    );
  }

  return null;
}
