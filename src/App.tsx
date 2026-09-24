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
import {
  CampusUser,
  ItemTicket,
  CampusNotification,
  TicketType,
  SupportRequest,
  SupportIssueType,
  isPortalAdminRole,
  displayRole,
} from "./types";
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
import { SupportView } from "./components/SupportView";
import {
  subscribeToTickets,
  saveTicketToFirestore,
  subscribeToUsers,
  saveUserToFirestore,
  subscribeToNotifications,
  saveNotificationToFirestore,
  markNotificationsReadInFirestore,
  subscribeToSupportRequests,
  saveSupportRequestToFirestore,
  updateSupportRequestInFirestore,
  logoutFirebaseAuth,
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
  "user-shreyansh-admin",
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

  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);

  // Subscribe only after authentication. Seeding and cleanup belong in a
  // trusted deployment process, never in every user's browser.
  useEffect(() => {
    if (!currentUser) return;

    const unsubTickets = subscribeToTickets(currentUser, (cloudTickets) => {
      // cloudTickets is already filtered to exclude legacy mock items
      setTickets(cloudTickets);
      localStorage.setItem("refind_tickets", JSON.stringify(cloudTickets));
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        localStorage.setItem("refind_users", JSON.stringify(cloudUsers));
      }
    }, !isPortalAdminRole(currentUser.role));

    return () => {
      unsubTickets();
      unsubUsers();
    };
  }, [currentUser?.id, currentUser?.role]);

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

  // Members see their own support requests; Portal Admin sees the full inbox.
  useEffect(() => {
    if (!currentUser) return;
    const unsubSupport = subscribeToSupportRequests(currentUser, (cloudRequests) => {
      setSupportRequests(cloudRequests);
    });
    return () => {
      unsubSupport();
    };
  }, [currentUser?.id, currentUser?.role]);


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
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
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
      const isAdmin = !!currentUser && isPortalAdminRole(currentUser.role);
      if (!isAdmin) {
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
    if (currentUser && isPortalAdminRole(currentUser.role)) return;
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
      claimCount: 0,
    };

    setTickets((prev) => [newTicket, ...prev]);
    saveTicketToFirestore(newTicket, currentUser);

    // Add notification
        // 1. Reporter / Finder confirmation
    createNotification(
      currentUser.id,
      "Report submitted",
      `Your ${newTicket.type} item "${newTicket.title}" at ${newTicket.location} has been successfully reported.`,
      "report_submitted",
      newTicket.id
    );

  };

  // Submit claim on a ticket
  const handleSubmitClaim = (
    ticketId: string,
    proofDetails: string,
    contactNumber: string
  ) => {
    if (!currentUser || isPortalAdminRole(currentUser.role)) return;
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
            claimCount: (t.claimCount ?? t.claims.length) + 1,
          };
          updatedTicketForCloud = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTicketForCloud) {
      saveTicketToFirestore(updatedTicketForCloud, currentUser);
    }

    // Update selected ticket if currently inspecting
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "under_verification",
              claims: [newClaim, ...prev.claims],
              claimCount: (prev.claimCount ?? prev.claims.length) + 1,
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
      saveTicketToFirestore(updatedTicketForCloud, currentUser);
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
        `Your claim for "${approvedTicket.title}" has been approved. Your handover code is ${handoverCode}. Coordinate a safe campus handover with the report creator and share this code when you meet.`,
        "claim_approved",
        ticketId
      );
    }
  };

  // Reject a claim
  const handleRejectClaim = (
  ticketId: string,
  claimId: string,
  rejectReason = "Ownership proof did not meet verification requirements."
) => {
    if (!currentUser) return;
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
      saveTicketToFirestore(updatedTicketForCloud, currentUser);
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
      saveTicketToFirestore(updatedTicketForCloud, currentUser);
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
        `"${closedTicket.title}" has been successfully handed over to you by the report creator.`,
        "item_returned",
        ticketId
      );

      // 2. Original reporter / finder
      if (closedTicket.reporterId !== approvedClaim.claimantId) {
        createNotification(
          closedTicket.reporterId,
          "Item handed over",
          `"${closedTicket.title}" has been handed over to its verified owner.`,
          "item_handed_over",
          ticketId
        );
      }

    }
  };

  const handleSubmitSupportRequest = async (
    issueType: SupportIssueType,
    subject: string,
    description: string
  ) => {
    if (!currentUser) {
      throw new Error("You must be signed in to submit a support request.");
    }

    const request: SupportRequest = {
      id: `support-${crypto.randomUUID()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      issueType,
      subject,
      description,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    await saveSupportRequestToFirestore(request);

    setSupportRequests((prev) => {
      if (prev.some((item) => item.id === request.id)) return prev;
      return [request, ...prev];
    });

    createNotification(
      currentUser.id,
      "Support request submitted",
      `Your concern "${subject}" has been sent to Portal Admin.`,
      "info"
    );

    users
      .filter(
        (user) =>
          isPortalAdminRole(user.role) && user.id !== currentUser.id
      )
      .forEach((adminUser) => {
        createNotification(
          adminUser.id,
          "New support concern",
          `${currentUser.name} submitted a ${issueType.toLowerCase()} concern: "${subject}".`,
          "info"
        );
      });
  };

  const handleUpdateSupportRequest = (
    requestId: string,
    updates: Partial<Pick<SupportRequest, "status" | "adminReply">>
  ) => {
    if (!currentUser) return;

    const isAdmin = isPortalAdminRole(currentUser.role);
    if (!isAdmin) return;

    const target = supportRequests.find((request) => request.id === requestId);
    const withTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setSupportRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, ...withTimestamp } : request
      )
    );

    updateSupportRequestInFirestore(requestId, withTimestamp).catch((error) => {
      console.error("Support request could not be updated:", error);
    });

    if (target && target.userId !== currentUser.id) {
      const statusText =
        updates.status === "in_progress"
          ? "is now in progress"
          : updates.status === "resolved"
          ? "has been resolved"
          : "has a new admin update";

      createNotification(
        target.userId,
        "Support request updated",
        `Your concern "${target.subject}" ${statusText}.`,
        "info"
      );
    }
  };

  // Sign out / Log out
  const handleLogout = () => {
    logoutFirebaseAuth();
    setCurrentUser(null);
    setTickets([]);
    setNotifications([]);
    setSupportRequests([]);
    localStorage.removeItem("refind_auth_session");
    localStorage.removeItem("refind_current_user");
    localStorage.removeItem("refind_tickets");
    localStorage.removeItem("refind_notifications");
  };

  // Mark all notifications read
  const handleMarkAllRead = () => {
    const unreadNotifications = notifications.filter((notification) => !notification.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markNotificationsReadInFirestore(unreadNotifications).catch((error) => {
      console.error("Notifications could not be marked as read:", error);
      setNotifications((prev) =>
        prev.map((notification) =>
          unreadNotifications.some((unread) => unread.id === notification.id)
            ? { ...notification, read: false }
            : notification
        )
      );
    });
  };

  // Select ticket by ID (e.g. from notification)
  const handleSelectTicketById = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      setSelectedTicket(target);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const adminAlertCount = useMemo(
    () => supportRequests.filter((request) => request.status !== "resolved").length,
    [supportRequests]
  );

  // Master Admin Role Designation: strictly restricted to Shreyansh Singh (shreyanshsingh105@gmail.com)
  const handleUpdateUserRole = (targetUserId: string, newRole: "Student" | "Portal Admin") => {
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
            department: newRole === "Portal Admin" ? "Portal Administration & Support" : u.department,
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
          setTickets([]);
          setNotifications([]);
          setSupportRequests([]);
          setCurrentUser(user);
          setCurrentTab("dashboard");
        }}
        onRegister={(newUser) => {
          setTickets([]);
          setNotifications([]);
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
          adminAlertCount={adminAlertCount}
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
              adminAlertCount={adminAlertCount}
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
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl md:hidden transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm hidden sm:inline">
                Campus ReFind
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-500">
                {currentTab === "admin_desk"
                  ? "Admin & Support"
                  : currentTab === "support"
                  ? "Help & Support"
                  : currentTab.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick New Report Button in Header */}
            {!isPortalAdminRole(currentUser.role) && (
            <button
              type="button"
              id="header-report-btn"
              onClick={() => handleOpenReport("lost")}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>New Report</span>
            </button>
            )}

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => setIsNotificationsModalOpen(true)}
              aria-label={unreadNotificationsCount > 0 ? `Open notifications (${unreadNotificationsCount} unread)` : "Open notifications"}
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
                type="button"
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
                    {displayRole(currentUser.role)}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out of portal"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Sign out of portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* View Routing */}
        <main className="flex-1 p-4 pb-24 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              tickets={tickets}
              currentUser={currentUser}
              onOpenReport={handleOpenReport}
              onOpenBrowse={() => setCurrentTab("browse")}
              onSelectItem={(ticket) => setSelectedTicket(ticket)}
              onOpenAdminDesk={
                isPortalAdminRole(currentUser.role)
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

          {currentTab === "support" && (
            <SupportView
              currentUser={currentUser}
              requests={supportRequests}
              onSubmit={handleSubmitSupportRequest}
            />
          )}

          {currentTab === "admin_desk" && (
            <AdminDeskView
              tickets={tickets}
              currentUser={currentUser}
              users={users}
              supportRequests={supportRequests}
              onUpdateUserRole={handleUpdateUserRole}
              onUpdateSupportRequest={handleUpdateSupportRequest}
              onSelectItem={(ticket) => setSelectedTicket(ticket)}
            />
          )}
        </main>
      </div>

      {/* Persistent Floating AI Assistant Button (when modal is closed) */}
      {!isAssistantOpen && (
        <button
          type="button"
          id="floating-assistant-toggle-btn"
          onClick={() => setIsAssistantOpen(true)}
          aria-label="Open Campus ReFind Assistant"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center sm:justify-start gap-2.5 transition border-2 border-white/60 hover:shadow-blue-500/25 group"
        >
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-wide">Campus ReFind Assistant</span>
          <span className="hidden sm:block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
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
        key={`${reportDefaultType}-${isReportModalOpen ? "open" : "closed"}`}
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
