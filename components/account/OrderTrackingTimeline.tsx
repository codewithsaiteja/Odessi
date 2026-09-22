"use client";

import { Check, Clock, PackageCheck, Truck, Home, AlertCircle } from "lucide-react";

interface OrderTrackingTimelineProps {
  status: string;
  createdAt: string;
  trackingNumber?: string | null;
  carrierName?: string | null;
  className?: string;
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  {
    id: "PLACED",
    label: "Order Placed",
    description: "Receipt confirmed",
    icon: Clock,
  },
  {
    id: "CONFIRMED",
    label: "Payment Confirmed",
    description: "Order verified",
    icon: Check,
  },
  {
    id: "PROCESSING",
    label: "Atelier Preparation",
    description: "Tailored & packaged",
    icon: PackageCheck,
  },
  {
    id: "SHIPPED",
    label: "Dispatched",
    description: "Handed to courier",
    icon: Truck,
  },
  {
    id: "DELIVERED",
    label: "Delivered",
    description: "Arrived at destination",
    icon: Home,
  },
];

export function OrderTrackingTimeline({
  status,
  createdAt,
  trackingNumber,
  carrierName,
  className = "",
}: OrderTrackingTimelineProps) {
  const isCancelled = status === "CANCELLED" || status === "PAYMENT_FAILED";

  const getActiveStepIndex = (currentStatus: string): number => {
    switch (currentStatus) {
      case "PENDING_PAYMENT":
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PROCESSING":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex(status);

  if (isCancelled) {
    return (
      <div className={`p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-3 ${className}`}>
        <AlertCircle size={20} className="text-red-400 shrink-0" />
        <div>
          <p className="font-semibold text-white">Order Cancelled</p>
          <p className="text-neutral-400 mt-0.5">
            This order has been cancelled. If any payment was captured, the full refund will be credited back to your original payment method within 5-7 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-neutral-950/60 border border-neutral-800 rounded-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-neutral-800">
        <div>
          <h5 className="font-bold text-white text-sm uppercase tracking-wider font-heading">
            Live Shipment Tracker
          </h5>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time status updates from Odessi fulfilment atelier
          </p>
        </div>
        {trackingNumber && (
          <div className="text-xs font-mono bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-amber-400">
            {carrierName || "BlueDart"}: <span className="text-white">{trackingNumber}</span>
          </div>
        )}
      </div>

      {/* Stepper Bar */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-neutral-800 hidden sm:block">
          <div
            className="h-full bg-[#D4AF37] transition-all duration-700 ease-out"
            style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isUpcoming = idx > activeIndex;

            return (
              <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                {/* Icon Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 z-10 ${
                    isCompleted
                      ? "bg-[#D4AF37] border-[#D4AF37] text-neutral-950"
                      : isCurrent
                      ? "bg-neutral-950 border-[#D4AF37] text-[#D4AF37] ring-4 ring-[#D4AF37]/20"
                      : "bg-neutral-900 border-neutral-800 text-neutral-600"
                  }`}
                >
                  <Icon size={16} />
                </div>

                {/* Label & Description */}
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? "text-[#D4AF37]"
                        : isCompleted
                        ? "text-white"
                        : "text-neutral-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
