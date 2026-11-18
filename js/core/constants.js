// === js/core/constants.js ===
/* --------------------------------------------------------------------
   앱 전역 상수
   React 훅 구조분해 · 관리자 명단 · 요일 이름
   -------------------------------------------------------------------- */

var {useState,useRef,useCallback,useEffect,useMemo}=React;

var ADMIN_NAMES=['박소명','이은희','최시은','윤새별','신현섭','최예원'];

var DAY_KO=['월','화','수','목','금','토','일'];

/* 같은 운영자가 교사·파일럿·테스트 학생 화면을 빠르게 확인하는 계정 그룹.
   그룹 순서대로 전환하며, 계정은 Firestore users 에 미리 만들어져 있어야 한다. */
var QUICK_SWITCH_GROUPS=[['박소명','박소명_학생','테스트']];
var QUICK_SWITCH_PAIRS=QUICK_SWITCH_GROUPS; // 기존 툴팁/대시보드 참조 호환
/* 새 유형을 공개 전에 먼저 풀어 볼 수 있는 계정 (선생님의 학생 확인용 계정). 좌표 탭 openAt 참고 */
var PREVIEW_USERS=['박소명_학생','테스트'];
// 집합·명제와 이차부등식은 별도 지정 계정에만 공개한다.
var canAccessRestrictedPractice=name=>['박소명_학생','박소명'].includes(name);
function quickSwitchTarget(name){
  for(const group of QUICK_SWITCH_GROUPS){
    const i=group.indexOf(name);
    if(i>=0)return group[(i+1)%group.length];
  }
  return null;
}
