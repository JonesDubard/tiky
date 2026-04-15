export type Role = "ADMIN" | "ORGANIZER" | "STAFF" | "USER"

export const PERMISSIONS = {
  // Admin-only
  manageUsers:     ["ADMIN"],
  manageSettings:  ["ADMIN"],
  viewAllPayments: ["ADMIN"],
  deleteEvents:    ["ADMIN"],

  // Admin + Organizer
  createEvents:    ["ADMIN", "ORGANIZER"],
  editEvents:      ["ADMIN", "ORGANIZER"],
  viewAnalytics:   ["ADMIN", "ORGANIZER"],
  managePolls:     ["ADMIN", "ORGANIZER"],

  // Admin + Organizer + Staff
  validateTickets: ["ADMIN", "ORGANIZER", "STAFF"],
  viewOrders:      ["ADMIN", "ORGANIZER", "STAFF"],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}