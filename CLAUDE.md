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
2026-06-22 이후 여러 커밋(`js/components/feedback.js`, `practice.js`, `teacherDashboard.js`,
`generators/setFunc.js` 수정)이 이 동기화를 누락해서, "고쳤다고 커밋했는데 실제 화면은 안 고쳐지는"
문제가 반복됐다 (오답 문제지 텍스트 잘림 버그가 대표 사례).

**`js/` 파일을 수정할 때마다 반드시:**
```bash
"/c/Users/sam04/AppData/Local/Programs/Python/Python312/python.exe" scripts_rebuild_index.py
```
를 실행해 `index.html`을 재생성한 뒤, `index.html`과 `js/*.js` 변경분을 함께 커밋한다.

## 📐 만능 학습지 (js/worksheet/ + js/components/gedWorksheet.js)

선생님 대시보드의 `만능학습지` 탭. 좌표 중심 프리셋 + 고졸 검정고시 1~20번 전 유형을
[개념] → [예제] → [실전 n문항] 형식으로 자동 생성하고, 인쇄/PDF · Firestore(`gedSheets`) 저장 · JSON 내보내기를 지원한다.

- `js/worksheet/gedCore.js` — 네임스페이스 `GS`. 수식 표기(nf/tex/poly…), 보기 생성(numChoices/coordChoices…),
  SVG 렌더러(planeSVG 좌표평면·수직선·내분점·조립제법·사상도), 카드/문서 HTML 템플릿, `SHEET_CSS`(미리보기·인쇄 공용).
  기존 전역(`pick`, `shuffle` 등)과 충돌하지 않도록 **모든 도우미는 `GS.` 안에만** 둔다.
- `js/worksheet/gedUnits.js` — `GED_AREAS`, `GED_UNITS`(23유형), `GED_PRESETS`.
  유형 하나 = `{id, tag, area, title, src, coord?, concept[], fields[], def, rand(), build(p)}`.
  `build`는 `{q, figure?, choices[4], raw?, layout?, ans, answerTex|answerRaw, sol[]}` 또는 `{err}`를 돌려준다.
  새 유형을 추가할 때는 이 배열에 객체 하나만 넣으면 탭·프리셋·인쇄에 자동 반영된다. `coord:true`면 ★(좌표 중심) 표시.
- `js/components/gedWorksheet.js` — React 탭 `GedWorksheetTab`. 문항별 조건 편집은 React, 문제 본문은 `GS.probHTML` 문자열을
  `dangerouslySetInnerHTML`로 넣고 KaTeX를 `GS.renderTex`로 렌더링. 글자 편집(override)은 `ovRef`에 보관해 커서가 튀지 않게 한다.
- 검증 스크립트(브라우저 콘솔): `GED_UNITS`를 순회하며 `rand()`→`build()` 300회씩 돌려 err/NaN/보기 중복이 0인지 확인.
- `scripts_rebuild_index.py`는 이제 `<script type="text/babel">` 줄을 직접 찾으므로 head에 줄을 추가해도 안전하다.
