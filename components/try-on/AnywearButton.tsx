"use client";

import React from "react";
import { Move } from "lucide-react";

interface AnywearButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function AnywearButton({ onClick, disabled = false, className = "" }: AnywearButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        console.log("[Anywear] try_on_anywear_clicked");
        onClick();
      }}
      disabled={disabled}
      aria-label="Try this piece on with Decart Anywear"
      className={`
        group relative w-full overflow-hidden rounded-sm px-5 py-3.5
        bg-[#0D0D0D] hover:bg-[#171717] active:bg-[#050505]
        text-white border border-[#262626] hover:border-[#D4AF37]/70
        shadow-[0_4px_16px_rgba(0,0,0,0.2)]
        transition-all duration-300 ease-out
        flex items-center justify-between
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="p-1.5 rounded-sm bg-neutral-900 border border-neutral-800 text-[#D4AF37] group-hover:text-[#F3E5AB] group-hover:scale-105 transition-transform duration-300 shrink-0">
          <Move size={14} strokeWidth={2} />
        </span>
        <div className="text-left">
          <div className="text-xs font-semibold tracking-[0.16em] uppercase text-white group-hover:text-[#F5F5F0] transition-colors">
            TRY WITH DECART ANYWEAR
          </div>
          <div className="text-[11px] text-neutral-400 group-hover:text-neutral-300 transition-colors">
            Try this piece on with Decart Anywear
          </div>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1.5">
        <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-mono font-medium px-2 py-0.5 rounded-sm bg-[#D4AF37]/10 border border-[#D4AF37]/25">
          DESKTOP CHROME
        </span>
      </div>
    </button>
  );
}

export default AnywearButton;
