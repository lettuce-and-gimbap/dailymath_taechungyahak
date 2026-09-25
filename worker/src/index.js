// 태청야학 수학반 알림 서버 (Cloudflare Worker · 무료 플랜)
// - 앱이 휴대폰 푸시 구독을 이름·역할과 함께 등록한다 (선생님 / 학생)
// - 새 학생 의견 · 선생님 피드백 · 전체 공지가 저장되면 앱이 /notify 에 "종류 + 문서 id" 만 보낸다.
//   서버가 Firestore 에서 그 문서를 직접 읽어 받을 사람과 문구를 정한다 → 아무나 임의 문구로 알림을 보낼 수 없다.
//   같은 문서로는 한 번만 보내고, 10분 넘게 지난 문서는 무시한다.
// - 푸시는 내용 없이 보내고(암호화 불필요), 휴대폰 sw.js 가 /inbox 에서 문구를 받아 알림을 띄운다.
// - 잠금 화면에 보이므로 의견·피드백 본문은 싣지 않는다 ("○○ 학생이 의견을 보냈어요" 까지만).

const ALLOWED_ORIGINS = ["https://lettuce-and-gimbap.github.io", "http://localhost:3000"];
const KINDS = {
  studentFeedback: { col: "studentFeedback", time: "sentAt" },
  feedback: { col: "feedback", time: "createdAt" },
  notice: { col: "notices", time: "createdAt" },
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      Vary: "Origin",
    };
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "content-type": "application/json" } });
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);

    try {
      if (url.pathname === "/vapid") return json({ publicKey: env.VAPID_PUBLIC_KEY });
      if (url.pathname === "/inbox") {
        const id = url.searchParams.get("id") || "";
        if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: "잘못된 id" }, 400);
        return json((await env.SUBS.get(`inbox:${id}`, "json")) || null);
      }
      if (request.method !== "POST") return json({ error: "not found" }, 404);
      const body = await request.json();

      if (url.pathname === "/subscribe") {
        const endpoint = body.subscription && body.subscription.endpoint;
        if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) return json({ error: "잘못된 구독 정보" }, 400);
        const name = str(body.name, 30), role = body.role === "admin" ? "admin" : "student";
        if (!name) return json({ error: "이름이 없습니다" }, 400);
        const id = await sha256hex(endpoint);
        await env.SUBS.put(`sub:${id}`, JSON.stringify({ endpoint, name, role }), { metadata: { name, role } });
        return json({ id });
      }
      if (url.pathname === "/notify") return json(await notify(env, body));

      const id = typeof body.id === "string" ? body.id : "";
      if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: "잘못된 id" }, 400);
      if (url.pathname === "/unsubscribe") {
        await env.SUBS.delete(`sub:${id}`);
        return json({ ok: true });
      }
      if (url.pathname === "/test") {
        const rec = await env.SUBS.get(`sub:${id}`, "json");
        if (!rec) return json({ error: "구독을 찾을 수 없어요. 알림을 다시 켜 주세요." }, 404);
        const r = await deliver(env, id, rec, { title: "🔔 알림이 잘 켜졌어요", body: "태청야학 수학반 알림을 이 휴대폰으로 받습니다." });
        return json({ ok: r === "sent" }, r === "sent" ? 200 : 502);
      }
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 400);
    }
  },
};

async function notify(env, body) {
  const kind = KINDS[body.kind] ? body.kind : null;
  const docId = typeof body.docId === "string" && /^[A-Za-z0-9]{10,40}$/.test(body.docId) ? body.docId : null;
  if (!kind || !docId) return { error: "잘못된 요청" };
  const once = `sent:${kind}:${docId}`;
  if (await env.SUBS.get(once)) return { skipped: "already" };

  const doc = await readDoc(env, KINDS[kind].col, docId);
  if (!doc) return { error: "문서를 찾을 수 없음" };
  const t = Date.parse(doc[KINDS[kind].time] || "");
  if (!t || Date.now() - t > 10 * 60 * 1000) return { skipped: "old" };
  await env.SUBS.put(once, "1", { expirationTtl: 7 * 86400 });

  let match, msg;
  if (kind === "studentFeedback") {
    match = (m) => m.role === "admin";
    msg = { title: "💬 새 학생 의견", body: `${doc.studentName || "학생"} 학생이 ${doc.voiceId ? "음성 " : ""}의견을 보냈어요.`, url: "./" };
  } else if (kind === "feedback") {
    match = (m) => m.role === "student" && m.name === doc.studentName;
    msg = { title: "💌 선생님의 피드백이 도착했어요", body: doc.voiceId ? "선생님 목소리 피드백이 있어요. 눌러서 들어 보세요." : "눌러서 확인해 보세요.", url: "./" };
  } else {
    match = (m) => m.role === "student";
    msg = { title: "📢 새 공지", body: doc.voiceId ? "선생님 음성 공지가 올라왔어요." : "새 공지가 올라왔어요. 눌러서 확인해 보세요.", url: "./" };
  }

  const result = { sent: 0, removed: 0, failed: 0 };
  let cursor;
  do {
    const page = await env.SUBS.list({ prefix: "sub:", cursor });
    for (const key of page.keys) {
      if (!match(key.metadata || {})) continue;
      const rec = await env.SUBS.get(key.name, "json");
      if (!rec) continue;
      const r = await deliver(env, key.name.slice(4), rec, msg);
      result[r === "sent" ? "sent" : r === "removed" ? "removed" : "failed"]++;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return result;
}

async function deliver(env, id, rec, msg) {
  await env.SUBS.put(`inbox:${id}`, JSON.stringify({ ...msg, ts: Date.now() }), { expirationTtl: 86400 });
  try {
    const res = await sendPush(env, rec.endpoint);
    if (res.status === 404 || res.status === 410) {
      await env.SUBS.delete(`sub:${id}`);
      return "removed";
    }
    return res.ok ? "sent" : "failed";
  } catch (e) {
    return "failed";
  }
}

// Firestore REST 로 문서 하나를 읽어 {필드: 값} 으로 돌려준다
async function readDoc(env, col, id) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT}/databases/(default)/documents/${col}/${id}?key=${env.FIREBASE_API_KEY}`);
  if (!res.ok) return null;
  const f = (await res.json()).fields || {};
  const out = {};
  for (const [k, v] of Object.entries(f)) out[k] = v.stringValue ?? v.timestampValue ?? v.integerValue ?? v.booleanValue ?? null;
  return out;
}

async function sendPush(env, endpoint) {
  const jwt = await vapidJwt(env, new URL(endpoint).origin);
  return fetch(endpoint, {
    method: "POST",
    headers: { TTL: "86400", Urgency: "high", Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`, "Content-Length": "0" },
  });
}

async function vapidJwt(env, audience) {
  const enc = new TextEncoder();
  const part = (obj) => b64url(enc.encode(JSON.stringify(obj)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })}`;
  const pub = fromB64url(env.VAPID_PUBLIC_KEY);
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x: b64url(pub.slice(1, 33)), y: b64url(pub.slice(33, 65)), d: env.VAPID_PRIVATE_KEY, ext: true },
    { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned));
  return `${unsigned}.${b64url(new Uint8Array(sig))}`;
}

function str(v, n) { return typeof v === "string" ? v.trim().slice(0, n) : ""; }
async function sha256hex(text) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function b64url(bytes) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function fromB64url(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
