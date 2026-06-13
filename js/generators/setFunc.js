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

    // 좌표 포맷(정수면 정수, 소수면 소수 1자리)
    const fmtN=v=>Number.isInteger(v)?String(v):(+v.toFixed(1)).toString();
    const fmtCoord=pt=>`(${fmtN(pt.x)}, ${fmtN(pt.y)})`;

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
        {/* 구간 경계 점선 */}
        <line x1={toQx(ds)} y1={8} x2={toQx(ds)} y2={H-8} stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="4,3" opacity={0.7}/>
        <line x1={toQx(de)} y1={8} x2={toQx(de)} y2={H-8} stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="4,3" opacity={0.7}/>
        {/* 포물선 전체(옅게) */}
        {pts.length>1&&<polyline points={pts.join(' ')} fill="none" stroke="#c7d2fe" strokeWidth={1.4}/>}
        {/* 포물선 구간(진하게) */}
        {rangePts.length>1&&<polyline points={rangePts.join(' ')} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"/>}
        {/* 구간 시작점 (극값 아닌 경우에만 별도 표시) */}
        {!isDsExtreme&&<g>
          <circle cx={toQx(ds)} cy={toQy(yDs)} r={4} fill="white" stroke="#6b7280" strokeWidth={2}/>
          <text x={toQx(ds)} y={toQy(yDs)+(yDs<=extremePt.y?14:-8)} textAnchor="middle" fontSize={9} fill="#6b7280" fontWeight="700" stroke="white" strokeWidth="2.5" paintOrder="stroke">{fmtCoord(startPt)}</text>
        </g>}
        {/* 구간 끝점 (극값 아닌 경우에만 별도 표시) */}
        {!isDeExtreme&&<g>
          <circle cx={toQx(de)} cy={toQy(yDe)} r={4} fill="white" stroke="#6b7280" strokeWidth={2}/>
          <text x={toQx(de)} y={toQy(yDe)+(yDe<=extremePt.y?14:-8)} textAnchor="middle" fontSize={9} fill="#6b7280" fontWeight="700" stroke="white" strokeWidth="2.5" paintOrder="stroke">{fmtCoord(endPt)}</text>
        </g>}
        {/* 꼭짓점이 구간 내이고 극값이 아닌 경우: 꼭짓점 좌표만 옅게 */}
        {vxInRange&&extremePt.x!==p&&<g>
          <circle cx={toQx(p)} cy={toQy(vq)} r={3.5} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2,2"/>
        </g>}
        {/* ★ 극값점: 크고 선명하게, 좌표만 표기(최솟값/최댓값 텍스트 없음) */}
        <circle cx={toQx(extremePt.x)} cy={toQy(extremePt.y)} r={6} fill={extremeColor} stroke="white" strokeWidth={2.5}/>
        <text x={toQx(extremePt.x)} y={toQy(extremePt.y)+(a>0?-10:16)} textAnchor="middle" fontSize={10} fill={extremeColor} fontWeight="900" stroke="white" strokeWidth="3" paintOrder="stroke">{fmtCoord(extremePt)}</text>
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

  return null;
}

