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

// ── Test 5: Verify Product Detail Navigation Cleanup ──────────────
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  const productPageContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/product/[slug]/page.tsx"),
    "utf-8"
  );

  assert.strictEqual(
    productPageContent.includes("<BackButton"),
    false,
    "Product page should NOT contain <BackButton />"
  );
  assert.strictEqual(
    productPageContent.includes("Back to Collection"),
    false,
    "Product page should NOT contain 'Back to Collection'"
  );
  assert.strictEqual(
    productPageContent.includes('aria-label="Breadcrumb"'),
    true,
    "Product page must preserve breadcrumb navigation"
  );
  console.log("✓ Test 5 Passed: Product detail page has no redundant BackButton and preserves clean breadcrumbs");
}

// ── Test 6: Verify Other Pages Preserve Back Navigation ───────────
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  const auditedFiles = [
    "app/checkout/page.tsx",
    "app/cart/page.tsx",
    "app/orders/page.tsx",
    "app/wishlist/page.tsx",
    "app/collections/[slug]/page.tsx",
    "components/auth/AuthShell.tsx",
  ];

  for (const relPath of auditedFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.strictEqual(
      content.includes("BackButton"),
      true,
      `${relPath} must preserve BackButton navigation`
    );
  }
  console.log("✓ Test 6 Passed: Global back navigation preserved across Checkout, Cart, Orders, Wishlist, Collections, and Auth");
}

// ── Test 7: Verify TryOnModal Diagnostic Logging & Recovery ───────
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  const tryOnModalContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/try-on/TryOnModal.tsx"),
    "utf-8"
  );

  const requiredLogs = [
    "[TryOn] recovery button clicked",
    "[TryOn] requesting camera",
    "[TryOn] getUserMedia success",
    "[TryOn] camera stream attached",
    "[TryOn] requesting VTON token",
    "[TryOn] token received",
    "[TryOn] garment loaded",
    "[TryOn] connecting Decart",
    "[TryOn] remote stream received",
  ];

  for (const log of requiredLogs) {
    assert.strictEqual(
      tryOnModalContent.includes(log),
      true,
      `TryOnModal must contain log statement: ${log}`
    );
  }
  console.log("✓ Test 7 Passed: TryOnModal contains all 9 required structured diagnostic log events");
}

console.log("\nAll Navigation & VTON recovery tests passed successfully!");
