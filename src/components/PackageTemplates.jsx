import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { secureFetch } from "@/utils/api";
import { toast } from "sonner";
import CreateTemplateModal from "./CreateTemplateModal";

const PackageTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [userTypes, setUserTypes] = useState([]); // 🚀 NEW: State for User Types
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Action State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 5;
  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const filtered = templates.filter((tmpl) =>
    tmpl.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const closeMenu = () => setActiveDropdown(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  // Countdown timer for safe delete
  useEffect(() => {
    let timer;
    if (countdown > 0)
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    fetchTemplates();
    fetchUserTypes(); // 🚀 NEW: Fetch user types on mount
  }, []);

  // 🚀 NEW: API Call to grab user types from DB
  const fetchUserTypes = async () => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/customer/user-types`
      );
      if (!response) return;
      const data = await response.json();
      if (data.success) setUserTypes(data.types || []);
    } catch (err) {
      console.error("Failed to load user types");
    }
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/package-templates-admin`
      );
      if (!response) return;
      const data = await response.json();
      if (data.success) setTemplates(data.templates);
    } catch (error) {
      toast.error("Server connection lost. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (tmpl) => {
    setTemplateToDelete(tmpl);
    setCountdown(5);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/package-templates/${templateToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsDeleteModalOpen(false);
        setTemplateToDelete(null);
        fetchTemplates();
      } else {
        toast.error(data.error);
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      toast.error("Network error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="p-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Package Blueprints ({filtered.length})
            </h3>
            <p className="text-sm text-slate-400">
              Manage strict channel limits and base pricing rules for packages.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#7f19e6] hover:bg-[#7f19e6]/90 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-[#7f19e6]/20 uppercase"
          >
            <Plus size={18} /> Add New Blueprint
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
                placeholder="Search blueprints..."
                className="w-full bg-[#191121] border border-[#7f19e6]/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-[#7f19e6]/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Blueprint Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-center">Strict Channel Limit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7f19e6]/10">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest"
                  >
                    Loading Blueprints...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-slate-500">
                    No blueprints found.
                  </td>
                </tr>
              ) : (
                currentItems.map((tmpl) => {
                  // 🚀 NEW: Dynamically map the ID to the real User Type Name
                  const mappedUserType =
                    userTypes.find(
                      (ut) => ut.id === tmpl.applicable_user_type_id
                    )?.name ||
                    tmpl.applicable_user_type ||
                    "Unassigned";

                  return (
                    <tr
                      key={tmpl.id}
                      className="h-[72px] hover:bg-[#7f19e6]/5 transition-colors text-sm"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{tmpl.name}</div>
                        {tmpl.description && (
                          <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">
                            {tmpl.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          {mappedUserType} • {tmpl.template_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1 bg-[#7f19e6]/20 text-[#7f19e6] rounded-full text-[10px] font-black tracking-widest border border-[#7f19e6]/30 mb-1">
                            {tmpl.total_channels} CHANNELS
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({tmpl.fixed_channels} Fixed + {tmpl.flex_channels}{" "}
                            Flex)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            tmpl.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          {tmpl.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(
                                activeDropdown === tmpl.id ? null : tmpl.id
                              );
                            }}
                            className="p-2 hover:bg-[#7f19e6]/10 rounded-lg text-slate-400 hover:text-[#7f19e6] transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeDropdown === tmpl.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-[#191121] border border-[#7f19e6]/20 rounded-xl shadow-2xl z-[110] py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <button
                                onClick={() => handleOpenEdit(tmpl)}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                              >
                                <Edit size={14} /> Edit Blueprint
                              </button>
                              <div className="h-px bg-[#7f19e6]/10 my-1" />
                              <button
                                onClick={() => handleOpenDelete(tmpl)}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2"
                              >
                                <AlertTriangle size={14} /> Delete Blueprint
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                className="p-2 rounded border border-[#7f19e6]/20 text-slate-400 hover:bg-[#7f19e6]/10 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2 rounded border border-[#7f19e6]/20 text-slate-400 hover:bg-[#7f19e6]/10 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchTemplates}
        editingTemplate={editingTemplate}
        userTypes={userTypes} // 🚀 NEW: Pass the fetched types into the Modal!
      />

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
              Delete Blueprint?
            </h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You are attempting to delete{" "}
              <span className="text-white font-bold">
                {templateToDelete?.name}
              </span>
              .
              <span className="block mt-2 text-red-400 font-medium text-xs">
                DELETION WILL BE BLOCKED IF PACKAGES ARE ACTIVELY USING THIS
                TEMPLATE.
              </span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={countdown > 0 || isDeleting}
                onClick={handleDelete}
                className={`flex-1 py-4 rounded-xl font-black text-xs uppercase shadow-lg transition-all ${
                  countdown > 0
                    ? "bg-red-950/20 text-red-900"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {countdown > 0
                  ? `Wait ${countdown}s`
                  : isDeleting
                  ? "DELETING..."
                  : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PackageTemplates;
