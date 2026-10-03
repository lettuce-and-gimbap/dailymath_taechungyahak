// === js/ui/stamp.js ===
/* --------------------------------------------------------------------
   '참 잘했어요' 도장 — 10문제를 끝내면 화면 가운데에 쾅 찍힌다
   쓰는 곳 : 좌표 10문제(student/coordDaily.js) · 문제풀기 10문제(student/practice.js)

   - 그림 : 저장소 맨 위 stamp.webp (파란 원 테두리 안쪽만 남기고 바깥 배경을 지운 원형 그림, 480px)
   - 소리 : 파일 없이 Web Audio 로 만든다 — 낮은 '쿵'(도장이 종이에 닿는 소리) + 짧은 '탁' + 귀여운 '띠링' 두 음
            (파일을 따로 받지 않아도 되고, 오프라인에서도 난다)
   - 움직임 : 크게·기울어진 채 위에서 내려와(0.32초) 종이에 닿는 순간 화면이 살짝 흔들리고 잉크 물결이 퍼진다.
   - 화면 아무 곳이나 누르면 닫힌다. 누르지 않아도 2.6초 뒤 저절로 닫힌다.
   -------------------------------------------------------------------- */
var STAMP_SRC='stamp.webp';
var STAMP_HIT_MS=320;          // 도장이 종이에 닿는 순간 (애니메이션 55% 지점)

function playStampSound(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const ctx=playStampSound._ctx||(playStampSound._ctx=new AC());
    if(ctx.state==='suspended')ctx.resume();
    const t=ctx.currentTime+0.01;
    /* ① 쿵 : 낮은 사인파가 빠르게 내려간다 */
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(52,t+0.16);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.9,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+0.28);
    o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+0.3);
    /* ② 탁 : 아주 짧은 잡음 (종이 소리) */
    const len=Math.floor(ctx.sampleRate*0.05),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
    const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),ng=ctx.createGain();
    n.buffer=buf;f.type='lowpass';f.frequency.value=1600;ng.gain.value=0.55;
    n.connect(f).connect(ng).connect(ctx.destination);n.start(t);
    /* ③ 띠링 : 도(C6) → 솔(G6) 두 음, 부드러운 삼각파 */
    [[1046.5,0.16],[1568,0.29]].forEach(([hz,dt])=>{
      const s=ctx.createOscillator(),sg=ctx.createGain();
      s.type='triangle';s.frequency.value=hz;
      sg.gain.setValueAtTime(0.0001,t+dt);sg.gain.exponentialRampToValueAtTime(0.22,t+dt+0.012);sg.gain.exponentialRampToValueAtTime(0.0001,t+dt+0.22);
      s.connect(sg).connect(ctx.destination);s.start(t+dt);s.stop(t+dt+0.25);
    });
  }catch(e){}
}

var STAMP_CSS=`
@keyframes stDrop{0%{transform:translateY(-40px) scale(2.6) rotate(-30deg);opacity:0}
  55%{transform:translateY(0) scale(.9) rotate(-11deg);opacity:1}
  72%{transform:scale(1.07) rotate(-10deg)}100%{transform:scale(1) rotate(-10deg);opacity:1}}
@keyframes stShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-3px,2px)}80%{transform:translate(2px,-1px)}}
@keyframes stInk{0%{transform:scale(.6);opacity:.55}100%{transform:scale(1.55);opacity:0}}
@keyframes stFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes stSpark{0%{transform:translate(0,0) scale(.4);opacity:0}30%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}
.st-wrap{animation:stShake .32s ease-out ${STAMP_HIT_MS}ms both}
.st-img{animation:stDrop .58s cubic-bezier(.25,.9,.35,1.15) both;filter:drop-shadow(0 6px 14px rgba(18,58,107,.28))}
.st-ink{animation:stInk .7s ease-out ${STAMP_HIT_MS}ms both}
.st-txt{animation:stFade .4s ease-out ${STAMP_HIT_MS+250}ms both}
.st-spark{position:absolute;left:50%;top:50%;font-size:22px;animation:stSpark .8s ease-out ${STAMP_HIT_MS}ms both}
`;

/* 화면 가운데에 도장을 찍는 덮개. title/sub 는 도장 아래 글 */
function StampOverlay({onClose,title,sub}){
  useEffect(()=>{
    const s=setTimeout(playStampSound,STAMP_HIT_MS-20);
    const c=setTimeout(()=>onClose&&onClose(),2600);
    try{if(navigator.vibrate)setTimeout(()=>navigator.vibrate(35),STAMP_HIT_MS);}catch(e){}
    return()=>{clearTimeout(s);clearTimeout(c);};
  },[]);
  const sparks=[[-120,-90],[120,-100],[-140,40],[140,30],[-60,130],[70,125]];
  return(<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35" onClick={()=>onClose&&onClose()}>
    <style>{STAMP_CSS}</style>
    <div className="st-wrap flex flex-col items-center">
      <div style={{position:'relative',width:'min(68vw,300px)',height:'min(68vw,300px)'}}>
        <div className="st-ink" style={{position:'absolute',inset:0,borderRadius:'50%',border:'10px solid rgba(29,59,143,.45)'}}/>
        {sparks.map(([dx,dy],i)=><span key={i} className="st-spark" style={{'--dx':dx+'px','--dy':dy+'px'}}>{i%2?'✨':'⭐'}</span>)}
        <img src={STAMP_SRC} alt="참 잘했어요 도장" className="st-img" style={{width:'100%',height:'100%',display:'block'}}/>
      </div>
      <div className="st-txt text-center mt-5 bg-white/95 rounded-2xl px-6 py-3 shadow-lg">
        <div className="text-2xl font-black text-indigo-800">{title||'참 잘했어요!'}</div>
        {sub&&<div className="text-base font-bold text-gray-500 mt-1">{sub}</div>}
      </div>
    </div>
  </div>);
}

/* 결과 화면에 남겨 두는 작은 도장 (애니메이션 없음) */
function StampBadge({size=120}){
  return<img src={STAMP_SRC} alt="참 잘했어요 도장" style={{width:size,height:size,transform:'rotate(-10deg)',display:'inline-block',filter:'drop-shadow(0 3px 6px rgba(18,58,107,.25))'}}/>;
}
