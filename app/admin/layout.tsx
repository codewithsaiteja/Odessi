"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import AdminShell from "@/components/admin/AdminShell";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "ADMIN")) {
      router.replace("/login?redirect=/admin");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 p-8 rounded-xl shadow-lg">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-600 mb-6">
            You must be signed in as an administrator to access the Odessi Control Center.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?redirect=/admin"
              className="w-full py-2.5 bg-slate-900 text-white font-medium text-xs tracking-wider uppercase rounded-lg hover:bg-slate-800 transition"
            >
              Sign In as Admin
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center space-x-2 text-xs text-slate-500 hover:text-slate-900 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
