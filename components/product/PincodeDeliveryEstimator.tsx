"use client";

import { useState, useEffect } from "react";
import { Truck, Check, AlertCircle, ArrowRight } from "lucide-react";

interface PincodeDeliveryEstimatorProps {
  className?: string;
}

export function PincodeDeliveryEstimator({ className = "" }: PincodeDeliveryEstimatorProps) {
  const [pincode, setPincode] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkedPincode, setCheckedPincode] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDelivery = (pin: string) => {
    const isMetro = /^(11|40|50|56|60|70)/.test(pin);
    const daysToAdd = isMetro ? 3 : 5;
    
    const delivery = new Date();
    let added = 0;
    while (added < daysToAdd) {
      delivery.setDate(delivery.getDate() + 1);
      // Skip Sundays
      if (delivery.getDay() !== 0) {
        added++;
      }
    }

    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    const formatted = delivery.toLocaleDateString("en-IN", options);
    
    setCheckedPincode(pin);
    setDeliveryDate(formatted);
    setError(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("odessi_saved_pincode");
      if (saved && /^\d{6}$/.test(saved)) {
        setPincode(saved);
        calculateDelivery(saved);
      }
    }
  }, []);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    setChecking(true);
    setTimeout(() => {
      calculateDelivery(clean);
      if (typeof window !== "undefined") {
        localStorage.setItem("odessi_saved_pincode", clean);
      }
      setChecking(false);
    }, 250);
  };

  return (
    <div className={`p-4 bg-[var(--color-odessi-warmwhite)] border border-[var(--color-odessi-smoke)] rounded-sm ${className}`}>
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-wider uppercase text-[var(--color-odessi-black)]">
        <Truck size={14} className="text-[#D4AF37]" />
        <span>Delivery & Service Options</span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2 mb-3">
        <input
          type="text"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setPincode(val);
            if (error) setError(null);
          }}
          placeholder="Enter 6-digit PIN code"
          className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[var(--color-odessi-smoke)] rounded-sm focus:outline-none focus:border-[var(--color-odessi-black)] transition-colors placeholder:font-sans placeholder:text-neutral-400"
          aria-label="Enter pincode for delivery estimation"
        />
        <button
          type="submit"
          disabled={checking || pincode.length !== 6}
          className="px-4 py-2 bg-[var(--color-odessi-black)] hover:bg-[var(--color-odessi-stone)] disabled:opacity-40 text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5"
        >
          {checking ? "Checking..." : "Check"}
          {!checking && <ArrowRight size={12} />}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mb-2">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {checkedPincode && deliveryDate && (
        <div className="space-y-1.5 text-xs text-[var(--color-odessi-stone)] border-t border-[var(--color-odessi-smoke)] pt-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-[var(--color-odessi-black)] font-medium">
            <Check size={14} className="text-[#D4AF37] shrink-0" />
            <span>
              Estimated delivery by <strong className="text-[var(--color-odessi-black)]">{deliveryDate}</strong> to PIN <span className="font-mono">{checkedPincode}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600 pl-5">
            <span>• Cash on Delivery (COD) available</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600 pl-5">
            <span>• Standard dispatch within 24 hours</span>
          </div>
        </div>
      )}
    </div>
  );
}
