import React, { useMemo, useState } from "react";
import {
  LifeBuoy,
  LayoutList,
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  CampusUser,
  ItemTicket,
  SupportRequest,
  isPortalAdminRole,
  displayRole,
} from "../types";

interface AdminDeskViewProps {
  tickets: ItemTicket[];
  currentUser: CampusUser;
  users?: CampusUser[];
  supportRequests: SupportRequest[];
  onSelectItem: (ticket: ItemTicket) => void;
  onUpdateSupportRequest: (
    requestId: string,
    updates: Partial<Pick<SupportRequest, "status" | "adminReply">>
  ) => void;
  onUpdateUserRole?: (
    targetUserId: string,
    newRole: "Student" | "Portal Admin"
  ) => void;
}

export const AdminDeskView: React.FC<AdminDeskViewProps> = ({
  tickets,
  currentUser,
  users = [],
  supportRequests,
  onSelectItem,
  onUpdateSupportRequest,
  onUpdateUserRole,
}) => {
  const [activeTab, setActiveTab] = useState<"support" | "reports" | "users">("support");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const isMasterAdmin =
    currentUser.email.toLowerCase() === "shreyanshsingh105@gmail.com";
  const isAdmin = isPortalAdminRole(currentUser.role);

  const openCount = supportRequests.filter((request) => request.status === "open").length;
  const progressCount = supportRequests.filter(
    (request) => request.status === "in_progress"
  ).length;
  const resolvedCount = supportRequests.filter(
    (request) => request.status === "resolved"
  ).length;

  const filteredSupport = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return supportRequests;
    return supportRequests.filter((request) =>
      [
        request.userName,
        request.userEmail,
        request.subject,
        request.issueType,
        request.description,
      ].some((value) => value.toLowerCase().includes(q))
    );
  }, [supportRequests, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.name, user.email, user.department, user.campusId]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [users, searchQuery]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) =>
      [
        ticket.ticketNumber,
        ticket.title,
        ticket.category,
        ticket.location,
        ticket.reporterName,
        ticket.type,
        ticket.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [tickets, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">Admin access only</h2>
        <p className="mt-2 text-sm text-slate-500">
          This area is reserved for Portal Admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                Portal administration
              </div>
              <h1 className="text-2xl font-black mt-1">Admin &amp; Support</h1>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Manage portal concerns, registered accounts, and public report records.
                Item ownership verification and handover remain between the report creator
                and the claimant.
              </p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs">
            Signed in as <strong>{currentUser.name}</strong> · Portal Admin
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Open concerns</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{openCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">In progress</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{progressCount}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          {[
            { id: "support", label: "Support Inbox", icon: LifeBuoy },
            { id: "reports", label: "Report Registry", icon: LayoutList },
            { id: "users", label: "User Management", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "support"
                ? "Search support requests..."
                : activeTab === "reports"
                ? "Search reports..."
                : "Search users..."
            }
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {activeTab === "support" && (
        <div className="space-y-3">
          {filteredSupport.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">
              No support requests found.
            </div>
          ) : (
            filteredSupport.map((request) => (
              <div key={request.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wide text-blue-600">
                        {request.issueType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        request.status === "resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {request.status === "in_progress"
                          ? "In Progress"
                          : request.status === "resolved"
                          ? "Resolved"
                          : "Open"}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 mt-1">{request.subject}</h3>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {request.userName} · {request.userEmail} ·{" "}
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mt-3 whitespace-pre-line">
                      {request.description}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSupportRequest(request.id, { status: "in_progress" })
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold"
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSupportRequest(request.id, { status: "resolved" })
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"
                    >
                      Resolve
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-600">Reply to member</label>
                  <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
                    <textarea
                      rows={2}
                      value={replyDrafts[request.id] ?? request.adminReply ?? ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                      placeholder="Write an update or resolution..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs resize-none focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const reply = (replyDrafts[request.id] ?? request.adminReply ?? "").trim();
                        if (!reply) return;
                        onUpdateSupportRequest(request.id, { adminReply: reply });
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      Save Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 text-xs text-slate-500">
            Public registry oversight only. Claim proofs and private verification details are not exposed to Portal Admin.
          </div>
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.type === "found"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {ticket.type.toUpperCase()}
                    </span>
                    <span className="font-bold text-slate-900">{ticket.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {ticket.ticketNumber} · {ticket.location} · by {ticket.reporterName} ·{" "}
                    {ticket.claimCount ?? ticket.claims.length} claim(s)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectItem(ticket)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 w-fit"
                >
                  View Public Report
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Department / ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const admin = isPortalAdminRole(user.role);
                  const isSelf =
                    user.email.toLowerCase() === currentUser.email.toLowerCase();

                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3 font-bold text-slate-900">{user.name}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{user.department}</div>
                        <div className="text-[10px] font-mono text-slate-400">{user.campusId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full font-bold ${
                          admin
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {displayRole(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSelf ? (
                          <span className="text-[10px] text-slate-400">Current account</span>
                        ) : isMasterAdmin && onUpdateUserRole ? (
                          admin ? (
                            <button
                              type="button"
                              onClick={() => onUpdateUserRole(user.id, "Student")}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                            >
                              Revoke Admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUpdateUserRole(user.id, "Portal Admin")}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
                            >
                              Grant Admin
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">No permission</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
        {openCount + progressCount > 0 ? (
          <AlertCircle className="w-4 h-4 text-blue-600" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        )}
        Portal Admin handles platform operations and support; ownership decisions stay with the users involved in the item return.
      </div>
    </div>
  );
};
