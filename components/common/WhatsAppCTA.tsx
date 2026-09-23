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
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
    >
      <MessageCircle className="w-5 h-5 fill-current" />
      <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline-block max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500">
        WhatsApp Concierge
      </span>
    </a>
  );
}
