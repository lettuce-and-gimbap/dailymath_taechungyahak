var {useState,useRef,useCallback,useEffect,useMemo}=React;
var db=window._db;

/* ===== CONSTANTS ===== */
var ADMIN_NAMES=['박소명','이은희','최시은','윤새별','신현섭','최예원'];
var DAY_KO=['월','화','수','목','금','토','일'];

/* ===== 기출 출처 매핑 (2023~2026년) ===== */
// 각 유형이 실제 기출에 등장한 연도·회차·문항번호
// 형식: {y:연도, s:회차, q:문항번호}
var HIGH_Q_SPECIFIC={
  '다항식 사칙연산':{y:2026,s:1,q:1},
  '항등식':{y:2026,s:1,q:2},
  '나머지 정리':{y:2026,s:1,q:3},
  '나누어떨어지는 조건':{y:2025,s:2,q:3},
  '조립제법':{y:2025,s:1,q:3},
  '인수분해':{y:2026,s:1,q:4},
  '복소수':{y:2026,s:1,q:5},
  '켤레복소수':{y:2025,s:2,q:5},
  '이차방정식 중근':{y:2025,s:1,q:5},
  '이차방정식 근과 계수':{y:2026,s:1,q:6},
  '두 근→이차방정식':{y:2025,s:2,q:6},
  '이차함수 최댓/최솟값':{y:2026,s:1,q:7},
  '삼차방정식 한 근':{y:2025,s:1,q:8},
  '사차방정식 한 근':{y:2024,s:1,q:8},
  '연립방정식':{y:2026,s:1,q:9},
  '연립부등식':{y:2025,s:2,q:9},
  '이차부등식':{y:2026,s:1,q:10},
  '절댓값 부등식':{y:2025,s:1,q:10},
  '두 점 거리':{y:2025,s:2,q:11},
  '내분점(수직선)':{y:2024,s:1,q:11},
  '내분점(좌표평면)':{y:2024,s:2,q:11},
  '직선과 원':{y:2026,s:1,q:11},
  '원점→직선 거리':{y:2026,s:1,q:12},
  '직선 방정식':{y:2026,s:1,q:12},
  '평행 직선':{y:2025,s:2,q:12},
  '수직 직선':{y:2025,s:1,q:12},
  '원의 방정식':{y:2026,s:1,q:13},
  '원의 방정식(지름)':{y:2025,s:2,q:13},
  '원의 대칭이동':{y:2026,s:1,q:13},
  '평행이동':{y:2026,s:1,q:14},
  '대칭이동':{y:2025,s:2,q:14},
  '집합 원소연산':{y:2025,s:1,q:15},
  '집합 개수':{y:2026,s:1,q:15},
  '합집합+교집합 개수':{y:2025,s:1,q:15},
  '집합 상수 구하기':{y:2024,s:2,q:15},
  '진리집합':{y:2025,s:1,q:16},
  '명제의 역':{y:2026,s:1,q:16},
  '명제의 대우':{y:2025,s:2,q:16},
  '충분조건':{y:2026,s:1,q:16},
  '필요조건':{y:2025,s:2,q:16},
  '필요충분조건':{y:2025,s:2,q:16},
  '합성함수':{y:2025,s:1,q:16},
  '역함수':{y:2026,s:1,q:17},
  '역함수(공식)':{y:2024,s:2,q:17},
  '유리함수 점근선':{y:2026,s:1,q:18},
  '유리함수 평행이동':{y:2025,s:1,q:18},
  '무리함수 평행이동':{y:2025,s:2,q:18},
  '무리함수 상수':{y:2023,s:2,q:18},
  '순열':{y:2026,s:1,q:19},
  '조합':{y:2026,s:1,q:20},
};
var MID_Q_SPECIFIC={
  '소인수분해':{y:2025,s:2,q:1},
  '수의 대소':{y:2025,s:2,q:2},
  '순환소수':{y:2025,s:2,q:3},
  '지수법칙':{y:2025,s:2,q:4},
  '식의 값':{y:2025,s:2,q:5},
  '문자를 사용한 식':{y:2025,s:2,q:6},
  '일차방정식':{y:2025,s:2,q:7},
  '연립방정식':{y:2025,s:2,q:8},
  '일차부등식':{y:2025,s:2,q:9},
  '근호의 계산':{y:2025,s:2,q:10},
  '이차방정식':{y:2025,s:2,q:11},
  '좌표와 사분면':{y:2024,s:2,q:13},
  '일차함수':{y:2025,s:2,q:13},
  '일차함수 y절편':{y:2025,s:2,q:14},
  '이차함수 그래프':{y:2025,s:2,q:15},
  '이등변삼각형':{y:2025,s:2,q:16},
  '평행선과 각':{y:2024,s:1,q:16},
  '닮음':{y:2025,s:2,q:17},
  '삼각비':{y:2025,s:2,q:18},
  '원주각과 중심각':{y:2025,s:2,q:19},
  '같은 호의 원주각':{y:2025,s:2,q:20},
  '확률':{y:2025,s:2,q:21},
  '경우의 수':{y:2025,s:2,q:22},
  '평균':{y:2025,s:2,q:23},
  '중앙값':{y:2025,s:2,q:23},
  '최빈값':{y:2025,s:2,q:23},
  '도수분포표':{y:2025,s:2,q:24},
};
// 넓은 범위 참고용 (기존 유지)
var HIGH_Q_SOURCE={
  '다항식 사칙연산':'Q1 (2023~2026년 매회)',
  '항등식':'Q2 (2023~2026년 매회)',
  '나머지 정리':'Q3 (2023-1·2회, 2024-1회, 2025-2회, 2026-1회)',
  '나누어떨어지는 조건':'Q3 (2023~2026년)',
  '조립제법':'Q3 (2023~2026년)',
  '인수분해':'Q3~4 (2024-2회, 2025-1회 / Q4는 매회)',
  '복소수':'Q5 (2023~2026년 매회)',
  '켤레복소수':'Q5 (2023~2026년 매회)',
  '이차방정식 중근':'Q5~6 (2023~2026년)',
  '이차방정식 근과 계수':'Q6 (2023~2026년 매회)',
  '두 근→이차방정식':'Q6~7 (2023~2026년)',
  '이차함수 최댓/최솟값':'Q7 (2023~2026년 매회)',
  '삼차방정식 한 근':'Q8 (2023~2026년)',
  '사차방정식 한 근':'Q8 (2023-1·2회, 2024-1회)',
  '연립방정식':'Q9 (2023~2026년 매회)',
  '연립부등식':'Q9 (2023~2026년)',
  '이차부등식':'Q10 (2023~2026년 매회)',
  '절댓값 부등식':'Q10 (2023~2026년)',
  '두 점 거리':'Q11 (2023~2026년)',
  '내분점(수직선)':'Q11 (2023-1회, 2024-1회)',
  '내분점(좌표평면)':'Q11 (2023-2회, 2024-2회)',
  '직선과 원':'Q11~13 (2025~2026년)',
  '원점→직선 거리':'Q11~12 (2025-1회, 2026-1회)',
  '직선 방정식':'Q12 (2023~2026년 매회)',
  '평행 직선':'Q12 (2023~2026년)',
  '수직 직선':'Q12 (2023~2026년)',
  '원의 방정식':'Q13 (2023~2026년 매회)',
  '원의 방정식(지름)':'Q13 (2023~2026년)',
  '원의 대칭이동':'Q13 (2025-1회, 2026-1회)',
  '평행이동':'Q14 (2023~2026년)',
  '대칭이동':'Q14 (2023~2026년 매회)',
  '집합 원소연산':'Q15 (2023~2026년)',
  '집합 개수':'Q15 (2023~2026년)',
  '합집합+교집합 개수':'Q14~15 (2024-1회, 2025-1회)',
  '집합 상수 구하기':'Q15 (2023~2026년)',
  '진리집합':'Q16 (2023-2회, 2024-1·2회, 2025-1회)',
  '명제의 역':'Q16 (2023~2026년)',
  '명제의 대우':'Q16 (2023~2026년 매회)',
  '충분조건':'Q16 (2023~2026년)',
  '필요조건':'Q16 (2024-2회, 2025-2회, 2026-1회)',
  '필요충분조건':'Q16 (2025-2회, 2026-1회)',
  '합성함수':'Q16~17 (2023-1회·2024-1회 Q17 / 2024-2회·2025-1회 Q16)',
  '역함수':'Q17 (2023-2회, 2025-1·2회, 2026-1회)',
  '역함수(공식)':'Q17 (2024-2회)',
  '유리함수 점근선':'Q18 (2023-1회, 2026-1회)',
  '유리함수 평행이동':'Q18 (2024-1·2회, 2025-1회)',
  '무리함수 평행이동':'Q18 (2023-2회, 2025-2회)',
  '무리함수 상수':'Q18 (2023~2026년)',
  '순열':'Q19 (2023~2026년 매회)',
  '조합':'Q20 (2023~2026년 매회)',
};
var MID_Q_SOURCE={
  '소인수분해':'Q1~4 · 수와 연산 (2023~2026년)',
  '수의 대소':'Q1~4 · 수와 연산 (2023~2026년)',
  '순환소수':'Q1~4 · 수와 연산 (2023~2026년)',
  '지수법칙':'Q1~4 · 수와 연산 (2023~2026년)',
  '식의 값':'Q5~12 · 문자와 식 (2023~2026년)',
  '문자를 사용한 식':'Q5~12 · 문자와 식 (2023~2026년)',
  '일차방정식':'Q5~12 · 문자와 식 (2023~2026년 매회)',
  '연립방정식':'Q5~12 · 문자와 식 (2023~2026년 매회)',
  '일차부등식':'Q5~12 · 문자와 식 (2023~2026년)',
  '근호의 계산':'Q5~12 · 문자와 식 (2023~2026년)',
  '이차방정식':'Q5~12 · 문자와 식 (2023~2026년)',
  '일차함수':'Q13~15 · 함수 (2023~2026년 매회)',
  '일차함수 y절편':'Q13~15 · 함수 (2023~2026년)',
  '이차함수 그래프':'Q13~15 · 함수 (2023~2026년 매회)',
  '이등변삼각형':'Q16~20 · 기하 (2023~2026년)',
  '닮음':'Q16~20 · 기하 (2023~2026년)',
  '삼각비':'Q16~20 · 기하 (2023~2026년 매회)',
  '원주각과 중심각':'Q16~20 · 기하 (2023~2026년)',
  '같은 호의 원주각':'Q16~20 · 기하 (2023~2026년)',
  '확률':'Q21~25 · 확률과 통계 (2023~2026년 매회)',
  '경우의 수':'Q21~25 · 확률과 통계 (2023~2026년)',
  '평균':'Q21~25 · 확률과 통계 (2023~2026년)',
  '중앙값':'Q21~25 · 확률과 통계 (2023~2026년)',
  '최빈값':'Q21~25 · 확률과 통계 (2023~2026년)',
  '도수분포표':'Q21~25 · 확률과 통계 (2023~2026년 매회)',
};
// 특정 출처 반환: "2026년도 제1회 고졸검정고시 16번 변형"
var getExamSource=function(q){
  if(!q||!q.topic)return null;
  var isMid=q.meta?.level==='middle'||q.meta?.diff==='중졸';
  var spec=(isMid?MID_Q_SPECIFIC:HIGH_Q_SPECIFIC)[q.topic];
  if(!spec)return null;
  var level=isMid?'중졸':'고졸';
  return`${spec.y}년도 제${spec.s}회 ${level}검정고시 ${spec.q}번 변형`;
};

