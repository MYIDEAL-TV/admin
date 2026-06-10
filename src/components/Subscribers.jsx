import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  MapPin,
  Mail,
  Phone,
  Building,
  Calendar,
  Tv,
  AlertCircle,
  FileText,
  Server,
  Filter,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { secureFetch } from "../utils/api";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dossierSearchQuery, setDossierSearchQuery] = useState("");
  const [dossierStatusFilter, setDossierStatusFilter] = useState("all");

  // Slide-over State
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // --- NEW: Flex Unlock Code State ---
  const [generatedCodes, setGeneratedCodes] = useState({}); // Stores codes by subscription_id
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleGenerateUnlockCode = async (subscriptionId) => {
    setIsGeneratingCode(true);
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/subscriptions/flex-unlock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        }
      );
      const data = await response.json();

      if (data.success) {
        // Save the code to state so it displays inline next to the button
        setGeneratedCodes((prev) => ({ ...prev, [subscriptionId]: data.code }));
        toast.success(`Code generated: ${data.code}`);
      } else {
        toast.error("Failed to generate code.");
      }
    } catch (error) {
      toast.error("Network error while generating code.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // ALWAYS fetch all data from backend so we have the full picture
  useEffect(() => {
    fetchSubscribers();
  }, []); // Removed statusFilter from dependency array to only fetch once

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      // Force backend to give us everything so we can handle multi-status frontend filtering
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/subscribers?status=all`
      );
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      } else {
        toast.error("Failed to load subscribers");
      }
    } catch (error) {
      toast.error("Network error while fetching subscribers");
    } finally {
      setIsLoading(false);
    }
  };

  const openSubscriberDetails = (subscriber) => {
    setSelectedSubscriber(subscriber);
    setDossierSearchQuery(""); // Reset search on open
    setDossierStatusFilter("all"); // Reset status on open
    setIsSlideOverOpen(true);
  };

  // --- FORMATTING HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes("active"))
      return (
        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
          {status}
        </span>
      );
    if (s.includes("draft") || s.includes("pending"))
      return (
        <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
          {status}
        </span>
      );
    return (
      <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-red-500/20">
        {status}
      </span>
    );
  };

  const formatLocation = (loc) => {
    if (!loc) return "Unknown";
    if (loc === "saint-barthelemy") return "Saint-Barthélemy";
    if (loc === "saint-martin") return "Saint-Martin";
    if (loc === "other") return "Other / Not Specified";
    return loc;
  };

  // Main table badge for multiple contracts
  const getContractBadges = (subscriptions) => {
    if (!subscriptions || subscriptions.length === 0) {
      return (
        <span className="text-slate-500 bg-slate-500/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-slate-500/20">
          No Plans
        </span>
      );
    }
    const activeCount = subscriptions.filter(
      (s) => s.subscription_status === "active"
    ).length;
    const draftCount = subscriptions.filter(
      (s) => s.subscription_status === "draft"
    ).length;

    return (
      <div className="flex flex-wrap gap-2">
        {activeCount > 0 && (
          <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
            {activeCount} Active
          </span>
        )}
        {draftCount > 0 && (
          <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
            {draftCount} Drafts
          </span>
        )}
      </div>
    );
  };

  // --- FILTERING LOGIC ---
  const filteredSubscribers = subscribers.filter((sub) => {
    // 1. Text Search
    const searchStr = searchQuery.toLowerCase();
    const matchesSearch =
      `${sub.first_name} ${sub.last_name}`.toLowerCase().includes(searchStr) ||
      (sub.email && sub.email.toLowerCase().includes(searchStr)) ||
      (sub.company_name && sub.company_name.toLowerCase().includes(searchStr));

    // 2. Status Filter (Checking if the user HAS at least one of the selected status)
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = sub.subscriptions?.some(
        (s) => s.subscription_status === "active"
      );
    } else if (statusFilter === "draft") {
      matchesStatus = sub.subscriptions?.some(
        (s) => s.subscription_status === "draft"
      );
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#191121] p-6 rounded-2xl border border-[#7f19e6]/20 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Users className="text-[#7f19e6]" /> Subscriber CRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage customers, multi-property contracts, and quotas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Status Dropdown Filter */}
          <div className="relative w-full sm:w-48">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7f19e6]"
              size={16}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl py-3 pl-11 pr-8 text-white text-sm font-bold focus:ring-2 focus:ring-[#7f19e6] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="draft">Drafts Only</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#7f19e6]">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users or emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1f1629] border border-[#7f19e6]/30 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:ring-2 focus:ring-[#7f19e6] outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* DATA GRID */}
      <div className="bg-[#191121] border border-[#7f19e6]/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1f1629] border-b border-[#7f19e6]/20">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Customer
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Contact
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Active Plans
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Joined Date
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-[#7f19e6] animate-pulse font-black uppercase tracking-widest"
                  >
                    Loading CRM Data...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-slate-500 font-bold"
                  >
                    No subscribers found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr
                    key={sub.subscriber_id}
                    className="border-b border-[#7f19e6]/10 hover:bg-[#7f19e6]/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="font-bold text-white">
                        {sub.first_name} {sub.last_name}
                      </div>
                      {sub.company_name && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          <Building size={10} className="inline mr-1" />
                          {sub.company_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300 flex items-center gap-2">
                        <Mail size={12} className="text-[#7f19e6]" />{" "}
                        {sub.email}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <Phone size={12} /> {sub.cell_phone || "No phone"}
                      </div>
                    </td>
                    <td className="p-4">
                      {getContractBadges(sub.subscriptions)}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {formatDate(sub.joined_date)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openSubscriberDetails(sub)}
                        className="px-4 py-2 bg-[#1f1629] hover:bg-[#7f19e6] text-[#7f19e6] hover:text-white border border-[#7f19e6]/30 rounded-lg text-xs font-bold transition-all"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SLIDE OVER DOSSIER --- */}
      {isSlideOverOpen && selectedSubscriber && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsSlideOverOpen(false)}
          />
          <div className="relative w-full max-w-2xl h-full bg-[#191121] shadow-2xl border-l border-[#7f19e6]/20 animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-8 border-b border-[#7f19e6]/10 bg-[#1f1629] flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                  {selectedSubscriber.first_name} {selectedSubscriber.last_name}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  {getContractBadges(selectedSubscriber.subscriptions)}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> Joined{" "}
                    {formatDate(selectedSubscriber.joined_date)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSlideOverOpen(false)}
                className="text-slate-400 hover:text-white text-xl bg-[#191121] p-2 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar">
              {/* Contact Profile */}
              <section>
                <h3 className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={14} /> Client Profile
                </h3>
                <div className="bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <p className="text-sm font-bold text-white">
                      {selectedSubscriber.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Phone
                    </p>
                    <p className="text-sm font-bold text-white">
                      {selectedSubscriber.cell_phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Company / Entity
                    </p>
                    <p className="text-sm font-bold text-white">
                      {selectedSubscriber.company_name || "Individual"}
                    </p>
                  </div>
                </div>
              </section>
              {/* LOOP THROUGH ALL SUBSCRIPTIONS (Grouped) */}
              <section>
                <h3 className="text-[10px] font-black text-[#7f19e6] uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-[#7f19e6]/20 pb-2">
                  <Layers size={14} /> Contract Dossiers
                </h3>

                {/* NEW: Dossier Search & Filter Controls */}
                {selectedSubscriber.subscriptions &&
                  selectedSubscriber.subscriptions.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-[#1f1629] p-3 rounded-xl border border-[#7f19e6]/20">
                      <div className="relative flex-1">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f19e6]"
                          size={14}
                        />
                        <input
                          type="text"
                          placeholder="Search by nickname..."
                          value={dossierSearchQuery}
                          onChange={(e) =>
                            setDossierSearchQuery(e.target.value)
                          }
                          className="w-full bg-[#191121] border border-[#7f19e6]/30 rounded-lg py-2 pl-9 pr-3 text-white text-xs focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all"
                        />
                      </div>
                      <div className="relative w-full sm:w-40">
                        <Filter
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f19e6]"
                          size={14}
                        />
                        <select
                          value={dossierStatusFilter}
                          onChange={(e) =>
                            setDossierStatusFilter(e.target.value)
                          }
                          className="w-full bg-[#191121] border border-[#7f19e6]/30 rounded-lg py-2 pl-9 pr-8 text-white text-xs font-bold focus:ring-1 focus:ring-[#7f19e6] outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="all">All Contracts</option>
                          <option value="active">Active Only</option>
                          <option value="draft">Drafts Only</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#7f19e6]">
                          <svg
                            className="fill-current h-3 w-3"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="space-y-10">
                  {(() => {
                    // --- NEW: Filter Logic for the Slide-Over ---
                    const baseContracts =
                      selectedSubscriber.subscriptions || [];

                    const filteredContracts = baseContracts
                      .filter((contract) => {
                        const searchStr = dossierSearchQuery.toLowerCase();
                        const fallbackName =
                          contract.nickname &&
                          contract.nickname.trim() !== "" &&
                          contract.nickname !== "N/A"
                            ? contract.nickname
                            : "Unnamed Subscription";

                        const matchesSearch = fallbackName
                          .toLowerCase()
                          .includes(searchStr);

                        let matchesStatus = true;
                        if (dossierStatusFilter !== "all") {
                          matchesStatus =
                            contract.subscription_status ===
                            dossierStatusFilter;
                        }

                        return matchesSearch && matchesStatus;
                      })
                      .sort((a, b) => {
                        // 🚀 NEW: Sort contracts in Newest First fashion
                        const dateA = new Date(a.start_date || 0).getTime();
                        const dateB = new Date(b.start_date || 0).getTime();
                        return dateB - dateA;
                      });

                    // 1. Check if they have NO contracts at all
                    if (baseContracts.length === 0) {
                      return (
                        <div className="bg-[#1f1629] border border-slate-700 border-dashed rounded-xl p-8 text-center">
                          <AlertCircle
                            className="mx-auto text-slate-500 mb-2"
                            size={32}
                          />
                          <p className="text-sm text-slate-400 font-bold">
                            This subscriber currently has no active or drafted
                            contracts.
                          </p>
                        </div>
                      );
                    }

                    // 2. Check if they have contracts, but the filter hid them
                    if (filteredContracts.length === 0) {
                      return (
                        <div className="bg-[#1f1629] border border-[#7f19e6]/20 border-dashed rounded-xl p-8 text-center">
                          <AlertCircle
                            className="mx-auto text-[#7f19e6] mb-2"
                            size={32}
                          />
                          <p className="text-sm text-slate-400 font-bold">
                            No contracts found matching your search filters.
                          </p>
                        </div>
                      );
                    }

                    // 3. Render the filtered list
                    return (
                      <>
                        {/* Sub-Render Function to group active vs drafts (Using the Filtered Array) */}
                        {[
                          {
                            title: "Active Contracts",
                            data: filteredContracts.filter(
                              (s) => s.subscription_status === "active"
                            ),
                          },
                          {
                            title: "Drafts & Pending",
                            data: filteredContracts.filter(
                              (s) => s.subscription_status === "draft"
                            ),
                          },
                        ].map(
                          (group, gIdx) =>
                            group.data.length > 0 && (
                              <div key={gIdx} className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                  {group.title} ({group.data.length})
                                </h4>
                                {group.data.map((contract, index) => {
                                  // Check for nickname first, fallback to Unnamed Subscription
                                  const accName =
                                    contract.nickname &&
                                    contract.nickname.trim() !== "" &&
                                    contract.nickname !== "N/A"
                                      ? contract.nickname
                                      : "Unnamed Subscription";

                                  // --- PARSE ONE TRUE SNAPSHOT ---
                                  const snap = contract.contract_snapshot
                                    ? typeof contract.contract_snapshot ===
                                      "string"
                                      ? JSON.parse(contract.contract_snapshot)
                                      : contract.contract_snapshot
                                    : {};

                                  // --- 100% FIDELITY UPFRONT MATH ENGINE (BEFORE TAX - HT) ---
                                  let upfrontTotalHT = 0;
                                  let computedHardwareCostHT = 0;
                                  let computedInstallCostHT = 0;

                                  // 1. Calculate Decoders Upfront Cost directly from the Document Cart
                                  if (
                                    snap.selectedDecoders &&
                                    snap.selectedDecoders.length > 0
                                  ) {
                                    snap.selectedDecoders.forEach((d) => {
                                      const cost =
                                        (Number(d.upfrontPrice) || 0) *
                                        (Number(d.quantity) || 1);
                                      upfrontTotalHT += cost;
                                      computedHardwareCostHT += cost;
                                    });
                                  }

                                  // 2. Calculate Setup Fees (Install, Connection, Dish) dynamically
                                  if (
                                    snap.selectedFees &&
                                    snap.selectedFees.length > 0
                                  ) {
                                    snap.selectedFees.forEach((fee) => {
                                      const cost = Number(fee.price || 0);
                                      upfrontTotalHT += cost;
                                      computedInstallCostHT += cost;
                                    });
                                  }

                                  // 3. Add Custom Punctual Items
                                  if (snap.autrePoncCost) {
                                    upfrontTotalHT += Number(
                                      snap.autrePoncCost
                                    );
                                  }

                                  // --- 🚀 NEW: APPLY TAXES (TTC) ---
                                  // Safely determine the tax rate (e.g., 0.04 for 4% TGCA)
                                  const taxRate =
                                    snap.taxAmount !== undefined &&
                                    snap.taxAmount !== ""
                                      ? Number(snap.taxAmount)
                                      : contract.regional_location ===
                                        "saint-martin"
                                      ? 0.04
                                      : 0;

                                  // Calculate Upfront Tax Included
                                  const upfrontTotalTTC =
                                    upfrontTotalHT * (1 + taxRate);

                                  // --- 🚀 FIX: EXACT MONTHLY MATH ENGINE ---
                                  // Use the injected snapshot values for perfect accuracy, avoiding double-taxing
                                  let monthlyTotalHT = 0;
                                  let monthlyTotalTTC = 0;

                                  if (snap.Tot_HT && snap.Tot_Mensuel) {
                                    monthlyTotalHT = Number(snap.Tot_HT);
                                    monthlyTotalTTC = Number(snap.Tot_Mensuel);
                                  } else {
                                    // Fallback calculation for older contracts
                                    const planQty =
                                      Number(snap.planQuantity) || 1;
                                    const planPrice = Number(
                                      snap.selectedPlan?.price ||
                                        snap.planPrice ||
                                        0
                                    );
                                    monthlyTotalHT += planPrice * planQty;

                                    const addons =
                                      snap.addons ||
                                      snap.addonsWithPrices ||
                                      [];
                                    addons.forEach((a) => {
                                      const q =
                                        a.quantity !== undefined &&
                                        a.quantity !== null
                                          ? Number(a.quantity)
                                          : planQty;
                                      monthlyTotalHT +=
                                        (Number(a.price) || 0) * q;
                                    });

                                    const addlScreens =
                                      Number(snap.additionalScreens) || 0;
                                    const screenCost =
                                      Number(snap.additionalScreenUnitCost) ||
                                      (contract.regional_location ===
                                      "saint-barthelemy"
                                        ? 20
                                        : 10);
                                    monthlyTotalHT += addlScreens * screenCost;

                                    if (snap.selectedDecoders) {
                                      snap.selectedDecoders.forEach((d) => {
                                        monthlyTotalHT +=
                                          (Number(d.monthlyPrice) || 0) *
                                          (Number(d.quantity) || 1);
                                      });
                                    }
                                    if (snap.customItemPrice) {
                                      monthlyTotalHT += Number(
                                        snap.customItemPrice
                                      );
                                    }
                                    monthlyTotalTTC =
                                      monthlyTotalHT * (1 + taxRate);
                                  }

                                  // 🚀 FIX: Dynamic Currency Symbol
                                  const currencySym =
                                    (contract.currency ||
                                      snap.currency ||
                                      "EUR") === "USD"
                                      ? "$"
                                      : "€";
                                  return (
                                    <div
                                      key={contract.subscription_id || index}
                                      className="bg-[#1f1629] rounded-2xl border border-[#7f19e6]/30 overflow-hidden shadow-md"
                                    >
                                      {/* Contract Banner */}
                                      <div className="bg-[#7f19e6]/10 px-6 py-4 flex justify-between items-center border-b border-[#7f19e6]/20">
                                        <div>
                                          <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                            {accName}
                                          </h4>
                                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            <MapPin
                                              size={10}
                                              className="text-[#7f19e6]"
                                            />{" "}
                                            {formatLocation(
                                              contract.regional_location
                                            )}
                                          </p>
                                        </div>
                                        {getStatusBadge(
                                          contract.subscription_status
                                        )}
                                      </div>

                                      <div className="p-6 space-y-6">
                                        {/* Contract Details - Base Info */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                          <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                              Package Template
                                            </p>
                                            <p className="text-sm font-bold text-indigo-400">
                                              {contract.current_package_name ||
                                                "None"}
                                            </p>
                                          </div>

                                          {/* MONTHLY RECURRING (TAX INCLUDED) */}
                                          <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                              Monthly Billing
                                            </p>
                                            <div className="flex flex-col">
                                              <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-emerald-400">
                                                  {currencySym}
                                                  {monthlyTotalTTC.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                  {contract.currency ||
                                                    snap.currency ||
                                                    "EUR"}
                                                  /mo
                                                </span>
                                              </div>
                                              {taxRate > 0 ? (
                                                <span className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">
                                                  HT: {currencySym}
                                                  {monthlyTotalHT.toFixed(2)} (+
                                                  {(taxRate * 100).toFixed(0)}%
                                                  Tax)
                                                </span>
                                              ) : (
                                                <span className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">
                                                  HT: {currencySym}
                                                  {monthlyTotalHT.toFixed(
                                                    2
                                                  )}{" "}
                                                  (No Tax)
                                                </span>
                                              )}
                                              {snap.extraFlexCost > 0 && (
                                                <span className="text-[9px] text-emerald-500/70 font-bold tracking-wide uppercase mt-0.5">
                                                  Incl. {currencySym}
                                                  {snap.extraFlexCost} Extra
                                                  Flex
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* ONE-TIME UPFRONT (TAX INCLUDED) */}
                                          <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                              One-Time Upfront
                                            </p>
                                            <div className="flex flex-col">
                                              <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-blue-400">
                                                  {currencySym}
                                                  {upfrontTotalTTC.toFixed(2)}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                  {contract.currency ||
                                                    snap.currency ||
                                                    "EUR"}
                                                </span>
                                              </div>
                                              {taxRate > 0 && (
                                                <span className="text-[9px] text-slate-400 font-bold tracking-wide mt-0.5">
                                                  HT: {currencySym}
                                                  {upfrontTotalHT.toFixed(2)} (+
                                                  {(taxRate * 100).toFixed(0)}%
                                                  Tax)
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                              Contract Start
                                            </p>
                                            <p className="text-xs font-bold text-white">
                                              {formatDate(contract.start_date)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                              Contract End
                                            </p>
                                            <p className="text-xs font-bold text-white">
                                              {formatDate(contract.end_date)}
                                            </p>
                                          </div>
                                        </div>

                                        {/* --- EXACT SNAPSHOT --- */}
                                        {contract.contract_snapshot &&
                                          (() => {
                                            return (
                                              <div className="pt-4 border-t border-[#7f19e6]/20 bg-[#7f19e6]/5 p-4 rounded-xl">
                                                <h5 className="text-[10px] text-[#7f19e6] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                                  <FileText size={12} /> Exact
                                                  Document Snapshot
                                                </h5>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  {(snap.manager?.firstName ||
                                                    snap.financialManager
                                                      ?.firstName) && (
                                                    <div className="space-y-2">
                                                      {snap.manager
                                                        ?.firstName && (
                                                        <div>
                                                          <p className="text-[9px] text-slate-500 uppercase">
                                                            Site Manager
                                                          </p>
                                                          <p className="text-xs text-slate-300">
                                                            {
                                                              snap.manager
                                                                .firstName
                                                            }{" "}
                                                            {
                                                              snap.manager
                                                                .lastName
                                                            }
                                                          </p>
                                                        </div>
                                                      )}
                                                      {snap.financialManager
                                                        ?.firstName && (
                                                        <div>
                                                          <p className="text-[9px] text-slate-500 uppercase">
                                                            Financial Manager
                                                          </p>
                                                          <p className="text-xs text-slate-300">
                                                            {
                                                              snap
                                                                .financialManager
                                                                .firstName
                                                            }{" "}
                                                            {
                                                              snap
                                                                .financialManager
                                                                .lastName
                                                            }
                                                          </p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  {snap.delivery?.address && (
                                                    <div>
                                                      <p className="text-[9px] text-slate-500 uppercase mb-1">
                                                        Delivery Address
                                                      </p>
                                                      <p className="text-xs text-slate-300 leading-tight">
                                                        {snap.delivery.address}
                                                        <br />
                                                        {
                                                          snap.delivery.city
                                                        },{" "}
                                                        {
                                                          snap.delivery
                                                            .postalCode
                                                        }
                                                      </p>
                                                    </div>
                                                  )}

                                                  <div>
                                                    <p className="text-[9px] text-slate-500 uppercase mb-1">
                                                      Contract Flags & Custom
                                                      Items
                                                    </p>
                                                    <ul className="text-xs text-slate-300 space-y-1">
                                                      {snap.addSepaMandate && (
                                                        <li>
                                                          • SEPA Mandate
                                                          Attached
                                                        </li>
                                                      )}
                                                      {snap.addCcAuthorization && (
                                                        <li>
                                                          • CC Auth Attached
                                                        </li>
                                                      )}
                                                      {snap.customItemName && (
                                                        <li>
                                                          • Custom:{" "}
                                                          {snap.customItemName}{" "}
                                                          ($
                                                          {snap.customItemPrice}
                                                          )
                                                        </li>
                                                      )}
                                                      {snap.autrePoncText && (
                                                        <li>
                                                          • Divers:{" "}
                                                          {snap.autrePoncText}{" "}
                                                          (${snap.autrePoncCost}
                                                          )
                                                        </li>
                                                      )}
                                                    </ul>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}

                                        {/* Hardware (Before Tax Values Shown here for clarity) */}
                                        {snap.selectedDecoders &&
                                          snap.selectedDecoders.length > 0 && (
                                            <div className="pt-4 border-t border-slate-700/50">
                                              <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Server size={12} /> Hardware
                                              </h5>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                {snap.selectedDecoders.map(
                                                  (decoder, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="bg-black/20 rounded p-2 flex justify-between items-center"
                                                    >
                                                      <span className="text-xs font-bold text-slate-300">
                                                        {decoder.name}
                                                      </span>
                                                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                                                        x{decoder.quantity}
                                                      </span>
                                                    </div>
                                                  )
                                                )}
                                              </div>

                                              <div className="flex gap-4 text-[10px] text-slate-400">
                                                <span>
                                                  Fees/Install:{" "}
                                                  <strong className="text-white">
                                                    {currencySym}
                                                    {computedInstallCostHT.toFixed(
                                                      2
                                                    )}{" "}
                                                    (HT)
                                                  </strong>
                                                </span>
                                                <span>
                                                  Hardware:{" "}
                                                  <strong className="text-white">
                                                    {currencySym}
                                                    {computedHardwareCostHT.toFixed(
                                                      2
                                                    )}{" "}
                                                    (HT)
                                                  </strong>
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                        {/* Flex Channels */}
                                        <div className="pt-4 border-t border-slate-700/50">
                                          <div className="flex justify-between items-center mb-3">
                                            <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                              <Tv size={12} /> Flex Channels (
                                              {contract.selected_flex_channels
                                                ?.length || 0}
                                              )
                                            </h5>

                                            <div className="flex items-center gap-2">
                                              {generatedCodes[
                                                contract.subscription_id
                                              ] ? (
                                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                                                  <span className="text-[9px] text-emerald-500 font-bold uppercase">
                                                    Unlock Code:
                                                  </span>
                                                  <span className="text-sm font-black text-emerald-400 tracking-widest">
                                                    {
                                                      generatedCodes[
                                                        contract.subscription_id
                                                      ]
                                                    }
                                                  </span>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleGenerateUnlockCode(
                                                      contract.subscription_id
                                                    )
                                                  }
                                                  disabled={isGeneratingCode}
                                                  className="px-3 py-1 bg-[#1f1629] hover:bg-[#7f19e6] text-[#7f19e6] hover:text-white border border-[#7f19e6]/30 rounded text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                                >
                                                  Generate Unlock Code
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {contract.selected_flex_channels &&
                                          contract.selected_flex_channels
                                            .length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                              {contract.selected_flex_channels.map(
                                                (channel, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="bg-black/20 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded"
                                                  >
                                                    {channel.name}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-slate-500 italic">
                                              No flex channels selected.
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                        )}
                      </>
                    );
                  })()}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscribers;
