# -*- coding: utf-8 -*-
"""
아침 학습 브리핑 메일 본문 만들기 (파이썬 판)

dailyBriefing.gs 와 **같은 보고서**를 만든다. 다른 점은 '누가 돌리느냐' 뿐이다.
  - dailyBriefing.gs  : 구글 서버(Apps Script)에서 돌고 스스로 메일까지 보낸다. 컴퓨터가 꺼져 있어도 온다.
  - build_briefing.py : 이 컴퓨터에서 돌고, 메일 본문만 만들어 파일로 내놓는다.
                        보내는 일은 예약 작업(Claude 데스크톱)이 Gmail 연결로 한다.

쓰는 법
  python automation/build_briefing.py            → 어제 기준 브리핑을 out/briefing.json 에 저장
  python automation/build_briefing.py 2026-09-13 → 그날 아침에 보냈을 브리핑 (그 전날이 대상)

내놓는 것 : automation/out/briefing.json  {subject, html, text, hasData, date}
             automation/out/briefing.html (사람이 눈으로 확인할 때)

⚠️ 보고서 내용을 고칠 때는 dailyBriefing.gs 와 이 파일을 **함께** 고친다.
   둘이 어긋나면 설치 방식에 따라 서로 다른 메일이 간다.
"""

import json, os, sys, urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))

CONFIG = {
    'PROJECT_ID': 'math-solving-daily',
    'API_KEY': 'AIzaSyB91eiFNRs_ziJnzWMjvg-TKSq447oPasY',   # index.html 에 이미 공개된 웹 키
    'SEND_HOUR': 8,
    'COMPARE_DAYS': 7,
    'NUDGE_AFTER_DAYS': 3,
    'NUDGE_WITHIN_DAYS': 30,
    'LOW_RATE': 60,
    'HIGH_RATE': 90,
    'EXCLUDE_NAMES': ['박소명_학생', '박소명_테스트'],
}

BASE = 'https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents' % CONFIG['PROJECT_ID']


# ────────────────────────── 데이터 읽기 ──────────────────────────

def _get(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data,
                                 headers={'Content-Type': 'application/json'} if data else {})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def _val(v):
    if v is None:
        return None
    for k, f in (('stringValue', str), ('booleanValue', bool), ('timestampValue', str)):
        if k in v:
            return f(v[k])
    if 'integerValue' in v:
        return int(v['integerValue'])
    if 'doubleValue' in v:
        return float(v['doubleValue'])
    if 'nullValue' in v:
        return None
    if 'mapValue' in v:
        return _decode(v['mapValue'].get('fields', {}))
    if 'arrayValue' in v:
        return [_val(x) for x in v['arrayValue'].get('values', [])]
    return None


def _decode(fields):
    return {k: _val(v) for k, v in (fields or {}).items()}


def fetch_logs_since(since):
    body = {'structuredQuery': {
        'from': [{'collectionId': 'math_logs'}],
        'where': {'fieldFilter': {'field': {'fieldPath': 'date'},
                                  'op': 'GREATER_THAN_OR_EQUAL',
                                  'value': {'stringValue': since}}},
        'orderBy': [{'field': {'fieldPath': 'date'}, 'direction': 'ASCENDING'}],
        'limit': 2000}}
    res = _get(BASE + ':runQuery?key=' + CONFIG['API_KEY'], body)
    return [_decode(x['document']['fields']) for x in res if 'document' in x]


def fetch_students():
    out, token = [], ''
    while True:
        url = (BASE + '/users?key=' + CONFIG['API_KEY'] + '&pageSize=300'
               + '&mask.fieldPaths=name&mask.fieldPaths=role&mask.fieldPaths=lastDate'
               + ('&pageToken=' + token if token else ''))
        j = _get(url)
        out += [_decode(d.get('fields', {})) for d in j.get('documents', [])]
        token = j.get('nextPageToken', '')
        if not token:
            break
    return out


# ────────────────────────── 날짜 ──────────────────────────

def days_ago(n, base):
    return (base - timedelta(days=n)).strftime('%Y-%m-%d')


def day_gap(a, b):
    if not a or not b:
        return 9999
    try:
        return (datetime.strptime(b, '%Y-%m-%d') - datetime.strptime(a, '%Y-%m-%d')).days
    except ValueError:
        return 9999


