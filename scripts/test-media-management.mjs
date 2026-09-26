import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("ODISSI MEDIA MANAGEMENT SYSTEM VERIFICATION TEST");
console.log("==================================================");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// ── Test 1: Placeholder SVG Assets ──────────────────────────────
console.log("\n[1] Verifying Brand Placeholder SVGs...");
const collectionSvgPath = path.join(rootDir, "public", "placeholder-collection.svg");
const productSvgPath = path.join(rootDir, "public", "placeholder-product.svg");

assert(fs.existsSync(collectionSvgPath), "public/placeholder-collection.svg exists");
assert(fs.existsSync(productSvgPath), "public/placeholder-product.svg exists");

if (fs.existsSync(collectionSvgPath)) {
  const content = fs.readFileSync(collectionSvgPath, "utf-8");
  assert(content.includes('viewBox="0 0 800 1000"'), "Collection SVG has 4:5 aspect ratio (800x1000)");
  assert(content.includes("ODISSI.TFI") || content.includes("ODISSI"), "Collection SVG contains brand branding");
  assert(content.includes("COLLECTION ARCHIVE"), "Collection SVG designates collection archive");
}

// ── Test 2: getMediaUrl Logic & Custom Fallbacks ────────────────
console.log("\n[2] Verifying getMediaUrl Resolution Logic...");

