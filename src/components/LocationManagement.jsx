import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  MapPin,
  Edit,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  Settings,
  AlertTriangle,
  Loader,
  Tv,
  Package,
} from "lucide-react";
import { secureFetch } from "../utils/api";
import { toast } from "sonner";

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [packageSearchQuery, setPackageSearchQuery] = useState("");
  const [isLocationDeleteModalOpen, setIsLocationDeleteModalOpen] =
    useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const itemsPerPage = 5;
  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [isLoading, setIsLoading] = useState(true);

  const filtered = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.country_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocationSlideOverOpen, setIsLocationSlideOverOpen] = useState(false);

  // 🚀 FIX: Added Screen Cost and Max Screens to initial state
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    state_province: "",
    country_code: "",
    currency: "EUR",
    tax_desc: "",
    tax_amount: 0,
    additional_screen_cost: 10,
    max_screens_per_package: 4,
    status: "Active",
  });

  useEffect(() => {
    const closeMenu = () => setActiveDropdown(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const [locationMode, setRoleMode] = useState("create");
  const [selectedLocationDetails, setSelectedLocationDetails] = useState({
    channels: [],
    packages: [],
  });

  const openLocationView = async (loc) => {
    setLocationFormData({
      id: loc.id,
      name: loc.name,
      state_province: loc.state_province,
      country_code: loc.country_code,
      currency: loc.currency || "EUR",
      tax_desc: loc.tax_desc || "",
      tax_amount: loc.tax_amount || 0,
      additional_screen_cost: loc.additional_screen_cost || 10,
      max_screens_per_package: loc.max_screens_per_package || 4,
      status: loc.status || "Active",
    });
    setRoleMode("view");
    setIsLocationSlideOverOpen(true);

    setChannelSearchQuery("");
    setPackageSearchQuery("");

    // 🚀 FIX: Reset to 0 visually while it fetches
    setSelectedLocationDetails({ channels: [], packages: [] });

    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/locations/${loc.id}/details`
      );

      const data = await response.json();

      if (data.success) {
        setSelectedLocationDetails(data.details);
      } else {
        // 🚨 If SQL fails, show the exact error on screen
        toast.error("Failed to load details: " + data.error);
      }
    } catch (err) {
      console.error("Fetch Details Error:", err);
      toast.error("Network error while fetching location details.");
    }
  };

  const openLocationEdit = (loc) => {
    setRoleMode("edit");
    // 🚀 FIX: Hydrate Screen Cost and Max Screens
    setLocationFormData({
      id: loc.id,
      name: loc.name,
      state_province: loc.state_province,
      country_code: loc.country_code,
      currency: loc.currency || "EUR",
      tax_desc: loc.tax_desc || "",
      tax_amount: loc.tax_amount || 0,
      additional_screen_cost: loc.additional_screen_cost || 10,
      max_screens_per_package: loc.max_screens_per_package || 4,
      status: loc.status || "Active",
    });
    setIsLocationSlideOverOpen(true);
  };

  const openLocationDeleteModal = (loc) => {
    setLocationToDelete(loc);
    setIsLocationDeleteModalOpen(true);
    setCountdown(5);
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isEdit = locationMode === "edit";
      const url = isEdit
        ? `${VITE_API_URL}/api/admin/locations/${locationFormData.id}`
        : `${VITE_API_URL}/api/admin/locations`;

      const response = await secureFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationFormData.name,
          state_province: locationFormData.state_province,
          country_code: locationFormData.country_code,
          currency: locationFormData.currency,
          tax_desc: locationFormData.tax_desc,
          tax_amount: locationFormData.tax_amount,
          // 🚀 FIX: Send Screen rules to Backend
          additional_screen_cost: locationFormData.additional_screen_cost,
          max_screens_per_package: locationFormData.max_screens_per_package,
          status: locationFormData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isEdit ? "Location Updated" : "Location Created");
        setIsLocationSlideOverOpen(false);
        fetchLocations();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/locations/${locationToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsLocationDeleteModalOpen(false);
        await fetchLocations();
        toast.success(`${locationToDelete.name} deleted successfully`);
        setLocationToDelete(null);
        return;
      } else {
        toast.error(data.error || "Database refused deletion");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Network error: Could not reach the server");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/locations/admin`
      );

      if (!response) return;

      const data = await response.json();
      if (data.success) {
        setLocations(data.locations);
      } else {
        toast.error(data.error || "Failed to load locations");
      }
    } catch (error) {
      console.error("Location Fetch Error:", error);
      toast.error("Server connection lost. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Locations ({filtered.length})
            </h3>
            <p className="text-sm text-slate-400">
              Manage geographical service areas, regional taxes, and presets.
            </p>
          </div>
          <button
            onClick={() => {
              setLocationFormData({
                name: "",
                state_province: "",
                country_code: "",
                currency: "EUR",
                tax_desc: "",
                tax_amount: 0,
                additional_screen_cost: 10,
                max_screens_per_package: 4,
                status: "Active",
              });
              setRoleMode("create");
              setIsLocationSlideOverOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7f19e6] hover:bg-[#7f19e6]/90 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-[#7f19e6]/20 uppercase"
          >
            <Plus size={18} /> Add New Location
          </button>
        </div>

        <div className="bg-[#1f1629] rounded-xl border border-[#7f19e6]/10 overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[#7f19e6]/10">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search locations..."
                className="w-full bg-[#191121] border border-[#7f19e6]/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-[#7f19e6]/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">State/Province</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4 text-center">Tax</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7f19e6]/10">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#7f19e6] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Fetching Service Areas...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-slate-500">
                    No locations found.
                  </td>
                </tr>
              ) : (
                currentItems.map((loc) => (
                  <tr
                    key={loc.id}
                    className="h-[72px] hover:bg-[#7f19e6]/5 transition-colors text-sm"
                  >
                    <td className="px-6 py-4 font-bold text-white">
                      {loc.name}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      {loc.state_province}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-black">
                      {loc.currency || "EUR"}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {loc.tax_amount > 0
                        ? `${(loc.tax_amount * 100).toFixed(2)}% ${
                            loc.tax_desc
                          }`
                        : "No Tax"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={loc.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(loc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(
                              activeDropdown === `loc-${loc.id}`
                                ? null
                                : `loc-${loc.id}`
                            );
                          }}
                          className="p-2 hover:bg-[#7f19e6]/10 rounded-lg text-slate-400 hover:text-[#7f19e6] transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeDropdown === `loc-${loc.id}` && (
                          <div className="absolute right-0 mt-2 w-40 bg-[#191121] border border-[#7f19e6]/20 rounded-xl shadow-2xl z-[110] py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                            <button
                              onClick={() => openLocationView(loc)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                            >
                              <Search size={14} /> View Details
                            </button>
                            <button
                              onClick={() => openLocationEdit(loc)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                            >
                              <Settings size={14} /> Edit Region
                            </button>
                            <div className="h-px bg-[#7f19e6]/10 my-1" />
                            <button
                              onClick={() => openLocationDeleteModal(loc)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2"
                            >
                              <AlertTriangle size={14} /> Delete Location
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 flex items-center justify-between border-t border-[#7f19e6]/10 bg-[#7f19e6]/5">
            <p className="text-xs text-slate-500 font-medium">
              Showing{" "}
              <span className="text-white font-bold">
                {filtered.length > 0 ? indexOfFirstItem + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="text-white font-bold">
                {Math.min(indexOfLastItem, filtered.length)}
              </span>{" "}
              of <span className="text-white font-bold">{filtered.length}</span>{" "}
              results
            </p>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2 rounded border border-[#7f19e6]/20 text-slate-400 hover:bg-[#7f19e6]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 rounded border border-[#7f19e6]/20 text-slate-400 hover:bg-[#7f19e6]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {isLocationSlideOverOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsLocationSlideOverOpen(false)}
          />

          <div className="relative w-full max-w-md h-full bg-[#191121] shadow-2xl border-l border-[#7f19e6]/20 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-[#7f19e6]/10 bg-[#1f1629] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Register Location
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add a new region to the IdealTV network architecture.
                </p>
              </div>
              <button
                onClick={() => setIsLocationSlideOverOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleLocationSubmit}
              className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Location Name
                  </label>
                  <input
                    disabled={locationMode === "view"}
                    required
                    className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all"
                    placeholder="e.g. Saint Barthélemy"
                    value={locationFormData.name}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      State / Province
                    </label>
                    <input
                      disabled={locationMode === "view"}
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all"
                      placeholder="e.g. SBH"
                      value={locationFormData.state_province}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          state_province: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Country Code
                    </label>
                    <input
                      disabled={locationMode === "view"}
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all"
                      placeholder="e.g. FR"
                      maxLength={2}
                      value={locationFormData.country_code}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          country_code: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#7f19e6]/20 pt-4 mt-2">
                  <label className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest">
                    Regional Currency & Tax
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      disabled={locationMode === "view"}
                      className="col-span-2 w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all font-bold"
                      value={locationFormData.currency}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          currency: e.target.value,
                        })
                      }
                    >
                      <option value="EUR">Euros (€) - EUR</option>
                      <option value="USD">US Dollars ($) - USD</option>
                    </select>

                    <input
                      disabled={locationMode === "view"}
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all text-xs"
                      placeholder="Tax Name (e.g. TGCA)"
                      value={locationFormData.tax_desc}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          tax_desc: e.target.value,
                        })
                      }
                    />

                    <input
                      disabled={locationMode === "view"}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all text-xs"
                      placeholder="Tax Amount (e.g. 0.04)"
                      value={locationFormData.tax_amount}
                      onChange={(e) =>
                        setLocationFormData({
                          ...locationFormData,
                          tax_amount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* 🚀 FIX: NEW FIELDS FOR SCREEN COST AND MAX SCREENS */}
                <div className="space-y-2 border-t border-[#7f19e6]/20 pt-4 mt-2">
                  <label className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest">
                    Screen Math Rules
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider">
                        Add'l Screen Cost
                      </label>
                      <input
                        disabled={locationMode === "view"}
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all text-xs"
                        placeholder="10.00"
                        value={locationFormData.additional_screen_cost}
                        onChange={(e) =>
                          setLocationFormData({
                            ...locationFormData,
                            additional_screen_cost: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider">
                        Max Screens / Pkg
                      </label>
                      <input
                        disabled={locationMode === "view"}
                        type="number"
                        min="1"
                        className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] disabled:opacity-50 transition-all text-xs"
                        placeholder="4"
                        value={locationFormData.max_screens_per_package}
                        onChange={(e) =>
                          setLocationFormData({
                            ...locationFormData,
                            max_screens_per_package: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#7f19e6]/20 pt-4 mt-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Operational Status
                  </label>
                  <select
                    disabled={locationMode === "view"}
                    className={`w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-[#7f19e6] transition-all ${
                      locationFormData.status === "Active" ||
                      locationFormData.status === "active"
                        ? "border-emerald-500/30 text-emerald-400"
                        : "border-red-500/30 text-red-400"
                    }`}
                    value={locationFormData.status}
                    onChange={(e) =>
                      setLocationFormData({
                        ...locationFormData,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Active">🟢 Active / Online</option>
                    <option value="Inactive">🔴 Inactive / Maintenance</option>
                  </select>
                </div>
              </div>

              {locationMode === "view" && (
                <div className="space-y-6 pt-6 border-t border-[#7f19e6]/10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* --- CHANNELS SECTION --- */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
                        Enabled Channels
                      </h3>
                      <span className="px-2 py-0.5 bg-[#7f19e6]/20 text-[#7f19e6] text-[10px] font-black rounded-full">
                        {selectedLocationDetails?.channels?.length || 0}
                      </span>
                    </div>

                    {selectedLocationDetails?.channels?.length > 0 && (
                      <div className="relative">
                        <Search
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                          size={14}
                        />
                        <input
                          type="text"
                          placeholder="Search channels..."
                          value={channelSearchQuery}
                          onChange={(e) =>
                            setChannelSearchQuery(e.target.value)
                          }
                          className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all"
                        />
                      </div>
                    )}

                    <div className="bg-[#1f1629]/50 rounded-xl border border-[#7f19e6]/10 divide-y divide-[#7f19e6]/5 max-h-40 overflow-y-auto custom-scrollbar">
                      {selectedLocationDetails?.channels?.length > 0 ? (
                        selectedLocationDetails.channels
                          .filter((ch) =>
                            ch.name
                              .toLowerCase()
                              .includes(channelSearchQuery.toLowerCase())
                          )
                          .map((ch) => (
                            <div
                              key={ch.id}
                              className="p-3 flex items-center gap-3 group hover:bg-[#7f19e6]/5 transition-colors"
                            >
                              <div className="w-8 h-8 rounded bg-[#191121] border border-[#7f19e6]/20 flex items-center justify-center overflow-hidden">
                                <Tv size={14} className="text-[#7f19e6]" />
                              </div>
                              <span className="text-xs text-slate-300 font-bold uppercase tracking-tighter">
                                {ch.name}
                              </span>
                            </div>
                          ))
                      ) : (
                        <p className="p-4 text-[10px] text-slate-500 italic text-center">
                          No channels enabled for this location.
                        </p>
                      )}

                      {/* Show empty state if search yields no results */}
                      {selectedLocationDetails?.channels?.length > 0 &&
                        selectedLocationDetails.channels.filter((ch) =>
                          ch.name
                            .toLowerCase()
                            .includes(channelSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <p className="p-4 text-[10px] text-slate-500 italic text-center">
                            No channels match "{channelSearchQuery}"
                          </p>
                        )}
                    </div>
                  </div>

                  {/* --- PACKAGES SECTION --- */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest">
                        Enabled Packages
                      </h3>
                      <span className="px-2 py-0.5 bg-[#7f19e6]/20 text-[#7f19e6] text-[10px] font-black rounded-full">
                        {selectedLocationDetails?.packages?.length || 0}
                      </span>
                    </div>

                    {selectedLocationDetails?.packages?.length > 0 && (
                      <div className="relative">
                        <Search
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                          size={14}
                        />
                        <input
                          type="text"
                          placeholder="Search packages..."
                          value={packageSearchQuery}
                          onChange={(e) =>
                            setPackageSearchQuery(e.target.value)
                          }
                          className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all"
                        />
                      </div>
                    )}

                    <div className="bg-[#1f1629]/50 rounded-xl border border-[#7f19e6]/10 divide-y divide-[#7f19e6]/5 max-h-40 overflow-y-auto custom-scrollbar">
                      {selectedLocationDetails?.packages?.length > 0 ? (
                        selectedLocationDetails.packages
                          .filter((pkg) =>
                            pkg.name
                              .toLowerCase()
                              .includes(packageSearchQuery.toLowerCase())
                          )
                          .map((pkg) => (
                            <div
                              key={pkg.id}
                              className="p-3 flex items-center justify-between group hover:bg-[#7f19e6]/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Package size={14} className="text-[#7f19e6]" />
                                <span className="text-xs text-slate-300 font-bold uppercase tracking-tighter">
                                  {pkg.name}
                                </span>
                              </div>
                              <span className="text-[9px] font-black text-[#7f19e6] bg-[#7f19e6]/10 px-2 py-0.5 rounded border border-[#7f19e6]/20">
                                {pkg.type || "BASE"}
                              </span>
                            </div>
                          ))
                      ) : (
                        <p className="p-4 text-[10px] text-slate-500 italic text-center">
                          No packages linked to this location.
                        </p>
                      )}

                      {/* Show empty state if search yields no results */}
                      {selectedLocationDetails?.packages?.length > 0 &&
                        selectedLocationDetails.packages.filter((pkg) =>
                          pkg.name
                            .toLowerCase()
                            .includes(packageSearchQuery.toLowerCase())
                        ).length === 0 && (
                          <p className="p-4 text-[10px] text-slate-500 italic text-center">
                            No packages match "{packageSearchQuery}"
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                {locationMode !== "view" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#7f19e6] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#7f19e6]/30 transition-all hover:bg-[#8e29f7] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Syncing to Database..."
                      : locationMode === "edit"
                      ? "Update System Location"
                      : "Save System Location"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLocationSlideOverOpen(false)}
                    className="w-full py-4 bg-slate-800 text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-700"
                  >
                    Close Audit View
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {isLocationDeleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>

            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
              Remove Location?
            </h3>

            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You are deleting{" "}
              <span className="text-white font-bold">
                {locationToDelete?.name}
              </span>
              . All regional data for{" "}
              <span className="text-[#7f19e6] font-bold">
                {locationToDelete?.state_province}
              </span>{" "}
              will be unlinked.
              <span className="block mt-2 text-red-400 font-medium text-xs">
                DELETION WILL BE BLOCKED IF CHANNELS OR PACKAGES ARE ACTIVE.
              </span>
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setIsLocationDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                disabled={countdown > 0}
                onClick={handleLocationDelete}
                className={`flex-1 py-4 rounded-xl font-black text-xs uppercase shadow-lg ${
                  countdown > 0
                    ? "bg-red-950/20 text-red-900"
                    : "bg-red-600 text-white"
                }`}
              >
                {countdown > 0
                  ? `Wait ${countdown}s`
                  : isDeleting
                  ? "PLEASE WAIT..."
                  : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
      status === "active" || status === "Active"
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
    }`}
  >
    {status}
  </span>
);

export default LocationManagement;
