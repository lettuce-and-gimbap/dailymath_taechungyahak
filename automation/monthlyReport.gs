/* =====================================================================
   태청야학 수학반 · 월간 학습 기록지 메일 (Google Apps Script)

   무엇을 하나
   - 매달 1일 아침 8시~9시(한국 시간) 사이, **지난달 한 달** 동안 학생들이 앱에서 푼 기록을 모아
     선생님 Gmail로 보낸다.
   - 담는 것
     ① 학생별 정답률 순위 (내림차순)
     ② 세션(한 묶음) 당 평균 풀이 시간 — 학생별 · 문제 종류별
     ③ 학생마다 가장 빨리 푼 문제 / 가장 오래 걸린 문제 (실제 문항)
     ④ 학생별 요약 분석 — 앱의 '학생 맞춤형 학습 분석 리포트'와 같은 틀
        (현재 상태 · 학습 모멘텀 · 풀이 스타일(망설임 패턴) · 유휴 시간 · 강점 · 취약점 · 제언)
     ⑤ 추천 풀이 영역 — 앱 [문제풀기]·[좌표10] 메뉴에 실제로 있는 영역 중에서 자동으로 고른다

   어디에 두나
   - 아침 브리핑(dailyBriefing.gs)과 **같은 Apps Script 프로젝트**에 파일을 하나 더 만들어 붙여 넣는다.
     CONFIG · 받는 사람(me_/mail_) · Firestore 읽기(fetchLogsSince_/fetchStudents_) · 날짜 도우미는
     dailyBriefing.gs 의 것을 그대로 쓴다 (같은 프로젝트의 .gs 파일은 전역을 함께 쓴다).
   - 그래서 이 파일만 따로 새 프로젝트에 붙이면 동작하지 않는다.

   설치 (처음 한 번)
   1. 브리핑 프로젝트 편집기 → 왼쪽 [파일 +] → 스크립트 → 이름 monthlyReport
   2. 이 파일 전체를 붙여 넣고 저장
   3. 위쪽 함수 목록에서 setupMonthly 선택 → ▶ 실행
      → 매월 1일 예약이 걸리고, 이번 달 지금까지의 기록으로 [미리보기] 메일이 한 통 온다.
   끄려면 removeMonthlyTrigger, 다시 켜려면 installMonthlyTrigger.
   ===================================================================== */

var MONTHLY = {
  SEND_HOUR: 8,          // 매달 1일 이 시각부터 1시간 안에 실행 → 8시~9시 도착
  STRONG_RATE: 90,       // 앱 리포트와 같은 기준 : 90% 이상 = 강점
  WEAK_RATE: 80,         //                        80% 미만 = 보충 대상
  MIN_AREA_Q: 5,         // 영역을 판단하려면 그 영역 문항이 이만큼은 있어야 한다
  FEW_Q: 20,             // 한 달 문항이 이보다 적으면 순위표에 '문항 적음' 표시
  IDLE_PER_Q: 180,       // 앱 logMetrics.js IDLE_THRESHOLD_PER_Q 와 같다 (문항당 3분 초과분 = 유휴 추정)
  SENDER_NAME: '태청야학 수학반 월간 기록'
};

/* ─────────────────────────── 진입점 ─────────────────────────── */

/** ▶ 설치·점검 한 번에 — 이 파일에서 맨 위 함수로 둔다 (함수 목록 기본 선택) */
function setupMonthly() {
  installMonthlyTrigger();
  previewThisMonth();
  Logger.log('──── 월간 기록지 설치 완료. 매월 1일 ' + MONTHLY.SEND_HOUR + '시~' + (MONTHLY.SEND_HOUR + 1)
    + '시 사이에 지난달 기록이 옵니다. 메일함에 [미리보기] 메일이 왔는지 확인하세요. ────');
}

/** 트리거가 매달 1일에 부르는 함수 — 지난달 1일 ~ 말일 */
function sendMonthlyReport() {
  ensureMonthlyTrigger_();
  try {
    var p = lastMonthRange_(new Date());
    sendMonthly_(monthlyFor_(p), '');
  } catch (e) {
    notifyMonthlyFailure_(e);
    throw e;
  }
}

/** 지난달 기록으로 지금 바로 한 통 */
function previewMonthlyReport() {
  ensureMonthlyTrigger_();
  sendMonthly_(monthlyFor_(lastMonthRange_(new Date())), '[미리보기] ');
}

/** 이번 달 1일 ~ 오늘 기록으로 지금 바로 한 통 (달 중간에 내용을 확인할 때) */
function previewThisMonth() {
  ensureMonthlyTrigger_();
  var now = new Date();
  sendMonthly_(monthlyFor_({ from: fmt_(now, 'yyyy-MM-01'), to: fmt_(now, 'yyyy-MM-dd'), partial: true }), '[미리보기] ');
}

/** 보내기 — Gmail 은 본문이 약 102KB 를 넘으면 뒷부분을 잘라 '메시지 잘림'으로 보여 준다.
    학생이 많은 달에 대비해, 90KB 를 넘으면 전체 기록지를 .html 첨부로 함께 보낸다. */
function sendMonthly_(r, prefix) {
  var opt = { to: me_(), subject: prefix + r.subject, htmlBody: r.html };
  if (r.html.length > 90000) {
    opt.htmlBody = '<p style="font-family:sans-serif;font-size:13px;color:#A8382F">기록지가 길어 메일 아래쪽이 잘릴 수 있습니다. '
      + '잘리면 첨부한 <b>월간기록지.html</b> 을 열어 보세요.</p>' + r.html;
    opt.attachments = [Utilities.newBlob('<meta charset="utf-8">' + r.html, 'text/html', '월간기록지_' + r.month + '.html')];
  }
  MailApp.sendEmail(monthlyMail_(opt));
  Logger.log('보냈습니다 → ' + opt.to + ' / ' + opt.subject + ' (' + Math.round(r.html.length / 1024) + 'KB)');
}

/** 매월 1일 8시~9시 예약 (같은 예약이 있으면 지우고 하나만 남긴다) */
function installMonthlyTrigger() {
  removeMonthlyTrigger();
  PropertiesService.getScriptProperties().deleteProperty('MONTHLY_AUTO_OFF');
  ScriptApp.newTrigger('sendMonthlyReport')
    .timeBased().onMonthDay(1).atHour(MONTHLY.SEND_HOUR).nearMinute(0).inTimezone(CONFIG.TZ).create();
}

