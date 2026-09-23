const { getAssociates } = require("../services/assignmentService");

exports.getSupportAssociates = async (req, res) => {
  try {
    const associates = await getAssociates();
    return res.status(200).json({ success: true, associates });
  } catch (err) {
    console.error("[associates] Fetch error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch support associates." });
  }
};