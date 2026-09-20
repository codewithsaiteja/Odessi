"use client";

import React, { useEffect, useState } from "react";
import { getAdminAuditLogs } from "@/lib/api/admin";
import { ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminAuditLogs(page, 25);
      setLogs(res.content || []);
    } catch (err) {
      console.error("Failed to fetch admin audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only, backend-generated audit log recording administrative operations and entity mutations
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading System Audit Events...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Admin Account</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Target ID</th>
                  <th className="p-3.5">Mutation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-900">{log.adminEmail}</td>
                    <td className="p-3.5 font-mono font-bold text-amber-700">{log.action}</td>
                    <td className="p-3.5 font-mono text-slate-600">{log.entityType}</td>
                    <td className="p-3.5 font-mono font-semibold text-slate-900">#{log.entityId || "N/A"}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No administrative audit events recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
