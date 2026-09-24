import React, { useState } from "react";
import {
  LayoutDashboard,
  Search,
  PackagePlus,
  FileCheck2,
  Bell,
  ChevronDown,
  Shield,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  LogOut,
  UserCheck,
  Database,
  LifeBuoy,
} from "lucide-react";
import { CampusUser, displayRole, isPortalAdminRole } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: CampusUser;
  unreadCount: number;
  adminAlertCount?: number;
  onOpenAssistant?: () => void;
  onOpenLoginModal: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  unreadCount,
  adminAlertCount = 0,
  onOpenAssistant,
  onOpenLoginModal,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = isPortalAdminRole(currentUser.role);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "browse", label: "Browse reports", icon: Search },
    ...(!isAdmin
      ? [
          { id: "report", label: "Report an item", icon: PackagePlus },
          { id: "claims", label: "My claims", icon: FileCheck2 },
          { id: "support", label: "Help & Support", icon: LifeBuoy },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: "admin_desk",
            label: "Admin & Support",
            icon: ShieldCheck,
            badge: adminAlertCount > 0 ? adminAlertCount : undefined,
            badgeColor: "bg-amber-500",
          },
        ]
      : []),
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 select-none transition-all duration-200 border-r border-slate-800/80">
      {/* Brand Header */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/70">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20 tracking-tight">
            R
          </div>
          <div>
            <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              <span>Campus</span>
              <span className="text-blue-400">ReFind</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Portal &amp; Registry
              </span>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Live</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`${
                      (item as any).badgeColor || "bg-rose-500"
                    } text-white text-xs font-semibold px-2 py-0.5 rounded-full`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Role Switcher */}
      <div className="p-4 border-t border-slate-800/80 relative">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={showUserMenu}
          onClick={() => setShowUserMenu(!showUserMenu)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setShowUserMenu(!showUserMenu);
            }
          }}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                {currentUser.role === "Student" && <GraduationCap className="w-3 h-3 text-emerald-400" />}
                {currentUser.role === "Faculty" && <Briefcase className="w-3 h-3 text-amber-400" />}
                {isPortalAdminRole(currentUser.role) && <Shield className="w-3 h-3 text-blue-400" />}
                <span>{displayRole(currentUser.role)}</span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* User Profile Popup */}
        {showUserMenu && (
          <div className="absolute bottom-20 left-4 right-4 bg-slate-800 border border-slate-700/80 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-1 py-1.5 border-b border-slate-700/70 mb-2">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
              <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                {displayRole(currentUser.role)} • {currentUser.campusId}
              </div>
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenLoginModal();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-700/60 rounded-xl transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>My Profile &amp; ID Details</span>
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-xl transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
