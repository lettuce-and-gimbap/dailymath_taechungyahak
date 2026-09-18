/* =====================================================================
   매일 아침 자동 메일 — 기본 틀 (구글 시트 기록 요약)
   노트북을 덮어도, 꺼도 옵니다. 구글 서버에서 돌기 때문입니다.

   할 일 : 아래 SETTING 세 줄만 고치고 → 저장 → 맨 위 setupAll 을 ▶ 실행.
   태청야학 수학반에서 실제로 겪은 함정 네 가지를 미리 막아 두었습니다.
     ① 예약을 따로 걸어야 하는 단계를 빠뜨림   → 어떤 함수를 눌러도 예약이 없으면 스스로 겁니다
     ② 다른 구글 계정으로 만들어 메일이 딴 데로 감 → 받는 주소를 스크립트 속성 RECIPIENT 로 못 박을 수 있습니다
     ③ 함수 목록 맨 위 함수가 기본으로 실행됨     → 맨 위에 '눌러도 안전한' setupAll 을 둡니다
     ④ 실패하면 아무 소식이 없음                → 실패하면 '만들지 못했습니다' 메일이 옵니다
   ===================================================================== */

var SETTING = {
  SHEET_URL: '',            // 기록이 있는 구글 시트 주소. 시트 안(확장 프로그램 → Apps Script)에서 만들었으면 비워 두세요
  SHEET_NAME: '시트1',       // 기록이 있는 탭 이름
  DATE_COL: 1,              // 날짜가 들어 있는 열 번호 (A열 = 1, B열 = 2 …)
  SEND_HOUR: 8,             // 8 이면 8시~9시 사이에 옵니다 (구글 예약은 1시간 안에서 실행됩니다)
  TITLE: '[우리 반] 아침 브리핑'
};

/** ▶ 처음 한 번 — 예약 걸기 + 미리보기 한 통. 함수 목록 맨 위에 있어야 합니다. */
function setupAll() {
  installTrigger();
  sendPreview();
  Logger.log('끝났습니다. ① 메일함에 [미리보기] 메일 ② 왼쪽 ⏰ 트리거 화면에 dailyJob 한 줄 — 둘 다 보이면 성공입니다.');
}

/** 지금 한 통 보내 보기 */
function sendPreview() {
  ensureTrigger_();
  var r = build_(new Date());
  MailApp.sendEmail({ to: me_(), subject: '[미리보기] ' + r.subject, htmlBody: r.html });
  Logger.log('보냈습니다 → ' + me_());
}

/** 매일 예약이 부르는 함수 */
function dailyJob() {
  ensureTrigger_();
  try {
    var r = build_(new Date());
    MailApp.sendEmail({ to: me_(), subject: r.subject, htmlBody: r.html });
  } catch (e) {
    MailApp.sendEmail({ to: me_(), subject: SETTING.TITLE + ' — 오늘은 만들지 못했습니다',
                        body: '오류 내용:\n' + (e && e.message ? e.message : e) });
    throw e;
  }
}

/* ───────── 여기부터는 고치지 않아도 됩니다 ───────── */

/** 어제 날짜의 줄만 골라 표로 만든다 — 내용을 바꾸고 싶으면 이 함수만 고치면 됩니다 */
function build_(now) {
  var tz = 'Asia/Seoul';
  var ss = SETTING.SHEET_URL ? SpreadsheetApp.openByUrl(SETTING.SHEET_URL) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SETTING.SHEET_NAME);
  if (!sheet) throw new Error('"' + SETTING.SHEET_NAME + '" 탭을 찾지 못했습니다. SETTING.SHEET_NAME 을 확인해 주세요.');
  var rows = sheet.getDataRange().getValues();
  var head = rows.shift();
  var day = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v).slice(0, 10); };
  var yday = Utilities.formatDate(new Date(now.getTime() - 86400000), tz, 'yyyy-MM-dd');
  var hit = rows.filter(function (r) { return day(r[SETTING.DATE_COL - 1]) === yday; });

  var subject = SETTING.TITLE + ' — ' + yday + (hit.length ? ' · ' + hit.length + '건' : ' · 기록 없음');
  var cell = function (v) { return esc_(v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : v); };
  var html = '<div style="font-family:sans-serif;font-size:14px;line-height:1.6">'
    + '<h3 style="margin:0 0 8px">' + yday + ' 기록 ' + hit.length + '건</h3>';
  if (!hit.length) {
    html += '<p>어제는 시트에 새 기록이 없습니다.</p>';
  } else {
    html += '<table cellpadding="6" style="border-collapse:collapse;border:1px solid #ccc">'
      + '<tr style="background:#f2f2f2">' + head.map(function (h) { return '<th style="border:1px solid #ccc;text-align:left">' + cell(h) + '</th>'; }).join('') + '</tr>'
      + hit.map(function (r) { return '<tr>' + r.map(function (c) { return '<td style="border:1px solid #ccc">' + cell(c) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</table>';
  }
  return { subject: subject, html: html + '</div>' };
}

/** 받는 주소 : 스크립트 속성 RECIPIENT → 없으면 이 스크립트를 만든 계정 */
function me_() {
  var fixed = PropertiesService.getScriptProperties().getProperty('RECIPIENT');
  return (fixed && fixed.trim()) || Session.getEffectiveUser().getEmail();
}
function esc_(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** 예약 켜기 / 끄기 / 없으면 걸기 */
function installTrigger() {
  removeTrigger();
  PropertiesService.getScriptProperties().deleteProperty('AUTO_OFF');
  newTrigger_();
}
function removeTrigger() {
  PropertiesService.getScriptProperties().setProperty('AUTO_OFF', '1');   // 끈 상태를 기억 — 다른 함수를 눌러도 다시 안 켜짐
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyJob') ScriptApp.deleteTrigger(t);
  });
}
function ensureTrigger_() {
  if (PropertiesService.getScriptProperties().getProperty('AUTO_OFF') === '1') return;
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'dailyJob'; });
  if (!has) newTrigger_();
}
function newTrigger_() {
  ScriptApp.newTrigger('dailyJob').timeBased().everyDays(1)
    .atHour(SETTING.SEND_HOUR).nearMinute(0).inTimezone('Asia/Seoul').create();
}
