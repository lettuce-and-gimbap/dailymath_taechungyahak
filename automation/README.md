# 아침 학습 브리핑 메일

보내는 방법이 두 가지입니다. **둘 중 하나만** 쓰세요 (둘 다 켜면 하루 두 통 옵니다).

| | A. Apps Script (`dailyBriefing.gs`) | B. 예약 작업 (`build_briefing.py`) |
|---|---|---|
| 어디서 도나 | 구글 서버 | 이 컴퓨터의 Claude 앱 |
| 컴퓨터가 꺼져 있으면 | **그래도 온다** | 앱을 켠 뒤에 온다 |
| 설치 | 아래 3분짜리 한 번 | 이미 걸려 있음 (매일 8시) |

두 방법이 만드는 메일 본문은 같습니다. **보고서 내용을 고칠 때는 두 파일을 함께 고쳐야 합니다.**

---


매일 아침 **8시~9시 사이**, **어제 하루** 학생들이 앱에서 문제 푼 기록을 선생님 본인 Gmail로 보냅니다.

- 기록이 있으면 → 참여 학생 · 푼 문항 · 정답률(지난 7일 대비) · 학생별 표 · 오늘 챙길 것(칭찬 / 살펴보기 / 되돌아보기 추천 유형 / 안부 전할 학생)
- 기록이 없으면 → **데이터 없음** + 안부 전할 학생 + 그대로 붙여 넣을 수 있는 격려·독려 문구 2개(날짜마다 바뀜)

Google Apps Script로 선생님 구글 계정 안에서 돌기 때문에 **컴퓨터가 꺼져 있어도** 발송되고, 비밀번호를 어디에도 저장하지 않습니다.
받는 주소는 코드에 없습니다 — 스크립트를 실행한 계정으로 보냅니다(나에게 보내기).

## A. Apps Script 설치 (처음 한 번, 약 3분)

1. <https://script.google.com> → **새 프로젝트**
2. `Code.gs` 내용을 지우고 [`dailyBriefing.gs`](dailyBriefing.gs) 전체를 붙여 넣기 → 저장
3. 왼쪽 **프로젝트 설정(톱니)** → "편집기에서 appsscript.json 매니페스트 파일 표시" 체크
   → 편집기에 생긴 `appsscript.json` 을 [`appsscript.json`](appsscript.json) 내용으로 바꾸기 → 저장
4. 위쪽 함수 목록에서 **`previewBriefing`** 고르고 ▶ 실행
   → "권한 검토" → 본인 계정 → "고급" → "(프로젝트 이름)으로 이동" → 허용
   → Gmail에 `[미리보기]` 메일이 오면 성공
5. 함수 목록에서 **`installTrigger`** 고르고 ▶ 실행 → 매일 8시~9시 예약 끝

끄기: `removeTrigger` 실행. 코드를 고쳤으면 붙여 넣기만 다시 하면 되고 예약은 그대로 남습니다.

## 알아 둘 것

- **발송 시각** : Google의 시간 예약은 정한 시각부터 1시간 안에 실행됩니다. `SEND_HOUR: 8` 이라 **8시~9시 사이**에 옵니다. 바꾸려면 숫자를 고친 뒤 `installTrigger` 를 한 번 더 실행하세요.
- **집계 기준** : `math_logs` 의 `date` 가 어제인 기록. 교사(`role: admin`) 계정과 `EXCLUDE_NAMES` 에 적은 확인용 계정은 뺍니다.
- **안부 전할 학생** : `users.lastDate`(마지막 **접속**일)가 3~30일 전인 학생. 30일 넘은 계정은 개수만 적습니다.
- **기준값 바꾸기** : 파일 맨 위 `CONFIG` 에서 발송 시각 · 비교 기간 · 칭찬/살펴보기 정답률 · 제외 계정을 고칩니다.
- **공개 저장소** : 이 폴더의 코드에는 학생 이름과 메일 주소를 넣지 않습니다. 이름은 메일 본문에만 들어갑니다.

## B. 예약 작업 (이 컴퓨터)

`automation/build_briefing.py` 가 Firestore에서 어제 기록을 읽어 메일 본문을 만들고
`automation/out/briefing.json` 에 저장하면, Claude 앱의 예약 작업이 그 값을 그대로 Gmail로 보냅니다.

```bash
# 직접 만들어 보기 (메일은 보내지 않고 본문만 만든다)
PYTHONIOENCODING=utf-8 python automation/build_briefing.py
PYTHONIOENCODING=utf-8 python automation/build_briefing.py 2026-09-13   # 그날 아침 기준으로 다시 만들기
```

- 결과 미리보기 : `automation/out/briefing.html` 을 브라우저로 열기
- 예약 관리 : Claude 앱 사이드바 **Scheduled** → 〈【매일 8시】태청야학 수학반 학습 브리핑 메일〉
- `automation/out/` 은 학생 이름이 들어가므로 `.gitignore` 로 빼 두었습니다.
