"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { goBackOrFallback } from "@/lib/navigation";

export interface BackButtonProps {
  /**
   * Fallback destination URL if no in-app history exists (e.g. direct entry from external link).
   * Default: "/shop"
   */
  fallback?: string;
  /**
   * Human-readable label. If omitted, defaults to "Back".
   */
  label?: string;
  /**
   * Optional custom CSS class.
   */
  className?: string;
  /**
   * Visual theme variant:
   * - "default": Subtle dark on light
   * - "light": Light text on dark backgrounds
   * - "minimal": Compact button
   */
  variant?: "default" | "light" | "minimal";
  /**
   * Optional click override callback before navigation occurs
   */
  onClick?: () => void;
}

export function BackButton({
  fallback = "/shop",
  label = "Back",
  className = "",
  variant = "default",
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
    goBackOrFallback(router, fallback);
  };

  const baseStyles =
    "inline-flex items-center gap-1.5 min-h-[44px] py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 select-none group focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-odessi-gold)] cursor-pointer";

  const variantStyles =
    variant === "light"
      ? "text-neutral-400 hover:text-white"
      : "text-[var(--color-odessi-stone)] hover:text-[var(--color-odessi-black)]";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      <ArrowLeft
        size={14}
        className="transition-transform duration-200 group-hover:-translate-x-1 shrink-0"
        strokeWidth={2}
      />
      <span>{label}</span>
    </button>
  );
}

export default BackButton;
