import React, { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { secureFetch } from "@/utils/api";
import { toast } from "sonner";

// 🚀 ACCEPT userTypes as a prop
const CreateTemplateModal = ({
  isOpen,
  onClose,
  onRefresh,
  editingTemplate,
  userTypes,
}) => {
  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    applicable_user_type_id: "", // 🚀 Strictly using the ID now
    total_channels: "",
    fixed_channels: "",
    template_type: "Base",
    status: "Active",
    description: "",
    is_public: true, // 🚀 Included for backend sync
  });

  // Populate form if editing an existing template
  useEffect(() => {
    if (editingTemplate && isOpen) {
      setFormData({
        name: editingTemplate.name || "",
        applicable_user_type_id: editingTemplate.applicable_user_type_id || "",
        total_channels: editingTemplate.total_channels || "",
        fixed_channels: editingTemplate.fixed_channels || "",
        template_type: editingTemplate.template_type || "Base",
        status: editingTemplate.status || "Active",
        description: editingTemplate.description || "",
        is_public: editingTemplate.is_public ?? true,
      });
    } else if (isOpen) {
      // Reset if creating new
      setFormData({
        name: "",
        applicable_user_type_id: "",
        total_channels: "",
        fixed_channels: "",
        template_type: "Base",
        status: "Active",
        description: "",
        is_public: true,
      });
    }
  }, [editingTemplate, isOpen]);

  // 🚀 FIX: Dynamic Math Evaluation
  const total = parseInt(formData.total_channels) || 0;
  // If Add-on, fixed MUST equal total. Otherwise, use what they typed.
  const fixed =
    formData.template_type === "Add-on"
      ? total
      : parseInt(formData.fixed_channels) || 0;
  const flex = Math.max(0, total - fixed);

  const isValidChannelMath =
    total > 0 && fixed >= 0 && fixed + flex === total && fixed <= total;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🚀 Extra safeguard to ensure they picked a user type
    if (!formData.applicable_user_type_id)
      return toast.error("Please select an Applicable User Type.");
    if (!isValidChannelMath)
      return toast.error("Invalid channel configuration");

    setIsSubmitting(true);

    try {
      const isEdit = !!editingTemplate;
      const url = isEdit
        ? `${VITE_API_URL}/api/admin/package-templates/${editingTemplate.id}`
        : `${VITE_API_URL}/api/admin/package-templates`;

      const response = await secureFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          applicable_user_type_id: formData.applicable_user_type_id,
          total_channels: total,
          fixed_channels: fixed, // 🚀 Will send the locked value for Add-ons
          flex_channels: flex, // 🚀 Will send 0 for Add-ons
          template_type: formData.template_type,
          status: formData.status,
          description: formData.description,
          is_public: formData.is_public,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          isEdit
            ? "Template Updated Successfully"
            : "Template Created Successfully"
        );
        onRefresh();
        onClose();
      } else {
        toast.error(data.error || "Failed to save template");
      }
    } catch (err) {
      toast.error("Network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#130b1e] border border-[#7f19e6]/20 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#7f19e6]/10 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Package Management
            </p>
            <h2 className="text-2xl font-bold text-white">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-[#1f1629] text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto custom-scrollbar space-y-6"
        >
          <div className="flex gap-3 bg-[#1f1629] border border-[#7f19e6]/20 p-4 rounded-lg">
            <Lightbulb className="text-yellow-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-slate-300 leading-relaxed">
              A template defines the{" "}
              <span className="font-bold text-white">
                channel structure only
              </span>
              . Price and region are set when creating the actual package using
              this template.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Template Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Hotel Standard"
                className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Target User Type
              </label>
              <select
                required
                className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none appearance-none"
                value={formData.applicable_user_type_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicable_user_type_id: e.target.value,
                  })
                }
              >
                <option value="" disabled>
                  -- Select a User Type --
                </option>
                {userTypes &&
                  userTypes.map((ut) => (
                    <option key={ut.id} value={ut.id}>
                      {ut.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Template Type
              </label>
              <select
                className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none appearance-none"
                value={formData.template_type}
                onChange={(e) => {
                  const type = e.target.value;
                  setFormData({
                    ...formData,
                    template_type: type,
                    // 🚀 FIX: Automatically match fixed to total if Add-on is selected
                    fixed_channels:
                      type === "Add-on"
                        ? formData.total_channels
                        : formData.fixed_channels,
                  });
                }}
              >
                <option value="Base">Base</option>
                <option value="Add-on">Add-on</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status
              </label>
              <select
                className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none appearance-none"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Channels
            </label>
            <input
              required
              type="number"
              min="1"
              placeholder="16"
              className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none"
              value={formData.total_channels}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({
                  ...formData,
                  total_channels: val,
                  // 🚀 FIX: Keep fixed locked to total if it's an Add-on
                  fixed_channels:
                    formData.template_type === "Add-on"
                      ? val
                      : formData.fixed_channels,
                });
              }}
            />
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fixed Channels
              </label>
              <input
                required
                type="number"
                min="0"
                max={total || 999}
                placeholder="10"
                disabled={formData.template_type === "Add-on"} // 🚀 FIX: Lock input
                className={`w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white outline-none transition-all ${
                  formData.template_type === "Add-on"
                    ? "opacity-50 cursor-not-allowed"
                    : "focus:ring-1 focus:ring-[#7f19e6]"
                }`}
                value={
                  formData.template_type === "Add-on"
                    ? formData.total_channels
                    : formData.fixed_channels
                }
                onChange={(e) =>
                  setFormData({ ...formData, fixed_channels: e.target.value })
                }
              />
              {/* 🚀 FIX: Explanatory Warning */}
              {formData.template_type === "Add-on" && (
                <p className="text-[10px] text-amber-500 italic leading-tight">
                  Add-ons contain Fixed Channels only. Flex selection is
                  disabled.
                </p>
              )}
            </div>
            <span className="text-slate-500 mt-5 font-bold">+</span>
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Flex Channels
              </label>
              <input
                disabled
                type="number"
                className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-[#a755f7] font-bold focus:outline-none opacity-80"
                value={total > 0 && formData.fixed_channels !== "" ? flex : ""}
              />
            </div>
          </div>

          {total > 0 && formData.fixed_channels !== "" && (
            <div
              className={`p-3 rounded-md flex justify-between items-center text-sm font-bold border ${
                isValidChannelMath
                  ? "bg-green-950/30 border-green-800/50 text-green-400"
                  : "bg-red-950/30 border-red-800/50 text-red-400"
              }`}
            >
              <span>
                {fixed} Fixed + {flex} Flex = {total} Total
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                  isValidChannelMath
                    ? "bg-green-900/50 text-green-300"
                    : "bg-red-900/50 text-red-300"
                }`}
              >
                {isValidChannelMath ? "VALID" : "INVALID"}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Description (optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Hotel room package — 10 fixed regional channels..."
              className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-1 focus:ring-[#7f19e6] outline-none resize-none"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isValidChannelMath}
            className="w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:bg-[#4c1d95] disabled:text-slate-400 text-white rounded-lg font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#8b5cf6]/20 mt-4"
          >
            {isSubmitting
              ? "Saving..."
              : editingTemplate
              ? "Update Template"
              : "Save Template"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
