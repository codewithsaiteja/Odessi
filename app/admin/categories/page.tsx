"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategoryActive,
  uploadAdminCategoryImage,
  deleteAdminCategoryImage,
} from "@/lib/api/admin";
import { useToast } from "@/components/ui/Toast";
import { Image as ImageIcon, Plus, Upload, X, Trash2 } from "lucide-react";
import { getMediaUrl } from "@/lib/product-utils";

/** Resolve a public media URL using the project's canonical getMediaUrl helper. */
function resolveCategoryThumbnail(path: string | null | undefined): string | null {
  if (!path) return null;
  const url = getMediaUrl(path);
  return url === "/placeholder-product.svg" ? null : url;
}

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function AdminCategoriesPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    active: true,
  });

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageAction, setImageAction] = useState<"none" | "replace" | "remove">("none");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAdminCategories();
      setCategories(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      active: cat.active,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageAction("none");
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", image: "", active: true });
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageAction("none");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setImageAction("none");
    setModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please select a valid image (JPG, PNG, or WEBP).");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image size exceeds the allowed limit (${MAX_SIZE_MB} MB).`);
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageAction("replace");
  };

  const handleCancelImageChange = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageAction("none");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMarkRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageAction("remove");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let savedCategory: any;

      if (editingCategory) {
        // Update the text fields first
        savedCategory = await updateAdminCategory(editingCategory.id, form);
      } else {
        savedCategory = await createAdminCategory(form);
      }

      const categoryId = savedCategory.id ?? editingCategory?.id;

      // Handle image changes
      if (imageAction === "replace" && selectedFile && categoryId) {
        try {
          setUploadingImage(true);
          savedCategory = await uploadAdminCategoryImage(categoryId, selectedFile);
          toast.success(editingCategory ? "Category updated with new image" : "Category created with image");
        } catch (imgErr: any) {
          toast.error(imgErr?.message || "Failed to upload category image.");
          // Category was still saved without the new image — partial success
        } finally {
          setUploadingImage(false);
        }
      } else if (imageAction === "remove" && editingCategory?.image && categoryId) {
        try {
          savedCategory = await deleteAdminCategoryImage(categoryId);
          toast.success("Category image removed");
        } catch (imgErr: any) {
          toast.error(imgErr?.message || "Failed to remove category image.");
        }
      } else {
        toast.success(editingCategory ? "Category updated" : "Category created");
      }

      closeModal();
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save category");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminCategoryActive(id);
      toast.success("Category status updated");
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle category status");
    }
  };

  const currentImageUrl = resolveCategoryThumbnail(form.image);
  const hasCurrentImage = !!currentImageUrl && imageAction !== "remove";
  const showPreview = !!previewUrl && imageAction === "replace";

  return (
    <div className="space-y-6">
      {/* Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Category Taxonomy</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize product catalog categories, active status, and storefront images
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Table */}
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
                  <th className="p-3.5 w-16">Image</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5 hidden sm:table-cell">Slug</th>
                  <th className="p-3.5 hidden md:table-cell">Description</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.map((cat) => {
                  const thumbUrl = resolveCategoryThumbnail(cat.image);
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                      {/* Thumbnail */}
                      <td className="p-3.5">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {thumbUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={thumbUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">{cat.name}</td>
                      <td className="p-3.5 font-mono text-slate-500 hidden sm:table-cell">{cat.slug}</td>
                      <td className="p-3.5 text-slate-600 truncate max-w-xs hidden md:table-cell">{cat.description}</td>
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
                          onClick={() => openEdit(cat)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              {editingCategory ? "Edit Category Specification" : "New Category"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slug (URL Path)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* ── Category Image Section ─────────────────────────────── */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Category Image
                </label>

                {/* Current image or marked-for-removal notice */}
                {imageAction === "remove" && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Image will be removed when you save.</span>
                    <button
                      type="button"
                      onClick={() => setImageAction("none")}
                      className="ml-auto text-red-500 hover:text-red-700 font-semibold"
                    >
                      Undo
                    </button>
                  </div>
                )}

                {/* Show current image if present and not marked for removal */}
                {hasCurrentImage && !showPreview && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Current Image</p>
                    <div className="relative w-full aspect-[4/3] max-h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentImageUrl!}
                        alt="Current category image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg hover:bg-slate-800 transition"
                      >
                        <Upload className="w-3 h-3" />
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkRemoveImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-[11px] font-semibold rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}

                {/* New image preview */}
                {showPreview && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-amber-600 uppercase tracking-wider">New Image Preview</p>
                    <div className="relative w-full aspect-[4/3] max-h-48 bg-slate-100 rounded-lg overflow-hidden border-2 border-amber-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl!}
                        alt="New category image preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 truncate flex-1">{selectedFile?.name}</p>
                      <button
                        type="button"
                        onClick={handleCancelImageChange}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded hover:bg-slate-200 transition"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload button when no current image and no preview */}
                {!hasCurrentImage && !showPreview && imageAction !== "remove" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-slate-900 hover:bg-slate-50 transition group"
                    >
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition" />
                      <span className="text-xs text-slate-500 group-hover:text-slate-700">
                        Click to upload image
                      </span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WEBP • Max {MAX_SIZE_MB} MB</span>
                    </button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {/* ── End Image Section ──────────────────────────────────── */}

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs tracking-wider uppercase hover:bg-slate-800 transition disabled:opacity-50 min-w-[110px] flex items-center justify-center gap-2"
                >
                  {saving || uploadingImage ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      {uploadingImage ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
