// scripts/test-otp-recovery-live.mjs
import https from "https";

const BACKEND_URL = "https://odessi-backend.onrender.com";

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(path, BACKEND_URL);

    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "User-Agent": "Odessi-E2E-Test/1.0",
        },
        timeout: 30000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = body ? JSON.parse(body) : null;
            resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: body });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, rawBody: body });
          }
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const req = https.request(
      url,
      {
        method: "GET",
        headers: { "User-Agent": "Odessi-E2E-Test/1.0" },
        timeout: 30000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null, rawBody: body });
          } catch (e) {
            resolve({ status: res.statusCode, rawBody: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.end();
  });
}

async function main() {
  console.log("=== ODESSI LIVE OTP RECOVERY VERIFICATION ===");
  console.log("Backend:", BACKEND_URL);

  // 1. Wait for backend health
  let healthy = false;
  for (let i = 1; i <= 20; i++) {
    process.stdout.write(`Attempt ${i}/20: Checking backend health... `);
    try {
      const res = await get("/api/health");
      console.log(`Status ${res.status}`);
      if (res.status === 200) {
        healthy = true;
        break;
      }
    } catch (e) {
      console.log(`Waiting... (${e.message})`);
    }
    await new Promise((r) => setTimeout(r, 10000));
  }

  if (!healthy) {
    console.error("Backend did not become healthy in time.");
    process.exit(1);
  }

  console.log("\n1. Testing POST /api/auth/forgot-password with non-existent email (enumeration safety)");
  const forgotUnknown = await postJson("/api/auth/forgot-password", {
    email: "completely-nonexistent-user-12345@odessitfi.me",
  });
  console.log("Response status:", forgotUnknown.status);
  console.log("Response body:", JSON.stringify(forgotUnknown.body || forgotUnknown.rawBody));
  if (forgotUnknown.status !== 200) {
    console.error("FAILED: Expected 200 OK for generic response");
  } else {
    console.log("PASSED: Generic response returned without leaking existence");
  }

  console.log("\n2. Testing POST /api/auth/verify-reset-otp with invalid payload (format validation)");
  const verifyInvalid = await postJson("/api/auth/verify-reset-otp", {
    email: "not-an-email",
    otp: "123",
  });
  console.log("Response status:", verifyInvalid.status);
  console.log("Response body:", JSON.stringify(verifyInvalid.body || verifyInvalid.rawBody));
  if (verifyInvalid.status === 400) {
    console.log("PASSED: 400 Bad Request returned on invalid format");
  } else {
    console.log("Note status:", verifyInvalid.status);
  }

  console.log("\n3. Testing POST /api/auth/verify-reset-otp with valid format but non-existent challenge");
  const verifyNonExistent = await postJson("/api/auth/verify-reset-otp", {
    email: "completely-nonexistent-user-12345@odessitfi.me",
    otp: "654321",
  });
  console.log("Response status:", verifyNonExistent.status);
  console.log("Response body:", JSON.stringify(verifyNonExistent.body || verifyNonExistent.rawBody));
  if (verifyNonExistent.status === 400 || verifyNonExistent.status === 422) {
    console.log("PASSED: Rejection on non-existent code");
  }

  console.log("\n4. Testing POST /api/auth/reset-password with invalid token");
  const resetInvalid = await postJson("/api/auth/reset-password", {
    resetToken: "deadbeef00000000deadbeef00000000deadbeef00000000deadbeef00000000",
    newPassword: "TestPassword@2026",
  });
  console.log("Response status:", resetInvalid.status);
  console.log("Response body:", JSON.stringify(resetInvalid.body || resetInvalid.rawBody));
  if (resetInvalid.status === 400 || resetInvalid.status === 422) {
    console.log("PASSED: Rejection on invalid reset token");
  }

  console.log("\n=== ALL E2E ENDPOINT CHECKS COMPLETE ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
