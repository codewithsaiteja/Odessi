"use client";

import { MessageCircle } from "lucide-react";

// WhatsApp Channel Concierge
// NEXT_PUBLIC_WHATSAPP_CHANNEL_URL — full channel URL (e.g. https://whatsapp.com/channel/...)
// Falls back to direct number wa.me link if NEXT_PUBLIC_WHATSAPP_NUMBER is set instead.
export function WhatsAppCTA({ message = "Hello Odessi.tfi, I would like to inquire about your apparel collections." }: { message?: string }) {
  const channelUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // Prefer channel URL, fall back to direct number, then hardcoded channel
  const url = channelUrl
    ?? (whatsappNumber
      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`
      : "https://whatsapp.com/channel/0029VbEVJmGJJhzdJO2F4a2S");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join ODESSI.TFI WhatsApp Concierge (opens in new tab)"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-[#080808]/90 hover:bg-[#111111] text-[#f3f0e8] border border-white/15 hover:border-[#b89a5a]/40 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 group"
    >
      <MessageCircle className="w-4 h-4 text-[#25D366]" />
      <span className="text-[10px] font-mono font-medium uppercase tracking-[0.18em] hidden sm:inline-block max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500">
        WhatsApp Concierge
      </span>
    </a>
  );
}
