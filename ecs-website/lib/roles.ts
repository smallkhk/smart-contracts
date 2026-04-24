import { Role } from "@prisma/client";

export const STAFF_ROLES: Role[] = [Role.STAFF, Role.MOD, Role.ADMIN];

export function isStaff(role: Role) {
  return STAFF_ROLES.includes(role);
}

export function isAdmin(role: Role) {
  return role === Role.ADMIN;
}
