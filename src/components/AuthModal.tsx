import React from "react";
import {
  X,
  GraduationCap,
  Briefcase,
  Shield,
  ShieldCheck,
  Mail,
  User,
  Building,
  KeyRound,
  LogOut,
  Calendar,
  Lock,
} from "lucide-react";
import { CampusUser, displayRole, isPortalAdminRole } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CampusUser;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-blue-500/20">
              R
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Campus ID &amp; Profile Details
              </h3>
              <p className="text-xs text-slate-500">
                Verified Campus Session
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close campus profile"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-white/20 text-white font-extrabold text-base flex items-center justify-center shadow-inner shrink-0">
                {currentUser.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-white truncate">
                    {currentUser.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  {currentUser.role === "Student" && <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />}
                  {currentUser.role === "Faculty" && <Briefcase className="w-3.5 h-3.5 text-amber-400" />}
                  {isPortalAdminRole(currentUser.role) && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="font-semibold">{displayRole(currentUser.role)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/70 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Campus ID</span>
                <span className="font-mono text-white text-xs">{currentUser.campusId}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Email</span>
                <span className="text-slate-200 text-xs truncate block" title={currentUser.email}>
                  {currentUser.email}
                </span>
              </div>
              <div className="col-span-2 pt-1">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Department</span>
                <span className="text-slate-200 text-xs">{currentUser.department || "Campus Administration"}</span>
              </div>
            </div>
          </div>

          {/* Privacy & Account Isolation Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-blue-900 block">
                Private Portal &amp; Session Isolation
              </span>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                This portal is strictly authenticated to your account. Your credentials and tickets are private to your session and will <strong>never</strong> appear in or be accessible from any other user&apos;s portal.
              </p>
            </div>
          </div>

          {/* Role Capabilities Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
              Authorized Privileges
            </span>
            {isPortalAdminRole(currentUser.role) ? (
              <p className="text-slate-600 text-xs leading-relaxed">
                You have <strong>Portal Admin privileges</strong>. You can manage support concerns, user roles, and public registry oversight. Claim verification and item handover remain between the users involved.
              </p>
            ) : (
              <p className="text-slate-600 text-xs leading-relaxed">
                You have <strong>Campus Member Privileges</strong>. You can file lost/found reports, track claims, verify ownership, and receive live return alerts.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {onLogout ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs flex items-center gap-2 transition active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Portal</span>
            </button>
          ) : (
            <div />
          )}

           <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
