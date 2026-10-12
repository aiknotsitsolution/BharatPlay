const ticketIdFromMongoId = (value) => {
  if (!value) return "";
  const str =
    typeof value === "string" ? value : value && value.toString ? value.toString() : "";
  return str ? "BP-" + str.slice(-8).toUpperCase() : "";
};

module.exports = { ticketIdFromMongoId };