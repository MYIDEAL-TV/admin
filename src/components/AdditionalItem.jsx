import React, { useState, useEffect } from "react";
import {
  Server,
  Plus,
  Search,
  Settings,
  AlertTriangle,
  MoreVertical,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { secureFetch } from "../utils/api";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdditionalItems = () => {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [packages, setPackages] = useState([]); // <-- ADDED: State for packages
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageSearchQuery, setPackageSearchQuery] = useState(""); // <-- ADDED: Package search state

  // Modals & Slideovers
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [mode, setMode] = useState("create"); // 'create', 'edit', 'view'
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "decoder",
    is_active: true,
    package_ids: [], // <-- ADDED: To track selected packages
    prices: [], // Array of { location_ids: [], upfront_price, monthly_price, currency }
  });

  useEffect(() => {
    fetchItems();
    fetchLocations();
    fetchPackages(); // <-- ADDED: Fetch packages on mount
  }, []);

  useEffect(() => {
    const closeMenu = () => setActiveDropdown(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/additional-items`
      );
      const data = await response.json();
      if (data.success) setItems(data.items);
    } catch (error) {
      toast.error("Failed to load additional items");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/locations`);
      const data = await response.json();
      if (data.success) setLocations(data.locations);
    } catch (error) {
      console.error("Failed to load locations");
    }
  };

  // --- ADDED: Fetch Packages ---
  const fetchPackages = async () => {
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/packages`);
      const data = await response.json();
      if (data.success) setPackages(data.packages);
    } catch (error) {
      console.error("Failed to load packages");
    }
  };

  // --- Handlers ---
  const openCreate = () => {
    setMode("create");
    setPackageSearchQuery(""); // Reset search on open
    setFormData({
      id: "",
      name: "",
      description: "",
      category: "decoder",
      is_active: true,
      package_ids: [], // <-- ADDED
      prices: [
        {
          location_ids: [], // Changed to array for multi-select
          upfront_price: 0,
          monthly_price: 0,
          currency: "EUR",
        },
      ],
    });
    setIsSlideOverOpen(true);
  };

  const openEdit = (item, viewOnly = false) => {
    setMode(viewOnly ? "view" : "edit");
    setPackageSearchQuery(""); // Reset search on open

    // Map existing backend data to support the multi-select array structure.
    // If the backend sends individual rows per location, we wrap them in an array so the UI doesn't break.
    const mappedPrices =
      item.prices.length > 0
        ? item.prices.map((p) => ({
            ...p,
            location_ids: p.location_ids
              ? p.location_ids
              : p.location_id
              ? [p.location_id]
              : [],
          }))
        : [
            {
              location_ids: [],
              upfront_price: 0,
              monthly_price: 0,
              currency: "EUR",
            },
          ];

    setFormData({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category: item.category || "decoder",
      is_active: item.is_active,
      package_ids: item.package_ids || [], // <-- ADDED: Load existing compatible packages
      prices: mappedPrices,
    });
    setIsSlideOverOpen(true);
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/additional-items/${itemToDelete.id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        toast.success("Item deleted successfully");
        fetchItems();
      }
    } catch (error) {
      toast.error("Failed to delete item");
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "view") return;

    // Validate prices: Ensure at least one location is selected per row
    const validPrices = formData.prices.filter(
      (p) => p.location_ids && p.location_ids.length > 0
    );
    if (validPrices.length === 0 && formData.prices.length > 0) {
      return toast.error(
        "Please select at least one location for your pricing rules."
      );
    }

    setIsSubmitting(true);
    try {
      const isEdit = mode === "edit";
      const url = isEdit
        ? `${VITE_API_URL}/api/admin/additional-items/${formData.id}`
        : `${VITE_API_URL}/api/admin/additional-items`;
      const method = isEdit ? "PUT" : "POST";

      const response = await secureFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        // Sending validPrices which now contains location_ids arrays
        body: JSON.stringify({ ...formData, prices: validPrices }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isEdit ? "Item Updated" : "Item Created");
        setIsSlideOverOpen(false);
        fetchItems();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dynamic Pricing Handlers ---
  const addPriceRow = () => {
    setFormData((prev) => ({
      ...prev,
      prices: [
        ...prev.prices,
        {
          location_ids: [],
          upfront_price: 0,
          monthly_price: 0,
          currency: "EUR",
        },
      ],
    }));
  };

  const updatePriceRow = (index, field, value) => {
    const newPrices = [...formData.prices];
    newPrices[index][field] = value;
    setFormData({ ...formData, prices: newPrices });
  };

  const removePriceRow = (index) => {
    const newPrices = formData.prices.filter((_, i) => i !== index);
    setFormData({ ...formData, prices: newPrices });
  };

  // Toggle multiple locations for a single pricing rule row
  const toggleLocation = (priceIndex, locationId) => {
    if (mode === "view") return;
    const newPrices = [...formData.prices];
    const currentLocs = newPrices[priceIndex].location_ids || [];

    if (currentLocs.includes(locationId)) {
      newPrices[priceIndex].location_ids = currentLocs.filter(
        (id) => id !== locationId
      );
    } else {
      newPrices[priceIndex].location_ids = [...currentLocs, locationId];
    }

    setFormData({ ...formData, prices: newPrices });
  };

  // --- ADDED: Toggle Package Handler ---
  const togglePackage = (packageId) => {
    if (mode === "view") return;
    setFormData((prev) => {
      const currentPkgs = prev.package_ids || [];
      if (currentPkgs.includes(packageId)) {
        return {
          ...prev,
          package_ids: currentPkgs.filter((id) => id !== packageId),
        };
      } else {
        return { ...prev, package_ids: [...currentPkgs, packageId] };
      }
    });
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#191121] p-6 rounded-2xl border border-[#7f19e6]/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Server className="text-[#7f19e6]" /> Hardware & Fees
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage decoders, setup fees, and regional pricing rules.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:ring-1 focus:ring-[#7f19e6] outline-none"
            />
          </div>
          <button
            onClick={openCreate}
            className="whitespace-nowrap px-6 py-2.5 bg-[#7f19e6] hover:bg-[#8e29f7] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#7f19e6]/20"
          >
            <Plus size={14} className="inline mr-1" /> Add Item
          </button>
        </div>
      </div>

      {/* DATA GRID */}
      {isLoading ? (
        <div className="text-center py-20 text-[#7f19e6] animate-pulse font-black uppercase tracking-widest">
          Loading Items...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#1f1629] border border-[#7f19e6]/20 rounded-2xl p-6 relative group hover:border-[#7f19e6]/50 transition-all shadow-lg"
            >
              {/* Dropdown Menu */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(
                      activeDropdown === item.id ? null : item.id
                    );
                  }}
                  className="p-2 hover:bg-[#7f19e6]/10 rounded-lg text-slate-400 hover:text-[#7f19e6]"
                >
                  <MoreVertical size={18} />
                </button>
                {activeDropdown === item.id && (
                  <div className="absolute right-0 mt-2 w-36 bg-[#191121] border border-[#7f19e6]/20 rounded-xl shadow-2xl z-[110] py-2">
                    <button
                      onClick={() => openEdit(item, true)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                    >
                      <Search size={14} /> View
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                    >
                      <Settings size={14} /> Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(item)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2 mt-1 border-t border-slate-700/50 pt-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="mb-4">
                <span className="text-[9px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block border border-indigo-500/20">
                  {item.category}
                </span>
                <h3 className="text-lg font-black text-white uppercase tracking-tight pr-6">
                  {item.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {item.description || "No description provided."}
                </p>
              </div>

              {/* Pricing Rules Preview */}
              <div className="bg-[#191121] rounded-xl p-3 border border-slate-700/50 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                  Pricing Rules ({item.prices.length})
                </p>
                {item.prices.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No pricing configured.
                  </p>
                ) : (
                  item.prices.map((price, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-black/20 p-2 rounded border border-[#7f19e6]/10"
                    >
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <MapPin size={10} className="text-[#7f19e6]" />{" "}
                        {price.location_name || "Multi-Region"}
                      </span>
                      <div className="text-right text-[10px] font-black">
                        {price.upfront_price > 0 && (
                          <span className="text-emerald-400 block">
                            ${price.upfront_price}{" "}
                            <span className="text-slate-500 font-normal">
                              Upfront
                            </span>
                          </span>
                        )}
                        {price.monthly_price > 0 && (
                          <span className="text-blue-400 block">
                            ${price.monthly_price}{" "}
                            <span className="text-slate-500 font-normal">
                              /mo
                            </span>
                          </span>
                        )}
                        {price.upfront_price == 0 &&
                          price.monthly_price == 0 && (
                            <span className="text-slate-400">Free</span>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-4 border-t border-[#7f19e6]/10 flex justify-between items-center">
                {item.is_active ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={12} /> Active
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                    <XCircle size={12} /> Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SLIDEOVER FORM --- */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsSlideOverOpen(false)}
          />
          <div className="relative w-full max-w-xl h-full bg-[#191121] shadow-2xl border-l border-[#7f19e6]/20 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-[#7f19e6]/10 bg-[#1f1629] flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {mode === "create"
                  ? "Add New Item"
                  : mode === "edit"
                  ? "Edit Item"
                  : "Item Details"}
              </h2>
              <button
                onClick={() => setIsSlideOverOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Item Name
                    </label>
                    <input
                      disabled={mode === "view"}
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                        Category
                      </label>
                      <select
                        disabled={mode === "view"}
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none"
                      >
                        <option value="decoder">Decoder / Hardware</option>
                        <option value="fee">Setup / Install Fee</option>
                        <option value="service">Service / Maintenance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                        Status
                      </label>
                      <select
                        disabled={mode === "view"}
                        value={formData.is_active}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_active: e.target.value === "true",
                          })
                        }
                        className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none"
                      >
                        <option value="true">Active (Visible)</option>
                        <option value="false">Inactive (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                      Description
                    </label>
                    <textarea
                      disabled={mode === "view"}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none h-20 resize-none"
                    />
                  </div>
                </div>

                {/* --- ADDED: Package Compatibility Configuration --- */}
                <div className="pt-6 border-t border-slate-700/50 space-y-4">
                  <label className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest block mb-1">
                    Compatible Packages
                  </label>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Select which subscription packages this item should be
                    available for.
                  </p>

                  <div className="relative mb-3">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      size={14}
                    />
                    <input
                      type="text"
                      disabled={mode === "view"}
                      placeholder="Search packages..."
                      value={packageSearchQuery}
                      onChange={(e) => setPackageSearchQuery(e.target.value)}
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl py-2 pl-9 pr-4 text-white text-xs focus:ring-1 focus:ring-[#7f19e6] outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {packages
                      .filter((pkg) =>
                        pkg.name
                          .toLowerCase()
                          .includes(packageSearchQuery.toLowerCase())
                      )
                      .map((pkg) => {
                        const isSelected = (
                          formData.package_ids || []
                        ).includes(pkg.id);
                        return (
                          <button
                            type="button"
                            key={pkg.id}
                            disabled={mode === "view"}
                            onClick={() => togglePackage(pkg.id)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border ${
                              isSelected
                                ? "bg-[#7f19e6] text-white border-[#7f19e6] shadow-md shadow-[#7f19e6]/30"
                                : "bg-[#191121] text-slate-400 border-slate-700 hover:border-[#7f19e6]/50 hover:text-slate-200"
                            } ${
                              mode === "view"
                                ? "cursor-not-allowed opacity-80"
                                : ""
                            }`}
                          >
                            {pkg.name}
                          </button>
                        );
                      })}
                    {packages.filter((pkg) =>
                      pkg.name
                        .toLowerCase()
                        .includes(packageSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        No packages found matching your search.
                      </p>
                    )}
                  </div>
                </div>

                {/* Regional Pricing Rules */}
                <div className="pt-6 border-t border-slate-700/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest">
                      Regional Pricing Configuration
                    </label>
                    {mode !== "view" && (
                      <button
                        type="button"
                        onClick={addPriceRow}
                        className="text-xs text-[#7f19e6] hover:text-white font-bold flex items-center gap-1 bg-[#7f19e6]/10 px-2 py-1 rounded transition-colors"
                      >
                        <Plus size={12} /> Add Rule
                      </button>
                    )}
                  </div>

                  {formData.prices.map((price, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1f1629] border border-[#7f19e6]/20 p-4 rounded-xl relative group"
                    >
                      {mode !== "view" && formData.prices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceRow(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* MULTI-SELECT LOCATIONS PILLS */}
                        <div className="md:col-span-3">
                          <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                            Available in Regions{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {locations.map((loc) => {
                              const isSelected = (
                                price.location_ids || []
                              ).includes(loc.id);
                              return (
                                <button
                                  type="button"
                                  key={loc.id}
                                  onClick={() => toggleLocation(idx, loc.id)}
                                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border ${
                                    isSelected
                                      ? "bg-[#7f19e6] text-white border-[#7f19e6] shadow-md shadow-[#7f19e6]/30"
                                      : "bg-[#191121] text-slate-400 border-slate-700 hover:border-[#7f19e6]/50 hover:text-slate-200"
                                  }`}
                                >
                                  {loc.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-emerald-500 uppercase">
                            Upfront Cost
                          </label>
                          <div className="relative mt-1">
                            <DollarSign
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
                              size={12}
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={mode === "view"}
                              value={price.upfront_price}
                              onChange={(e) =>
                                updatePriceRow(
                                  idx,
                                  "upfront_price",
                                  e.target.value
                                )
                              }
                              className="w-full bg-[#191121] border border-slate-700 rounded p-2 pl-6 text-white text-xs focus:border-[#7f19e6] outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-blue-500 uppercase">
                            Monthly Lease/Fee
                          </label>
                          <div className="relative mt-1">
                            <DollarSign
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
                              size={12}
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={mode === "view"}
                              value={price.monthly_price}
                              onChange={(e) =>
                                updatePriceRow(
                                  idx,
                                  "monthly_price",
                                  e.target.value
                                )
                              }
                              className="w-full bg-[#191121] border border-slate-700 rounded p-2 pl-6 text-white text-xs focus:border-[#7f19e6] outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase">
                            Currency
                          </label>
                          <select
                            disabled={mode === "view"}
                            value={price.currency}
                            onChange={(e) =>
                              updatePriceRow(idx, "currency", e.target.value)
                            }
                            className="w-full bg-[#191121] border border-slate-700 rounded p-2 text-white text-xs mt-1 focus:border-[#7f19e6] outline-none transition-colors"
                          >
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {formData.prices.length === 0 && (
                    <p className="text-xs text-slate-500 italic">
                      No regional pricing defined. This item will not be visible
                      for sale.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Footer */}
              <div className="p-6 border-t border-[#7f19e6]/10 bg-[#1f1629] shrink-0">
                {mode !== "view" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#7f19e6] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#7f19e6]/30 hover:bg-[#8e29f7] disabled:opacity-50 transition-all"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : mode === "create"
                      ? "Save Item & Prices"
                      : "Update Configuration"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSlideOverOpen(false)}
                    className="w-full py-4 bg-slate-800 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all"
                  >
                    Close
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-sm w-full text-center">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={40} />
            <h3 className="text-xl font-black text-white mb-2 uppercase">
              Delete Item?
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to remove{" "}
              <strong>{itemToDelete?.name}</strong>? This will permanently
              delete its pricing configurations across all regions.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs uppercase transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalItems;
