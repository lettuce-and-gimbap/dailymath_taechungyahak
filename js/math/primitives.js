// === js/math/primitives.js ===
/* --------------------------------------------------------------------
   그래프 SVG 기본 요소와 캔버스 훅
   격자/점/분수/루트 표기 · 크기·드래그·확대 훅
   -------------------------------------------------------------------- */

function Grid({W,H,SC,cx,cy,skipX=[],skipY=[]}){   // skipX·skipY : 굵은 색 좌표 숫자가 대신 쓰이는 눈금은 그리지 않는다(겹침 방지)
  // cx/cy: 원점의 픽셀 위치 (팬 이동 반영됨), 범위 ±12까지 확장
  const rX=Math.min(12,Math.ceil(Math.max(cx,W-cx)/SC)+1);
  const rY=Math.min(12,Math.ceil(Math.max(cy,H-cy)/SC)+1);
  const txs=Array.from({length:rX*2+1},(_,i)=>i-rX);
  const tys=Array.from({length:rY*2+1},(_,i)=>i-rY);
  return(<g>
    {txs.map(n=>{const px=cx+n*SC;if(px<-2||px>W+2)return null;return(<g key={'x'+n}>
      <line x1={px} y1={0} x2={px} y2={H} stroke={n===0?'#0f172a':'#e2e8f0'} strokeWidth={n===0?3:0.9}/>
      {n!==0&&px>14&&px<W-6&&!skipX.includes(n)&&<text x={px} y={Math.max(16,Math.min(H-4,cy+18))} textAnchor="middle" fontSize={17} fill="#475569" fontWeight="700">{n}</text>}
    </g>);})}
    {tys.map(n=>{const py=cy-n*SC;if(py<-2||py>H+2)return null;return(<g key={'y'+n}>
      <line x1={0} y1={py} x2={W} y2={py} stroke={n===0?'#0f172a':'#e2e8f0'} strokeWidth={n===0?3:0.9}/>
      {n!==0&&py>6&&py<H-6&&!skipY.includes(n)&&<text x={Math.max(16,Math.min(W-6,cx-10))} y={py+4} textAnchor="end" fontSize={17} fill="#475569" fontWeight="700">{n}</text>}
    </g>);})}
    {cy>=0&&cy<=H&&<polygon points={`${W-2},${cy} ${W-11},${cy-4} ${W-11},${cy+4}`} fill="#0f172a"/>}
    {cx>=0&&cx<=W&&<polygon points={`${cx},2 ${cx-4},11 ${cx+4},11`} fill="#0f172a"/>}
    <text x={W-4} y={Math.max(14,Math.min(H-4,cy+14))} fontSize={14} fill="#0f172a" fontWeight="bold">x</text>
    <text x={Math.max(14,cx+8)} y={13} fontSize={14} fill="#0f172a" fontWeight="bold">y</text>
  </g>);
}

function Dot({sx,sy,color='#ef4444',onDown,cx,cy,label}){
  const showProj = cx!==undefined && cy!==undefined && label!==undefined;
  return(<g style={{cursor:onDown?'grab':'crosshair',userSelect:'none'}} onMouseDown={e=>{if(onDown){e.preventDefault();onDown(e)}}} onTouchStart={e=>{if(onDown){e.preventDefault();onDown(e)}}}>
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
      <text x={sx} y={cy+32} textAnchor="middle" fontSize={28} fill={color} fontWeight="900" stroke="white" strokeWidth="2" paintOrder="stroke">{label[0]}</text>
      {/* ── y축의 수선의 발 강조 ── */}
      {/* 발 위치 굵은 눈금 */}
      <line x1={cx-10} y1={sy} x2={cx+10} y2={sy} stroke={color} strokeWidth={4.5}/>
      {/* 발 위치 채운 원 */}
      <circle cx={cx} cy={sy} r={6} fill={color} stroke="white" strokeWidth={2}/>
      {/* y 좌표 라벨 */}
      <text x={cx-20} y={sy+9} textAnchor="end" fontSize={28} fill={color} fontWeight="900" stroke="white" strokeWidth="2" paintOrder="stroke">{label[1]}</text>
      {/* ── 점 좌표 라벨 ── */}
      <text x={sx+18} y={sy-18} fontSize={26} fill={color} fontWeight="900" stroke="white" strokeWidth="2.5" paintOrder="stroke">({label[0]}, {label[1]})</text>
    </>}
    <circle cx={sx} cy={sy} r={26} fill={color} opacity={0.12}/>
    <circle cx={sx} cy={sy} r={14} fill={color} stroke="white" strokeWidth={3.5}/>
  </g>);
}

