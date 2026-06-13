function MathExpr({v}){
  if(v==null) return null;
  const s=String(v);

  // ① 단독 분수: 문자열 전체가 "num/den" 형태
  const sf=s.match(/^(-?(?:√?\d+|\d+√\d+))\/(√?\d+|\d+√?\d*)$/);
  if(sf) return <VF n={sf[1]} d={sf[2]}/>;

  // ② 무리함수 선지: y=[COEFF]√([INNER])[SUFFIX]
  //    COEFF: 빈문자·"−"·"2"·"-2" 등, INNER: "x+2" 등
  const rm=s.match(/^(y=)([-−]?\d*)√\(([^)]+)\)(.*)$/);
  if(rm){
    const[,pre,co,inner,suf]=rm;
    return(
      <span style={{display:'inline-flex',alignItems:'baseline',whiteSpace:'nowrap'}}>
        <span>{pre}{co}</span>
        <SqR s={inner} sz={14}/>
        {suf&&<span>{suf}</span>}
      </span>
    );
  }

  // ③ 유리함수 선지: y=[K]/([DENOM])[SUFFIX]
  //    K: "-3","2" 등, DENOM: "x−2","x+1" 등
  const rat=s.match(/^(y=)([-−]?\d+)\/((\([^)]+\)))(.*)$/);
  if(rat){
    const[,pre,n,d,,suf]=rat;
    return(
      <span style={{display:'inline-flex',alignItems:'center',whiteSpace:'nowrap'}}>
        <span>{pre}</span>
        <VF n={n} d={d}/>
        {suf&&<span>{suf}</span>}
      </span>
    );
  }

  // ④ 기타
  return <>{s}</>;
}
// 하위 호환성을 위한 별칭
var MathText=MathExpr;


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

    // 수선의 발 점선: 점 → x축, 점 → y축
    const drawDropLines=(px2,py2,lineColor)=>{
      if(!axYvis&&!axXvis)return null;
      return(<g opacity={0.65}>
        {axYvis&&<line x1={px2} y1={py2} x2={px2} y2={axY} stroke={lineColor} strokeWidth={1.1} strokeDasharray="3,2"/>}
        {axXvis&&<line x1={axX} y1={py2} x2={px2} y2={py2} stroke={lineColor} strokeWidth={1.1} strokeDasharray="3,2"/>}
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
          {drawDropLines(toQx(ds),toQy(yDs),'#6b7280')}
          <circle cx={toQx(ds)} cy={toQy(yDs)} r={4} fill="white" stroke="#6b7280" strokeWidth={2}/>
        </g>}
        {/* 구간 끝점 수선의 발 + 점 (극값 아닌 경우) */}
        {!isDeExtreme&&<g>
          {drawDropLines(toQx(de),toQy(yDe),'#6b7280')}
          <circle cx={toQx(de)} cy={toQy(yDe)} r={4} fill="white" stroke="#6b7280" strokeWidth={2}/>
        </g>}
        {/* 꼭짓점이 구간 내이고 극값이 아닌 경우 */}
        {vxInRange&&extremePt.x!==p&&<circle cx={toQx(p)} cy={toQy(vq)} r={3.5} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2,2"/>}
        {/* ★ 극값점: 수선의 발 + 크고 선명한 원 (좌표 텍스트 없음) */}
        {drawDropLines(toQx(extremePt.x),toQy(extremePt.y),extremeColor)}
        <circle cx={toQx(extremePt.x)} cy={toQy(extremePt.y)} r={6} fill={extremeColor} stroke="white" strokeWidth={2.5}/>
      </svg>
    );
  }

  // ── 2. 무리함수  y = a√(x − p) + q ──
  if(g.type==='radical'){
    const{a,p,q:vq}=g;  // p=dx(x이동), q=dy(y이동), a=계수
    const startX=p; // 정의역 시작: x ≥ p
    const pts=[];
    for(let xi=startX;xi<=startX+6;xi+=0.12){
      const yi=a*Math.sqrt(xi-startX)+vq;
      if(Math.abs(yi)<=6&&toSx(xi)>=4&&toSx(xi)<=W-4)
        pts.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);
    }
    const color='#059669';
    return(
      <svg width={W} height={H} className="border border-gray-200 rounded-xl bg-white my-2 block mx-auto">
        <Axes/>
        {pts.length>1&&<polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"/>}
        {/* 시작점 (p, vq) */}
        <circle cx={toSx(startX)} cy={toSy(vq)} r={4.5} fill={color} stroke="white" strokeWidth={2}/>
        <text x={toSx(startX)+7} y={toSy(vq)-5} fontSize={9} fill={color} fontWeight="bold">({startX},{vq})</text>
        {/* 참고: y=a√x 기본형 (회색) */}
        {(() => {
          const refPts=[];
          for(let xi=0;xi<=6;xi+=0.15){
            const yi=a*Math.sqrt(xi);
            if(Math.abs(yi)<=6&&toSx(xi)>=4&&toSx(xi)<=W-4)
              refPts.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);
          }
          return refPts.length>1?<polyline points={refPts.join(' ')} fill="none" stroke="#d1fae5" strokeWidth={1.5} strokeDasharray="4,3"/>:null;
        })()}
      </svg>
    );
  }

  // ── 3. 유리함수  y = k / (x − p) + q ──
  if(g.type==='rational'){
    const{k,p,q:vq}=g;  // p=dx, q=dy, k=분자
    const eps=0.18;
    const ptsL=[], ptsR=[];
    for(let xi=-5;xi<p-eps;xi+=0.12){
      const yi=k/(xi-p)+vq;
      if(Math.abs(yi)<=7&&toSx(xi)>=4) ptsL.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);
    }
    for(let xi=p+eps;xi<=5;xi+=0.12){
      const yi=k/(xi-p)+vq;
      if(Math.abs(yi)<=7&&toSx(xi)<=W-4) ptsR.push(`${toSx(xi).toFixed(1)},${toSy(yi).toFixed(1)}`);
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

  // ── 6b. 합성함수 — X·Y·Z 세 타원 + 이중 화살표 다이어그램 ──
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
        {X.map((x,i)=>{const p=pX(i);return(<text key={'xi'+i} x={p.x} y={p.y+5} textAnchor="middle" fontSize={13} fill={x===inp?cGreen:'#1f2937'} fontWeight={x===inp?'900':'700'}>{x}</text>);})}
        {/* Y 원소 */}
        {Y.map((y,i)=>{const p=pY(i);return(<text key={'yi'+i} x={p.x} y={p.y+5} textAnchor="middle" fontSize={13} fill={y===fx?cIndigo:'#1f2937'} fontWeight={y===fx?'900':'700'}>{y}</text>);})}
        {/* Z 원소 */}
        {Z.map((z,i)=>{const p=pZ(i);return(<text key={'zi'+i} x={p.x} y={p.y+5} textAnchor="middle" fontSize={13} fill={z===gfx?cRed:'#1f2937'} fontWeight={z===gfx?'900':'700'}>{z}</text>);})}
        {/* f 화살표 X→Y */}
        {f_map.map(([x,y],i)=>{
          const xi=X.indexOf(x),yi=Y.indexOf(y);
          const s2=pX(xi),e2=pY(yi);
          const hl=x===inp;
          return(<g key={'fa'+i} opacity={hl?1:0.5}>{mkArrow(s2.x+ovalRx-4,s2.y,e2.x-ovalRx+4,e2.y,hl?cGreen:cGray,hl?2.5:1.3)}</g>);
        })}
        {/* g 화살표 Y→Z */}
        {g_map.map(([y,z],i)=>{
          const yi=Y.indexOf(y),zi=Z.indexOf(z);
          const s2=pY(yi),e2=pZ(zi);
          const hl=y===fx;
          return(<g key={'ga'+i} opacity={hl?1:0.5}>{mkArrow(s2.x+ovalRx-4,s2.y,e2.x-ovalRx+4,e2.y,hl?cIndigo:cGray,hl?2.5:1.3)}</g>);
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
        {/* X 원소 (정답은 학생이 직접 찾아야 하므로 모두 같은 색으로 표시) */}
        {X.map((x,i)=>{
          const pos=getXpos(i);
          return(<text key={'xi'+i} x={pos.x} y={pos.y+5} textAnchor="middle" fontSize={13} fill='#1f2937' fontWeight='700'>{x}</text>);
        })}
        {/* Y 원소 (ask_y는 문제에서 주어진 값이므로 강조 표시) */}
        {Y.map((y,i)=>{
          const pos=getYpos(i);
          const isAsked=(y===ask_y);
          return(<text key={'yi'+i} x={pos.x} y={pos.y+5} textAnchor="middle" fontSize={13} fill={isAsked?highlightColor:'#1f2937'} fontWeight={isAsked?'900':'700'}>{y}</text>);
        })}
        {/* 화살표 (X→Y 매핑) */}
        {f_map.map(([x,y],i)=>{
          const xi=X.indexOf(x),yi=Y.indexOf(y);
          const sp=getXpos(xi),ep=getYpos(yi);
          const isHL=(y===ask_y);
          const color=isHL?highlightColor:arrowColor;
          const sw=isHL?2.8:1.6;
          const sx=sp.x+ovalRX-5,sy=sp.y,ex=ep.x-ovalRX+5,ey=ep.y;
          const ang=Math.atan2(ey-sy,ex-sx);
          const al=8,aw=4;
          const ax1=ex-al*Math.cos(ang)+aw*Math.sin(ang),ay1=ey-al*Math.sin(ang)-aw*Math.cos(ang);
          const ax2=ex-al*Math.cos(ang)-aw*Math.sin(ang),ay2=ey-al*Math.sin(ang)+aw*Math.cos(ang);
          return(
            <g key={'arr'+i} opacity={isHL?1:0.6}>
              <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={sw}/>
              <polygon points={`${ex},${ey} ${ax1},${ay1} ${ax2},${ay2}`} fill={color}/>
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

  return null;
}

/* ═══════════════════════════════════════════════════════════
   회차(세션) 문제 + 정답 + 해설 인쇄/PDF 모달
   - 학생 기록·선생님 대시보드에서 공용 사용
   - 브라우저 네이티브 인쇄(Ctrl+P / Save as PDF) → SVG 그림 그대로 출력
   - log.questions[*] 에 qFull·choices·answerIdx·graph·sol 이 있으면 원문제 복원,
     없으면(구버전 로그) 저장된 요약(qTxt·정답)만 출력
   ═══════════════════════════════════════════════════════════ */
function SessionPrintModal({log,studentName,onClose}){
  if(!log)return null;
  const ORD=['①','②','③','④','⑤'];
  const qs=log.questions||[];
  const doPrint=()=>{ window.print(); };
  return(
    <div className="session-print-area fixed inset-0 z-50 bg-white overflow-auto">
      {/* 상단 조작 바 (인쇄 시 숨김) */}
      <div className="no-print sticky top-0 bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onClose} className="px-3 py-1.5 bg-white/20 rounded-xl font-bold text-sm">← 닫기</button>
        <div className="flex-1 font-black text-sm">📄 회차 문제·해설 인쇄</div>
        <button onClick={doPrint} className="px-4 py-1.5 bg-white text-indigo-700 rounded-xl font-black text-sm">🖨️ 인쇄 / PDF 저장</button>
      </div>
      <div className="no-print px-4 pt-2 text-xs text-gray-400">＊ ‘인쇄 / PDF 저장’을 누른 뒤, 인쇄 대화상자에서 <b>대상</b>을 <b>‘PDF로 저장’</b>으로 선택하면 파일로 저장됩니다.</div>

      {/* 인쇄 본문 */}
      <div className="px-6 py-5 max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-5">
          <div className="text-xl font-black text-gray-900">검정고시 연습 문제·해설지</div>
          <div className="text-sm text-gray-600 mt-1 font-bold">
            {studentName?`${studentName} · `:''}{log.type||'연습'} · {fmtDate(log.date)} {log.time||''} · 점수 {log.score||''}
          </div>
        </div>

        {qs.map((q,i)=>{
          const hasFull=q.qFull&&Array.isArray(q.choices);
          const correctText=hasFull?q.choices[q.answerIdx]:(q.cAns||'');
          return(
            <div key={i} className="session-print-item mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-start gap-2 mb-1">
                <span className="font-black text-indigo-700">{i+1}.</span>
                <span className="font-bold text-gray-900 leading-relaxed flex-1">{hasFull?q.qFull:q.qTxt}</span>
                <span className={`text-xs font-black ${q.isOk?'text-green-600':'text-red-500'}`}>{q.isOk?'O':'X'}</span>
              </div>
              {q.topic&&<div className="ml-5 mb-1 text-xs text-gray-500 font-bold">[{q.topic}]{q.examSource?` · 📌 ${q.examSource}`:''}</div>}
              {!q.topic&&q.examSource&&<div className="ml-5 mb-1 text-xs text-blue-600 font-bold">📌 {q.examSource}</div>}

              {/* 그림(SVG) */}
              {q.graph&&<div className="my-2 flex justify-center"><GraphPreview q={q}/></div>}

              {/* 선택지 */}
              {hasFull&&(
                <div className="ml-5 grid grid-cols-2 gap-x-4 gap-y-1 my-2">
                  {q.choices.map((c,j)=>(
                    <div key={j} className={`text-sm ${j===q.answerIdx?'font-black text-green-700':'text-gray-700'}`}>
                      {ORD[j]} {String(c)}{j===q.answerIdx?' ✓':''}
                    </div>
                  ))}
                </div>
              )}

              {/* 정답 */}
              <div className="ml-5 mt-1 text-sm font-black text-green-700">
                정답: {hasFull?`${ORD[q.answerIdx]} `:''}{correctText}
                {!q.isOk&&q.uAns?<span className="ml-3 text-red-500 font-bold">(내 답: {q.uAns})</span>:null}
              </div>

              {/* 해설 */}
              {Array.isArray(q.sol)&&q.sol.length?(
                <div className="ml-5 mt-1.5 text-sm text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <div className="font-black text-amber-700 mb-1">📖 풀이 과정</div>
                  <ol className="list-decimal ml-5 space-y-0.5">{q.sol.map((s,k)=><li key={k}>{s}</li>)}</ol>
                </div>
              ):(q.explanation?(
                <div className="ml-5 mt-1.5 text-sm text-gray-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="font-black text-amber-700">💡 해설 · </span>{q.explanation}
                </div>
              ):null)}
            </div>
          );
        })}
        <div className="text-center text-xs text-gray-400 mt-6">— 태청야학 수학 학습 도우미 —</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ④ 집합과 함수 영역 — 11개 세부유형 완전 분석
   2023~2026 Q15~Q18 전 패턴 커버
   ════════════════════════════════════════════════ */

// 4-1. 집합 원소 나열 연산 (합/교/차집합)  (기출 Q15 패턴A)
function gen_set_elements(){
  const base=[1,2,3,4,5,6,7,8,9];
  const A=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const B=shuffle([...base]).slice(0,randInt(3,4)).sort((a,b)=>a-b);
  const op=pick(['∪','∩','A−B','B−A']);
  let result,qText;
  if(op==='∪'){result=[...new Set([...A,...B])].sort((a,b)=>a-b);qText='A∪B';}
  else if(op==='∩'){result=A.filter(x=>B.includes(x));qText='A∩B';}
  else if(op==='A−B'){result=A.filter(x=>!B.includes(x));qText='A−B';}
  else{result=B.filter(x=>!A.includes(x));qText='B−A';}
  if(result.length===0)return gen_set_elements();
  const correct=`{${result.join(', ')}}`;
  const w1=`{${result.map(x=>x+1).join(', ')}}`;
  const w2=`{${A.filter(x=>!result.includes(x)).concat(result).sort((a,b)=>a-b).slice(0,result.length).join(', ')}}`;
  const w3=`{${B.filter(x=>!A.includes(x)).sort((a,b)=>a-b).concat(result).slice(0,result.length).join(', ')}}`;
  const wrongs=[w1,w2,w3].filter(w=>w!==correct&&!w.includes('undefined')&&w!=='{}');
  const{choices,answer}=makeChoices(correct,wrongs.slice(0,3));
  const opDesc={'∪':'합집합(∪): A 또는 B에 속하는 원소 모두 모읍니다.','∩':'교집합(∩): A와 B 모두에 속하는 원소만 남깁니다.','A−B':'차집합(A−B): A에 있고 B에 없는 원소만 남깁니다.','B−A':'차집합(B−A): B에 있고 A에 없는 원소만 남깁니다.'};
  return{topic:'집합 원소연산',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 ${qText}는?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      opDesc[op],
      `A={${A.join(', ')}}, B={${B.join(', ')}}`,
      op==='∪'?`A∪B = A와 B의 원소를 합치고 중복 제거: ${correct}`
      :op==='∩'?`A∩B = 둘 다 있는 원소: ${A.filter(x=>B.includes(x)).join(', ')||'없음'} → ${correct}`
      :op==='A−B'?`A−B = A에서 B와 겹치는 ${A.filter(x=>B.includes(x)).join(', ')}를 뺀 나머지: ${correct}`
      :`B−A = B에서 A와 겹치는 ${B.filter(x=>A.includes(x)).join(', ')}를 뺀 나머지: ${correct}`,
      `따라서 ${qText} = ${correct}입니다.`
    ]};
}

// 4-2. 집합 개수 n(A op B)  (기출 Q15 패턴B)
function gen_set_count(){
  const base=[1,2,3,4,5,6,7,8,9,10];
  const A=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const B=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const unionN=[...new Set([...A,...B])].length;
  const interN=A.filter(x=>B.includes(x)).length;
  const diffABN=A.filter(x=>!B.includes(x)).length;
  const op=pick(['∪','∩','A-B']);
  const ans=op==='∪'?unionN:op==='∩'?interN:diffABN;
  if(ans<1)return gen_set_count();
  const qText=op==='A-B'?'n(A−B)':`n(A${op}B)`;
  const{choices,answer}=makeChoices(String(ans),[ans+1,Math.max(0,ans-1),ans+2].filter(w=>w!==ans&&w>=0).slice(0,3).map(String));
  const inter=A.filter(x=>B.includes(x));
  return{topic:'집합 개수',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 ${qText}의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:op==='∪'?[
      `n(A∪B) = A 또는 B에 속하는 원소의 개수입니다.`,
      `A∪B = {${[...new Set([...A,...B])].sort((a,b)=>a-b).join(', ')}}`,
      `원소의 개수 = ${ans}입니다.`
    ]:op==='∩'?[
      `n(A∩B) = A와 B 모두에 속하는 원소의 개수입니다.`,
      `A∩B = {${inter.join(', ')||'∅'}}`,
      `원소의 개수 = ${ans}입니다.`
    ]:[
      `n(A−B) = A에 있고 B에 없는 원소의 개수입니다.`,
      `A−B = {${A.filter(x=>!B.includes(x)).join(', ')||'∅'}}`,
      `원소의 개수 = ${ans}입니다.`
    ]};
}

// 4-3. n(A∪B)+n(A∩B) 유형  (기출 Q14/Q15: 2024-1, 2025-1)
function gen_set_union_inter_sum(){
  const base=[1,2,3,4,5,6,7,8,9,10];
  const A=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const B=shuffle([...base]).slice(0,randInt(3,5)).sort((a,b)=>a-b);
  const unionN=[...new Set([...A,...B])].length;
  const interN=A.filter(x=>B.includes(x)).length;
  const ans=unionN+interN;
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
  const interArr=A.filter(x=>B.includes(x));
  const unionArr=[...new Set([...A,...B])].sort((a,b)=>a-b);
  return{topic:'합집합+교집합 개수',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 n(A∪B)+n(A∩B)의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `n(A∪B)+n(A∩B)를 각각 구해서 더합니다.`,
      `A∪B = {${unionArr.join(', ')}} → n(A∪B) = ${unionN}`,
      `A∩B = {${interArr.join(', ')||'∅'}} → n(A∩B) = ${interN}`,
      `n(A∪B)+n(A∩B) = ${unionN}+${interN} = ${ans}입니다.`
    ]};
}

// 4-4. 집합 A=B 조건 → 상수 a  (기출 Q15: 2023-2, 2025-2)
function gen_set_equal_const(){
  const t=pick([1,2,3]);
  if(t===1){const a=4;const{choices,answer}=makeChoices('4',['3','5','6']);return{topic:'집합 상수 구하기',q:`두 집합 A={1, a−1, 5}, B={1, 3, 5}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`A=B이면 두 집합의 원소가 완전히 같아야 합니다.`,`B={1, 3, 5}이므로 A의 원소 a−1은 B의 원소 중 하나여야 합니다.`,`a−1=3이면 a=4. 확인: A={1, 3, 5}=B ✓`,`따라서 a=4입니다.`]};}
  if(t===2){const a=5;const{choices,answer}=makeChoices('5',['4','6','3']);return{topic:'집합 상수 구하기',q:`두 집합 A={2, 4, a+1}, B={2, 4, 6}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`A=B이면 두 집합의 원소가 완전히 같아야 합니다.`,`B={2, 4, 6}이므로 A의 원소 a+1은 B의 원소 중 하나여야 합니다.`,`a+1=6이면 a=5. 확인: A={2, 4, 6}=B ✓`,`따라서 a=5입니다.`]};}
  const a=4;const{choices,answer}=makeChoices('4',['3','5','6']);
  return{topic:'집합 상수 구하기',q:`두 집합 A={1, 3, a+1}, B={1, a−1, 5}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`A=B이면 두 집합의 원소가 완전히 같아야 합니다.`,`B의 원소: {1, a−1, 5}이고 A의 원소: {1, 3, a+1}이 같아야 합니다.`,`3=a−1이면 a=4, 또는 a+1=5이면 a=4. 둘 다 a=4입니다.`,`따라서 a=4입니다.`]};
}

// 4-5. 진리집합  (기출 Q16: 2023-2, 2024-1)
function gen_truth_set(){
  const t=pick([1,2,3,4]);
  if(t===1){const{choices,answer}=makeChoices('{2, 4, 6, 8}',['{1, 3, 5, 7, 9}','{2, 4, 6}','{2, 4, 6, 8, 10}']);return{topic:'진리집합',q:`전체집합 U={1, 2, 3, 4, 5, 6, 7, 8, 9}일 때, 조건 "x는 짝수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`진리집합: 조건을 참으로 만드는 원소의 모임입니다.`,`U={1~9} 중 짝수는 2, 4, 6, 8입니다.`,`따라서 진리집합은 {2, 4, 6, 8}입니다.`]};}
  if(t===2){const{choices,answer}=makeChoices('{3, 6, 9}',['{3, 6}','{1, 4, 7}','{6, 9}']);return{topic:'진리집합',q:`전체집합 U={1, 2, 3, 4, 5, 6, 7, 8, 9}일 때, 조건 "x는 3의 배수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`진리집합: 조건을 참으로 만드는 원소의 모임입니다.`,`U={1~9} 중 3의 배수는 3, 6, 9입니다.`,`따라서 진리집합은 {3, 6, 9}입니다.`]};}
  if(t===3){const{choices,answer}=makeChoices('{4, 8}',['{4}','{2, 4, 8}','{4, 8, 12}']);return{topic:'진리집합',q:`전체집합 U={1, 2, 3, 4, 5, 6, 7, 8, 9}일 때, 조건 "x는 4의 배수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[`진리집합: 조건을 참으로 만드는 원소의 모임입니다.`,`U={1~9} 중 4의 배수는 4, 8입니다.`,`따라서 진리집합은 {4, 8}입니다.`]};}
  const div=pick([3,4,5]),maxN=pick([9,10,12]);
  const mults=[];for(let i=div;i<=maxN;i+=div)mults.push(i);
  const correct=`{${mults.join(', ')}}`;
  const w1=`{${mults.slice(0,-1).join(', ')}}`,w2=`{${mults.map(x=>x+1).join(', ')}}`,w3=`{${mults.filter((_,i)=>i%2===0).join(', ')}}`;
  const{choices,answer}=makeChoices(correct,[w1,w2,w3].filter(w=>w!==correct));
  return{topic:'진리집합',q:`전체집합 U={x|x는 ${maxN} 이하의 자연수}일 때, 조건 "x는 ${div}의 배수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `진리집합: 조건을 참으로 만드는 원소의 모임입니다.`,
      `U={1~${maxN}} 중 ${div}의 배수를 순서대로 찾습니다: ${mults.join(', ')}`,
      `따라서 진리집합은 ${correct}입니다.`
    ]};
}

// 4-6. 명제의 역/대우  (기출 Q16 패턴)
// ※ 고졸 검정고시에서 '역'과 '대우'만 출제됨 ('이'는 미출제)
function gen_proposition(){
  const propType=pick(['num','shape']);
  let orig,rev,contra,inv;
  if(propType==='num'){
    const n=pick([2,3,4,5,6]),k=pick([2,3]);
    const nk=n**k,kStr=k===2?'²':'³';
    orig=`x=${n}이면 x${kStr}=${nk}이다.`;
    rev=`x${kStr}=${nk}이면 x=${n}이다.`;
    contra=`x${kStr}≠${nk}이면 x≠${n}이다.`;
    inv=`x≠${n}이면 x${kStr}≠${nk}이다.`;
  }else{
    const sp=pick([{A:'정삼각형',B:'이등변삼각형'},{A:'정사각형',B:'직사각형'},{A:'직사각형',B:'사다리꼴'},{A:'평행사변형',B:'사다리꼴'},{A:'마름모',B:'평행사변형'},{A:'정사각형',B:'마름모'}]);
    orig=`${sp.A}이면 ${sp.B}이다.`;
    rev=`${sp.B}이면 ${sp.A}이다.`;
    contra=`${sp.B}이 아니면 ${sp.A}이 아니다.`;
    inv=`${sp.A}이 아니면 ${sp.B}이 아니다.`;
  }
  // '이'는 출제되지 않음 — '역'·'대우'만 출제
  const askType=pick(['역','대우']);
  const correct=askType==='역'?rev:contra;
  // inv를 오답 보기로 포함해 변별력 유지
  const{choices,answer}=makeChoices(correct,[orig,rev,contra,inv].filter(w=>w!==correct).slice(0,3));
  return{topic:`명제의 ${askType}`,q:`명제 '${orig}'의 ${askType}는?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `명제를 'p이면 q이다' 꼴로 분석합니다.`,
      `원래 명제: p이면 q이다 → '${orig}'`,
      askType==='역'
        ? `역(逆): q이면 p이다 → p와 q의 위치를 바꿉니다. → '${rev}'`
        : `대우(對偶): q가 아니면 p가 아니다 → p, q 모두 부정하고 위치도 바꿉니다. → '${contra}'`,
      `(참고: 대우는 원래 명제와 참/거짓이 항상 일치합니다. 역은 일치하지 않을 수 있습니다.)`,
      `따라서 정답은 '${correct}'입니다.`
    ]};
}

// 4-7. 필요조건/충분조건/필요충분조건  (기출 Q16: 2024-2, 2025-1·2, 2026-1)
// 세 유형: 충분조건(p→q, p⊆q), 필요조건(q→p, q⊆p), 필요충분조건(p=q)
function gen_nec_suff(){
  const t=pick([1,2,3]);
  if(t===1){
    // 충분조건: p: x=a, q: x²-Sx+P=0 → p가 q의 충분조건 ↔ a∈{r1,r2}
    const r1=pick([2,3,4]),r2=r1+pick([1,2,3]);
    const S=r1+r2,P=r1*r2;
    const a=pick([r1,r2]);
    const{choices,answer}=makeChoices(String(a),[r2===a?r2+1:r2,a+2,a+3].filter(w=>w!==a&&w>0).slice(0,3).map(String));
    return{topic:'충분조건',q:`두 조건 p: x=a, q: x²−${S}x+${P}=0에 대하여 p가 q이기 위한 충분조건이 되도록 하는 양수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
      sol:[
        `p가 q의 충분조건 ↔ 'p이면 q이다'가 성립 ↔ p의 경우가 q를 만족해야 합니다.`,
        `q: x²−${S}x+${P}=0의 해를 구합니다. (x−${r1})(x−${r2})=0 → x=${r1} 또는 x=${r2}`,
        `p: x=a가 q의 충분조건 ↔ a는 q의 해 중 하나 → a=${r1} 또는 a=${r2}`,
        `양수 조건에 맞는 a = ${a}입니다.`
      ]};
  }
  if(t===2){
    // 필요조건: p: lo<x<a, q: lo<x<hi → p가 q의 필요조건 ↔ q⊆p ↔ a≥hi → 최솟값=hi
    const lo=randInt(0,2),hi=lo+randInt(3,5);
    const ans=hi;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans&&w>lo).slice(0,3).map(String));
    return{topic:'필요조건',q:`두 조건 p: ${lo}<x<a, q: ${lo}<x<${hi}에 대하여 p가 q이기 위한 필요조건이 되도록 하는 자연수 a의 최솟값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
      sol:[
        `p가 q의 필요조건 ↔ 'q이면 p이다'가 성립 ↔ q의 범위가 p의 범위에 포함되어야 합니다.`,
        `q의 범위: ${lo}<x<${hi},  p의 범위: ${lo}<x<a`,
        `q⊆p가 되려면 q의 오른쪽 끝 ${hi}보다 a가 같거나 커야 합니다: a ≥ ${hi}`,
        `자연수 중 최솟값은 a = ${ans}입니다.`
      ]};
  }
  // 필요충분조건: p: lo<x<a, q: lo<x<hi → p↔q ↔ a=hi
  const lo=randInt(1,3),hi=lo+randInt(2,4);
  const ans=hi;
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1>lo?ans-1:ans+2,ans+2].filter(w=>w!==ans&&w>lo).slice(0,3).map(String));
  return{topic:'필요충분조건',q:`두 조건 p: ${lo}<x<a, q: ${lo}<x<${hi}에 대하여 p와 q가 서로 필요충분조건이 되도록 하는 자연수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'},
    sol:[
      `p가 q의 필요충분조건 ↔ p와 q가 완전히 같은 범위 ↔ 두 조건의 진리집합이 동일합니다.`,
      `p의 범위: ${lo}<x<a,  q의 범위: ${lo}<x<${hi}`,
      `두 범위가 완전히 일치하려면 a = ${hi}이어야 합니다.`,
      `따라서 a = ${ans}입니다.`
    ]};
}

// 4-8. 합성함수 (g∘f)(a)  (기출 Q17 패턴A)
function gen_composite_func(){
  const xBase=randInt(1,3);
  const X=[xBase,xBase+1,xBase+2];
  const yOffset=randInt(1,4);
  const Y=shuffle([xBase+yOffset,xBase+yOffset+1,xBase+yOffset+2,xBase+yOffset+3]).slice(0,3).sort((a,b)=>a-b);
  const zOffset=randInt(2,5);
  const Z=Y.map((y,i)=>y+zOffset+i);
  const fPerm=shuffle([0,1,2]),gPerm=shuffle([0,1,2]);
  const f=X.map((x,i)=>[x,Y[fPerm[i]]]);
  const g=Y.map((y,i)=>[y,Z[gPerm[i]]]);
  const inp=pick(X);
  const fx=f.find(([x])=>x===inp)[1];
  const gfx=g.find(([y])=>y===fx)[1];
  const fStr=f.map(([x,y])=>`${x}→${y}`).join(', ');
  const gStr=g.map(([y,z])=>`${y}→${z}`).join(', ');
  const{choices,answer}=makeChoices(String(gfx),[gfx+1,gfx-1,gfx+2,fx].filter(w=>w!==gfx).slice(0,3).map(String));
  return{topic:'합성함수',q:`그림과 같이 두 함수 f: X→Y, g: Y→Z가 있을 때, (g∘f)(${inp})의 값은?`,choices,answer,
    graph:{type:'composite_map',X,Y,Z,f_map:f,g_map:g,inp,fx,gfx},
    meta:{category:'func',type:'집합과 함수',diff:'기초'},
    sol:[
      `(g∘f)(${inp})는 f를 먼저 적용한 뒤, 그 결과에 g를 적용합니다.`,
      `1단계 — f(${inp}): 그림에서 X의 ${inp}이 Y의 어디로 가는지 화살표를 따라갑니다. ${inp}→${fx}이므로 f(${inp})=${fx}`,
      `2단계 — g(${fx}): Y의 ${fx}이 Z의 어디로 가는지 화살표를 따라갑니다. ${fx}→${gfx}이므로 g(${fx})=${gfx}`,
      `따라서 (g∘f)(${inp}) = g(f(${inp})) = g(${fx}) = ${gfx}입니다.`
    ]};
}

// 4-9. 역함수 f⁻¹(a)  (기출 Q17 패턴B)
// ※ t===1 화살표 그림형: 2023년 2회, 2025년 1·2회, 2026년 1회 기출
// ※ t===2 공식형: 2024년 2회 기출
function gen_inverse_func(){
  const t=pick([1,2]);
  if(t===1){
    const domStart=randInt(1,3);
    const X=[domStart,domStart+1,domStart+2,domStart+3];
    const slope=pick([2,3]),intercept=pick([-1,0,1,2]);
    const f=X.map(x=>[x,slope*x+intercept]);
    const[xV,fxV]=pick(f);
    const Yvals=f.map(([,y])=>y);
    const{choices,answer}=makeChoices(String(xV),[xV+1,xV-1<domStart?xV+2:xV-1,fxV].filter(w=>w!==xV&&w>0).slice(0,3).map(String));
    return{
      topic:'역함수',
      q:`함수 f : X → Y가 그림과 같을 때, f⁻¹(${fxV})의 값은? (단, f⁻¹는 f의 역함수)`,
      choices,answer,
      meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'inverse_map',X,Y:Yvals,f_map:f,ask_y:fxV,ans_x:xV},
      sol:[
        `f⁻¹(${fxV})은 'f를 거치면 ${fxV}가 되는 x'를 거꾸로 찾으라는 뜻입니다.`,
        `즉, f(x)=${fxV}가 되는 x를 그림에서 찾습니다. 화살표가 ${fxV}로 도착하는 출발점을 봅니다.`,
        `${xV} → ${fxV}이므로 f(${xV})=${fxV}입니다.`,
        `따라서 f⁻¹(${fxV})=${xV}입니다.`
      ]
    };
  }
  const a=pick([2,3,4]),b=randInt(-3,4);
  const xVal=randInt(1,6);
  const c=a*xVal+b;
  const bStr=b>=0?`+${b}`:String(b);
  const{choices,answer}=makeChoices(String(xVal),[xVal+1,xVal-1<0?xVal+2:xVal-1,c].filter(w=>w!==xVal).slice(0,3).map(String));
  return{topic:'역함수(공식)',q:`함수 f(x)=${a}x${bStr}에 대하여 f⁻¹(${c})의 값은? (단, f⁻¹는 f의 역함수)`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
    sol:[
      `f⁻¹(${c})은 f(x)=${c}가 되는 x를 찾는 것입니다.`,
      `f(x)=${a}x${bStr}=${c}로 놓고 x를 구합니다.`,
      `${a}x=${c}${b>=0?`−${b}`:`+${-b}`}=${c-b}, 그러므로 x=${c-b}÷${a}=${xVal}`,
      `따라서 f⁻¹(${c})=${xVal}입니다.`
    ]};
}

// 4-10. 유리함수 점근선 → 상수  (기출 Q18 패턴A: 2021-2, 2022-2, 2023-1, 2026-1)
function gen_rational_asymptote(){
  const p=pick([2,3,4,-2,-3]),q=pick([2,3,4,-1,-2]);
  const k=pick([1,2,-1]);
  const t=pick([1,2,3]);
  const pn=v=>v<0?`(${v})`:`${v}`;
  if(t===1){
    // y=k/(x-a)+b 형태, 점근선 x=a, y=b → a+b 또는 a-b
    const op=pick(['a+b','a-b']);
    const ans=op==='a+b'?p+q:p-q;
    const kStr=k===1?'':k===-1?'−':String(k);
    const pStr=p>0?`x−${p}`:`x+${-p}`;
    const qStr=q>=0?`+${q}`:String(q);
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2,p,q].filter(w=>w!==ans).slice(0,3).map(String));
    return{topic:'유리함수 점근선',q:`유리함수 y=${kStr}1/(${pStr})${qStr}의 그래프의 점근선이 x=a, y=b일 때, ${op}의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'rational',k,p,q},
      sol:[
        `세로 점근선 x=a는 분모를 0으로 만드는 x값, 가로 점근선 y=b는 맨 끝 상수항입니다.`,
        `이 함수의 점근선은 x=${p}, y=${q}이므로 a=${p}, b=${q}입니다.`,
        `${op}=${op==='a+b'?`${p}+${pn(q)}`:`${p}−${pn(q)}`}=${ans}입니다.`
      ]};
  }
  if(t===2){
    // y=1/(x-a)+b가 y=1/x 이동 → a 구하기
    const aV=pick([2,3,4,-2,-3]),bV=pick([3,4,-1,-2]);
    const ans=aV;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,bV].filter(w=>w!==ans).slice(0,3).map(String));
    const pStr=aV>0?`x−${aV}`:`x+${-aV}`;
    const bStr=bV>=0?`+${bV}`:String(bV);
    return{topic:'유리함수 점근선',q:`유리함수 y=1/(${pStr})${bStr}의 그래프의 점근선이 x=${aV}, y=${bV}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'rational',k:1,p:aV,q:bV},
      sol:[
        `세로 점근선 x=a는 분모(x−a)를 0으로 만드는 x값입니다.`,
        `분모가 ${pStr}이므로 ${pStr}=0, 즉 x=${aV}에서 점근선이 생깁니다.`,
        `따라서 a=${aV}입니다.`
      ]};
  }
  // y=k/(x-a)+b가 y=k/x 이동 → a+b
  const aV=pick([1,2,3,-1,-2]),bV=pick([2,3,4,-1,-2]);
  const ans=aV+bV;
  const kStr=Math.abs(k)===1?'':String(Math.abs(k));
  const sign=k<0?'−':'';
  const pStr=aV>0?`x−${aV}`:`x+${-aV}`;
  const bStr=bV>=0?`+${bV}`:String(bV);
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
  return{topic:'유리함수 평행이동',q:`유리함수 y=${sign}${kStr||''}1/(${pStr})${bStr}의 그래프는 y=${sign}${kStr||''}1/x의 그래프를 x축 방향으로 a만큼, y축 방향으로 b만큼 평행이동한 것이다. 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
    graph:{type:'rational',k,p:aV,q:bV},
    sol:[
      `y=k/x를 x축으로 a만큼, y축으로 b만큼 옮기면 분모는 (x−a), 끝에 +b가 붙어 y=k/(x−a)+b가 됩니다.`,
      `주어진 식 y=${sign}${kStr||''}1/(${pStr})${bStr}와 비교하면 a=${aV}, b=${bV}입니다.`,
      `a+b=${aV}+${pn(bV)}=${ans}입니다.`
    ]};
}

// 4-11. 무리함수 평행이동 a+b  (기출 Q18 패턴B: 2021-1, 2022-1, 2023-2, 2024-2, 2025-2)
function gen_radical_translate(){
  const a=pick([1,2,3,4]),b=pick([1,2,3,4,-1,-2]);
  const t=pick([1,2,3]);
  const pn=v=>v<0?`(${v})`:`${v}`;
  if(t===1){
    // y=√(x-a)+b는 y=√x를 x방향 a, y방향 b 이동 → a+b
    const ans=a+b;
    const bStr=b>=0?`+${b}`:String(b);
    const ws=[ans+1,ans-1,a,b,a-b].filter(w=>w!==ans).slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(ans),ws);
    return{topic:'무리함수 평행이동',q:`무리함수 y=√(x−${a})${bStr}의 그래프는 y=√x의 그래프를 x축의 방향으로 a만큼, y축의 방향으로 b만큼 평행이동한 것이다. a+b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'radical',a:1,p:a,q:b},
      sol:[
        `y=√x를 x축으로 a만큼, y축으로 b만큼 옮기면 y=√(x−a)+b가 됩니다.`,
        `주어진 식 y=√(x−${a})${bStr}와 비교하면 a=${a}, b=${b}입니다.`,
        `a+b=${a}+${pn(b)}=${ans}입니다.`
      ]};
  }
  if(t===2){
    // a-b 묻기
    const ans2=a-b;
    const bStr2=b>=0?`+${b}`:String(b);
    const{choices,answer}=makeChoices(String(ans2),[ans2+1,ans2-1,ans2+2].filter(w=>w!==ans2).map(String));
    return{topic:'무리함수 평행이동',q:`무리함수 y=√(x−${a})${bStr2}의 그래프는 y=√x의 그래프를 x축의 방향으로 a만큼, y축의 방향으로 b만큼 평행이동한 것이다. 두 상수 a, b에 대하여 a−b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
      graph:{type:'radical',a:1,p:a,q:b},
      sol:[
        `y=√(x−a)+b 꼴과 비교하면 a는 x방향 이동, b는 y방향 이동입니다.`,
        `주어진 식에서 a=${a}, b=${b}입니다.`,
        `a−b=${a}−${pn(b)}=${ans2}입니다.`
      ]};
  }
  // 상수 a의 값 직접 묻기 (시작점)
  const bStr3=b>=0?`+${b}`:String(b);
  const{choices,answer}=makeChoices(String(a),[a+1,a-1<0?a+2:a-1,a+2].filter(w=>w!==a).map(String));
  return{topic:'무리함수 상수',q:`무리함수 y=√(x−a)${bStr3}의 그래프의 시작점이 (${a}, ${b})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'},
    graph:{type:'radical',a:1,p:a,q:b},
    sol:[
      `무리함수 y=√(x−a)+b의 그래프는 점 (a, b)에서 시작합니다.`,
      `시작점이 (${a}, ${b})이므로 x좌표 a=${a}입니다.`,
      `따라서 상수 a=${a}입니다.`
    ]};
}

// 집합·함수 디스패처 (11개 유형)
function genMockSetFunc(){
  const gens=[[gen_set_elements,5],[gen_set_count,5],[gen_set_union_inter_sum,3],
    [gen_set_equal_const,2],[gen_truth_set,2],[gen_proposition,5],[gen_nec_suff,1],
    [gen_composite_func,4],[gen_inverse_func,5],
    [gen_rational_asymptote,5],[gen_radical_translate,5]];
  return weightedGen(gens.map(([f,w])=>[()=>{try{return f();}catch(e){return gen_set_count();}},w]));
}

/* ════════════════════════════════════════════════
   ⑤ 확률과 통계 영역 — 실생활 문맥 풍부화
   2021~2026 Q19~Q20 전 패턴 커버
   ════════════════════════════════════════════════ */
function genMockProbStat(){
  const isPermutation=Math.random()<0.5;
  // ─ 순열 문맥 풀 (검정고시 실제 그림 유형 반영)
  const pCtxs=[
    (n,r)=>`그림과 같이 ${n}장의 글자 카드가 있다. 이 중에서 서로 다른 ${r}장의 카드를 택하여 일렬로 나열하는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}개의 경기 종목이 있다. 이 중에서 서로 다른 ${r}개의 종목을 택하여 순서대로 나열하는 경우의 수는?`,
    (n,r)=>`${n}명의 학생 중에서 ${r}명을 뽑아 일렬로 세우는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}점의 작품이 있다. 이 중에서 서로 다른 ${r}점의 작품을 택하여 일렬로 나열하는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}개의 채소 모종이 있다. 이 중에서 서로 다른 ${r}개를 택하여 화분 1과 화분 2에 각각 심는 경우의 수는?`,
    (n,r)=>`서로 다른 ${n}곳을 여행하려 할 때 여행 순서를 정하는 경우의 수는? (단, 한 번 여행한 곳은 다시 가지 않는다.)`,
    (n,r)=>`그림과 같이 ${n}종류의 한국 문화 카드가 각각 한 장씩 있다. 이 중에서 서로 다른 ${r}장의 카드를 택하여 일렬로 나열하는 경우의 수는?`,
  ];
  // ─ 조합 문맥 풀
  const cCtxs=[
    (n,r)=>`그림과 같이 ${n}개의 민속놀이가 있다. 이 중에서 서로 다른 ${r}개를 선택하는 경우의 수는?`,
    (n,r)=>`${n}종류의 꽃 중에서 서로 다른 ${r}종류를 선택하는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}개의 정다면체가 있다. 이 중에서 서로 다른 ${r}개를 선택하는 경우의 수는?`,
    (n,r)=>`${n}가지 방과 후 프로그램 중에서 서로 다른 ${r}가지를 선택하는 경우의 수는?`,
    (n,r)=>`아이스크림 토핑 ${n}종류 중에서 서로 다른 ${r}가지를 선택하는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}개의 수학 진로 과목이 있다. 이 중에서 서로 다른 ${r}과목을 선택하는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}종류의 잡곡이 있다. 이 중에서 서로 다른 ${r}종류를 선택하는 경우의 수는?`,
    (n,r)=>`그림과 같이 ${n}개의 문화 센터 프로그램이 있다. 이 중에서 서로 다른 ${r}개를 선택하는 경우의 수는?`,
  ];
  if(isPermutation){
    const safeOpts=[[3,2],[4,2],[5,2]]; // P값: 6,12,20
    const[n,r]=pick(safeOpts);
    let pnr=1;for(let i=n;i>n-r;i--)pnr*=i;
    const wrongs=[pnr+2,pnr-2,pnr+r*2].filter(w=>w>0&&w!==pnr).slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(pnr),wrongs);
    const pSteps=[];let acc=1;for(let i=n;i>n-r;i--){pSteps.push(`${i}`);acc*=i;}
    return{topic:'순열',q:pick(pCtxs)(n,r),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
      sol:[
        `순열 P(n,r): n개 중 r개를 골라 순서대로 나열하는 경우의 수입니다.`,
        `P(${n},${r}) = ${pSteps.join('×')} = ${pnr}`,
        `(순서가 다르면 다른 경우이므로, 첫 번째부터 차례로 선택 가능한 수를 곱합니다.)`
      ]};
  }
  const safeCombs=[[4,2],[5,2],[6,2],[4,3],[5,3],[6,3]];
  const[n2,r2]=pick(safeCombs);
  let cnr=1;for(let i=0;i<r2;i++)cnr=Math.round(cnr*(n2-i)/(i+1));
  if(cnr>20)cnr=10; // safety
  const wrongs2=[cnr+2,cnr-2,cnr+4].filter(w=>w>0&&w!==cnr).slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(cnr),wrongs2);
  const cNum=[];const cDen=[];for(let i=0;i<r2;i++){cNum.push(n2-i);cDen.push(i+1);}
  return{topic:'조합',q:pick(cCtxs)(n2,r2),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'},
    sol:[
      `조합 C(n,r): n개 중 r개를 순서 없이 선택하는 경우의 수입니다.`,
      `C(${n2},${r2}) = (${cNum.join('×')}) ÷ (${cDen.join('×')}) = ${cNum.reduce((a,b)=>a*b,1)} ÷ ${cDen.reduce((a,b)=>a*b,1)} = ${cnr}`,
      `(순서가 달라도 같은 선택이므로, 순열값을 r!로 나눕니다.)`
    ]};
}

/* ===== 2021~2026 중졸 검정고시 생성기 =====
   최근 2024~2026에 반복된 유형의 가중치를 높이고,
   최근 출제되지 않은 입체도형·산점도는 기본 풀에서 제외한다. */
function weightedGen(items){
  const bag=[];items.forEach(([fn,w])=>{for(let i=0;i<w;i++)bag.push(fn);});
  const fn=pick(bag);try{return fn();}catch(e){return items[0][0]();}
}
var middleMeta=(category,type)=>({category, type, diff:'중졸',level:'middle'});
function genMidPrime(){
  const cases=[
    [36,'2²×3²',[[2,18],[2,9],[3,3]]],[45,'3²×5',[[3,15],[3,5]]],
    [54,'2×3³',[[2,27],[3,9],[3,3]]],[84,'2²×3×7',[[2,42],[2,21],[3,7]]],
    [90,'2×3²×5',[[2,45],[3,15],[3,5]]],[100,'2²×5²',[[2,50],[2,25],[5,5]]]
  ];
  const[n,correct,steps]=pick(cases);
  const wrongs=shuffle(['2×3×5','2²×3×5','2×3²×7','2³×5²','3²×5²']).filter(v=>v!==correct).slice(0,3);
  const{choices,answer}=makeChoices(correct,wrongs);
  const stepStr=steps.map(([d,q])=>`${q}÷${d}=${Math.round(q/d)}`).join(' → ');
  return{topic:'소인수분해',q:`${n}을 소인수분해한 결과로 옳은 것은?`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `소인수분해: 가장 작은 소수(2, 3, 5, 7…)부터 차례대로 나눕니다.`,
      `${n} → ${stepStr} → 1`,
      `나눈 소수들을 모두 곱하면: ${correct}`,
      `따라서 ${n} = ${correct}입니다.`
    ]};
}
function genMidNumber(){
  const nums=shuffle([randInt(-7,-2),-1,0,randInt(1,5),randInt(6,10)]).slice(0,4);
  const sorted=[...nums].sort((a,b)=>a-b),pos=randInt(1,4),correct=String(sorted[pos-1]);
  const{choices,answer}=makeChoices(correct,nums.filter(v=>String(v)!==correct).map(String));
  return{topic:'수의 대소',q:`${nums.join(', ')}을 작은 수부터 차례대로 나열할 때, ${['첫','둘','셋','넷'][pos-1]}째 수는?`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `수직선에서 왼쪽에 있을수록 작은 수입니다. (음수 < 0 < 양수)`,
      `주어진 수: ${nums.join(', ')}`,
      `작은 순서대로: ${sorted.join(' < ')}`,
      `${['첫','둘','셋','넷'][pos-1]}째 수는 ${correct}입니다.`
    ]};
}
function genMidRepeating(){
  const n=randInt(1,8),correct=`${n}/9`;
  const{choices,answer}=makeChoices(correct,[`${Math.max(1,n-1)}/9`,`${n}/10`,`${Math.min(8,n+1)}/9`]);
  return{topic:'순환소수',q:`순환소수 0.${n}${n}${n}…을 기약분수로 나타낸 것은?`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `x = 0.${n}${n}${n}… 로 놓습니다.`,
      `10x = ${n}.${n}${n}${n}… 입니다.`,
      `10x − x = ${n}.${n}${n}… − 0.${n}${n}… = ${n}`,
      `9x = ${n}  →  x = ${n}/9`,
      `따라서 0.${n}${n}${n}… = ${n}/9입니다.`
    ]};
}
function genMidExponent(){
  const a=randInt(2,4),b=randInt(2,5),c=randInt(1,Math.min(3,a+b-1)),ans=a+b-c;
  const{choices,answer}=makeChoices(`x${ans===1?'':`^${ans}`}`,[ans-1,ans+1,a*b].filter(v=>v>0&&v!==ans).map(v=>`x${v===1?'':`^${v}`}`));
  return{topic:'지수법칙',q:`x^${a} × x^${b} ÷ x^${c}을 간단히 한 것은? (단, x≠0)`,choices,answer,meta:middleMeta('mid_num','수와 연산'),
    sol:[
      `지수법칙: 같은 밑(x)끼리 곱하면 지수를 더하고, 나누면 지수를 뺍니다.`,
      `x^${a} × x^${b} = x^(${a}+${b}) = x^${a+b}`,
      `x^${a+b} ÷ x^${c} = x^(${a+b}−${c}) = x^${ans}`,
      `따라서 답은 x^${ans}${ans===1?' = x':''}입니다.`
    ]};
}
function genMidSubstitute(){
  const a=randInt(-3,5),m=randInt(2,5),b=randInt(-4,5),ans=m*a+b;
  const bS=b>=0?`+${b}`:String(b);
  const pn=v=>v<0?`(${v})`:String(v);
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+2,ans+m].map(String));
  return{topic:'식의 값',q:`a=${a}일 때, ${m}a${bS}의 값은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `식의 값: a 자리에 ${a}를 그대로 넣어 계산합니다.`,
      `${m}a${bS}에 a=${a}를 대입하면: ${m}×${pn(a)}${bS}`,
      `= ${m*a}${bS} = ${ans}`,
      `따라서 답은 ${ans}입니다.`
    ]};
}
function genMidWordExpr(){
  const price=pick([300,500,700,1200,2000]),base=pick([0,100,200]);
  const correct=base?`${price}x+${base}`:`${price}x`;
  const q=base?`무게가 ${base}g인 빈 상자에 ${price}g인 물건 x개를 넣었을 때 전체 무게를 식으로 나타낸 것은?`:`한 개에 ${price}원인 물건 x개의 가격을 식으로 나타낸 것은?`;
  const{choices,answer}=makeChoices(correct,[`${price}+x`,`${price}-x`,`${price}÷x`]);
  return{topic:'문자를 사용한 식',q,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:base?[
      `문자 x는 '개수'를 나타내므로 x를 곱해서 전체 양을 구합니다.`,
      `물건 x개의 무게: ${price}×x = ${price}x (g)`,
      `빈 상자 무게 ${base}g을 더하면 전체 무게: ${price}x + ${base} (g)`,
      `따라서 식은 ${correct}입니다.`
    ]:[
      `한 개의 가격 × 개수 = 전체 가격입니다.`,
      `${price}원짜리 물건 x개의 가격: ${price}×x = ${price}x (원)`,
      `따라서 식은 ${correct}입니다.`
    ]};
}
function genMidLinearEq(){
  const x=randInt(1,8),a=randInt(2,5),c=randInt(1,a-1),b=randInt(-5,5),d=(a-c)*x+b;
  const bS=b>=0?`+${b}`:String(b),dS=d>=0?`+${d}`:String(d);
  const coeff=a-c;
  const rhs=d-b;
  const{choices,answer}=makeChoices(String(x),[x-1,x+1,x+2].filter(v=>v>=0).map(String));
  return{topic:'일차방정식',q:`일차방정식 ${a}x${bS}=${c}x${dS}의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `x가 있는 항은 왼쪽으로, 숫자만 있는 항은 오른쪽으로 옮깁니다.`,
      `${a}x${bS}=${c}x${dS}에서 ${a}x−${c}x = ${d>=0?d:'('+d+')'}${b>=0?'−'+b:'+('+Math.abs(b)+')'}`,
      `${coeff}x = ${rhs}`,
      `x = ${rhs}÷${coeff} = ${x}`,
      `따라서 해는 x = ${x}입니다.`
    ]};
}
function genMidSystem(){
  const x=randInt(1,5),y=randInt(1,5),s=x+y,d=x-y,correct=`x=${x}, y=${y}`;
  const wrongs=[`x=${y}, y=${x}`,`x=${x+1}, y=${Math.max(0,y-1)}`,`x=${Math.max(0,x-1)}, y=${y+1}`];
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'연립방정식',q:`연립방정식 { x+y=${s}, x−y=${d} }의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `두 식을 더해서 y를 없애는 방법을 씁니다.`,
      `①+②: (x+y)+(x−y) = ${s}+(${d}) → 2x = ${s+d} → x = ${x}`,
      `①에 x=${x}를 넣으면: ${x}+y=${s} → y = ${s}−${x} = ${y}`,
      `따라서 해는 x=${x}, y=${y}입니다.`
    ]};
}
function genMidInequality(){
  const a=randInt(2,6),x=randInt(1,7),b=a*x,correct=`x≥${x}`;
  const{choices,answer}=makeChoices(correct,[`x>${x}`,`x≤${x}`,`x<${x}`]);
  return{topic:'일차부등식',q:`일차부등식 ${a}x≥${b}의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `부등식도 방정식처럼 양변에 같은 연산을 합니다. (양수로 나눌 때 부등호 방향 유지)`,
      `${a}x ≥ ${b}의 양변을 ${a}로 나눕니다.`,
      `x ≥ ${b}÷${a} = ${x}`,
      `따라서 해는 x ≥ ${x}입니다.`
    ]};
}
function genMidRadical(){
  const r=pick([2,3,5]),a=randInt(2,6),b=randInt(1,a-1),op=pick(['+','−']);
  const ans=op==='+'?a+b:a-b,correct=`${ans===1?'':ans}√${r}`;
  const{choices,answer}=makeChoices(correct,[`${a+b+1}√${r}`,`${Math.max(1,ans-1)}√${r}`,`${ans}√${r+1}`]);
  return{topic:'근호의 계산',q:`${a}√${r} ${op} ${b}√${r}을 간단히 한 것은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `√${r}이 공통으로 있으므로 √${r}을 하나로 묶어 계수끼리만 계산합니다.`,
      `${a}√${r} ${op} ${b}√${r} = (${a}${op==='+'?'+':'−'}${b})×√${r}`,
      `= ${ans}×√${r} = ${correct}`,
      `(주의: √안의 숫자가 같아야 더하거나 뺄 수 있습니다.)`
    ]};
}
function genMidQuadraticEq(){
  const r1=randInt(1,4),r2=randInt(5,8),known=pick([r1,r2]),ans=known===r1?r2:r1;
  const{choices,answer}=makeChoices(String(ans),[ans-1,ans+1,ans+2].filter(v=>v>0).map(String));
  return{topic:'이차방정식',q:`이차방정식 (x−${r1})(x−${r2})=0의 한 근이 ${known}이다. 다른 한 근은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식'),
    sol:[
      `A×B=0이면 A=0 또는 B=0입니다. 두 인수 중 하나가 반드시 0이 됩니다.`,
      `(x−${r1})=0 또는 (x−${r2})=0`,
      `x=${r1} 또는 x=${r2}가 두 근입니다.`,
      `한 근이 ${known}이라고 했으므로 다른 한 근은 ${ans}입니다.`
    ]};
}
function genMidLinearFunc(){
  const a=pick([-3,-2,-1,1,2,3]),b=randInt(-4,5),ask=pick(['value','intercept']);
  // 표기 정리: a=1→x, a=-1→−x, b=0→생략, b<0→−n
  const axTerm=a===1?'x':a===-1?'−x':`${a}x`;
  const bTerm=b===0?'':b>0?`+${b}`:`−${-b}`;
  const fStr=`${axTerm}${bTerm}`;
  if(ask==='intercept'){
    const{choices,answer}=makeChoices(String(b),[b-1,b+1,a].filter(v=>v!==b).map(String));
    return{topic:'일차함수 y절편',q:`일차함수 y=${fStr}의 그래프의 y절편은?`,choices,answer,meta:middleMeta('mid_func','함수'),
      graph:{type:'linear',a,b},
      sol:[
        `y절편은 그래프가 y축과 만나는 점의 y좌표입니다. x=0을 넣어 구합니다.`,
        `y=(${a})×0${bTerm||'+0'}=${b}`,
        `따라서 y절편은 ${b}입니다. (그래프가 y축과 만나는 높이)`
      ]};
  }
  const x=randInt(-2,4),ans=a*x+b;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+1,ans+2].filter(v=>v!==ans).map(String));
  const xIn=x<0?`(${x})`:x;
  const bAdd=b===0?'':b>0?`+${b}`:`−${-b}`;
  const prodStr=`${a*x}`;
  return{topic:'일차함수',q:`일차함수 f(x)=${fStr}일 때, f(${x})의 값은?`,choices,answer,meta:middleMeta('mid_func','함수'),
    graph:{type:'linear',a,b,x0:x,y0:ans},
    sol:[
      `f(${x})은 x자리에 ${x}를 그대로 넣어 계산하라는 뜻입니다.`,
      `f(${x})=(${a})×${xIn}${bAdd}=${prodStr}${bAdd}=${ans}`,
      `따라서 f(${x})=${ans}입니다.`
    ]};
}
function genMidQuadraticDesc(){
  const a=pick([-1,1]),p=randInt(-2,2),q=randInt(-3,3);
  const eq=`y=${a===1?'':a===-1?'−':a}(x${p===0?'':p>0?`−${p}`:`+${-p}`})²${q===0?'':q>0?`+${q}`:q}`;
  const correct=`꼭짓점은 (${p}, ${q})이다.`;
  const wrongs=[`꼭짓점은 (${-p}, ${q})이다.`,`축은 x=${-p}이다.`,a>0?'위로 볼록하다.':'아래로 볼록하다.'];
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'이차함수 그래프',q:`이차함수 ${eq}의 그래프에 대한 설명으로 옳은 것은?`,choices,answer,graph:{type:'quadratic',a,p,q,ds:p-2,de:p+2},meta:middleMeta('mid_func','함수'),
    sol:[
      `y=a(x−p)²+q 꼴에서 꼭짓점은 (p, q)이고 축의 방정식은 x=p입니다.`,
      `주어진 식에서 p=${p}, q=${q}이므로 꼭짓점은 (${p}, ${q})입니다.`,
      `축의 방정식은 x=${p}입니다. (부호 주의: (x${p>0?`−${p}`:`+${-p}`})에서 p=${p})`,
      `a=${a}${a>0?'이므로 아래로 볼록':'이므로 위로 볼록'}한 포물선입니다.`,
      `따라서 옳은 것은 '꼭짓점은 (${p}, ${q})이다.'입니다.`
    ]};
}
function genMidIsosceles(){
  const top=pick([40,50,70,80,100]),ans=(180-top)/2;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,top].filter(v=>v>0&&v<180&&v!==ans).map(v=>`${v}°`));
  return{topic:'이등변삼각형',q:`AB=AC인 이등변삼각형 ABC에서 ∠A=${top}°일 때, ∠B의 크기는?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    graph:{type:'iso_triangle',apex:top,baseAng:ans},
    sol:[
      `삼각형 세 각의 크기를 모두 더하면 180°입니다.`,
      `AB=AC인 이등변삼각형은 밑각이 서로 같으므로 ∠B=∠C입니다.`,
      `∠B+∠C=180°−∠A=180°−${top}°=${180-top}°`,
      `∠B와 ∠C가 같으므로 ∠B=${180-top}°÷2=${ans}°입니다.`
    ]};
}
// 평행선과 각 (동위각·엇각)  — 그림 필수 유형
function genMidParallel(){
  const g=pick([50,55,65,70,110,115,125,130]);
  const kind=pick(['동위각','엇각']);
  // 동위각·엇각은 크기가 서로 같다
  const ans=g;
  const{choices,answer}=makeChoices(`${ans}°`,[180-g,g+10,Math.abs(g-15)].filter(v=>v>0&&v<180&&v!==ans).slice(0,3).map(v=>`${v}°`));
  return{topic:'평행선과 각',q:`두 직선 l, m이 서로 평행하고 직선 n과 만난다. 그림에서 ∠a=${g}°일 때, ∠a의 ${kind}인 ∠b의 크기는?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    graph:{type:'parallel_lines',ang:g,kind},
    sol:[
      `두 직선 l, m이 평행할 때, ${kind}의 크기는 서로 같습니다.`,
      `따라서 ∠b는 ∠a와 같은 ${g}°입니다.`,
      `참고: 한 점에서 일직선을 이루는 두 각의 합은 180°이므로, ∠a의 이웃한 각은 ${180-g}°입니다.`
    ]};
}
// 순서쌍을 좌표평면에 — 사분면 찾기 (그림 필수 유형)
function genMidQuadrant(){
  const x=pick([-4,-3,-2,2,3,4]),y=pick([-4,-3,-2,2,3,4]);
  const quad=x>0&&y>0?1:x<0&&y>0?2:x<0&&y<0?3:4;
  const ko=['제1사분면','제2사분면','제3사분면','제4사분면'];
  const correct=ko[quad-1];
  const{choices,answer}=makeChoices(correct,ko.filter(v=>v!==correct));
  const xSign=x>0?'양수(+)':'음수(−)', ySign=y>0?'양수(+)':'음수(−)';
  return{topic:'좌표와 사분면',q:`좌표평면 위의 점 P(${x}, ${y})는 제몇 사분면 위의 점인가?`,choices,answer,meta:middleMeta('mid_func','함수'),
    graph:{type:'point_plot',px:x,py:y},
    sol:[
      `점의 좌표는 (x좌표, y좌표) 순서로 읽습니다. 여기서 x=${x}, y=${y}입니다.`,
      `x좌표 ${x}는 ${xSign}, y좌표 ${y}는 ${ySign}입니다.`,
      `x가 ${x>0?'오른쪽':'왼쪽'}, y가 ${y>0?'위쪽':'아래쪽'}이므로 점 P는 ${correct}에 있습니다.`
    ]};
}
function genMidSimilarity(){
  const scale=pick([2,3]),small=randInt(2,6),ans=small*scale;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+2,small+scale].filter(v=>v>0).map(String));
  return{topic:'닮음',q:`서로 닮은 두 삼각형의 닮음비가 1:${scale}이다. 작은 삼각형의 한 변이 ${small}cm일 때 대응하는 큰 삼각형의 변의 길이는?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    sol:[
      `닮음비 1:${scale}은 '작은 도형의 변 길이 × ${scale} = 큰 도형의 변 길이'를 뜻합니다.`,
      `작은 삼각형의 변이 ${small}cm이므로 큰 삼각형의 대응하는 변 = ${small} × ${scale} = ${ans}cm`,
      `따라서 정답은 ${ans}cm입니다.`
    ]};
}
function genMidTrig(){
  // 직각삼각형 ABC: 직각은 C, 각 B를 기준으로 삼각비를 구한다.
  // 변: BC = 밑변(각 B에 이웃) = adj, AC = 높이(각 B의 대변) = opp, AB = 빗변 = hyp
  const tri=pick([[3,4,5],[5,12,13],[8,15,17]]); // 서로소 삼각수만 사용(기약분수 보장)
  const[opp,adj,hyp]=tri; // opp=AC(높이), adj=BC(밑변), hyp=AB(빗변)
  const kind=pick(['sin','cos','tan']);
  // 각 B 기준: sinB=대변/빗변=opp/hyp, cosB=이웃변/빗변=adj/hyp, tanB=대변/이웃변=opp/adj
  const correct=kind==='sin'?`${opp}/${hyp}`:kind==='cos'?`${adj}/${hyp}`:`${opp}/${adj}`;
  const pool=[`${opp}/${hyp}`,`${adj}/${hyp}`,`${opp}/${adj}`,`${adj}/${opp}`].filter(v=>v!==correct);
  const{choices,answer}=makeChoices(correct,pool);
  const desc=kind==='sin'?'sin은 (높이)/(빗변)':kind==='cos'?'cos은 (밑변)/(빗변)':'tan은 (높이)/(밑변)';
  const num=kind==='sin'?opp:kind==='cos'?adj:opp;
  const den=kind==='sin'?hyp:kind==='cos'?hyp:adj;
  return{topic:'삼각비',q:`그림과 같은 직각삼각형 ABC에서 ∠C=90°이고 BC=${adj}, AC=${opp}, AB=${hyp}일 때, ${kind} B의 값은?`,choices,answer,meta:middleMeta('mid_geo','기하'),
    graph:{type:'right_triangle',adj,opp,hyp},
    sol:[
      `각 B를 기준으로 봅니다. 직각(∠C=90°)의 맞은편 변 AB=${hyp}가 빗변입니다.`,
      `각 B에 이웃한 변(밑변)은 BC=${adj}, 각 B의 맞은편 변(높이)은 AC=${opp}입니다.`,
      `${desc} 이므로 ${kind} B = ${num}/${den}입니다.`,
      `따라서 정답은 ${correct}입니다.`
    ]};
}
function genMidCircleAngle(){
  const ins=pick([30,35,40,45,50]),ask=pick(['center','same']);
  const ans=ask==='center'?ins*2:ins;
  const q=ask==='center'?`원에서 같은 호 AB를 보는 원주각이 ${ins}°일 때 중심각의 크기는?`:`원 위의 두 점 C, D가 같은 호 AB를 볼 때, ∠ACB=${ins}°이면 ∠ADB의 크기는?`;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,ins*2].filter(v=>v!==ans&&v>0).map(v=>`${v}°`));
  return{topic:ask==='center'?'원주각과 중심각':'같은 호의 원주각',q,choices,answer,meta:middleMeta('mid_geo','기하'),
    sol:ask==='center'?[
      `원주각과 중심각의 관계: 중심각 = 원주각 × 2`,
      `같은 호 AB를 보는 원주각이 ${ins}°이므로 중심각 = ${ins}°× 2 = ${ans}°`,
      `따라서 중심각의 크기는 ${ans}°입니다.`
    ]:[
      `같은 호를 보는 원주각의 크기는 모두 같습니다.`,
      `∠ACB와 ∠ADB는 모두 같은 호 AB에 대한 원주각입니다.`,
      `따라서 ∠ADB = ∠ACB = ${ins}°입니다.`
    ]};
}
function genMidProbability(){
  const total=pick([8,10,12]),fav=pick([2,3,4,5]),g=gcdFn(fav,total),correct=`${fav/g}/${total/g}`;
  const wrongs=[];
  for(const n of[1,fav-1,fav+1,total-fav]){
    if(n<=0||n>=total||n*total===fav*total)continue;
    const gg=gcdFn(n,total),s=`${n/gg}/${total/gg}`;
    if(s!==correct&&!wrongs.includes(s))wrongs.push(s);
  }
  const{choices,answer}=makeChoices(correct,wrongs);
  const g2=gcdFn(fav,total);
  return{topic:'확률',q:`모양과 크기가 같은 공 ${total}개 중 빨간 공이 ${fav}개이다. 한 개를 꺼낼 때 빨간 공이 나올 확률은?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),
    sol:[
      `확률 = (원하는 경우의 수) ÷ (전체 경우의 수)`,
      `전체 경우의 수: 공 ${total}개 중 1개를 꺼내는 방법 = ${total}가지`,
      `빨간 공이 나오는 경우의 수: ${fav}가지`,
      `확률 = ${fav}/${total}${g2>1?` = ${fav/g2}/${total/g2} (분자·분모를 ${g2}로 약분)`:''}`,
      `따라서 정답은 ${correct}입니다.`
    ]};
}
function genMidCounting(){
  const a=randInt(2,5),b=randInt(2,4),ans=a*b;
  const{choices,answer}=makeChoices(String(ans),[a+b,ans-1,ans+2].filter(v=>v!==ans).map(String));
  return{topic:'경우의 수',q:`윗옷 ${a}벌과 바지 ${b}벌 중에서 각각 하나씩 골라 입는 경우의 수는?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),
    sol:[
      `두 가지 선택을 동시에 할 때는 곱의 법칙: (윗옷 수) × (바지 수)를 씁니다.`,
      `윗옷 ${a}벌 중 1벌 선택: ${a}가지`,
      `바지 ${b}벌 중 1벌 선택: ${b}가지`,
      `전체 경우의 수: ${a} × ${b} = ${ans}가지`
    ]};
}
function genMidRepresentative(){
  const kind=pick(['평균','중앙값','최빈값']);
  let data,ans,sol;
  if(kind==='평균'){
    const m=randInt(4,8);data=[m-2,m,m+1,m+1];ans=m;
    const sum=(m-2)+m+(m+1)+(m+1);
    sol=[
      `평균 = (모든 자료의 합) ÷ (자료의 개수)`,
      `합: ${data.join('+')} = ${sum}`,
      `자료의 개수: ${data.length}개`,
      `평균 = ${sum} ÷ ${data.length} = ${ans}`
    ];
  }else if(kind==='중앙값'){
    data=shuffle([2,4,5,7,9]);const sorted=[2,4,5,7,9];ans=5;
    sol=[
      `중앙값: 자료를 크기 순서대로 늘어놓았을 때 가운데 값입니다.`,
      `크기 순서로 정렬: ${sorted.join(', ')}`,
      `자료 5개이므로 가운데(3번째) 값 = ${ans}`,
      `따라서 중앙값은 ${ans}입니다.`
    ];
  }else{
    data=shuffle([3,5,5,5,7,8]);ans=5;
    sol=[
      `최빈값: 자료에서 가장 많이 나타나는 값입니다.`,
      `자료: ${[3,5,5,5,7,8].join(', ')}`,
      `3은 1번, 5는 3번, 7은 1번, 8은 1번 나타납니다.`,
      `가장 많이 나오는 값은 5(3번)이므로 최빈값 = ${ans}`
    ];
  }
  const{choices,answer}=makeChoices(String(ans),[ans-1,ans+1,ans+2].map(String));
  return{topic:kind,q:`자료 ${data.join(', ')}의 ${kind}은?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),sol};
}
function genMidFrequency(){
  const rows=[{label:'0 이상~10 미만',n:3},{label:'10 이상~20 미만',n:7},{label:'20 이상~30 미만',n:6},{label:'30 이상~40 미만',n:4}];
  const ans=rows[2].n+rows[3].n;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+1,ans+2].map(String));
  return{topic:'도수분포표',q:`통학 시간별 학생 수가 0~10분 3명, 10~20분 7명, 20~30분 6명, 30~40분 4명일 때, 20분 이상인 학생 수는?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계'),
    sol:[
      `'20분 이상'이란 20분~30분 구간과 30분~40분 구간을 모두 포함합니다.`,
      `20~30분 구간: ${rows[2].n}명`,
      `30~40분 구간: ${rows[3].n}명`,
      `합계: ${rows[2].n} + ${rows[3].n} = ${ans}명`,
      `따라서 20분 이상인 학생 수는 ${ans}명입니다.`
    ]};
}
var MID_DOMAIN_GENS={
  '수와 연산':()=>weightedGen([[genMidPrime,4],[genMidNumber,3],[genMidRepeating,3],[genMidExponent,3]]),
  '문자와 식':()=>weightedGen([[genMidLinearEq,4],[genMidSystem,4],[genMidInequality,3],[genMidSubstitute,3],[genMidWordExpr,3],[genMidRadical,4],[genMidQuadraticEq,4]]),
  '함수':()=>weightedGen([[genMidLinearFunc,5],[genMidQuadraticDesc,5],[genMidQuadrant,3]]),
  '기하':()=>weightedGen([[genMidIsosceles,4],[genMidSimilarity,4],[genMidTrig,5],[genMidCircleAngle,4],[genMidParallel,4]]),
  '확률과 통계':()=>weightedGen([[genMidProbability,5],[genMidCounting,4],[genMidRepresentative,5],[genMidFrequency,3]])
};
function genMiddleMock(domain){
  const key=domain||pick(Object.keys(MID_DOMAIN_GENS));
  return MID_DOMAIN_GENS[key]();
}

/* ===== SVG BASE COMPONENTS ===== */
