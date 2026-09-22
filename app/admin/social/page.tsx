"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getAdminSocialPosts,
  createSocialPost,
  updateSocialPost,
  deleteSocialPost,
  togglePublishSocialPost,
  uploadSocialImage,
  SocialPost,
} from "@/lib/api/social";
import { getProducts } from "@/lib/api/products";
import { formatPrice, getMediaUrl } from "@/lib/product-utils";
import type { Product } from "@/types";
import {
  Camera,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpRight,
  Sparkles,
  Search,
} from "lucide-react";

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);

  // Form states
  const [mediaUrl, setMediaUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setComment] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [published, setPublished] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [socialRes, prodRes] = await Promise.all([
        getAdminSocialPosts(0, 50),
        getProducts({ pageSize: 100 }),
      ]);
      setPosts(socialRes?.content || []);
      setProducts(prodRes?.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load social posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPost(null);
    setMediaUrl("");
    setInstagramUrl("");
    setTitle("");
    setComment("");
    setSelectedProductId(null);
    setPublished(true);
    setDisplayOrder((posts.length || 0) + 1);
    setProductSearch("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (post: SocialPost) => {
    setEditingPost(post);
    setMediaUrl(post.mediaUrl);
    setInstagramUrl(post.instagramUrl || "");
    setTitle(post.title || "");
    setComment(post.caption || "");
    setSelectedProductId(post.productId || null);
    setPublished(post.published);
    setDisplayOrder(post.displayOrder);
    setProductSearch("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const res = await uploadSocialImage(file);
      setMediaUrl(res.url);
      setSuccess("Image uploaded successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      setError("Please provide an image or upload one.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        mediaUrl: mediaUrl.trim(),
        instagramUrl: instagramUrl.trim() || undefined,
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        productId: selectedProductId,
        published,
        displayOrder,
      };

      if (editingPost) {
        await updateSocialPost(editingPost.id, payload);
        setSuccess("Social post updated successfully.");
      } else {
        await createSocialPost(payload);
        setSuccess("Social post published to storefront.");
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save social post.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this social post?")) {
      return;
    }
    try {
      setError(null);
      await deleteSocialPost(id);
      setSuccess("Social post deleted successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete post.");
    }
  };

  const handleTogglePublish = async (post: SocialPost) => {
    try {
      setError(null);
      await togglePublishSocialPost(post.id, !post.published);
      setSuccess(`Post marked as ${!post.published ? "PUBLISHED" : "DRAFT"}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to toggle status.");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Camera className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Social & Instagram Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Control the editorial Instagram lookbook section on the live homepage. Upload media, link to Instagram posts, and tag Odessi products for direct customer discovery.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition shrink-0"
        >
          <Plus size={16} />
          <span>Add Social Post</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 font-bold">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 font-bold">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <p className="text-xs uppercase tracking-widest font-mono">Loading Social Posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Camera className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-800">No social posts created yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first social lookbook post to feature customer styling and editorial photography on the homepage.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold uppercase tracking-wider"
            >
              Add First Post
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-mono tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Media</th>
                  <th className="py-3.5 px-4 font-semibold">Title & Caption</th>
                  <th className="py-3.5 px-4 font-semibold">Linked Product</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Order</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => {
                  const resolvedImg = getMediaUrl(post.mediaUrl);
                  return (
                    <tr key={post.id} className="hover:bg-slate-50/80 transition">
                      {/* Media Thumbnail */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setPreviewPost(post)}
                          className="relative w-14 h-16 bg-slate-100 rounded border border-slate-200 overflow-hidden cursor-pointer group shrink-0"
                        >
                          <Image
                            src={resolvedImg}
                            alt={post.title || "Post"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye size={12} />
                          </div>
                        </div>
                      </td>

                      {/* Content Details */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">
                          {post.title || "Untitled Post"}
                        </p>
                        {post.caption && (
                          <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                            {post.caption}
                          </p>
                        )}
                        {post.instagramUrl && (
                          <Link
                            href={post.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 mt-1 font-mono"
                          >
                            <span>Instagram link</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </td>

                      {/* Linked Product (Requirement 3) */}
                      <td className="py-3 px-4">
                        {post.productId && post.productName ? (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] font-medium">
                            <Sparkles size={11} className="text-amber-600" />
                            <span className="font-semibold">{post.productName}</span>
                            {post.productPrice && (
                              <span className="text-amber-700 font-mono">
                                ({formatPrice(post.productPrice)})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            No product linked
                          </span>
                        )}
                      </td>

                      {/* Display Order */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        #{post.displayOrder}
                      </td>

                      {/* Publication Status */}
                      <td className="py-3 px-4">
                        {post.published ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                            DRAFT
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleTogglePublish(post)}
                            title={post.published ? "Unpublish to Draft" : "Publish to Storefront"}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>

                          <button
                            onClick={() => setPreviewPost(post)}
                            title="Preview Storefront Card"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                          >
                            <ArrowUpRight size={15} />
                          </button>

                          <button
                            onClick={() => openEditModal(post)}
                            title="Edit Post"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => handleDelete(post.id)}
                            title="Delete Post"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal (Requirement 2 & 14) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm tracking-wide">
                {editingPost ? "Edit Social Post" : "Add New Social Post"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Media Upload & Preview */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  Media Image <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 items-start">
                  <div className="relative w-20 h-24 bg-slate-100 rounded border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                    {mediaUrl ? (
                      <Image
                        src={getMediaUrl(mediaUrl)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Camera size={24} className="text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-800 inline-flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 size={14} className="animate-spin text-amber-500" />
                      ) : (
                        <Upload size={14} />
                      )}
                      <span>Upload Media Image</span>
                    </button>
                    <p className="text-[11px] text-slate-400">
                      JPG, PNG, or WEBP up to 5MB. Handled via existing MediaStorageService.
                    </p>
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="Or enter direct image URL (/uploads/social/...)"
                      className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Instagram URL */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Instagram Post URL</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-hidden focus:border-slate-900"
                />
              </div>

              {/* Title & Caption */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Title / Eyebrow</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Beyond Stardom Hoodie"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Caption / Description</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Editorial caption describing the piece or lookbook shoot..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-hidden focus:border-slate-900 resize-none"
                />
              </div>

              {/* Product Linking (Searchable Selector - Requirement 3) */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-semibold mb-1 text-slate-700">
                  Tag an Odessi Product (Optional)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  When linked, customer hovering the Instagram lookbook image will see product title, price, and a direct &ldquo;DISCOVER&rdquo; link.
                </p>

                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product catalog by name or slug..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 bg-slate-50/50">
                  <div
                    onClick={() => setSelectedProductId(null)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs ${
                      selectedProductId === null ? "bg-amber-50 text-amber-900 font-bold" : "hover:bg-slate-100"
                    }`}
                  >
                    <span>None (Unlinked lookbook image)</span>
                    {selectedProductId === null && <CheckCircle2 size={14} className="text-amber-600" />}
                  </div>

                  {filteredProducts.map((p) => {
                    const isSelected = selectedProductId === Number(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProductId(Number(p.id))}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs ${
                          isSelected ? "bg-amber-50 text-amber-900 font-bold" : "hover:bg-slate-100"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700">{formatPrice(p.price)}</span>
                          {isSelected && <CheckCircle2 size={14} className="text-amber-600" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="published-toggle"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                <label htmlFor="published-toggle" className="font-semibold text-slate-800 cursor-pointer">
                  Publish to storefront homepage immediately
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold inline-flex items-center gap-2 transition disabled:opacity-50"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <span>{saving ? "Saving..." : editingPost ? "Update Post" : "Publish Post"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Storefront Preview Modal (Requirement 14) */}
      {previewPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden text-slate-900 animate-in fade-in duration-200">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider font-mono">
                Live Storefront Card Preview
              </span>
              <button
                onClick={() => setPreviewPost(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 bg-[#F7F5F0]">
              <div className="relative aspect-[4/5] overflow-hidden bg-stone-200 rounded-xs group shadow-lg">
                <Image
                  src={getMediaUrl(previewPost.mediaUrl)}
                  alt="Preview"
                  fill
                  className="object-cover"
                />

                {previewPost.productId && previewPost.productName ? (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white z-10">
                    <div className="bg-black/75 backdrop-blur-md p-3 rounded-xs border border-white/10 space-y-1">
                      <p className="text-xs font-semibold text-stone-100 truncate">
                        {previewPost.productName}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          {previewPost.productPrice ? formatPrice(previewPost.productPrice) : ""}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-widest text-white/90 uppercase">
                          Discover <ArrowUpRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : previewPost.caption ? (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-xs text-white text-xs">
                    {previewPost.caption}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] text-slate-500">
                  Status:{" "}
                  <span
                    className={`font-bold font-mono ${
                      previewPost.published ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {previewPost.published ? "PUBLISHED (Active on Homepage)" : "DRAFT (Hidden)"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
