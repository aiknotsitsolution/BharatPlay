const AssignmentCounter = require("../models/AssignmentCounter");
const ContactRequest = require("../models/ContactRequest");
const DeletionRequest = require("../models/DeletionRequest");
const {
  SUPPORT_ASSOCIATES,
  VALID_ASSOCIATE_IDS,
  getAssociateById,
} = require("../constants/supportAssociates");

const ASSOCIATE_COUNT = SUPPORT_ASSOCIATES.length;

// Assignment is done PER CATEGORY so round-robin is independent per category.
const INQUIRY_CATEGORIES = {
  "General Inquiry": "general",
  "Technical Support": "technical-support",
  "Privacy Request": "privacy-request",
  "Data Deletion": "data-deletion",
  Complaint: "complaint",
  "Business Inquiry": "business-inquiry",
  Copyright: "copyright",
  Account: "account",
  Billing: "billing",
  Other: "other",
};

const DELETION_CATEGORY = "deletion";

const slugifyCategory = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "other";

const categoryOfContactRequest = (inquiryType) =>
  INQUIRY_CATEGORIES[inquiryType] || slugifyCategory(inquiryType);

const isValidAssociateId = (id) =>
  id === null ||
  id === undefined ||
  id === "" ||
  VALID_ASSOCIATE_IDS.includes(id);

const leastLoadedAssociate = async () => {
  let best = SUPPORT_ASSOCIATES[0];
  let minLoad = Infinity;

  for (const associate of SUPPORT_ASSOCIATES) {
    const [contactCount, deletionCount] = await Promise.all([
      ContactRequest.countDocuments({ assignedTo: associate.id }),
      DeletionRequest.countDocuments({ assignedTo: associate.id }),
    ]);
    const load = contactCount + deletionCount;
    if (load < minLoad) {
      minLoad = load;
      best = associate;
    }
  }

  return best;
};

// Atomically advance the per-category round-robin counter. Falls back to the
// least-loaded associate if the counter write fails for any reason.
const assignTicket = async (category) => {
  try {
    const counter = await AssignmentCounter.findOneAndUpdate(
      { category: String(category) },
      { $inc: { lastAssignedIndex: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return SUPPORT_ASSOCIATES[counter.lastAssignedIndex % ASSOCIATE_COUNT];
  } catch (error) {
    console.error(
      "[assignment] Counter failed, falling back to least-loaded:",
      error.message
    );
    return leastLoadedAssociate();
  }
};

const getAssociates = async () =>
  SUPPORT_ASSOCIATES.map((associate) => ({
    id: associate.id,
    name: associate.name,
    email: associate.email,
  }));

module.exports = {
  SUPPORT_ASSOCIATES,
  DELETION_CATEGORY,
  categoryOfContactRequest,
  isValidAssociateId,
  assignTicket,
  getAssociates,
  getAssociateById,
};