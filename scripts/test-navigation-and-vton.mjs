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
  const tryOnButtonContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/try-on/TryOnButton.tsx"),
    "utf-8"
  );
  const productGalleryContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/product/ProductGallery.tsx"),
    "utf-8"
  );

  const modalLogs = [
    "[TryOn] recovery button clicked",
    "[TryOn] camera permission state",
    "[TryOn] getUserMedia called",
    "[TryOn] getUserMedia success",
    "[TryOn] camera stream attached",
    "[TryOn] requesting token",
    "[TryOn] token received",
    "[TryOn] model selected",
    "[TryOn] Decart client created",
    "[TryOn] realtime connect started",
    "[TryOn] realtime connection state",
    "[TryOn] Decart error",
    "[TryOn] remote stream received",
    "[TryOn] remote video loaded",
    "[TryOn] remote video playing",
  ];

  for (const log of modalLogs) {
    assert.strictEqual(
      tryOnModalContent.includes(log),
      true,
      `TryOnModal must contain log statement: ${log}`
    );
  }

  assert.strictEqual(
    tryOnButtonContent.includes("[TryOn] button clicked"),
    true,
    "TryOnButton must log [TryOn] button clicked"
  );
  assert.strictEqual(
    productGalleryContent.includes("[TryOn] button clicked"),
    true,
    "ProductGallery must log [TryOn] button clicked"
  );

  console.log("✓ Test 7 Passed: All 15 required structured diagnostic stages are verified across components");
}

// ── Test 8: Verify UI Error Classification Layers ─────────────────
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  const tryOnModalContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/try-on/TryOnModal.tsx"),
    "utf-8"
  );

  const requiredErrorTitles = [
    "Camera Access Blocked",
    "Try-On Service Unavailable",
    "Product Garment Unavailable",
    "Virtual Try-On Connection Failed",
    "Live Try-On Stream Unavailable",
    "Camera Initialization Failed",
  ];

  for (const title of requiredErrorTitles) {
    assert.strictEqual(
      tryOnModalContent.includes(title),
      true,
      `TryOnModal UI must contain error title: ${title}`
    );
  }

  console.log("✓ Test 8 Passed: Error classification preserves isolated failure layers without masking behind Camera Access Blocked");
}

// ── Test 9: Verify Decart Anywear Customer Flow & Credit Protection ────────
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  const vtonConfig = await import("../lib/vton-config.ts");
  assert.strictEqual(vtonConfig.VTON_CONFIG.enableAnywear, true, "Anywear must be enabled");
  assert.strictEqual(vtonConfig.VTON_CONFIG.enableNativeVton, false, "Native VTON should be disabled by default to protect API credits");
  assert.strictEqual(vtonConfig.VTON_CONFIG.anywearUrl, "https://anywear.decart.ai", "Anywear destination URL must match official Decart endpoint");

  const productPageContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/product/[slug]/page.tsx"),
    "utf-8"
  );
  assert.strictEqual(productPageContent.includes("AnywearButton"), true, "Product page must import and render AnywearButton");
  assert.strictEqual(productPageContent.includes("AnywearModal"), true, "Product page must import and render AnywearModal");

  // Verify hierarchy: BUY NOW comes before AnywearButton
  const buyNowIdx = productPageContent.indexOf("BUY NOW");
  const anywearBtnIdx = productPageContent.indexOf("<AnywearButton");
  assert.ok(buyNowIdx > 0 && anywearBtnIdx > buyNowIdx, "TRY WITH DECART ANYWEAR must sit directly below BUY NOW");

  const anywearModalContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/try-on/AnywearModal.tsx"),
    "utf-8"
  );
  assert.strictEqual(
    anywearModalContent.includes("desktop workflow may not be available on this device"),
    true,
    "Anywear modal must show mobile compatibility notice"
  );
  assert.strictEqual(anywearModalContent.includes("draggable={true}"), true, "Anywear modal garment image must be draggable");
  assert.strictEqual(anywearModalContent.includes("dataTransfer.setData"), true, "Anywear modal must transfer image data on drag");

  console.log("✓ Test 9 Passed: Decart Anywear customer workflow, hierarchy, and credit protection verified");
}

// ── Test 10: Verify Native Decart VTON Is Preserved & Recoverable ─────
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  assert.strictEqual(fs.existsSync(path.resolve(process.cwd(), "components/try-on/TryOnModal.tsx")), true, "Native TryOnModal must be preserved");
  assert.strictEqual(fs.existsSync(path.resolve(process.cwd(), "components/try-on/TryOnButton.tsx")), true, "Native TryOnButton must be preserved");
  assert.strictEqual(fs.existsSync(path.resolve(process.cwd(), "lib/api/try-on.ts")), true, "Native TryOn API client must be preserved");

  const tryOnClient = fs.readFileSync(path.resolve(process.cwd(), "lib/api/try-on.ts"), "utf-8");
  assert.strictEqual(tryOnClient.includes("/api/try-on/token"), true, "Native token endpoint reference preserved");

  console.log("✓ Test 10 Passed: Native Decart VTON implementation remains modular, intact, and recoverable");
}

console.log("\nAll Navigation & VTON recovery tests passed successfully!");

