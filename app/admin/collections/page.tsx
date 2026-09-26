"use client";

import React, { useEffect, useState } from "react";
import {
  getAdminCollections,
  createAdminCollection,
  updateAdminCollection,
  toggleAdminCollectionActive,
  uploadAdminCollectionImage,
  uploadAdminCollectionImageForId,
  deleteAdminCollectionImage,
} from "@/lib/api/admin";
import { useToast } from "@/components/ui/Toast";
import { Bookmark, Plus, Edit } from "lucide-react";
import { getMediaUrl } from "@/lib/product-utils";
import AdminMediaPicker from "@/components/admin/AdminMediaPicker";

export default function AdminCollectionsPage() {
  const toast = useToast();
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
    } catch (err: any) {
      toast.error(err?.message || "Failed to load collections");
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
        toast.success("Collection updated successfully");
      } else {
        await createAdminCollection(form);
        toast.success("Collection created successfully");
      }
      setModalOpen(false);
      fetchCollections();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save collection");
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminCollectionActive(id);
      toast.success("Collection active status updated");
      fetchCollections();
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle collection status");
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
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs cursor-pointer"
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
                  <th className="p-3.5">Cover</th>
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
                    <td className="p-3.5">
                      <div className="w-10 h-12.5 rounded bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                        {col.heroImage ? (
                          <img
                            src={getMediaUrl(col.heroImage, "/placeholder-collection.svg")}
                            alt={col.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder-collection.svg";
                            }}
                          />
                        ) : (
                          <img
                            src="/placeholder-collection.svg"
                            alt="Placeholder"
                            className="w-full h-full object-cover opacity-60"
                          />
                        )}
                      </div>
                    </td>
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
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition cursor-pointer"
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
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCollection ? "Edit Collection Specification" : "New Collection"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure editorial presentation, cover imagery, and storefront metadata
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="e.g. DARK VERSE"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slug (URL Path)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                    placeholder="e.g. dark-verse"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  placeholder="Cinematic collection description and story..."
                />
              </div>

              {/* Media Picker for Collection Cover Image */}
              <div className="border-t border-slate-100 pt-4">
                <AdminMediaPicker
                  label="Collection Cover Media"
                  value={form.heroImage}
                  onChange={(url) => setForm((prev) => ({ ...prev, heroImage: url }))}
                  onUploadFile={async (file) => {
                    if (editingCollection?.id) {
                      const res = await uploadAdminCollectionImageForId(editingCollection.id, file);
                      return res.heroImage || res;
                    } else {
                      const res = await uploadAdminCollectionImage(file);
                      return res.url;
                    }
                  }}
                  onDeleteImage={
                    editingCollection?.id
                      ? async () => {
                          await deleteAdminCollectionImage(editingCollection.id);
                          setForm((prev) => ({ ...prev, heroImage: "" }));
                        }
                      : undefined
                  }
                  recommendedWidth={1200}
                  recommendedHeight={1500}
                  aspectRatio="4:5"
                  maxSizeMb={10}
                  allowedFormats={["JPG", "PNG", "WEBP"]}
                  helperText="Primary image rendered in 4:5 storefront grid and collection header"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="col-featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="col-featured" className="text-xs font-semibold text-slate-800">
                  Featured Collection (highlighted on homepage and storefront headers)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs tracking-wider uppercase hover:bg-slate-800 transition cursor-pointer"
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