/** 예약 끄기 — 끈 상태를 기억해 다른 함수를 눌러도 다시 켜지지 않게 한다 (아침 브리핑과 같은 방식) */
function removeMonthlyTrigger() {
  PropertiesService.getScriptProperties().setProperty('MONTHLY_AUTO_OFF', '1');
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendMonthlyReport') ScriptApp.deleteTrigger(t);
  });
}

function ensureMonthlyTrigger_() {
  try {
    if (PropertiesService.getScriptProperties().getProperty('MONTHLY_AUTO_OFF') === '1') return;
    var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sendMonthlyReport'; });
    if (!has) {
      ScriptApp.newTrigger('sendMonthlyReport')
        .timeBased().onMonthDay(1).atHour(MONTHLY.SEND_HOUR).nearMinute(0).inTimezone(CONFIG.TZ).create();
      Logger.log('매월 1일 ' + MONTHLY.SEND_HOUR + '시 예약이 없어서 새로 걸었습니다.');
    }
  } catch (e) { Logger.log('월간 예약 확인 실패: ' + e.message); }
}

function monthlyMail_(opt) {
  var b = bcc_();
  if (b) opt.bcc = b;
  opt.name = MONTHLY.SENDER_NAME;
  return opt;
}

function notifyMonthlyFailure_(e) {
  try {
    MailApp.sendEmail({
      to: me_(),
      subject: '[태청야학 수학반] 월간 기록지를 만들지 못했습니다',
      htmlBody: '<div style="font-family:sans-serif;font-size:14px;line-height:1.7">'
        + '이번 달 월간 기록지를 만드는 중에 문제가 생겨 메일을 보내지 못했습니다.<br>'
        + 'Apps Script 편집기에서 previewMonthlyReport 를 ▶ 실행하면 지난달 기록지를 다시 받을 수 있습니다.'
        + '<pre style="background:#F3F4F1;padding:10px;font-size:12px;white-space:pre-wrap">'
        + (e && e.message ? e.message : String(e)) + '</pre></div>',
      name: MONTHLY.SENDER_NAME
    });
  } catch (ignore) {}
}

/** 기간 하나의 기록을 읽어 보고서를 만든다 */
function monthlyFor_(p) {
  var logs = fetchLogsSince_(p.from).filter(function (l) { return l.date && l.date <= p.to; });
  return buildMonthly_(logs, fetchStudents_(), p, new Date());
}

/** 지난달 1일 ~ 말일 ('YYYY-MM-DD') */
function lastMonthRange_(now) {
  var y = Number(fmt_(now, 'yyyy')), m = Number(fmt_(now, 'M'));   // m : 이번 달(1~12)
  var py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
  var last = new Date(Date.UTC(py, pm, 0)).getUTCDate();          // 지난달 말일
  var mm = (pm < 10 ? '0' : '') + pm;
  return { from: py + '-' + mm + '-01', to: py + '-' + mm + '-' + last, partial: false };
}

/* ─────────────────────────── 영역 · 추천 목록 ───────────────────────────
   앱 메뉴에 실제로 있는 영역만 추천한다. 문항의 meta 로 어느 영역인지 가른다.
   - 좌표10          : js/student/coordDaily.js  (meta.type = 좌표 읽기 / 평행이동 / 대칭이동)
   - 중졸 검정고시 연습 : js/generators/middle.js   (meta.level = 'middle', meta.type = 5개 영역)
   - 고졸 검정고시 연습 : js/generators/high/*.js    (meta.type = 5개 영역)
   ────────────────────────────────────────────────────────────────── */

var MONTHLY_AREAS = [
  { key: 'c_low',  track: 'coord', label: '좌표 읽기',        path: '좌표10 → 하',                    note: '고졸 10~14번의 첫걸음' },
  { key: 'c_mid',  track: 'coord', label: '평행이동',          path: '좌표10 → 중',                    note: '고졸 10~14번' },
  { key: 'c_high', track: 'coord', label: '대칭이동',          path: '좌표10 → 상',                    note: '고졸 10~14번' },
  { key: 'm_num',  track: 'mid',   label: '중졸 · 수와 연산',     path: '문제풀기 → 중졸 검정고시 연습 → 수와 연산',   note: '소인수분해 · 순환소수 · 지수' },
  { key: 'm_alg',  track: 'mid',   label: '중졸 · 문자와 식',     path: '문제풀기 → 중졸 검정고시 연습 → 문자와 식',   note: '일차·연립·이차방정식 · 부등식 · 근호' },
  { key: 'm_fn',   track: 'mid',   label: '중졸 · 함수',        path: '문제풀기 → 중졸 검정고시 연습 → 함수',       note: '일차함수 · 이차함수 · 사분면 · 이동' },
  { key: 'm_geo',  track: 'mid',   label: '중졸 · 기하',        path: '문제풀기 → 중졸 검정고시 연습 → 기하',       note: '닮음 · 삼각비 · 원주각 · 평행선' },
  { key: 'm_st',   track: 'mid',   label: '중졸 · 확률과 통계',   path: '문제풀기 → 중졸 검정고시 연습 → 확률과 통계',  note: '경우의 수 · 확률 · 대푯값' },
  { key: 'h_poly', track: 'high',  label: '고졸 · 다항식 계산',   path: '문제풀기 → 고졸 검정고시 연습 → 다항식 계산',  note: '1~5번', weight: 5 },
  { key: 'h_eq',   track: 'high',  label: '고졸 · 방정식과 부등식', path: '문제풀기 → 고졸 검정고시 연습 → 방정식과 부등식', note: '6~9번', weight: 4 },
  { key: 'h_geo',  track: 'high',  label: '고졸 · 도형과 기하',   path: '문제풀기 → 고졸 검정고시 연습 → 도형과 기하',  note: '10~14번', weight: 5 },
  { key: 'h_set',  track: 'high',  label: '고졸 · 집합과 함수',   path: '문제풀기 → 고졸 검정고시 연습 → 집합과 함수',  note: '15~18번', weight: 4 },
  { key: 'h_st',   track: 'high',  label: '고졸 · 확률과 통계',   path: '문제풀기 → 고졸 검정고시 연습 → 확률과 통계',  note: '19~20번', weight: 2 },
  { key: 'arith',  track: 'base',  label: '기초 연산',          path: '문제풀기 → 나눗셈 · 약수',              note: '사칙연산 · 약수' }
];

