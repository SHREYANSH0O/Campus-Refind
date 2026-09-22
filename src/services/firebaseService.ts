import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  reload,
  User as FirebaseUser,
} from "firebase/auth";
import { db, auth } from "../firebase";
import { CampusUser, ItemTicket, CampusNotification, ClaimVerification } from "../types";
import { CAMPUS_USERS, INITIAL_TICKETS } from "../data/mockData";

const USERS_COLLECTION = "users";
const TICKETS_COLLECTION = "tickets";
const NOTIFICATIONS_COLLECTION = "notifications";

const PRE_REPORTED_TICKET_IDS = [
  "ticket-101",
  "ticket-102",
  "ticket-103",
  "ticket-104",
  "ticket-105",
  "ticket-106",
  "ticket-107",
  "ticket-108",
  "ticket-109",
];

const PRE_REPORTED_NOTIF_IDS = ["notif-1", "notif-2", "notif-3"];

const LEGACY_MOCK_USER_IDS = [
  "user-john-smith",
  "user-elena-rostova",
  "user-marcus-vance",
];

/**
 * Initialize base collections in Firestore if they don't exist yet,
 * and clean up any pre-reported sample tickets from previous runs.
 */
export async function seedFirestoreIfEmpty() {
  try {
    // Ensure default users exist in Firestore
    for (const user of CAMPUS_USERS) {
      await setDoc(doc(db, USERS_COLLECTION, user.id), {
        ...user,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Automatically purge pre-reported mock tickets from Firestore
    for (const legacyId of PRE_REPORTED_TICKET_IDS) {
      try {
        await deleteDoc(doc(db, TICKETS_COLLECTION, legacyId));
      } catch (err) {
        // Silently skip if document not found or offline
      }
    }

    // Automatically purge pre-reported mock notifications from Firestore
    for (const legacyNotifId of PRE_REPORTED_NOTIF_IDS) {
      try {
        await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, legacyNotifId));
      } catch (err) {
        // Silently skip if document not found or offline
      }
    }

    // Automatically purge pre-reported mock bot users from Firestore
    for (const legacyUserId of LEGACY_MOCK_USER_IDS) {
      try {
        await deleteDoc(doc(db, USERS_COLLECTION, legacyUserId));
      } catch (err) {
        // Silently skip if document not found or offline
      }
    }
  } catch (error) {
    console.warn("Firestore seed note (may have offline or permissions fallback):", error);
  }
}

/**
 * Sync tickets in real-time from Firestore.
 * Filters out any residual pre-reported mock items so only real user tickets are rendered.
 */
export function subscribeToTickets(onUpdate: (tickets: ItemTicket[]) => void) {
  try {
    const q = query(collection(db, TICKETS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ItemTicket[] = [];
        snapshot.forEach((docSnap) => {
          if (!PRE_REPORTED_TICKET_IDS.includes(docSnap.id)) {
            list.push({ ...docSnap.data(), id: docSnap.id } as ItemTicket);
          }
        });
        // Pass the live real tickets list (even if empty)
        onUpdate(list);
      },
      (err) => {
        console.warn("Firestore ticket subscription error:", err);
      }
    );
  } catch (error) {
    console.warn("Failed to subscribe to tickets:", error);
    return () => {};
  }
}

/**
 * Save or update a ticket in Firestore
 */
export async function saveTicketToFirestore(ticket: ItemTicket) {
  try {
    await setDoc(doc(db, TICKETS_COLLECTION, ticket.id), ticket, { merge: true });
  } catch (error) {
    console.error("Error saving ticket to Firestore:", error);
  }
}

/**
 * Delete a ticket from Firestore
 */
export async function deleteTicketFromFirestore(ticketId: string) {
  try {
    await deleteDoc(doc(db, TICKETS_COLLECTION, ticketId));
  } catch (error) {
    console.error("Error deleting ticket from Firestore:", error);
  }
}

/**
 * Subscribe to all users in Firestore
 */
export function subscribeToUsers(onUpdate: (users: CampusUser[]) => void) {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CampusUser[] = [];
          snapshot.forEach((docSnap) => {
            if (!LEGACY_MOCK_USER_IDS.includes(docSnap.id)) {
              list.push({ ...docSnap.data(), id: docSnap.id } as CampusUser);
            }
          });
          onUpdate(list);
        }
      },
      (err) => {
        console.warn("Firestore users subscription error:", err);
      }
    );
  } catch (error) {
    console.warn("Failed to subscribe to users:", error);
    return () => {};
  }
}

/**
 * Save or register user in Firestore
 */
export async function saveUserToFirestore(user: CampusUser) {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
  } catch (error) {
    console.error("Error saving user to Firestore:", error);
  }
}

/**
 * Sync Notifications
 */
export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifs: CampusNotification[]) => void
) {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CampusNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CampusNotification;
          if (data.userId === userId && !PRE_REPORTED_NOTIF_IDS.includes(docSnap.id)) {
            list.push({ ...data, id: docSnap.id });
          }
        });
        onUpdate(list);
      },
      (err) => {
        console.warn("Firestore notifications error:", err);
      }
    );
  } catch (error) {
    console.warn("Failed to subscribe to notifications:", error);
    return () => {};
  }
}

/**
 * Save notification
 */
export async function saveNotificationToFirestore(notif: CampusNotification) {
  try {
    await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notif.id), notif, { merge: true });
  } catch (error) {
    console.error("Error saving notification:", error);
  }
}


/**
 * Register with Email and Password and send real email verification
 */
export async function registerWithEmailVerification(
  email: string,
  pass: string,
  displayName: string
): Promise<{ firebaseUser: FirebaseUser }> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch {
      // Non-critical profile name update
    }
  }
  // Send email verification link to user's real email inbox
  await sendEmailVerification(userCredential.user);
  return { firebaseUser: userCredential.user };
}

/**
 * Login with Email and Password
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ firebaseUser: FirebaseUser }> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return { firebaseUser: userCredential.user };
}

/**
 * Resend verification email to current user
 */
export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("No active user session found to send verification email to.");
  }
  await sendEmailVerification(auth.currentUser);
}

/**
 * Reload current user from Firebase Auth and check if email is verified
 */
export async function checkEmailVerification(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified;
}

/**
 * Sign out current Firebase user
 */
export async function logoutFirebaseAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Sign out error:", error);
  }
}

export { auth, db };
