"use client";

import React, { useState } from "react";
import { Address, CreateAddressData, UpdateAddressData } from "@/lib/api/addresses";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelectAddress: (addressId: number) => void;
  onAddNewAddress: (data: CreateAddressData) => Promise<Address>;
  onUpdateAddress?: (id: number, data: UpdateAddressData) => Promise<Address>;
  onDeleteAddress?: (id: number) => Promise<void>;
  onSetDefaultAddress?: (id: number) => Promise<Address>;
}

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefaultAddress,
}: AddressSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Address Form State
  const [formData, setFormData] = useState<CreateAddressData>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    isDefault: false,
  });

  // Edit Address Form State
  const [editFormData, setEditFormData] = useState<UpdateAddressData>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    isEdit = false
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    const val = type === "checkbox" ? checked : value;

    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, [name]: val }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.addressLine1 ||
      !formData.city ||
      !formData.state ||
      !formData.postalCode
    ) {
      setError("Please fill in all required fields marked with *");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newAddress = await onAddNewAddress(formData);
      onSelectAddress(newAddress.id);
      setShowAddForm(false);
      setFormData({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        isDefault: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save shipping address";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (addr: Address) => {
    setEditingAddressId(addr.id);
    setEditFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowAddForm(false);
    setError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!onUpdateAddress) return;

    try {
      setLoading(true);
      setError(null);
      await onUpdateAddress(id, editFormData);
      setEditingAddressId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update address";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!onSetDefaultAddress) return;

    try {
      setLoading(true);
      setError(null);
      await onSetDefaultAddress(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update default address";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!onDeleteAddress) return;

    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onDeleteAddress(id);
      setDeletingId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete address";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-sm p-6 text-neutral-100 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-800">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-amber-400 font-mono uppercase">
            Step 1 of 2
          </span>
          <h2 className="type-h3 text-white mt-1">Shipping Address</h2>
        </div>

        {addresses.length > 0 && !showAddForm && editingAddressId === null && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setError(null);
            }}
            className="text-xs uppercase tracking-widest text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 py-1 px-3 border border-amber-400/30 rounded-sm hover:border-amber-400/60"
          >
            <span>+</span> Add Address
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-950/80 border border-red-800 text-red-200 text-xs p-3.5 rounded-sm mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-neutral-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Address List View */}
      {!showAddForm && editingAddressId === null && addresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            const isConfirmingDelete = deletingId === addr.id;

            return (
              <div
                key={addr.id}
                onClick={() => onSelectAddress(addr.id)}
                className={`relative cursor-pointer p-5 rounded-sm border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "border-amber-400 bg-neutral-900 ring-1 ring-amber-400/40"
                    : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900/90"
                }`}
              >
                <div>
                  {/* Top Bar: Radio + Default Tag */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-amber-400 bg-amber-400"
                            : "border-neutral-600 bg-transparent"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />}
                      </div>
                      <span className="font-semibold text-sm text-white tracking-wide">
                        {addr.fullName}
                      </span>
                    </div>

                    {addr.isDefault && (
                      <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-xs">
                        Default
                      </span>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="text-xs text-neutral-300 space-y-1 pl-7 mb-4">
                    <p className="text-neutral-400 font-mono">{addr.phone}</p>
                    <p className="leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                    </p>
                    <p className="text-neutral-300 font-mono">
                      {addr.city}, {addr.state} — {addr.postalCode}
                    </p>
                    <p className="text-neutral-400 uppercase text-[10px] tracking-wider font-mono">
                      {addr.country}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div
                  className="pt-3 border-t border-neutral-800/80 flex items-center justify-between pl-7 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(addr)}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    {onDeleteAddress && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, addr.id)}
                        className={`transition-colors ${
                          isConfirmingDelete
                            ? "text-red-400 font-bold animate-pulse"
                            : "text-neutral-400 hover:text-red-400"
                        }`}
                      >
                        {isConfirmingDelete ? "Confirm Delete?" : "Delete"}
                      </button>
                    )}
                  </div>

                  {!addr.isDefault && onSetDefaultAddress && (
                    <button
                      type="button"
                      onClick={(e) => handleSetDefault(e, addr.id)}
                      className="text-amber-400/80 hover:text-amber-400 text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Make Default
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Address Form */}
      {editingAddressId !== null && (
        <form
          onSubmit={(e) => handleEditSubmit(e, editingAddressId)}
          className="space-y-4 bg-neutral-900/90 p-5 rounded-sm border border-neutral-800"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm uppercase tracking-widest font-heading text-amber-400">
              Edit Shipping Address
            </h4>
            <button
              type="button"
              onClick={() => setEditingAddressId(null)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={editFormData.fullName || ""}
                onChange={(e) => handleInputChange(e, true)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                value={editFormData.phone || ""}
                onChange={(e) => handleInputChange(e, true)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              name="addressLine1"
              value={editFormData.addressLine1 || ""}
              onChange={(e) => handleInputChange(e, true)}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              name="addressLine2"
              value={editFormData.addressLine2 || ""}
              onChange={(e) => handleInputChange(e, true)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={editFormData.city || ""}
                onChange={(e) => handleInputChange(e, true)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={editFormData.state || ""}
                onChange={(e) => handleInputChange(e, true)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                PIN / Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={editFormData.postalCode || ""}
                onChange={(e) => handleInputChange(e, true)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editIsDefault"
              name="isDefault"
              checked={editFormData.isDefault || false}
              onChange={(e) => handleInputChange(e, true)}
              className="rounded-xs bg-neutral-950 border-neutral-800 text-amber-400 focus:ring-amber-400"
            />
            <label htmlFor="editIsDefault" className="text-xs text-neutral-300">
              Set as default shipping address
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold px-5 py-2.5 rounded-xs text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditingAddressId(null)}
              className="text-neutral-400 hover:text-white text-xs px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add New Address Form */}
      {showAddForm && editingAddressId === null && (
        <form onSubmit={handleCreateSubmit} className="space-y-4 bg-neutral-900/90 p-5 rounded-sm border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm uppercase tracking-widest font-heading text-amber-400">
              Add New Shipping Address
            </h4>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. Aarav Sharma"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                placeholder="e.g. +91 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Address Line 1 *
            </label>
            <input
              type="text"
              name="addressLine1"
              placeholder="Flat / House No. / Building / Street"
              value={formData.addressLine1}
              onChange={handleInputChange}
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              name="addressLine2"
              placeholder="Locality / Landmark"
              value={formData.addressLine2 || ""}
              onChange={handleInputChange}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                City *
              </label>
              <input
                type="text"
                name="city"
                placeholder="Mumbai"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                State *
              </label>
              <input
                type="text"
                name="state"
                placeholder="Maharashtra"
                value={formData.state}
                onChange={handleInputChange}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                PIN / Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                placeholder="400001"
                value={formData.postalCode}
                onChange={handleInputChange}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xs px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono placeholder:text-neutral-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={formData.isDefault || false}
              onChange={handleInputChange}
              className="rounded-xs bg-neutral-950 border-neutral-800 text-amber-400 focus:ring-amber-400"
            />
            <label htmlFor="isDefault" className="text-xs text-neutral-300">
              Set as default shipping address
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold px-5 py-2.5 rounded-xs text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Address"}
            </button>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-neutral-400 hover:text-white text-xs px-4 py-2.5"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
