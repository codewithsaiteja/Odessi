"use client";

import { useEffect, useState } from "react";
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";

interface SessionExpirationWarningProps {
  isOpen: boolean;
  remainingSeconds: number;
  onExtend: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function SessionExpirationWarning({
  isOpen,
  remainingSeconds,
  onExtend,
  onLogout,
}: SessionExpirationWarningProps) {
  const [isExtending, setIsExtending] = useState(false);

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const handleExtend = async () => {
    try {
      setIsExtending(true);
      await onExtend();
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      aria-describedby="session-warning-desc"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-all"
    >
      <div className="w-full max-w-md bg-[#0F0F0F] border border-white/15 text-white rounded-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <h3 id="session-warning-title" className="text-base font-semibold tracking-wide text-white">
              Session Expiring Soon
            </h3>
            <p className="text-xs text-neutral-400">Security Inactivity Notice</p>
          </div>
        </div>

        <p id="session-warning-desc" className="text-sm text-neutral-300 leading-relaxed mb-4">
          Your session will automatically expire due to inactivity in{" "}
          <span className="font-mono font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
            {formattedTime}
          </span>
          . Please choose whether to continue working or sign out now.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={handleExtend}
            disabled={isExtending}
            className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {isExtending ? (
              <span>Extending...</span>
            ) : (
              <>
                <CheckCircle2 size={14} className="text-green-600" />
                <span>Continue Session</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionExpirationWarning;
