"use client";

import { useEffect, useState, useCallback } from "react";
import { growthApi, PartnershipResponse } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Building2, Search, Filter, Save, ShieldAlert } from "lucide-react";

export default function AdminPartnershipsPage() {
  const toast = useToast();
  const [applications, setApplications] = useState<PartnershipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<PartnershipResponse | null>(null);
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await growthApi.getPartnerships({
        status: statusFilter || undefined,
        search: search || undefined,
        page: 0,
        size: 50,
      });
      setApplications(res.content || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load partnership applications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await growthApi.updatePartnershipStatus(id, newStatus);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selectedApp?.id === id) setSelectedApp(updated);
      toast.success(`Partnership status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      const updated = await growthApi.updatePartnershipNotes(selectedApp.id, internalNotes);
      setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? updated : a)));
      setSelectedApp(updated);
      toast.success("Internal notes saved securely.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save internal notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" /> Partnership Applications
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review and manage incoming retail, wholesale, and dealer partnership applications.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search company or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500 w-full sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-800 text-xs"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONVERTED">Converted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading partnership records...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No partnership applications found matching criteria.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">#{app.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{app.companyName}</td>
                    <td className="py-3.5 px-4">
                      <div>{app.contactName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.email} | {app.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">{app.city}</td>
                    <td className="py-3.5 px-4 font-mono uppercase text-[11px]">{app.businessType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        app.status === "NEW" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        app.status === "CONTACTED" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        app.status === "QUALIFIED" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        app.status === "CONVERTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setInternalNotes(app.internalNotes || "");
                        }}
                        className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-medium hover:bg-slate-800 transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Application Drawer/Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xl rounded-2xl p-6 border border-slate-200 shadow-xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedApp.companyName}</h3>
                  <span className="text-xs text-slate-500 font-mono">Application #{selectedApp.id}</span>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-slate-400 hover:text-slate-800 text-sm font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Person</span>
                  <span className="font-medium text-slate-900">{selectedApp.contactName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                  <span className="font-mono text-slate-900">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                  <span className="font-mono text-slate-900">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">City</span>
                  <span className="text-slate-900">{selectedApp.city}</span>
                </div>
              </div>

              {selectedApp.message && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Applicant Message</span>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedApp.message}</p>
                </div>
              )}

              {/* Status Workflow Buttons */}
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-2">Update Application Workflow Status</span>
                <div className="flex flex-wrap gap-2">
                  {(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "REJECTED"] as const).map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus || selectedApp.status === st}
                      onClick={() => handleUpdateStatus(selectedApp.id, st)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                        selectedApp.status === st
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Notes (Admin Confidential) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Internal Admin Notes (Confidential)
                  </label>
                  <span className="text-[10px] text-slate-400">Never exposed to customer</span>
                </div>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Record deal terms, background checks, meeting notes..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingNotes ? "Saving Notes..." : "Save Internal Notes & Audit Log"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
