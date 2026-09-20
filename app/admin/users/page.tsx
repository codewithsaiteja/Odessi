"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminUsers, toggleAdminUserEnabled } from "@/lib/api/admin";
import { Users, Eye, RefreshCw } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers(page, 20);
      setUsers(res.content || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleToggleEnabled = async (id: number) => {
    if (!confirm("Are you sure you want to toggle this customer account status?")) return;
    try {
      await toggleAdminUserEnabled(id);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to update account status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Customer Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered customer accounts, profile details, and account enablement controls
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading Customer Accounts...
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Orders Placed</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-semibold text-slate-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{user.email}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">{user.orderCount || 0}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border ${
                          user.enabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {user.enabled ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect</span>
                        </Link>
                        <button
                          onClick={() => handleToggleEnabled(user.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                            user.enabled
                              ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {user.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No customer accounts found.
          </div>
        )}
      </div>
    </div>
  );
}
