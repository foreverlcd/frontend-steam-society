import type { UserRole, UserStatus } from "@/lib/api/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  mentee: "Mentorada",
  mentor: "Mentora",
  admin: "Administración",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_verification: "Pendiente de verificación",
  active: "Activa",
  suspended: "Suspendida",
  deleted: "Eliminada",
};

const ROLE_HOME: Record<UserRole, string> = {
  mentee: "/dashboard",
  mentor: "/dashboard",
  admin: "/admin",
};

export function homePathForRole(role: UserRole): string {
  return ROLE_HOME[role];
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function userStatusLabel(status: UserStatus): string {
  return USER_STATUS_LABELS[status];
}
