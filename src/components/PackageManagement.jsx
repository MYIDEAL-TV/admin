import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Settings,
  AlertTriangle,
  MoreVertical,
  MapPin,
  DollarSign,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Blocks,
  Tv,
  Server,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { secureFetch } from "../utils/api";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PackageManagement = () => {
  // --- STATE MANAGEMENT ---
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [channelsList, setChannelsList] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [decodersList, setDecodersList] = useState([]);
  const [otherItemsList, setOtherItemsList] = useState([]);

  // Selections
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedDecoders, setSelectedDecoders] = useState([]);
  const [selectedOtherItems, setSelectedOtherItems] = useState([]);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [packageSearchQuery, setPackageSearchQuery] = useState(""); // 🚀 NEW: Search state for packages

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState("ALL");

  // Modals & Menus
  const [packageMode, setPackageMode] = useState("create");
  const [isPackageSlideOverOpen, setIsPackageSlideOverOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isPackageDeleteModalOpen, setIsPackageDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false); // 🚀 FIX: ADDED THIS LINE

  // Form Data
  const [packageFormData, setPackageFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "0.00",
    price_type: "per_subscriber",
    location_id: "",
    status: "Active",
    template_id: "",
    type: "Base",
  });

  // --- STRICT TEMPLATE VALIDATION LOGIC ---
  const selectedBlueprint = blueprints.find(
    (b) => b.id === packageFormData.template_id
  );

  const requiredFixed =
    selectedBlueprint?.fixed_channels ??
    selectedBlueprint?.template_fixed_channels ??
    0;

  const requiredFlex =
    selectedBlueprint?.flex_channels ??
    selectedBlueprint?.template_flex_channels ??
    0;

  const isMathValid = selectedBlueprint
    ? selectedChannels.length === requiredFixed
    : false;

  // 🚀 FIX: Combined Filter + Search Logic for the Table
  const displayPackages = packages.filter((pkg) => {
    const matchesFilter =
      filterType === "ALL" || pkg.type?.toUpperCase() === filterType;
    const matchesSearch = pkg.name
      ?.toLowerCase()
      .includes(packageSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const availableAddons = packages.filter(
    (p) =>
      p.type?.toUpperCase() === "ADD-ON" &&
      String(p.location_id) === String(packageFormData.location_id) &&
      p.id !== packageFormData.id
  );

  // --- LIFECYCLE & EFFECTS ---
  useEffect(() => {
    fetchBlueprints();
    fetchPackages();
    fetchLocations();
    fetchDecoders();
    fetchOtherItems();
  }, []);

  const fetchOtherItems = async () => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/additional-items`
      );
      const data = await response.json();
      if (data.success) {
        const filteredItems = data.items.filter(
          (item) => item.category !== "decoder" && item.category !== "flex"
        );
        setOtherItemsList(filteredItems);
      }
    } catch (error) {
      console.error("Failed to load other items");
    }
  };

  useEffect(() => {
    const closeMenu = () => setActiveDropdown(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0)
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (packageFormData.location_id) {
      fetchEligibleChannels(packageFormData.location_id);

      const validAddonIds = packages
        .filter(
          (p) => String(p.location_id) === String(packageFormData.location_id)
        )
        .map((p) => p.id);
      setSelectedAddons((prev) =>
        prev.filter((id) => validAddonIds.includes(id))
      );
    } else {
      setChannelsList([]);
    }
  }, [packageFormData.location_id, packages]);

  useEffect(() => {
    const validChannelIds = channelsList.map((c) => c.id);
    setSelectedChannels((prev) =>
      prev.filter((id) => validChannelIds.includes(id))
    );
  }, [channelsList]);

  // --- API CALLS ---
  const fetchBlueprints = async () => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/package-templates`
      );
      const data = await response.json();
      if (data.success) setBlueprints(data.templates);
    } catch (err) {
      console.error("Failed to load blueprints");
    }
  };

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/packages`);
      const data = await response.json();
      if (data.success) setPackages(data.packages);
    } catch (error) {
      toast.error("Failed to load packages");
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

  const fetchEligibleChannels = async (locId) => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/packages/eligible-channels?locationId=${locId}`
      );
      const data = await response.json();
      if (data.success) setChannelsList(data.channels);
    } catch (err) {
      console.error("Failed to fetch eligible channels");
    }
  };

  const fetchDecoders = async () => {
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/decoders`);
      const data = await response.json();
      if (data.success) setDecodersList(data.decoders);
    } catch (error) {
      console.error("Failed to load decoders");
    }
  };

  // --- ACTION HANDLERS ---
  const openPackageCreate = () => {
    setPackageMode("create");
    setPackageFormData({
      id: "",
      name: "",
      description: "",
      price: "0.00",
      price_type: "per_subscriber",
      location_id: "",
      status: "Active",
      template_id: "",
      type: "Base",
    });
    setSelectedChannels([]);
    setSelectedAddons([]);
    setSelectedDecoders([]);
    setSelectedOtherItems([]);
    setChannelSearchQuery("");
    setIsPackageSlideOverOpen(true);
  };

  const openPackageView = (pkg) => {
    setPackageMode("view");
    setPackageFormData({
      ...pkg,
      price_type: pkg.price_type || "per_subscriber",
    });
    setSelectedChannels(pkg.channel_ids || []);
    setSelectedAddons(pkg.addon_ids || []);
    setSelectedDecoders(pkg.compatible_decoders || []);
    setSelectedOtherItems(pkg.compatible_other_items || []);
    setChannelSearchQuery("");
    setIsPackageSlideOverOpen(true);
  };

  const openPackageEdit = (pkg) => {
    setPackageMode("edit");
    setPackageFormData({
      ...pkg,
      price_type: pkg.price_type || "per_subscriber",
    });
    setSelectedChannels(pkg.channel_ids || []);
    setSelectedAddons(pkg.addon_ids || []);
    setSelectedDecoders(pkg.compatible_decoders || []);
    setSelectedOtherItems(pkg.compatible_other_items || []);
    setChannelSearchQuery("");
    setIsPackageSlideOverOpen(true);
  };

  const openPackageCopy = (pkg) => {
    setPackageMode("create");
    setPackageFormData({
      ...pkg,
      id: "",
      name: `${pkg.name} (Copy)`,
      price_type: pkg.price_type || "per_subscriber",
    });
    setSelectedChannels(pkg.channel_ids || []);
    setSelectedAddons(pkg.addon_ids || []);
    setSelectedDecoders(pkg.compatible_decoders || []);
    setSelectedOtherItems(pkg.compatible_other_items || []);
    setChannelSearchQuery("");
    setIsPackageSlideOverOpen(true);
  };

  const toggleOtherItem = (itemId) => {
    setSelectedOtherItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const openPackageDeleteModal = (pkg) => {
    setPackageToDelete(pkg);
    setIsPackageDeleteModalOpen(true);
    setCountdown(5);
  };

  const toggleChannel = (channelId) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  };

  const toggleDecoder = (decoderId) => {
    setSelectedDecoders((prev) =>
      prev.includes(decoderId)
        ? prev.filter((id) => id !== decoderId)
        : [...prev, decoderId]
    );
  };

  const handleTemplateChange = (e) => {
    const tmplId = e.target.value;
    const tmpl = blueprints.find((b) => b.id === tmplId);
    setPackageFormData((prev) => ({
      ...prev,
      template_id: tmplId,
      type: tmpl ? tmpl.template_type : "Base",
    }));

    if (tmpl && tmpl.template_type.toUpperCase() === "ADD-ON") {
      setSelectedAddons([]);
    }
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (packageMode === "view") return;

    if (!packageFormData.template_id)
      return toast.error("Please select a Blueprint.");
    if (!isMathValid)
      return toast.error(
        `Blueprint rules violated! Select exactly ${requiredFixed} base channels.`
      );
    if (!packageFormData.location_id)
      return toast.error("Please assign this package to a region.");

    setIsSubmitting(true);
    try {
      const isEdit = packageMode === "edit";
      const url = isEdit
        ? `${VITE_API_URL}/api/admin/packages/${packageFormData.id}`
        : `${VITE_API_URL}/api/admin/packages`;

      const payload = {
        ...packageFormData,
        channel_ids: selectedChannels,
        addon_ids:
          packageFormData.type.toUpperCase() === "BASE" ? selectedAddons : [],
        decoder_ids: selectedDecoders,
        other_item_ids: selectedOtherItems,
      };

      const response = await secureFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEdit ? "Package Updated" : "Package Created");
        setIsPackageSlideOverOpen(false);
        fetchPackages();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePackageDelete = async () => {
    setIsDeleting(true); // 🚀 FIX: Start loading
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/packages/${packageToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        setIsPackageDeleteModalOpen(false);
        fetchPackages();
        toast.success(`${packageToDelete.name} deleted`);
      } else {
        toast.error(data.error || "Deletion failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsDeleting(false); // 🚀 FIX: Stop loading
    }
  };

  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        status === "Active"
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
      }`}
    >
      {status}
    </span>
  );

  const getTypeBadge = (type) => (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        type?.toUpperCase() === "BASE"
          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      }`}
    >
      {type}
    </span>
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[#191121] p-6 rounded-2xl border border-[#7f19e6]/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Package className="text-[#7f19e6]" /> Package & Add-on Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deploy market-ready Base Packages and unbundled Add-ons.
          </p>
        </div>
        <button
          onClick={openPackageCreate}
          className="flex items-center gap-2 px-6 py-3 bg-[#7f19e6] hover:bg-[#8e29f7] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#7f19e6]/20 active:scale-95"
        >
          <Plus size={16} /> Create New
        </button>
      </div>

      {/* 🚀 FIX: TABS & SEARCH BAR COMBO */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end border-b border-[#7f19e6]/20 pb-4">
        <div className="flex gap-2">
          {["ALL", "BASE", "ADD-ON"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-colors ${
                filterType === type
                  ? "bg-[#7f19e6]/20 text-[#7f19e6] border border-[#7f19e6]/50"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
              }`}
            >
              {type === "ALL"
                ? "All Products"
                : type === "BASE"
                ? "Base Packages"
                : "Add-ons"}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search products by name..."
            className="w-full bg-[#191121] border border-[#7f19e6]/30 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all placeholder:text-slate-600"
            value={packageSearchQuery}
            onChange={(e) => setPackageSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 🚀 FIX: REPLACED CARDS WITH A CLEAN DATA TABLE */}
      {/* Removed overflow-hidden and added a min-height so the dropdown is never cut off! */}
      <div className="bg-[#1f1629] rounded-xl border border-[#7f19e6]/10 shadow-2xl min-h-[350px]">
        <table className="w-full text-left">
          <thead className="bg-[#7f19e6]/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#7f19e6]/10">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Region</th>
              <th className="px-6 py-4">Monthly Price</th>
              <th className="px-6 py-4">Blueprint & Type</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7f19e6]/10">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#7f19e6] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                      Loading Catalog...
                    </p>
                  </div>
                </td>
              </tr>
            ) : displayPackages.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-20 text-center">
                  <Package
                    className="mx-auto text-[#7f19e6]/40 mb-3"
                    size={40}
                  />
                  <p className="text-slate-400 text-sm font-bold">
                    No products found matching your criteria.
                  </p>
                </td>
              </tr>
            ) : (
              displayPackages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="hover:bg-[#7f19e6]/5 transition-colors text-sm group"
                >
                  <td className="px-6 py-4">
                    <div className="font-black text-white uppercase tracking-tight">
                      {pkg.name}
                    </div>
                    {pkg.type?.toUpperCase() === "BASE" &&
                      pkg.addon_ids?.length > 0 && (
                        <div className="text-[10px] text-amber-500 font-bold mt-1 flex items-center gap-1">
                          <Blocks size={10} /> {pkg.addon_ids.length} Add-ons
                          Linked
                        </div>
                      )}
                  </td>

                  <td className="px-6 py-4 text-slate-300 font-medium">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#7f19e6]" />
                      {pkg.location_name || "Unassigned"}
                    </div>
                    <div className="text-[10px] text-slate-500 ml-4 mt-0.5 uppercase tracking-wider">
                      {pkg.state_province}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-lg font-black text-white">
                      ${Number(pkg.price).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      /MO
                      {pkg.price_type === "per_tv" ? (
                        <span className="text-[#a755f7]">(Per TV)</span>
                      ) : (
                        <span>(Per Sub)</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                        <FileText size={12} className="text-slate-500" />
                        {pkg.template_name || "Custom"}
                      </span>
                      {getTypeBadge(pkg.type)}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(pkg.status)}
                  </td>

                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(
                          activeDropdown === `pkg-${pkg.id}`
                            ? null
                            : `pkg-${pkg.id}`
                        );
                      }}
                      className="p-2 hover:bg-[#7f19e6]/10 rounded-lg text-slate-400 hover:text-[#7f19e6] transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeDropdown === `pkg-${pkg.id}` && (
                      <div className="absolute right-6 mt-2 w-40 bg-[#191121] border border-[#7f19e6]/20 rounded-xl shadow-2xl z-[110] py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={() => openPackageView(pkg)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                        >
                          <Search size={14} /> View Details
                        </button>
                        <button
                          onClick={() => openPackageEdit(pkg)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                        >
                          <Settings size={14} /> Edit
                        </button>
                        <button
                          onClick={() => openPackageCopy(pkg)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                        >
                          <Copy size={14} /> Copy & Add
                        </button>
                        <div className="h-px bg-[#7f19e6]/10 my-1" />
                        <button
                          onClick={() => openPackageDeleteModal(pkg)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2"
                        >
                          <AlertTriangle size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {displayPackages.length > 0 && (
          <div className="px-6 py-4 border-t border-[#7f19e6]/10 bg-[#7f19e6]/5 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Showing {displayPackages.length} total products</span>
          </div>
        )}
      </div>

      {/* --- SLIDEOVER AND DELETE MODAL REMAIN EXACTLY THE SAME --- */}
      {isPackageSlideOverOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsPackageSlideOverOpen(false)}
          />
          <div className="relative w-full max-w-2xl h-full bg-[#191121] shadow-2xl border-l border-[#7f19e6]/20 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-[#7f19e6]/10 bg-[#1f1629] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {packageMode === "create"
                    ? "Build Product"
                    : packageMode === "edit"
                    ? "Edit Product"
                    : "Product Details"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure pricing, channels, and add-on links.
                </p>
              </div>
              <button
                onClick={() => setIsPackageSlideOverOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handlePackageSubmit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2 col-span-2 border border-[#7f19e6]/30 bg-[#7f19e6]/5 p-4 rounded-xl">
                  <label className="text-[10px] font-black text-[#a755f7] uppercase tracking-widest flex items-center gap-1">
                    <Layers size={12} /> Select Blueprint / Template{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    disabled={packageMode === "view"}
                    required
                    className="w-full bg-[#1f1629] border border-[#7f19e6]/40 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none font-bold"
                    value={packageFormData.template_id}
                    onChange={handleTemplateChange}
                  >
                    <option value="">
                      -- Choose a Governance Blueprint --
                    </option>
                    {blueprints.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.total_channels} Total | {b.template_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Product Name
                    </label>
                    <input
                      disabled={packageMode === "view"}
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      value={packageFormData.name}
                      placeholder="e.g. SBH Premium Base"
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Regional Assignment
                    </label>
                    <select
                      disabled={packageMode === "view"}
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      value={packageFormData.location_id}
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          location_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Select a Location...</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.state_province})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest">
                      Monthly Base Price
                    </label>
                    <div className="relative">
                      <DollarSign
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                        size={16}
                      />
                      <input
                        disabled={packageMode === "view"}
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-[#1f1629] border border-[#7f19e6]/50 rounded-xl p-4 pl-10 text-white font-bold focus:ring-2 focus:ring-[#7f19e6] outline-none"
                        value={packageFormData.price}
                        onChange={(e) =>
                          setPackageFormData({
                            ...packageFormData,
                            price: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-[#a755f7] uppercase tracking-widest">
                      Pricing Model
                    </label>
                    <select
                      disabled={packageMode === "view"}
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/50 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      value={packageFormData.price_type}
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          price_type: e.target.value,
                        })
                      }
                    >
                      <option value="per_subscriber">
                        Standard (Per Subscriber)
                      </option>
                      <option value="per_tv">
                        Commercial (Per TV / Hotel)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Type (Inherited)
                    </label>
                    <input
                      disabled
                      className={`w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 font-black outline-none cursor-not-allowed uppercase ${
                        packageFormData.type?.toUpperCase() === "BASE"
                          ? "text-blue-400"
                          : "text-amber-400"
                      }`}
                      value={packageFormData.type || "N/A"}
                    />
                  </div>

                  {selectedBlueprint && (
                    <div
                      className={`col-span-2 p-4 rounded-xl border flex items-center justify-between transition-colors ${
                        isMathValid
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div>
                        <h4
                          className={`text-xs font-black uppercase tracking-wider mb-1 ${
                            isMathValid ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isMathValid
                            ? "Blueprint Rules Validated"
                            : "Invalid Channel Allocation"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wider flex flex-col gap-1 mt-1">
                          <span>
                            <span
                              className={
                                selectedChannels.length === requiredFixed
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }
                            >
                              {selectedChannels.length}
                            </span>{" "}
                            / {requiredFixed} Base Channels Required
                          </span>
                          {requiredFlex > 0 && (
                            <span className="text-indigo-400 opacity-90">
                              (Customer will select {requiredFlex} Flex Channels
                              during checkout)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        {isMathValid ? (
                          <CheckCircle2
                            className="text-emerald-500"
                            size={28}
                          />
                        ) : (
                          <XCircle className="text-red-500" size={28} />
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`space-y-3 col-span-2 ${
                      !selectedBlueprint && "opacity-50 pointer-events-none"
                    }`}
                  >
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                      Allocate Base Channels
                      <span
                        className={
                          isMathValid ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {selectedChannels.length}/{requiredFixed} Base
                      </span>
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="Search channels..."
                        value={channelSearchQuery}
                        onChange={(e) => setChannelSearchQuery(e.target.value)}
                        disabled={
                          !packageFormData.location_id || packageMode === "view"
                        }
                        className="w-full bg-[#191121] border border-[#7f19e6]/30 rounded-lg p-2.5 pl-9 text-xs text-white font-bold focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all placeholder:text-slate-600 placeholder:font-normal"
                      />
                    </div>
                    <div className="bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {!packageFormData.location_id ? (
                        <p className="p-4 text-xs text-center text-slate-500 italic">
                          Select a region first to fetch eligible active
                          channels.
                        </p>
                      ) : (
                        channelsList
                          .filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(channelSearchQuery.toLowerCase())
                          )
                          .map((channel) => (
                            <label
                              key={channel.id}
                              className="flex items-center justify-between p-3 hover:bg-[#7f19e6]/10 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedChannels.includes(
                                    channel.id
                                  )}
                                  onChange={() => toggleChannel(channel.id)}
                                  disabled={packageMode === "view"}
                                  className="w-4 h-4 rounded border-[#7f19e6]/30 bg-[#191121] text-[#7f19e6] focus:ring-[#7f19e6] focus:ring-offset-0"
                                />
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                  {channel.name}
                                </span>
                              </div>
                              {channel.flex_eligible && (
                                <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-400/10 px-2 py-1 rounded">
                                  Flex Eligible
                                </span>
                              )}
                            </label>
                          ))
                      )}
                      {packageFormData.location_id &&
                        channelsList.filter((c) =>
                          c.name
                            .toLowerCase()
                            .includes(channelSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <p className="p-4 text-xs text-center text-slate-500 italic">
                            No channels match "{channelSearchQuery}".
                          </p>
                        )}
                    </div>
                  </div>

                  {packageFormData.type?.toUpperCase() === "BASE" &&
                    selectedBlueprint && (
                      <div className="space-y-3 col-span-2 border-t border-[#7f19e6]/20 pt-6 mt-2">
                        <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Blocks size={14} /> Link Eligible Add-ons
                          </span>
                          <span className="bg-amber-500/20 px-2 py-0.5 rounded">
                            {selectedAddons.length} Selected
                          </span>
                        </label>
                        <div className="bg-[#1f1629] border border-amber-500/20 rounded-xl max-h-40 overflow-y-auto custom-scrollbar p-2 space-y-1">
                          {!packageFormData.location_id ? (
                            <p className="p-4 text-xs text-center text-slate-500 italic">
                              Select a region first to see eligible Add-ons.
                            </p>
                          ) : availableAddons.length === 0 ? (
                            <p className="p-4 text-xs text-center text-red-400 italic">
                              No Add-ons have been created for this region yet.
                            </p>
                          ) : (
                            availableAddons.map((addon) => (
                              <label
                                key={addon.id}
                                className="flex items-center justify-between p-3 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedAddons.includes(addon.id)}
                                    onChange={() => toggleAddon(addon.id)}
                                    disabled={packageMode === "view"}
                                    className="w-4 h-4 rounded border-amber-500/30 bg-[#191121] text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                                  />
                                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                    {addon.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-400">
                                  +${Number(addon.price).toFixed(2)}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Linked Add-ons will be available as optional upgrades
                          when reps generate contracts.
                        </p>
                      </div>
                    )}

                  {packageFormData.type?.toUpperCase() === "BASE" && (
                    <div className="space-y-3 col-span-2 border-t border-[#7f19e6]/20 pt-6 mt-2">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Server size={14} /> Compatible Decoders
                        </span>
                        <span className="bg-emerald-400/20 px-2 py-0.5 rounded text-emerald-400">
                          {selectedDecoders.length} Selected
                        </span>
                      </label>

                      <div className="bg-[#1f1629] border border-emerald-500/20 rounded-xl max-h-40 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {decodersList.length === 0 ? (
                          <p className="p-4 text-xs text-center text-slate-500 italic">
                            Loading decoders...
                          </p>
                        ) : (
                          decodersList.map((decoder) => (
                            <label
                              key={decoder.id}
                              className="flex items-center justify-between p-3 hover:bg-emerald-500/10 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedDecoders.includes(
                                    decoder.id
                                  )}
                                  onChange={() => toggleDecoder(decoder.id)}
                                  disabled={packageMode === "view"}
                                  className="w-4 h-4 rounded border-emerald-500/30 bg-[#191121] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                                />
                                <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                  {decoder.name}
                                </span>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Check the decoders that are technically compatible with
                        this package (e.g., preventing IPSticks from being
                        selected on Satellite-only plans).
                      </p>
                    </div>
                  )}
                  {/* --- NEW: OTHER ITEMS BLOCK --- */}
                  {packageFormData.type?.toUpperCase() === "BASE" && (
                    <div className="space-y-3 col-span-2 border-t border-[#7f19e6]/20 pt-6 mt-2">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Settings size={14} /> Other Compatible Items (Fees,
                          Hardware)
                        </span>
                        <span className="bg-pink-400/20 px-2 py-0.5 rounded text-pink-400">
                          {selectedOtherItems.length} Selected
                        </span>
                      </label>

                      <div className="bg-[#1f1629] border border-pink-500/20 rounded-xl max-h-40 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {otherItemsList.length === 0 ? (
                          <p className="p-4 text-xs text-center text-slate-500 italic">
                            Loading other items...
                          </p>
                        ) : (
                          otherItemsList.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-center justify-between p-3 hover:bg-pink-500/10 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedOtherItems.includes(item.id)}
                                  onChange={() => toggleOtherItem(item.id)}
                                  disabled={packageMode === "view"}
                                  className="w-4 h-4 rounded border-pink-500/30 bg-[#191121] text-pink-500 focus:ring-pink-500 focus:ring-offset-0"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                                    {item.name}
                                  </span>
                                  <span className="text-[9px] font-black uppercase text-slate-500">
                                    {item.category}
                                  </span>
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Check the additional items (like Installation Fees,
                        Connection Fees, Dishes) that should be available when
                        this package is selected.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Market Status
                    </label>
                    <select
                      disabled={packageMode === "view"}
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      value={packageFormData.status}
                      onChange={(e) =>
                        setPackageFormData({
                          ...packageFormData,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Active">Active / Visible in POS</option>
                      <option value="Inactive">Inactive / Hidden</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#7f19e6]/10 bg-[#1f1629] shrink-0 mt-auto">
                {packageMode !== "view" ? (
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !isMathValid ||
                      !packageFormData.template_id
                    }
                    className="w-full py-4 bg-[#7f19e6] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#7f19e6]/30 hover:bg-[#8e29f7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {!packageFormData.template_id
                      ? "Select a Blueprint First"
                      : !isMathValid
                      ? `Allocate ${requiredFixed} Base Channels`
                      : isSubmitting
                      ? "Syncing..."
                      : packageMode === "edit"
                      ? "Update Product"
                      : "Create Product"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPackageSlideOverOpen(false)}
                    className="w-full py-4 bg-slate-800 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all"
                  >
                    Close Details
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {isPackageDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 shadow-inner">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
              Delete Product?
            </h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You are about to permanently remove{" "}
              <span className="text-white font-bold italic">
                "{packageToDelete?.name}"
              </span>
              .
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPackageDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                disabled={countdown > 0 || isDeleting} // 🚀 FIX: Disable while deleting
                onClick={handlePackageDelete}
                className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                  countdown > 0 || isDeleting
                    ? "bg-red-950/20 text-red-900 border border-red-900/20 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                }`}
              >
                {countdown > 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    Wait {countdown}s
                  </span>
                ) : isDeleting ? (
                  "DELETING..." // 🚀 FIX: Show loading text
                ) : (
                  "Confirm Deletion"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;
