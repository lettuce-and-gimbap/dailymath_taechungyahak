# CLAUDE.md

## SSH / Git Push 설정

### 실패한 방식
- **포트 22 (기본 SSH)**: `git@github.com` 으로 연결 시 포트 22가 방화벽에 의해 차단됨
  ```
  ssh: connect to host github.com port 22: Connection timed out
  ```

### 작동하는 방식
- **포트 443 우회**: `ssh.github.com:443` 을 사용해야 함
- SSH 키 경로: `C:/Users/sam04/.ssh/id_rsa`
- Push 명령:
  ```bash
  GIT_SSH_COMMAND="ssh -i /c/Users/sam04/.ssh/id_rsa -o StrictHostKeyChecking=no" \
    git push ssh://git@ssh.github.com:443/lettuce-and-gimbap/dailymath_taechungyahak.git main
  ```

### 2026-09-07 추가: 비대화형 셸(Claude Code 등)에서는 HTTPS가 확실함
- `id_rsa` 에 **패스프레이즈**가 걸려 있어 ssh-agent 없는 셸에서는 위 SSH 방식이 `Permission denied (publickey)` 로 실패한다.
- 대신 Git Credential Manager(`credential.helper=manager`)에 저장된 GitHub 토큰으로 HTTPS 푸시가 바로 된다:
  ```bash
  GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git push https://github.com/lettuce-and-gimbap/dailymath_taechungyahak.git main
  ```

### 영구 설정 방법 (선택)
`~/.ssh/config` 에 아래 내용을 추가하면 매번 명시하지 않아도 됨:
```
Host github.com
    Hostname ssh.github.com
    Port 443
    IdentityFile ~/.ssh/id_rsa
```

## ⚠️ index.html은 js/ 소스의 번들 결과물 — 반드시 동기화할 것

이 프로젝트는 번들러가 없다. 실제로 브라우저에 서빙되는 `index.html`은
`<script type="text/babel">` 안에 `js/` 폴더의 모든 파일을 `// ========== js\...\*.js ==========`
마커로 이어붙인 결과물이다 (순서는 `scripts_rebuild_index.py`의 `FILES` 목록 참고).

**`js/` 아래 파일만 고치고 `index.html`을 갱신하지 않으면 배포본에는 그 수정이 전혀 반영되지 않는다.**
2026-06-22 이후 여러 커밋(오답노트·문제풀기·선생님 대시보드·생성기 수정)이 이 동기화를 누락해서, "고쳤다고 커밋했는데 실제 화면은 안 고쳐지는"
문제가 반복됐다 (오답 문제지 텍스트 잘림 버그가 대표 사례).

**`js/` 파일을 수정할 때마다 반드시:**
```bash
"/c/Users/sam04/AppData/Local/Programs/Python/Python312/python.exe" scripts_rebuild_index.py
```
를 실행해 `index.html`을 재생성한 뒤, `index.html`과 `js/*.js` 변경분을 함께 커밋한다.

## 🗂 js/ 폴더 구조 — 계층 → 도메인 (2026-09-11 재분류)

**분류 기준 두 가지를 순서대로 적용한다.**
1. **계층** : 아래로 갈수록 위 계층에만 기댄다. `core → math → generators/worksheet → ui → student/teacher → app`
2. **도메인** : 같은 계층 안에서는 누가 쓰는지(학생/선생님)와 무엇을 다루는지(영역)로 나눈다.

```
js/
├── core/          앱 기반 — React·화면과 무관한 순수 로직
│   ├── constants.js     React 훅 구조분해 · 관리자 명단 · 요일
│   ├── utils.js         날짜/주차 · 수 계산 · 수식 문자열 포맷
│   ├── examSource.js    유형 → 기출 연도·회차·문항 번호 매핑
│   ├── logMetrics.js    유휴 시간 보정 · 망설임/수정 분류 · 문항 해시
│   └── db.js            Firestore 접근 (users · math_logs)
├── math/          수학 표현 — 여러 화면이 함께 쓰는 렌더링 재료
│   ├── primitives.js    격자·점·분수·루트 SVG 요소 + 캔버스 훅
│   ├── expr.js          MathExpr(=MathText) · QText
│   ├── explain.js       ExplanationBox
│   ├── graphPreview.js  문제의 graph 데이터를 그리는 React 미리보기
│   └── graphSvg.js      그래프 → SVG 문자열 (인쇄·PDF용)
├── generators/    문제 생성기 — UI 없는 순수 함수
│   ├── shared.js        보기 만들기 · 정답 텍스트 · 쉬운 해설 · 가중치 추첨
│   ├── elementary.js    초등 연산 · 약수/배수 · 문장제
│   ├── middle.js        중졸 검정고시 24유형
│   └── high/            고졸 검정고시
│       ├── explore.js      그래프 탐험 퀴즈 6종
│       ├── polynomial.js   ① 다항식과 복소수
│       ├── equation.js     ② 방정식과 부등식
│       ├── geometry.js     ③ 도형의 방정식
│       ├── setFunction.js  ④ 집합과 함수
│       └── probStat.js     ⑤ 확률과 통계
├── worksheet/     만능 학습지 엔진 (gedCore.js · gedUnits.js)
├── ui/            로그인·스플래시·인쇄 모달 등 학생/선생님 공용 화면
├── student/       학생 화면 (홈 · 문제풀기 · 기하학 · 모의고사 · 기록 · 숙제)
├── teacher/       선생님 화면 (학생관리 · 상세분석 · 오답노트 · 공지 · 학습지)
└── app.js         진입점
```

