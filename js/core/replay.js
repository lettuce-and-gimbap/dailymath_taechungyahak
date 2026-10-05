// === js/core/replay.js ===
/* --------------------------------------------------------------------
   기록 다시 그리기 — 생성기를 '씨앗(seed)'으로 똑같이 다시 돌린다 (2026-10-05)
   쓰는 곳 : student/coordDaily.js (문제를 만들 때 씨앗을 남김) · teacher/logQView.js (선생님 화면에서 다시 그림)

   - 학생 기록(users.logs)에는 문제 글만 남고 그림·식(KaTeX)·보기 그림은 남지 않는다.
     그림 SVG 를 통째로 저장하면 users 문서(1MiB 한도)가 금방 찬다.
     대신 Math.random 을 씨앗이 있는 난수로 잠깐 바꿔 생성기를 돌리면, 같은 씨앗 → 같은 문제가 나온다.
   - 씨앗이 없는 예전 기록은 replaySearch 로 씨앗 1, 2, 3 … 을 차례로 돌려
     '문제 글·정답이 기록과 똑같이 나오는' 씨앗을 찾는다. 화면이 멈추지 않도록 조금씩 나눠 돈다.
   -------------------------------------------------------------------- */
function _mulberry32(seed){
  let a=seed>>>0;
  return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
}
/* fn 을 씨앗 난수로 한 번 돌린다. 끝나면 Math.random 을 반드시 되돌린다 */
function withSeed(seed,fn){
  const R=Math.random;Math.random=_mulberry32(seed);
  try{return fn();}finally{Math.random=R;}
}
var newSeed=()=>(Math.random()*4294967296)>>>0;

/* 씨앗 찾기 : gens 를 씨앗 1…limit 로 돌려 pred(q) 가 참인 첫 결과 {seed, gen, q}. 못 찾으면 null.
   opt.wrap(fn) : 한 덩어리를 돌리는 동안 무거운 그림 함수를 잠시 빈 함수로 바꿀 때 쓴다(찾을 때는 글만 비교하므로). */
function replaySearch(gens,pred,opt){
  const {limit=60000,chunk=2000,wrap=f=>f()}=opt||{};
  return new Promise(res=>{
    let s=1;
    const step=()=>{
      let hit=null;
      wrap(()=>{
        const end=Math.min(limit,s+chunk-1);
        for(;s<=end&&!hit;s++)for(const g of gens){
          let q=null;try{q=withSeed(s,g);}catch(e){}
          if(q&&pred(q)){hit={seed:s,gen:g,q};break;}
        }
      });
      if(hit)return res(hit);
      if(s>limit)return res(null);
      setTimeout(step,0);
    };
    step();
  });
}
