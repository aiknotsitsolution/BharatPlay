export function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function roleColor(role) {
  if (role === "admin")
    return "bg-bp-blue/15 text-bp-blue border border-bp-blue/20";
  if (role === "creator")
    return "bg-bp-cyan/15 text-bp-cyan border border-bp-cyan/20";
  return "bg-bp-text-muted/15 text-bp-text-secondary border border-bp-text-muted/20";
}

export function statusBadge(status) {
  const base = "px-2 py-0.5 rounded-full text-xs font-medium border ";
  const map = {
    active: base + "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    suspended: base + "bg-amber-500/15 text-amber-400 border-amber-500/20",
    banned: base + "bg-red-500/15 text-red-400 border-red-500/20",
    deleted: base + "bg-red-500/15 text-red-400 border-red-500/20",
    inactive: base + "bg-bp-text-muted/15 text-bp-text-secondary border-bp-text-muted/20",
  };
  return map[status] || map.inactive;
}

export function getAdminDisplayName() {
  try {
    const savedUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    return savedUser?.name || "Admin";
  } catch {
    return "Admin";
  }
}

export function getAdminEmail() {
  try {
    const savedUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    return savedUser?.email || "";
  } catch {
    return "";
  }
}

export function getInitials(name) {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "A";
}

export function getAdminPhoto() {
  try {
    const savedUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    if (savedUser?.profilePhoto) return savedUser.profilePhoto;
    return localStorage.getItem("bp-admin-photo") || null;
  } catch {
    return null;
  }
}

export function setAdminPhoto(base64) {
  try {
    if (base64) {
      localStorage.setItem("bp-admin-photo", base64);
    } else {
      localStorage.removeItem("bp-admin-photo");
    }
    window.dispatchEvent(new Event("auth-change"));
  } catch (_) {
    // ignore
  }
}