**새 코드를 넣을 자리를 고르는 법**
- 화면 없이 값만 계산한다 → `core/`
- 수식이나 그래프를 그리는데 여러 화면이 쓴다 → `math/`
- 문제를 만들어 낸다 → `generators/` (학교급 → 영역 순으로 내려간다)
- 특정 화면에서만 쓴다 → 그 화면을 보는 사람 폴더(`student/` 또는 `teacher/`)
- 학생·선생님이 함께 쓰는 화면 조각이다 → `ui/`

**한 파일에는 한 가지 역할만 둔다.** 파일 첫머리 주석에 그 역할과 쓰는 곳을 적어 둔다.
파일이 커져서 두 가지 일을 하게 되면 그때 나눈다 (예: 옛 `setFunc.js` 는 수식 렌더러 ·
그래프 미리보기 · 인쇄 모달 · 집합/함수 생성기 · 중졸 생성기가 한 파일에 2,919줄로 쌓여 있었다).

## 📐 만능 학습지 (js/worksheet/ + js/teacher/gedWorksheet.js)

선생님 대시보드의 `만능학습지` 탭. 좌표 중심 프리셋 + 고졸 검정고시 1~20번 전 유형을
[개념] → [예제] → [실전 n문항] 형식으로 자동 생성하고, 인쇄/PDF · Firestore(`gedSheets`) 저장 · JSON 내보내기를 지원한다.

- `js/worksheet/gedCore.js` — 네임스페이스 `GS`. 수식 표기(nf/tex/poly…), 보기 생성(numChoices/coordChoices…),
  SVG 렌더러(planeSVG 좌표평면·수직선·내분점·조립제법·사상도), 카드/문서 HTML 템플릿, `SHEET_CSS`(미리보기·인쇄 공용).
  기존 전역(`pick`, `shuffle` 등)과 충돌하지 않도록 **모든 도우미는 `GS.` 안에만** 둔다.
- `js/worksheet/gedUnits.js` — `GED_AREAS`, `GED_UNITS`(23유형), `GED_PRESETS`.
  유형 하나 = `{id, tag, area, title, src, coord?, concept[], fields[], def, rand(), build(p)}`.
  `build`는 `{q, figure?, choices[4], raw?, layout?, ans, answerTex|answerRaw, sol[]}` 또는 `{err}`를 돌려준다.
  새 유형을 추가할 때는 이 배열에 객체 하나만 넣으면 탭·프리셋·인쇄에 자동 반영된다. `coord:true`면 ★(좌표 중심) 표시.
- `js/teacher/gedWorksheet.js` — React 탭 `GedWorksheetTab`. **작업대(여러 장 보관) 방식**:
  `sheets:[{id,cfg,problems,docId,collapsed,edit,showCtrl,createdAt}]` 배열을 들고 있고, [새 학습지 추가]는 기존 장을
  지우지 않고 맨 앞에 한 장을 더한다(기존 장은 자동으로 접힘). 접힌 장은 DOM을 아예 그리지 않아 여러 장이어도 가볍다.
  학습지마다 접기/펼치기 · 저장(클라우드) · 반출(인쇄/PDF · 새 탭 · JSON) · 삭제 버튼을 가진다.
  문항별 조건 편집은 React, 문제 본문은 `GS.probHTML` 문자열을 `dangerouslySetInnerHTML`로 넣고 KaTeX를 `GS.renderTex`로 렌더링.
  글자 편집(override)은 `ovRef`(문항 key → HTML)에 보관해 커서가 튀지 않게 한다. 문항 key는 장을 넘어 유일하다.
  임시저장 키는 `ged_sheet_builder_v2`이며, 예전 단일 학습지(`..._v1`)는 `gedLoadInit()`이 한 장으로 자동 이관한다.
- 검증 스크립트(브라우저 콘솔): `GED_UNITS`를 순회하며 `rand()`→`build()` 300회씩 돌려 err/NaN/보기 중복이 0인지 확인.
- `scripts_rebuild_index.py`는 이제 `<script type="text/babel">` 줄을 직접 찾으므로 head에 줄을 추가해도 안전하다.

## 📁 작업 범위 — 이 저장소 안에서만 (2026-09-11 ~)

태청야학 수학반 관련 산출물은 **코드든 문서든 모두 이 저장소(`dailymath_taechungyahak/`) 안에서만**
만들고, 고치고, 분류한다. OneDrive `태청야학` 폴더 등 저장소 밖에는 새 파일을 만들지 않는다.
(기존 hwpx/pdf/xlsx 원본 자료는 **읽기 전용 참고 자료**로만 열어 본다.)

```
dailymath_taechungyahak/
├── js/                      앱 소스 (계층별 폴더 — 위 "js/ 폴더 구조" 참고)
│                            고친 뒤 반드시 scripts_rebuild_index.py 실행
├── index.html               js/ 의 번들 결과물 (직접 편집 금지)
├── scripts_rebuild_index.py
└── 커리큘럼_2026-2학기~2027-1학기/   수업 운영 문서
    ├── 01_수학반 커리큘럼_2026.09-2027.04.md   9월~4월 주차별 계획 · 90분 운영 표준
    ├── 02_학생 성장지표 설계서 및 기록양식.md   학생용 5지표 · ★판정 기준 · 기록 양식
    └── 03_학생 성장카드.html                    학생 배부용 A4 카드 (브라우저에서 Ctrl+P)
```

새 문서를 만들 때도 위 트리의 알맞은 폴더에 넣는다. 학기·연도가 바뀌면
`커리큘럼_<학기>/` 형태로 폴더를 하나 더 만들어 분류한다.
