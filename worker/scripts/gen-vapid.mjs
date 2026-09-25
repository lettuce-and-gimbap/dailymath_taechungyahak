// 웹 푸시용 VAPID 키 한 쌍을 만듭니다. 출력된 두 값을 wrangler secret으로 등록하세요.
// 비공개 키는 절대 저장소에 커밋하지 마세요.
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, "base64url"), Buffer.from(pub.y, "base64url")]);

console.log("VAPID_PUBLIC_KEY =", raw.toString("base64url"));
console.log("VAPID_PRIVATE_KEY =", priv.d);
