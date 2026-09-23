import React, { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Bell,
  PackagePlus,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Building,
  LogOut,
} from "lucide-react";
import { CampusUser, ItemTicket, CampusNotification, TicketType } from "./types";
import {
  CAMPUS_USERS,
  INITIAL_TICKETS,
  INITIAL_NOTIFICATIONS,
} from "./data/mockData";
import { Sidebar } from "./components/Sidebar";
import { AssistantModal } from "./components/AssistantModal";
import { DashboardView } from "./components/DashboardView";
import { BrowseReportsView } from "./components/BrowseReportsView";
import { MyClaimsView } from "./components/MyClaimsView";
import { ReportItemModal } from "./components/ReportItemModal";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { ClaimItemModal } from "./components/ClaimItemModal";
import { NotificationsModal } from "./components/NotificationsModal";
import { AuthModal } from "./components/AuthModal";
import { AuthPage } from "./components/AuthPage";
import { AdminDeskView } from "./components/AdminDeskView";
import {
  seedFirestoreIfEmpty,
  subscribeToTickets,
  saveTicketToFirestore,
  subscribeToUsers,
  saveUserToFirestore,
  subscribeToNotifications,
  saveNotificationToFirestore,
} from "./services/firebaseService";

const LEGACY_MOCK_TICKET_IDS = new Set([
  "ticket-101",
  "ticket-102",
  "ticket-103",
  "ticket-104",
  "ticket-105",
  "ticket-106",
  "ticket-107",
  "ticket-108",
  "ticket-109",
]);

const LEGACY_MOCK_NOTIF_IDS = new Set(["notif-1", "notif-2", "notif-3"]);
const LEGACY_MOCK_USER_IDS = new Set([
  "user-john-smith",
  "user-elena-rostova",
  "user-marcus-vance",
]);

