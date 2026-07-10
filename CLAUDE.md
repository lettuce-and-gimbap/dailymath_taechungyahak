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
