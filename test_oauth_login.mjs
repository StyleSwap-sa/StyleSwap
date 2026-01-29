import { SignJWT } from "jose";

// Test creating a session token
const secret = process.env.JWT_SECRET || "test-secret";
const secretKey = new TextEncoder().encode(secret);

const issuedAt = Date.now();
const expiresInMs = 1000 * 60 * 60 * 24 * 365; // 1 year
const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

const sessionToken = await new SignJWT({
  openId: "styleswap-owner-001",
  appId: "D76VHaJuXXxVHZHmea7vdc",
  name: "StyleSwap Owner",
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setExpirationTime(expirationSeconds)
  .sign(secretKey);

console.log("Session Token:", sessionToken);
console.log("\nTest with curl:");
console.log(`curl -s "http://localhost:3000/api/trpc/auth.me" -H "Cookie: app_session_id=${sessionToken}" | jq`);
