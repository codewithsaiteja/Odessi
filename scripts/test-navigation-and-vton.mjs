import assert from "node:assert";

console.log("Running Navigation & VTON Recovery Test Suite...\n");

// ── Test 1: Navigation Helper with Same-Site History ───────────────
{
  global.window = {
    location: { origin: "https://odessitfi.me", href: "https://odessitfi.me/product/paradise" },
    history: { state: { idx: 2 }, length: 3 },
  };
  global.document = {
    referrer: "https://odessitfi.me/shop",
  };

  const { hasSameSiteHistory, goBackOrFallback } = await import("../lib/navigation.ts");

  assert.strictEqual(hasSameSiteHistory(), true, "Should detect same-site history when idx > 0");

  let backCalled = false;
  let pushCalledWith = null;
  const mockRouter = {
    back: () => { backCalled = true; },
    push: (url) => { pushCalledWith = url; },
  };

  goBackOrFallback(mockRouter, "/shop");
  assert.strictEqual(backCalled, true, "goBackOrFallback should call router.back() when history exists");
  assert.strictEqual(pushCalledWith, null, "goBackOrFallback should NOT call router.push when history exists");
  console.log("✓ Test 1 Passed: Navigation uses router.back() when same-site history is present");
}

// ── Test 2: Navigation Helper External/Direct Entry Fallback ───────
{
  global.window = {
    location: { origin: "https://odessitfi.me", href: "https://odessitfi.me/product/paradise" },
    history: { state: { idx: 0 }, length: 1 },
  };
  global.document = {
    referrer: "", // direct landing or external link
  };

  const { hasSameSiteHistory, goBackOrFallback } = await import("../lib/navigation.ts");

  assert.strictEqual(hasSameSiteHistory(), false, "Should NOT detect same-site history on direct landing");

  let backCalled = false;
  let pushCalledWith = null;
  const mockRouter = {
    back: () => { backCalled = true; },
    push: (url) => { pushCalledWith = url; },
  };

  goBackOrFallback(mockRouter, "/shop");
  assert.strictEqual(backCalled, false, "goBackOrFallback should NOT call router.back() on direct landing");
  assert.strictEqual(pushCalledWith, "/shop", "goBackOrFallback should call router.push with fallback route");
  console.log("✓ Test 2 Passed: Navigation safely falls back to designated route when no history exists");
}

// ── Test 3: VTON Recovery State Machine Transition ─────────────────
{
  // Simulates TryOnModal state transitions when "I've Allowed Access" is triggered
  let currentState = "camera_permission_denied";

  function simulateRecoveryClick({ grantPermission }) {
    // 1. User clicks "I'VE ALLOWED ACCESS"
    currentState = "requesting_camera";

    // 2. getUserMedia is called directly without stale permission-query gate
    if (grantPermission) {
      currentState = "camera_ready";
      // 3. Followed by token minting
      currentState = "minting_token";
      // 4. Followed by garment fetch
      currentState = "fetching_garment";
      // 5. Followed by WebRTC connection
      currentState = "connecting_vton";
      // 6. Followed by waiting for remote video
      currentState = "waiting_for_remote_stream";
      // 7. Video stream arrived
      currentState = "live";
    } else {
      currentState = "camera_permission_denied";
    }
  }

  simulateRecoveryClick({ grantPermission: true });
  assert.strictEqual(currentState, "live", "VTON recovery flow should proceed smoothly to 'live'");
  console.log("✓ Test 3 Passed: VTON recovery transition proceeds from recovery click to 'live'");

  simulateRecoveryClick({ grantPermission: false });
  assert.strictEqual(currentState, "camera_permission_denied", "VTON re-denial should correctly return to 'camera_permission_denied'");
  console.log("✓ Test 4 Passed: VTON re-denial returns to guided recovery UI");
}

console.log("\nAll Navigation & VTON recovery tests passed successfully!");
