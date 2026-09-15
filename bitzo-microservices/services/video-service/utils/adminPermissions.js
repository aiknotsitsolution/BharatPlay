const ROLE_PERMISSIONS = {
  admin: [
    "users:read",
    "users:write",
    "users:delete",
    "finance:read",
    "finance:write",
    "support:read",
    "support:write",
    "settings:write",
    "moderation:read",
    "moderation:write",
    "moderation:delete",
    "employee:read",
    "employee:create",
    "employee:delete",
    "dashboard:read",
    "content:read",
    "copyright:read",
    "copyright:write",
    "copyright:delete",
    
  ],
  finance: [
    "finance:read",
    "finance:write",
    "users:read",
    "copyright:read",
    "dashboard:read",
  ],
  support: [
    "support:read",
    "support:write",
    "users:read",
    "dashboard:read",
    "content:read",
    "moderation:read",
    "copyright:read",
    "copyright:write",
  ],
  "read-only": [
    "users:read",
    "finance:read",
    "support:read",
    "dashboard:read",
    "content:read",
    "moderation:read",
    "copyright:read",
  ],
};

exports.hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

exports.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
