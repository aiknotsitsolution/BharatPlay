// Static support associates. Hard-coded for now; can be moved to a DB later
// without changing the assignment logic.
const SUPPORT_ASSOCIATES = [
  { id: "assoc_1", name: "Aarav Sharma", email: "aarav.support@bharatplay.com" },
  { id: "assoc_2", name: "Priya Patel",  email: "priya.support@bharatplay.com" },
  { id: "assoc_3", name: "Rohan Mehta",  email: "rohan.support@bharatplay.com" },
  { id: "assoc_4", name: "Sneha Reddy",  email: "sneha.support@bharatplay.com" },
  { id: "assoc_5", name: "Vikram Singh", email: "vikram.support@bharatplay.com" },
];

const VALID_ASSOCIATE_IDS = SUPPORT_ASSOCIATES.map((associate) => associate.id);

const getAssociateById = (id) =>
  SUPPORT_ASSOCIATES.find((associate) => associate.id === id) || null;

const getAssociateName = (id) => getAssociateById(id)?.name || null;

module.exports = {
  SUPPORT_ASSOCIATES,
  VALID_ASSOCIATE_IDS,
  getAssociateById,
  getAssociateName,
};