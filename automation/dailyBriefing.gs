/* =====================================================================
   태청야학 수학반 · 아침 학습 브리핑 메일 (Google Apps Script)

   무엇을 하나
   - 매일 아침 8시~9시(한국 시간) 사이, 어제 하루 학생들이 앱에서 문제 푼 기록을 모아
     선생님 본인 Gmail로 '나에게 보내기'처럼 보고서를 보낸다.
   - 어제 기록이 없으면 '데이터 없음'과 함께, 학생들에게 보낼 격려·독려 문구를 추천한다.

   어디서 도나
   - script.google.com 의 프로젝트 안. 선생님 구글 계정으로 돌기 때문에 컴퓨터가
     꺼져 있어도 발송되고, 비밀번호·앱 비밀번호를 어디에도 저장하지 않는다.
   - 받는 주소는 코드에 적지 않는다. 스크립트를 실행하는 계정(= 선생님 Gmail)으로 보낸다.
     (이 저장소는 공개이므로 메일 주소·학생 이름을 코드에 넣지 않는다.)

   데이터
   - Firestore REST (앱과 같은 공개 apiKey). 로그인 없이 읽힌다.
   - math_logs : {studentName, date:'YYYY-MM-DD', time, type, score:'7 / 10', questions[], totalSec}
   - users     : name · role · lastDate 만 골라 읽는다 (mask) — logs 배열까지 받으면 무거워짐.

   설치 (처음 한 번, 약 3분)
   1. https://script.google.com → [새 프로젝트]  (오른쪽 위 프로필이 메일 받을 계정인지 확인)
   2. 이 파일 내용을 Code.gs 에 붙여 넣고 저장
   3. 함수 목록 기본값 setupAll 을 그대로 ▶ 실행 → 권한 허용
   4. [미리보기] 메일 도착 + 왼쪽 ⏰ 트리거 화면에 sendDailyBriefing 한 줄 → 끝
   어느 함수를 누르든 매일 예약이 없으면 스스로 건다. 끄려면 removeTrigger.
   ===================================================================== */

var CONFIG = {
  PROJECT_ID: 'math-solving-daily',
  API_KEY: 'AIzaSyB91eiFNRs_ziJnzWMjvg-TKSq447oPasY',   // index.html 에 이미 공개된 웹 키
  TZ: 'Asia/Seoul',
  SEND_HOUR: 8,              // Google 예약은 이 시각부터 1시간 안에 실행된다 → 8시~9시 사이 도착
  COMPARE_DAYS: 7,          // 어제와 비교할 '지난 며칠 평균'
  NUDGE_AFTER_DAYS: 3,      // 마지막 접속(users.lastDate)이 이만큼 지나면 독려 대상
  NUDGE_WITHIN_DAYS: 30,    // 이보다 오래 쉰 사람은 '장기 미접속'으로만 센다
  LOW_RATE: 60,             // 이 정답률 미만이면 '살펴보기'
  HIGH_RATE: 90,            // 이 정답률 이상이면 '칭찬하기'
  // 교사가 학생 화면을 확인하려고 만든 계정 — 실제 학생이 아니므로 집계에서 뺀다
  EXCLUDE_NAMES: ['박소명_학생', '박소명_테스트'],
  SENDER_NAME: '태청야학 수학반 브리핑'
};

/* ─────────────────────────── 진입점 ─────────────────────────── */

/** ▶ 설치·점검을 한 번에 — 편집기 함수 목록에서 기본으로 선택되도록 **맨 위**에 둔다.
    (2026-09-17 : 목록 맨 위가 sendDailyBriefing 이라, checkSetup 을 누르려다 그게 실행돼
     로그에 아무것도 안 찍히는 일이 있었다. 맨 위 함수는 늘 '눌러도 안전하고 결과를 말해 주는' 것으로 둔다.) */
