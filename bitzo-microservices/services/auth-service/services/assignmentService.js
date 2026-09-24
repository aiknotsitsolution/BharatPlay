const AssignmentCounter = require("../models/AssignmentCounter");
const ContactRequest = require("../models/ContactRequest");
const DeletionRequest = require("../models/DeletionRequest");
const AdminModel = require("../models/admin/AdminModel");

// Assignment is done PER CATEGORY so round-robin is independent per category.
// The candidate pool is the set of admin-created support employees (Admin
// documents with role "support" and isActive true), so tickets are distributed
// fairly across however many support employees exist at any point in time.

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

// Current, stable list of assignable support employees.
const getSupportEmployees = async () =>
  AdminModel.find({ role: "support", isActive: true })
    .select("_id name email")
    .sort({ createdAt: 1 })
    .lean();

// Public shape used by the /associates endpoint and the admin panel.
const getAssociates = async () =>
  (await getSupportEmployees()).map((employee) => ({
    id: String(employee._id),
    name: employee.name,
    email: employee.email,
  }));

const leastLoadedEmployee = async (employees) => {
  let best = employees[0];
  let minLoad = Infinity;

  for (const employee of employees) {
    const id = String(employee._id);
    const [contactCount, deletionCount] = await Promise.all([
      ContactRequest.countDocuments({ assignedTo: id }),
      DeletionRequest.countDocuments({ assignedTo: id }),
    ]);
    const load = contactCount + deletionCount;
    if (load < minLoad) {
      minLoad = load;
      best = employee;
    }
  }

  return best;
};

// Atomically advance the per-category round-robin counter across the current
// support-employee pool. Falls back to least-loaded if the counter fails.
const assignTicket = async (category) => {
  const employees = await getSupportEmployees();
  if (employees.length === 0) return null;

  try {
    const counter = await AssignmentCounter.findOneAndUpdate(
      { category: String(category) },
      { $inc: { lastAssignedIndex: 1 } },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );
    return employees[counter.lastAssignedIndex % employees.length];
  } catch (error) {
    console.error(
      "[assignment] Counter failed, falling back to least-loaded:",
      error.message
    );
    return leastLoadedEmployee(employees);
  }
};

// Manual-assignment validation: empty means unassign; otherwise the value must
// be the _id of an existing active support employee.
const isAssignableEmployeeId = async (id) => {
  if (id === null || id === undefined || id === "") return true;
  const employees = await getSupportEmployees();
  return employees.some((employee) => String(employee._id) === String(id));
};

module.exports = {
  DELETION_CATEGORY,
  categoryOfContactRequest,
  getSupportEmployees,
  getAssociates,
  assignTicket,
  isAssignableEmployeeId,
};