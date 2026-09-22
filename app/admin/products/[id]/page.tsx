"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminProductById,
  updateAdminProduct,
  addAdminVariant,
  updateAdminVariant,
  deleteAdminVariant,
  getAdminCategories,
  getAdminCollections,
  uploadAdminProductImage,
  deleteAdminProductImage,
  setAdminPrimaryProductImage,
  reorderAdminProductImages,
  duplicateAdminProduct,
  deleteAdminProduct,
  getAdminProductActivity,
} from "@/lib/api/admin";
import ProductMediaManager, { StagedImage } from "@/components/admin/ProductMediaManager";
import { getMediaUrl } from "@/lib/product-utils";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  Save,
  Plus,
  AlertCircle,
  CheckCircle2,
  Eye,
  Copy,
  Trash2,
  Clock,
  Layers,
  Image as ImageIcon,
  Sliders,
  DollarSign,
  Tag,
  Activity,
  X,
  ExternalLink,
} from "lucide-react";

export default function AdminProductControlCenterPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const toast = useToast();

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "media" | "variants" | "pricing" | "storefront" | "activity">("overview");

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

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
        status: data.status || (data.active ? "PUBLISHED" : "DRAFT"),
      });
      setHasUnsavedChanges(false);

      // Fetch activity logs silently
      getAdminProductActivity(id).then(setActivities).catch(console.error);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load product details");
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

  const handleStatusChange = async (newStatus: string) => {
    if (!product) return;
    try {
      const updatedActive = newStatus === "PUBLISHED";
      setProduct({ ...product, status: newStatus, active: updatedActive });
      await updateAdminProduct(id, {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription || "",
        price: parseFloat(product.price),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
        currency: product.currency || "INR",
        categoryId: product.categoryId ? parseInt(String(product.categoryId)) : null,
        collectionId: product.collectionId ? parseInt(String(product.collectionId)) : null,
        material: product.material || "",
        fit: product.fit || "",
        careInstructions: product.careInstructions || "",
        featured: Boolean(product.featured),
        bestseller: Boolean(product.bestseller),
        newArrival: Boolean(product.newArrival),
        active: updatedActive,
        status: newStatus,
      });
      toast.success(`Product status set to ${newStatus}`);
      fetchProduct();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update product status");
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const priceVal = parseFloat(product.price);
      const compareAtVal = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;

      if (compareAtVal !== null && compareAtVal < priceVal) {
        toast.error("Compare At Price must be greater than or equal to Price.");
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
        active: product.status === "PUBLISHED" || Boolean(product.active),
        status: product.status || "DRAFT",
      });

      toast.success("Product specification updated successfully!");
      setHasUnsavedChanges(false);
      fetchProduct();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setDuplicating(true);
      const newProd = await duplicateAdminProduct(id);
      toast.success(`Product duplicated as "${newProd.name}"`);
      router.push(`/admin/products/${newProd.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to duplicate product");
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await deleteAdminProduct(id);
      if (res?.archived) {
        toast.info("Product archived safely (referenced in historical orders)");
      } else {
        toast.success("Product deleted successfully");
      }
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleVariantSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
        toast.success("Variant updated");
      } else {
        await addAdminVariant(id, payload);
        toast.success("Variant added");
      }

      setVariantModalOpen(false);
      fetchProduct();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save variant");
    }
  };

  if (loading && !product) {
    return (
      <div className="p-12 text-center text-xs font-mono text-slate-500">
        Loading Product Control Center...
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

  const primaryImageSrc = stagedImages.find(img => img.isPrimary)?.previewUrl || stagedImages[0]?.previewUrl || "/placeholder-product.svg";

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "PUBLISHED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "DRAFT":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "HIDDEN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ARCHIVED":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation Bar & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/products"
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">{product.name}</h1>
              <select
                value={product.status || "DRAFT"}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full border cursor-pointer ${getStatusBadge(product.status || "DRAFT")}`}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="HIDDEN">HIDDEN</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID #{product.id} • /{product.slug} • Updated {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Card Preview</span>
          </button>

          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Storefront</span>
          </Link>

          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>{duplicating ? "Duplicating..." : "Duplicate"}</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 bg-white rounded-xl p-1 border shadow-2xs">
        <nav className="flex space-x-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === "media"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media Gallery ({stagedImages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("variants")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === "variants"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Variants & Stock ({product.variants?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === "pricing"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pricing & Taxonomy</span>
          </button>

          <button
            onClick={() => setActiveTab("storefront")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === "storefront"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Storefront & Specs</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === "activity"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit Activity</span>
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleProductSubmit} className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-2xs">
            <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              General Specification & Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={product.name || ""}
                  onChange={(e) => {
                    setProduct({ ...product, name: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={product.slug || ""}
                  onChange={(e) => {
                    setProduct({ ...product, slug: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Summary (Card Tagline)
              </label>
              <input
                type="text"
                value={product.shortDescription || ""}
                onChange={(e) => {
                  setProduct({ ...product, shortDescription: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                placeholder="Brief summary for storefront grids"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Description *
              </label>
              <textarea
                rows={5}
                required
                value={product.description || ""}
                onChange={(e) => {
                  setProduct({ ...product, description: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === "media" && (
          <ProductMediaManager
            productId={id}
            stagedImages={stagedImages}
            onStagedImagesChange={() => {}}
            onUploadSingleImage={async (file, altText, isPrimary) => {
              await uploadAdminProductImage(id, file, altText, isPrimary);
              toast.success("Image uploaded");
              await fetchProduct();
            }}
            onDeleteSingleImage={async (imageId) => {
              await deleteAdminProductImage(id, imageId);
              toast.success("Image deleted");
              await fetchProduct();
            }}
            onSetPrimaryImage={async (imageId) => {
              await setAdminPrimaryProductImage(id, imageId);
              toast.success("Primary image set");
              await fetchProduct();
            }}
            onReorderImages={async (imageIds) => {
              await reorderAdminProductImages(id, imageIds);
              toast.success("Media gallery reordered");
              await fetchProduct();
            }}
          />
        )}

        {/* VARIANTS TAB */}
        {activeTab === "variants" && (
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
                type="button"
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
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {product.variants && product.variants.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Color Swatch &amp; Name</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock Quantity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {product.variants.map((variant: any) => (
                      <tr key={variant.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-semibold text-slate-900">{variant.sku}</td>
                        <td className="p-3">
                          <button
                            type="button"
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
                            title="Click to edit color or variant details"
                            className="inline-flex items-center space-x-2 px-2.5 py-1 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 rounded-md transition cursor-pointer text-left"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-sm border border-slate-400/50 shadow-2xs shrink-0"
                              style={{ backgroundColor: variant.colorHex || "#000000" }}
                            />
                            <span className="font-medium text-slate-800">{variant.color}</span>
                            {variant.colorHex && (
                              <span className="text-[10px] font-mono text-slate-400">({variant.colorHex})</span>
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-mono font-semibold">{variant.size}</td>
                        <td className="p-3 font-mono font-semibold text-slate-900">₹{variant.price}</td>
                        <td className="p-3 font-mono font-bold">
                          <span className={variant.stockQuantity <= 5 ? "text-red-600" : "text-emerald-600"}>
                            {variant.stockQuantity}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateAdminVariant(id, variant.id, {
                                  sku: variant.sku,
                                  size: variant.size,
                                  color: variant.color,
                                  colorHex: variant.colorHex,
                                  price: variant.price,
                                  stockQuantity: variant.stockQuantity,
                                  active: !variant.active,
                                });
                                toast.success(`Variant ${variant.sku} ${!variant.active ? "activated" : "deactivated"}`);
                                fetchProduct();
                              } catch (err: any) {
                                toast.error(err?.message || "Failed to update variant status");
                              }
                            }}
                            title="Click to toggle Active / Inactive status"
                            className={`px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border transition cursor-pointer ${
                              variant.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {variant.active ? "ACTIVE" : "INACTIVE"}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
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
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete variant "${variant.sku}" (${variant.size} / ${variant.color})?`)) {
                                  try {
                                    await deleteAdminVariant(id, variant.id);
                                    toast.success("Variant deleted successfully");
                                    fetchProduct();
                                  } catch (err: any) {
                                    toast.error(err?.message || "Failed to delete variant");
                                  }
                                }
                              }}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition"
                              title="Delete Variant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  No product variants configured yet. Click <span className="font-semibold text-slate-700">"Add Variant"</span> to add size/color SKUs.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRICING & TAXONOMY TAB */}
        {activeTab === "pricing" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
            <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              Pricing & Classification
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
                  onChange={(e) => {
                    setProduct({ ...product, price: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
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
                  onChange={(e) => {
                    setProduct({ ...product, compareAtPrice: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white font-mono"
                  placeholder="Strike-through original price"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={product.categoryId || ""}
                  onChange={(e) => {
                    setProduct({ ...product, categoryId: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
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
                  onChange={(e) => {
                    setProduct({ ...product, collectionId: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
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
        )}

        {/* STOREFRONT & SPECS TAB */}
        {activeTab === "storefront" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
              <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Specifications & Fabric Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Material Composition
                  </label>
                  <input
                    type="text"
                    value={product.material || ""}
                    onChange={(e) => {
                      setProduct({ ...product, material: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    placeholder="e.g. 100% Heavyweight Cotton (300 GSM)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fit Specification
                  </label>
                  <input
                    type="text"
                    value={product.fit || ""}
                    onChange={(e) => {
                      setProduct({ ...product, fit: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
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
                    onChange={(e) => {
                      setProduct({ ...product, careInstructions: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    placeholder="e.g. Machine wash cold, dry flat"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
              <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                Merchandising & Feature Badges
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={Boolean(product.featured)}
                    onChange={(e) => {
                      setProduct({ ...product, featured: e.target.checked });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Featured</span>
                    <span className="block text-[10px] text-slate-500">Homepage Showcase</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={Boolean(product.bestseller)}
                    onChange={(e) => {
                      setProduct({ ...product, bestseller: e.target.checked });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Bestseller</span>
                    <span className="block text-[10px] text-slate-500">Bestseller Tag</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={Boolean(product.newArrival)}
                    onChange={(e) => {
                      setProduct({ ...product, newArrival: e.target.checked });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">New Arrival</span>
                    <span className="block text-[10px] text-slate-500">New Drop Tag</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY LOG TAB */}
        {activeTab === "activity" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
            <h2 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              Product Change Audit Trail
            </h2>

            {activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <Clock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{act.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          by {act.adminEmail || "Admin"} • {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{act.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No recent activity recorded for this product yet.
              </div>
            )}
          </div>
        )}

        {/* Save Button Bar */}
        {activeTab !== "media" && activeTab !== "activity" && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-slate-800 transition shadow-2xs disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{saving ? "Saving Product..." : "Save All Product Changes"}</span>
            </button>
          </div>
        )}
      </form>

      {/* Product Card Storefront Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                Storefront Live Card Preview
              </span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-md transition">
              <div className="relative aspect-3/4 bg-slate-200 overflow-hidden">
                <img
                  src={primaryImageSrc}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.bestseller && (
                    <span className="bg-amber-400 text-black font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Bestseller
                    </span>
                  )}
                  {product.newArrival && (
                    <span className="bg-black text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                      New Drop
                    </span>
                  )}
                </div>

                <span className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full border ${getStatusBadge(product.status || "DRAFT")}`}>
                  {product.status || "DRAFT"}
                </span>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  {categories.find(c => String(c.id) === String(product.categoryId))?.name || "Apparel"}
                </span>
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{product.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{product.shortDescription || "Unisex Oversized Drop"}</p>
                <div className="flex items-center space-x-2 pt-1 font-mono">
                  <span className="font-bold text-slate-900 text-sm">₹{product.price}</span>
                  {product.compareAtPrice && (
                    <span className="text-xs text-slate-400 line-through">₹{product.compareAtPrice}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-slate-500">
              This is how customer storefront grid cards render this product.
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Confirm Product Deletion</span>
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{product.name}"</span>?
              If this product is associated with existing customer order histories, it will be automatically converted to <span className="font-semibold text-purple-700">ARCHIVED</span> status to preserve financial audit trails.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg text-xs tracking-wider uppercase hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Processing..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color *</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={variantForm.colorHex || "#000000"}
                      onChange={(e) => setVariantForm({ ...variantForm, colorHex: e.target.value })}
                      title="Pick hex color"
                      className="w-9 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Off-White / Ivory"
                      value={variantForm.color}
                      onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity *</label>
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
