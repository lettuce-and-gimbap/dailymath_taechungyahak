function Grid({W,H,SC,cx,cy}){
  // cx/cy: 원점의 픽셀 위치 (팬 이동 반영됨), 범위 ±12까지 확장
  const rX=Math.min(12,Math.ceil(Math.max(cx,W-cx)/SC)+1);
  const rY=Math.min(12,Math.ceil(Math.max(cy,H-cy)/SC)+1);
  const txs=Array.from({length:rX*2+1},(_,i)=>i-rX);
  const tys=Array.from({length:rY*2+1},(_,i)=>i-rY);
  return(<g>
    {txs.map(n=>{const px=cx+n*SC;if(px<-2||px>W+2)return null;return(<g key={'x'+n}>
      <line x1={px} y1={0} x2={px} y2={H} stroke={n===0?'#0f172a':'#e2e8f0'} strokeWidth={n===0?3:0.9}/>
      {n!==0&&px>14&&px<W-6&&<text x={px} y={Math.max(16,Math.min(H-4,cy+18))} textAnchor="middle" fontSize={17} fill="#475569" fontWeight="700">{n}</text>}
    </g>);})}
    {tys.map(n=>{const py=cy-n*SC;if(py<-2||py>H+2)return null;return(<g key={'y'+n}>
      <line x1={0} y1={py} x2={W} y2={py} stroke={n===0?'#0f172a':'#e2e8f0'} strokeWidth={n===0?3:0.9}/>
      {n!==0&&py>6&&py<H-6&&<text x={Math.max(16,Math.min(W-6,cx-10))} y={py+4} textAnchor="end" fontSize={17} fill="#475569" fontWeight="700">{n}</text>}
    </g>);})}
    {cy>=0&&cy<=H&&<polygon points={`${W-2},${cy} ${W-11},${cy-4} ${W-11},${cy+4}`} fill="#0f172a"/>}
    {cx>=0&&cx<=W&&<polygon points={`${cx},2 ${cx-4},11 ${cx+4},11`} fill="#0f172a"/>}
    <text x={W-4} y={Math.max(14,Math.min(H-4,cy+14))} fontSize={14} fill="#0f172a" fontWeight="bold">x</text>
    <text x={Math.max(14,cx+8)} y={13} fontSize={14} fill="#0f172a" fontWeight="bold">y</text>
  </g>);
}

function Dot({sx,sy,color='#ef4444',onDown,cx,cy,label}){
  const showProj = cx!==undefined && cy!==undefined && label!==undefined;
  return(<g style={{cursor:'grab',userSelect:'none'}} onMouseDown={e=>{e.preventDefault();onDown(e)}} onTouchStart={e=>{e.preventDefault();onDown(e)}}>
    {showProj&&<>
      {/* ── 수선 (점 → x축 / 점 → y축) : 굵고 뚜렷하게 ── */}
      {/* x축 방향 수직 수선 */}
      <line x1={sx} y1={sy} x2={sx} y2={cy} stroke={color} strokeWidth={2.5} strokeDasharray="7,4" opacity={0.82}/>
      {/* y축 방향 수평 수선 */}
      <line x1={sx} y1={sy} x2={cx} y2={sy} stroke={color} strokeWidth={2.5} strokeDasharray="7,4" opacity={0.82}/>
      {/* ── x축의 수선의 발 강조 ── */}
      {/* 발 위치 굵은 눈금 */}
      <line x1={sx} y1={cy-10} x2={sx} y2={cy+10} stroke={color} strokeWidth={4.5}/>
      {/* 발 위치 채운 원 */}
      <circle cx={sx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2}/>
      {/* x 좌표 라벨 */}
      <text x={sx} y={cy+32} textAnchor="middle" fontSize={28} fill={color} fontWeight="900" stroke="white" strokeWidth="4" paintOrder="stroke">{label[0]}</text>
      {/* ── y축의 수선의 발 강조 ── */}
      {/* 발 위치 굵은 눈금 */}
      <line x1={cx-10} y1={sy} x2={cx+10} y2={sy} stroke={color} strokeWidth={4.5}/>
      {/* 발 위치 채운 원 */}
      <circle cx={cx} cy={sy} r={6} fill={color} stroke="white" strokeWidth={2}/>
      {/* y 좌표 라벨 */}
      <text x={cx-20} y={sy+9} textAnchor="end" fontSize={28} fill={color} fontWeight="900" stroke="white" strokeWidth="4" paintOrder="stroke">{label[1]}</text>
      {/* ── 점 좌표 라벨 ── */}
      <text x={sx+18} y={sy-18} fontSize={26} fill={color} fontWeight="900" stroke="white" strokeWidth="5" paintOrder="stroke">({label[0]}, {label[1]})</text>
    </>}
    <circle cx={sx} cy={sy} r={26} fill={color} opacity={0.12}/>
    <circle cx={sx} cy={sy} r={14} fill={color} stroke="white" strokeWidth={3.5}/>
  </g>);
}


