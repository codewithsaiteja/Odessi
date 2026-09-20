"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminProductById,
  updateAdminProduct,
  addAdminVariant,
  updateAdminVariant,
  getAdminCategories,
  getAdminCollections,
  uploadAdminProductImage,
  deleteAdminProductImage,
  setAdminPrimaryProductImage,
  reorderAdminProductImages,
} from "@/lib/api/admin";
import ProductMediaManager, { StagedImage } from "@/components/admin/ProductMediaManager";
import { getMediaUrl } from "@/lib/product-utils";
import { ArrowLeft, Save, Plus, AlertCircle, CheckCircle2, Star, Eye } from "lucide-react";

export default function AdminProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Variant Modal state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantForm, setVariantForm] = useState({
    id: null as number | null,
    sku: "",
    size: "M",
    color: "Black",
    colorHex: "#000000",
    price: "",
    stockQuantity: "10",
    active: true,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await getAdminProductById(id);
      setProduct({
        ...data,
        categoryId: data.categoryId ?? data.category?.id ?? "",
        collectionId: data.collectionId ?? data.collection?.id ?? "",
        currency: data.currency || "INR",
        compareAtPrice: data.compareAtPrice !== null && data.compareAtPrice !== undefined ? String(data.compareAtPrice) : "",
      });
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      getAdminCategories().then(setCategories).catch(console.error);
      getAdminCollections().then(setCollections).catch(console.error);
    }
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const priceVal = parseFloat(product.price);
      const compareAtVal = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;

      if (compareAtVal !== null && compareAtVal < priceVal) {
        setError("Compare At Price must be greater than or equal to Price.");
        setSaving(false);
        return;
      }

      await updateAdminProduct(id, {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription || "",
        price: priceVal,
        compareAtPrice: compareAtVal,
        currency: product.currency || "INR",
        categoryId: product.categoryId ? parseInt(String(product.categoryId)) : null,
        collectionId: product.collectionId ? parseInt(String(product.collectionId)) : null,
        material: product.material || "",
        fit: product.fit || "",
        careInstructions: product.careInstructions || "",
        featured: Boolean(product.featured),
        bestseller: Boolean(product.bestseller),
        newArrival: Boolean(product.newArrival),
        active: Boolean(product.active),
      });

      setSuccess("Product specification updated successfully!");
      setHasUnsavedChanges(false);
      fetchProduct();
    } catch (err: any) {
      setError(err?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleVariantSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        sku: variantForm.sku,
        size: variantForm.size,
        color: variantForm.color,
        colorHex: variantForm.colorHex,
        price: parseFloat(variantForm.price || product.price),
        stockQuantity: parseInt(variantForm.stockQuantity),
        active: variantForm.active,
      };

      if (variantForm.id) {
        await updateAdminVariant(id, variantForm.id, payload);
      } else {
        await addAdminVariant(id, payload);
      }

      setVariantModalOpen(false);
      fetchProduct();
    } catch (err: any) {
      setError(err?.message || "Failed to save variant");
    }
  };

  if (loading && !product) {
    return (
      <div className="p-12 text-center text-xs font-mono text-slate-500">
        Loading Catalog Product Specification...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-xs text-red-600 font-semibold">
        Product not found or unavailable.
      </div>
    );
  }

  const stagedImages: StagedImage[] = (product.images || []).map((img: any, idx: number) => ({
    id: typeof img === "object" ? img.id : undefined,
    previewUrl: getMediaUrl(img),
    altText: typeof img === "object" ? (img.altText || "") : "",
    isPrimary: typeof img === "object" ? Boolean(img.isPrimary) : idx === 0,
    isUploaded: true,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border ${
                product.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                {product.active ? "ACTIVE" : "ARCHIVED"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID #{product.id} • /{product.slug}</p>
          </div>
        </div>

        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>View Storefront</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Product Form */}
      <form onSubmit={handleProductSubmit} className="space-y-6">
        {/* General Specification */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            General Specification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={product.name || ""}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                required
                value={product.slug || ""}
                onChange={(e) => setProduct({ ...product, slug: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Summary
            </label>
            <input
              type="text"
              value={product.shortDescription || ""}
              onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              placeholder="Brief tagline for product cards"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Description *
            </label>
            <textarea
              rows={4}
              required
              value={product.description || ""}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Pricing & Taxonomy */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            Pricing & Taxonomy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={product.price || ""}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Compare At Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={product.compareAtPrice || ""}
                onChange={(e) => setProduct({ ...product, compareAtPrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
                placeholder="Optional strike-through"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={product.categoryId || ""}
                onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Collection
              </label>
              <select
                value={product.collectionId || ""}
                onChange={(e) => setProduct({ ...product, collectionId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              >
                <option value="">None</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Attributes & Specs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            Specifications & Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Composition
              </label>
              <input
                type="text"
                value={product.material || ""}
                onChange={(e) => setProduct({ ...product, material: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                placeholder="e.g. 100% French Terry Cotton (280 GSM)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fit Specification
              </label>
              <input
                type="text"
                value={product.fit || ""}
                onChange={(e) => setProduct({ ...product, fit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                placeholder="e.g. Boxy Oversized Fit"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Care Instructions
              </label>
              <input
                type="text"
                value={product.careInstructions || ""}
                onChange={(e) => setProduct({ ...product, careInstructions: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                placeholder="e.g. Machine wash cold, tumble dry low"
              />
            </div>
          </div>
        </div>

        {/* Visibility & Merchandising Flags */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
          <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            Merchandising & Status Flags
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={Boolean(product.active)}
                onChange={(e) => setProduct({ ...product, active: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">Active</span>
                <span className="block text-[10px] text-slate-500">Live on Storefront</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={Boolean(product.featured)}
                onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">Featured</span>
                <span className="block text-[10px] text-slate-500">Homepage Carousel</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={Boolean(product.bestseller)}
                onChange={(e) => setProduct({ ...product, bestseller: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">Bestseller</span>
                <span className="block text-[10px] text-slate-500">Bestseller Badge</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={Boolean(product.newArrival)}
                onChange={(e) => setProduct({ ...product, newArrival: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">New Arrival</span>
                <span className="block text-[10px] text-slate-500">New Drop Badge</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-slate-800 transition shadow-2xs disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{saving ? "Saving Specification..." : "Update Product Details"}</span>
          </button>
        </div>
      </form>

      {/* Product Media Manager Section */}
      <ProductMediaManager
        productId={id}
        stagedImages={stagedImages}
        onStagedImagesChange={() => {}}
        onUploadSingleImage={async (file, altText, isPrimary) => {
          await uploadAdminProductImage(id, file, altText, isPrimary);
          await fetchProduct();
        }}
        onDeleteSingleImage={async (imageId) => {
          await deleteAdminProductImage(id, imageId);
          await fetchProduct();
        }}
        onSetPrimaryImage={async (imageId) => {
          await setAdminPrimaryProductImage(id, imageId);
          await fetchProduct();
        }}
        onReorderImages={async (imageIds) => {
          await reorderAdminProductImages(id, imageIds);
          await fetchProduct();
        }}
      />

      {/* Product Variant Matrix Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              Variant Matrix ({product.variants?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              SKUs, size/color options, price overrides, and stock levels
            </p>
          </div>

          <button
            onClick={() => {
              setVariantForm({
                id: null,
                sku: `${(product.slug || "PROD").toUpperCase().replaceAll("-", "_").slice(0, 8)}-${Date.now().toString().slice(-4)}`,
                size: "M",
                color: "Black",
                colorHex: "#000000",
                price: String(product.price),
                stockQuantity: "10",
                active: true,
              });
              setVariantModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Add Variant</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          {product.variants && product.variants.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Available Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {product.variants.map((variant: any) => (
                  <tr key={variant.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-semibold text-slate-900">{variant.sku}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: variant.colorHex || "#000" }}
                        ></span>
                        <span className="font-medium text-slate-800">{variant.color}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-semibold">{variant.size}</td>
                    <td className="p-3 font-mono font-semibold text-slate-900">₹{variant.price}</td>
                    <td className="p-3 font-mono font-bold">
                      <span className={variant.stockQuantity <= 5 ? "text-red-600" : "text-emerald-600"}>
                        {variant.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border ${
                        variant.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                        {variant.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setVariantForm({
                            id: variant.id,
                            sku: variant.sku,
                            size: variant.size,
                            color: variant.color,
                            colorHex: variant.colorHex || "#000000",
                            price: String(variant.price),
                            stockQuantity: String(variant.stockQuantity),
                            active: variant.active,
                          });
                          setVariantModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              No product variants configured yet. Click <span className="font-semibold text-slate-700">"Add Variant"</span> to add SKUs for sizes/colors.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Variant Dialog Modal */}
      {variantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {variantForm.id ? "Edit Product Variant" : "Add New Variant"}
            </h3>

            <form onSubmit={handleVariantSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color Name *</label>
                  <input
                    type="text"
                    required
                    value={variantForm.color}
                    onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size *</label>
                  <input
                    type="text"
                    required
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={variantForm.stockQuantity}
                    onChange={(e) => setVariantForm({ ...variantForm, stockQuantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <input
                  type="checkbox"
                  id="variantActive"
                  checked={variantForm.active}
                  onChange={(e) => setVariantForm({ ...variantForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="variantActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active Variant
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setVariantModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs tracking-wider uppercase hover:bg-slate-800 transition"
                >
                  Save Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
