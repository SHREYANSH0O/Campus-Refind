import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  increment,
  writeBatch,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  reload,
  User as FirebaseUser,
} from "firebase/auth";
import { db, auth } from "../firebase";
import {
  CampusUser,
  ItemTicket,
  CampusNotification,
  ClaimVerification,
  SupportRequest,
  isPortalAdminRole,
} from "../types";

const USERS_COLLECTION = "users";
const TICKETS_COLLECTION = "tickets";
const NOTIFICATIONS_COLLECTION = "notifications";
const SUPPORT_REQUESTS_COLLECTION = "supportRequests";

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

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
  "user-shreyansh-admin",
];

/**
 * Sync tickets in real-time from Firestore.
 * Filters out any residual pre-reported mock items so only real user tickets are rendered.
 */
export function subscribeToTickets(
  viewer: CampusUser,
  onUpdate: (tickets: ItemTicket[]) => void
) {
  try {
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    const q = query(ticketsRef, where("privacyVersion", "==", 2));

    return onSnapshot(
      q,
      async (snapshot) => {
        const ticketDocs = snapshot.docs.filter(
          (ticketDoc) => !PRE_REPORTED_TICKET_IDS.includes(ticketDoc.id)
        );

        const list = await Promise.all(
          ticketDocs.map(async (ticketDoc) => {
            const rawTicket = {
              ...ticketDoc.data(),
              id: ticketDoc.id,
            } as ItemTicket;

            const {
              claims: legacyClaims = [],
              reporterContact: legacyReporterContact = "",
              secretIdentifiers: legacySecretIdentifiers,
              handoverNotes: legacyHandoverNotes,
              ...publicTicket
            } = rawTicket;

            const canManageTicket = publicTicket.reporterId === viewer.id;

            const claimsRef = collection(
              db,
              TICKETS_COLLECTION,
              ticketDoc.id,
              "claims"
            );

            let claims: ClaimVerification[] = [];
            let claimsLoadedSuccessfully = false;

            try {
              const claimsSnapshot = await getDocs(
                canManageTicket
                  ? claimsRef
                  : query(claimsRef, where("claimantId", "==", viewer.id))
              );

              const storedClaims = claimsSnapshot.docs.map(
                (claimDoc) =>
                  ({
                    ...claimDoc.data(),
                    id: claimDoc.data().id || claimDoc.id,
                  }) as ClaimVerification
              );

              claims =
                storedClaims.length > 0 || !canManageTicket
                  ? storedClaims
                  : legacyClaims;

              claimsLoadedSuccessfully = true;
            } catch (error) {
              // Never hide the public report just because a private claim read failed.
              console.warn(
                `Claims could not be loaded for ticket ${ticketDoc.id}:`,
                error
              );
              claims = canManageTicket ? legacyClaims : [];
            }

            let privateDetails: Partial<ItemTicket> = canManageTicket
              ? {
                  reporterContact: legacyReporterContact,
                  secretIdentifiers: legacySecretIdentifiers,
                  handoverNotes: legacyHandoverNotes,
                }
              : {};

            if (canManageTicket) {
              try {
                const privateSnapshot = await getDoc(
                  doc(
                    db,
                    TICKETS_COLLECTION,
                    ticketDoc.id,
                    "private",
                    "details"
                  )
                );

                if (privateSnapshot.exists()) {
                  privateDetails =
                    privateSnapshot.data() as Partial<ItemTicket>;
                }
              } catch (error) {
                // Keep the public ticket visible even if private details fail.
                console.warn(
                  `Private details could not be loaded for ticket ${ticketDoc.id}:`,
                  error
                );
              }
            }

            const storedClaimCount =
              typeof publicTicket.claimCount === "number"
                ? publicTicket.claimCount
                : undefined;

            const claimCount =
              storedClaimCount ??
              (canManageTicket ? claims.length : 0);

            // Self-heal old tickets once the original reporter can see all claims.
            if (
              canManageTicket &&
              claimsLoadedSuccessfully &&
              storedClaimCount !== claims.length
            ) {
              updateDoc(ticketDoc.ref, {
                claimCount: claims.length,
              }).catch((error) => {
                console.warn(
                  `Claim count could not be repaired for ticket ${ticketDoc.id}:`,
                  error
                );
              });
            }

            return {
              ...publicTicket,
              ...privateDetails,
              reporterContact: privateDetails.reporterContact || "",
              claims,
              claimCount,
            } as ItemTicket;
          })
        );

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
export async function saveTicketToFirestore(ticket: ItemTicket, actor: CampusUser) {
  try {
    const {
      claims,
      reporterContact,
      secretIdentifiers,
      handoverNotes,
      ...publicTicket
    } = ticket;
    const ticketRef = doc(db, TICKETS_COLLECTION, ticket.id);
    const canManageTicket = actor.id === ticket.reporterId;

    if (canManageTicket) {
      const normalizedClaimCount = Math.max(
        typeof ticket.claimCount === "number" ? ticket.claimCount : 0,
        claims.length
      );

      await setDoc(ticketRef, {
        ...publicTicket,
        claimCount: normalizedClaimCount,
        privacyVersion: 2,
      });
      await setDoc(
        doc(db, TICKETS_COLLECTION, ticket.id, "private", "details"),
        {
          reporterId: ticket.reporterId,
          reporterContact,
          secretIdentifiers: secretIdentifiers || "",
          handoverNotes: handoverNotes || "",
        },
        { merge: true }
      );
      await Promise.all(
        claims.map((claim) =>
          setDoc(
            doc(db, TICKETS_COLLECTION, ticket.id, "claims", claim.claimantId),
            claim,
            { merge: true }
          )
        )
      );
      return;
    }

    const ownClaim = claims.find((claim) => claim.claimantId === actor.id);
    if (!ownClaim) throw new Error("A claimant may only save their own claim.");
    const claimRef = doc(
      db,
      TICKETS_COLLECTION,
      ticket.id,
      "claims",
      actor.id
    );

    // Claim + public claimCount/status update are committed together.
    const batch = writeBatch(db);
    batch.set(claimRef, ownClaim);
    batch.update(ticketRef, {
      status: "under_verification",
      claimCount: increment(1),
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving ticket to Firestore:", error);
    throw error;
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
export function subscribeToUsers(
  onUpdate: (users: CampusUser[]) => void,
  securityOnly = false
) {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = securityOnly
      ? query(usersRef, where("role", "in", ["Portal Admin", "Campus Security"]))
      : query(usersRef);
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

export async function getCampusUserProfile(userId: string) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  return snapshot.exists()
    ? ({ ...snapshot.data(), id: snapshot.id } as CampusUser)
    : null;
}

/**
 * Sync Notifications
 */
export function subscribeToNotifications(
  viewer: CampusUser,
  onUpdate: (notifs: CampusNotification[]) => void
) {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", viewer.id)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CampusNotification[] = [];
        const legacyAdminItemNotifications: string[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CampusNotification;
          if (
            data.userId !== viewer.id ||
            PRE_REPORTED_NOTIF_IDS.includes(docSnap.id)
          ) {
            return;
          }

          // Portal Admin is intentionally excluded from lost/found ownership
          // workflows. Only non-ticket portal/support alerts belong in the
          // admin notification feed.
          if (
            isPortalAdminRole(viewer.role) &&
            (data.type !== "info" || Boolean(data.ticketId))
          ) {
            legacyAdminItemNotifications.push(docSnap.id);
            return;
          }

          list.push({ ...data, id: docSnap.id });
        });

        onUpdate(list);

        // Remove historical item/claim alerts that were created for admin
        // before the portal-admin privacy model was introduced.
        legacyAdminItemNotifications.forEach((notificationId) => {
          deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId)).catch(
            (error) => {
              console.warn(
                "Legacy admin item notification could not be removed:",
                error
              );
            }
          );
        });
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

export async function markNotificationsReadInFirestore(
  notifications: CampusNotification[]
) {
  await Promise.all(
    notifications
      .filter((notification) => !notification.read)
      .map((notification) =>
        updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notification.id), {
          read: true,
        })
      )
  );
}



/**
 * Sync support requests.
 * Portal admins can see all requests; members only see requests they created.
 */
export function subscribeToSupportRequests(
  viewer: CampusUser,
  onUpdate: (requests: SupportRequest[]) => void
) {
  try {
    const requestsRef = collection(db, SUPPORT_REQUESTS_COLLECTION);
    const q = isPortalAdminRole(viewer.role)
      ? query(requestsRef)
      : query(requestsRef, where("userId", "==", viewer.id));

    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id,
          }) as SupportRequest)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        onUpdate(list);
      },
      (err) => {
        console.warn("Firestore support request subscription error:", err);
      }
    );
  } catch (error) {
    console.warn("Failed to subscribe to support requests:", error);
    return () => {};
  }
}

export async function saveSupportRequestToFirestore(
  request: SupportRequest
) {
  await setDoc(doc(db, SUPPORT_REQUESTS_COLLECTION, request.id), request);
}

export async function updateSupportRequestInFirestore(
  requestId: string,
  updates: Partial<Pick<SupportRequest, "status" | "adminReply" | "updatedAt">>
) {
  await updateDoc(
    doc(db, SUPPORT_REQUESTS_COLLECTION, requestId),
    updates
  );
}

/**
 * Register with Email and Password and send real email verification
 */
export async function registerWithEmailVerification(
  email: string,
  pass: string,
  displayName: string
): Promise<{ firebaseUser: FirebaseUser }> {
  await setPersistence(auth, browserSessionPersistence);
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
  pass: string,
  rememberSession = false
): Promise<{ firebaseUser: FirebaseUser }> {
  await setPersistence(
    auth,
    rememberSession ? browserLocalPersistence : browserSessionPersistence
  );
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    if ((error as { code?: string })?.code !== "auth/network-request-failed") {
      throw error;
    }
    await wait(600);
    userCredential = await signInWithEmailAndPassword(auth, email, pass);
  }
  return { firebaseUser: userCredential.user };
}

export function requestPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
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
