"use client";

import React, { useState } from "react";
import {
  Address,
  CreateAddressData,
  UpdateAddressData,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/lib/api/addresses";
import { MapPin, Plus, Trash2, Edit3, Check, X, AlertCircle } from "lucide-react";

interface AccountAddressesProps {
  addresses: Address[];
  onRefreshAddresses: () => Promise<void>;
}

export default function AccountAddresses({
  addresses,
  onRefreshAddresses,
}: AccountAddressesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");
  const [isDefault, setIsDefault] = useState(false);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setCountry("India");
    setIsDefault(addresses.length === 0);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country || "India");
    setIsDefault(addr.isDefault);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingAddress) {
        const updateData: UpdateAddressData = {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          isDefault,
        };
        await updateAddress(editingAddress.id, updateData);
      } else {
        const createData: CreateAddressData = {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          isDefault,
        };
        await createAddress(createData);
      }

      await onRefreshAddresses();
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save address.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddress(id);
      await onRefreshAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete address.");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      await onRefreshAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update default address.");
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <MapPin size={22} className="text-blue-400" /> Saved Addresses
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            Manage your delivery destinations for fast checkout.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md"
        >
          <Plus size={16} /> Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <MapPin size={48} className="mx-auto text-neutral-700" />
          <p className="text-neutral-400 text-sm">No shipping addresses saved yet.</p>
          <button
            onClick={openAddModal}
            className="bg-neutral-800 hover:bg-neutral-750 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                addr.isDefault
                  ? "bg-neutral-950/80 border-blue-500/50 shadow-lg"
                  : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white text-sm">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check size={10} /> Default
                    </span>
                  )}
                </div>

                <p className="text-neutral-300 text-xs">{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-neutral-400 text-xs">{addr.addressLine2}</p>}
                <p className="text-neutral-400 text-xs">
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p className="text-neutral-500 text-xs font-mono pt-1">Ph: {addr.phone}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-850 text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-neutral-400 hover:text-amber-400 transition-colors font-medium"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-neutral-600 text-[10px] italic">Primary Address</span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="text-neutral-400 hover:text-white p-1 transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-neutral-400 hover:text-red-400 p-1 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Street Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  placeholder="Flat/House No., Street"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-medium">Line 2 (Optional)</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  placeholder="Landmark, Area"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="400001"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded bg-neutral-950 border-neutral-800 text-amber-400 focus:ring-0"
                />
                <label htmlFor="isDefault" className="text-neutral-300 font-medium">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 font-semibold rounded-xl hover:bg-neutral-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-400 text-neutral-950 font-bold rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
