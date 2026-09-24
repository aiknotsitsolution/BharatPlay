export const formatTicketId = (id) => {
  if (!id) return "";
  const str = typeof id === "string" ? id : id?.toString?.() || "";
  return str ? "BP-" + str.slice(-8).toUpperCase() : "";
};