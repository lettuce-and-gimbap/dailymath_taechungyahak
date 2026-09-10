// === js/core/logMetrics.js ===
/* --------------------------------------------------------------------
   학습 로그 지표 계산
   유휴 시간 보정 · 망설임/수정 분류 · 문항 해시 (분석 화면의 재료)
   -------------------------------------------------------------------- */

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
