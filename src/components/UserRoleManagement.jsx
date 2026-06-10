import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Tv,
  LayoutDashboard,
  Users,
  TvMinimalPlay,
  Package,
  Settings,
  LogOut,
  UserCircle,
  UserCog,
  Search,
  Bell,
  MoreVertical,
  Plus,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { secureFetch } from "@/utils/api";

const UserRoleManagement = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    rolesDefined: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role_id: "",
    full_name: "",
    has_admin_access: false, // 🚀 NEW: State for Admin Access Toggle
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const selectedRoleData = availableRoles.find(
    (r) => r.id === parseInt(formData.role_id)
  );

  const [allPermissions, setAllPermissions] = useState([]);
  const [isRoleSlideOverOpen, setIsRoleSlideOverOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [], // This will store the IDs of selected checkboxes
  });

  const [isRoleDeleteModalOpen, setIsRoleDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roleMode, setRoleMode] = useState("create");

  const openRoleView = (role) => {
    // Debugging: check what the role object actually contains
    console.log("Viewing Role:", role);

    setRoleFormData({
      id: role.id,
      name: role.name,
      description: role.description,
      // Ensure we are extracting the 'id' field from each permission object
      permissions: role.permissions
        ? role.permissions.map((p) => Number(p.id))
        : [],
    });
    setRoleMode("view");
    setIsRoleSlideOverOpen(true);
  };

  const openRoleEdit = (role) => {
    setRoleFormData({
      id: role.id,
      name: role.name,
      description: role.description,
      // Using Number() ensures types match even if the DB returns strings
      permissions: role.permissions
        ? role.permissions.map((p) => Number(p.id))
        : [],
    });
    setRoleMode("edit");
    setIsRoleSlideOverOpen(true);
  };

  const openRoleDeleteModal = (role) => {
    setRoleToDelete(role);
    setIsRoleDeleteModalOpen(true);
    setCountdown(5); // Shared countdown state with User delete
  };

  const handleRoleDelete = async () => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/roles/${roleToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();

      if (data.success) {
        setIsRoleDeleteModalOpen(false);
        fetchRoles();
        fetchStats();
        toast.success("System role deleted successfully");
      } else {
        toast.error(data.error || "Cannot delete role");
      }
    } catch (err) {
      toast.error("Failed to delete role.");
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/permission-matrix`
      );
      const data = await response.json();
      if (data.success) setAllPermissions(data.permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  // 3. This is what you map over in your <tbody>
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  // Helper for UI
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const navigate = useNavigate();
  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const openEditModal = async (user) => {
    setSelectedUser(user);

    // 🚀 FIX: We completely stripped out the old guessing logic.
    // We now trust exactly what the backend Master Directory tells us.

    // Pre-fill the form with current data
    setFormData({
      full_name: user.name,
      email: user.email, // Read-only in edit mode
      role_id: availableRoles.find((r) => r.name === user.role)?.id || "",
      status: user.status.toLowerCase(),
      has_admin_access: user.has_admin_access === true, // 🚀 Accurately sets the toggle!
    });

    setIsEditOpen(true);
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsEditOpen(false);
        setFormData({
          email: "",
          password: "",
          role_id: "",
          full_name: "",
          has_admin_access: false,
        });
        fetchUsers();
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setCountdown(5); // Start at 5 seconds
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const closeMenu = () => setActiveDropdown(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePermissionToggle = (pId) => {
    setRoleFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(pId)
        ? prev.permissions.filter((id) => id !== pId) // Remove if already there
        : [...prev.permissions, pId], // Add if not there
    }));
  };

  const handleSelectAll = () => {
    // Extract every ID from the master list fetched from the database
    const allIds = allPermissions.map((perm) => Number(perm.id));

    setRoleFormData((prev) => ({
      ...prev,
      permissions: allIds,
    }));

    toast.success(`Selected all ${allIds.length} system permissions`);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();

    if (roleFormData.permissions.length === 0) {
      toast.error("Please select at least one permission.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = roleMode === "edit";
      const url = isEdit
        ? `${VITE_API_URL}/api/admin/roles/${roleFormData.id}`
        : `${VITE_API_URL}/api/admin/roles`;

      const response = await secureFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleFormData.name,
          description: roleFormData.description,
          permissionIds: roleFormData.permissions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEdit ? "Role updated!" : "New role created!");
        setIsRoleSlideOverOpen(false);
        setRoleFormData({ name: "", description: "", permissions: [] });
        fetchRoles(); // Refresh the grid
        fetchStats();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("Server connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/users/${userToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsDeleteModalOpen(false);
        fetchUsers();
        fetchStats();
        // Show Success Toast
        toast.success(data.message || "User deleted successfully");
      } else {
        // Show Error Toast
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Connection error. Could not delete user.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchRoles();
    fetchAllPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await secureFetch(`${VITE_API_URL}/api/admin/roles`);
      const data = await response.json();
      if (data.success) setAvailableRoles(data.roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/admin-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await secureFetch(
        `${VITE_API_URL}/api/admin/system-users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await secureFetch(`${VITE_API_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setIsSlideOverOpen(false);
        setFormData({
          email: "",
          password: "",
          role_id: "",
          full_name: "",
          has_admin_access: false,
        });
        fetchUsers(); // Refresh the table
        fetchStats(); // Update the counts
        toast.success("Invitation email sent via Amazon SES!");
      } else {
        alert(data.error);
        toast.error(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#f7f6f8] dark:bg-[#191121] text-slate-900 dark:text-slate-100 font-sans">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-[#191121] border-b border-slate-200 dark:border-[#7f19e6]/20">
            <div className="flex items-center gap-4">
              <UserCog className="text-[#7f19e6]" size={22} />
              <h2 className="text-lg font-bold tracking-tight">
                User & Role Management
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-[#7f19e6]/10 border-none focus:ring-2 focus:ring-[#7f19e6] text-sm"
                  placeholder="Search users, emails or roles..."
                  type="text"
                  value={searchQuery}
                  onChange={
                    (e) => setSearchQuery(e.target.value)
                    // setCurrentPage(1);
                  } // Reset to first page on new search
                />
              </div>
              <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#7f19e6]/10 text-slate-600 dark:text-slate-300">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#7f19e6] rounded-full border-2 border-white dark:border-[#191121]"></span>
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-[#7f19e6]/20 overflow-hidden border border-[#7f19e6]/20">
                <img
                  className="w-full h-full object-cover"
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                  alt="Admin"
                />
              </div>
            </div>
          </header>

          {/* Tabs Navigation */}
          <div className="px-8 pt-6 bg-white dark:bg-[#191121]">
            <div className="flex gap-8 border-b border-slate-200 dark:border-[#7f19e6]/10">
              <button
                onClick={() => setActiveTab("users")}
                className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === "users"
                    ? "border-[#7f19e6] text-[#7f19e6]"
                    : "border-transparent text-slate-500 hover:text-[#7f19e6]"
                }`}
              >
                <Users size={16} /> Users
              </button>
              <button
                onClick={() => setActiveTab("roles")}
                className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === "roles"
                    ? "border-[#7f19e6] text-[#7f19e6]"
                    : "border-transparent text-slate-500 hover:text-[#7f19e6]"
                }`}
              >
                <ShieldCheck size={16} /> Roles
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-background-dark">
            {activeTab === "users" ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#191121]"> */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight">
                      System Users
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Manage team members and account permissions.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSlideOverOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#7f19e6] hover:bg-[#7f19e6]/90 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-[#7f19e6]/20"
                  >
                    <Plus size={18} /> Add New User
                  </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-[#1f1629] rounded-xl border border-slate-200 dark:border-[#7f19e6]/10 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#7f19e6]/5">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#7f19e6]/60 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#7f19e6]/60 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#7f19e6]/60 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#7f19e6]/60 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#7f19e6]/60 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-10 text-center text-slate-500"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              Loading users...
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        // Show "No users" but keep the height consistent
                        <>
                          <tr className="h-[72px]">
                            <td
                              colSpan="5"
                              className="py-10 text-center text-slate-500 font-medium"
                            >
                              No users found matching "{searchQuery}"
                            </td>
                          </tr>
                          {/* Fill the other 4 slots with empty rows */}
                          {Array.from({ length: 4 }).map((_, i) => (
                            <tr
                              key={`empty-no-results-${i}`}
                              className="h-[72px] border-none"
                            >
                              <td colSpan="5">&nbsp;</td>
                            </tr>
                          ))}
                        </>
                      ) : (
                        <>
                          {/* Render actual users */}
                          {currentUsers.map((user) => (
                            <tr
                              key={user.id}
                              className="h-[72px] hover:bg-primary/5 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                    {user.initials}
                                  </div>
                                  <span className="font-bold text-sm text-slate-200 capitalize">
                                    {user.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                                {user.email}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      user.status === "Active"
                                        ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                                        : user.status === "Pending"
                                        ? "bg-amber-500 animate-pulse"
                                        : "bg-slate-500"
                                    }`}
                                  ></span>
                                  <span
                                    className={`text-xs font-bold uppercase tracking-wider ${
                                      user.status === "Active"
                                        ? "text-emerald-400"
                                        : user.status === "Pending"
                                        ? "text-amber-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {user.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(
                                      activeDropdown === user.id
                                        ? null
                                        : user.id
                                    );
                                  }}
                                  className="p-1 hover:bg-primary/20 rounded text-slate-400 hover:text-primary transition-colors"
                                >
                                  <MoreVertical size={18} />
                                </button>
                                {activeDropdown === user.id && (
                                  <div className="absolute right-6 top-12 w-32 bg-[#1f1629] border border-[#7f19e6]/20 rounded-lg shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                                    <button
                                      onClick={() => openEditModal(user)}
                                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white flex items-center gap-2"
                                    >
                                      Edit User
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(user)}
                                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2"
                                    >
                                      Delete User
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* Placeholder rows to keep the table height constant (fill up to 5) */}
                          {currentUsers.length < usersPerPage &&
                            Array.from({
                              length: usersPerPage - currentUsers.length,
                            }).map((_, i) => (
                              <tr
                                key={`placeholder-${i}`}
                                className="h-[72px] border-none"
                              >
                                <td colSpan="5" className="px-6 py-4">
                                  &nbsp;
                                </td>
                              </tr>
                            ))}
                        </>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div className="px-6 py-4 flex items-center justify-between border-t border-primary/10">
                    <p className="text-xs text-slate-400">
                      Showing page{" "}
                      <span className="text-white font-bold">
                        {currentPage}
                      </span>{" "}
                      of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      {hasPrevPage && (
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="px-4 py-2 text-xs font-bold rounded border border-primary/20 text-slate-400 hover:bg-primary/10 transition-colors"
                        >
                          Previous
                        </button>
                      )}
                      {hasNextPage && (
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="px-4 py-2 text-xs font-bold rounded border border-primary/20 text-slate-400 hover:bg-primary/10 transition-colors"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <StatCard
                    icon={<UserPlus size={24} />}
                    label="Total Users"
                    value={stats.totalUsers}
                  />
                  <StatCard
                    icon={<ShieldCheck size={24} />}
                    label="Active Now"
                    value={stats.activeUsers}
                    color="emerald"
                  />
                  <StatCard
                    icon={<ShieldAlert size={24} />}
                    label="Roles Defined"
                    value={stats.rolesDefined}
                    color="amber"
                  />
                </div>
                {/* </div> */}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-white">
                      System Roles
                    </h3>
                    <p className="text-sm text-slate-400">
                      Define and manage access levels for your team.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // 1. Explicitly set the mode to create
                      setRoleMode("create");

                      // 2. Reset the form data so it doesn't show the previous role's info
                      setRoleFormData({
                        name: "",
                        description: "",
                        permissions: [],
                      });

                      // 3. Ensure permissions are loaded and open the slider
                      fetchAllPermissions();
                      setIsRoleSlideOverOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#7f19e6] hover:bg-[#7f19e6]/90 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-[#7f19e6]/20"
                  >
                    <Plus size={18} /> Create New Role
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableRoles.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-[#1f1629] rounded-xl border border-[#7f19e6]/10">
                      <ShieldAlert
                        size={48}
                        className="mx-auto text-slate-600 mb-4"
                      />
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                        No Roles Found in Database
                      </p>
                    </div>
                  ) : (
                    availableRoles.map((role) => (
                      <div
                        key={role.id}
                        className="bg-[#1f1629] p-6 rounded-xl border border-[#7f19e6]/20 hover:border-[#7f19e6]/50 transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-[#7f19e6]/10 rounded-lg text-[#7f19e6]">
                            <ShieldCheck size={24} />
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(
                                  activeDropdown === `role-${role.id}`
                                    ? null
                                    : `role-${role.id}`
                                );
                              }}
                              className="text-slate-500 hover:text-white transition-colors p-1"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdown === `role-${role.id}` && (
                              <div className="absolute right-0 mt-2 w-32 bg-[#191121] border border-[#7f19e6]/20 rounded-lg shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <button
                                  onClick={() => openRoleView(role)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white"
                                >
                                  View Role
                                </button>
                                <button
                                  onClick={() => openRoleEdit(role)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#7f19e6]/20 hover:text-white"
                                >
                                  Edit Role
                                </button>
                                <button
                                  onClick={() => openRoleDeleteModal(role)}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-500"
                                >
                                  Delete Role
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="text-lg font-bold text-white mb-1 capitalize">
                          {role.name}
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[32px]">
                          {role.description ||
                            "No description provided for this role."}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-[#7f19e6]/10">
                          <span className="text-xs font-bold text-[#7f19e6] uppercase tracking-tighter">
                            {role.permissions?.length || 0} Permissions
                          </span>
                          <span className="text-[10px] text-slate-400 italic">
                            System Role
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add New User Slide-over Overlay */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSlideOverOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md animate-in slide-in-from-right duration-300">
              <div className="h-full flex flex-col bg-[#1f1629] shadow-2xl border-l border-[#7f19e6]/20">
                <div className="p-6 border-b border-[#7f19e6]/10 flex items-center justify-between shrink-0">
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    Add New System User
                  </h2>
                  <button
                    onClick={() => setIsSlideOverOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={handleCreateUser}
                  className="flex-1 overflow-hidden flex flex-col min-h-0"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        required
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none transition-all"
                        type="text"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Email Address
                      </label>
                      <input
                        required
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                        type="email"
                        placeholder="user@idealtv.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Temp Password
                      </label>
                      <input
                        required
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#7f19e6]/10">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Assigned Role & Effective Rights
                      </label>

                      <select
                        required
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                        value={formData.role_id}
                        onChange={(e) => {
                          const newRoleId = e.target.value;
                          setFormData({
                            ...formData,
                            role_id: newRoleId,
                            // 🚀 SECURITY: Auto-disable admin access if they pick "Customer"
                            has_admin_access:
                              newRoleId === "8"
                                ? false
                                : formData.has_admin_access,
                          });
                        }}
                      >
                        <option value="">Select a system role</option>
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>

                      {/* 🚀 NEW: ADMIN PANEL ACCESS TOGGLE */}
                      {formData.role_id && formData.role_id !== "8" && (
                        <div className="flex items-center justify-between p-4 bg-[#7f19e6]/10 border border-[#7f19e6]/30 rounded-xl mt-4 animate-in fade-in zoom-in duration-300">
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">
                              Grant Admin Panel Access?
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                              If enabled, this user will receive a separate
                              email to log into this backend system.
                              <br />
                              All users automatically receive Sales Portal
                              access.
                            </p>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={formData.has_admin_access}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  has_admin_access: e.target.checked,
                                })
                              }
                            />
                            <div className="w-11 h-6 bg-[#1f1629] border border-[#7f19e6]/30 rounded-full peer peer-checked:bg-[#7f19e6] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                          </label>
                        </div>
                      )}

                      {formData.role_id === "8" && (
                        <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg mt-4 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Customers are strictly isolated to the Sales Portal.
                          </p>
                        </div>
                      )}

                      {/* Live Permission Preview Pane */}
                      {selectedRoleData && (
                        <div className="mt-4 p-4 bg-[#7f19e6]/5 rounded-xl border border-[#7f19e6]/20 animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck
                                size={14}
                                className="text-[#7f19e6]"
                              />
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                                Effective Rights: {selectedRoleData.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {selectedRoleData.permissions?.length || 0} Total
                            </span>
                          </div>

                          {/* Scrollable container for many permissions inside the pane */}
                          <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {selectedRoleData.permissions?.length > 0 ? (
                              <div className="grid grid-cols-1 gap-1.5">
                                {selectedRoleData.permissions.map((perm) => (
                                  <div
                                    key={perm.id}
                                    className="flex items-center gap-2 group"
                                  >
                                    <div className="w-1 h-1 bg-[#7f19e6]/40 group-hover:bg-[#7f19e6] rounded-full transition-colors" />
                                    <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                      {perm.desc ||
                                        perm.name.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-red-400 italic">
                                No permissions assigned.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 border-t border-[#7f19e6]/10 bg-[#1f1629] shrink-0 mt-auto">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#7f19e6] hover:bg-[#7f19e6]/90 text-white font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-[#7f19e6]/20"
                    >
                      {isSubmitting
                        ? "Creating User..."
                        : "Create User Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Permanent Deletion
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              This will remove{" "}
              <span className="text-white font-bold">
                {userToDelete?.email}
              </span>{" "}
              from the system forever. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button
                disabled={countdown > 0}
                onClick={handleDelete}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  countdown > 0
                    ? "bg-red-500/20 text-red-500/50 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                }`}
              >
                {countdown > 0 ? `Wait ${countdown}s` : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Slide-over Overlay */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md animate-in slide-in-from-right duration-300">
              <div className="h-full flex flex-col bg-[#1f1629] border-l border-[#7f19e6]/20">
                <div className="p-6 border-b border-[#7f19e6]/10 flex items-center justify-between shrink-0">
                  <h2 className="text-xl font-bold text-white uppercase">
                    Edit System User
                  </h2>
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={handleUpdateUser}
                  className="flex-1 overflow-hidden flex flex-col min-h-0"
                >
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Full Name
                      </label>
                      <input
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2 opacity-60 cursor-not-allowed">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Email (Permanent)
                      </label>
                      <input
                        disabled
                        className="w-full bg-[#191121] border border-white/5 rounded-lg p-3 text-slate-500"
                        value={formData.email}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Assigned Role
                      </label>
                      <select
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                        value={formData.role_id}
                        onChange={(e) => {
                          const newRoleId = e.target.value;
                          setFormData({
                            ...formData,
                            role_id: newRoleId,
                            // 🚀 SECURITY: Auto-disable admin access if they are demoted to Customer
                            has_admin_access:
                              newRoleId === "8"
                                ? false
                                : formData.has_admin_access,
                          });
                        }}
                      >
                        {availableRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 🚀 NEW: ADMIN PANEL ACCESS TOGGLE (EDIT MODE) */}
                    {formData.role_id && String(formData.role_id) !== "8" && (
                      <div className="flex items-center justify-between p-4 bg-[#7f19e6]/10 border border-[#7f19e6]/30 rounded-xl mt-4 animate-in fade-in zoom-in duration-300">
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">
                            Grant Admin Panel Access?
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                            If toggled OFF, this user's Admin Panel login will
                            be permanently deleted.
                            <br />
                            All users automatically retain Sales Portal access.
                          </p>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.has_admin_access}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                has_admin_access: e.target.checked,
                              })
                            }
                          />
                          <div className="w-11 h-6 bg-[#1f1629] border border-[#7f19e6]/30 rounded-full peer peer-checked:bg-[#7f19e6] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                      </div>
                    )}

                    {String(formData.role_id) === "8" && (
                      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg mt-4 text-center">
                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                          Warning: Saving this will permanently revoke Admin
                          Panel access.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 mt-4">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Account Status
                      </label>
                      <select
                        className="w-full bg-[#191121] border border-[#7f19e6]/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 border-t border-[#7f19e6]/10 bg-[#1f1629] shrink-0 mt-auto">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#7f19e6] text-white font-black uppercase rounded-lg shadow-lg"
                    >
                      {isSubmitting ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Slide-over Overlay */}
      {isRoleSlideOverOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setIsRoleSlideOverOpen(false)}
          />

          <div className="relative w-full max-w-4xl h-full bg-[#191121] shadow-2xl border-l border-[#7f19e6]/20 animate-in slide-in-from-right duration-300 flex flex-col">
            {/* Header */}
            <div className="p-8 border-b border-[#7f19e6]/10 bg-[#1f1629] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {roleMode === "view"
                    ? "View System Role"
                    : roleMode === "edit"
                    ? "Edit System Role"
                    : "Create New Role"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {roleMode === "view"
                    ? "Auditing assigned rights for this role."
                    : "Assign specific rights from the system's permission master list."}
                </p>
              </div>
              <button
                onClick={() => setIsRoleSlideOverOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleRoleSubmit}
              className="flex-1 overflow-hidden flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Role Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Role Name
                    </label>
                    <input
                      required
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      placeholder="e.g. Regional Manager"
                      value={roleFormData.name}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Description
                    </label>
                    <input
                      className="w-full bg-[#1f1629] border border-[#7f19e6]/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-[#7f19e6] outline-none"
                      placeholder="Describe the scope of this role..."
                      value={roleFormData.description}
                      onChange={(e) =>
                        setRoleFormData({
                          ...roleFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Permissions Selection */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-[#7f19e6]/10 pb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      {roleMode === "view"
                        ? "Assigned Permissions"
                        : "Available Permissions"}
                    </h3>
                    {roleMode !== "view" && (
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-[10px] font-bold text-[#7f19e6] uppercase"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRoleFormData({
                              ...roleFormData,
                              permissions: [],
                            })
                          }
                          className="text-[10px] font-bold text-slate-500 uppercase"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {allPermissions.length > 0 ? (
                      allPermissions.map((perm) => {
                        const isSelected = roleFormData.permissions.includes(
                          Number(perm.id)
                        );

                        // In View mode, we might only want to show what the user actually HAS
                        // Remove this if condition if you want to see all options (dimmed) in View mode
                        if (roleMode === "view" && !isSelected) return null;

                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                              roleMode === "view"
                                ? "cursor-default"
                                : "cursor-pointer"
                            } ${
                              isSelected
                                ? "bg-[#7f19e6]/10 border-[#7f19e6] shadow-[0_0_15px_rgba(127,25,230,0.1)]"
                                : "bg-[#1f1629] border-white/5 opacity-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={roleMode === "view"}
                              className="mt-1 w-4 h-4 rounded accent-[#7f19e6]"
                              checked={isSelected}
                              onChange={() => handlePermissionToggle(perm.id)}
                            />
                            <div>
                              <p className="text-xs font-bold text-white mb-1 uppercase tracking-tighter">
                                {perm.name.replace(/_/g, " ")}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                {perm.description}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="col-span-2 py-10 text-center text-slate-500 italic text-xs">
                        Loading permissions master list...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-[#7f19e6]/10 bg-[#1f1629] flex justify-end gap-4 shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsRoleSlideOverOpen(false)}
                  className="px-6 py-3 text-xs font-bold text-slate-400"
                >
                  {roleMode === "view" ? "Close" : "Cancel"}
                </button>

                {roleMode !== "view" && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-4 bg-[#7f19e6] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#7f19e6]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : roleMode === "edit"
                      ? "Update System Role"
                      : "Save System Role"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Delete Modal */}
      {isRoleDeleteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1f1629] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            {/* Visual Warning Header */}
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 shadow-inner">
              <AlertTriangle size={40} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
              Delete System Role?
            </h3>

            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              You are about to permanently remove the{" "}
              <span className="text-white font-bold italic">
                "{roleToDelete?.name}"
              </span>{" "}
              role. This will revoke all associated permissions from the
              system's architecture.
              <span className="block mt-2 text-red-400/80 font-medium text-xs uppercase">
                This action is irreversible.
              </span>
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsRoleDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                Abort Mission
              </button>

              <button
                type="button"
                disabled={countdown > 0}
                onClick={handleRoleDelete}
                className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                  countdown > 0
                    ? "bg-red-950/20 text-red-900 border border-red-900/20 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20"
                }`}
              >
                {countdown > 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    Wait {countdown}s
                  </span>
                ) : (
                  "Confirm Deletion"
                )}
              </button>
            </div>

            {/* Progress Bar for the countdown */}
            {countdown > 0 && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-1000"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <a
    href="#"
    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      active
        ? "bg-[#7f19e6] text-white shadow-lg shadow-[#7f19e6]/20"
        : "text-slate-600 dark:text-slate-400 hover:bg-[#7f19e6]/10"
    }`}
  >
    {icon}
    <span className="text-sm font-semibold">{label}</span>
  </a>
);

const StatCard = ({ icon, label, value, color = "primary" }) => {
  const colorMap = {
    primary: "bg-[#7f19e6]/10 text-[#7f19e6]",
    emerald: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-100 dark:bg-amber-500/10 text-amber-500",
  };

  return (
    <div className="bg-white dark:bg-[#1f1629] p-5 rounded-xl border border-slate-200 dark:border-[#7f19e6]/10 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-[#7f19e6]/60 uppercase">
          {label}
        </p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
};

export default UserRoleManagement;
