// === js/core/backNav.js ===
/* --------------------------------------------------------------------
   뒤로가기(브라우저·휴대폰 뒤로 버튼) 공용 처리
   - 앱이 켜져 있는 동안 기록(history)에 '보호 칸'을 항상 하나 남겨 두어, 뒤로가기가 앱을 바로 닫지 않고 여기로 들어오게 한다.
   - 화면마다 useBackHandler(fn, prio, active) 로 '뒤로가기를 받는 함수'를 등록한다.
     fn 이 false 를 돌려주면 처리하지 않은 것이므로 다음 순위로 넘어간다.
   - 순위(prio) : 모달 40 > 세부 화면(문제풀이 세션 등) 30 > 목록에서 연 상세 화면 20 > 탭(→ 홈) 10
   - 아무도 받지 않으면 '홈'인 것이므로 '나가시겠습니까?' 확인창(BackExitModal)을 띄운다.
   -------------------------------------------------------------------- */

var BackNav={
  list:[],          // 등록된 처리 함수 [{ref, prio, seq}]
  seq:0,
  onRoot:null,      // 아무도 받지 않았을 때(=홈) 부르는 함수 — BackExitModal 이 채운다
  leaving:false,    // 나가는 중이면 보호 칸을 다시 세우지 않는다
  depth:2,          // 앱이 쌓아 둔 기록 칸 수(base + guard, 첫 터치 뒤 3) — 나갈 때 이만큼 거슬러 간다
  dispatch(){
    const order=[...BackNav.list].sort((a,b)=>b.prio-a.prio||b.seq-a.seq);
    for(const h of order){if(h.ref.current()!==false)return true;}
    return false;
  },
  exit(){
    // 앱이 쌓은 보호 칸을 모두 건너뛰어 앱에 들어오기 전 화면으로 간다. 이전 화면이 없는 설치형 앱이면 창 닫기를 시도한다.
    BackNav.leaving=true;
    history.go(-BackNav.depth);
    setTimeout(()=>{BackNav.leaving=false;try{window.close();}catch(e){}},400);
  },
};

(function(){
  try{
    history.replaceState({bn:'base'},'');
    history.pushState({bn:'guard'},'');
  }catch(e){}
  /* 휴대폰 브라우저는 화면을 만지기 전에 쌓은 기록 칸을 뒤로가기에서 건너뛰기도 한다 —
     첫 터치 때 보호 칸을 한 번 더 세워 둔다. */
  const armOnTouch=()=>{
    window.removeEventListener('pointerdown',armOnTouch);
    try{history.pushState({bn:'guard'},'');BackNav.depth++;}catch(e){}
  };
  window.addEventListener('pointerdown',armOnTouch);
  window.addEventListener('popstate',()=>{
    if(BackNav.leaving)return;
    try{history.pushState({bn:'guard'},'');}catch(e){}   // 뒤로 간 만큼 다시 세워 둔다
    if(BackNav.dispatch())return;
    if(BackNav.onRoot)BackNav.onRoot();
  });
})();

/* fn : 뒤로가기가 왔을 때 부르는 함수. 처리했으면 true(또는 undefined), 못 받으면 false.
   active=false 이면 등록하지 않는다. fn 은 매 렌더 최신 것으로 바뀐다(ref). */
function useBackHandler(fn,prio,active){
  const ref=useRef(fn);
  ref.current=fn;
  const on=active===undefined?true:!!active;
  useEffect(()=>{
    if(!on)return;
    const h={ref,prio,seq:++BackNav.seq};
    BackNav.list.push(h);
    return()=>{BackNav.list=BackNav.list.filter(x=>x!==h);};
  },[on,prio]);
}

/* 홈에서 뒤로가기를 눌렀을 때 뜨는 확인창. App 에서 한 번만 그린다. */
function BackExitModal(){
  const[show,setShow]=useState(false);
  useEffect(()=>{
    BackNav.onRoot=()=>setShow(true);
    return()=>{BackNav.onRoot=null;};
  },[]);
  useBackHandler(()=>{setShow(false);},50,show);   // 확인창이 떠 있는 동안 또 뒤로가기를 누르면 '아니오'
  if(!show)return null;
  return(<div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs fade-in">
      <div className="text-center mb-5">
        <div className="text-4xl mb-3">👋</div>
        <div className="text-xl font-black text-gray-800">나가시겠습니까?</div>
      </div>
      <div className="flex gap-3">
        <button onClick={()=>setShow(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black active:scale-95 transition-all">아니오</button>
        <button onClick={()=>{setShow(false);BackNav.exit();}} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black active:scale-95 transition-all">예</button>
      </div>
    </div>
  </div>);
}