function setupAll() {
  installTrigger();                 // 예약을 (다시) 걸어 하나만 남긴다
  // (ensureTrigger_ 가 아래 함수들 안에서도 돌지만, 여기서는 확실히 새로 건다)
  var report = checkSetup();        // 실행 계정 · 받는 주소 · 예약 개수 · 기록 건수
  previewBriefing();                // [미리보기] 메일 한 통
  Logger.log('──── 설치 완료. 메일함에 [미리보기] 메일이 왔는지 확인하세요. ────');
  return report;
}

/** 받는 사람
    1순위 : 스크립트 속성 RECIPIENT (프로젝트 설정 → 스크립트 속성에서 넣는다. 코드에 주소를 적지 않기 위함)
    2순위 : 이 스크립트를 돌리는 계정
    ※ 2026-09-17 : 브라우저에 구글 계정이 여러 개 로그인된 상태에서 프로젝트가 '다른 계정'으로
       만들어지면, 메일이 그 계정으로 가서 선생님 메일함에는 한 통도 오지 않는다. 그래서 받는 주소를
       속성으로 못 박을 수 있게 했다. */
function me_() {
  var fixed = PropertiesService.getScriptProperties().getProperty('RECIPIENT');
  var addr = (fixed && fixed.trim()) || Session.getEffectiveUser().getEmail();
  if (!addr) throw new Error('받는 주소를 알 수 없습니다. 프로젝트 설정 → 스크립트 속성에 RECIPIENT 를 넣어 주세요.');
  return addr;
}

/** 트리거가 매일 부르는 함수
    ※ 무인으로 도는 작업이라, 실패했을 때 아무 일도 없었던 것처럼 조용히 넘어가면 안 된다.
       실패하면 그 사실을 알리는 짧은 메일이라도 오게 한다. */
function sendDailyBriefing() {
  ensureTrigger_();
  try {
    var r = buildBriefing_(fetchLogsSince_(daysAgo_(CONFIG.COMPARE_DAYS + 1)), fetchStudents_(), new Date());
    var to = me_();
    MailApp.sendEmail({ to: to, subject: r.subject, htmlBody: r.html, name: CONFIG.SENDER_NAME });
    Logger.log('보냈습니다 → ' + to + ' / ' + r.subject);
  } catch (e) {
    notifyFailure_(e);
    throw e;                        // 실행 기록에도 남도록 다시 던진다
  }
}

/** 설치 확인용 — 지금 바로 한 통 보내 본다 (제목 앞에 [미리보기]) */
function previewBriefing() {
  ensureTrigger_();
  var r = buildBriefing_(fetchLogsSince_(daysAgo_(CONFIG.COMPARE_DAYS + 1)), fetchStudents_(), new Date());
  var to = me_();
  MailApp.sendEmail({ to: to, subject: '[미리보기] ' + r.subject, htmlBody: r.html, name: CONFIG.SENDER_NAME });
  Logger.log('보냈습니다 → ' + to + ' / ' + r.subject);   // 실행 로그에서 어디로 갔는지 바로 보이게
}

/** 실패 알림 — 하루에 한 통까지만 (같은 오류로 메일함이 밀리지 않게) */
function notifyFailure_(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var today = Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyy-MM-dd');
    if (props.getProperty('lastFailMail') === today) return;
    props.setProperty('lastFailMail', today);
    MailApp.sendEmail({
      to: me_(),
      subject: '[태청야학 수학반] 아침 브리핑을 만들지 못했습니다',
      htmlBody: '<div style="font-family:sans-serif;font-size:14px;line-height:1.7">'
        + '오늘 아침 브리핑을 만드는 중에 문제가 생겨 메일을 보내지 못했습니다.<br>'
        + '내일 아침에 다시 시도합니다. 계속 같은 일이 생기면 아래 내용을 알려 주세요.'
        + '<pre style="background:#F3F4F1;padding:10px;font-size:12px;white-space:pre-wrap">'
        + (e && e.message ? e.message : String(e)) + '</pre></div>',
      name: CONFIG.SENDER_NAME
    });
  } catch (ignore) { /* 알림조차 실패하면 더 할 수 있는 일이 없다 */ }
}

