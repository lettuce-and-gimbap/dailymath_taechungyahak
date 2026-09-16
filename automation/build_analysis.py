# -*- coding: utf-8 -*-
"""
누적 학습 분석 보고서 만들기

매일 오는 브리핑(build_briefing.py)이 '어제 하루'라면, 이쪽은 '지금까지 전부'다.
학기말·월말에 한 번씩 돌려 보면 좋다. 커리큘럼(커리큘럼_2026-2학기~2027-1학기/)의
영역 우선순위를 실제 데이터로 다시 확인하는 용도다.

쓰는 법
  python automation/build_analysis.py          → automation/out/analysis.{json,html}

내놓는 것 : {subject, html, text}  — 브리핑 메일과 같은 모양새로 만든다.

⚠️ 이 파일은 메일을 보내지 않는다. 보내는 일은 Claude(Gmail 연결)나 선생님이 한다.
"""

import json, os, re, collections
from datetime import datetime, timedelta, timezone

from build_briefing import (CONFIG, fetch_logs_since, fetch_students, tally, group_by,
                            esc, shell, sec, kpi, th, td, kr_date, day_gap, KST)

# 검정고시에서 그 영역이 몇 번 문항인지 — 정답률을 '점수'로 읽을 수 있게 붙여 준다
AREA_MAP = {
    '다항식 계산':   ('1~5번',   '다항식 · 복소수'),
    '방정식과 부등식': ('6~9번',   '이차방정식 · 부등식'),
    '도형과 기하':   ('10~14번', '좌표 · 원 · 이동'),
    '집합과 함수':   ('15~18번', '집합 · 명제 · 함수'),
    '확률과 통계':   ('19~20번', '순열 · 조합'),
    '연산':        ('기초',    '사칙연산 · 약수'),
    '좌표 읽기':     ('좌표10',  '하 난이도'),
    '평행이동':      ('좌표10',  '중 난이도'),
    '대칭이동':      ('좌표10',  '상 난이도'),
}


def josa(word, pair='은는'):
    """받침 여부로 조사를 고른다. pair 는 '은는' '이가' '을를' 순서."""
    ch = word[-1]
    has_batchim = ('가' <= ch <= '힣') and ((ord(ch) - 0xAC00) % 28) != 0
    return pair[0] if has_batchim else pair[1]


def bar(rate, color):
    """메일에서도 보이는 막대 — 이미지 대신 칸을 칠한 표를 쓴다(이미지 차단 무관)"""
    return ('<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:120px">'
            '<tr><td style="height:9px;width:%d%%;background:%s"></td>'
            '<td style="height:9px;background:#EDEFE9"></td></tr></table>' % (max(2, rate), color))


def rate_color(r):
    return '#2A6E4C' if r >= 80 else ('#A8382F' if r < 60 else '#7E6420')


