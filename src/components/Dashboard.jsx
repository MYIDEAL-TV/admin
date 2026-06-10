import React, { useState, useEffect } from "react";
import {
  Users,
  MapPin,
  Package,
  DollarSign,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Tv,
} from "lucide-react";
import { secureFetch } from "@/utils/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLocations: 0,
    activePackages: 0,
    activeChannels: 0,
    totalRevenue: "0.00", // Will be calculated once we build the Subscribers/Billing module
  });

  const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await secureFetch(
          `${VITE_API_URL}/api/admin/admin-stats`,
        );
        const data = await response.json();

        if (data.success) {
          setStats({
            totalUsers: data.stats.totalUsers || 0,
            activeLocations: data.stats.activeLocations || 0,
            activePackages: data.stats.activePackages || 0,
            activeChannels: data.stats.activeChannels || 0,
            totalRevenue: data.stats.totalRevenue || "0.00",
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchStats();
  }, [VITE_API_URL]);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-background-dark animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Overview of your IdealTV service management platform
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="TOTAL USERS"
          value={stats.totalUsers}
          icon={<Users size={20} />}
          color="text-blue-500"
        />
        <MetricCard
          title="ACTIVE LOCATIONS"
          value={stats.activeLocations}
          icon={<MapPin size={20} />}
          color="text-emerald-500"
        />
        <MetricCard
          title="ACTIVE PACKAGES"
          value={stats.activePackages}
          icon={<Package size={20} />}
          color="text-[#7f19e6]"
        />
        <MetricCard
          title="ACTIVE CHANNELS"
          value={stats.activeChannels}
          icon={<Tv size={20} />}
          color="text-amber-500"
        />
      </div>

      {/* Revenue Highlight Card (Full Width) */}
      <div className="mb-8 bg-card-dark p-6 rounded-xl border border-primary/10 flex items-center justify-between shadow-lg">
        <div>
          <h4 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-1">
            Estimated Monthly Revenue
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-400">
              ${stats.totalRevenue}
            </span>
            <span className="text-sm font-bold text-slate-500 uppercase">
              /mo
            </span>
          </div>
        </div>
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
          <DollarSign size={32} />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card-dark rounded-xl border border-primary/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-primary/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-primary" size={20} />
            System Status
          </h3>
          <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View Logs <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="text-slate-600" size={32} />
          </div>
          <p className="text-slate-400 font-medium max-w-sm">
            All regional nodes are operating normally. Detailed subscriber
            analytics and activity monitoring coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color }) => (
  <div className="bg-card-dark p-6 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg group">
    <div className="flex justify-between items-start mb-4">
      <h4 className="text-xs font-bold text-slate-500 tracking-widest uppercase">
        {title}
      </h4>
      <div
        className={`${color} bg-white/5 p-2 rounded-lg group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-black text-white">{value}</span>
    </div>
  </div>
);

export default Dashboard;