/* ===== UTILS ===== */
var todayStr=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
var timeStr=()=>{const d=new Date();return`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
var fmtDate=s=>{const d=new Date(s);const dy=['일','월','화','수','목','금','토'];return`${d.getMonth()+1}월 ${d.getDate()}일(${dy[d.getDay()]})`};
// 오늘로부터 며칠 전인지 (날짜 문자열 'YYYY-MM-DD' 기준, 자정 기준 정수 일수)
var daysSince=s=>{
  if(!s)return 9999;
  var d=new Date(s);if(isNaN(d))return 9999;
  var t=new Date();
  var d0=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  var t0=new Date(t.getFullYear(),t.getMonth(),t.getDate());
  return Math.round((t0-d0)/86400000);
};
// 5일 이내 기록만 '최근'으로 분류 (학습 기록 기본 표시 범위)
var RECENT_DAYS=5;
var isRecentLog=log=>daysSince(log&&(log.date||log.createdAt))<=RECENT_DAYS;

/* ===== 객관적 학습 데이터 수집 유틸리티 =====
   설계 원칙 (pasted doc 기반):
   - 출제자 주관 태그(상/중/하) 배제 → 행동 로그에서 직접 추출
   - Firebase Read/Write 비용 현실적 고려 → 토픽-레벨 집계만 사용
   - 리스트 형식 퀴즈의 한계 명시 → firstClickMs는 "세션 내 참여 타이밍"이지 "문항 소요시간"이 아님

   수집 지표 4가지:
   1. firstClickMs  - 세션 시작~첫 선택까지 ms (망설임 패턴 분류)
   2. revisionCount - 첫 선택 후 답 변경 횟수 (수정 행동 패턴 분류)
   3. qTopicHash   - 토픽 해시 (크로스-학생 영역난이도 집계)
   4. timeSec       - DailyPractice: 실제 측정값 / 리스트형: firstClickMs 환산값

   ⚠️ 리스트 형식(MockExam, GeoQuiz) 한계:
   - 모든 문항이 동시에 렌더링되므로 "특정 문항에 머문 시간" 계산 불가
   - firstClickMs는 세션 내 참여 순서/타이밍 정보만 제공
   - 진정한 per-question time은 one-at-a-time UI에서만 가능 (DailyPractice 방식)
*/

// djb2 해시 - 토픽 문자열을 짧은 키로 변환 (크로스-학생 집계용)
function djb2Hash(str){
  let h=5381;
  for(let i=0;i<str.length;i++){h=((h<<5)+h)^str.charCodeAt(i);h=h>>>0;}
  return h.toString(36).slice(0,8);
}

// 문항 토픽 해시 추출 (문항 자체가 매번 다른 파라미터로 생성되므로 토픽 레벨 집계)
function getTopicHash(q){
  const key=(q.meta?.type||q.topic||'기타').trim();
  return djb2Hash(key);
}

// 크로스-학생 토픽 난이도 통계 업데이트 (Firestore qStats 컬렉션)
// 학생 저장 시 fire-and-forget으로 호출 → Firebase Write 비용: 세션당 토픽 수 (보통 3~6회)
async function updateQStats(questions){
  const batch={};
  questions.forEach(q=>{
    const h=getTopicHash(q);
    const topic=(q.meta?.type||q.topic||'기타');
    if(!batch[h])batch[h]={topic,total:0,correct:0};
    batch[h].total++;
    if(q.isOk)batch[h].correct++;
  });
  const promises=Object.entries(batch).map(async([hash,data])=>{
    const ref=db.collection('qStats').doc(hash);
    try{
      await db.runTransaction(async tx=>{
        const doc=await tx.get(ref);
        const ex=doc.exists?doc.data():{topic:data.topic,total:0,correct:0};
        tx.set(ref,{topic:ex.topic||data.topic,total:(ex.total||0)+data.total,correct:(ex.correct||0)+data.correct});
      });
    }catch(e){/* fire-and-forget: 실패해도 로그 저장에 영향 없음 */}
  });
  await Promise.all(promises);
}

// 세션 유휴시간 추정 (간이 방법: totalSec이 문항당 3분 초과 시 초과분을 유휴로 간주)
// ⚠️ 실제 이벤트 리스닝 없이 추정하는 방식 → 정확하지 않으나 zero-cost
var IDLE_THRESHOLD_PER_Q = 180; // 문항당 최대 180초(3분) 이상은 유휴로 간주
function estimateActiveTime(totalSec, qCount){
  if(!totalSec||!qCount)return{activeSec:totalSec||0,idleSec:0,flagged:false};
  const maxExpected=qCount*IDLE_THRESHOLD_PER_Q;
  if(totalSec>maxExpected){
    return{activeSec:maxExpected,idleSec:totalSec-maxExpected,flagged:true};
  }
  return{activeSec:totalSec,idleSec:0,flagged:false};
}

// 망설임 패턴 분류 (firstClickMs 기반)
// ⚠️ 리스트 UI에서는 "세션 내 참여 순서" 정보이므로 해석 시 주의
function classifyHesitation(firstClickMs, isOk){
  if(firstClickMs==null)return'unknown';
  const sec=firstClickMs/1000;
  if(sec<8&&!isOk)return'impulsive';      // 빠름+오답: 충동적
  if(sec<8&&isOk)return'fluent';           // 빠름+정답: 자동화/숙달
  if(sec>=30&&isOk)return'effortful';      // 느림+정답: 노력·신중
  if(sec>=30&&!isOk)return'struggling';   // 느림+오답: 어려움
  return'moderate';                         // 중간 (8~30s)
}

// 답안 수정 패턴 분류
function classifyRevision(revisionCount, isOk){
  if(revisionCount==null)return'unknown';
  if(revisionCount===0&&!isOk)return'fixated';            // 수정없음+오답: 오개념 고착 (가장 위험)
  if(revisionCount===0&&isOk)return'confident';           // 수정없음+정답: 확신 있는 정답
  if(revisionCount>=2&&isOk)return'uncertain_capable';   // 많이 바꿈+정답: 능력있지만 불안
  if(revisionCount>=2&&!isOk)return'searching';          // 많이 바꿈+오답: 개념 탐색 중
  return'reconsidered';                                   // 1회 수정 (정상적 재검토)
}
var gcdFn=(a,b)=>b===0?Math.abs(a):gcdFn(b,a%b);
var lcmFn=(a,b)=>(a*b)/gcdFn(a,b);
var randInt=(lo,hi)=>Math.floor(Math.random()*(hi-lo+1))+lo;
var pick=a=>a[Math.floor(Math.random()*a.length)];
var cl5=v=>Math.max(-5,Math.min(5,Math.round(v)));
var shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
var distFracStr=(num,denSq)=>{if(num===0)return"0";const sqI=Math.round(Math.sqrt(denSq));if(sqI*sqI===denSq){if(sqI===0)return"0";const g=gcdFn(num,sqI);const n=num/g,d=sqI/g;return d===1?String(n):`${n}/${d}`}return`${num}/√${denSq}`};
// ── 수식 표기 헬퍼 ──
// 분수 텍스트: "3/4" → "³⁄₄" 스타일 대신 가독성 위해 "3/4" 유지하되 앞뒤 공백 없이
// 선지에 표시될 때 렌더러에서 수식 클래스로 감쌈
var fmtFrac=(n,d)=>d===1?String(n):`${n}/${d}`;
// 루트 표기: √ 유니코드 + 숫자 (√25=5이면 5로, 아니면 √n)
var fmtSqrt=(n)=>{const s=Math.round(Math.sqrt(n));return s*s===n?String(s):`√${n}`;};
// 원 방정식 항 포맷: (x-h)² 형태
var fmtCircleTerm=(v,sym)=>{if(v===0)return`${sym}²`;if(v>0)return`(${sym}−${v})²`;return`(${sym}+${-v})²`;};
// 원 방정식 wrongs 생성기 (중복/정답 제외 보장)
var circleWrongs=(h,k,r2,correct,extras=[])=>{
  const r=Math.round(Math.sqrt(r2));
  const hEq=fmtCircleTerm(h,'x'),kEq=fmtCircleTerm(k,'y');
  const hWr=fmtCircleTerm(-h,'x'),kWr=fmtCircleTerm(-k,'y');
  const cands=[
    `${hWr}+${kEq}=${r2}`,       // x 부호 반전
    `${hEq}+${kWr}=${r2}`,       // y 부호 반전
    `${hEq}+${kEq}=${r}`,        // r² → r
    `${hEq}+${kEq}=${r2+r}`,     // r² + r
    ...extras
  ].map(String).filter(w=>w!==correct&&w!==undefined);
  return [...new Set(cands)].slice(0,3);
};
var eqSh=p=>p>0?`−${p}`:p<0?`+${-p}`:"";
var eqSg=q=>q>0?` + ${q}`:q<0?` − ${-q}`:"";

var getKSTMonday=()=>{
  const now=new Date();const kst=new Date(now.getTime()+9*60*60*1000);
  const day=kst.getUTCDay();const diff=day===0?-6:1-day;
  const mon=new Date(kst.getTime()+diff*24*60*60*1000);
  return`${mon.getUTCFullYear()}-${String(mon.getUTCMonth()+1).padStart(2,'0')}-${String(mon.getUTCDate()).padStart(2,'0')}`;
};

var weekDatesFrom=monday=>{
  const dates=[];
  for(let i=0;i<7;i++){
    const d=new Date(monday+'T00:00:00+09:00');d.setDate(d.getDate()+i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  }return dates;
};

/* ===== FIREBASE HELPERS ===== */
var saveUser=async(data)=>{try{await db.collection('users').doc(data.name).set(data,{merge:true})}catch(e){console.error(e)}};
var loadUser=async(name)=>{try{const d=await db.collection('users').doc(name).get();return d.exists?d.data():null}catch(e){return null}};
var saveLog=async(log)=>{try{await db.collection('math_logs').add(log)}catch(e){console.error(e)}};

