"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createAdminProduct,
  getAdminCategories,
  getAdminCollections,
  uploadAdminProductImage,
} from "@/lib/api/admin";
import ProductMediaManager, { StagedImage } from "@/components/admin/ProductMediaManager";
import { ArrowLeft, Save } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    currency: "INR",
    categoryId: "",
    collectionId: "",
    material: "",
    fit: "",
    careInstructions: "",
    featured: false,
    bestseller: false,
    newArrival: true,
    active: true,
  });

  useEffect(() => {
    getAdminCategories().then(setCategories).catch(console.error);
    getAdminCollections().then(setCollections).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.description) {
      setError("Please fill out name, price, and description.");
      return;
    }

    const priceVal = parseFloat(form.price);
    const compareAtVal = form.compareAtPrice ? parseFloat(form.compareAtPrice) : null;

    if (compareAtVal !== null && compareAtVal < priceVal) {
      setError("Compare At Price must be greater than or equal to Price.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Create Product
      const slugVal = form.slug.trim() ? form.slug.trim() : undefined;
      const res = await createAdminProduct({
        ...form,
        slug: slugVal,
        price: priceVal,
        compareAtPrice: compareAtVal,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        collectionId: form.collectionId ? parseInt(form.collectionId) : null,
      });

      // 2. Upload staged media if any
      if (stagedImages.length > 0 && res?.id) {
        for (const staged of stagedImages) {
          if (staged.file) {
            try {
              await uploadAdminProductImage(
                res.id,
                staged.file,
                staged.altText,
                staged.isPrimary
              );
            } catch (imgErr) {
              console.error("Failed to upload product media", imgErr);
            }
          }
        }
      }

      router.push(`/admin/products/${res.id}`);
    } catch (err: any) {
      const msg = err?.message || "Failed to create product.";
      if (msg.includes("already exists") || msg.includes("SLUG_ALREADY_EXISTS")) {
        setError(`Product slug already exists. Please choose a unique URL slug or edit the existing product.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/products"
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create New Catalog Product</h1>
          <p className="text-xs text-slate-500">Define product pricing, media, category, and metadata</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Specification */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            General Product Specification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                placeholder="Cinematic Oversized Tee"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slug (URL Path)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
                placeholder="cinematic-oversized-tee (auto-generated if empty)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Description *
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              placeholder="A premium oversized cotton tee inspired by cinematic hero aesthetics..."
            />
          </div>
        </div>

        {/* Pricing & Taxonomy */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            Pricing & Taxonomy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono font-semibold"
                placeholder="1299.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compare At Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
                placeholder="1699.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Media Upload Section */}
        <ProductMediaManager
          stagedImages={stagedImages}
          onStagedImagesChange={setStagedImages}
        />

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-amber-400" />
            )}
            <span>{loading ? "Creating Product..." : "Save Product & Build Variants"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