/** 설치가 제대로 됐는지 확인 — 실행한 뒤 아래 '실행 로그'를 보면 된다 */
function checkSetup() {
  var ts = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'sendDailyBriefing'; });
  var runner = Session.getEffectiveUser().getEmail() || '(알 수 없음)';
  var fixed = PropertiesService.getScriptProperties().getProperty('RECIPIENT');
  var lines = [
    '실행 계정      : ' + runner + '  ← 이 스크립트가 누구 계정에서 도는지',
    '받는 주소      : ' + (fixed ? fixed + ' (스크립트 속성 RECIPIENT)' : runner + ' (실행 계정과 같음)')
      + (!fixed ? '  ← 메일이 안 오면 여기가 선생님 주소가 맞는지 확인' : ''),
    '보낼 시각      : 매일 ' + CONFIG.SEND_HOUR + '시~' + (CONFIG.SEND_HOUR + 1) + '시 사이',
    '예약 개수      : ' + ts.length + (ts.length === 1 ? ' (정상)' : ts.length === 0 ? ' ← installTrigger 를 실행해 주세요' : ' ← 중복입니다. installTrigger 를 한 번 더 실행하면 하나로 정리됩니다'),
    '스크립트 시간대: ' + Session.getScriptTimeZone() + (Session.getScriptTimeZone() === CONFIG.TZ ? ' (정상)' : ' ← 날짜 계산은 코드가 ' + CONFIG.TZ + ' 로 하므로 그대로 두셔도 됩니다'),
    '오늘 남은 메일 : ' + MailApp.getRemainingDailyQuota() + '통'
  ];
  var logs = fetchLogsSince_(daysAgo_(CONFIG.COMPARE_DAYS + 1));
  lines.push('읽어 온 기록   : 최근 ' + (CONFIG.COMPARE_DAYS + 1) + '일 ' + logs.length + '건 (0이면 데이터 연결을 확인해 주세요)');
  Logger.log(lines.join('\n'));
  return lines.join('\n');
}

/** 매일 8시~9시 발송 예약 (같은 예약이 이미 있으면 지우고 다시 만든다) */
function installTrigger() {
  removeTrigger();
  PropertiesService.getScriptProperties().deleteProperty('AUTO_OFF');   // 다시 켠다
  ScriptApp.newTrigger('sendDailyBriefing')
    .timeBased().everyDays(1).atHour(CONFIG.SEND_HOUR).nearMinute(0).inTimezone(CONFIG.TZ)
    .create();
}

/** 예약이 없으면 조용히 건다 — '예약 거는 단계'를 따로 기억해 누르지 않아도 되게.
    (2026-09-18 : 직접 ▶ 누른 발송은 도착했는데 아침 자동 발송은 한 번도 오지 않았다.
     설치 안내 5번 installTrigger 를 건너뛰어 예약이 아예 없었던 것. 한 사람만의 실수가 아니라
     공유했을 때 누구나 빠뜨릴 단계라서, 어느 함수를 눌러도 예약이 생기게 했다.)
    removeTrigger 로 일부러 끈 경우에는 다시 켜지 않는다 (속성 AUTO_OFF). */
function ensureTrigger_() {
  try {
    if (PropertiesService.getScriptProperties().getProperty('AUTO_OFF') === '1') return;
    var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sendDailyBriefing'; });
    if (!has) {
      ScriptApp.newTrigger('sendDailyBriefing')
        .timeBased().everyDays(1).atHour(CONFIG.SEND_HOUR).nearMinute(0).inTimezone(CONFIG.TZ).create();
      Logger.log('매일 ' + CONFIG.SEND_HOUR + '시 예약이 없어서 새로 걸었습니다.');
    }
  } catch (e) { Logger.log('예약 확인 실패: ' + e.message); }
}

