import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  Package,
  Building,
  User,
  ExternalLink,
  Check,
  AlertTriangle,
  FileText,
  BadgeCheck,
  Shield,
  ArrowRight,
  Filter,
  RefreshCw,
} from "lucide-react";
import { ItemTicket, ClaimVerification, CampusUser } from "../types";

interface AdminDeskViewProps {
  tickets: ItemTicket[];
  currentUser: CampusUser;
  onApproveClaim: (ticketId: string, claimId: string) => void;
  onRejectClaim: (ticketId: string, claimId: string) => void;
  onCloseTicket: (ticketId: string, handoverNotes: string) => void;
  onSelectItem: (ticket: ItemTicket) => void;
  users?: CampusUser[];
  onUpdateUserRole?: (targetUserId: string, newRole: "Student" | "Campus Security") => void;
}

export const AdminDeskView: React.FC<AdminDeskViewProps> = ({
  tickets,
  currentUser,
  onApproveClaim,
  onRejectClaim,
  onCloseTicket,
  onSelectItem,
  users = [],
  onUpdateUserRole,
}) => {
  const [activeQueueTab, setActiveQueueTab] = useState<
    "pending_claims" | "awaiting_handover" | "desk_inventory" | "audit_log" | "user_management"
  >("pending_claims");

  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [handoverCodeInput, setHandoverCodeInput] = useState("");
  const [handoverNote, setHandoverNote] = useState("Physical student ID verified at Vivekanand Hall Central Desk. Item safely handed over.");
  const [handoverSuccessMsg, setHandoverSuccessMsg] = useState("");
  const [rejectingClaimId, setRejectingClaimId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isMasterAdmin = currentUser.email.toLowerCase() === "shreyanshsingh105@gmail.com";
  const isSecurityOfficer = currentUser.role === "Campus Security" || isMasterAdmin;

  // If user is not an authorized security officer or admin, block access completely
  if (!isSecurityOfficer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-sm">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted to Admin Desk</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The Vivekanand Hall Central Desk Portal is restricted exclusively to authorized Campus Security Officers and Portal Administrators (Shreyansh Singh).
          </p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 text-left space-y-1.5">
          <div className="font-bold text-slate-800">Your Current Credentials:</div>
          <div>• Name: <span className="font-semibold text-slate-900">{currentUser.name}</span></div>
          <div>• Role: <span className="font-semibold text-blue-600">{currentUser.role}</span></div>
          <div>• Institutional ID: <span className="font-mono text-slate-700">{currentUser.campusId}</span></div>
        </div>
      </div>
    );
  }

  // Filtered users for admin user management tab
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.campusId.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }, [users, userSearchQuery]);

  // Collect all claims across all tickets with ticket reference
  const allClaimsWithTicket = useMemo(() => {
    const list: { ticket: ItemTicket; claim: ClaimVerification }[] = [];
    tickets.forEach((ticket) => {
      ticket.claims.forEach((claim) => {
        list.push({ ticket, claim });
      });
    });
    return list;
  }, [tickets]);

  // Pending claims waiting for desk review
  const pendingClaims = useMemo(() => {
    return allClaimsWithTicket.filter(
      ({ ticket, claim }) => ticket.status !== "returned_closed" && claim.status === "pending"
    );
  }, [allClaimsWithTicket]);

  // Approved claims waiting for owner handover
  const awaitingHandoverClaims = useMemo(() => {
    return allClaimsWithTicket.filter(
      ({ ticket, claim }) => ticket.status !== "returned_closed" && claim.status === "approved"
    );
  }, [allClaimsWithTicket]);

  // Closed/reunited tickets audit log
  const closedTickets = useMemo(() => {
    return tickets.filter((t) => t.status === "returned_closed");
  }, [tickets]);

  // Items held at physical desk or found by security
  const physicalDeskInventory = useMemo(() => {
    return tickets.filter(
      (t) =>
        t.type === "found" &&
        (t.location.toLowerCase().includes("vivekanand") ||
          t.reporterRole === "Campus Security" ||
          t.status === "under_verification")
    );
  }, [tickets]);

  // Look up matching ticket for handover code scanner
  const codeLookupResult = useMemo(() => {
    const query = handoverCodeInput.trim().toUpperCase();
    if (!query || query.length < 3) return null;

    // Search by Handover code or ticketNumber or claimantId
    for (const ticket of tickets) {
      for (const claim of ticket.claims) {
        if (
          claim.handoverCode &&
          (claim.handoverCode.toUpperCase().includes(query) ||
            query.includes(claim.handoverCode.toUpperCase()))
        ) {
          return { ticket, claim };
        }
      }
      if (ticket.ticketNumber.toUpperCase() === query) {
        const approvedClaim = ticket.claims.find((c) => c.status === "approved");
        return { ticket, claim: approvedClaim || ticket.claims[0] };
      }
    }
    return null;
  }, [handoverCodeInput, tickets]);

  // Handle fast handover execution
  const executeHandover = (ticketId: string, notes: string) => {
    onCloseTicket(ticketId, notes);
    setHandoverSuccessMsg(`Verification complete! Ticket ${ticketId} safely marked handed over & closed.`);
    setHandoverCodeInput("");
    setTimeout(() => {
      setHandoverSuccessMsg("");
    }, 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Role Banner */}
      {!isSecurityOfficer && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-950">
              Viewing Desk in Member Audit Mode ({currentUser.role})
            </div>
            <div className="text-[11px] text-amber-800">
              Official custody claim approvals and physical item handovers are restricted to authorized Campus Security officers.
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Security &amp; Central Desk Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                Admin Console
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Firestore Cloud Live</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Location: <strong>Vivekanand Hall Central Desk</strong></span>
              <span>•</span>
              <span>
                Officer on Duty:{" "}
                <strong className="text-slate-900 uppercase">
                  {isMasterAdmin ? "Shreyansh Singh" : currentUser.name}
                </strong>{" "}
                ({isMasterAdmin ? "ADMIN-SEC-001" : currentUser.campusId})
              </span>
            </p>
          </div>
        </div>

        {/* Live Desk Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Review
            </div>
            <div className="text-lg font-black text-amber-600">
              {pendingClaims.length}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Awaiting Handover
            </div>
            <div className="text-lg font-black text-blue-600">
              {awaitingHandoverClaims.length}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Desk Inventory
            </div>
            <div className="text-lg font-black text-purple-600">
              {physicalDeskInventory.length}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Reunited &amp; Closed
            </div>
            <div className="text-lg font-black text-emerald-600">
              {closedTickets.length}
            </div>
          </div>
        </div>
      </div>

      {/* Handover Code Verification Tool (Core Desk Workflow) */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-3xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                Desk Handover Verification &amp; Ticket Closer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              When an owner arrives at Vivekanand Hall desk, enter their Handover Code or Ticket # to verify and officially close.
            </p>
          </div>
          {/* Quick test code buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">Try sample code:</span>
            <button
              type="button"
              onClick={() => setHandoverCodeInput("REFIND-8841")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-xs rounded-lg border border-slate-700 transition cursor-pointer"
            >
              REFIND-8841
            </button>
            <button
              type="button"
              onClick={() => setHandoverCodeInput("CRF-8402")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono text-xs rounded-lg border border-slate-700 transition cursor-pointer"
            >
              CRF-8402
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-handover-code-scan"
              value={handoverCodeInput}
              onChange={(e) => setHandoverCodeInput(e.target.value)}
              placeholder="Enter claimant's Handover Code (e.g., REFIND-8841) or Ticket #..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-white placeholder-slate-400 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {handoverCodeInput && (
              <button
                type="button"
                onClick={() => setHandoverCodeInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Verification Success Message */}
        {handoverSuccessMsg && (
          <div className="mt-4 p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{handoverSuccessMsg}</span>
          </div>
        )}

        {/* Matched Ticket Result Card */}
        {codeLookupResult && (
          <div className="mt-4 p-5 bg-slate-800/80 border border-blue-500/40 rounded-2xl animate-in fade-in duration-150">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/30 text-blue-300 border border-blue-400/40">
                    Match Found: {codeLookupResult.ticket.ticketNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Status: {codeLookupResult.ticket.status.replace("_", " ")}
                  </span>
                  {codeLookupResult.claim?.handoverCode && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Code: {codeLookupResult.claim.handoverCode}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">
                  {codeLookupResult.ticket.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Location Found:</strong> {codeLookupResult.ticket.location} ({codeLookupResult.ticket.specificArea || "N/A"})
                </p>

                {/* Secret identifier security check */}
                {codeLookupResult.ticket.secretIdentifiers && (
                  <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-amber-200">
                    <strong className="text-amber-400">Confidential Secret Identifier for Officer:</strong>{" "}
                    {codeLookupResult.ticket.secretIdentifiers}
                  </div>
                )}

                {/* Claimant Details */}
                {codeLookupResult.claim && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs space-y-1">
                    <div className="font-bold text-slate-200">
                      Claimant: {codeLookupResult.claim.claimantName} ({codeLookupResult.claim.claimantRole})
                    </div>
                    <div className="text-slate-400">
                      Email: {codeLookupResult.claim.claimantEmail} • Contact: {codeLookupResult.claim.contactNumber}
                    </div>
                    <div className="text-slate-300 pt-1">
                      <strong>Submitted Proof:</strong> {codeLookupResult.claim.proofDetails}
                    </div>
                  </div>
                )}
              </div>

              {/* Handover Action Box */}
              <div className="lg:w-80 shrink-0 bg-slate-900/90 p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>Officer Handover Sign-off</span>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Handover &amp; ID Verification Notes
                  </label>
                  <textarea
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    rows={2}
                    className="w-full mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {codeLookupResult.ticket.status === "returned_closed" ? (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-bold text-emerald-400">
                    ✓ This ticket is already closed &amp; reunited!
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-confirm-desk-handover"
                    onClick={() =>
                      executeHandover(codeLookupResult.ticket.id, handoverNote)
                    }
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Handover &amp; Close Ticket</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectItem(codeLookupResult.ticket)}
                  className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-white transition"
                >
                  Inspect Full Ticket Details →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desk Queue Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          type="button"
          id="tab-pending-claims"
          onClick={() => setActiveQueueTab("pending_claims")}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeQueueTab === "pending_claims"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Claims Review</span>
          {pendingClaims.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {pendingClaims.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-awaiting-handover"
          onClick={() => setActiveQueueTab("awaiting_handover")}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeQueueTab === "awaiting_handover"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Approved • Awaiting Handover</span>
          {awaitingHandoverClaims.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {awaitingHandoverClaims.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-desk-inventory"
          onClick={() => setActiveQueueTab("desk_inventory")}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeQueueTab === "desk_inventory"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Physical Desk Inventory</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {physicalDeskInventory.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-audit-log"
          onClick={() => setActiveQueueTab("audit_log")}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeQueueTab === "audit_log"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Handover &amp; Closure Audit Log</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            {closedTickets.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-user-management"
          onClick={() => setActiveQueueTab("user_management")}
          className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeQueueTab === "user_management"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Members &amp; Admin Access</span>
          {users.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {users.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PENDING CLAIMS REVIEW */}
      {activeQueueTab === "pending_claims" && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing {pendingClaims.length} claim(s) awaiting campus security ownership verification.
            </span>
          </div>

          {pendingClaims.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800">All Claims Cleared</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                There are currently no pending claims waiting for desk review. New claims submitted by students or faculty will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map(({ ticket, claim }) => (
                <div
                  key={claim.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {ticket.imageUrl ? (
                        <img
                          src={ticket.imageUrl}
                          alt={ticket.title}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                          {ticket.title[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {ticket.ticketNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                          <span className="text-xs text-slate-400">
                            {ticket.category} • Found at {ticket.location}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 mt-1">
                          {ticket.title}
                        </h3>

                        {/* Secret Identifiers badge */}
                        {ticket.secretIdentifiers && (
                          <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                            <span className="font-bold text-slate-900">
                              🔒 Reporter's Secret Identifier:
                            </span>{" "}
                            {ticket.secretIdentifiers}
                          </div>
                        )}

                        {/* Claimant Proof Box */}
                        <div className="mt-2.5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-950">
                              Claimant: {claim.claimantName} ({claim.claimantRole})
                            </span>
                            <span className="text-[11px] text-blue-600 font-medium">
                              Contact: {claim.contactNumber} • {claim.claimantEmail}
                            </span>
                          </div>
                          <p className="text-blue-900 pt-1">
                            <strong>Submitted Proof:</strong> {claim.proofDetails}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:w-64 shrink-0 flex flex-col gap-2 self-stretch sm:self-auto justify-center">
                      <button
                        type="button"
                        onClick={() => onApproveClaim(ticket.id, claim.id)}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve &amp; Issue Handover Code</span>
                      </button>

                      {rejectingClaimId === claim.id ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                          <input
                            type="text"
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onRejectClaim(ticket.id, claim.id);
                                setRejectingClaimId(null);
                                setRejectReason("");
                              }}
                              className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                            >
                              Confirm Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingClaimId(null)}
                              className="px-2 py-1.5 text-slate-500 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRejectingClaimId(claim.id)}
                          className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Claim</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectItem(ticket)}
                        className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Inspect Full Item Record
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AWAITING HANDOVER */}
      {activeQueueTab === "awaiting_handover" && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Approved claims awaiting physical collection at the Central Desk.
          </div>

          {awaitingHandoverClaims.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800">No Items Awaiting Collection</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Approved claims ready for physical handover will be listed here with their Handover Codes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awaitingHandoverClaims.map(({ ticket, claim }) => (
                <div
                  key={claim.id}
                  className="bg-white p-5 rounded-3xl border border-blue-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {ticket.ticketNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Code: {claim.handoverCode || "PENDING-CODE"}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Claimant: <strong>{claim.claimantName}</strong> ({claim.claimantRole})
                      </p>
                      <p className="text-xs text-slate-500">
                        Phone: {claim.contactNumber}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                      <strong>Approved Proof:</strong> {claim.proofDetails}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHandoverCodeInput(claim.handoverCode || ticket.ticketNumber);
                        window.scrollTo({ top: 180, behavior: "smooth" });
                      }}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Process Desk Handover</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectItem(ticket)}
                      className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                      title="Inspect ticket"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PHYSICAL DESK INVENTORY */}
      {activeQueueTab === "desk_inventory" && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Items registered at Vivekanand Hall Central Desk or held under security custody.
          </div>

          {physicalDeskInventory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800">No Items in Physical Desk Custody</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Found items deposited at Vivekanand Hall Central Desk or submitted by security officers will appear here for custody management.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {physicalDeskInventory.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {ticket.ticketNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>

                    {ticket.imageUrl && (
                      <img
                        src={ticket.imageUrl}
                        alt={ticket.title}
                        className="w-full h-32 rounded-2xl object-cover border border-slate-100 mb-2.5"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {ticket.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Location: {ticket.location}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Claims: {ticket.claims.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectItem(ticket)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      View Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOG & CLOSED TICKETS */}
      {activeQueueTab === "audit_log" && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Permanent log of resolved, officially verified, and handed-over property tickets.
          </div>

          {closedTickets.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-slate-800">No Closed Tickets Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Completed handovers will be recorded here with an immutable officer signature and handover notes.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Closed By Officer</th>
                      <th className="py-3 px-4">Handover Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {closedTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                          {ticket.ticketNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[200px] truncate">
                          {ticket.title}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {ticket.category}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{ticket.closedBy || "Security Officer"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-[300px] truncate">
                          {ticket.handoverNotes || "Verified and handed over to owner."}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectItem(ticket)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CAMPUS MEMBERS & ADMIN ACCESS */}
      {activeQueueTab === "user_management" && (
        <div className="space-y-4">
          {/* Sole Authority Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950 flex items-center gap-2">
                  <span>Administrative Authority Policy</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-200/80 text-blue-900 rounded-full">
                    Exclusive
                  </span>
                </div>
                <div className="text-[11px] text-blue-800 mt-0.5">
                  All new members register as standard Students. Security and Admin Desk privileges can <strong>only be designated or revoked by Shreyansh Singh</strong> (<code>shreyanshsingh105@gmail.com</code>).
                </div>
              </div>
            </div>
            {isMasterAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 self-start sm:self-auto">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>You are logged in as Master Admin</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0 self-start sm:self-auto">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Read-only: Managed by Shreyansh Singh</span>
              </span>
            )}
          </div>

          {/* User Search & Stats */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search registered members by name, email, or department..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredUsers.length} of {users.length} registered campus accounts
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Institutional Email</th>
                    <th className="py-3 px-4">Department / ID</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4 text-right">Admin Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No campus members match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelf = user.email.toLowerCase() === "shreyanshsingh105@gmail.com";
                      const isSec = user.role === "Campus Security";
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {user.avatarInitials || "CU"}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  Joined {user.joinedDate || "2026"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {user.email}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{user.department}</div>
                            <div className="text-[10px] font-mono text-slate-400">{user.campusId}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isSec ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Campus Security / Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <span>Student</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isSelf ? (
                              <span className="text-xs font-bold text-blue-600 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100 inline-block">
                                Master Admin
                              </span>
                            ) : isMasterAdmin && onUpdateUserRole ? (
                              isSec ? (
                                <button
                                  type="button"
                                  onClick={() => onUpdateUserRole(user.id, "Student")}
                                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs transition cursor-pointer"
                                >
                                  Revoke Admin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onUpdateUserRole(user.id, "Campus Security")}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-2xs"
                                >
                                  Grant Admin
                                </button>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Decided by Shreyansh
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
