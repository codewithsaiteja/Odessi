"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminCollections,
  createAdminCollection,
  updateAdminCollection,
  toggleAdminCollectionActive,
} from "@/lib/api/admin";
import { Bookmark, Plus, Edit } from "lucide-react";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    heroImage: "",
    active: true,
    featured: false,
  });

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await getAdminCollections();
      setCollections(data);
    } catch (err) {
      console.error("Failed to load collections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await updateAdminCollection(editingCollection.id, form);
      } else {
        await createAdminCollection(form);
      }
      setModalOpen(false);
      fetchCollections();
    } catch (err: any) {
      alert(err?.message || "Failed to save collection");
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminCollectionActive(id);
      fetchCollections();
    } catch (err) {
      alert("Failed to toggle collection status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Collections Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage editorial fashion drops, hero releases, and featured storefront lines
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCollection(null);
            setForm({ name: "", slug: "", description: "", heroImage: "", active: true, featured: false });
            setModalOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collections Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading Collections Taxonomy...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Featured Status</th>
                  <th className="p-3.5">Active Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {collections.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-semibold text-slate-900">{col.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{col.slug}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full ${
                        col.featured ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {col.featured ? "FEATURED" : "STANDARD"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">
                      <button
                        onClick={() => handleToggleActive(col.id)}
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border transition ${
                          col.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {col.active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setEditingCollection(col);
                          setForm({
                            name: col.name,
                            slug: col.slug,
                            description: col.description || "",
                            heroImage: col.heroImage || "",
                            active: col.active,
                            featured: col.featured,
                          });
                          setModalOpen(true);
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collection Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {editingCollection ? "Edit Collection Specification" : "New Collection"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Slug (URL Path)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="col-featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="col-featured" className="text-xs font-semibold text-slate-800">Featured Collection</label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs tracking-wider uppercase hover:bg-slate-800 transition"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
