// === js/math/primitives.js ===
/* --------------------------------------------------------------------
   그래프 SVG 기본 요소와 캔버스 훅
   격자/점/분수/루트 표기 · 크기·드래그·확대 훅
   -------------------------------------------------------------------- */

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

function KF({tex,block}){return<span dangerouslySetInnerHTML={{__html:autoMathHtml(block?`$$${tex}$$`:`$${tex}$`)}}/>;}

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