function VF({n,d}){return(<span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',lineHeight:1.05,fontSize:'0.78em',verticalAlign:'middle',margin:'0 1px'}}><span style={{borderBottom:'1.5px solid currentColor',padding:'0 3px'}}>{n}</span><span style={{padding:'0 3px'}}>{d}</span></span>)}
function SqR({s='',sz=15}){return(<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',fontSize:sz+'px',lineHeight:1}}><span style={{fontSize:(sz*1.3)+'px',lineHeight:0.85,fontFamily:"Georgia,'Times New Roman',serif",marginRight:'1px',display:'inline-block'}}>√</span><span style={{borderTop:'1.8px solid currentColor',padding:'1px 2px 0',display:'inline-block',lineHeight:1.15,minWidth:'6px'}}>{s}</span></span>)}

/* ===== CUSTOM HOOKS ===== */
function useCanvasSize(){
  /* 📱 시니어 모바일 최적화 v9: 좌표평면 크기 확대 (여백 40→16, 최대너비 500→620) */
  const calc=()=>{const vw=Math.min(window.innerWidth-16,620);const SC=Math.floor(vw/13);return{SC,W:SC*13,H:SC*13}};
  const[sz,setSz]=useState(calc);
  useEffect(()=>{const f=()=>setSz(calc());window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f)},[]);
  return sz;
}
function useDrag(svgRef,sz,onMove){
  const szRef=useRef(sz);szRef.current=sz;const cbRef=useRef(onMove);cbRef.current=onMove;const active=useRef(false);
  const getXY=e=>{if(e.touches?.length>0)return[e.touches[0].clientX,e.touches[0].clientY];if(e.changedTouches?.length>0)return[e.changedTouches[0].clientX,e.changedTouches[0].clientY];return[e.clientX,e.clientY]};
  const getCoords=(ex,ey)=>{if(!svgRef.current)return null;const{SC,W,H,panX=0,panY=0}=szRef.current;const r=svgRef.current.getBoundingClientRect();const cl=v=>Math.max(-12,Math.min(12,Math.round(v)));return[cl((ex-r.left-W/2)/SC+panX),cl((H/2-(ey-r.top))/SC+panY)]};
  const dn=useCallback(e=>{active.current=true;const[ex,ey]=getXY(e);const c=getCoords(ex,ey);if(c)cbRef.current(c)},[]);
  const mv=useCallback(e=>{if(!active.current)return;const[ex,ey]=getXY(e);const c=getCoords(ex,ey);if(c)cbRef.current(c)},[]);
  const up=useCallback(()=>{active.current=false},[]);
  return{dn,mv,up};
}
// 배경 길게 누르기(250ms) → 팬 모드: 좌표평면 이동
function usePan(sz){
  const szRef=useRef(sz);szRef.current=sz;
  const st=useRef({timer:null,active:false,sx:0,sy:0,spx:0,spy:0});
  const[panning,setPanning]=useState(false);
  const start=useCallback((ex,ey)=>{const s=st.current;clearTimeout(s.timer);s.sx=ex;s.sy=ey;s.spx=szRef.current.panX||0;s.spy=szRef.current.panY||0;s.active=false;s.timer=setTimeout(()=>{s.active=true;setPanning(true)},250)},[]);
  const move=useCallback((ex,ey)=>{const s=st.current;if(!s.active)return false;const{SC,onPan}=szRef.current;const nx=Math.max(-12,Math.min(12,s.spx-(ex-s.sx)/SC));const ny=Math.max(-12,Math.min(12,s.spy+(ey-s.sy)/SC));onPan?.(nx,ny);return true},[]);
  const end=useCallback(()=>{clearTimeout(st.current.timer);st.current.active=false;setPanning(false)},[]);
  return{panStart:start,panMove:move,panEnd:end,panning};
}

// 두 손가락 핀치로 배율 조절 (중심점 고정 줌)
function usePinch(svgRef,sz){
  const szRef=useRef(sz);szRef.current=sz;
  const st=useRef({active:false,startDist:0,startZoom:1,startPanX:0,startPanY:0,midMX:0,midMY:0});
  const dist2=(t)=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  const start=useCallback((touches)=>{
    if(touches.length<2)return false;
    const r=svgRef.current?.getBoundingClientRect();if(!r)return false;
    const{SC,zoom=1,panX=0,panY=0,W,H}=szRef.current;
    const midPx=(touches[0].clientX+touches[1].clientX)/2-r.left;
    const midPy=(touches[0].clientY+touches[1].clientY)/2-r.top;
    st.current={active:true,startDist:dist2(touches),startZoom:zoom,
      startPanX:panX,startPanY:panY,
      midMX:(midPx-W/2)/SC+panX,  // 핀치 중심점의 수학 좌표 (고정점)
      midMY:(H/2-midPy)/SC+panY};
    return true;
  },[svgRef]);
  const move=useCallback((touches)=>{
    const s=st.current;if(!s.active||touches.length<2)return false;
    const{onZoom}=szRef.current;
    const scale=dist2(touches)/s.startDist;
    const nz=Math.max(0.5,Math.min(3,s.startZoom*scale));
    // 핀치 중심점이 픽셀 위치 유지되도록 pan 보정
    const npx=Math.max(-12,Math.min(12,s.midMX+(s.startPanX-s.midMX)/scale));
    const npy=Math.max(-12,Math.min(12,s.midMY+(s.startPanY-s.midMY)/scale));
    onZoom?.(nz,npx,npy);return true;
  },[]);
  const end=useCallback(()=>{st.current.active=false},[]);
  return{pinchStart:start,pinchMove:move,pinchEnd:end};
}
var SVG_PROPS={style:{touchAction:'none',display:'block'},className:'border-2 border-gray-100 rounded-2xl bg-slate-50 shadow-sm mx-auto'};

/* ===== GEOMETRY MODULES ===== */
function RadicalModule({sz}){
  const{W,H,SC,panX=0,panY=0}=sz;const cx=W/2-panX*SC,cy=H/2+panY*SC;
  const[p,setP]=useState(0),[q,setQ]=useState(0),[a,setA]=useState(1);
  const ref=useRef();
  const{dn,mv,up}=useDrag(ref,sz,([mx,my])=>{setP(mx);setQ(my)});
  const{panStart,panMove,panEnd,panning}=usePan(sz);
  const{pinchStart,pinchMove,pinchEnd}=usePinch(ref,sz);
  const hXY=e=>e.touches?.length>0?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY];
  const hDn=e=>{if(e.touches?.length>=2){up();panEnd();pinchStart(e.touches);return;}const r=ref.current?.getBoundingClientRect();if(!r)return;const[ex,ey]=hXY(e);if(Math.hypot(ex-r.left-(cx+p*SC),ey-r.top-(cy-q*SC))>40)panStart(ex,ey)};
  const hMv=e=>{if(e.touches?.length>=2){pinchMove(e.touches);return;}const[ex,ey]=hXY(e);if(!panMove(ex,ey))mv(e)};
  const hUp=()=>{pinchEnd();panEnd();up()};
  const pts=[];for(let sx=0;sx<=W;sx+=2){const mx=(sx-cx)/SC,inn=mx-p;if(inn<0)continue;const my=a*Math.sqrt(inn)+q;if(Math.abs(my)>13)continue;pts.push(`${sx.toFixed(1)},${(cy-my*SC).toFixed(1)}`)}
  const aStr=a===1?'':a===-1?'−':String(a);const innerStr=p===0?'x':`x${eqSh(p)}`;
  return(<div className="space-y-3">
    <div className="flex flex-wrap gap-3 items-center">
      <label className="flex items-center gap-2 text-base font-bold text-gray-700">계수 a:
        <select value={a} onChange={e=>setA(+e.target.value)} className="border-2 border-blue-300 rounded-xl px-3 py-2 bg-white text-base font-bold">
          {[-3,-2,-1,1,2,3].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <span className="text-sm bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 text-blue-700 font-semibold">🔴 점 드래그 · 배경 길게 누르면 이동</span>
    </div>
    <div className="text-center text-sm text-blue-600 bg-white rounded-xl py-2 px-3 border border-blue-100">
      원점에서 x축 방향으로 <strong>{p}</strong>만큼, y축 방향으로 <strong>{q}</strong>만큼 <strong>평행이동</strong>했어요!
    </div>
    <div className="text-center font-bold text-blue-700 bg-blue-50 rounded-2xl py-3 text-base border border-blue-200">
      y = {aStr}<SqR s={innerStr} sz={16}/>{eqSg(q)} <span className="text-gray-300 mx-2">|</span> 시작점: ({p}, {q})
    </div>
    <svg ref={ref} width={W} height={H} {...SVG_PROPS} style={{...SVG_PROPS.style,cursor:panning?'grabbing':'crosshair'}}
      onMouseDown={hDn} onMouseMove={hMv} onMouseUp={hUp} onMouseLeave={hUp}
      onTouchStart={hDn} onTouchMove={hMv} onTouchEnd={hUp}>
      <Grid W={W} H={H} SC={SC} cx={cx} cy={cy}/>
      {pts.length>1&&<path d={`M ${pts.join(' L ')}`} fill="none" stroke="#3b82f6" strokeWidth={3} strokeLinecap="round"/>}
      <Dot sx={cx+p*SC} sy={cy-q*SC} color="#3b82f6" onDown={dn} cx={cx} cy={cy} label={[p,q]}/>
    </svg>
  </div>);
}
function RationalModule({sz}){
  const{W,H,SC,panX=0,panY=0}=sz;const cx=W/2-panX*SC,cy=H/2+panY*SC;
  const[p,setP]=useState(0),[q,setQ]=useState(0),[k,setK]=useState(1);
  const ref=useRef();
  const{dn,mv,up}=useDrag(ref,sz,([mx,my])=>{setP(mx);setQ(my)});
  const{panStart,panMove,panEnd,panning}=usePan(sz);
  const{pinchStart,pinchMove,pinchEnd}=usePinch(ref,sz);
  const hXY=e=>e.touches?.length>0?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY];
  const hDn=e=>{if(e.touches?.length>=2){up();panEnd();pinchStart(e.touches);return;}const r=ref.current?.getBoundingClientRect();if(!r)return;const[ex,ey]=hXY(e);if(Math.hypot(ex-r.left-(cx+p*SC),ey-r.top-(cy-q*SC))>40)panStart(ex,ey)};
  const hMv=e=>{if(e.touches?.length>=2){pinchMove(e.touches);return;}const[ex,ey]=hXY(e);if(!panMove(ex,ey))mv(e)};
  const hUp=()=>{pinchEnd();panEnd();up()};
  const branch=left=>{const pts=[];for(let mx=left?-13:p+0.04;left?mx<p-0.04:mx<=13;mx+=0.04){const my=k/(mx-p)+q;if(Math.abs(my)>13)continue;pts.push(`${(cx+mx*SC).toFixed(1)},${(cy-my*SC).toFixed(1)}`)}return pts.length>1?`M ${pts.join(' L ')}`:''};
  return(<div className="space-y-3">
    <div className="flex flex-wrap gap-3 items-center">
      <label className="flex items-center gap-2 text-base font-bold text-gray-700">상수 k:
        <select value={k} onChange={e=>setK(+e.target.value)} className="border-2 border-purple-300 rounded-xl px-3 py-2 bg-white text-base font-bold">
          {[-4,-3,-2,-1,1,2,3,4].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      <span className="text-sm bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5 text-purple-700 font-semibold">🟣 점 드래그 · 배경 길게 누르면 이동</span>
    </div>
    <div className="text-center text-sm text-purple-600 bg-white rounded-xl py-2 px-3 border border-purple-100">
      원점에서 x축 방향으로 <strong>{p}</strong>만큼, y축 방향으로 <strong>{q}</strong>만큼 <strong>평행이동</strong>했어요!
    </div>
    <div className="text-center font-bold text-purple-700 bg-purple-50 rounded-2xl py-3 text-base border border-purple-200">
      y = <VF n={k} d={p===0?'x':`x${eqSh(p)}`}/>{eqSg(q)} <span className="text-gray-300 mx-2">|</span> 점근선: x={p}, y={q}
    </div>
    <svg ref={ref} width={W} height={H} {...SVG_PROPS} style={{...SVG_PROPS.style,cursor:panning?'grabbing':'crosshair'}}
      onMouseDown={hDn} onMouseMove={hMv} onMouseUp={hUp} onMouseLeave={hUp}
      onTouchStart={hDn} onTouchMove={hMv} onTouchEnd={hUp}>
      <Grid W={W} H={H} SC={SC} cx={cx} cy={cy}/>
      <line x1={cx+p*SC} y1={0} x2={cx+p*SC} y2={H} stroke="#c084fc" strokeWidth={1.5} strokeDasharray="6,4"/>
      <line x1={0} y1={cy-q*SC} x2={W} y2={cy-q*SC} stroke="#c084fc" strokeWidth={1.5} strokeDasharray="6,4"/>
      <path d={branch(true)} fill="none" stroke="#9333ea" strokeWidth={3} strokeLinecap="round"/>
      <path d={branch(false)} fill="none" stroke="#9333ea" strokeWidth={3} strokeLinecap="round"/>
      <Dot sx={cx+p*SC} sy={cy-q*SC} color="#9333ea" onDown={dn} cx={cx} cy={cy} label={[p,q]}/>
    </svg>
  </div>);
}

function QuadraticModule({sz}){
  const{W,H,SC,panX=0,panY=0}=sz;const cx=W/2-panX*SC,cy=H/2+panY*SC;
  const[p,setP]=useState(0),[q,setQ]=useState(0),[a,setA]=useState(1),[ds,setDs]=useState(-7),[de,setDe]=useState(7);
  const ref=useRef();
  const{dn,mv,up}=useDrag(ref,sz,([mx,my])=>{setP(mx);setQ(my)});
  const{panStart,panMove,panEnd,panning}=usePan(sz);
  const{pinchStart,pinchMove,pinchEnd}=usePinch(ref,sz);
  const hXY=e=>e.touches?.length>0?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY];
  const hDn=e=>{if(e.touches?.length>=2){up();panEnd();pinchStart(e.touches);return;}const r=ref.current?.getBoundingClientRect();if(!r)return;const[ex,ey]=hXY(e);if(Math.hypot(ex-r.left-(cx+p*SC),ey-r.top-(cy-q*SC))>40)panStart(ex,ey)};
  const hMv=e=>{if(e.touches?.length>=2){pinchMove(e.touches);return;}const[ex,ey]=hXY(e);if(!panMove(ex,ey))mv(e)};
  const hUp=()=>{pinchEnd();panEnd();up()};
  
  const ghost=[],dom=[];
  // 1. 그래프 그리기 용도 (화면 표시용)
  for(let sx=0;sx<=W;sx+=2){const mx=(sx-cx)/SC,my=a*(mx-p)**2+q;if(Math.abs(my)<=13)ghost.push(`${sx},${(cy-my*SC).toFixed(1)}`)}
  for(let mx=ds;mx<=de;mx+=0.04){const my=a*(mx-p)**2+q;dom.push(`${(cx+mx*SC).toFixed(1)},${(cy-my*SC).toFixed(1)}`);}
  
  // 2. 정확한 최댓값/최솟값 수학적 계산 (소수점 오차 원천 차단)
  const validY = [a * (ds - p)**2 + q, a * (de - p)**2 + q];
  if (p >= ds && p <= de) validY.push(q);
  const extreme = a > 0 ? Math.min(...validY) : Math.max(...validY);
  
  const aStr=a===-1?'−':a===1?'':String(a);
  
  return(<div className="space-y-3">
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center justify-center">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700">a:
        <select value={a} onChange={e=>setA(+e.target.value)} className="border-2 border-emerald-300 rounded-xl px-2 py-2 bg-white font-bold">
          {[-2,-1,1,2].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
      </label>
      {/* 범위 버튼 한계치를 -6 ~ 6으로 확장 */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
        <span>범위 x:</span>
        <div className="flex items-center gap-1">
          <button onClick={()=>setDs(v=>Math.max(-12,Math.min(de-1,v-1)))} className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">−</button>
          <span className="w-7 text-center">{ds}</span>
          <button onClick={()=>setDs(v=>Math.max(-12,Math.min(de-1,v+1)))} className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">+</button>
        </div>
        <span className="text-gray-400">~</span>
        <div className="flex items-center gap-1">
          <button onClick={()=>setDe(v=>Math.max(ds+1,Math.min(12,v-1)))} className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">−</button>
          <span className="w-7 text-center">{de}</span>
          <button onClick={()=>setDe(v=>Math.max(ds+1,Math.min(12,v+1)))} className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-lg">+</button>
        </div>
      </div>
    </div>
    
    <div className="text-center font-bold text-emerald-700 bg-emerald-50 rounded-2xl py-3 text-sm border border-emerald-200">
      y = {aStr}(x{eqSh(p)})²{eqSg(q)} <span className="text-gray-300 mx-2">|</span> {a>0?'최솟값':'최댓값'}: {Math.round(extreme)} (x∈[{ds},{de}])
    </div>
    
    <svg ref={ref} width={W} height={H} {...SVG_PROPS} style={{...SVG_PROPS.style,cursor:panning?'grabbing':'crosshair'}}
      onMouseDown={hDn} onMouseMove={hMv} onMouseUp={hUp} onMouseLeave={hUp}
      onTouchStart={hDn} onTouchMove={hMv} onTouchEnd={hUp}>
      <Grid W={W} H={H} SC={SC} cx={cx} cy={cy}/>
      {ghost.length>1&&<path d={`M ${ghost.join(' L ')}`} fill="none" stroke="#bbf7d0" strokeWidth={2} strokeDasharray="6,4"/>}
      <line x1={cx+ds*SC} y1={0} x2={cx+ds*SC} y2={H} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4,4"/>
      <line x1={cx+de*SC} y1={0} x2={cx+de*SC} y2={H} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4,4"/>
      {dom.length>1&&<path d={`M ${dom.join(' L ')}`} fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round"/>}
      <Dot sx={cx+p*SC} sy={cy-q*SC} color="#16a34a" onDown={dn} cx={cx} cy={cy} label={[p,q]}/>
      {/* 극점 이외에서 최대/최솟값이 발생하는 경우 강조 표시 */}
      {(()=>{
        const extremeX=a>0?(extreme===a*(ds-p)**2+q?ds:de):(extreme===a*(ds-p)**2+q?ds:de);
        const isVertex=p>=ds&&p<=de&&extreme===q;
        if(isVertex)return null;
        const esx=cx+extremeX*SC,esy=cy-extreme*SC;
        return(<>
          <circle cx={esx} cy={esy} r={14} fill="none" stroke="#ef4444" strokeWidth={3} strokeDasharray="5,3"/>
          <circle cx={esx} cy={esy} r={6} fill="#ef4444" stroke="white" strokeWidth={2}/>
          <text x={esx+14} y={esy-10} fontSize={13} fill="#ef4444" fontWeight="900" stroke="white" strokeWidth="3" paintOrder="stroke">{a>0?'최솟값':'최댓값'}: {Math.round(extreme)}</text>
        </>);
      })()}
    </svg>
  </div>);
}

function DistanceModule({sz}){
  const{W,H,SC,panX=0,panY=0}=sz;const cx=W/2-panX*SC,cy=H/2+panY*SC;
  const[ptX,setPX]=useState(2),[ptY,setPY]=useState(3),[la,setLA]=useState(3),[lb,setLB]=useState(-4),[lc,setLC]=useState(5);
  const ref=useRef();
  const{dn,mv,up}=useDrag(ref,sz,([mx,my])=>{setPX(mx);setPY(my)});
  const{panStart,panMove,panEnd,panning}=usePan(sz);
  const{pinchStart,pinchMove,pinchEnd}=usePinch(ref,sz);
  const hXY=e=>e.touches?.length>0?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY];
  const hDn=e=>{if(e.touches?.length>=2){up();panEnd();pinchStart(e.touches);return;}const r=ref.current?.getBoundingClientRect();if(!r)return;const[ex,ey]=hXY(e);if(Math.hypot(ex-r.left-(cx+ptX*SC),ey-r.top-(cy-ptY*SC))>40)panStart(ex,ey)};
  const hMv=e=>{if(e.touches?.length>=2){pinchMove(e.touches);return;}const[ex,ey]=hXY(e);if(!panMove(ex,ey))mv(e)};
  const hUp=()=>{pinchEnd();panEnd();up()};
  
  const nV=la*ptX+lb*ptY+lc,denSq=la**2+lb**2,dV=Math.sqrt(denSq);
  const fX=dV>0?ptX-la*nV/denSq:ptX,fY=dV>0?ptY-lb*nV/denSq:ptY;
  const distStr=distFracStr(Math.abs(nV),denSq);
  
  const le=[];if(Math.abs(lb)>0.001){[-13,13].forEach(mx=>{const my=-(la*mx+lc)/lb;le.push([cx+mx*SC,cy-my*SC])})}
  else if(Math.abs(la)>0.001){const mx=-lc/la;le.push([cx+mx*SC,0],[cx+mx*SC,H])}
  const sqPerfect=Math.round(Math.sqrt(denSq))**2===denSq;
  
  const Stepper=({label,val,onMinus,onPlus})=>(<div className="flex items-center gap-1.5 bg-white border border-orange-100 rounded-2xl px-2 py-1.5 shadow-sm">
    <span className="text-base font-black text-gray-700 whitespace-nowrap" style={{minWidth:'1.6rem',textAlign:'center'}}>{label} =</span>
    <button onClick={onMinus} className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xl flex-shrink-0">−</button>
    <span className="w-7 text-center text-lg font-black text-gray-800">{val}</span>
    <button onClick={onPlus} className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xl flex-shrink-0">+</button>
  </div>);

  // 시각적 표현을 위한 문자열 생성
  const nStr = `|(${la}×${ptX}) + (${lb<0?`(${lb})`:lb}×${ptY}) + (${lc<0?`(${lc})`:lc})|`;
  const dStr = `√(${la<0?`(${la})`:la}² + ${lb<0?`(${lb})`:lb}²)`;
  const nCalc = Math.abs(nV);
  const dCalc = sqPerfect ? Math.round(Math.sqrt(denSq)) : `√${denSq}`;
  
  // 분자가 0인 경우에도 최종 결과(= 0)가 뜨도록 조건 추가
  const showFinal = (String(nCalc) !== distStr && String(nCalc)+'/'+String(dCalc) !== distStr) || nCalc === 0;

  return(<div className="space-y-3">
    <div className="flex flex-wrap gap-3 items-center justify-center">
      <Stepper label="a" val={la} onMinus={()=>setLA(v=>Math.max(-10,v-1))} onPlus={()=>setLA(v=>Math.min(10,v+1))}/>
      <Stepper label="b" val={lb} onMinus={()=>setLB(v=>Math.max(-10,v-1))} onPlus={()=>setLB(v=>Math.min(10,v+1))}/>
      <Stepper label="c" val={lc} onMinus={()=>setLC(v=>Math.max(-10,v-1))} onPlus={()=>setLC(v=>Math.min(10,v+1))}/>
    </div>
    
    <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-left">
      <div className="font-bold text-gray-800 mb-1">직선: {la}x {lb>=0?`+${lb}`:lb}y {lc>=0?`+${lc}`:lc} = 0, 점: ({ptX}, {ptY})</div>
      <ul className="list-disc pl-4 space-y-0.5">
        <li><span className="font-bold">분자</span>: 직선 식의 x, y 자리에 점의 좌표(x, y)를 대입하고 계산한 값의 절댓값</li>
        <li><span className="font-bold">분모</span>: √((x 앞의 숫자)² + (y 앞의 숫자)²)</li>
      </ul>
    </div>

    <div className="flex items-center justify-center font-bold text-orange-700 bg-orange-50 rounded-2xl py-3 text-sm border border-orange-200">
      <span className="mr-2">거리 =</span>
      <VF n={nStr} d={dStr}/>
      <span className="mx-2">=</span>
      <VF n={nCalc} d={dCalc}/>
      {showFinal && <><span className="mx-2">=</span><span className="text-base text-red-600">{distStr}</span></>}
    </div>
    
    <svg ref={ref} width={W} height={H} {...SVG_PROPS} style={{...SVG_PROPS.style,cursor:panning?'grabbing':'crosshair'}}
      onMouseDown={hDn} onMouseMove={hMv} onMouseUp={hUp} onMouseLeave={hUp}
      onTouchStart={hDn} onTouchMove={hMv} onTouchEnd={hUp}>
      <Grid W={W} H={H} SC={SC} cx={cx} cy={cy}/>
      {le.length>=2&&<line x1={le[0][0]} y1={le[0][1]} x2={le[1][0]} y2={le[1][1]} stroke="#ea580c" strokeWidth={2.5}/>}
      <line x1={cx+ptX*SC} y1={cy-ptY*SC} x2={cx+fX*SC} y2={cy-fY*SC} stroke="#fb923c" strokeWidth={1.8} strokeDasharray="4,3"/>
      <circle cx={cx+fX*SC} cy={cy-fY*SC} r={6} fill="#fb923c" stroke="white" strokeWidth={2}/>
      <Dot sx={cx+ptX*SC} sy={cy-ptY*SC} color="#dc2626" onDown={dn} cx={cx} cy={cy} label={[ptX,ptY]}/>
      <text x={8} y={H-8} fontSize={11} fill="#64748b">거리 = {distStr}</text>
    </svg>
  </div>);
}

function CircleModule({sz}){
  const{W,H,SC,panX=0,panY=0}=sz;const cx=W/2-panX*SC,cy=H/2+panY*SC;
  const[h,setH]=useState(0),[k,setK]=useState(0),[r,setR]=useState(3);
  const ref=useRef();
  const{dn,mv,up}=useDrag(ref,sz,([mx,my])=>{setH(mx);setK(my)});
  const{panStart,panMove,panEnd,panning}=usePan(sz);
  const{pinchStart,pinchMove,pinchEnd}=usePinch(ref,sz);
  const hXY=e=>e.touches?.length>0?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY];
  const hDn=e=>{if(e.touches?.length>=2){up();panEnd();pinchStart(e.touches);return;}const r2=ref.current?.getBoundingClientRect();if(!r2)return;const[ex,ey]=hXY(e);if(Math.hypot(ex-r2.left-(cx+h*SC),ey-r2.top-(cy-k*SC))>40)panStart(ex,ey)};
  const hMv=e=>{if(e.touches?.length>=2){pinchMove(e.touches);return;}const[ex,ey]=hXY(e);if(!panMove(ex,ey))mv(e)};
  const hUp=()=>{pinchEnd();panEnd();up()};
  return(<div className="space-y-3">
    <div className="flex flex-wrap gap-3 items-center">
      <label className="flex items-center gap-2 text-base font-bold text-gray-700">반지름 r:
        <input type="range" min={1} max={6} value={r} onChange={e=>setR(+e.target.value)} className="w-28 accent-teal-500"/>
        <span className="font-bold text-teal-600 w-5">{r}</span>
      </label>
      <span className="text-sm bg-teal-50 border border-teal-200 rounded-full px-3 py-1.5 text-teal-700 font-semibold">🟢 중심점 드래그 · 배경 길게 누르면 이동</span>
    </div>
    <div className="text-center font-bold text-teal-700 bg-teal-50 rounded-2xl py-3 text-sm border border-teal-200">
      (x{eqSh(h)})² + (y{eqSh(k)})² = {r}² <span className="text-gray-300 mx-2">|</span> 중심: ({h},{k}), r={r}
    </div>
    <svg ref={ref} width={W} height={H} {...SVG_PROPS} style={{...SVG_PROPS.style,cursor:panning?'grabbing':'crosshair'}}
      onMouseDown={hDn} onMouseMove={hMv} onMouseUp={hUp} onMouseLeave={hUp}
      onTouchStart={hDn} onTouchMove={hMv} onTouchEnd={hUp}>
      <Grid W={W} H={H} SC={SC} cx={cx} cy={cy}/>
      <circle cx={cx+h*SC} cy={cy-k*SC} r={r*SC} fill="rgba(20,184,166,0.1)" stroke="#0d9488" strokeWidth={2.5}/>
      <line x1={cx+h*SC} y1={cy-k*SC} x2={cx+(h+r)*SC} y2={cy-k*SC} stroke="#0d9488" strokeWidth={1.5} strokeDasharray="5,3"/>
      <text x={(cx+h*SC+cx+(h+r)*SC)/2} y={cy-k*SC-7} textAnchor="middle" fontSize={11} fill="#0d9488" fontWeight="bold">r={r}</text>
      <Dot sx={cx+h*SC} sy={cy-k*SC} color="#0d9488" onDown={dn} cx={cx} cy={cy} label={[h,k]}/>
    </svg>
  </div>);
}
function SymmetryModule({sz}){
  const{W,H,SC,panX=0,panY=0}=sz;const cx=W/2-panX*SC,cy=H/2+panY*SC;
  const[px,setPX]=useState(3),[py,setPY]=useState(2),[type,setType]=useState(null);
  const ref=useRef();
  const{dn,mv,up}=useDrag(ref,sz,([mx,my])=>{setPX(mx);setPY(my)});
  const{panStart,panMove,panEnd,panning}=usePan(sz);
  const{pinchStart,pinchMove,pinchEnd}=usePinch(ref,sz);
  const hXY=e=>e.touches?.length>0?[e.touches[0].clientX,e.touches[0].clientY]:[e.clientX,e.clientY];
  const hDn=e=>{if(e.touches?.length>=2){up();panEnd();pinchStart(e.touches);return;}const r=ref.current?.getBoundingClientRect();if(!r)return;const[ex,ey]=hXY(e);if(Math.hypot(ex-r.left-(cx+px*SC),ey-r.top-(cy-py*SC))>40)panStart(ex,ey)};
  const hMv=e=>{if(e.touches?.length>=2){pinchMove(e.touches);return;}const[ex,ey]=hXY(e);if(!panMove(ex,ey))mv(e)};
  const hUp=()=>{pinchEnd();panEnd();up()};
  
  const activeSym = SYM_LIST.find(s=>s.k===type);
  const[sx,sy] = activeSym ? activeSym.fn(px,py) : [px,py];
  
  const symLine = type==='x축' ? <line x1={0} y1={cy} x2={W} y2={cy} stroke="#f59e0b" strokeWidth={3} strokeDasharray="8,5"/> 
    : type==='y축' ? <line x1={cx} y1={0} x2={cx} y2={H} stroke="#f59e0b" strokeWidth={3} strokeDasharray="8,5"/> 
    : type==='y=x' ? <line x1={cx-12*SC} y1={cy+12*SC} x2={cx+12*SC} y2={cy-12*SC} stroke="#f59e0b" strokeWidth={3} strokeDasharray="8,5"/> 
    : type==='y=-x' ? <line x1={cx-12*SC} y1={cy-12*SC} x2={cx+12*SC} y2={cy+12*SC} stroke="#f59e0b" strokeWidth={3} strokeDasharray="8,5"/> 
    : null;

  return(<div className="space-y-3">
    <div className="flex flex-wrap gap-2 justify-center">
      {SYM_LIST.map(s=>(
        <button 
          key={s.k} 
          // 현재 켜진 버튼을 한 번 더 누르면 null이 되어 꺼지게(토글) 만듭니다.
          onClick={()=>setType(prev => prev === s.k ? null : s.k)} 
          className={`text-sm px-3 py-2 rounded-full border-2 font-bold transition-all ${type===s.k?'bg-amber-500 text-white border-amber-500':'bg-white text-amber-600 border-amber-300'}`}>
          {s.k} 대칭
        </button>
      ))}
    </div>
    
    <div className="text-center font-bold text-amber-700 bg-amber-50 rounded-2xl py-3 text-sm border border-amber-200">
      {/* 켜져 있으면 결과를 보여주고, 꺼져 있으면 유도 문구를 보여줍니다. */}
      {type ? `(${px}, ${py}) → ${type} 대칭 → (${sx}, ${sy})` : `점이 어디로 이동할지 상상해보고 버튼을 눌러보세요!`}
    </div>
    
    <svg ref={ref} width={W} height={H} {...SVG_PROPS} style={{...SVG_PROPS.style,cursor:panning?'grabbing':'crosshair'}}
      onMouseDown={hDn} onMouseMove={hMv} onMouseUp={hUp} onMouseLeave={hUp}
      onTouchStart={hDn} onTouchMove={hMv} onTouchEnd={hUp}>
      <Grid W={W} H={H} SC={SC} cx={cx} cy={cy}/>
      {symLine}
      
      {/* 버튼이 눌려있을 때(type이 있을 때)만 이동 후의 점과 점선을 그려줍니다. */}
      {type && (
        <>
          {/* 대칭이동 점선 (선 색상을 짙게(#94a3b8) 하고 굵기를 3으로 키움) */}
          <line x1={cx+px*SC} y1={cy-py*SC} x2={cx+sx*SC} y2={cy-sy*SC} stroke="#94a3b8" strokeWidth={3} strokeDasharray="6,4"/>
          
          <circle cx={cx+sx*SC} cy={cy-sy*SC} r={10} fill="#2563eb" stroke="white" strokeWidth={2.5}/>
          <text x={cx+sx*SC+14} y={cy-sy*SC+4} fontSize={16} fill="#2563eb" fontWeight="900" stroke="white" strokeWidth="3" paintOrder="stroke">({sx},{sy})</text>
        </>
      )}
      
      {/* 이동 전 원본 점 (항상 표시) */}
      <Dot sx={cx+px*SC} sy={cy-py*SC} color="#dc2626" onDown={dn} cx={cx} cy={cy} label={[px,py]}/>
    </svg>
  </div>);
}

/* ===== MINI GRAPH (for quiz) ===== */
var MINI_S=80,MINI_SC=6;

function MiniGrid({S,SC}){
  const cx=S/2,cy=S/2;
  // 🌟 수정 1: 눈금을 -3~3에서 -6~6으로 확장하여, 모든 영역의 그래프가 화면에 잘리지 않도록 합니다.
  return(<g>{Array.from({length:13},(_,i)=>i-6).map(n=>(<g key={n}>
    <line x1={cx+n*SC} y1={0} x2={cx+n*SC} y2={S} stroke={n===0?'#555':'#f0f0f0'} strokeWidth={n===0?1.5:0.6}/>
    <line x1={0} y1={cy+n*SC} x2={S} y2={cy+n*SC} stroke={n===0?'#555':'#f0f0f0'} strokeWidth={n===0?1.5:0.6}/>
    </g>))}
  <polygon points={`${S-1},${cy} ${S-7},${cy-3} ${S-7},${cy+3}`} fill="#555"/>
  <polygon points={`${cx},1 ${cx-3},7 ${cx+3},7`} fill="#555"/></g>)
}

function MiniGraph({data}){
  const S=MINI_S,SC=MINI_SC,cx=S/2,cy=S/2;let content=null;
  if(data){const{type}=data;
    // 🌟 수정 1 (연장): 모든 그래프들의 절단 임계값(Math.abs(y) > 5)을 6으로 넉넉하게 변경했습니다.
    if(type==='radical'){const{p,q,a}=data;const pts=[];for(let sx=0;sx<=S;sx++){const mx=(sx-cx)/SC,inn=mx-p;if(inn<0)continue;const my=a*Math.sqrt(inn)+q;if(Math.abs(my)>6)continue;pts.push(`${sx},${(cy-my*SC).toFixed(1)}`)}content=pts.length>1?<path d={`M ${pts.join(' L ')}`} fill="none" stroke="#3b82f6" strokeWidth={1.8}/>:null}
    else if(type==='rational'){const{p,q,k}=data;const br=left=>{const pts=[];for(let mx=left?-6:p+0.1;left?mx<p-0.1:mx<=6;mx+=0.08){const my=k/(mx-p)+q;if(Math.abs(my)>6)continue;pts.push(`${(cx+mx*SC).toFixed(1)},${(cy-my*SC).toFixed(1)}`)}return pts.length>1?<path d={`M ${pts.join(' L ')}`} fill="none" stroke="#9333ea" strokeWidth={1.8}/>:null};content=<>{br(true)}{br(false)}</>}
    else if(type==='quadratic'){const{p,q,a,ds=-6,de=6}=data;const pts=[];for(let mx=Math.max(-6,ds);mx<=Math.min(6,de);mx+=0.08){const my=a*(mx-p)**2+q;if(Math.abs(my)>6)continue;pts.push(`${(cx+mx*SC).toFixed(1)},${(cy-my*SC).toFixed(1)}`)}content=pts.length>1?<path d={`M ${pts.join(' L ')}`} fill="none" stroke="#16a34a" strokeWidth={1.8}/>:null}
    else if(type==='distance'){const{ptX,ptY,la,lb,lc}=data;const le=[];if(Math.abs(lb)>0.001){[-6,6].forEach(mx=>{const my=-(la*mx+lc)/lb;le.push([cx+mx*SC,cy-my*SC])})}const nV=la*ptX+lb*ptY+lc,d2=la**2+lb**2;const fX=d2>0?ptX-la*nV/d2:ptX,fY=d2>0?ptY-lb*nV/d2:ptY;content=<>{le.length>=2&&<line x1={le[0][0]} y1={le[0][1]} x2={le[1][0]} y2={le[1][1]} stroke="#ea580c" strokeWidth={1.8}/>}<line x1={cx+ptX*SC} y1={cy-ptY*SC} x2={cx+fX*SC} y2={cy-fY*SC} stroke="#fb923c" strokeWidth={1.2} strokeDasharray="3,2"/><circle cx={cx+ptX*SC} cy={cy-ptY*SC} r={4} fill="#dc2626"/></>}
    else if(type==='circle'){const{h,k,r}=data;content=<circle cx={cx+h*SC} cy={cy-k*SC} r={r*SC} fill="rgba(20,184,166,0.15)" stroke="#0d9488" strokeWidth={1.8}/>}
    else if(type==='symmetry'){
      // 🌟 수정 2: 대칭이동 시 축(주황 점선)과 정답 점(파란 점)을 지우고 오직 원본(빨간 점) 1개만 표시합니다.
      const{px,py}=data;
      content=<circle cx={cx+px*SC} cy={cy-py*SC} r={4} fill="#dc2626"/>;
    }
  }
  return(<svg width={S} height={S} style={{flexShrink:0}}><MiniGrid S={S} SC={MINI_SC}/>{content}</svg>);
}


/* ===== CONCEPTS DATA ===== */
var CONCEPTS=[
  {icon:'🌿',title:'무리함수 (루트 함수)',color:'blue',simple:'√(루트)는 두 번 곱해서 나온 수를 거꾸로 찾아요.',detail:['√9=3 ➜ 3×3=9!','√4=2 ➜ 2×2=4!','y=√x: (0,0)에서 시작, 오른쪽 위로 퍼지는 곡선','x−p: 오른쪽 p이동 / +q: 위로 q이동'],formula:'y = a√(x−p) + q',tip:'꼭짓점(시작점): (p, q) | x ≥ p 범위에서만 그래프가 그려짐',mem:'💡 p만큼 오른쪽, q만큼 위로 이동!'},
  {icon:'🔀',title:'유리함수 (분수 함수)',color:'purple',simple:'분모에 x가 있는 함수. 분모가 0이 되면 계산 불가!',detail:['y=1/x: x=0이면 1÷0 → 불가능!','점근선 = 그래프가 절대 닿지 않는 선 (보이지 않는 벽!)','y=k/(x−p)+q: x=p, y=q에 절대 닿지 않음','두 곡선이 대각선으로 마주보는 쌍곡선 모양'],formula:'y = k/(x−p) + q',tip:'세로 점근선: x=p | 가로 점근선: y=q',mem:'💡 점근선이 울타리! 그래프는 그 안에서 무한히 뻗어요'},
  {icon:'🏹',title:'이차함수 (포물선)',color:'green',simple:'공을 던졌을 때 날아가는 포물선 곡선이에요.',detail:['y=x²: 꼭짓점(0,0), U모양(아래 볼록)','y=−x²: 꼭짓점(0,0), ∩모양(위 볼록)','y=a(x−p)²+q: 꼭짓점이 (p,q)인 포물선','구간이 정해지면 최댓값/최솟값을 구함'],formula:'y = a(x−p)² + q',tip:'a>0: U(최솟값) | a<0: ∩(최댓값)',mem:'💡 a 양수면 웃는 얼굴😊, 음수면 우는 얼굴😢'},
  {icon:'📏',title:'점과 직선 거리',color:'orange',simple:'점에서 직선으로 수직(직각)으로 내린 가장 짧은 거리예요.',detail:['분자: 직선 식의 x, y 자리에 점의 좌표(x, y)를 대입하고 계산한 값의 절댓값','분모: √((x 앞의 숫자)² + (y 앞의 숫자)²)','예) 점(3,1), 직선 3x−4y+5=0 의 경우','분자: |3×3 + (-4)×1 + 5| = |10| = 10','분모: √(3² + (-4)²) = √25 = 5','정답: 10/5 = 2'],formula:'분모는 루트((x앞 숫자)²+(y앞 숫자)²), 분자는 식에 점 대입!',tip:'루트 안의 x 앞 숫자, y 앞 숫자를 제곱해서 더하세요!',mem:'💡 분모는 앞 숫자 제곱, 분자는 점을 쏙 대입!'},
  {icon:'⭕',title:'원의 방정식',color:'teal',simple:'중심에서 모든 방향으로 같은 거리(반지름)를 갖는 점들의 모임이 원이에요.',detail:['(x−h)²+(y−k)²=r²: 중심(h,k), 반지름r','예) 중심(2,−3), r=4: (x−2)²+(y+3)²=16','우변은 반지름의 제곱(r²)!','괄호 안 부호 반대!: (x−2) → 중심 x=+2'],formula:'(x−h)² + (y−k)² = r²',tip:'중심 좌표엔 반대 부호, 우변엔 r²!',mem:'💡 (x−h)이면 중심은 +h'},
  {icon:'🪞',title:'대칭이동',color:'amber',simple:'거울에 비친 것처럼 기준선 반대편으로 점을 옮기는 것이에요.',detail:['x축 대칭: y에 −1 → (a,b)→(a,−b)','y축 대칭: x에 −1 → (a,b)→(−a,b)','원점 대칭: 둘다 −1 → (a,b)→(−a,−b)','y=x 대칭: x,y 교환 → (a,b)→(b,a)','y=−x 대칭: 교환+둘다−1 → (a,b)→(−b,−a)'],formula:'y=x 대칭: (a,b) → (b,a)',tip:'y=x 대칭: 검정고시 빈출! x와 y를 바꾸면 됨',mem:'💡 y=x 기준 → x,y 위치 교환!'},
];
var CMAP={blue:{bg:'bg-blue-50',bd:'border-blue-200',hd:'text-blue-700',badge:'bg-blue-100 text-blue-800'},purple:{bg:'bg-purple-50',bd:'border-purple-200',hd:'text-purple-700',badge:'bg-purple-100 text-purple-800'},green:{bg:'bg-emerald-50',bd:'border-emerald-200',hd:'text-emerald-700',badge:'bg-emerald-100 text-emerald-800'},orange:{bg:'bg-orange-50',bd:'border-orange-200',hd:'text-orange-700',badge:'bg-orange-100 text-orange-800'},teal:{bg:'bg-teal-50',bd:'border-teal-200',hd:'text-teal-700',badge:'bg-teal-100 text-teal-800'},amber:{bg:'bg-amber-50',bd:'border-amber-200',hd:'text-amber-700',badge:'bg-amber-100 text-amber-800'}};
var GEO_TABS=[{k:'rad',lbl:'🌿 무리함수',C:RadicalModule},{k:'rat',lbl:'🔀 유리함수',C:RationalModule},{k:'qua',lbl:'🏹 이차함수',C:QuadraticModule},{k:'dis',lbl:'📏 점↔직선',C:DistanceModule},{k:'cir',lbl:'⭕ 원',C:CircleModule},{k:'sym',lbl:'🪞 대칭이동',C:SymmetryModule}];

/* ===== AUTH SCREEN ===== */