/* ════════════════════════════════════════════════
   ④ 집합과 함수 영역 — 11개 세부유형 완전 분석
   2021~2026 Q15~Q18 전 패턴 커버
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
  return{topic:'집합 원소연산',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 ${qText}는?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
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
  return{topic:'집합 개수',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 ${qText}의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
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
  return{topic:'합집합+교집합 개수',q:`두 집합 A={${A.join(', ')}}, B={${B.join(', ')}}에 대하여 n(A∪B)+n(A∩B)의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
}

// 4-4. 집합 A=B 조건 → 상수 a  (기출 Q15: 2023-2, 2025-2)
function gen_set_equal_const(){
  const t=pick([1,2,3]);
  if(t===1){const a=4;const{choices,answer}=makeChoices('4',['3','5','6']);return{topic:'집합 상수 구하기',q:`두 집합 A={1, a−1, 5}, B={1, 3, 5}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};}
  if(t===2){const a=5;const{choices,answer}=makeChoices('5',['4','6','3']);return{topic:'집합 상수 구하기',q:`두 집합 A={2, 4, a+1}, B={2, 4, 6}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};}
  const a=4;const{choices,answer}=makeChoices('4',['3','5','6']);
  return{topic:'집합 상수 구하기',q:`두 집합 A={1, 3, a+1}, B={1, a−1, 5}에 대하여 A=B일 때, 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
}

// 4-5. 진리집합  (기출 Q16: 2023-2, 2024-1)
function gen_truth_set(){
  const t=pick([1,2,3,4]);
  if(t===1){const{choices,answer}=makeChoices('{2, 4, 6, 8}',['{1, 3, 5, 7, 9}','{2, 4, 6}','{2, 4, 6, 8, 10}']);return{topic:'진리집합',q:`전체집합 U={1, 2, 3, 4, 5, 6, 7, 8, 9}일 때, 조건 "x는 짝수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};}
  if(t===2){const{choices,answer}=makeChoices('{3, 6, 9}',['{3, 6}','{1, 4, 7}','{6, 9}']);return{topic:'진리집합',q:`전체집합 U={1, 2, 3, 4, 5, 6, 7, 8, 9}일 때, 조건 "x는 3의 배수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};}
  if(t===3){const{choices,answer}=makeChoices('{4, 8}',['{4}','{2, 4, 8}','{4, 8, 12}']);return{topic:'진리집합',q:`전체집합 U={1, 2, 3, 4, 5, 6, 7, 8, 9}일 때, 조건 "x는 4의 배수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};}
  const div=pick([3,4,5]),maxN=pick([9,10,12]);
  const mults=[];for(let i=div;i<=maxN;i+=div)mults.push(i);
  const correct=`{${mults.join(', ')}}`;
  const w1=`{${mults.slice(0,-1).join(', ')}}`,w2=`{${mults.map(x=>x+1).join(', ')}}`,w3=`{${mults.filter((_,i)=>i%2===0).join(', ')}}`;
  const{choices,answer}=makeChoices(correct,[w1,w2,w3].filter(w=>w!==correct));
  return{topic:'진리집합',q:`전체집합 U={x|x는 ${maxN} 이하의 자연수}일 때, 조건 "x는 ${div}의 배수이다."의 진리집합은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
}

// 4-6. 명제의 역/대우/이  (기출 Q16 패턴)
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
  const askType=pick(['역','대우','이']);
  const correct=askType==='역'?rev:askType==='대우'?contra:inv;
  const{choices,answer}=makeChoices(correct,[orig,rev,contra,inv].filter(w=>w!==correct).slice(0,3));
  return{topic:`명제의 ${askType}`,q:`명제 '${orig}'의 ${askType}는?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
}

// 4-7. 필요조건/충분조건  (기출 Q15/Q16: 2024-2, 2025-1, 2026-1)
function gen_nec_suff(){
  const t=pick([1,2,3]);
  if(t===1){
    // p: x-a=0, q: x²-Sx+P=0에서 p가 q의 충분조건 → a는 q의 근
    const r1=pick([2,3,4]),r2=r1+pick([1,2,3]);
    const S=r1+r2,P=r1*r2,a=r1;
    const{choices,answer}=makeChoices(String(a),[r2,a+1,a+r2].filter(w=>w!==a&&w>0).slice(0,3).map(String));
    return{topic:'충분조건',q:`두 조건 p: x−a=0, q: x²−${S}x+${P}=0에 대하여 p가 q이기 위한 충분조건이 되도록 하는 상수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
  }
  if(t===2){
    // p: x=2, q: x²-ax-0=0={0,a} → p는 q의 충분조건이 되려면 2는 q의 근
    const root=pick([2,3,4]),other=pick([1,2,3]);
    const a=root+other; // q: x²-(root+other)x+root*other, but simplified
    const{choices,answer}=makeChoices(String(root),[root+1,root-1<0?root+2:root-1,a].filter(w=>w!==root&&w>0).slice(0,3).map(String));
    return{topic:'충분조건',q:`두 조건 p: x=${root}, q: x²−${root+other}x+${root*other}=0에 대하여 p는 q이기 위한 충분조건이다. 이때 옳은 것은?`,choices:['p는 q의 충분조건이지만 필요조건이 아니다','p는 q의 필요조건이지만 충분조건이 아니다','p는 q의 필요충분조건이다','p와 q는 서로 무관하다'],answer:'p는 q의 충분조건이지만 필요조건이 아니다',meta:{category:'set',type:'집합과 함수',diff:'기초'}};
  }
  // 구간형: p가 q의 충분조건이 되도록 하는 상수 a
  const offset=pick([1,2,3]),base=randInt(1,3);
  const lo=base,hi=base+offset+pick([2,3]);
  const ans=lo+offset; // p구간 좁게
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1<lo?ans+2:ans-1,hi].filter(w=>w!==ans&&w>lo).slice(0,3).map(String));
  return{topic:'필요충분조건',q:`두 조건 p: ${lo}<x<a, q: ${lo}<x<${hi}에 대하여 p가 q이기 위한 충분조건이 되도록 하는 자연수 a의 값은?`,choices,answer,meta:{category:'set',type:'집합과 함수',diff:'기초'}};
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
  return{topic:'합성함수',q:`두 함수 f:{${fStr}}, g:{${gStr}}일 때, (g∘f)(${inp})의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
}

// 4-9. 역함수 f⁻¹(a)  (기출 Q17 패턴B)
function gen_inverse_func(){
  const t=pick([1,2]);
  if(t===1){
    const domStart=randInt(1,3);
    const X=[domStart,domStart+1,domStart+2,domStart+3];
    const slope=pick([2,3]),intercept=pick([-1,0,1,2]);
    const f=X.map(x=>[x,slope*x+intercept]);
    const[xV,fxV]=pick(f);
    const fStr=f.map(([x,y])=>`${x}→${y}`).join(', ');
    const{choices,answer}=makeChoices(String(xV),[xV+1,xV-1<domStart?xV+2:xV-1,fxV].filter(w=>w!==xV&&w>0).slice(0,3).map(String));
    return{topic:'역함수',q:`함수 f가 {${fStr}}일 때, f⁻¹(${fxV})의 값은? (단, f⁻¹는 f의 역함수)`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
  }
  const a=pick([2,3,4]),b=randInt(-3,4);
  const xVal=randInt(1,6);
  const c=a*xVal+b;
  const bStr=b>=0?`+${b}`:String(b);
  const{choices,answer}=makeChoices(String(xVal),[xVal+1,xVal-1<0?xVal+2:xVal-1,c].filter(w=>w!==xVal).slice(0,3).map(String));
  return{topic:'역함수(공식)',q:`함수 f(x)=${a}x${bStr}에 대하여 f⁻¹(${c})의 값은? (단, f⁻¹는 f의 역함수)`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
}

// 4-10. 유리함수 점근선 → 상수  (기출 Q18 패턴A: 2021-2, 2022-2, 2023-1, 2026-1)
function gen_rational_asymptote(){
  const p=pick([2,3,4,-2,-3]),q=pick([2,3,4,-1,-2]);
  const k=pick([1,2,-1]);
  const t=pick([1,2,3]);
  if(t===1){
    // y=k/(x-a)+b 형태, 점근선 x=a, y=b → a+b 또는 a-b
    const op=pick(['a+b','a-b']);
    const ans=op==='a+b'?p+q:p-q;
    const kStr=k===1?'':k===-1?'−':String(k);
    const pStr=p>0?`x−${p}`:`x+${-p}`;
    const qStr=q>=0?`+${q}`:String(q);
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2,p,q].filter(w=>w!==ans).slice(0,3).map(String));
    return{topic:'유리함수 점근선',q:`유리함수 y=${kStr}1/(${pStr})${qStr}의 그래프의 점근선이 x=a, y=b일 때, ${op}의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
  }
  if(t===2){
    // y=1/(x-a)+b가 y=1/x 이동 → a 구하기
    const aV=pick([2,3,4,-2,-3]),bV=pick([3,4,-1,-2]);
    const ans=aV;
    const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,bV].filter(w=>w!==ans).slice(0,3).map(String));
    const pStr=aV>0?`x−${aV}`:`x+${-aV}`;
    const bStr=bV>=0?`+${bV}`:String(bV);
    return{topic:'유리함수 점근선',q:`유리함수 y=1/(${pStr})${bStr}의 그래프의 점근선이 x=${aV}, y=${bV}일 때, 상수 a의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
  }
  // y=k/(x-a)+b가 y=k/x 이동 → a+b
  const aV=pick([1,2,3,-1,-2]),bV=pick([2,3,4,-1,-2]);
  const ans=aV+bV;
  const kStr=Math.abs(k)===1?'':String(Math.abs(k));
  const sign=k<0?'−':'';
  const pStr=aV>0?`x−${aV}`:`x+${-aV}`;
  const bStr=bV>=0?`+${bV}`:String(bV);
  const{choices,answer}=makeChoices(String(ans),[ans+1,ans-1,ans+2].filter(w=>w!==ans).map(String));
  return{topic:'유리함수 평행이동',q:`유리함수 y=${sign}${kStr||''}1/(${pStr})${bStr}의 그래프는 y=${sign}${kStr||''}1/x의 그래프를 x축 방향으로 a만큼, y축 방향으로 b만큼 평행이동한 것이다. 두 상수 a, b에 대하여 a+b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
}

// 4-11. 무리함수 평행이동 a+b  (기출 Q18 패턴B: 2021-1, 2022-1, 2023-2, 2024-2, 2025-2)
function gen_radical_translate(){
  const a=pick([1,2,3,4]),b=pick([1,2,3,4,-1,-2]);
  const t=pick([1,2,3]);
  if(t===1){
    // y=√(x-a)+b는 y=√x를 x방향 a, y방향 b 이동 → a+b
    const ans=a+b;
    const bStr=b>=0?`+${b}`:String(b);
    const ws=[ans+1,ans-1,a,b,a-b].filter(w=>w!==ans).slice(0,3).map(String);
    const{choices,answer}=makeChoices(String(ans),ws);
    return{topic:'무리함수 평행이동',q:`무리함수 y=√(x−${a})${bStr}의 그래프는 y=√x의 그래프를 x축의 방향으로 a만큼, y축의 방향으로 b만큼 평행이동한 것이다. a+b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
  }
  if(t===2){
    // a-b 묻기
    const ans2=a-b;
    const bStr2=b>=0?`+${b}`:String(b);
    const{choices,answer}=makeChoices(String(ans2),[ans2+1,ans2-1,ans2+2].filter(w=>w!==ans2).map(String));
    return{topic:'무리함수 평행이동',q:`무리함수 y=√(x−${a})${bStr2}의 그래프는 y=√x의 그래프를 x축의 방향으로 a만큼, y축의 방향으로 b만큼 평행이동한 것이다. 두 상수 a, b에 대하여 a−b의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
  }
  // 상수 a의 값 직접 묻기
  const bStr3=b>=0?`+${b}`:String(b);
  const{choices,answer}=makeChoices(String(a),[a+1,a-1<0?a+2:a-1,a+2].filter(w=>w!==a).map(String));
  return{topic:'무리함수 상수',q:`무리함수 y=√(x−a)${bStr3}의 그래프의 시작점이 (${a}, ${b})일 때, 상수 a의 값은?`,choices,answer,meta:{category:'func',type:'집합과 함수',diff:'기초'}};
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
    return{topic:'순열',q:pick(pCtxs)(n,r),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'}};
  }
  const safeCombs=[[4,2],[5,2],[6,2],[4,3],[5,3],[6,3]];
  const[n2,r2]=pick(safeCombs);
  let cnr=1;for(let i=0;i<r2;i++)cnr=Math.round(cnr*(n2-i)/(i+1));
  if(cnr>20)cnr=10; // safety
  const wrongs2=[cnr+2,cnr-2,cnr+4].filter(w=>w>0&&w!==cnr).slice(0,3).map(String);
  const{choices,answer}=makeChoices(String(cnr),wrongs2);
  return{topic:'조합',q:pick(cCtxs)(n2,r2),choices,answer,meta:{category:'stat',type:'확률과 통계',diff:'기초'}};
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
    [36,'2²×3²'],[45,'3²×5'],[54,'2×3³'],[84,'2²×3×7'],
    [90,'2×3²×5'],[100,'2²×5²']
  ];
  const[n,correct]=pick(cases);
  const wrongs=shuffle(['2×3×5','2²×3×5','2×3²×7','2³×5²','3²×5²']).filter(v=>v!==correct).slice(0,3);
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'소인수분해',q:`${n}을 소인수분해한 결과로 옳은 것은?`,choices,answer,meta:middleMeta('mid_num','수와 연산')};
}
function genMidNumber(){
  const nums=shuffle([randInt(-7,-2),-1,0,randInt(1,5),randInt(6,10)]).slice(0,4);
  const sorted=[...nums].sort((a,b)=>a-b),pos=randInt(1,4),correct=String(sorted[pos-1]);
  const{choices,answer}=makeChoices(correct,nums.filter(v=>String(v)!==correct).map(String));
  return{topic:'수의 대소',q:`${nums.join(', ')}을 작은 수부터 차례대로 나열할 때, ${['첫','둘','셋','넷'][pos-1]}째 수는?`,choices,answer,meta:middleMeta('mid_num','수와 연산')};
}
function genMidRepeating(){
  const n=randInt(1,8),correct=`${n}/9`;
  const{choices,answer}=makeChoices(correct,[`${Math.max(1,n-1)}/9`,`${n}/10`,`${Math.min(8,n+1)}/9`]);
  return{topic:'순환소수',q:`순환소수 0.${n}${n}${n}…을 기약분수로 나타낸 것은?`,choices,answer,meta:middleMeta('mid_num','수와 연산')};
}
function genMidExponent(){
  const a=randInt(2,4),b=randInt(2,5),c=randInt(1,Math.min(3,a+b-1)),ans=a+b-c;
  const{choices,answer}=makeChoices(`x${ans===1?'':`^${ans}`}`,[ans-1,ans+1,a*b].filter(v=>v>0&&v!==ans).map(v=>`x${v===1?'':`^${v}`}`));
  return{topic:'지수법칙',q:`x^${a} × x^${b} ÷ x^${c}을 간단히 한 것은? (단, x≠0)`,choices,answer,meta:middleMeta('mid_num','수와 연산')};
}
function genMidSubstitute(){
  const a=randInt(-3,5),m=randInt(2,5),b=randInt(-4,5),ans=m*a+b;
  const bS=b>=0?`+${b}`:String(b);
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+2,ans+m].map(String));
  return{topic:'식의 값',q:`a=${a}일 때, ${m}a${bS}의 값은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidWordExpr(){
  const price=pick([300,500,700,1200,2000]),base=pick([0,100,200]);
  const correct=base?`${price}x+${base}`:`${price}x`;
  const q=base?`무게가 ${base}g인 빈 상자에 ${price}g인 물건 x개를 넣었을 때 전체 무게를 식으로 나타낸 것은?`:`한 개에 ${price}원인 물건 x개의 가격을 식으로 나타낸 것은?`;
  const{choices,answer}=makeChoices(correct,[`${price}+x`,`${price}-x`,`${price}÷x`]);
  return{topic:'문자를 사용한 식',q,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidLinearEq(){
  const x=randInt(1,8),a=randInt(2,5),c=randInt(1,a-1),b=randInt(-5,5),d=(a-c)*x+b;
  const bS=b>=0?`+${b}`:String(b),dS=d>=0?`+${d}`:String(d);
  const{choices,answer}=makeChoices(String(x),[x-1,x+1,x+2].filter(v=>v>=0).map(String));
  return{topic:'일차방정식',q:`일차방정식 ${a}x${bS}=${c}x${dS}의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidSystem(){
  const x=randInt(1,5),y=randInt(1,5),s=x+y,d=x-y,correct=`x=${x}, y=${y}`;
  const wrongs=[`x=${y}, y=${x}`,`x=${x+1}, y=${Math.max(0,y-1)}`,`x=${Math.max(0,x-1)}, y=${y+1}`];
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'연립방정식',q:`연립방정식 { x+y=${s}, x−y=${d} }의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidInequality(){
  const a=randInt(2,6),x=randInt(1,7),b=a*x,correct=`x≥${x}`;
  const{choices,answer}=makeChoices(correct,[`x>${x}`,`x≤${x}`,`x<${x}`]);
  return{topic:'일차부등식',q:`일차부등식 ${a}x≥${b}의 해는?`,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidRadical(){
  const r=pick([2,3,5]),a=randInt(2,6),b=randInt(1,a-1),op=pick(['+','−']);
  const ans=op==='+'?a+b:a-b,correct=`${ans===1?'':ans}√${r}`;
  const{choices,answer}=makeChoices(correct,[`${a+b+1}√${r}`,`${Math.max(1,ans-1)}√${r}`,`${ans}√${r+1}`]);
  return{topic:'근호의 계산',q:`${a}√${r} ${op} ${b}√${r}을 간단히 한 것은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidQuadraticEq(){
  const r1=randInt(1,4),r2=randInt(5,8),known=pick([r1,r2]),ans=known===r1?r2:r1;
  const{choices,answer}=makeChoices(String(ans),[ans-1,ans+1,ans+2].filter(v=>v>0).map(String));
  return{topic:'이차방정식',q:`이차방정식 (x−${r1})(x−${r2})=0의 한 근이 ${known}이다. 다른 한 근은?`,choices,answer,meta:middleMeta('mid_alg','문자와 식')};
}
function genMidLinearFunc(){
  const a=pick([-3,-2,-1,1,2,3]),b=randInt(-4,5),ask=pick(['value','intercept']);
  if(ask==='intercept'){
    const{choices,answer}=makeChoices(String(b),[b-1,b+1,a].map(String));
    return{topic:'일차함수 y절편',q:`일차함수 y=${a}x${b>=0?`+${b}`:b}의 y절편은?`,choices,answer,meta:middleMeta('mid_func','함수')};
  }
  const x=randInt(-2,4),ans=a*x+b;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+1,ans+2].map(String));
  return{topic:'일차함수',q:`함수 f(x)=${a}x${b>=0?`+${b}`:b}일 때, f(${x})의 값은?`,choices,answer,meta:middleMeta('mid_func','함수')};
}
function genMidQuadraticDesc(){
  const a=pick([-1,1]),p=randInt(-2,2),q=randInt(-3,3);
  const eq=`y=${a===1?'':a===-1?'−':a}(x${p===0?'':p>0?`−${p}`:`+${-p}`})²${q===0?'':q>0?`+${q}`:q}`;
  const correct=`꼭짓점은 (${p}, ${q})이다.`;
  const wrongs=[`꼭짓점은 (${-p}, ${q})이다.`,`축은 x=${-p}이다.`,a>0?'위로 볼록하다.':'아래로 볼록하다.'];
  const{choices,answer}=makeChoices(correct,wrongs);
  return{topic:'이차함수 그래프',q:`이차함수 ${eq}의 그래프에 대한 설명으로 옳은 것은?`,choices,answer,graph:{type:'quadratic',a,p,q,ds:p-2,de:p+2},meta:middleMeta('mid_func','함수')};
}
function genMidIsosceles(){
  const top=pick([40,60,80,100]),ans=(180-top)/2;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,top].filter(v=>v>0&&v<180).map(v=>`${v}°`));
  return{topic:'이등변삼각형',q:`AB=AC인 이등변삼각형 ABC에서 ∠A=${top}°일 때, ∠B의 크기는?`,choices,answer,meta:middleMeta('mid_geo','기하')};
}
function genMidSimilarity(){
  const scale=pick([2,3]),small=randInt(2,6),ans=small*scale;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+2,small+scale].filter(v=>v>0).map(String));
  return{topic:'닮음',q:`서로 닮은 두 삼각형의 닮음비가 1:${scale}이다. 작은 삼각형의 한 변이 ${small}cm일 때 대응하는 큰 삼각형의 변의 길이는?`,choices,answer,meta:middleMeta('mid_geo','기하')};
}
function genMidTrig(){
  const tri=pick([[3,4,5],[5,12,13],[8,15,17]]),[h,b,hyp]=tri,kind=pick(['sin','cos','tan']);
  const correct=kind==='sin'?`${h}/${hyp}`:kind==='cos'?`${b}/${hyp}`:`${h}/${b}`;
  const{choices,answer}=makeChoices(correct,[`${b}/${hyp}`,`${h}/${b}`,`${hyp}/${b}`].filter(v=>v!==correct));
  return{topic:'삼각비',q:`직각삼각형에서 높이=${h}, 밑변=${b}, 빗변=${hyp}일 때, ${kind} θ의 값은?`,choices,answer,meta:middleMeta('mid_geo','기하')};
}
function genMidCircleAngle(){
  const ins=pick([30,35,40,45,50]),ask=pick(['center','same']);
  const ans=ask==='center'?ins*2:ins;
  const q=ask==='center'?`원에서 같은 호 AB를 보는 원주각이 ${ins}°일 때 중심각의 크기는?`:`원 위의 두 점 C, D가 같은 호 AB를 볼 때, ∠ACB=${ins}°이면 ∠ADB의 크기는?`;
  const{choices,answer}=makeChoices(`${ans}°`,[ans-10,ans+10,ins*2].filter(v=>v!==ans&&v>0).map(v=>`${v}°`));
  return{topic:ask==='center'?'원주각과 중심각':'같은 호의 원주각',q,choices,answer,meta:middleMeta('mid_geo','기하')};
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
  return{topic:'확률',q:`모양과 크기가 같은 공 ${total}개 중 빨간 공이 ${fav}개이다. 한 개를 꺼낼 때 빨간 공이 나올 확률은?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계')};
}
function genMidCounting(){
  const a=randInt(2,5),b=randInt(2,4),ans=a*b;
  const{choices,answer}=makeChoices(String(ans),[a+b,ans-1,ans+2].filter(v=>v!==ans).map(String));
  return{topic:'경우의 수',q:`윗옷 ${a}벌과 바지 ${b}벌 중에서 각각 하나씩 골라 입는 경우의 수는?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계')};
}
function genMidRepresentative(){
  const kind=pick(['평균','중앙값','최빈값']);
  let data,ans;
  if(kind==='평균'){const m=randInt(4,8);data=[m-2,m,m+1,m+1];ans=m;}
  else if(kind==='중앙값'){data=shuffle([2,4,5,7,9]);ans=5;}
  else{data=shuffle([3,5,5,5,7,8]);ans=5;}
  const{choices,answer}=makeChoices(String(ans),[ans-1,ans+1,ans+2].map(String));
  return{topic:kind,q:`자료 ${data.join(', ')}의 ${kind}은?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계')};
}
function genMidFrequency(){
  const rows=[{label:'0 이상~10 미만',n:3},{label:'10 이상~20 미만',n:7},{label:'20 이상~30 미만',n:6},{label:'30 이상~40 미만',n:4}];
  const ans=rows[2].n+rows[3].n;
  const{choices,answer}=makeChoices(String(ans),[ans-2,ans+1,ans+2].map(String));
  return{topic:'도수분포표',q:`통학 시간별 학생 수가 0~10분 3명, 10~20분 7명, 20~30분 6명, 30~40분 4명일 때, 20분 이상인 학생 수는?`,choices,answer,meta:middleMeta('mid_stat','확률과 통계')};
}
var MID_DOMAIN_GENS={
  '수와 연산':()=>weightedGen([[genMidPrime,4],[genMidNumber,3],[genMidRepeating,3],[genMidExponent,3]]),
  '문자와 식':()=>weightedGen([[genMidLinearEq,4],[genMidSystem,4],[genMidInequality,3],[genMidSubstitute,3],[genMidWordExpr,3],[genMidRadical,4],[genMidQuadraticEq,4]]),
  '함수':()=>weightedGen([[genMidLinearFunc,5],[genMidQuadraticDesc,5]]),
  '기하':()=>weightedGen([[genMidIsosceles,4],[genMidSimilarity,5],[genMidTrig,5],[genMidCircleAngle,5]]),
  '확률과 통계':()=>weightedGen([[genMidProbability,5],[genMidCounting,4],[genMidRepresentative,5],[genMidFrequency,3]])
};
function genMiddleMock(domain){
  const key=domain||pick(Object.keys(MID_DOMAIN_GENS));
  return MID_DOMAIN_GENS[key]();
}

/* ===== SVG BASE COMPONENTS ===== */