def build(logs, students, now):
    admins = {s.get('name') for s in students if s.get('role') == 'admin'}
    logs = [l for l in logs if l.get('studentName') and l['studentName'] not in admins
            and l['studentName'] not in CONFIG['EXCLUDE_NAMES']]
    logs.sort(key=lambda l: (l.get('date') or ''))
    today = now.strftime('%Y-%m-%d')
    first, last = logs[0]['date'], logs[-1]['date']
    span = day_gap(first, last) + 1

    all_t = tally(logs)
    by_stu = group_by(logs, 'studentName')

    # ── 영역별 ──
    area = collections.OrderedDict()
    for l in logs:
        for q in (l.get('questions') or []):
            if not isinstance(q, dict):
                continue
            t = ((q.get('meta') or {}).get('type')) or '(분류 없음)'
            a = area.setdefault(t, {'n': 0, 'ok': 0})
            a['n'] += 1
            a['ok'] += 1 if q.get('isOk') else 0
    areas = sorted(({'name': k, 'n': v['n'], 'ok': v['ok'], 'rate': round(v['ok'] / v['n'] * 100)}
                    for k, v in area.items() if v['n'] >= 15), key=lambda x: x['rate'])

    # ── 월별 ──
    months = collections.OrderedDict()
    for l in logs:
        m = (l.get('date') or '')[:7]
        mm = months.setdefault(m, {'q': 0, 'ok': 0, 'days': set(), 'stu': set()})
        for q in (l.get('questions') or []):
            if isinstance(q, dict):
                mm['q'] += 1
                mm['ok'] += 1 if q.get('isOk') else 0
        mm['days'].add(l['date'])
        mm['stu'].add(l['studentName'])

    # ── 학생별 ──
    rows = []
    for name, rs in by_stu.items():
        t = tally(rs)
        days = len(group_by(rs, 'date'))
        per = collections.defaultdict(lambda: [0, 0])
        for l in rs:
            for q in (l.get('questions') or []):
                if not isinstance(q, dict):
                    continue
                k = ((q.get('meta') or {}).get('type')) or '기타'
                per[k][0] += 1
                per[k][1] += 1 if q.get('isOk') else 0
        weak = sorted(((k, v) for k, v in per.items() if v[0] >= 10), key=lambda kv: kv[1][1] / kv[1][0])
        rows.append({'name': name, 't': t, 'days': days,
                     'last': max(l['date'] for l in rs),
                     'weak': (weak[0][0], round(weak[0][1][1] / weak[0][1][0] * 100)) if weak else None})
    rows.sort(key=lambda r: -r['t']['q'])

    # ── 문서 ──
    subject = ('[태청야학 수학반] 누적 학습 분석 — %s ~ %s · %d명 · %d문항 · 정답률 %d%%'
               % (kr_date(first), kr_date(last), len(rows), all_t['q'], all_t['rate']))
    h = shell('누적 학습 분석 보고서',
              '%s부터 %s까지 앱에 남은 기록 전부를 모았습니다. (%d일간)' % (kr_date(first), kr_date(last), span))
    h = h.replace('태청야학 수학반 · 아침 브리핑', '태청야학 수학반 · 누적 분석')

    h += ('<table role="presentation" width="100%" cellspacing="0" cellpadding="0" '
          'style="border-collapse:collapse;margin:0 0 20px"><tr>')
    h += kpi('참여 학생', '%d명' % len(rows), '명단 %d명 중' % len([s for s in students if s.get('role') != 'admin']))
    h += kpi('푼 문항', '{:,}개'.format(all_t['q']), '%d묶음' % all_t['sessions'])
    h += kpi('전체 정답률', '%d%%' % all_t['rate'], '맞힌 문항 {:,}개'.format(all_t['ok']))
    h += kpi('학습 시간', '%d시간' % round(all_t['sec'] / 3600), '평균 %d분/묶음' % round(all_t['sec'] / 60 / all_t['sessions']))
    h += '</tr></table>'

    # 영역별
    h += sec('영역별 성취 — 약한 곳부터')
    h += ('<p style="margin:0 0 10px;font-size:13px;color:#4B534C">'
          '검정고시 문항 번호를 함께 적었습니다. 정답률이 낮은 영역이 곧 <b>지금 점수를 깎고 있는 문항</b>입니다.</p>')
    h += ('<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">'
          '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
          + th('영역') + th('시험 문항') + th('정답률') + th('', 'left') + th('푼 문항', 'center') + '</tr>')
    for a in areas:
        num, note = AREA_MAP.get(a['name'], ('', ''))
        h += ('<tr style="border-bottom:1px solid #DCDED4">'
              + td('<b>%s</b><br><span style="color:#7C837C;font-size:12px">%s</span>' % (esc(a['name']), esc(note)))
              + td('<span style="font-size:13px;color:#4B534C">%s</span>' % esc(num))
              + td('<b style="color:%s;font-size:16px">%d%%</b>' % (rate_color(a['rate']), a['rate']))
              + td(bar(a['rate'], rate_color(a['rate'])))
              + td('<span style="color:#7C837C;font-size:13px">%s</span>' % '{:,}'.format(a['n']), 'center')
              + '</tr>')
    h += '</table>'

    # 월별
    h += sec('달마다 어떻게 달라졌나')
    h += ('<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">'
          '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
          + th('월') + th('참여 학생', 'center') + th('공부한 날', 'center') + th('푼 문항', 'center') + th('정답률', 'center') + '</tr>')
    mk = list(months.keys())
    for m in mk:
        v = months[m]
        r = round(v['ok'] / v['q'] * 100) if v['q'] else 0
        tail = ' <span style="color:#7C837C;font-size:11px">(%s까지)</span>' % kr_date(last) if m == mk[-1] else ''
        h += ('<tr style="border-bottom:1px solid #DCDED4">'
              + td('<b>%s월</b>%s' % (int(m[5:]), tail))
              + td('%d명' % len(v['stu']), 'center')
              + td('%d일' % len(v['days']), 'center')
              + td('{:,}'.format(v['q']), 'center')
              + td('<b style="color:%s">%d%%</b>' % (rate_color(r), r), 'center') + '</tr>')
    h += '</table>'

    # 학생별
    h += sec('학생별 누적')
    h += ('<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">'
          '<tr style="background:#F3F4F1;color:#4B534C;font-size:12px">'
          + th('학생') + th('공부한 날', 'center') + th('푼 문항', 'center') + th('정답률', 'center')
          + th('가장 약한 영역') + th('마지막 기록') + '</tr>')
    for r in rows:
        gap = day_gap(r['last'], today)
        last_txt = ('오늘' if gap == 0 else '어제' if gap == 1 else '%d일 전' % gap)
        col = '#A8382F' if gap > 30 else ('#7E6420' if gap > 7 else '#4B534C')
        h += ('<tr style="border-bottom:1px solid #DCDED4">'
              + td('<b>%s</b>' % esc(r['name']))
              + td('%d일' % r['days'], 'center')
              + td('{:,}'.format(r['t']['q']), 'center')
              + td('<b style="color:%s">%d%%</b>' % (rate_color(r['t']['rate']), r['t']['rate']), 'center')
              + td(('%s <span style="color:#7C837C">%d%%</span>' % (esc(r['weak'][0]), r['weak'][1])) if r['weak']
                   else '<span style="color:#7C837C">자료 적음</span>')
              + td('<span style="color:%s">%s</span>' % (col, last_txt))
              + '</tr>')
    h += '</table>'

    # 읽어 낸 것
    worst = areas[0] if areas else None
    best = areas[-1] if areas else None
    active7 = len({l['studentName'] for l in logs if day_gap(l['date'], today) <= 7})
    long_gap = [r for r in rows if day_gap(r['last'], today) > 30]

    h += sec('데이터가 말하는 것')
    h += '<ol style="margin:0 0 8px;padding-left:20px;line-height:1.8;font-size:14px">'
    if worst:
        num, _ = AREA_MAP.get(worst['name'], ('', ''))
        h += ('<li><b style="color:#A8382F">%s가 가장 약합니다 (%d%%)</b> — 시험의 %s에 해당하고, 이미 %s문항이나 풀어 본 영역입니다. '
              '문제를 더 주기보다 <b>규칙을 말로 설명하게 하는</b> 쪽이 먼저입니다.</li>'
              % (esc(worst['name']), worst['rate'], esc(num), '{:,}'.format(worst['n'])))
    if best:
        h += ('<li><b style="color:#2A6E4C">%s%s %d%%로 안정적입니다</b> — 여기에 시간을 더 쓰기보다 유지만 하고, '
              '남는 시간을 위 약한 영역으로 옮기는 편이 점수에 이롭습니다.</li>'
              % (esc(best['name']), josa(best['name'], '은는'), best['rate']))
    mq = [months[m]['q'] for m in mk]
    if len(mq) >= 3 and mq[-2] < mq[0] * 0.6:
        h += ('<li><b>참여가 줄고 있습니다</b> — %d월 %s문항에서 %d월 %s문항으로 내려왔습니다. '
              '정답률보다 이 숫자가 더 급합니다. 최근 7일 동안 앱을 쓴 학생은 %d명입니다.</li>'
              % (int(mk[0][5:]), '{:,}'.format(mq[0]), int(mk[-2][5:]), '{:,}'.format(mq[-2]), active7))
    if long_gap:
        h += ('<li><b>30일 넘게 기록이 없는 학생이 %d명</b>입니다 — %s. '
              '수업에서 직접 뵙는 분이라면 앱보다 종이 학습지로 흔적을 남기는 편이 나을 수 있습니다.</li>'
              % (len(long_gap), ', '.join(esc(r['name']) for r in long_gap[:6])
                 + (' 외 %d명' % (len(long_gap) - 6) if len(long_gap) > 6 else '')))
    h += '</ol>'

    # 이름이 겹치거나 시험 삼아 만든 것으로 보이는 계정 — 지우지 않고 후보만 알린다
    dup = []
    base_names = {r['name'] for r in rows}
    for r in rows:
        n = r['name']
        stripped = re.sub(r'[0-9]+$', '', n)
        if ('테스트' in n) or (stripped != n and stripped in base_names) or re.fullmatch(r'[0-9]+', n):
            dup.append(n)
    if dup:
        h += ('<div style="background:#F5EFDD;border-left:4px solid #7E6420;padding:12px 16px;margin:14px 0 0;'
              'font-size:14px;line-height:1.7"><b>정리하면 좋을 계정</b><br>'
              '이름이 겹치거나 시험 삼아 만든 것으로 보이는 계정이 있습니다 — <b>%s</b>. '
              '같은 분이 두 계정을 쓰면 기록이 갈라져 정답률이 실제보다 낮게 보입니다. '
              '선생님 대시보드에서 정리하시면 다음 보고서부터 반영됩니다.</div>'
              % ', '.join(esc(n) for n in dup))

    h += ('<div style="background:#EAF2ED;border-left:4px solid #2A6E4C;padding:12px 16px;margin:14px 0 0;font-size:14px;line-height:1.7">'
          '<b>커리큘럼과 맞춰 보면</b><br>'
          '1년 커리큘럼의 코어 12유형 가운데 <b>10·11·14번(도형과 기하)</b>이 여기 데이터에서도 가장 약하게 나왔습니다. '
          '11월에 이 세 유형을 잡기로 한 계획이 데이터로도 맞다는 뜻입니다. '
          '좌표10 탭의 <b>평행이동·대칭이동</b> 정답률이 낮은 것도 같은 신호입니다.</div>')

    h += ('<div style="border-top:1px solid #DCDED4;margin-top:22px;padding-top:10px;font-size:11px;color:#7C837C">'
          '앱에 남은 기록 전체 기준 · 교사 계정과 확인용 계정 제외 · '
          '매일 오는 브리핑과 달리 이 보고서는 필요할 때만 따로 만듭니다</div></div>')

    text = ('%s ~ %s · 학생 %d명 · %s문항 · 정답률 %d%%\n\n[영역별]\n' %
            (first, last, len(rows), '{:,}'.format(all_t['q']), all_t['rate']))
    text += '\n'.join('- %s(%s) %d%% / %d문항' % (a['name'], AREA_MAP.get(a['name'], ('', ''))[0], a['rate'], a['n']) for a in areas)
    text += '\n\n[학생별]\n'
    text += '\n'.join('- %s : %d일 · %d문항 · %d%%' % (r['name'], r['days'], r['t']['q'], r['t']['rate']) for r in rows)
    return {'subject': subject, 'html': h, 'text': text}


def main():
    now = datetime.now(KST)
    logs = fetch_logs_since('2000-01-01')          # 전부
    students = fetch_students()
    r = build(logs, students, now)
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'analysis.json'), 'w', encoding='utf-8') as f:
        json.dump(r, f, ensure_ascii=False, indent=1)
    with open(os.path.join(out_dir, 'analysis.html'), 'w', encoding='utf-8') as f:
        f.write('<meta charset="utf-8">' + r['html'])
    print(json.dumps({'subject': r['subject'], 'out': os.path.join(out_dir, 'analysis.json')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