/** 예약 끄기 (끈 상태를 기억해서, 다른 함수를 눌러도 다시 켜지지 않게 한다) */
function removeTrigger() {
  PropertiesService.getScriptProperties().setProperty('AUTO_OFF', '1');
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailyBriefing') ScriptApp.deleteTrigger(t);
  });
}

/* ─────────────────────────── 데이터 읽기 ─────────────────────────── */

function base_() {
  return 'https://firestore.googleapis.com/v1/projects/' + CONFIG.PROJECT_ID + '/databases/(default)/documents';
}

/** date >= since 인 기록 전부 (단일 필드 범위 조건이라 색인 추가 없이 된다) */
function fetchLogsSince_(since) {
  var body = {
    structuredQuery: {
      from: [{ collectionId: 'math_logs' }],
      where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: since } } },
      orderBy: [{ field: { fieldPath: 'date' }, direction: 'ASCENDING' }],
      limit: 2000
    }
  };
  var res = UrlFetchApp.fetch(base_() + ':runQuery?key=' + CONFIG.API_KEY, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('기록 읽기 실패 ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
  return JSON.parse(res.getContentText())
    .filter(function (x) { return x.document; })
    .map(function (x) { return decode_(x.document.fields); });
}

/** 학생 명단 — 이름·역할·마지막 학습일만 */
function fetchStudents_() {
  var out = [], token = '';
  do {
    var url = base_() + '/users?key=' + CONFIG.API_KEY + '&pageSize=300'
      + '&mask.fieldPaths=name&mask.fieldPaths=role&mask.fieldPaths=lastDate'
      + (token ? '&pageToken=' + encodeURIComponent(token) : '');
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('명단 읽기 실패 ' + res.getResponseCode());
    var j = JSON.parse(res.getContentText());
    (j.documents || []).forEach(function (d) { out.push(decode_(d.fields || {})); });
    token = j.nextPageToken || '';
  } while (token);
  return out;
}

/** Firestore 값 → 보통 JS 값 */
function decode_(fields) {
  var o = {};
  Object.keys(fields || {}).forEach(function (k) { o[k] = val_(fields[k]); });
  return o;
}
function val_(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return decode_(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val_);
  return null;
}

/* ─────────────────────────── 날짜 ─────────────────────────── */

function fmt_(d, p) { return Utilities.formatDate(d, CONFIG.TZ, p); }
function daysAgo_(n, from) { var d = new Date((from || new Date()).getTime() - n * 86400000); return fmt_(d, 'yyyy-MM-dd'); }
function dayGap_(a, b) { // 'YYYY-MM-DD' 두 개의 날짜 차 (b − a)
  if (!a || !b) return 9999;
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}
function krDate_(iso) {
  var d = new Date(iso + 'T12:00:00Z');
  var w = ['일', '월', '화', '수', '목', '금', '토'][d.getUTCDay()];
  return (d.getUTCMonth() + 1) + '월 ' + d.getUTCDate() + '일(' + w + ')';
}

/* ─────────────────────────── 보고서 만들기 (순수 함수) ─────────────────────────── */

/**
 * @param logs     최근 (COMPARE_DAYS+1)일 기록
 * @param students users 명단
 * @param now      발송 시각
 * @return {subject, html, stats}
 */
function buildBriefing_(logs, students, now) {
  var today = fmt_(now, 'yyyy-MM-dd');
  var yday = daysAgo_(1, now);
  var weekFrom = daysAgo_(CONFIG.COMPARE_DAYS, now);

  var admins = {};
  students.forEach(function (s) { if (s.role === 'admin') admins[s.name] = true; });
  var skip = function (name) { return !name || admins[name] || CONFIG.EXCLUDE_NAMES.indexOf(name) >= 0; };

  logs = logs.filter(function (l) { return !skip(l.studentName); });
  var ydayLogs = logs.filter(function (l) { return l.date === yday; });
  var weekLogs = logs.filter(function (l) { return l.date >= weekFrom && l.date < yday; });

  /* 명단 기반 독려 대상 : 최근 30일 안에 하다가 3일 이상 쉰 학생 */
  var roster = students.filter(function (s) { return s.role !== 'admin' && !skip(s.name); });
  var activeYday = {};
  ydayLogs.forEach(function (l) { activeYday[l.studentName] = true; });
  var nudge = [], longGone = 0;
  roster.forEach(function (s) {
    if (activeYday[s.name]) return;
    var gap = dayGap_(s.lastDate, today);
    if (gap >= CONFIG.NUDGE_AFTER_DAYS && gap <= CONFIG.NUDGE_WITHIN_DAYS) nudge.push({ name: s.name, gap: gap });
    else if (gap > CONFIG.NUDGE_WITHIN_DAYS) longGone++;
  });
  nudge.sort(function (a, b) { return a.gap - b.gap; });

  if (ydayLogs.length === 0) {
    return noDataReport_(yday, nudge, longGone, roster.length, weekLogs);
  }
  return dataReport_(yday, ydayLogs, weekLogs, nudge, longGone);
}

/* 한 사람 / 한 묶음 집계 */
function tally_(list) {
  var t = { sessions: list.length, q: 0, ok: 0, sec: 0, types: {}, wrongByTopic: {}, times: [] };
  list.forEach(function (l) {
    var qs = l.questions || [];
    t.q += qs.length;
    qs.forEach(function (q) {
      if (q && q.isOk) t.ok++;
      else if (q) {
        var topic = (q.meta && q.meta.type) || l.type || '기타';
        t.wrongByTopic[topic] = (t.wrongByTopic[topic] || 0) + 1;
      }
    });
    t.sec += Number(l.totalSec) || 0;
    t.types[l.type || '문제풀기'] = (t.types[l.type || '문제풀기'] || 0) + 1;
    if (l.time) t.times.push(l.time);
  });
  t.rate = t.q ? Math.round(t.ok / t.q * 100) : null;
  return t;
}
function groupBy_(list, key) {
  var g = {};
  list.forEach(function (x) { (g[x[key]] = g[x[key]] || []).push(x); });
  return g;
}
function topWrong_(wrongByTopic, n) {
  return Object.keys(wrongByTopic)
    .map(function (k) { return { topic: k, n: wrongByTopic[k] }; })
    .sort(function (a, b) { return b.n - a.n; })
    .slice(0, n);
}

function dataReport_(yday, ydayLogs, weekLogs, nudge, longGone) {
  var all = tally_(ydayLogs);
  var week = tally_(weekLogs);
  var byStu = groupBy_(ydayLogs, 'studentName');
  var weekByStu = groupBy_(weekLogs, 'studentName');

  var rows = Object.keys(byStu).map(function (name) {
    var t = tally_(byStu[name]);
    var w = weekByStu[name] ? tally_(weekByStu[name]) : null;
    var days = weekByStu[name] ? Object.keys(groupBy_(weekByStu[name], 'date')).length : 0;
    return { name: name, t: t, w: w, weekDays: days, top: topWrong_(t.wrongByTopic, 1)[0] || null };
  }).sort(function (a, b) { return b.t.q - a.t.q; });

  var praise = rows.filter(function (r) {
    return (r.t.rate !== null && r.t.rate >= CONFIG.HIGH_RATE && r.t.q >= 5) || !r.w || r.weekDays >= 4;
  });
  var watch = rows.filter(function (r) { return r.t.rate !== null && r.t.rate < CONFIG.LOW_RATE && r.t.q >= 5; });
  var classWrong = topWrong_(all.wrongByTopic, 3);

  var diff = (all.rate !== null && week.rate !== null) ? all.rate - week.rate : null;
  var subject = '[태청야학 수학반] ' + krDate_(yday) + ' 학습 브리핑 — '
    + rows.length + '명 · ' + all.q + '문항 · 정답률 ' + all.rate + '%';

  var h = shell_(krDate_(yday) + ' 학습 브리핑', '어제 하루 앱에서 문제를 푼 기록입니다.');

  /* 한눈에 */
  h += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 20px">'
    + '<tr>'
    + kpi_('참여 학생', rows.length + '명', '')
    + kpi_('푼 문항', all.q + '개', all.sessions + '묶음')
    + kpi_('정답률', all.rate + '%', diff === null ? '지난 7일 기록 없음'
        : (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff) + '%p (지난 7일 ' + week.rate + '%)', diff === null ? '' : (diff >= 0 ? '#2A6E4C' : '#A8382F'))
    + kpi_('학습 시간', Math.round(all.sec / 60) + '분', '')
    + '</tr></table>';

  /* 학생별 */
  h += sec_('학생별 기록');
  h += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">'
    + '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
    + th_('학생') + th_('한 것') + th_('정답', 'center') + th_('지난 7일') + th_('가장 많이 틀린 유형')
    + '</tr>';
  rows.forEach(function (r) {
    var types = Object.keys(r.t.types).map(function (k) { return k + (r.t.types[k] > 1 ? ' ×' + r.t.types[k] : ''); }).join('<br>');
    var trend;
    if (!r.w || r.w.rate === null) trend = '<span style="color:#7C837C">이번 주 첫 기록</span>';
    else {
      var d = r.t.rate - r.w.rate;
      var col = d >= 5 ? '#2A6E4C' : d <= -10 ? '#A8382F' : '#4B534C';
      trend = '<span style="color:' + col + '">' + (d >= 0 ? '▲' : '▼') + ' ' + Math.abs(d) + '%p</span>'
        + '<br><span style="color:#7C837C;font-size:12px">' + r.weekDays + '일 참여 · 평균 ' + r.w.rate + '%</span>';
    }
    var rateCol = r.t.rate >= CONFIG.HIGH_RATE ? '#2A6E4C' : r.t.rate < CONFIG.LOW_RATE ? '#A8382F' : '#1F2421';
    h += '<tr style="border-bottom:1px solid #DCDED4">'
      + td_('<b>' + esc_(r.name) + '</b><br><span style="color:#7C837C;font-size:12px">' + (r.t.times[0] || '') + ' · ' + Math.max(1, Math.round(r.t.sec / 60)) + '분</span>')
      + td_('<span style="font-size:13px">' + esc_(types) + '</span>')
      + td_('<b style="color:' + rateCol + ';font-size:16px">' + r.t.rate + '%</b><br><span style="color:#7C837C;font-size:12px">' + r.t.ok + ' / ' + r.t.q + '</span>', 'center')
      + td_(trend)
      + td_(r.top ? esc_(r.top.topic) + ' <span style="color:#7C837C">(' + r.top.n + ')</span>' : '<span style="color:#2A6E4C">없음</span>')
      + '</tr>';
  });
  h += '</table>';

  /* 오늘 챙길 것 */
  h += sec_('오늘 챙기실 것');
  h += '<ul style="margin:0 0 8px;padding-left:18px;line-height:1.75;font-size:14px">';
  if (praise.length) h += '<li><b style="color:#2A6E4C">칭찬하기</b> — ' + praise.map(function (r) {
      var why = !r.w ? '이번 주 첫 기록' : (r.weekDays >= 4 ? '꾸준히 ' + (r.weekDays + 1) + '일째' : '정답률 ' + r.t.rate + '%');
      return esc_(r.name) + '(' + why + ')';
    }).join(', ') + '</li>';
  if (watch.length) h += '<li><b style="color:#A8382F">살펴보기</b> — ' + watch.map(function (r) {
      return esc_(r.name) + '(' + r.t.rate + '%' + (r.top ? ', ' + esc_(r.top.topic) : '') + ')';
    }).join(', ') + ' · 문제를 더 주기보다 개념을 한 번 더 짚어 주세요.</li>';
  if (classWrong.length) h += '<li><b>되돌아보기 추천 유형</b> — ' + classWrong.map(function (w) {
      return esc_(w.topic) + ' ' + w.n + '문항';
    }).join(' · ') + ' (반 전체 오답 기준 · 오답 문제지로 출력)</li>';
  if (nudge.length) h += '<li><b>안부 전하기</b> — ' + nudge.slice(0, 8).map(function (n) {
      return esc_(n.name) + '(접속 ' + n.gap + '일 전)';
    }).join(', ') + (nudge.length > 8 ? ' 외 ' + (nudge.length - 8) + '명' : '') + '</li>';
  if (!praise.length && !watch.length && !classWrong.length && !nudge.length) h += '<li>특별히 챙길 것 없이 순조롭습니다.</li>';
  h += '</ul>';
  if (longGone) h += '<p style="margin:0;color:#7C837C;font-size:12px">' + CONFIG.NUDGE_WITHIN_DAYS + '일 넘게 접속하지 않은 계정 ' + longGone + '개는 목록에서 뺐습니다.</p>';

  h += foot_();
  return { subject: subject, html: h, stats: { students: rows.length, q: all.q, rate: all.rate } };
}

function noDataReport_(yday, nudge, longGone, rosterCount, weekLogs) {
  var weekStu = Object.keys(groupBy_(weekLogs, 'studentName')).length;
  var subject = '[태청야학 수학반] ' + krDate_(yday) + ' 학습 브리핑 — 데이터 없음';
  var h = shell_(krDate_(yday) + ' 학습 브리핑', '어제는 앱에 기록된 문제풀이가 없습니다.');

  h += '<div style="background:#F3F4F1;border-left:4px solid #B7BCB0;padding:14px 16px;margin:0 0 20px;font-size:15px">'
    + '<b style="font-size:17px">데이터 없음</b><br>'
    + '<span style="color:#4B534C">지난 ' + CONFIG.COMPARE_DAYS + '일 동안 앱을 쓴 학생은 ' + weekStu + '명입니다'
    + (weekStu ? '. 하루 쉬어 가는 날이었을 수 있어요.' : '. 이번 주는 앱 숙제를 한 번 안내해 보시면 좋겠습니다.') + '</span></div>';

  if (nudge.length) {
    h += sec_('안부 전하면 좋은 학생 (최근 30일 안에 오다가 뜸해진 분)');
    h += '<p style="margin:0 0 16px;font-size:14px;line-height:1.75">' + nudge.slice(0, 10).map(function (n) {
      return '<b>' + esc_(n.name) + '</b> <span style="color:#7C837C">접속 ' + n.gap + '일 전</span>';
    }).join(' · ') + (nudge.length > 10 ? ' 외 ' + (nudge.length - 10) + '명' : '') + '</p>';
  }

  var msgs = pickMessages_(yday);
  h += sec_('보내기 좋은 격려 · 독려 문구');
  h += '<p style="margin:0 0 10px;color:#7C837C;font-size:12px">앱 공지나 단체 문자에 그대로 붙여 넣으셔도 됩니다.</p>';
  msgs.forEach(function (m) {
    h += '<div style="border:1px solid #DCDED4;padding:12px 14px;margin:0 0 10px;font-size:15px;line-height:1.7">'
      + '<div style="font-size:11px;letter-spacing:.12em;color:#7C837C;margin-bottom:4px">' + m.tag + '</div>' + m.text + '</div>';
  });

  if (longGone) h += '<p style="margin:12px 0 0;color:#7C837C;font-size:12px">' + CONFIG.NUDGE_WITHIN_DAYS + '일 넘게 접속하지 않은 계정 ' + longGone + '개(전체 ' + rosterCount + '개 중)는 목록에서 뺐습니다.</p>';
  h += foot_();
  return { subject: subject, html: h, stats: { students: 0, q: 0, rate: null } };
}

/* 날짜마다 다른 문구가 나오도록 돌려 쓴다 (같은 문구가 매일 반복되지 않게) */
function pickMessages_(iso) {
  var cheer = [
    '어르신들, 어제 하루도 수고 많으셨습니다. 오늘은 앱에서 딱 5문제만 풀어 보셔요. 한 문제를 맞히는 그 순간이 실력이 됩니다.',
    '틀린 문제는 거름이 됩니다. 오늘 앱에서 틀렸던 문제를 한 번 더 만나 보시면, 금요일 수업이 훨씬 가벼워집니다.',
    '좌표 10문제는 10분이면 끝납니다. 차 한 잔 하시면서 오늘도 한 걸음만 함께 가요.',
    '꾸준함이 가장 큰 재능입니다. 오늘 한 번 앱에 들어오시기만 해도 도장이 하나 늘어요.'
  ];
  var nudge = [
    '요즘 뵙기 어려워 안부 여쭙니다. 바쁘시면 앱에서 3문제만이라도 풀어 보셔요. 금요일에 뵐 날을 기다리겠습니다.',
    '지난번에 배운 내용, 잊기 전에 한 번만 다시 만나 보셔요. 앱 [문제풀기]에서 5분이면 됩니다. 언제든 편하게 돌아오세요.',
    '검정고시까지 한 문제씩이면 충분합니다. 쉬어 가셔도 괜찮아요. 오늘 한 문제로 다시 시작해 보셔요.'
  ];
  var n = Number(iso.replace(/-/g, '')) || 0;
  return [
    { tag: '격려 · 모두에게', text: cheer[n % cheer.length] },
    { tag: '독려 · 뜸한 학생에게', text: nudge[n % nudge.length] }
  ];
}

/* ─────────────────────────── 메일 HTML 조각 (인라인 스타일 — Gmail이 <style>을 지우므로) ─────────────────────────── */

function shell_(title, sub) {
  return '<div style="font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;color:#1F2421;max-width:680px;margin:0 auto;padding:8px">'
    + '<div style="border-bottom:2px solid #1F2421;padding-bottom:10px;margin-bottom:18px">'
    + '<div style="font-size:11px;letter-spacing:.16em;color:#7C837C">태청야학 수학반 · 아침 브리핑</div>'
    + '<div style="font-size:22px;font-weight:700;margin-top:2px">' + title + '</div>'
    + '<div style="font-size:13px;color:#4B534C;margin-top:2px">' + sub + '</div></div>';
}
function foot_() {
  return '<div style="border-top:1px solid #DCDED4;margin-top:22px;padding-top:10px;font-size:11px;color:#7C837C">'
    + '매일 ' + CONFIG.SEND_HOUR + '시~' + (CONFIG.SEND_HOUR + 1) + '시 사이 자동 발송 · 교사 계정과 확인용 계정은 집계에서 제외 · 끄려면 Apps Script에서 removeTrigger 실행</div></div>';
}
function sec_(t) { return '<div style="font-size:15px;font-weight:700;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #B7BCB0">' + t + '</div>'; }
function kpi_(label, value, note, noteColor) {
  return '<td style="width:25%;padding:10px 8px;border-top:3px solid #2A6E4C;vertical-align:top">'
    + '<div style="font-size:11px;color:#7C837C">' + label + '</div>'
    + '<div style="font-size:22px;font-weight:700;margin-top:2px">' + value + '</div>'
    + (note ? '<div style="font-size:11px;color:' + (noteColor || '#7C837C') + ';margin-top:2px">' + note + '</div>' : '')
    + '</td>';
}
function th_(t, align) { return '<th style="text-align:' + (align || 'left') + ';padding:7px 8px;font-weight:600">' + t + '</th>'; }
function td_(t, align) { return '<td style="text-align:' + (align || 'left') + ';padding:9px 8px;vertical-align:top">' + t + '</td>'; }
function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;br&gt;/g, '<br>');   // 종류 목록 줄바꿈만 살린다
}
