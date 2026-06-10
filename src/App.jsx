import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import { Toaster } from "@/components/ui/sonner";
import UserRoleManagement from "./components/UserRoleManagement";
import Dashboard from "./components/Dashboard";
import AdminLayout from "./components/AdminLayout"; // Import the new layout
import VerifyAccount from "./components/VerifyAccount";
import LocationManagement from "./components/LocationManagement";
import PackageManagement from "./components/PackageManagement";
import ChannelManagement from "./components/ChannelManagement";
import Subscribers from "./components/Subscribers";
import PackageTemplates from "./components/PackageTemplates";
import AdditionalItems from "./components/AdditionalItem";
import FlexRequests from "./components/FlexRequests";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("admin_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/verify-account" element={<VerifyAccount />} />
        {/* Protected Nested Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* These render inside the AdminLayout's <Outlet /> */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="user-roles-management"
            element={<UserRoleManagement />}
          />
          <Route path="locations" element={<LocationManagement />} />
          <Route path="template-management" element={<PackageTemplates />} />
          <Route path="package-management" element={<PackageManagement />} />
          <Route path="channel-management" element={<ChannelManagement />} />
          <Route
            path="additional-items-management"
            element={<AdditionalItems />}
          />
          <Route path="subscribers" element={<Subscribers />} />
          <Route
            path="/admin/flex-requests"
            element={
              <ProtectedRoute requiredRole="admin">
                <FlexRequests />
              </ProtectedRoute>
            }
          />
          {/* Default to dashboard if someone just hits /admin */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Root Redirects */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* 404 Handler */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#191121] text-white">
    <h1 className="text-4xl font-bold">404</h1>
    <p className="text-slate-400 mt-2">Page not found in Admin Panel</p>
    <button
      onClick={() => (window.location.href = "/admin/login")}
      className="mt-4 text-[#7f19e6] underline"
    >
      Back to Login
    </button>
  </div>
);

export default App;