/* 다음 단계 : 이 영역을 잘하면(≥85%) 저 영역으로 */
var MONTHLY_NEXT = {
  c_low: 'c_mid', c_mid: 'c_high', c_high: 'h_geo',
  m_num: 'h_poly', m_alg: 'h_eq', m_fn: 'h_set', m_geo: 'h_geo', m_st: 'h_st', arith: 'm_num'
};
/* 기초 다지기 : 이 영역이 많이 어려우면(<50%) 한 단계 아래에서 */
var MONTHLY_BASE = {
  h_poly: 'm_alg', h_eq: 'm_alg', h_geo: 'c_mid', h_set: 'm_fn', h_st: 'm_st', c_high: 'c_mid', c_mid: 'c_low'
};

function areaOf_(q, logType) {
  var m = (q && q.meta) || {}, t = m.type || '';
  if (m.level === 'middle' || /^mid_/.test(m.category || '')) {
    return { '수와 연산': 'm_num', '문자와 식': 'm_alg', '함수': 'm_fn', '기하': 'm_geo', '확률과 통계': 'm_st' }[t] || null;
  }
  if (/^좌표 10문제/.test(logType || '')) return { '좌표 읽기': 'c_low', '평행이동': 'c_mid', '대칭이동': 'c_high' }[t] || null;
  var high = { '다항식 계산': 'h_poly', '방정식과 부등식': 'h_eq', '도형과 기하': 'h_geo', '집합과 함수': 'h_set', '확률과 통계': 'h_st' }[t];
  if (high) return high;
  if (t === '좌표 읽기') return 'c_low';
  if (t === '평행이동') return 'c_mid';
  if (t === '대칭이동') return 'c_high';
  if (t === '연산' || m.category === 'math' || m.category === 'div') return 'arith';
  return null;
}
function areaInfo_(key) {
  for (var i = 0; i < MONTHLY_AREAS.length; i++) if (MONTHLY_AREAS[i].key === key) return MONTHLY_AREAS[i];
  return null;
}

/* ─────────────────────────── 앱 분석 엔진과 같은 계산 ───────────────────────────
   js/core/logMetrics.js · js/teacher/analysisEngine.js 의 기준을 그대로 옮겼다.
   앱 쪽 기준을 바꾸면 여기도 함께 바꾼다. */

function classifyHesitation_(firstClickMs, isOk) {
  if (firstClickMs == null) return 'unknown';
  var sec = firstClickMs / 1000;
  if (sec < 8 && !isOk) return 'impulsive';
  if (sec < 8 && isOk) return 'fluent';
  if (sec >= 30 && isOk) return 'effortful';
  if (sec >= 30 && !isOk) return 'struggling';
  return 'moderate';
}
var HES_LABEL = {
  fluent:     { lbl: '숙달',     tip: '빠르고 정확하게 푼다 — 개념이 손에 익었다' },
  moderate:   { lbl: '보통',     tip: '적당히 생각하고 답한다' },
  effortful:  { lbl: '신중·노력', tip: '오래 생각해서 맞힌다 — 집중해서 푸는 편' },
  impulsive:  { lbl: '서두름',   tip: '빨리 고르고 틀린다 — 문제를 끝까지 읽지 않고 고를 때가 있다' },
  struggling: { lbl: '어려움',   tip: '오래 생각했는데도 틀린다 — 개념에서 막힌다' }
};

function estimateActive_(totalSec, qCount) {
  if (!totalSec || !qCount) return { active: totalSec || 0, idle: 0, flagged: false };
  var max = qCount * MONTHLY.IDLE_PER_Q;
  return totalSec > max ? { active: max, idle: totalSec - max, flagged: true } : { active: totalSec, idle: 0, flagged: false };
}

/* 한 번에 여러 문항을 보여 주는 형식(모의고사·기하 퀴즈)은 문항별 시간이 아니라 '첫 선택까지 걸린 시간'이다.
   가장 빠른/느린 문제와 풀이 스타일은 한 문제씩 푸는 형식에서만 뽑는다. */
function isListFormat_(type) { return /모의고사|기하:|약점/.test(type || ''); }

/* ─────────────────────────── 보고서 만들기 (순수 함수) ─────────────────────────── */

/**
 * @param logs     기간 안의 math_logs
 * @param students users 명단 (name · role · lastDate)
 * @param p        {from, to, partial}
 * @param now      만든 시각
 */
