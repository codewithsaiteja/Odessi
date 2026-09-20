"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { changeUserPassword } from "@/lib/api/user";
import { useRouter } from "next/navigation";
import { Shield, Lock, CheckCircle2, AlertCircle, LogOut, Key } from "lucide-react";

export default function AccountSecurity() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!currentPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeUserPassword({
        currentPassword,
        newPassword,
      });

      setSuccessMsg("Password changed successfully. All other active sessions have been invalidated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change password. Please verify your current password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h2 className="text-2xl font-serif text-stone-900 tracking-tight">Security & Passwords</h2>
        <p className="text-sm text-stone-500 mt-1">
          Manage your account password, active authentication sessions, and security options.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-stone-200 rounded-sm p-6 space-y-5 bg-white shadow-xs">
          <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
            <Key className="w-4 h-4 text-stone-500" />
            Change Password
          </h3>

          <div>
            <label htmlFor="currentPassword" className="block text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">
              Current Password *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-stone-900 rounded-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">
                New Password *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-stone-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-stone-900 rounded-sm"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-stone-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-stone-900 rounded-sm"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-sm border border-stone-200 text-xs text-stone-500 space-y-1">
            <p className="font-medium text-stone-700">Security Requirement:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Must be at least 8 characters long</li>
              <li>Changing your password revokes all existing refresh tokens for safety</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 rounded-sm shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Account Session Actions */}
      <div className="border border-stone-200 rounded-sm p-6 space-y-4 bg-white shadow-xs">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
          <Shield className="w-4 h-4 text-stone-500" />
          Active Session & Authentication
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium text-stone-900">Current Login Session</p>
            <p className="text-xs text-stone-500 mt-0.5">
              Logged in as <span className="font-semibold text-stone-700">{user.email}</span>. Secure HttpOnly cookies are active.
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-stone-300 text-stone-800 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 text-xs uppercase tracking-wider font-semibold transition-colors rounded-sm shrink-0"
          >
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Log Out Account
          </button>
        </div>
      </div>
    </div>
  );
}
