import React, { useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Building,
  KeyRound,
} from "lucide-react";
import { ItemTicket, CampusUser, displayRole, isPortalAdminRole } from "../types";

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ItemTicket;
  currentUser: CampusUser;
  onOpenClaim: (ticket: ItemTicket) => void;
  onApproveClaim: (ticketId: string, claimId: string) => void;
  onRejectClaim: (ticketId: string, claimId: string, rejectReason: string) => void;
  onCloseTicket: (ticketId: string, handoverNotes: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  onOpenClaim,
  onApproveClaim,
  onRejectClaim,
  onCloseTicket,
}) => {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState(
    "Ownership proof verified and the item was safely handed over to the approved claimant."
  );

  if (!isOpen) return null;

  const isReporter = ticket.reporterId === currentUser.id;
  const isAdmin = isPortalAdminRole(currentUser.role);
  const canManageTicket = isReporter;

  const hasAlreadyClaimed = ticket.claims.some(
    (c) => c.claimantId === currentUser.id
  );

  const approvedClaim = ticket.claims.find((c) => c.status === "approved");
  const visibleClaims = canManageTicket
    ? ticket.claims
    : ticket.claims.filter((claim) => claim.claimantId === currentUser.id);

  const totalClaimCount = ticket.claimCount ?? ticket.claims.length;

  const getStatusBadge = () => {
    switch (ticket.status) {
      case "returned_closed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Returned & Successfully Closed</span>
          </span>
        );
      case "under_verification":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Under Verification ({totalClaimCount} Claims)</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Open for Claims</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-labelledby="item-detail-title" className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                ticket.type === "lost"
                  ? "bg-rose-100 text-rose-700 border border-rose-200"
                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              {ticket.type} Item
            </span>
            <span className="text-xs font-semibold text-slate-500">
              #{ticket.ticketNumber}
            </span>
            {getStatusBadge()}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Closed Banner */}
          {ticket.status === "returned_closed" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <div className="font-bold text-sm">Item Successfully Reunited!</div>
                <p>
                  This ticket was returned to its verified owner and officially closed by{" "}
                  <strong>{ticket.closedBy || "Report creator"}</strong> on{" "}
                  {ticket.closedAt ? new Date(ticket.closedAt).toLocaleDateString() : "recent date"}.
                </p>
                {ticket.handoverNotes && (
                  <div className="mt-1 text-emerald-800 italic bg-white/70 p-2 rounded-lg border border-emerald-100">
                    Handover Note: &ldquo;{ticket.handoverNotes}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Item Visual & Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left/Top: Image Preview */}
            <div className="md:col-span-1">
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                <img
                  src={ticket.imageUrl}
                  alt={ticket.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md">
                  {ticket.category}
                </div>
              </div>
            </div>

            {/* Right: Item Details */}
            <div className="md:col-span-2 space-y-3.5">
              <div>
                <h2 id="item-detail-title" className="text-xl font-bold text-slate-900 leading-snug">
                  {ticket.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Reported on {ticket.date}</span>
                  {ticket.time && <span>at {ticket.time}</span>}
                </div>
              </div>

              {/* Location Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{ticket.location}</span>
                </div>
                {ticket.specificArea && (
                  <div className="text-slate-500 pl-6">
                    Exact spot: {ticket.specificArea}
                  </div>
                )}
              </div>

              {/* Public Description */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </div>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {ticket.description}
                </p>
              </div>

              {/* Reporter Information */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {ticket.reporterName}
                    </div>
                    <div className="text-slate-500">{displayRole(ticket.reporterRole)}</div>
                  </div>
                </div>
                {ticket.reporterContact ? (
                  <div className="text-right text-slate-500">
                    <div>Contact: {ticket.reporterContact}</div>
                  </div>
                ) : (
                  <div className="text-right text-slate-400 max-w-[180px]">
                    Contact details remain private until they are needed for a verified handover.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secret Identifiers (shown only to the original reporter) */}
          {canManageTicket && ticket.secretIdentifiers && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Secret Verification Criteria (Private to Reporter)</span>
              </div>
              <p className="text-amber-800 leading-relaxed font-mono bg-white/80 p-2.5 rounded-xl border border-amber-100">
                {ticket.secretIdentifiers}
              </p>
              <div className="text-[11px] text-amber-700 pt-0.5">
                Compare these criteria with incoming claim submissions below to confirm ownership.
              </div>
            </div>
          )}

          {/* Claims List Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{canManageTicket ? `Submitted Claims (${totalClaimCount})` : visibleClaims.length > 0 ? "Your Submitted Claim" : "Claims are private"}</span>
              </h3>
              {ticket.status !== "returned_closed" && !isAdmin && !isReporter && !hasAlreadyClaimed && (
                <button
                  type="button"
                  id="claim-this-item-btn"
                  onClick={() => onOpenClaim(ticket)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Claim this Item
                </button>
              )}
            </div>

            {totalClaimCount === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No claims have been submitted yet. Campus members can submit ownership verification to initiate return.
              </div>
            ) : visibleClaims.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-1">
                <div className="font-semibold text-slate-700">
                  {totalClaimCount} claim{totalClaimCount === 1 ? "" : "s"} submitted
                </div>
                <div>
                  Claimant identities, contact details, and ownership proof are private. Only the claimant and the ticket reporter can review them.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className={`p-4 rounded-2xl border transition ${
                      claim.status === "approved"
                        ? "bg-emerald-50/60 border-emerald-300"
                        : claim.status === "rejected"
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {claim.claimantName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900">
                            {claim.claimantName} ({displayRole(claim.claimantRole)})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Submitted on {new Date(claim.submittedAt).toLocaleDateString()} • {claim.contactNumber}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {claim.status === "approved" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Approved Claim
                          </span>
                        )}
                        {claim.status === "rejected" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Rejected
                          </span>
                        )}
                        {claim.status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Claimant's Proof Details */}
                    <div className="text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Submitted Proof of Ownership:
                      </div>
                      <p className="text-slate-800 leading-relaxed">
                        {claim.proofDetails}
                      </p>
                    </div>

                    {/* Handover Code if approved */}
                    {claim.status === "approved" && (
                      <div className="mt-3 p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                          <KeyRound className="w-4 h-4 text-emerald-700" />
                          <span>Handover Code: <strong>{claim.handoverCode || "REFIND-VERIFIED"}</strong></span>
                        </div>
                        <span className="text-[11px] text-emerald-800">
                          Use this code at the agreed campus handover point
                        </span>
                      </div>
                    )}

                    {/* Verification Actions (only the original reporter can Approve / Reject) */}
                    {canManageTicket && claim.status === "pending" && ticket.status !== "returned_closed" && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const reason = window.prompt(
                              "Reason for declining this claim:",
                              "Ownership proof did not match the item's private verification details."
                            );
                            if (reason?.trim()) {
                              onRejectClaim(ticket.id, claim.id, reason.trim());
                            }
                          }}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-semibold rounded-lg transition"
                        >
                          Decline Claim
                        </button>
                        <button
                          type="button"
                          onClick={() => onApproveClaim(ticket.id, claim.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Claim & Authorize Handover</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-400" />
            <span>Direct verified handover • Reporter + approved claimant</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Close
            </button>

            {/* Confirm Return & Close Ticket Action */}
            {canManageTicket && approvedClaim && ticket.status !== "returned_closed" && (
              <button
                type="button"
                id="confirm-return-close-btn"
                onClick={() => setShowCloseDialog(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Handover & Close Report</span>
              </button>
            )}

            {!isAdmin && !isReporter && !hasAlreadyClaimed && ticket.status !== "returned_closed" && (
              <button
                type="button"
                onClick={() => onOpenClaim(ticket)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Claim this Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Close Confirmation Sub-Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Confirm Item Return & Close
                </h4>
                <p className="text-xs text-slate-500">
                  Finalize ticket #{ticket.ticketNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once confirmed, this item will be logged as safely reunited with its owner and marked as <strong>Returned & Successfully Closed</strong> in the campus registry.
            </p>

            <div>
              <label htmlFor="handover-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Handover Notes / Verification Summary
              </label>
              <textarea
                id="handover-notes"
                name="handover-notes"
                rows={3}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseDialog(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-finalize-close-ticket-btn"
                onClick={() => {
                  onCloseTicket(ticket.id, handoverNotes);
                  setShowCloseDialog(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Yes, Mark as Returned & Closed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
