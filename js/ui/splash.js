// === js/ui/splash.js ===
/* --------------------------------------------------------------------
   배움 글귀 스플래시
   로그인 직후 한 번 노출 · 글귀와 배경 데이터 포함
   -------------------------------------------------------------------- */

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

function QuoteSplash({onDone}){
  const DURATION=4500;
  // 접속할 때마다 다음 글귀가 나오도록 인덱스 회전
  const startIdx=React.useRef((()=>{
    let i=0;try{i=parseInt(localStorage.getItem('yakHakQuoteIdx')||'0',10)||0;}catch(e){}
    i=((i%LEARN_QUOTES.length)+LEARN_QUOTES.length)%LEARN_QUOTES.length;
    try{localStorage.setItem('yakHakQuoteIdx',String((i+1)%LEARN_QUOTES.length));}catch(e){}
    return i;
  })()).current;
  const quoteEntry=LEARN_QUOTES[startIdx];
  const quote=typeof quoteEntry==='string'?quoteEntry:quoteEntry.text;
  const quoteAuthor=typeof quoteEntry==='string'?'태청야학 수학반':quoteEntry.author;
  const bg=QUOTE_BGS[startIdx%QUOTE_BGS.length];
  const cardRef=React.useRef();
  const[pct,setPct]=React.useState(100);
  const[paused,setPaused]=React.useState(false);
  const[saving,setSaving]=React.useState(false);
  const elapsedRef=React.useRef(0);
  const lastRef=React.useRef(Date.now());
  const doneRef=React.useRef(false);

  React.useEffect(()=>{
    lastRef.current=Date.now();
    let raf;
    const tick=()=>{
      const now=Date.now();
      if(!paused){
        elapsedRef.current += now-lastRef.current;
        const p=Math.max(0,100-(elapsedRef.current/DURATION)*100);
        setPct(p);
        if(elapsedRef.current>=DURATION&&!doneRef.current){doneRef.current=true;onDone();return;}
      }
      lastRef.current=now;
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[paused]);

  const finish=()=>{if(!doneRef.current){doneRef.current=true;onDone();}};

  const capture=async()=>{
    if(typeof html2canvas==='undefined'){alert('스크린샷으로 간직해 주세요!');return;}
    setSaving(true);setPaused(true);
    try{
      const canvas=await html2canvas(cardRef.current,{backgroundColor:null,scale:2,useCORS:true});
      const link=document.createElement('a');
      link.download='태청야학_오늘의_글귀.png';
      link.href=canvas.toDataURL('image/png');
      link.click();
    }catch(e){alert('이미지 저장에 실패했어요. 화면을 스크린샷으로 간직해 주세요!');}
    setSaving(false);setPaused(false);
  };

  const stop=e=>{e.stopPropagation();};

  return(
    <div
      onPointerDown={()=>setPaused(true)}
      onPointerUp={()=>setPaused(false)}
      onPointerLeave={()=>setPaused(false)}
      onPointerCancel={()=>setPaused(false)}
      style={{position:'fixed',inset:0,zIndex:9999,background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'28px',touchAction:'none',userSelect:'none'}}>
      {/* 진행 바 */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:'4px',background:'rgba(255,255,255,0.25)'}}>
        <div style={{height:'100%',width:pct+'%',background:'rgba(255,255,255,0.9)',transition:'width .1s linear'}}/>
      </div>

      {/* 글귀 카드 (캡쳐 대상) */}
      <div ref={cardRef} style={{background:bg,borderRadius:'28px',padding:'40px 28px',maxWidth:'440px',width:'100%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
        <div style={{fontSize:'40px',marginBottom:'18px'}}>🎓</div>
        <div style={{fontSize:'15px',fontWeight:800,color:'rgba(255,255,255,0.85)',letterSpacing:'0.05em',marginBottom:'18px'}}>오늘의 배움 한 줄</div>
        <p style={{fontSize:'24px',lineHeight:1.55,fontWeight:900,color:'#fff',wordBreak:'keep-all',textShadow:'0 2px 12px rgba(0,0,0,0.22)',margin:0}}>{quote}</p>
        <div style={{marginTop:'26px',fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,0.8)'}}>— {quoteAuthor} —</div>
      </div>

      {/* 안내 + 버튼 (캡쳐 영역 밖) */}
      <div style={{marginTop:'22px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',width:'100%',maxWidth:'440px'}}>
        <div style={{fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,0.9)',height:'18px'}}>
          {paused?'⏸ 잠시 멈췄어요 (손을 떼면 다시 진행돼요)':'화면을 꾹 누르면 멈춰서 더 오래 볼 수 있어요'}
        </div>
        <div style={{display:'flex',gap:'10px',width:'100%'}}>
          <button onPointerDown={stop} onClick={capture} disabled={saving}
            style={{flex:1,padding:'14px',borderRadius:'16px',background:'rgba(255,255,255,0.95)',color:'#444',fontWeight:900,fontSize:'15px'}}>
            {saving?'저장 중...':'📸 글귀 간직하기'}
          </button>
          <button onPointerDown={stop} onClick={finish}
            style={{flex:1,padding:'14px',borderRadius:'16px',background:'rgba(0,0,0,0.22)',color:'#fff',fontWeight:900,fontSize:'15px'}}>
            들어가기 →
          </button>
        </div>
      </div>
    </div>
  );
}
