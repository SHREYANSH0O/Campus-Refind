import { CampusUser, ItemTicket, CampusNotification } from "../types";

// Real users, including Campus Security/admin accounts, are loaded from Firebase.
export const CAMPUS_USERS: CampusUser[] = [];

export const CAMPUS_BUILDINGS = [
  "A Block",
  "B Block",
  "C Block",
  "D Block",
  "E Block",
  "Vivekanand Hall",
  "Canteen",
  "Central library",
  "Campus Playground",
];

export const CAMPUS_LOCATIONS = [
  "A Block",
  "B Block",
  "C Block",
  "D Block",
  "E Block",
  "Vivekanand Hall",
  "Canteen",
  "Central library",
  "Campus Playground",
];

export const INITIAL_TICKETS: ItemTicket[] = [];

export const INITIAL_NOTIFICATIONS: CampusNotification[] = [];
