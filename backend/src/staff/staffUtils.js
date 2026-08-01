const STAFF_ROLES = Object.freeze([
  "teacher",
  "accountant",
  "librarian",
  "administrator",
  "admin",
]);

export const isStaffRole = (role) => {
  if (!role) {
    return false;
  }

  return STAFF_ROLES.includes(String(role).trim().toLowerCase());
};

export const isAdminRole = (role) => {
  if (!role) {
    return false;
  }

  return String(role).trim().toLowerCase() === "admin";
};

export const sanitizeStaff = (payload) => {
  const user = payload?.user ?? payload;
  const profile = payload?.profile ?? {};

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    department: profile.department ?? null,
    position: profile.position ?? null,
    phone: profile.phone ?? null,
    isActive: profile.is_active ?? true,
    createdAt: user.createdAt ?? profile.createdAt ?? null,
    updatedAt: profile.updated_at ?? profile.updatedAt ?? user.updatedAt ?? null,
  };
};