def kr_date(iso):
    d = datetime.strptime(iso, '%Y-%m-%d')
    return '%d월 %d일(%s)' % (d.month, d.day, '월화수목금토일'[d.weekday()])


# ────────────────────────── 집계 ──────────────────────────

def tally(rows):
    t = {'sessions': len(rows), 'q': 0, 'ok': 0, 'sec': 0, 'types': {}, 'wrong': {}, 'times': []}
    for l in rows:
        for q in (l.get('questions') or []):
            if not isinstance(q, dict):
                continue
            t['q'] += 1
            if q.get('isOk'):
                t['ok'] += 1
            else:
                topic = ((q.get('meta') or {}).get('type')) or l.get('type') or '기타'
                t['wrong'][topic] = t['wrong'].get(topic, 0) + 1
        t['sec'] += int(l.get('totalSec') or 0)
        ty = l.get('type') or '문제풀기'
        t['types'][ty] = t['types'].get(ty, 0) + 1
        if l.get('time'):
            t['times'].append(l['time'])
    t['rate'] = round(t['ok'] / t['q'] * 100) if t['q'] else None
    return t


def group_by(rows, key):
    g = {}
    for r in rows:
        g.setdefault(r.get(key), []).append(r)
    return g


def top_wrong(wrong, n):
    return sorted([{'topic': k, 'n': v} for k, v in wrong.items()], key=lambda x: -x['n'])[:n]


# ────────────────────────── HTML 조각 ──────────────────────────

