"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategoryActive,
} from "@/lib/api/admin";
import { FolderTree, Plus, Edit, RefreshCw } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    active: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAdminCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, form);
      } else {
        await createAdminCategory(form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert(err?.message || "Failed to save category");
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminCategoryActive(id);
      fetchCategories();
    } catch (err) {
      alert("Failed to toggle category active status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Category Taxonomy</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize product catalog categories and active status
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setForm({ name: "", slug: "", description: "", image: "", active: true });
            setModalOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading Categories Taxonomy...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-semibold text-slate-900">{cat.name}</td>
                    <td className="p-3.5 font-mono text-slate-500">{cat.slug}</td>
                    <td className="p-3.5 text-slate-600 truncate max-w-xs">{cat.description}</td>
                    <td className="p-3.5 font-mono">
                      <button
                        onClick={() => handleToggleActive(cat.id)}
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border transition ${
                          cat.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {cat.active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setForm({
                            name: cat.name,
                            slug: cat.slug,
                            description: cat.description || "",
                            image: cat.image || "",
                            active: cat.active,
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

      {/* Category Edit Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {editingCategory ? "Edit Category Specification" : "New Category"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
