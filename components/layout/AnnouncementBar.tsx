"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function AnnouncementBar() {
  const { messages, interval } = siteConfig.announcement;
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);

  const advance = useCallback(() => {
    if (messages.length <= 1) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % messages.length);
      setAnimating(false);
    }, 300);
  }, [messages.length]);

  useEffect(() => {
    if (!visible || messages.length <= 1) return;
    const id = setInterval(advance, interval);
    return () => clearInterval(id);
  }, [visible, advance, interval, messages.length]);

  if (!visible || !siteConfig.announcement.enabled) return null;

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="relative bg-[var(--color-odessi-black)] text-[var(--color-odessi-white)] overflow-hidden"
      style={{ minHeight: "var(--announcement-height)" }}
    >
      <div className="container-odessi flex items-center justify-center min-h-[40px] py-2.5">
        {/* Message */}
        <p
          className={`type-caption text-center transition-opacity duration-300 ${
            animating ? "opacity-0" : "opacity-100"
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          {messages[current]}
        </p>

        {/* Dismiss */}
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss announcement"
          className="absolute right-4 md:right-6 lg:right-10 p-1 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 rounded-sm"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Progress dots */}
      {messages.length > 1 && (
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
          aria-hidden="true"
        >
          {messages.map((_, i) => (
            <span
              key={i}
              className={`block w-1 h-1 rounded-full transition-opacity duration-300 ${
                i === current
                  ? "bg-white opacity-80"
                  : "bg-white opacity-30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