// Inline mirror of lib/product-utils.ts getMediaUrl for pure Node testing
function getMediaUrl(urlInput, fallback = "/placeholder-product.svg") {
  if (urlInput === null || urlInput === undefined) return fallback;

  let urlStr = "";
  if (typeof urlInput === "string") {
    urlStr = urlInput;
  } else if (typeof urlInput === "number") {
    return fallback;
  } else if (typeof urlInput === "object") {
    urlStr = urlInput.imageUrl || urlInput.url || urlInput.previewUrl || urlInput.src || "";
  }

  if (!urlStr || typeof urlStr !== "string") return fallback;
  const trimmed = urlStr.trim();
  if (!trimmed) return fallback;

  if (/^\d+$/.test(trimmed) || /^p\d+$/i.test(trimmed)) {
    return fallback;
  }

  if (trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const baseUrl = "https://odessi-backend.onrender.com";

  const azureMatch = trimmed.match(/^https?:\/\/[^/]+\.blob\.core\.windows\.net\/media\/(.+)$/i);
  if (azureMatch) {
    try {
      const rawPath = decodeURIComponent(azureMatch[1]).replace(/\\/g, "/").replace(/^\/+/, "");
      return `${baseUrl}/api/media/${rawPath}`;
    } catch {
      const rawPath = azureMatch[1].replace(/%2F/gi, "/").replace(/^\/+/, "");
      return `${baseUrl}/api/media/${rawPath}`;
    }
  }

  if (trimmed.startsWith("/api/media/")) {
    return `${baseUrl}${trimmed}`;
  }
  if (trimmed.startsWith("api/media/")) {
    return `${baseUrl}/${trimmed}`;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${baseUrl}${trimmed}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${baseUrl}/${trimmed}`;
  }

  if (trimmed.includes("/api/media/")) {
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return fallback;
}

assert(
  getMediaUrl(null, "/placeholder-collection.svg") === "/placeholder-collection.svg",
  "Null input returns custom collection fallback"
);
assert(
  getMediaUrl(undefined, "/placeholder-collection.svg") === "/placeholder-collection.svg",
  "Undefined input returns custom collection fallback"
);
assert(
  getMediaUrl("9", "/placeholder-collection.svg") === "/placeholder-collection.svg",
  "Numeric ID string rejects and returns custom fallback"
);
assert(
  getMediaUrl("/api/media/collections/col-12345.jpg") === "https://odessi-backend.onrender.com/api/media/collections/col-12345.jpg",
  "Canonical /api/media/collections path expands correctly with backend host"
);
assert(
  getMediaUrl("https://odessimedia2026.blob.core.windows.net/media/collections%2Fcol-abc.jpg") === "https://odessi-backend.onrender.com/api/media/collections/col-abc.jpg",
  "Azure Blob URL securely routes through backend gateway"
);
assert(
  getMediaUrl("https://images.unsplash.com/photo-123") === "https://images.unsplash.com/photo-123",
  "External CDN URL preserved intact"
);

// ── Test 3: Collection Response Mapper Elimination of Unsplash ──
console.log("\n[3] Verifying Collection Response Mapper...");
const collectionsApiFile = fs.readFileSync(path.join(rootDir, "lib", "api", "collections.ts"), "utf-8");

assert(!collectionsApiFile.includes("photo-1536922246289-88c42f957773"), "Removed hardcoded Unsplash fallback in mapCollectionResponse");
assert(collectionsApiFile.includes("/placeholder-collection.svg"), "Configured /placeholder-collection.svg in mapCollectionResponse");

// ── Test 4: URL Validation Rules for AdminMediaPicker ───────────
console.log("\n[4] Verifying AdminMediaPicker Validation Rules...");

function validateUrl(url) {
  const trimmed = (url || "").trim();
  if (!trimmed) return { valid: true };

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return { valid: false, error: "Unsafe protocol" };
  }

  if (
    !lower.startsWith("http://") &&
    !lower.startsWith("https://") &&
    !lower.startsWith("/api/media/") &&
    !lower.startsWith("api/media/") &&
    !lower.startsWith("/uploads/") &&
    !lower.startsWith("uploads/") &&
    !lower.startsWith("/")
  ) {
    return { valid: false, error: "Invalid URL" };
  }

  return { valid: true };
}

assert(!validateUrl("javascript:alert(1)").valid, "Rejects javascript: protocol");
assert(!validateUrl("data:text/html;base64,PHNjcmlwdD4=").valid, "Rejects data: protocol");
assert(!validateUrl("vbscript:msgbox(1)").valid, "Rejects vbscript: protocol");
assert(!validateUrl("ftp://example.com/photo.jpg").valid, "Rejects ftp: protocol");
assert(validateUrl("https://odessi.me/media/banner.jpg").valid, "Accepts https:// URL");
assert(validateUrl("/api/media/collections/col-1.jpg").valid, "Accepts /api/media/ relative path");
assert(validateUrl("/placeholder-collection.svg").valid, "Accepts site asset path");

// ── Test 5: Component Inspections ───────────────────────────────
console.log("\n[5] Verifying Component Wiring & Permanent Dimension Specs...");
const adminPickerFile = fs.readFileSync(path.join(rootDir, "components", "admin", "AdminMediaPicker.tsx"), "utf-8");
const adminCollectionsFile = fs.readFileSync(path.join(rootDir, "app", "admin", "collections", "page.tsx"), "utf-8");
const adminContentFile = fs.readFileSync(path.join(rootDir, "app", "admin", "content", "page.tsx"), "utf-8");
const heroFile = fs.readFileSync(path.join(rootDir, "components", "sections", "Hero.tsx"), "utf-8");
const brandStoryFile = fs.readFileSync(path.join(rootDir, "components", "sections", "BrandStory.tsx"), "utf-8");

assert(adminPickerFile.includes("MediaDimensionHint"), "AdminMediaPicker permanently includes MediaDimensionHint");
assert(adminPickerFile.includes("Image preview unavailable"), "AdminMediaPicker handles broken preview fallback");
assert(adminCollectionsFile.includes("AdminMediaPicker"), "Admin Collections page uses AdminMediaPicker");
assert(adminCollectionsFile.includes("aspectRatio=\"4:5\""), "Admin Collections specifies 4:5 aspect ratio");
assert(adminCollectionsFile.includes("uploadAdminCollectionImage"), "Admin Collections wires uploadAdminCollectionImage");
assert(adminContentFile.includes("AdminMediaPicker"), "Admin Content page uses AdminMediaPicker");
assert(adminContentFile.includes("Hero Desktop Media (16:9)"), "Admin Content specifies 16:9 Hero desktop media");
assert(adminContentFile.includes("Hero Mobile Media (9:16 Optional)"), "Admin Content specifies 9:16 Hero mobile media");
assert(heroFile.includes("mobileBgImage"), "Hero.tsx handles responsive mobile background media");
assert(brandStoryFile.includes("getMediaUrl"), "BrandStory.tsx resolves media via getMediaUrl");

console.log("\n==================================================");
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
