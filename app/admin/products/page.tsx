"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminProducts, toggleAdminProductActive, toggleAdminProductFeatured } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthContext";
import { Package, Plus, Search, Star, Edit, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminProductsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getAdminProducts(page, 20, search);
      setProducts(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === "ADMIN") {
      fetchProducts();
    }
  }, [page, search, user, authLoading]);

  const handleToggleActive = async (id: number) => {
    try {
      await toggleAdminProductActive(id);
      fetchProducts();
    } catch (err) {
      alert("Failed to toggle product status");
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await toggleAdminProductFeatured(id);
      fetchProducts();
    } catch (err) {
      alert("Failed to toggle featured status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live storefront products, pricing, active status, and variant matrices
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

      {/* Search Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name, slug, or SKU..."
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
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Products High-Density Table */}
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
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Variants</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Featured</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{product.slug}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {product.categoryName || "Uncategorized"}
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-900">
                      ₹{product.price}
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-700">
                      {product.variants?.length || 0}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(product.id)}
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-full border transition ${
                          product.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {product.active ? "Active" : "Archived"}
                      </button>
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
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px] transition"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
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
              Page <span className="font-semibold text-slate-900">{page + 1}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
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
