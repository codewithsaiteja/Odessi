"use client";

import { useEffect } from "react";
import { sellerApi } from "@/lib/api/seller";

export default function SellerAttributionTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const sellerCode = params.get("seller") || params.get("ref");

      if (sellerCode && sellerCode.trim()) {
        const cleanCode = sellerCode.trim().toUpperCase();
        // Validate with server and persist if valid
        sellerApi
          .validateCode(cleanCode)
          .then((isValid) => {
            if (isValid) {
              localStorage.setItem("odessi_seller_code", cleanCode);
            }
          })
          .catch(() => {
            // In case of temporary network issue, store tentatively
            localStorage.setItem("odessi_seller_code", cleanCode);
          });
      }
    } catch {
      // Ignore localStorage errors in private browsing modes
    }
  }, []);

  return null;
}
