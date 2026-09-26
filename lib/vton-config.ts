/**
 * ODESSI.TFI — Virtual Try-On Feature Configuration
 *
 * Controls whether the storefront displays Decart Anywear (customer-side Chrome extension/web app)
 * or the native Decart Developer API WebRTC try-on modal.
 *
 * Current state:
 * - ANYWEAR = ENABLED (active customer CTA, zero Odessi developer credits consumed)
 * - NATIVE_DECart_VTON = DISABLED (preserved and recoverable for future reactivation)
 */

export interface VtonConfig {
  provider: "anywear" | "native" | "both";
  enableAnywear: boolean;
  enableNativeVton: boolean;
  anywearUrl: string;
  anywearChromeExtensionUrl: string;
}

export const VTON_CONFIG: VtonConfig = {
  provider: (process.env.NEXT_PUBLIC_VTON_PROVIDER as "anywear" | "native" | "both") || "anywear",
  enableAnywear: true,
  enableNativeVton: false, // Set to true when Odessi API account has sufficient developer credits
  anywearUrl: "https://anywear.decart.ai",
  anywearChromeExtensionUrl:
    "https://chromewebstore.google.com/detail/anywear-live-virtual-try/nmbkpdjebjkhlnmkobgiknbfgghkhhpl",
};

export default VTON_CONFIG;
