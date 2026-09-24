import React from "react";
import {
  PackagePlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  MapPin,
  ArrowRight,
  HelpCircle,
  Building,
  ShieldCheck,
} from "lucide-react";
import { ItemTicket, CampusUser, isPortalAdminRole, displayRole } from "../types";

interface DashboardViewProps {
  tickets: ItemTicket[];
  currentUser: CampusUser;
  onOpenReport: (defaultType?: "lost" | "found") => void;
  onOpenBrowse: () => void;
  onSelectItem: (ticket: ItemTicket) => void;
  onOpenAdminDesk?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  currentUser,
  onOpenReport,
  onOpenBrowse,
  onSelectItem,
  onOpenAdminDesk,
}) => {
  const totalCount = tickets.length;
  const lostCount = tickets.filter((t) => t.type === "lost" && t.status !== "returned_closed").length;
  const foundCount = tickets.filter((t) => t.type === "found" && t.status !== "returned_closed").length;
  const returnedCount = tickets.filter((t) => t.status === "returned_closed").length;

  const isAdmin = isPortalAdminRole(currentUser.role);

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Campus Lost & Found Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Lost your belongings or found an item on campus? Report tickets with exact campus locations and verify rightful claims with authentic credentials.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              id="dashboard-report-lost-btn"
              onClick={() => onOpenReport("lost")}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold transition shadow-lg shadow-rose-900/30 flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>

            <button
              type="button"
              id="dashboard-report-found-btn"
              onClick={() => onOpenReport("found")}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Report Found Item</span>
            </button>

            {onOpenAdminDesk && isAdmin && (
              <button
                type="button"
                id="dashboard-admin-desk-btn"
                onClick={onOpenAdminDesk}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold transition shadow-lg shadow-blue-950/40 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-blue-200" />
                <span>Admin &amp; Support</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Registry</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Campus-wide logged tickets</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Currently Lost</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600">{lostCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Awaiting finder reports</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Found & In Custody</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-600">{foundCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Ready for claim verification</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Returned & Reunited</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">{returnedCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Tickets successfully closed</div>
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-sm text-white">
              Verified Return Protocol
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Found items can be claimed using private ownership proof (lockscreen wallpaper, serial #, or secret marks). The report creator verifies the claim, coordinates a safe campus handover, and closes the report after the item is returned.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenBrowse}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 shrink-0 hover:underline"
        >
          <span>Browse Reports</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Campus Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Campus Reports</h2>
            <p className="text-xs text-slate-500">
              Latest items lost or found across university facilities
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenBrowse}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-bold text-slate-900 text-sm">No Active Reports Yet</h3>
              <p className="text-xs text-slate-500">
                All pre-loaded sample items have been cleared. As campus students and faculty report lost or found items, they will appear live here.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenReport("lost")}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-2xs"
              >
                Report Lost Item
              </button>
              <button
                type="button"
                onClick={() => onOpenReport("found")}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-2xs"
              >
                Report Found Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentTickets.map((ticket) => {
              const isClosed = ticket.status === "returned_closed";
              return (
                <div
                  key={ticket.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect ${ticket.title}, ticket ${ticket.ticketNumber}`}
                  onClick={() => onSelectItem(ticket)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectItem(ticket);
                    }
                  }}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 p-4 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3.5">
                      <img
                        src={ticket.imageUrl}
                        alt={ticket.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            ticket.type === "lost"
                              ? "bg-rose-600 text-white shadow-xs"
                              : "bg-emerald-600 text-white shadow-xs"
                          }`}
                        >
                          {ticket.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                          {ticket.category}
                        </span>
                      </div>

                      {isClosed && (
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Returned & Closed</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title & Info */}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition truncate">
                      {ticket.title}
                    </h3>
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{ticket.location}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{ticket.date}</span>
                      <span>By {ticket.reporterName} ({displayRole(ticket.reporterRole)})</span>
                    </div>
                  </div>

                  {/* Footer Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500">
                      {(ticket.claimCount ?? ticket.claims.length) > 0 ? (
                        <span className="text-amber-600 font-semibold">
                          {(ticket.claimCount ?? ticket.claims.length)} claim{(ticket.claimCount ?? ticket.claims.length) > 1 ? "s" : ""} filed
                        </span>
                      ) : (
                        <span className="text-slate-400">No claims yet</span>
                      )}
                    </div>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-[11px]">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