/* 세로 분수. 분자가 음수면 '−' 를 분수 앞에 둔다 (분자에 붙이지 않는다) */
function VF({n,d}){const t=String(n);const neg=/^[-−]/.test(t);const nn=neg?t.slice(1):t;
  return(<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle'}}>{neg&&<span style={{marginRight:'1px'}}>−</span>}<span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',lineHeight:1.05,fontSize:'0.78em',margin:'0 1px'}}><span style={{borderBottom:'1.5px solid currentColor',padding:'0 3px'}}>{nn}</span><span style={{padding:'0 3px'}}>{d}</span></span></span>)}

/* 루트 — KaTeX 로 √ 기호와 윗줄을 한 덩어리로 그린다 (예전 '√'+윗줄 테두리는 둘이 떨어져 보였다).
   KaTeX 가 아직 안 불러와졌을 때만 예전 방식으로 그린다. */
function SqR({s='',sz=15}){
  if(window.katex){try{return<span style={{fontSize:(sz*1.05)+'px',whiteSpace:'nowrap'}} dangerouslySetInnerHTML={{__html:window.katex.renderToString('\\sqrt{'+String(s).replace(/−/g,'-')+'}',{throwOnError:false})}}/>;}catch(e){}}
  return(<span style={{display:'inline-flex',alignItems:'center',verticalAlign:'middle',fontSize:sz+'px',lineHeight:1}}><span style={{fontSize:(sz*1.3)+'px',lineHeight:0.85,fontFamily:"Georgia,'Times New Roman',serif",marginRight:'1px',display:'inline-block'}}>√</span><span style={{borderTop:'1.8px solid currentColor',padding:'1px 2px 0',display:'inline-block',lineHeight:1.15,minWidth:'6px'}}>{s}</span></span>);
}

function KF({tex,block}){return<span dangerouslySetInnerHTML={{__html:autoMathHtml(block?`$$${tex}$$`:`$${tex}$`)}}/>;}

/* ===== CUSTOM HOOKS ===== */
function useCanvasSize(){
  /* 📱 시니어 모바일 최적화 v9: 좌표평면 크기 확대 (여백 40→16, 최대너비 500→620) */
  const calc=()=>{const vw=Math.min(window.innerWidth-16,620);const SC=Math.floor(vw/13);return{SC,W:SC*13,H:SC*13}};
  const[sz,setSz]=useState(calc);
  useEffect(()=>{const f=()=>setSz(calc());window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f)},[]);
  return sz;
}

/* CSS 크기나 테두리가 바뀌어도 화면 좌표를 SVG 내부 좌표로 변환한다. */
function graphClientToSvg(svg,ex,ey,W,H){
  if(!svg||!Number.isFinite(ex)||!Number.isFinite(ey))return null;
  try{const matrix=svg.getScreenCTM?.();if(matrix&&svg.createSVGPoint){const p=svg.createSVGPoint();p.x=ex;p.y=ey;const v=p.matrixTransform(matrix.inverse());if(Number.isFinite(v.x)&&Number.isFinite(v.y))return [v.x,v.y];}}catch(_){}
  const r=svg.getBoundingClientRect();if(!r.width||!r.height)return null;
  return [(ex-r.left)*W/r.width,(ey-r.top)*H/r.height];
}
function graphSnapClient(svg,ex,ey,sz){
  const{SC,W,H,panX=0,panY=0}=sz;if(!SC)return null;
  const p=graphClientToSvg(svg,ex,ey,W,H);if(!p)return null;
  const cl=v=>Math.max(-12,Math.min(12,Math.round(v)));
  return[cl((p[0]-W/2)/SC+panX),cl((H/2-p[1])/SC+panY)];
}
function useDrag(svgRef,sz,onMove){
  const szRef=useRef(sz);szRef.current=sz;const cbRef=useRef(onMove);cbRef.current=onMove;const active=useRef(false),last=useRef(null);
  const getXY=e=>{if(e.touches?.length>0)return[e.touches[0].clientX,e.touches[0].clientY];if(e.changedTouches?.length>0)return[e.changedTouches[0].clientX,e.changedTouches[0].clientY];return[e.clientX,e.clientY]};
  const update=e=>{const[ex,ey]=getXY(e),c=graphSnapClient(svgRef.current,ex,ey,szRef.current);if(c&&(!last.current||c[0]!==last.current[0]||c[1]!==last.current[1])){last.current=c;cbRef.current(c);}};
  const dn=useCallback(e=>{active.current=true;last.current=null;update(e)},[]);
  const mv=useCallback(e=>{if(active.current)update(e)},[]);
  const up=useCallback(()=>{active.current=false;last.current=null},[]);
  return{dn,mv,up};
}