function buildMonthly_(logs, students, p, now) {
  var admins = {};
  students.forEach(function (s) { if (s.role === 'admin') admins[s.name] = true; });
  var skip = function (n) { return !n || admins[n] || CONFIG.EXCLUDE_NAMES.indexOf(n) >= 0; };

  /* [다음] 연타로 같은 기록이 두 번 저장된 경우가 있었다(2026-09 고침) — 이름·날짜·시각·종류·점수가 모두 같으면 한 번만 센다 */
  var seen = {};
  logs = logs.filter(function (l) {
    if (skip(l.studentName)) return false;
    var k = [l.studentName, l.date, l.time, l.type, l.score, (l.questions || []).length].join('|');
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });

  var lastDate = {};
  students.forEach(function (s) { lastDate[s.name] = s.lastDate; });
  var monthLabel = monthLabel_(p);
  var today = fmt_(now, 'yyyy-MM-dd');

  if (!logs.length) {
    var hh = mShell_(monthLabel + ' 월간 학습 기록지', rangeText_(p));
    hh += '<div style="background:#F3F4F1;border-left:4px solid #B7BCB0;padding:14px 16px;font-size:15px">'
      + '<b>데이터 없음</b><br><span style="color:#4B534C">이 기간에 앱에 남은 문제풀이 기록이 없습니다.</span></div>';
    return { subject: '[태청야학 수학반] ' + monthLabel + ' 월간 학습 기록지 — 데이터 없음', html: hh + mFoot_(), month: p.from.slice(0, 7), stats: { students: 0 } };
  }

  var byStu = groupBy_(logs, 'studentName');
  var rows = Object.keys(byStu).map(function (name) {
    return studentStats_(name, byStu[name], lastDate[name], today);
  });
  // ① 정답률 내림차순 (같으면 많이 푼 사람 먼저)
  rows.sort(function (a, b) { return (b.rate - a.rate) || (b.q - a.q); });

  var totQ = 0, totOk = 0, totSess = 0, totSec = 0, totActive = 0, totIdle = 0;
  rows.forEach(function (r) { totQ += r.q; totOk += r.ok; totSess += r.sessions; totSec += r.sec; totActive += r.active; totIdle += r.idle; });
  var totRate = totQ ? Math.round(totOk / totQ * 100) : 0;
  var timedSess = rows.reduce(function (s, r) { return s + r.timedSessions; }, 0);

  var subject = '[태청야학 수학반] ' + monthLabel + ' 월간 학습 기록지 — '
    + rows.length + '명 · ' + totQ + '문항 · 정답률 ' + totRate + '%';

  var h = mShell_(monthLabel + ' 월간 학습 기록지', rangeText_(p) + ' 앱에 남은 기록 전부입니다.');

  h += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 8px"><tr>'
    + kpi_('참여 학생', rows.length + '명', '')
    + kpi_('푼 문항', totQ + '개', totSess + '세션')
    + kpi_('정답률', totRate + '%', '')
    + kpi_('세션당 평균', mmss_(timedSess ? totSec / timedSess : 0), '집중 ' + mmss_(timedSess ? totActive / timedSess : 0) + ' 추정')
    + '</tr></table>';
  if (p.partial) h += '<p style="margin:0 0 6px;color:#A8382F;font-size:12px">※ 달이 끝나기 전 미리보기입니다. 정식 기록지는 다음 달 1일에 옵니다.</p>';

  /* ① 순위 */
  h += sec_('① 학생별 정답률 순위');
  h += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px">'
    + '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
    + th_('순위', 'center') + th_('학생') + th_('정답률') + th_('맞힘 / 문항', 'center') + th_('세션 · 참여일', 'center') + th_('지난 한 달 흐름')
    + '</tr>';
  var rank = 0, prev = null;
  rows.forEach(function (r, i) {
    if (prev === null || r.rate !== prev) rank = i + 1;
    prev = r.rate;
    h += '<tr style="border-bottom:1px solid #DCDED4">'
      + td_('<b>' + rank + '</b>', 'center')
      + td_('<b>' + esc_(r.name) + '</b>' + (r.q < MONTHLY.FEW_Q ? '<br><span style="color:#7C837C;font-size:11px">문항 적음</span>' : ''))
      + td_('<b style="color:' + rateColor_(r.rate) + ';font-size:15px">' + r.rate + '%</b>' + bar_(r.rate))
      + td_(r.ok + ' / ' + r.q, 'center')
      + td_(r.sessions + '회 · ' + r.days + '일', 'center')
      + td_(momentumText_(r.momentum))
      + '</tr>';
  });
  h += '</table>';

  /* ② 세션당 평균 시간 */
  h += sec_('② 세션(한 묶음)당 평균 풀이 시간');
  h += '<p style="margin:0 0 8px;color:#7C837C;font-size:12px">세션 = 한 번 들어와서 푼 한 묶음(보통 10문제). '
    + '집중 시간은 앱 분석과 같은 방식으로, 문항당 3분을 넘긴 부분을 자리 비움(유휴)으로 보고 뺀 추정값입니다.</p>';
  h += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px">'
    + '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
    + th_('학생') + th_('세션당 평균', 'center') + th_('집중(추정)', 'center') + th_('문항당', 'center') + th_('유휴 감지', 'center')
    + '</tr>';
  rows.slice().sort(function (a, b) { return b.avgSess - a.avgSess; }).forEach(function (r) {
    h += '<tr style="border-bottom:1px solid #DCDED4">'
      + td_('<b>' + esc_(r.name) + '</b>')
      + td_(r.timedSessions ? mmss_(r.avgSess) : '—', 'center')
      + td_(r.timedSessions ? mmss_(r.avgActive) : '—', 'center')
      + td_(r.perQ != null ? r.perQ + '초' : '—', 'center')
      + td_(r.flagged ? '<span style="color:#7E6420">' + r.flagged + '회 · ' + Math.round(r.idle / 60) + '분</span>' : '<span style="color:#2A6E4C">없음</span>', 'center')
      + '</tr>';
  });
  h += '</table>';
  var byType = typeTimes_(logs);
  if (byType.length) {
    h += '<div style="font-size:13px;font-weight:700;margin:14px 0 6px">문제 종류별</div>'
      + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px">'
      + '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">' + th_('종류') + th_('세션', 'center') + th_('세션당 평균', 'center') + th_('문항당', 'center') + th_('정답률', 'center') + '</tr>';
    byType.forEach(function (t) {
      h += '<tr style="border-bottom:1px solid #DCDED4">' + td_(esc_(t.type)) + td_(t.n + '회', 'center') + td_(mmss_(t.avg), 'center')
        + td_(t.perQ != null ? t.perQ + '초' : '—', 'center') + td_('<span style="color:' + rateColor_(t.rate) + '">' + t.rate + '%</span>', 'center') + '</tr>';
    });
    h += '</table>';
  }

  /* ③ 가장 빠른 / 가장 오래 걸린 문제 */
  h += sec_('③ 학생별 가장 빨리 푼 문제 · 가장 오래 걸린 문제');
  h += '<p style="margin:0 0 8px;color:#7C837C;font-size:12px">한 문제씩 푸는 화면(문제풀기·좌표10)의 문항별 시간 기준입니다. '
    + '가장 빠른 문제는 <b>맞힌 문제</b> 중에서 골랐습니다(빨리 찍어 틀린 문제는 제외).</p>';
  rows.forEach(function (r) {
    if (!r.fast && !r.slow) return;
    h += '<div style="border:1px solid #DCDED4;margin:0 0 10px;font-size:13px">'
      + '<div style="background:#F3F4F1;padding:6px 10px;font-weight:700">' + esc_(r.name) + '</div>'
      + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">'
      + (r.fast ? qRow_('⚡ 가장 빨리', r.fast, '#2A6E4C') : '')
      + (r.slow ? qRow_('🐢 가장 오래', r.slow, '#A8382F') : '')
      + '</table></div>';
  });

  /* ④ 학생별 요약 분석 + ⑤ 추천 */
  h += sec_('④ 학생별 요약 분석 · ⑤ 추천 풀이 영역');
  h += '<p style="margin:0 0 10px;color:#7C837C;font-size:12px">앱 선생님 화면의 「학생 맞춤형 학습 분석 리포트」와 같은 기준입니다 — '
    + '강점 ' + MONTHLY.STRONG_RATE + '% 이상 · 보충 ' + MONTHLY.WEAK_RATE + '% 미만 · 영역마다 ' + MONTHLY.MIN_AREA_Q + '문항 이상일 때만 판단. '
    + '풀이 스타일은 첫 선택까지 걸린 시간(8초 미만 = 빠름, 30초 이상 = 느림)과 정답 여부로 나눕니다. '
    + '추천은 앱 메뉴에 있는 영역 중에서 자동으로 골랐습니다.</p>';
  rows.forEach(function (r) { h += studentCard_(r); });

  /* 반 전체 영역 */
  var area = classAreas_(logs);
  if (area.length) {
    h += sec_('참고 · 반 전체 영역별 정답률');
    h += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px">'
      + '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">' + th_('영역') + th_('검정고시') + th_('문항', 'center') + th_('정답률') + '</tr>';
    area.forEach(function (a) {
      h += '<tr style="border-bottom:1px solid #DCDED4">' + td_(esc_(a.info.label)) + td_('<span style="color:#7C837C">' + esc_(a.info.note) + '</span>')
        + td_(a.n, 'center') + td_('<b style="color:' + rateColor_(a.rate) + '">' + a.rate + '%</b>' + bar_(a.rate)) + '</tr>';
    });
    h += '</table>';
  }

  h += mFoot_();
  return { subject: subject, html: h, month: p.from.slice(0, 7), stats: { students: rows.length, q: totQ, rate: totRate } };
}

