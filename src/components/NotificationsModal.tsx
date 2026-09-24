import React from "react";
import { X, Bell, Check, ExternalLink, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { CampusNotification } from "../types";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CampusNotification[];
  onMarkAllRead: () => void;
  onSelectTicketById: (ticketId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectTicketById,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-labelledby="notifications-title" className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 id="notifications-title" className="font-bold text-slate-900 text-base">
                Campus Notifications
              </h3>
              <p className="text-xs text-slate-500">
                Account alerts and portal updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="font-bold text-slate-800 text-sm">No Notifications Yet</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  New account, support, and lost/found updates relevant to you will appear here.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition ${
                  n.read
                    ? "bg-slate-50/60 border-slate-200/80"
                    : "bg-blue-50/50 border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-2xs">
                      {n.type === "claim_received" && <ShieldCheck className="w-4 h-4 text-amber-500" />}
                      {n.type === "claim_approved" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {n.type === "ticket_closed" && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                      {n.type === "info" && <Clock className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{n.timestamp}</span>
                        {n.ticketId && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTicketById(n.ticketId!);
                              onClose();
                            }}
                            className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <span>Open ticket</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Campus ReFind Real-time Alerts</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
