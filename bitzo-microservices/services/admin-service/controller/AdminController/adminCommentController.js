const mongoose = require("mongoose");
const Video = require("../../models/Videomodel");
const { logAuditEvent } = require("../../services/auditEventService");
const {
  invalidateCache,
  invalidateVideoCatalogCache,
} = require("../../../../services/caching");

const getCommentTarget = async (videoId, commentId, res) => {
  if (
    !mongoose.isValidObjectId(videoId) ||
    !mongoose.isValidObjectId(commentId)
  ) {
    res.status(400).json({ success: false, message: "Invalid video or comment ID" });
    return null;
  }

  const video = await Video.findById(videoId);
  if (!video) {
    res.status(404).json({ success: false, message: "Video not found" });
    return null;
  }

  const commentIndex = video.comments.findIndex(
    (comment) => String(comment._id) === String(commentId),
  );
  if (commentIndex < 0) {
    res.status(404).json({ success: false, message: "Comment not found" });
    return null;
  }

  return { video, commentIndex, comment: video.comments[commentIndex] };
};

const invalidateCommentCaches = async (videoId) => {
  await Promise.all([
    invalidateCache(`video-comments:${videoId}`),
    invalidateVideoCatalogCache(),
  ]);
};

exports.editVideoComment = async (req, res) => {
  try {
    const commentText =
      typeof req.body?.commentText === "string"
        ? req.body.commentText.trim()
        : "";
    if (!commentText) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text required" });
    }

    const target = await getCommentTarget(
      req.params.videoId,
      req.params.commentId,
      res,
    );
    if (!target) return;

    target.comment.text = commentText;
    await target.video.save();
    await invalidateCommentCaches(req.params.videoId);

    await logAuditEvent({
      userId: target.comment.user || null,
      eventType: "ADMIN_COMMENT_EDIT",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId: req.admin?._id,
        videoId: req.params.videoId,
        commentId: req.params.commentId,
        commentLength: commentText.length,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Comment updated",
      comment:
        typeof target.comment.toObject === "function"
          ? target.comment.toObject()
          : target.comment,
    });
  } catch (error) {
    console.error("editVideoComment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteVideoComment = async (req, res) => {
  try {
    const target = await getCommentTarget(
      req.params.videoId,
      req.params.commentId,
      res,
    );
    if (!target) return;

    const deletedComment = target.comment;
    target.video.comments.splice(target.commentIndex, 1);
    await target.video.save();
    await invalidateCommentCaches(req.params.videoId);

    await logAuditEvent({
      userId: deletedComment.user || null,
      eventType: "ADMIN_COMMENT_DELETE",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      metadata: {
        adminId: req.admin?._id,
        videoId: req.params.videoId,
        commentId: req.params.commentId,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("deleteVideoComment error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