/* 학생 한 명의 한 달 */
function studentStats_(name, logs, lastDate, today) {
  var s = { name: name, sessions: logs.length, q: 0, ok: 0, sec: 0, active: 0, idle: 0, flagged: 0, timedSessions: 0,
    qTimeSum: 0, qTimeN: 0, days: Object.keys(groupBy_(logs, 'date')).length, area: {}, sub: {},
    hes: { fluent: 0, moderate: 0, effortful: 0, impulsive: 0, struggling: 0 }, hesN: 0,
    rev: { fixated: 0, uncertain: 0, n: 0 }, fast: null, slow: null };

  logs.forEach(function (l) {
    var qs = (l.questions || []).filter(function (q) { return q && typeof q === 'object'; });
    var list = isListFormat_(l.type);
    s.q += qs.length;
    var sec = Number(l.totalSec) || 0;
    if (sec > 0 && qs.length) {
      var a = estimateActive_(sec, qs.length);
      s.sec += sec; s.active += a.active; s.idle += a.idle; s.timedSessions++;
      if (a.flagged) s.flagged++;
    }
    qs.forEach(function (q) {
      if (q.isOk) s.ok++;
      var ak = areaOf_(q, l.type);
      if (ak) {
        var A = s.area[ak] = s.area[ak] || { n: 0, ok: 0 };
        A.n++; if (q.isOk) A.ok++;
      }
      if (q.topic && !q.isOk) s.sub[q.topic] = (s.sub[q.topic] || 0) + 1;    // 고졸·중졸 세부 유형(틀린 것)
      if (list) {
        if (q.revisionCount != null) {
          s.rev.n++;
          if (q.revisionCount === 0 && !q.isOk) s.rev.fixated++;
          if (q.revisionCount >= 2 && q.isOk) s.rev.uncertain++;
        }
        return;
      }
      var c = classifyHesitation_(q.firstClickMs, q.isOk);
      if (c !== 'unknown') { s.hes[c]++; s.hesN++; }
      var t = Number(q.timeSec);
      if (!(t > 0)) return;
      s.qTimeSum += t; s.qTimeN++;
      var item = { t: t, q: q, date: l.date, type: l.type };
      if (q.isOk && (!s.fast || t < s.fast.t)) s.fast = item;
      if (!s.slow || t > s.slow.t) s.slow = item;
    });
  });
  s.rate = s.q ? Math.round(s.ok / s.q * 100) : 0;
  s.avgSess = s.timedSessions ? s.sec / s.timedSessions : 0;
  s.avgActive = s.timedSessions ? s.active / s.timedSessions : 0;
  s.perQ = s.qTimeN ? Math.round(s.qTimeSum / s.qTimeN) : null;

  /* 학습 모멘텀 — analysisEngine.detectMomentum 과 같은 방식(최근 10세션을 반으로 나눠 비교) */
  var ordered = logs.slice().sort(function (a, b) { return ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')); });
  var accs = ordered.slice(0, 10).map(function (l) {
    var qs = (l.questions || []).filter(function (q) { return q && typeof q === 'object'; });
    return qs.length ? Math.round(qs.filter(function (q) { return q.isOk; }).length / qs.length * 100) : null;
  }).filter(function (v) { return v !== null; });
  if (accs.length < 3) s.momentum = { trend: 'insufficient' };
  else {
    var half = Math.floor(accs.length / 2);
    var avg = function (arr) { return arr.reduce(function (x, y) { return x + y; }, 0) / arr.length; };
    var recent = avg(accs.slice(0, half)), older = avg(accs.slice(half));
    var d = Math.round(recent - older);
    s.momentum = { trend: d >= 8 ? 'rising' : d <= -8 ? 'declining' : 'stable', delta: d, recent: Math.round(recent), older: Math.round(older) };
  }

  /* 현재 상태 — analysisEngine.analyzeStudent 와 같은 신호등 */
  var gap = dayGap_(lastDate || ordered[0].date, today);
  var recentQs = [];
  ordered.slice(0, 3).forEach(function (l) { (l.questions || []).forEach(function (q) { if (q && typeof q === 'object') recentQs.push(q); }); });
  var recentAcc = recentQs.length ? Math.round(recentQs.filter(function (q) { return q.isOk; }).length / recentQs.length * 100) : 100;
  s.gap = gap; s.recentAcc = recentAcc;
  s.status = (gap >= 5 || (recentAcc > 0 && recentAcc < 40)) ? { icon: '🔴', text: '집중 케어 필요', col: '#A8382F' }
    : (gap >= 3 || (recentAcc >= 40 && recentAcc < 70)) ? { icon: '🟡', text: '격려 필요', col: '#7E6420' }
    : { icon: '🟢', text: '순항 중', col: '#2A6E4C' };

  /* 영역 → 강점 / 취약 */
  s.areas = Object.keys(s.area).map(function (k) {
    var A = s.area[k];
    return { key: k, info: areaInfo_(k), n: A.n, ok: A.ok, rate: Math.round(A.ok / A.n * 100) };
  });
  var judged = s.areas.filter(function (a) { return a.n >= MONTHLY.MIN_AREA_Q; });
  s.strong = judged.filter(function (a) { return a.rate >= MONTHLY.STRONG_RATE; }).sort(function (a, b) { return b.rate - a.rate || b.n - a.n; });
  s.weak = judged.filter(function (a) { return a.rate < MONTHLY.WEAK_RATE; }).sort(function (a, b) { return a.rate - b.rate; });
  s.subWeak = Object.keys(s.sub).map(function (k) { return { topic: k, n: s.sub[k] }; })
    .filter(function (x) { return x.n >= 2; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 3);

  s.recs = recommend_(s);
  return s;
}

/* ⑤ 추천 — 최대 3개. 순서 : 다시 다지기 → 다음 단계 → 새로 도전 */
function recommend_(s) {
  var out = [], used = {};
  var byKey = {};
  s.areas.forEach(function (a) { byKey[a.key] = a; });
  var add = function (key, kind, why) {
    if (!key || used[key] || out.length >= 3) return;
    var info = areaInfo_(key);
    if (!info) return;
    used[key] = true;
    out.push({ kind: kind, info: info, why: why });
  };

  // 1) 다시 다지기 : 판단할 만큼 풀었는데 80% 미만 — 가장 낮은 것부터. 50% 미만이면 한 단계 아래를 먼저
  s.weak.forEach(function (a) {
    if (a.rate < 50 && MONTHLY_BASE[a.key] && !(byKey[MONTHLY_BASE[a.key]] && byKey[MONTHLY_BASE[a.key]].rate < 50)) {
      add(MONTHLY_BASE[a.key], '기초 다지기', a.info.label + ' 정답률 ' + a.rate + '% — 한 단계 아래에서 먼저 자신감을 쌓기');
    }
    add(a.key, '다시 다지기', '정답률 ' + a.rate + '% (' + a.ok + '/' + a.n + ')');
  });

  // 2) 다음 단계 : 85% 이상 잘하는 영역의 다음 영역이 아직 없거나 적게 풀었으면
  s.areas.filter(function (a) { return a.n >= 10 && a.rate >= 85; })
    .sort(function (a, b) { return b.rate - a.rate; })
    .forEach(function (a) {
      var nx = MONTHLY_NEXT[a.key];
      if (!nx) return;
      var done = byKey[nx];
      if (!done || done.n < MONTHLY.MIN_AREA_Q) add(nx, '다음 단계', a.info.label + ' ' + a.rate + '% — 한 단계 올려 보기');
    });

  // 3) 새로 도전 : 보충할 영역이 없을 때만 — 아직 안 푼 영역을 쉬운 것부터.
  //    좌표10을 하는 학생은 좌표 하→중→상 → 고졸 도형과 기하(좌표와 바로 이어짐) → 나머지 고졸 영역(배점 큰 순)
  //    중졸 연습만 한 학생은 중졸 영역 안에서.
  if (s.weak.length) return out;
  var didMid = s.areas.some(function (a) { return a.info && a.info.track === 'mid'; });
  var didHigh = s.areas.some(function (a) { return a.info && a.info.track === 'high'; });
  var order = didMid && !didHigh
    ? ['m_num', 'm_alg', 'm_fn', 'm_geo', 'm_st']
    : ['c_low', 'c_mid', 'c_high', 'h_geo', 'h_poly', 'h_eq', 'h_set', 'h_st'];
  order.forEach(function (k) {
    var a = byKey[k];
    if (!a || a.n < MONTHLY.MIN_AREA_Q) add(k, '새로 도전', (a ? '이번 달 ' + a.n + '문항뿐' : '아직 기록 없음') + ' · ' + areaInfo_(k).note);
  });

  return out;
}

/* ④ 카드 */
function studentCard_(r) {
  var bits = [];
  var head = '<div style="border:1px solid #B7BCB0;margin:0 0 14px;font-size:13px;line-height:1.7">'
    + '<div style="background:#1F2421;color:#fff;padding:7px 12px">'
    + '<b style="font-size:15px">' + esc_(r.name) + '</b>'
    + '<span style="float:right;font-size:12px">' + r.status.icon + ' ' + r.status.text + '</span></div>'
    + '<div style="padding:10px 12px">';

  var line = function (label, body) {
    return '<tr><td style="width:92px;vertical-align:top;color:#7C837C;padding:3px 0;font-size:12px">' + label + '</td>'
      + '<td style="vertical-align:top;padding:3px 0">' + body + '</td></tr>';
  };
  var t = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">';

  t += line('한 달 요약', '정답률 <b style="color:' + rateColor_(r.rate) + '">' + r.rate + '%</b> (' + r.ok + '/' + r.q + ') · '
    + r.sessions + '세션 · ' + r.days + '일 참여 · 마지막 접속 ' + (r.gap === 0 ? '오늘' : r.gap + '일 전'));
  if (r.q < MONTHLY.FEW_Q) {       // 한 달에 한두 번만 푼 학생 — 자세한 분석은 믿기 어렵고 메일만 길어진다
    t += line('<b style="color:#1F2421">추천 영역</b>', recsHTML_(r.recs));
    return head + t + '</table><div style="color:#7C837C;font-size:11px;margin-top:4px">문항이 ' + MONTHLY.FEW_Q + '개보다 적어 자세한 분석은 생략했습니다.</div></div></div>';
  }
  t += line('학습 모멘텀', momentumText_(r.momentum));

  // 풀이 스타일
  var style;
  if (r.hesN < 20) style = '<span style="color:#7C837C">데이터 부족 (한 문제씩 푼 기록 ' + r.hesN + '문항)</span>';
  else {
    var order = ['fluent', 'moderate', 'effortful', 'impulsive', 'struggling'];
    var top = order.slice().sort(function (a, b) { return r.hes[b] - r.hes[a]; })[0];
    var pct = function (k) { return Math.round(r.hes[k] / r.hesN * 100); };
    style = '<b>' + HES_LABEL[top].lbl + '형</b> — ' + HES_LABEL[top].tip + '<br>'
      + '<span style="color:#7C837C;font-size:12px">' + order.filter(function (k) { return r.hes[k]; }).map(function (k) {
        return HES_LABEL[k].lbl + ' ' + pct(k) + '%';
      }).join(' · ') + '</span>';
    if (pct('impulsive') >= 15) bits.push('서두르다 틀리는 문항이 ' + pct('impulsive') + '%입니다. "문제 끝까지 읽고 고르기"를 한 번 더 약속해 주세요.');
    if (pct('struggling') >= 15) bits.push('오래 생각하고도 틀리는 문항이 ' + pct('struggling') + '%입니다. 문제를 더 주기보다 개념을 옆에서 한 번 더 짚어 주세요.');
  }
  t += line('풀이 스타일', style);

  // 유휴
  var idle;
  if (!r.timedSessions) idle = '<span style="color:#7C837C">시간 기록 없음</span>';
  else {
    idle = '세션당 ' + mmss_(r.avgSess) + ' 중 집중 ' + mmss_(r.avgActive) + ' 추정'
      + (r.perQ != null ? ' · 문항당 평균 ' + r.perQ + '초' : '')
      + (r.flagged ? '<br><span style="color:#7E6420">' + r.timedSessions + '세션 중 ' + r.flagged + '세션에서 자리 비움 추정(모두 ' + Math.round(r.idle / 60) + '분)</span>'
        : '<br><span style="color:#2A6E4C">자리 비움 없이 이어서 풀었습니다</span>');
    if (r.flagged && r.flagged / r.timedSessions >= 0.3) bits.push('세션 ' + Math.round(r.flagged / r.timedSessions * 100) + '%에서 중간에 자리를 비웠습니다. 10문제를 5문제씩 나눠 풀도록 권해 보세요.');
  }
  t += line('유휴 시간', idle);

  t += line('강점', r.strong.length ? r.strong.map(function (a) {
    return '<b style="color:#2A6E4C">' + esc_(a.info.label) + '</b> ' + a.rate + '%';
  }).join(' · ') : '<span style="color:#7C837C">' + MONTHLY.STRONG_RATE + '% 이상인 영역 없음</span>');
  t += line('취약점', (r.weak.length ? r.weak.map(function (a) {
    return '<b style="color:#A8382F">' + esc_(a.info.label) + '</b> ' + a.rate + '%';
  }).join(' · ') : '<span style="color:#2A6E4C">' + MONTHLY.WEAK_RATE + '% 미만인 영역 없음</span>')
    + (r.subWeak.length ? '<br><span style="color:#7C837C;font-size:12px">자주 틀린 세부 유형 : ' + r.subWeak.map(function (x) { return esc_(x.topic) + ' ' + x.n + '회'; }).join(' · ') + '</span>' : ''));
  if (r.rev.n >= 5) {
    t += line('답 고치기', (r.rev.fixated ? '고치지 않고 틀린 문항 ' + r.rev.fixated + '개(오개념 고착 의심)' : '고착형 오답 없음')
      + (r.rev.uncertain ? ' · 맞혀 놓고도 두 번 이상 바꾼 문항 ' + r.rev.uncertain + '개' : ''));
    if (r.rev.uncertain) bits.push('맞게 생각해 놓고 답을 바꾸는 일이 있습니다. "처음 생각이 맞았어요"라는 칭찬을 자주 해 주세요.');
  }

  // 제언 (앱 리포트의 '종합 교수자 피드백 제언' 틀)
  if (r.weak.length) bits.unshift('<b>단기 목표</b> — ' + r.weak.slice(0, 2).map(function (a) { return esc_(a.info.label); }).join(', ') + ' 보충. 오답 문제지로 틀린 문항을 다시 풀게 해 주세요.');
  if (r.strong.length) bits.push('<b>강점 활용</b> — ' + esc_(r.strong[0].info.label) + '부터 칭찬하고 시작하면 어려운 영역도 덜 부담스러워합니다.');
  if (r.momentum.trend === 'declining' && r.momentum.recent < MONTHLY.WEAK_RATE) bits.push('최근 세션 정답률이 ' + Math.abs(r.momentum.delta) + '%p 내려갔습니다. 난이도를 한 단계 낮춰 자신감을 먼저 되찾게 해 주세요.');
  if (r.gap >= 5) bits.push('마지막 접속이 ' + r.gap + '일 전입니다. 안부 한마디가 가장 좋은 처방입니다.');
  if (bits.length) t += line('제언', '<ul style="margin:0;padding-left:16px">' + bits.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>');

  t += line('<b style="color:#1F2421">추천 영역</b>', recsHTML_(r.recs));
  return head + t + '</table></div></div>';
}

/* ⑤ 추천 목록 */
function recsHTML_(recs) {
  var kc = { '다시 다지기': '#A8382F', '기초 다지기': '#7E6420', '다음 단계': '#2A6E4C', '새로 도전': '#2F5E8C' };
  return recs.length ? recs.map(function (x) {
    return '<div style="margin:0 0 4px"><span style="font-size:11px;color:#fff;background:' + (kc[x.kind] || '#4B534C')
      + ';padding:0 5px;margin-right:5px">' + x.kind + '</span><b>' + esc_(x.info.label) + '</b>'
      + ' <span style="color:#7C837C;font-size:12px">' + esc_(x.why) + '<br>앱 : ' + esc_(x.info.path) + '</span></div>';
  }).join('') : '<span style="color:#7C837C">추천할 영역 없음</span>';
}

/* ③ 문항 한 줄 */
function qRow_(label, it, col) {
  var q = it.q;
  var text = q.qFull || q.qTxt || q.topic || '(문항 내용 없음)';
  text = String(text).replace(/\s+/g, ' ');
  if (text.length > 120) text = text.slice(0, 118) + '…';
  var ai = areaInfo_(areaOf_(q, it.type));
  var idle = it.t > MONTHLY.IDLE_PER_Q ? ' <span style="color:#7E6420;font-size:11px">(3분 넘음 — 자리 비움 포함 가능)</span>' : '';
  return '<tr style="border-top:1px solid #EDEFE9">'
    + '<td style="width:88px;vertical-align:top;padding:7px 10px;color:' + col + ';font-weight:700;white-space:nowrap">' + label + '<br>'
    + '<span style="font-size:15px">' + secText_(it.t) + '</span></td>'
    + '<td style="vertical-align:top;padding:7px 10px 7px 0">' + esc_(text)
    + '<br><span style="color:#7C837C;font-size:12px">' + krDate_(it.date) + ' · ' + esc_(it.type || '') + (ai ? ' · ' + esc_(ai.label) : '')
    + ' · 학생 답 ' + esc_(q.uAns == null ? '' : q.uAns) + (q.isOk ? ' <span style="color:#2A6E4C">✔</span>' : ' <span style="color:#A8382F">✘ 정답 ' + esc_(q.cAns == null ? '' : q.cAns) + '</span>')
    + '</span>' + idle + '</td></tr>';
}

/* 종류별 세션 시간 */
function typeTimes_(logs) {
  var g = {};
  logs.forEach(function (l) {
    var qs = (l.questions || []).filter(function (q) { return q && typeof q === 'object'; });
    var key = /^고졸|^중졸/.test(l.type || '') ? l.type : (l.type || '문제풀기');
    var T = g[key] = g[key] || { type: key, n: 0, sec: 0, timed: 0, q: 0, ok: 0, qt: 0, qtN: 0 };
    T.n++; T.q += qs.length;
    qs.forEach(function (q) {
      if (q.isOk) T.ok++;
      if (!isListFormat_(l.type) && Number(q.timeSec) > 0) { T.qt += Number(q.timeSec); T.qtN++; }
    });
    if (Number(l.totalSec) > 0) { T.sec += Number(l.totalSec); T.timed++; }
  });
  return Object.keys(g).map(function (k) {
    var T = g[k];
    return { type: T.type, n: T.n, avg: T.timed ? T.sec / T.timed : 0, perQ: T.qtN ? Math.round(T.qt / T.qtN) : null, rate: T.q ? Math.round(T.ok / T.q * 100) : 0 };
  }).filter(function (t) { return t.n >= 2; }).sort(function (a, b) { return b.n - a.n; });
}

function classAreas_(logs) {
  var g = {};
  logs.forEach(function (l) {
    (l.questions || []).forEach(function (q) {
      if (!q || typeof q !== 'object') return;
      var k = areaOf_(q, l.type);
      if (!k) return;
      var A = g[k] = g[k] || { n: 0, ok: 0 };
      A.n++; if (q.isOk) A.ok++;
    });
  });
  return MONTHLY_AREAS.filter(function (x) { return g[x.key] && g[x.key].n >= MONTHLY.MIN_AREA_Q; }).map(function (x) {
    return { info: x, n: g[x.key].n, rate: Math.round(g[x.key].ok / g[x.key].n * 100) };
  });
}

/* ─────────────────────────── 글자·HTML 조각 ─────────────────────────── */

function monthLabel_(p) { return Number(p.from.slice(0, 4)) + '년 ' + Number(p.from.slice(5, 7)) + '월'; }
function rangeText_(p) { return krDate_(p.from) + ' ~ ' + krDate_(p.to) + (p.partial ? ' (진행 중)' : ''); }
function mmss_(sec) {
  sec = Math.round(sec || 0);
  var m = Math.floor(sec / 60), s = sec % 60;
  return m ? m + '분' + (s ? ' ' + s + '초' : '') : s + '초';
}
function secText_(sec) { return sec >= 60 ? mmss_(sec) : sec + '초'; }
function rateColor_(r) { return r >= 80 ? '#2A6E4C' : r < 60 ? '#A8382F' : '#7E6420'; }
function bar_(rate) {
  return '<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:110px;margin-top:3px">'
    + '<tr><td style="height:7px;width:' + Math.max(2, rate) + '%;background:' + rateColor_(rate) + '"></td>'
    + '<td style="height:7px;background:#EDEFE9"></td></tr></table>';
}
function momentumText_(m) {
  if (!m || m.trend === 'insufficient') return '<span style="color:#7C837C">데이터 부족 (3세션 미만)</span>';
  if (m.trend === 'rising') return '<span style="color:#2A6E4C">📈 성장 중 +' + m.delta + '%p</span> <span style="color:#7C837C;font-size:12px">(' + m.older + '% → ' + m.recent + '%)</span>';
  if (m.trend === 'declining') return '<span style="color:#A8382F">📉 주의 ' + m.delta + '%p</span> <span style="color:#7C837C;font-size:12px">(' + m.older + '% → ' + m.recent + '%)</span>';
  return '<span style="color:#2F5E8C">➡️ 안정 유지</span> <span style="color:#7C837C;font-size:12px">(' + m.older + '% → ' + m.recent + '%)</span>';
}
function mShell_(title, sub) {
  return shell_(title, sub).replace('태청야학 수학반 · 아침 브리핑', '태청야학 수학반 · 월간 기록지');
}
function mFoot_() {
  return '<div style="border-top:1px solid #DCDED4;margin-top:22px;padding-top:10px;font-size:11px;color:#7C837C">'
    + '매월 1일 ' + MONTHLY.SEND_HOUR + '시~' + (MONTHLY.SEND_HOUR + 1) + '시 사이 자동 발송 · 교사 계정과 확인용 계정은 집계에서 제외 · '
    + '같은 기록이 두 번 저장된 것은 한 번만 셈 · 끄려면 Apps Script에서 removeMonthlyTrigger 실행</div></div>';
}