// 배경 길게 누르기(250ms) → 팬 모드: 좌표평면 이동
function usePan(sz,svgRef){
  const szRef=useRef(sz);szRef.current=sz;
  const st=useRef({timer:null,active:false,sx:0,sy:0,spx:0,spy:0});
  const[panning,setPanning]=useState(false);
  const start=useCallback((ex,ey)=>{const s=st.current,{W,H}=szRef.current,p=graphClientToSvg(svgRef.current,ex,ey,W,H);if(!p)return;clearTimeout(s.timer);s.sx=p[0];s.sy=p[1];s.spx=szRef.current.panX||0;s.spy=szRef.current.panY||0;s.active=false;s.timer=setTimeout(()=>{s.active=true;setPanning(true)},250)},[]);
  const move=useCallback((ex,ey)=>{const s=st.current;if(!s.active)return false;const{SC,W,H,onPan}=szRef.current,p=graphClientToSvg(svgRef.current,ex,ey,W,H);if(!p||!SC)return false;const nx=Math.max(-12,Math.min(12,s.spx-(p[0]-s.sx)/SC));const ny=Math.max(-12,Math.min(12,s.spy+(p[1]-s.sy)/SC));onPan?.(nx,ny);return true},[]);
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
    const{SC,zoom=1,panX=0,panY=0,W,H}=szRef.current;
    const midpoint=graphClientToSvg(svgRef.current,(touches[0].clientX+touches[1].clientX)/2,(touches[0].clientY+touches[1].clientY)/2,W,H);if(!midpoint||!SC||!dist2(touches))return false;
    const [midPx,midPy]=midpoint;
    st.current={active:true,startDist:dist2(touches),startZoom:zoom,
      startPanX:panX,startPanY:panY,
      midMX:(midPx-W/2)/SC+panX,  // 핀치 중심점의 수학 좌표 (고정점)
      midMY:(H/2-midPy)/SC+panY};
    return true;
  },[svgRef]);
  const move=useCallback((touches)=>{
    const s=st.current;if(!s.active||touches.length<2)return false;
    const{onZoom}=szRef.current;
    const rawScale=dist2(touches)/s.startDist;
    const nz=Math.max(0.5,Math.min(3,s.startZoom*rawScale));
    const scale=nz/s.startZoom;
    // 핀치 중심점이 픽셀 위치 유지되도록 pan 보정
    const npx=Math.max(-12,Math.min(12,s.midMX+(s.startPanX-s.midMX)/scale));
    const npy=Math.max(-12,Math.min(12,s.midMY+(s.startPanY-s.midMY)/scale));
    onZoom?.(nz,npx,npy);return true;
  },[]);
  const end=useCallback(()=>{st.current.active=false},[]);
  return{pinchStart:start,pinchMove:move,pinchEnd:end};
}

var SVG_PROPS={style:{touchAction:'none',display:'block',fontFamily:"'Jua','Noto Sans KR',sans-serif"},className:'border-2 border-gray-100 rounded-2xl bg-slate-50 shadow-sm mx-auto'};
