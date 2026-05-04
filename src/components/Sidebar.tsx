import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { LayoutDashboard, FolderKanban, LogOut, User } from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-white border-right border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">TeamManager</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <Link
          to="/"
          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <LayoutDashboard className="w-5 h-5 mr-3 text-gray-500" />
          Dashboard
        </Link>
        <Link
          to="/projects"
          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <FolderKanban className="w-5 h-5 mr-3 text-gray-500" />
          Projects
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
