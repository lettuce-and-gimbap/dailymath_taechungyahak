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
