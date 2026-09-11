// === js/core/constants.js ===
/* --------------------------------------------------------------------
   앱 전역 상수
   React 훅 구조분해 · 관리자 명단 · 요일 이름
   -------------------------------------------------------------------- */

var {useState,useRef,useCallback,useEffect,useMemo}=React;

var ADMIN_NAMES=['박소명','이은희','최시은','윤새별','신현섭','최예원'];

var DAY_KO=['월','화','수','목','금','토','일'];

/* 같은 사람이 선생님 계정과 학생 계정을 둘 다 가진 경우, 로그아웃 없이 바로 오갈 수 있게 하는 짝.
   [선생님 이름, 학생 이름] 순서로 등록한다. 두 이름 모두 Firestore users 에 실제 계정이 있어야 한다.
   quickSwitchTarget(name) 은 그 이름의 짝(반대쪽)을 돌려주고, 등록되지 않은 이름이면 null. */
var QUICK_SWITCH_PAIRS=[['박소명','박소명_학생']];
function quickSwitchTarget(name){
  for(const[teacher,student]of QUICK_SWITCH_PAIRS){
    if(name===teacher)return student;
    if(name===student)return teacher;
  }
  return null;
}
