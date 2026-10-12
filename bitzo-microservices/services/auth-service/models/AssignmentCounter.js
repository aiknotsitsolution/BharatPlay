const mongoose = require("mongoose");

// Tracks the last round-robin index per assignment category so that fair
// distribution survives process restarts ($inc is atomic per category).
const assignmentCounterSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  lastAssignedIndex: { type: Number, default: -1 },
});

module.exports = mongoose.model("AssignmentCounter", assignmentCounterSchema);