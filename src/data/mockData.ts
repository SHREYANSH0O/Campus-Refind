import { CampusUser, ItemTicket, CampusNotification } from "../types";

export const CAMPUS_USERS: CampusUser[] = [
  {
    id: "user-shreyansh-admin",
    name: "Shreyansh Singh",
    email: "shreyanshsingh105@gmail.com",
    role: "Campus Security",
    department: "Campus Safety & Central Lost Desk Admin",
    campusId: "ADMIN-SEC-001",
    avatarInitials: "SS",
    password: "admin",
    joinedDate: "2026-01-01",
  },
];

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
