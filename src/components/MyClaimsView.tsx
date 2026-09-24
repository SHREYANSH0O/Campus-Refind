import React, { useState } from "react";
import {
  FileCheck2,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Building,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { ItemTicket, CampusUser } from "../types";

interface MyClaimsViewProps {
  tickets: ItemTicket[];
  currentUser: CampusUser;
  onSelectItem: (ticket: ItemTicket) => void;
  onOpenReport: () => void;
}

export const MyClaimsView: React.FC<MyClaimsViewProps> = ({
  tickets,
  currentUser,
  onSelectItem,
  onOpenReport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"my_claims" | "my_reports">("my_claims");

  // Items where currentUser has submitted a claim
  const myClaims = tickets
    .map((ticket) => {
      const claim = ticket.claims.find((c) => c.claimantId === currentUser.id);
      return claim ? { ticket, claim } : null;
    })
    .filter(Boolean) as { ticket: ItemTicket; claim: any }[];

  // Items reported by currentUser
  const myReports = tickets.filter((t) => t.reporterId === currentUser.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Claims & Raised Tickets
          </h1>
          <p className="text-xs text-slate-500">
            Track verification progress, review handover codes, and close completed tickets
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("my_claims")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === "my_claims"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Claims ({myClaims.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("my_reports")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === "my_reports"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Raised Tickets ({myReports.length})
          </button>
        </div>
      </div>

      {/* Sub-tab 1: My Claims */}
      {activeSubTab === "my_claims" && (
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Active Claims</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not submitted claims for any items. If you find a report matching your lost belonging, submit a claim with verification proof.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myClaims.map(({ ticket, claim }) => {
                const isApproved = claim.status === "approved";
                const isClosed = ticket.status === "returned_closed";

                return (
                  <div
                    key={claim.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={ticket.imageUrl}
                          alt={ticket.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              #{ticket.ticketNumber}
                            </span>
                            <span className="text-xs text-slate-400">
                              Claimed on {new Date(claim.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 truncate mt-0.5">
                            {ticket.title}
                          </h3>
                          <div className="text-xs text-slate-500 truncate">
                            Location: {ticket.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {isClosed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Returned & Closed</span>
                          </span>
                        ) : isApproved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Claim Approved!</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Verification</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectItem(ticket)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          View Ticket
                        </button>
                      </div>
                    </div>

                    {/* Proof detail snippet */}
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                      <strong className="text-slate-900">Your submitted proof:</strong>{" "}
                      {claim.proofDetails}
                    </div>

                    {/* Approved Action / Handover Info */}
                    {isApproved && !isClosed && (
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                            <KeyRound className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-emerald-900 text-sm">
                              Handover Code: {claim.handoverCode || "REFIND-VERIFIED"}
                            </div>
                            <div className="text-emerald-800">
                              Collect at <strong>Vivekanand Hall Central Desk</strong> with your Campus ID card.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectItem(ticket)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs self-start sm:self-center"
                        >
                          View Pickup Instructions
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: My Reports */}
      {activeSubTab === "my_reports" && (
        <div className="space-y-4">
          {myReports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <PackageCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Tickets Raised Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t logged any lost or found belongings yet. Report an item to make it visible to campus.
              </p>
              <button
                type="button"
                onClick={onOpenReport}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl transition"
              >
                Raise a Ticket Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myReports.map((ticket) => {
                const isClosed = ticket.status === "returned_closed";
                const pendingClaims = ticket.claims.filter((c) => c.status === "pending");

                return (
                  <div
                    key={ticket.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={ticket.imageUrl}
                          alt={ticket.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                ticket.type === "lost"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {ticket.type}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              #{ticket.ticketNumber}
                            </span>
                            <span className="text-xs text-slate-400">
                              Reported {ticket.date}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 truncate mt-1">
                            {ticket.title}
                          </h3>
                          <div className="text-xs text-slate-500 truncate">
                            {ticket.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {isClosed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Returned & Closed</span>
                          </span>
                        ) : pendingClaims.length > 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{pendingClaims.length} Claim(s) Awaiting Review</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Open for Claims
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectItem(ticket)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                        >
                          Manage Ticket
                        </button>
                      </div>
                    </div>

                    {/* Claims count & prompt to close */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Total claims received: {ticket.claims.length}</span>
                      {!isClosed && (
                        <button
                          type="button"
                          onClick={() => onSelectItem(ticket)}
                          className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>Review Claims / Confirm Return & Close</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