def esc(s):
    return (str('' if s is None else s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('&lt;br&gt;', '<br>'))


def shell(title, sub):
    return ("<div style=\"font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1F2421;"
            "max-width:680px;margin:0 auto;padding:8px\">"
            '<div style="border-bottom:2px solid #1F2421;padding-bottom:10px;margin-bottom:18px">'
            '<div style="font-size:11px;letter-spacing:.16em;color:#7C837C">태청야학 수학반 · 아침 브리핑</div>'
            '<div style="font-size:22px;font-weight:700;margin-top:2px">%s</div>'
            '<div style="font-size:13px;color:#4B534C;margin-top:2px">%s</div></div>' % (title, sub))


def foot():
    return ('<div style="border-top:1px solid #DCDED4;margin-top:22px;padding-top:10px;font-size:11px;color:#7C837C">'
            '매일 %d시~%d시 사이 자동 발송 · 교사 계정과 확인용 계정은 집계에서 제외</div></div>'
            % (CONFIG['SEND_HOUR'], CONFIG['SEND_HOUR'] + 1))


def sec(t):
    return ('<div style="font-size:15px;font-weight:700;margin:22px 0 8px;padding-bottom:4px;'
            'border-bottom:1px solid #B7BCB0">%s</div>' % t)


def kpi(label, value, note='', note_color='#7C837C'):
    return ('<td style="width:25%%;padding:10px 8px;border-top:3px solid #2A6E4C;vertical-align:top">'
            '<div style="font-size:11px;color:#7C837C">%s</div>'
            '<div style="font-size:22px;font-weight:700;margin-top:2px">%s</div>%s</td>'
            % (label, value,
               ('<div style="font-size:11px;color:%s;margin-top:2px">%s</div>' % (note_color, note)) if note else ''))


def th(t, align='left'):
    return '<th style="text-align:%s;padding:7px 8px;font-weight:600">%s</th>' % (align, t)


def td(t, align='left'):
    return '<td style="text-align:%s;padding:9px 8px;vertical-align:top">%s</td>' % (align, t)


# ────────────────────────── 보고서 ──────────────────────────

def pick_messages(iso):
    cheer = [
        '어르신들, 어제 하루도 수고 많으셨습니다. 오늘은 앱에서 딱 5문제만 풀어 보셔요. 한 문제를 맞히는 그 순간이 실력이 됩니다.',
        '틀린 문제는 거름이 됩니다. 오늘 앱에서 틀렸던 문제를 한 번 더 만나 보시면, 금요일 수업이 훨씬 가벼워집니다.',
        '좌표 10문제는 10분이면 끝납니다. 차 한 잔 하시면서 오늘도 한 걸음만 함께 가요.',
        '꾸준함이 가장 큰 재능입니다. 오늘 한 번 앱에 들어오시기만 해도 도장이 하나 늘어요.']
    nudge = [
        '요즘 뵙기 어려워 안부 여쭙니다. 바쁘시면 앱에서 3문제만이라도 풀어 보셔요. 금요일에 뵐 날을 기다리겠습니다.',
        '지난번에 배운 내용, 잊기 전에 한 번만 다시 만나 보셔요. 앱 [문제풀기]에서 5분이면 됩니다. 언제든 편하게 돌아오세요.',
        '검정고시까지 한 문제씩이면 충분합니다. 쉬어 가셔도 괜찮아요. 오늘 한 문제로 다시 시작해 보셔요.']
    n = int(iso.replace('-', ''))
    return [{'tag': '격려 · 모두에게', 'text': cheer[n % len(cheer)]},
            {'tag': '독려 · 뜸한 학생에게', 'text': nudge[n % len(nudge)]}]


def build(logs, students, now):
    today = now.strftime('%Y-%m-%d')
    yday = days_ago(1, now)
    week_from = days_ago(CONFIG['COMPARE_DAYS'], now)

    admins = {s.get('name') for s in students if s.get('role') == 'admin'}
    def skip(n):
        return (not n) or n in admins or n in CONFIG['EXCLUDE_NAMES']

    logs = [l for l in logs if not skip(l.get('studentName'))]
    yday_logs = [l for l in logs if l.get('date') == yday]
    week_logs = [l for l in logs if week_from <= (l.get('date') or '') < yday]

    roster = [s for s in students if s.get('role') != 'admin' and not skip(s.get('name'))]
    active = {l.get('studentName') for l in yday_logs}
    nudge, long_gone = [], 0
    for s in roster:
        if s.get('name') in active:
            continue
        gap = day_gap(s.get('lastDate'), today)
        if CONFIG['NUDGE_AFTER_DAYS'] <= gap <= CONFIG['NUDGE_WITHIN_DAYS']:
            nudge.append({'name': s.get('name'), 'gap': gap})
        elif gap > CONFIG['NUDGE_WITHIN_DAYS']:
            long_gone += 1
    nudge.sort(key=lambda x: x['gap'])

    if not yday_logs:
        return no_data_report(yday, nudge, long_gone, len(roster), week_logs)
    return data_report(yday, yday_logs, week_logs, nudge, long_gone)


def data_report(yday, yday_logs, week_logs, nudge, long_gone):
    all_t = tally(yday_logs)
    week_t = tally(week_logs)
    by_stu = group_by(yday_logs, 'studentName')
    week_by_stu = group_by(week_logs, 'studentName')

    rows = []
    for name, rs in by_stu.items():
        t = tally(rs)
        w = tally(week_by_stu[name]) if name in week_by_stu else None
        days = len(group_by(week_by_stu[name], 'date')) if name in week_by_stu else 0
        tw = top_wrong(t['wrong'], 1)
        rows.append({'name': name, 't': t, 'w': w, 'days': days, 'top': tw[0] if tw else None})
    rows.sort(key=lambda r: -r['t']['q'])

    praise = [r for r in rows if (r['t']['rate'] is not None and r['t']['rate'] >= CONFIG['HIGH_RATE'] and r['t']['q'] >= 5)
              or not r['w'] or r['days'] >= 4]
    watch = [r for r in rows if r['t']['rate'] is not None and r['t']['rate'] < CONFIG['LOW_RATE'] and r['t']['q'] >= 5]
    class_wrong = top_wrong(all_t['wrong'], 3)

    diff = (all_t['rate'] - week_t['rate']) if (all_t['rate'] is not None and week_t['rate'] is not None) else None
    subject = '[태청야학 수학반] %s 학습 브리핑 — %d명 · %d문항 · 정답률 %d%%' % (
        kr_date(yday), len(rows), all_t['q'], all_t['rate'])

    h = shell(kr_date(yday) + ' 학습 브리핑', '어제 하루 앱에서 문제를 푼 기록입니다.')
    h += ('<table role="presentation" width="100%" cellspacing="0" cellpadding="0" '
          'style="border-collapse:collapse;margin:0 0 20px"><tr>')
    h += kpi('참여 학생', '%d명' % len(rows))
    h += kpi('푼 문항', '%d개' % all_t['q'], '%d묶음' % all_t['sessions'])
    h += kpi('정답률', '%d%%' % all_t['rate'],
             '지난 7일 기록 없음' if diff is None else '%s %d%%p (지난 7일 %d%%)' % ('▲' if diff >= 0 else '▼', abs(diff), week_t['rate']),
             '#7C837C' if diff is None else ('#2A6E4C' if diff >= 0 else '#A8382F'))
    h += kpi('학습 시간', '%d분' % round(all_t['sec'] / 60))
    h += '</tr></table>'

    h += sec('학생별 기록')
    h += ('<table role="presentation" width="100%" cellspacing="0" cellpadding="0" '
          'style="border-collapse:collapse;font-size:14px">'
          '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
          + th('학생') + th('한 것') + th('정답', 'center') + th('지난 7일') + th('가장 많이 틀린 유형') + '</tr>')
    for r in rows:
        types = '<br>'.join('%s%s' % (k, ' ×%d' % v if v > 1 else '') for k, v in r['t']['types'].items())
        if not r['w'] or r['w']['rate'] is None:
            trend = '<span style="color:#7C837C">이번 주 첫 기록</span>'
        else:
            d = r['t']['rate'] - r['w']['rate']
            col = '#2A6E4C' if d >= 5 else ('#A8382F' if d <= -10 else '#4B534C')
            trend = ('<span style="color:%s">%s %d%%p</span><br>'
                     '<span style="color:#7C837C;font-size:12px">%d일 참여 · 평균 %d%%</span>'
                     % (col, '▲' if d >= 0 else '▼', abs(d), r['days'], r['w']['rate']))
        rate_col = '#2A6E4C' if r['t']['rate'] >= CONFIG['HIGH_RATE'] else ('#A8382F' if r['t']['rate'] < CONFIG['LOW_RATE'] else '#1F2421')
        h += ('<tr style="border-bottom:1px solid #DCDED4">'
              + td('<b>%s</b><br><span style="color:#7C837C;font-size:12px">%s · %d분</span>'
                   % (esc(r['name']), r['t']['times'][0] if r['t']['times'] else '', max(1, round(r['t']['sec'] / 60))))
              + td('<span style="font-size:13px">%s</span>' % esc(types))
              + td('<b style="color:%s;font-size:16px">%d%%</b><br>'
                   '<span style="color:#7C837C;font-size:12px">%d / %d</span>'
                   % (rate_col, r['t']['rate'], r['t']['ok'], r['t']['q']), 'center')
              + td(trend)
              + td((esc(r['top']['topic']) + ' <span style="color:#7C837C">(%d)</span>' % r['top']['n'])
                   if r['top'] else '<span style="color:#2A6E4C">없음</span>')
              + '</tr>')
    h += '</table>'

    h += sec('오늘 챙기실 것')
    h += '<ul style="margin:0 0 8px;padding-left:18px;line-height:1.75;font-size:14px">'
    if praise:
        h += '<li><b style="color:#2A6E4C">칭찬하기</b> — ' + ', '.join(
            '%s(%s)' % (esc(r['name']),
                        '이번 주 첫 기록' if not r['w'] else ('꾸준히 %d일째' % (r['days'] + 1) if r['days'] >= 4 else '정답률 %d%%' % r['t']['rate']))
            for r in praise) + '</li>'
    if watch:
        h += ('<li><b style="color:#A8382F">살펴보기</b> — ' + ', '.join(
            '%s(%d%%%s)' % (esc(r['name']), r['t']['rate'], ', ' + esc(r['top']['topic']) if r['top'] else '')
            for r in watch) + ' · 문제를 더 주기보다 개념을 한 번 더 짚어 주세요.</li>')
    if class_wrong:
        h += ('<li><b>되돌아보기 추천 유형</b> — ' + ' · '.join('%s %d문항' % (esc(w['topic']), w['n']) for w in class_wrong)
              + ' (반 전체 오답 기준 · 오답 문제지로 출력)</li>')
    if nudge:
        h += ('<li><b>안부 전하기</b> — ' + ', '.join('%s(접속 %d일 전)' % (esc(n['name']), n['gap']) for n in nudge[:8])
              + (' 외 %d명' % (len(nudge) - 8) if len(nudge) > 8 else '') + '</li>')
    if not (praise or watch or class_wrong or nudge):
        h += '<li>특별히 챙길 것 없이 순조롭습니다.</li>'
    h += '</ul>'
    if long_gone:
        h += ('<p style="margin:0;color:#7C837C;font-size:12px">%d일 넘게 접속하지 않은 계정 %d개는 목록에서 뺐습니다.</p>'
              % (CONFIG['NUDGE_WITHIN_DAYS'], long_gone))
    h += foot()

    text = '%s · 참여 %d명 · %d문항 · 정답률 %d%%\n' % (kr_date(yday), len(rows), all_t['q'], all_t['rate'])
    text += '\n'.join('- %s : %d/%d (%d%%)%s' % (r['name'], r['t']['ok'], r['t']['q'], r['t']['rate'],
                                                 ' · 오답 ' + r['top']['topic'] if r['top'] else '') for r in rows)
    return {'subject': subject, 'html': h, 'text': text, 'hasData': True, 'date': yday}


def no_data_report(yday, nudge, long_gone, roster_count, week_logs):
    week_stu = len(group_by(week_logs, 'studentName'))
    subject = '[태청야학 수학반] %s 학습 브리핑 — 데이터 없음' % kr_date(yday)
    h = shell(kr_date(yday) + ' 학습 브리핑', '어제는 앱에 기록된 문제풀이가 없습니다.')
    h += ('<div style="background:#F3F4F1;border-left:4px solid #B7BCB0;padding:14px 16px;margin:0 0 20px;font-size:15px">'
          '<b style="font-size:17px">데이터 없음</b><br><span style="color:#4B534C">'
          '지난 %d일 동안 앱을 쓴 학생은 %d명입니다%s</span></div>'
          % (CONFIG['COMPARE_DAYS'], week_stu,
             '. 하루 쉬어 가는 날이었을 수 있어요.' if week_stu else '. 이번 주는 앱 숙제를 한 번 안내해 보시면 좋겠습니다.'))
    if nudge:
        h += sec('안부 전하면 좋은 학생 (최근 30일 안에 오다가 뜸해진 분)')
        h += ('<p style="margin:0 0 16px;font-size:14px;line-height:1.75">'
              + ' · '.join('<b>%s</b> <span style="color:#7C837C">접속 %d일 전</span>' % (esc(n['name']), n['gap'])
                           for n in nudge[:10])
              + (' 외 %d명' % (len(nudge) - 10) if len(nudge) > 10 else '') + '</p>')
    h += sec('보내기 좋은 격려 · 독려 문구')
    h += '<p style="margin:0 0 10px;color:#7C837C;font-size:12px">앱 공지나 단체 문자에 그대로 붙여 넣으셔도 됩니다.</p>'
    msgs = pick_messages(yday)
    for m in msgs:
        h += ('<div style="border:1px solid #DCDED4;padding:12px 14px;margin:0 0 10px;font-size:15px;line-height:1.7">'
              '<div style="font-size:11px;letter-spacing:.12em;color:#7C837C;margin-bottom:4px">%s</div>%s</div>'
              % (m['tag'], m['text']))
    if long_gone:
        h += ('<p style="margin:12px 0 0;color:#7C837C;font-size:12px">%d일 넘게 접속하지 않은 계정 %d개(전체 %d개 중)는 목록에서 뺐습니다.</p>'
              % (CONFIG['NUDGE_WITHIN_DAYS'], long_gone, roster_count))
    h += foot()

    text = '%s — 데이터 없음\n지난 %d일 앱을 쓴 학생 %d명\n' % (kr_date(yday), CONFIG['COMPARE_DAYS'], week_stu)
    if nudge:
        text += '안부 전할 학생: ' + ', '.join('%s(접속 %d일 전)' % (n['name'], n['gap']) for n in nudge[:10]) + '\n'
    text += '\n'.join('[%s] %s' % (m['tag'], m['text']) for m in msgs)
    return {'subject': subject, 'html': h, 'text': text, 'hasData': False, 'date': yday}


# ────────────────────────── 실행 ──────────────────────────

def main():
    now = datetime.now(KST)
    if len(sys.argv) > 1:                     # 특정 날짜 아침 기준으로 다시 만들어 보기
        now = datetime.strptime(sys.argv[1], '%Y-%m-%d').replace(tzinfo=KST)
    logs = fetch_logs_since(days_ago(CONFIG['COMPARE_DAYS'] + 1, now))
    students = fetch_students()
    r = build(logs, students, now)

    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'briefing.json'), 'w', encoding='utf-8') as f:
        json.dump(r, f, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, 'briefing.html'), 'w', encoding='utf-8') as f:
        f.write('<meta charset="utf-8">' + r['html'])
    print(json.dumps({'subject': r['subject'], 'hasData': r['hasData'], 'date': r['date'],
                      'out': os.path.join(out_dir, 'briefing.json')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
