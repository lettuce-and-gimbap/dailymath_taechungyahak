# 휴대폰 알림 서버 (Cloudflare Worker `taechung-push`)

새 학생 의견 → 선생님 폰, 선생님 피드백 → 그 학생 폰, 전체 공지 → 학생 전체 폰으로 알림을 보냅니다.
Cloudflare 무료 플랜으로 충분합니다. 주소 : https://taechung-push.gimbap-lettuce.workers.dev

## 동작
1. 앱의 🔔 **알림 켜기**가 휴대폰 푸시 구독을 이름·역할(선생님/학생)과 함께 이 서버에 등록합니다 (KV `SUBS`).
2. 앱이 의견·피드백·공지를 Firestore 에 저장한 뒤 `/notify` 에 **종류와 문서 id 만** 보냅니다.
3. 서버가 Firestore 에서 그 문서를 직접 읽어 받을 사람을 정합니다. 같은 문서는 한 번만, 10분 넘은 문서는 무시합니다
   → 누가 주소를 알아도 임의 문구로 알림을 보낼 수 없습니다.
4. 푸시는 내용 없이 보내고, 휴대폰의 `sw.js` 가 `/inbox` 에서 문구를 받아 띄웁니다. 잠금 화면에 보이므로 의견 본문은 싣지 않습니다.

## 다시 배포 (코드를 고쳤을 때)
```bash
npx wrangler deploy
```
VAPID 키는 `npx wrangler secret put VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` 로 등록되어 있습니다. **비공개 키는 저장소에 올리지 않습니다.**
키를 새로 만들면(`node scripts/gen-vapid.mjs`) 기존 구독이 모두 끊겨 다들 알림을 다시 켜야 합니다.
