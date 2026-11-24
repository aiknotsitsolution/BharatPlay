const ContactRequest = require("../models/ContactRequest");
const User = require("../models/usermodel");
const Video = require("../models/Videomodel");

exports.submitContentReport = async (req, res) => {
  try {
    const videoId = String(req.body?.videoId || "").trim();
    const reason = String(req.body?.reason || "").trim();
    const details = String(req.body?.details || "").trim();

    if (!videoId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Video ID and report reason are required.",
      });
    }

    const video = await Video.findById(videoId).select("title uploadedBy").lean();
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found.",
      });
    }

    let reporterName = "App User";
    let reporterEmail = "";
    const userId = req.user?.id || null;
    if (userId) {
      const reporter = await User.findById(userId).select("name email").lean();
      reporterName = reporter?.name || reporterName;
      reporterEmail = reporter?.email || "";
    }

    const subject = `UGC content report: ${video.title || videoId}`;
    const message = [
      `Video ID: ${videoId}`,
      `Creator/Upload ID: ${video.uploadedBy || "Unknown"}`,
      `Reason: ${reason}`,
      details ? `Details: ${details}` : "Details: Not provided",
      "Please review this report and remove violating content within 24 hours.",
    ].join("\n");

    await ContactRequest.create({
      name: reporterName,
      email:
        reporterEmail ||
        `app-report-${String(userId || req.ip || "anonymous").replace(/[^a-zA-Z0-9]/g, "").slice(-40)}@reports.vidbuxapp.invalid`,
      inquiryType: "Complaint",
      subject: subject.slice(0, 150),
      message: message.slice(0, 5000),
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted. The content will be reviewed.",
    });
  } catch (error) {
    console.error("[content-report] Submit error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit the report.",
    });
  }
};
