// === js/ui/recentSessions.js ===
/* --------------------------------------------------------------------
   선생님 화면 '최근 학습 세션' 공용 조각 (학생관리 탭 · 오답노트 탭)
   - useRecentSessions(n) : math_logs 최근 기록을 날짜+시각 순으로 n개 (한 번만 받아 5/10/20 전환은 다시 읽지 않는다)
   - RecentCountToggle    : 5 / 10 / 20개 보기 단추 (선택은 localStorage 에 기억)
   - FeelChip / FeelSummary : 학생이 세션 끝에 고른 소감(feeling) 표시
   -------------------------------------------------------------------- */

var RECENT_COUNTS=[5,10,20];
var RECENT_COUNT_KEY='teacherRecentCount';
var RECENT_FETCH=40;   // 같은 날짜 안에서 시각순으로 다시 정렬하므로 20개보다 넉넉히 받는다

var FEEL_META={
  easy:{ico:'😊',lbl:'쉬웠어요',cls:'bg-green-100 text-green-800 border-green-300'},
  normal:{ico:'😐',lbl:'적당했어요',cls:'bg-blue-100 text-blue-800 border-blue-300'},
  hard:{ico:'😥',lbl:'어려웠어요',cls:'bg-red-100 text-red-800 border-red-300'},
};

function useRecentCount(){
  const[n,setN]=useState(()=>{
    try{const v=parseInt(localStorage.getItem(RECENT_COUNT_KEY),10);if(RECENT_COUNTS.includes(v))return v;}catch(e){}
    return 10;
  });
  const set=v=>{setN(v);try{localStorage.setItem(RECENT_COUNT_KEY,String(v));}catch(e){}};
  return[n,set];
}

function useRecentSessions(n,reloadKey){
  const[all,setAll]=useState([]);
  useEffect(()=>{
    db.collection('math_logs').orderBy('date','desc').limit(RECENT_FETCH).get().then(snap=>{
      const arr=[];snap.forEach(d=>arr.push({id:d.id,...d.data()}));
      arr.sort((a,b)=>`${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`));
      setAll(arr);
    }).catch(()=>{});
  },[reloadKey]);   // 세션을 지운 뒤 reloadKey 를 올리면 다시 읽는다
  return all.slice(0,n);
}

function RecentCountToggle({n,onChange}){
  return(<div className="flex items-center gap-1">
    {RECENT_COUNTS.map(c=>(
      <button key={c} onClick={()=>onChange(c)}
        className={`text-xs px-2.5 py-1 rounded-lg font-black transition-all ${n===c?'bg-indigo-500 text-white':'bg-gray-100 text-gray-600'}`}>{c}개</button>
    ))}
  </div>);
}

function FeelChip({feeling,small}){
  const m=FEEL_META[feeling];
  if(!m)return<span className={`${small?'text-[9px]':'text-xs'} font-bold text-gray-400`}>소감 없음</span>;
  return<span className={`${small?'text-[9px] px-1.5':'text-xs px-2'} inline-flex items-center gap-0.5 py-0.5 rounded-full border font-black ${m.cls}`}>{m.ico} {m.lbl}</span>;
}

function FeelSummary({sessions}){
  const c={easy:0,normal:0,hard:0};
  sessions.forEach(s=>{if(c[s.feeling]!==undefined)c[s.feeling]++;});
  return(<div className="flex items-center gap-2 text-xs font-black text-gray-700">
    {Object.keys(FEEL_META).map(k=><span key={k}>{FEEL_META[k].ico} {c[k]}</span>)}
  </div>);
}
