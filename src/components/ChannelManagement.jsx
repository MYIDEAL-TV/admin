import React, { useState, useEffect } from "react";
import {
  Tv,
  Plus,
  Search,
  Settings,
  AlertTriangle,
  MoreVertical,
  MapPin,
  MonitorPlay,
  RadioTower,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { secureFetch } from "../utils/api";
const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ChannelManagement = () => {
  // --- STATE MANAGEMENT ---
  const [channels, setChannels] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Derived state for filtered channels
  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (channel.description &&
        channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // UI Modals & Menus
  const [channelMode, setChannelMode] = useState("create");
  const [isChannelSlideOverOpen, setIsChannelSlideOverOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isChannelDeleteModalOpen, setIsChannelDeleteModalOpen] =
    useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Data
  const [channelFormData, setChannelFormData] = useState({
    id: "",
    name: "",
    description: "",
    monthly_cost: "0.00",
    stream_url: "",
    logo_url: "",
    status: "Active",
    flex_eligible: false,
    is_iptv: true,
    is_satellite: false,
    location_ids: [], // Array of region IDs
  });

  // --- LIFECYCLE & EFFECTS ---
  useEffect(() => {
    fetchLocations();
    fetchChannels();
  }, []);

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

  // --- API CALLS ---
  const fetchLocations = async () => {
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/locations`);
      const data = await response.json();
      if (data.success) setLocations(data.locations);
    } catch (error) {
      console.error("Failed to load locations");
    }
  };

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/channels`);
      const data = await response.json();
      if (data.success) setChannels(data.channels);
    } catch (error) {
      toast.error("Failed to load channels");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTION HANDLERS ---
  const openChannelCreate = () => {
    setChannelMode("create");
    setChannelFormData({
      id: "",
      name: "",
      description: "",
      monthly_cost: "0.00",
      stream_url: "",
      logo_url: "",
      status: "Active",
      flex_eligible: false,
      is_iptv: true,
      is_satellite: false,
      location_ids: [],
    });
    setIsChannelSlideOverOpen(true);
  };

  const openChannelEdit = (channel) => {
    setChannelMode("edit");
    setChannelFormData({
      ...channel,
      location_ids: channel.location_ids
        ? channel.location_ids.map((id) => Number(id))
        : [],
    });
    setIsChannelSlideOverOpen(true);
  };

  const openChannelDeleteModal = (channel) => {
    setChannelToDelete(channel);
    setIsChannelDeleteModalOpen(true);
    setCountdown(5);
  };

  const handleLocationToggle = (locId) => {
    setChannelFormData((prev) => ({
      ...prev,
      location_ids: prev.location_ids.includes(locId)
        ? prev.location_ids.filter((id) => id !== locId)
        : [...prev.location_ids, locId],
    }));
  };

  // --- SUBMIT HANDLERS ---
  const handleChannelSubmit = async (e) => {
    e.preventDefault();
    if (channelMode === "view") return;

    if (!channelFormData.is_iptv && !channelFormData.is_satellite) {
      return toast.error(
        "Channel must have at least one Service Type (IPTV or Satellite)."
      );
    }

    setIsSubmitting(true);
    try {
      const isEdit = channelMode === "edit";
      const url = isEdit
        ? `${VITE_API_URL}/api/admin/channels/${channelFormData.id}`
        : `${VITE_API_URL}/api/admin/channels`;

      const response = await secureFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channelFormData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEdit ? "Channel Updated" : "Channel Created");
        setIsChannelSlideOverOpen(false);
        fetchChannels();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChannelDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/channels/${channelToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (data.success) {
        setIsChannelDeleteModalOpen(false);
        fetchChannels();
        toast.success(`${channelToDelete.name} deleted`);
      } else {
        toast.error(data.error || "Deletion failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- RENDER HELPERS ---
  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        status === "Active"
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-red-500/10 text-red-400 border border-red-500/20"
      }`}
    >
      {status}
    </span>
  );

  const getLocationNames = (ids) => {
    if (!ids || ids.length === 0) return "No Regions Assigned";
    const names = ids
      .map((id) => locations.find((l) => l.id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Unknown Regions";
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#191121] p-6 rounded-2xl border border-[#7f19e6]/20 shadow-xl gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Tv className="text-[#7f19e6]" /> Channel Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage network streams, service types, and regional availability.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={openChannelCreate}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#7f19e6] hover:bg-[#8e29f7] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#7f19e6]/20 active:scale-95 w-full sm:w-auto shrink-0"
          >
            <Plus size={16} /> Add Channel
          </button>
        </div>
      </div>

      {/* 🚀 FIX: REPLACED CARDS WITH DATA TABLE */}
      <div className="bg-[#1f1629] rounded-xl border border-[#7f19e6]/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-[#7f19e6]/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-[#7f19e6]/10">
            <tr>
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Delivery Method</th>
              <th className="px-6 py-4">Regional Availability</th>
              <th className="px-6 py-4 text-center">Flex Pool</th>
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
                      Loading Channels...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredChannels.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-20 text-center">
                  <Tv className="mx-auto text-[#7f19e6]/40 mb-3" size={40} />
                  <p className="text-slate-400 text-sm font-bold">
                    {searchQuery
                      ? `No channels found matching "${searchQuery}"`
                      : "No channels configured. Add your first stream!"}
                  </p>
                </td>
              </tr>
            ) : (
              filteredChannels.map((channel) => (
                <tr
                  key={channel.id}
                  className="hover:bg-[#7f19e6]/5 transition-colors text-sm group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#1f1629] rounded-lg border border-[#7f19e6]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {channel.logo_url ? (
                          <img
                            src={channel.logo_url}
                            alt={channel.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Tv className="text-[#7f19e6]/40" size={20} />
                        )}
                      </div>
                      <div>
                        <div className="font-black text-white uppercase tracking-tight">
                          {channel.name}
                        </div>
                        {channel.description && (
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {channel.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {channel.is_iptv && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-500/20 px-2 py-1 rounded">
                          <MonitorPlay size={10} /> IPTV
                        </span>
                      )}
                      {channel.is_satellite && (
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-500/20 px-2 py-1 rounded">
                          <RadioTower size={10} /> Satellite
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <MapPin
                        size={14}
                        className="shrink-0 mt-0.5 text-[#7f19e6]"
                      />
                      <span className="break-words leading-snug max-w-[200px]">
                        {getLocationNames(channel.location_ids)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {channel.flex_eligible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#a755f7] bg-[#a755f7]/10 border border-[#a755f7]/20 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={10} /> Eligible
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(channel.status)}
                  </td>

                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(
                          activeDropdown === `ch-${channel.id}`
                            ? null
                            : `ch-${channel.id}`
                        );
                      }}
                      className="p-2 hover:bg-[#7f19e6]/10 rounded-lg text-slate-400 hover:text-[#7f19e6] transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeDropdown === `ch-${channel.id}` && (
                      <div className="absolute right-6 mt-2 w-36 bg-[#191121] border border-[#7f19e6]/20 rounded-xl shadow-2xl z-[110] py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={() => openChannelEdit(channel)}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                        >
                          <Settings size={14} /> Edit
                        </button>
                        <div className="h-px bg-[#7f19e6]/10 my-1" />
                        <button
                          onClick={() => openChannelDeleteModal(channel)}
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
        {filteredChannels.length > 0 && (
          <div className="px-6 py-4 border-t border-[#7f19e6]/10 bg-[#7f19e6]/5 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Showing {filteredChannels.length} total channels</span>
          </div>
        )}
      </div>

      {/* --- SLIDE OVER FORM --- */}
      {isChannelSlideOverOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsChannelSlideOverOpen(false)}
          />
          <div className="relative w-full max-w-2xl h-full bg-[#191121] shadow-2xl border-l border-[#7f19e6]/20 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-[#7f19e6]/10 bg-[#1f1629] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {channelMode === "create" ? "Add Channel" : "Edit Channel"}
                </h2>
              </div>
              <button
                onClick={() => setIsChannelSlideOverOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleChannelSubmit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Channel Name
                    </label>
                    <input
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      value={channelFormData.name}
                      onChange={(e) =>
                        setChannelFormData({
                          ...channelFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Broadcast Status
                    </label>
                    <select
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      value={channelFormData.status}
                      onChange={(e) =>
                        setChannelFormData({
                          ...channelFormData,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="Active">Active / Streaming</option>
                      <option value="Offline">Offline / Maintenance</option>
                    </select>
                  </div>

                  {/* --- Service Types --- */}
                  <div className="space-y-3 col-span-2 border-y border-[#7f19e6]/10 py-5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Service Availability
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 p-4 bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl cursor-pointer hover:border-[#7f19e6]/50 transition-colors flex-1">
                        <input
                          type="checkbox"
                          checked={channelFormData.is_iptv}
                          onChange={(e) =>
                            setChannelFormData({
                              ...channelFormData,
                              is_iptv: e.target.checked,
                            })
                          }
                          className="w-5 h-5 rounded border-[#7f19e6]/30 bg-[#191121] text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <MonitorPlay className="text-blue-500" size={18} />
                          <span className="text-sm font-bold text-white uppercase tracking-wider">
                            IPTV
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl cursor-pointer hover:border-[#7f19e6]/50 transition-colors flex-1">
                        <input
                          type="checkbox"
                          checked={channelFormData.is_satellite}
                          onChange={(e) =>
                            setChannelFormData({
                              ...channelFormData,
                              is_satellite: e.target.checked,
                            })
                          }
                          className="w-5 h-5 rounded border-[#7f19e6]/30 bg-[#191121] text-amber-500 focus:ring-amber-500"
                        />
                        <div className="flex items-center gap-2">
                          <RadioTower className="text-amber-500" size={18} />
                          <span className="text-sm font-bold text-white uppercase tracking-wider">
                            Satellite
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* --- Regional Availability Grid --- */}
                  <div className="space-y-3 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                      Regional Availability
                      <span className="text-[#7f19e6]">
                        {channelFormData.location_ids.length} Selected
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {locations.map((loc) => (
                        <label
                          key={loc.id}
                          className="flex items-center gap-3 p-3 bg-[#1f1629] border border-[#7f19e6]/20 hover:border-[#7f19e6]/50 rounded-lg cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={channelFormData.location_ids.includes(
                              Number(loc.id)
                            )}
                            onChange={() =>
                              handleLocationToggle(Number(loc.id))
                            }
                            className="w-4 h-4 rounded border-[#7f19e6]/30 bg-[#191121] text-[#7f19e6] focus:ring-[#7f19e6] focus:ring-offset-0"
                          />
                          <span className="text-xs font-bold text-slate-300">
                            {loc.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {channelFormData.location_ids.length === 0 && (
                      <p className="text-[10px] text-red-400 italic">
                        Warning: Channel will not appear in any regional
                        packages.
                      </p>
                    )}
                  </div>

                  {/* Flex Eligibility Toggle */}
                  <div className="space-y-2 col-span-2 bg-[#7f19e6]/5 border border-[#7f19e6]/20 rounded-xl p-4 flex flex-col justify-center mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest">
                        Flexible Pool Eligible
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channelFormData.flex_eligible}
                          onChange={(e) =>
                            setChannelFormData({
                              ...channelFormData,
                              flex_eligible: e.target.checked,
                            })
                          }
                          className="w-8 h-4 rounded-full bg-[#191121] border border-[#7f19e6]/30 appearance-none checked:bg-[#7f19e6] transition-colors relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-transform"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-2">
                      If enabled, subscribers can pick this channel to fulfill
                      their flexible package quota.
                    </p>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Stream URL / Endpoint
                    </label>
                    <input
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none font-mono text-xs"
                      placeholder="rtmp://stream.idealtv.com/live/..."
                      value={channelFormData.stream_url}
                      onChange={(e) =>
                        setChannelFormData({
                          ...channelFormData,
                          stream_url: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Logo URL
                    </label>
                    <input
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none text-xs"
                      placeholder="https://..."
                      value={channelFormData.logo_url}
                      onChange={(e) =>
                        setChannelFormData({
                          ...channelFormData,
                          logo_url: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="p-6 border-t border-[#7f19e6]/10 bg-[#1f1629] shrink-0 mt-auto">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#7f19e6] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#7f19e6]/30 hover:bg-[#8e29f7] disabled:opacity-50 transition-all"
                >
                  {isSubmitting
                    ? "Syncing..."
                    : channelMode === "edit"
                    ? "Update Channel"
                    : "Add Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {isChannelDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 shadow-inner">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
              Delete Stream?
            </h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You are about to permanently remove{" "}
              <span className="text-white font-bold italic">
                "{channelToDelete?.name}"
              </span>{" "}
              from the global directory.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsChannelDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                disabled={countdown > 0 || isDeleting}
                onClick={handleChannelDelete}
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
                  "Please wait..."
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

export default ChannelManagement;
