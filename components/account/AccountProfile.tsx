"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { updateUserProfile } from "@/lib/api/user";
import { Mail, Phone, CheckCircle2, AlertCircle, Save } from "lucide-react";

export default function AccountProfile() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("First name and last name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim()
      });
      await refreshUser();
      setSuccessMsg("Profile details updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-serif text-stone-900 tracking-tight">Profile Details</h2>
        <p className="text-sm text-stone-500 mt-1">
          Manage your personal information and contact preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-sm flex items-center gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0 text-lg" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-sm flex items-center gap-3">
          <AlertCircle className="text-rose-600 shrink-0 text-lg" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email & Verification Status (Immutable) */}
        <div className="p-5 bg-stone-50/75 border border-stone-200 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-stone-500 font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-stone-400" />
              Email Address
            </label>
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Email
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Unverified
              </span>
            )}
          </div>
          <div className="text-base text-stone-900 font-mono font-medium">{user.email}</div>
          <p className="text-xs text-stone-500">
            Email address changes are locked for account security. Contact support if you need to transfer ownership.
          </p>
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">
              First Name *
            </label>
            <div className="relative">
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-stone-900 rounded-sm"
                placeholder="John"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">
              Last Name *
            </label>
            <div className="relative">
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-stone-900 rounded-sm"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-xs uppercase tracking-wider text-stone-600 font-semibold mb-2">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-stone-400">
              <Phone className="w-4 h-4" />
            </span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-stone-900 text-sm focus:outline-none focus:border-stone-900 rounded-sm"
              placeholder="+91 98765 43210"
            />
          </div>
          <p className="text-xs text-stone-500 mt-1">Used for delivery updates and order status SMS notifications.</p>
        </div>

        {/* Metadata section */}
        <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-500">
          <div>
            <span className="font-semibold text-stone-700">Account Type:</span> {user.role || "CUSTOMER"}
          </div>
          {formattedDate && (
            <div>
              <span className="font-semibold text-stone-700">Member Since:</span> {formattedDate}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 rounded-sm shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
