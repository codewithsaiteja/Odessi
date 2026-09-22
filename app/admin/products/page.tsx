"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminProducts,
  toggleAdminProductActive,
  toggleAdminProductFeatured,
  bulkAdminProductAction,
} from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  Package,
  Plus,
  Search,
  Star,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Archive,
  Trash2,
} from "lucide-react";

export default function AdminProductsCatalogPage() {
  const { user, isLoading: authLoading } = useAuth();
  const toast = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getAdminProducts(page, 20, search, statusFilter);
      setProducts(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
      setSelectedIds([]); // Clear selection on refresh
    } catch (error: any) {
      toast.error(error?.message || "Failed to load products catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === "ADMIN") {
      fetchProducts();
    }
  }, [page, search, statusFilter, user, authLoading]);

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminProductActive(id);
      toast.success("Product status updated");
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle product status");
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await toggleAdminProductFeatured(id);
      toast.success("Featured status updated");
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.message || "Failed to toggle featured status");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      await bulkAdminProductAction(selectedIds, action);
      toast.success(`Bulk ${action.toLowerCase()} applied to ${selectedIds.length} products`);
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.message || `Failed to execute bulk ${action}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getStatusBadge = (statusStr: string, active: boolean) => {
    const s = statusStr || (active ? "PUBLISHED" : "DRAFT");
    switch (s) {
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
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Products Catalog Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product status (DRAFT, PUBLISHED, HIDDEN, ARCHIVED), pricing, variants, and bulk actions
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-xs uppercase tracking-wider hover:bg-slate-800 transition shadow-2xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Product</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-medium overflow-x-auto">
            {["ALL", "PUBLISHED", "DRAFT", "HIDDEN", "ARCHIVED"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-slate-900 text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search name, slug, or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>

            <button
              onClick={fetchProducts}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition flex-shrink-0"
              title="Refresh catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (Visible when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-lg text-xs animate-in fade-in duration-200">
            <span className="font-semibold text-amber-400 font-mono">
              {selectedIds.length} product(s) selected
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction("PUBLISH")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded font-semibold transition flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>

              <button
                onClick={() => handleBulkAction("HIDE")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 rounded font-semibold transition flex items-center space-x-1"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide</span>
              </button>

              <button
                onClick={() => handleBulkAction("ARCHIVE")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded font-semibold transition flex items-center space-x-1"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>

              <button
                onClick={() => handleBulkAction("DELETE")}
                disabled={bulkActionLoading}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-600 rounded font-semibold transition flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading Catalog Products...
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={handleSelectAll}
                      className="rounded text-slate-900 focus:ring-slate-900"
                    />
                  </th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Base Price</th>
                  <th className="p-3.5">Variants</th>
                  <th className="p-3.5">Lifecycle Status</th>
                  <th className="p-3.5">Featured</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const statusStr = product.status || (product.active ? "PUBLISHED" : "DRAFT");
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? "bg-amber-50/40" : ""}`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(product.id)}
                          className="rounded text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">/{product.slug}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {product.categoryName || product.category?.name || "Uncategorized"}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-900">
                        ₹{product.price}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-700">
                        {product.variants?.length || 0}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full border ${getStatusBadge(statusStr, product.active)}`}
                        >
                          {statusStr}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleFeatured(product.id)}
                          className={`p-1.5 rounded transition ${
                            product.featured ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-slate-500"
                          }`}
                          title="Toggle Featured on Storefront"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-900 text-white rounded font-medium text-[11px] hover:bg-slate-800 transition"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" />
                          <span>Control Center</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            No products found matching criteria.
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium">
            <span>
              Showing <span className="font-semibold text-slate-900">{products.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalElements}</span> items (Page{" "}
              <span className="font-semibold text-slate-900">{page + 1}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