export default function App() {
  // Cloud Firestore synced state with local fallback
  const [users, setUsers] = useState<CampusUser[]>(() => {
    const saved = localStorage.getItem("refind_users");
    if (!saved) return CAMPUS_USERS;
    try {
      const parsed: CampusUser[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (u) =>
            !LEGACY_MOCK_USER_IDS.has(u.id) &&
            u.email !== "john.smith@campus.edu" &&
            u.email !== "elena.rostova@campus.edu" &&
            u.email !== "marcus.vance@campus.edu"
        );
        const existingEmails = new Set(cleaned.map((u) => u.email.toLowerCase()));
        const missing = CAMPUS_USERS.filter((u) => !existingEmails.has(u.email.toLowerCase()));
        const result = [...cleaned, ...missing];
        localStorage.setItem("refind_users", JSON.stringify(result));
        return result;
      }
      return CAMPUS_USERS;
    } catch {
      return CAMPUS_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<CampusUser | null>(() => {
    // Only restore user if actively authenticated in an explicit session
    const saved = localStorage.getItem("refind_auth_session");
    if (!saved || saved === "null") return null;
    try {
      const parsed = JSON.parse(saved);
      if (
        !parsed ||
        !parsed.email ||
        LEGACY_MOCK_USER_IDS.has(parsed.id) ||
        parsed.email === "john.smith@campus.edu" ||
        parsed.email === "elena.rostova@campus.edu" ||
        parsed.email === "marcus.vance@campus.edu"
      ) {
        localStorage.removeItem("refind_auth_session");
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [tickets, setTickets] = useState<ItemTicket[]>(() => {
    const saved = localStorage.getItem("refind_tickets");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((t: ItemTicket) => !LEGACY_MOCK_TICKET_IDS.has(t.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<CampusNotification[]>(() => {
    const saved = localStorage.getItem("refind_notifications");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (n: CampusNotification) =>
            !LEGACY_MOCK_NOTIF_IDS.has(n.id) &&
            (!n.ticketId || !LEGACY_MOCK_TICKET_IDS.has(n.ticketId))
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  // Seed and subscribe to live Firestore collections
  useEffect(() => {
    seedFirestoreIfEmpty();

    const unsubTickets = subscribeToTickets((cloudTickets) => {
      // cloudTickets is already filtered to exclude legacy mock items
      setTickets(cloudTickets);
      localStorage.setItem("refind_tickets", JSON.stringify(cloudTickets));
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        localStorage.setItem("refind_users", JSON.stringify(cloudUsers));
      }
    });

    return () => {
      unsubTickets();
      unsubUsers();
    };
  }, []);

  // Subscribe to live notifications for current user
  useEffect(() => {
    if (!currentUser) return;
    const unsubNotifs = subscribeToNotifications(currentUser.id, (cloudNotifs) => {
      setNotifications(cloudNotifs);
      localStorage.setItem("refind_notifications", JSON.stringify(cloudNotifs));
    });
    return () => {
      unsubNotifs();
    };
  }, [currentUser?.id]);

  // Sync users and current user to localStorage
  useEffect(() => {
    localStorage.setItem("refind_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("refind_auth_session", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("refind_auth_session");
      localStorage.removeItem("refind_current_user");
    }
  }, [currentUser]);

  // UI state
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(true); // Open initially to showcase assistant matching user screenshot!
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportDefaultType, setReportDefaultType] = useState<TicketType>("lost");
  const [selectedTicket, setSelectedTicket] = useState<ItemTicket | null>(null);
  const [ticketToClaim, setTicketToClaim] = useState<ItemTicket | null>(null);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("refind_tickets", JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem("refind_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("refind_notifications", JSON.stringify(notifications));
  }, [notifications]);

    // ---------------------------------------------------------
  // Notification helpers
  // ---------------------------------------------------------

  const createNotification = (
    userId: string,
    title: string,
    message: string,
    type: CampusNotification["type"],
    ticketId?: string
  ) => {
    const notification: CampusNotification = {
      id: `notif-${crypto.randomUUID()}`,
      userId,
      title,
      message,
      timestamp: "Just now",
      read: false,
      type,
      ticketId,
    };

    saveNotificationToFirestore(notification);
  };

  const notifySecurity = (
    title: string,
    message: string,
    type: CampusNotification["type"],
    ticketId?: string
  ) => {
    users
      .filter((user) => user.role === "Campus Security")
      .forEach((securityUser) => {
        createNotification(
          securityUser.id,
          title,
          message,
          type,
          ticketId
        );
      });
  };

  // Handle Tab navigation
  const handleSelectTab = (tab: string) => {
    if (tab === "report") {
      setReportDefaultType("lost");
      setIsReportModalOpen(true);
      return;
    }
    if (tab === "notifications") {
      setIsNotificationsModalOpen(true);
      return;
    }
    if (tab === "admin_desk") {
      const isSecurityOfficer =
        currentUser?.role === "Campus Security" ||
        currentUser?.email?.toLowerCase() === "shreyanshsingh105@gmail.com";
      if (!isSecurityOfficer) {
        setCurrentTab("dashboard");
        setMobileMenuOpen(false);
        return;
      }
    }
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  // Open report modal with specific type
  const handleOpenReport = (type: TicketType = "lost") => {
    setReportDefaultType(type);
    setIsReportModalOpen(true);
  };

  // Add a newly raised ticket
  const handleAddTicket = (newTicketData: any) => {
    if (!currentUser) return;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newTicket: ItemTicket = {
      ...newTicketData,
      id: `ticket-${Date.now()}`,
      ticketNumber: `CRF-${randomSuffix}`,
      status: "open",
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reporterRole: currentUser.role,
      reporterContact: currentUser.email,
      createdAt: new Date().toISOString(),
      claims: [],
    };

    setTickets((prev) => [newTicket, ...prev]);
    saveTicketToFirestore(newTicket);

    // Add notification
        // 1. Reporter / Finder confirmation
    createNotification(
      currentUser.id,
      "Report submitted",
      `Your ${newTicket.type} item "${newTicket.title}" at ${newTicket.location} has been successfully reported.`,
      "report_submitted",
      newTicket.id
    );

    // 2. Campus Security notification
    notifySecurity(
      `New ${newTicket.type}-item report`,
      `${currentUser.name} reported a ${newTicket.type} item "${newTicket.title}" at ${newTicket.location}.`,
      "new_report",
      newTicket.id
    );
  };

  // Submit claim on a ticket
  const handleSubmitClaim = (
    ticketId: string,
    proofDetails: string,
    contactNumber: string
  ) => {
    if (!currentUser) return;
    const claimId = `claim-${Date.now()}`;
    const newClaim = {
      id: claimId,
      ticketId,
      claimantId: currentUser.id,
      claimantName: currentUser.name,
      claimantEmail: currentUser.email,
      claimantRole: currentUser.role,
      proofDetails,
      contactNumber,
      submittedAt: new Date().toISOString(),
      status: "pending" as const,
    };

    let updatedTicketForCloud: ItemTicket | null = null;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            status: "under_verification" as const,
            claims: [newClaim, ...t.claims],
          };
          updatedTicketForCloud = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTicketForCloud) {
      saveTicketToFirestore(updatedTicketForCloud);
    }

    // Update selected ticket if currently inspecting
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "under_verification",
              claims: [newClaim, ...prev.claims],
            }
          : null
      );
    }

    // Add alert for the claimant
        const reportedTicket = tickets.find(
      (ticket) => ticket.id === ticketId
    );

    if (reportedTicket) {
      // 1. Claimant notification
      createNotification(
        currentUser.id,
        "Claim submitted",
        `Your claim for "${reportedTicket.title}" has been submitted for verification.`,
        "claim_submitted",
        ticketId
      );

      // 2. Reporter / Finder notification
      if (reportedTicket.reporterId !== currentUser.id) {
        createNotification(
          reportedTicket.reporterId,
          "New claim received",
          `${currentUser.name} submitted an ownership claim for "${reportedTicket.title}".`,
          "claim_received",
          ticketId
        );
      }

      // 3. Campus Security notification
      notifySecurity(
        "New claim to review",
        `${currentUser.name} submitted a claim for "${reportedTicket.title}". Please review the ownership proof.`,
        "claim_received",
        ticketId
      );
    }
  };

  // Approve a claim
  const handleApproveClaim = (ticketId: string, claimId: string) => {
    if (!currentUser) return;
    const handoverCode = `REFIND-${Math.floor(1000 + Math.random() * 9000)}`;

    let updatedTicketForCloud: ItemTicket | null = null;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            claims: t.claims.map((c) =>
  c.id === claimId
    ? {
        ...c,
        status: "approved" as const,
        handoverCode,
      }
    : c
),
          };
          updatedTicketForCloud = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTicketForCloud) {
      saveTicketToFirestore(updatedTicketForCloud);
    }

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              claims: prev.claims.map((c) =>
                c.id === claimId
                  ? { ...c, status: "approved", handoverCode }
                  : { ...c, status: "rejected" }
              ),
            }
          : null
      );
    }

    // Create notification
        const approvedTicket = tickets.find(
      (ticket) => ticket.id === ticketId
    );

    const approvedClaim = approvedTicket?.claims.find(
      (claim) => claim.id === claimId
    );

    if (approvedTicket && approvedClaim) {
      createNotification(
        approvedClaim.claimantId,
        "Claim approved + handover code",
        `Your claim for "${approvedTicket.title}" has been approved. Your handover code is ${handoverCode}. Please bring your Campus ID to the Vivekanand Hall Central Lost & Found Desk.`,
        "claim_approved",
        ticketId
      );
    }
  };

  // Reject a claim
  const handleRejectClaim = (
  ticketId: string,
  claimId: string,
  rejectReason: string
) => {
    let updatedTicketForCloud: ItemTicket | null = null;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            claims: t.claims.map((c) =>
              c.id === claimId ? { ...c, status: "rejected" as const } : c
            ),
          };
          updatedTicketForCloud = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTicketForCloud) {
      saveTicketToFirestore(updatedTicketForCloud);
    }

   if (selectedTicket && selectedTicket.id === ticketId) {
  setSelectedTicket((prev) =>
    prev
      ? {
          ...prev,
          claims: prev.claims.map((c) =>
            c.id === claimId ? { ...c, status: "rejected" } : c
          ),
        }
      : null
  );
}

const rejectedTicket = tickets.find(
  (ticket) => ticket.id === ticketId
);

const rejectedClaim = rejectedTicket?.claims.find(
  (claim) => claim.id === claimId
);

if (rejectedTicket && rejectedClaim) {
  createNotification(
    rejectedClaim.claimantId,
    "Claim rejected",
    `Your claim for "${rejectedTicket.title}" has been rejected. Reason: ${rejectReason}`,
    "claim_rejected",
    ticketId
  );
}
};

  // Confirm return & close ticket
  const handleCloseTicket = (ticketId: string, handoverNotes: string) => {
    if (!currentUser) return;
    const nowIso = new Date().toISOString();

    let updatedTicketForCloud: ItemTicket | null = null;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated = {
            ...t,
            status: "returned_closed" as const,
            closedAt: nowIso,
            closedBy: currentUser.name,
            handoverNotes,
          };
          updatedTicketForCloud = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTicketForCloud) {
      saveTicketToFirestore(updatedTicketForCloud);
    }

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "returned_closed",
              closedAt: nowIso,
              closedBy: currentUser.name,
              handoverNotes,
            }
          : null
      );
    }

    // Celebratory notification
        const closedTicket = tickets.find(
      (ticket) => ticket.id === ticketId
    );

    const approvedClaim = closedTicket?.claims.find(
      (claim) => claim.status === "approved"
    );

    if (closedTicket && approvedClaim) {
      // 1. Claimant / Owner
      createNotification(
        approvedClaim.claimantId,
        "Item returned successfully",
        `"${closedTicket.title}" has been successfully handed over to you at the Campus Lost & Found Desk.`,
        "item_returned",
        ticketId
      );

      // 2. Original reporter / finder
      if (closedTicket.reporterId !== approvedClaim.claimantId) {
        createNotification(
          closedTicket.reporterId,
          "Item handed over",
          `"${closedTicket.title}" has been handed over to its verified owner through Campus Security.`,
          "item_handed_over",
          ticketId
        );
      }

      // 3. Campus Security
      notifySecurity(
        "Handover completed",
        `The item "${closedTicket.title}" has been successfully handed over and the ticket is now closed.`,
        "handover_completed",
        ticketId
      );
    }
  };

  // Sign out / Log out
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("refind_auth_session");
    localStorage.removeItem("refind_current_user");
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Select ticket by ID (e.g. from notification)
  const handleSelectTicketById = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      setSelectedTicket(target);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const pendingReviewCount = useMemo(() => {
    let count = 0;
    tickets.forEach((t) => {
      if (t.status !== "returned_closed") {
        t.claims.forEach((c) => {
          if (c.status === "pending") count++;
        });
      }
    });
    return count;
  }, [tickets]);

  // Master Admin Role Designation: strictly restricted to Shreyansh Singh (shreyanshsingh105@gmail.com)
  const handleUpdateUserRole = (targetUserId: string, newRole: "Student" | "Campus Security") => {
    if (currentUser?.email.toLowerCase() !== "shreyanshsingh105@gmail.com") {
      alert("Unauthorized: Only Shreyansh Singh can designate or revoke Admin privileges.");
      return;
    }

    setUsers((prevUsers) => {
      const updated = prevUsers.map((u) => {
        if (u.id === targetUserId) {
          const updatedUser: CampusUser = {
            ...u,
            role: newRole,
            department: newRole === "Campus Security" ? "Campus Safety & Administration" : u.department,
          };
          saveUserToFirestore(updatedUser);
          return updatedUser;
        }
        return u;
      });
      return updated;
    });

    if (currentUser?.id === targetUserId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  // Unauthenticated: Show Dedicated Sign In / Registration Auth Page
  if (!currentUser) {
    return (
      <AuthPage
        allUsers={users}
        onLogin={(user) => {
          setCurrentUser(user);
          setCurrentTab("dashboard");
        }}
        onRegister={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
          setCurrentUser(newUser);
          saveUserToFirestore(newUser);
          setCurrentTab("dashboard");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleSelectTab}
          currentUser={currentUser}
          unreadCount={unreadNotificationsCount}
          pendingReviewCount={pendingReviewCount}
          onOpenLoginModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 flex">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={handleSelectTab}
              currentUser={currentUser}
              unreadCount={unreadNotificationsCount}
              pendingReviewCount={pendingReviewCount}
              onOpenLoginModal={() => {
                setIsAuthModalOpen(true);
                setMobileMenuOpen(false);
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl md:hidden transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm hidden sm:inline">
                Campus ReFind
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-500 capitalize">
                {currentTab.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Raise Ticket Button in Header */}
            <button
              id="header-report-btn"
              onClick={() => handleOpenReport("lost")}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Raise Ticket</span>
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotificationsModalOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Avatar with role pill */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition text-left"
                title="View Campus Profile & ID"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Sign out of portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* View Routing */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              tickets={tickets}
              currentUser={currentUser}
              onOpenReport={handleOpenReport}
              onOpenBrowse={() => setCurrentTab("browse")}
              onSelectItem={(ticket) => setSelectedTicket(ticket)}
              onOpenAdminDesk={
                currentUser?.role === "Campus Security" ||
                currentUser?.email?.toLowerCase() === "shreyanshsingh105@gmail.com"
                  ? () => setCurrentTab("admin_desk")
                  : undefined
              }
            />
          )}

          {currentTab === "browse" && (
            <BrowseReportsView
              tickets={tickets}
              onSelectItem={(ticket) => setSelectedTicket(ticket)}
              onOpenReport={handleOpenReport}
            />
          )}

          {currentTab === "claims" && (
            <MyClaimsView
              tickets={tickets}
              currentUser={currentUser}
              onSelectItem={(ticket) => setSelectedTicket(ticket)}
              onOpenReport={() => handleOpenReport("lost")}
            />
          )}

          {currentTab === "admin_desk" && (
            <AdminDeskView
              tickets={tickets}
              currentUser={currentUser}
              users={users}
              onUpdateUserRole={handleUpdateUserRole}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
              onCloseTicket={handleCloseTicket}
              onSelectItem={(ticket) => setSelectedTicket(ticket)}
            />
          )}
        </main>
      </div>

      {/* Persistent Floating AI Assistant Button (when modal is closed) */}
      {!isAssistantOpen && (
        <button
          id="floating-assistant-toggle-btn"
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-2xl flex items-center gap-2.5 transition border-2 border-white/60 hover:shadow-blue-500/25 group"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide">Campus ReFind Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* AI Assistant Modal (Matches User Screenshot) */}
      <AssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
          setIsAssistantOpen(false);
        }}
        currentTickets={tickets}
      />

      {/* Report an Item Modal */}
      <ReportItemModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        onAddTicket={handleAddTicket}
        defaultType={reportDefaultType}
      />

      {/* Item Detail Modal */}
      {selectedTicket && (
        <ItemDetailModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          currentUser={currentUser}
          onOpenClaim={(ticket) => setTicketToClaim(ticket)}
          onApproveClaim={handleApproveClaim}
          onRejectClaim={handleRejectClaim}
          onCloseTicket={handleCloseTicket}
        />
      )}

      {/* Claim Submission Modal */}
      {ticketToClaim && (
        <ClaimItemModal
          isOpen={!!ticketToClaim}
          onClose={() => setTicketToClaim(null)}
          ticket={ticketToClaim}
          currentUser={currentUser}
          onSubmitClaim={handleSubmitClaim}
        />
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onSelectTicketById={handleSelectTicketById}
      />

      {/* Auth / SSO Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    </div>
  );
}
