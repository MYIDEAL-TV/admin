import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Package,
  Settings,
  LogOut,
  Bell,
  Search,
  Monitor,
  Key,
  Image,
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#191121] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-[#1f1629] border-r border-[#7f19e6]/10">
        <div className="p-6">
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            Navigation
          </p>
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={location.pathname === "/admin/dashboard"}
            onClick={() => navigate("/admin/dashboard")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="System Users"
            active={location.pathname === "/admin/user-roles-management"}
            onClick={() => navigate("/admin/user-roles-management")}
          />
          <SidebarItem
            icon={<MapPin size={18} />}
            label="Locations"
            active={location.pathname === "/admin/locations"}
            onClick={() => navigate("/admin/locations")}
          />
          <SidebarItem
            icon={<MapPin size={18} />}
            label="Templates"
            active={location.pathname === "/admin/template-management"}
            onClick={() => navigate("/admin/template-management")}
          />
          <SidebarItem
            icon={<Package size={18} />}
            label="Packages"
            active={location.pathname === "/admin/package-management"}
            onClick={() => navigate("/admin/package-management")}
          />
          <SidebarItem
            icon={<Package size={18} />}
            label="Flex Requests"
            active={location.pathname === "/admin/flex-requests"}
            onClick={() => navigate("/admin/flex-requests")}
          />
          <SidebarItem
            icon={<Monitor size={18} />}
            label="Channel Availability"
            active={location.pathname === "/admin/channel-management"}
            onClick={() => navigate("/admin/channel-management")}
          />
          <SidebarItem
            icon={<Monitor size={18} />}
            label="Additional Items"
            active={location.pathname === "/admin/Additional-items-management"}
            onClick={() => navigate("/admin/Additional-items-management")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="Subscribers"
            active={location.pathname === "/admin/subscribers"}
            onClick={() => navigate("/admin/subscribers")}
          />
          <SidebarItem icon={<Image size={18} />} label="Channel Logos" />
          <SidebarItem icon={<Key size={18} />} label="API Keys" />
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#7f19e6]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#7f19e6] flex items-center justify-center text-white font-bold text-xs uppercase">
              {/* This 'V' is from your screenshot */}V
            </div>
            <span className="text-sm font-bold">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        {/* <header className="h-16 flex items-center justify-between px-8 border-b border-[#7f19e6]/10">
          <button className="text-slate-500 hover:text-white"><Search size={20}/></button>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-400 font-medium italic">Welcome back, Admin</span>
            <button className="text-slate-400 hover:text-white"><Bell size={20}/></button>
            <div className="w-8 h-8 rounded-full border border-slate-700 bg-slate-800"></div>
          </div>
        </header> */}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-semibold ${
      active
        ? "bg-[#7f19e6]/15 text-[#7f19e6] border border-[#7f19e6]/30 shadow-[0_0_15px_rgba(127,25,230,0.05)]"
        : "text-slate-400 hover:text-white hover:bg-white/5"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default AdminLayout;
