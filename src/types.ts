export type TicketType = "lost" | "found";

export type TicketStatus = "open" | "under_verification" | "returned_closed";

export type ItemCategory =
  | "Electronics"
  | "IDs & Cards"
  | "Keys"
  | "Wallets & Bags"
  | "Books & Stationery"
  | "Clothing & Accessories"
  | "Sports & Fitness"
  | "Watches & Jewelry"
  | "Other";

export interface CampusUser {
  id: string;
  name: string;
  email: string;
  role: "Student" | "Faculty" | "Campus Security";
  department: string;
  campusId: string;
  avatarInitials: string;
  joinedDate?: string;
  emailVerified?: boolean;
  authProvider?: "google" | "password";
}

export interface ClaimVerification {
  id: string;
  ticketId: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantRole: "Student" | "Faculty" | "Campus Security";
  proofDetails: string;
  contactNumber: string;
  proofAttachmentUrl?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  handoverCode?: string;
  rejectionReason?: string;
  reviewNote?: string;
}

export interface ItemTicket {
  id: string;
  ticketNumber: string;
  type: TicketType;
  title: string;
  category: ItemCategory;
  location: string;
  specificArea?: string;
  date: string;
  time?: string;
  description: string;
  secretIdentifiers?: string; // Private details used to verify claimant
  imageUrl?: string;
  status: TicketStatus;
  reporterId: string;
  reporterName: string;
  reporterRole: "Student" | "Faculty" | "Campus Security";
  reporterContact: string;
  createdAt: string;
  claims: ClaimVerification[];
  // Public-safe count; claimant identities and proof remain private.
  claimCount?: number;
  handoverNotes?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface CampusNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type:
    | "report_submitted"
    | "new_report"
    | "claim_submitted"
    | "claim_received"
    | "claim_approved"
    | "claim_rejected"
    | "more_info"
    | "item_handed_over"
    | "item_returned"
    | "handover_completed"
    | "ticket_closed"
    | "info";
  ticketId?: string;
}

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickTopics?: boolean;
}
