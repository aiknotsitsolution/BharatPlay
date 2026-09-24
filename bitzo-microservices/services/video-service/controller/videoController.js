const Video = require("../models/Videomodel");
const User = require("../models/usermodel");
const categoryModel = require("../models/CategoryModel/category.model");
const { getVideoDuration } = require("../utils/mediaDuration");

const fs = require("fs");

/**
 * ✏️ Update Video
 */
exports.updateVideoupdated = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      duration,
      category,
      subCategory,
    } = req.body;

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (video.uploadedBy?.toString() !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this video",
      });
    }

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (type) video.videoType = [type];
    if (duration) video.duration = Number(duration);
    if (category) video.category = category;         // ✅ update category
    if (subCategory) video.subCategory = subCategory; // ✅ update subCategory

    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      video.videoUrl = filePath;

      // Authoritative duration for re-uploaded media. Never blocks the update.
      let authoritativeDuration = null;
      try {
        authoritativeDuration = await getVideoDuration(filePath);
        if (!authoritativeDuration) {
          console.error("[mediaDuration] Could not determine duration for:", filePath);
        }
      } catch (err) {
        console.error("[mediaDuration] Duration extraction failed:", err.message);
      }
      if (authoritativeDuration) video.duration = authoritativeDuration;
    }

    await video.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fullVideoUrl = `${baseUrl}/${video.videoUrl}`;

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video: {
        ...video.toObject(),
        videoUrl: fullVideoUrl,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during update",
      error: error.message,
    });
  }
};




exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const {
      title,
      description,
      type,
      duration,
      category,
      // subCategory removed
    } = req.body;

    // Normalize content type (short/long). Defaults to long for backward compatibility.
    const videoType = type === "short" || type === "long" ? [type] : ["long"];

    const filePath = req.file.path.replace(/\\/g, "/");

    // Authoritative duration from the media file; falls back to the client
    // value. Never throws/fails the upload when extraction is not possible.
    let authoritativeDuration = null;
    try {
      authoritativeDuration = await getVideoDuration(filePath);
      if (!authoritativeDuration) {
        console.error("[mediaDuration] Could not determine duration for:", filePath);
      }
    } catch (err) {
      console.error("[mediaDuration] Duration extraction failed:", err.message);
    }

    const video = await Video.create({
      title,
      description: description || "",
      videoType,
      duration: authoritativeDuration || (duration ? Number(duration) : undefined),
      category,            // only category is saved now
      creator: req.user.id,
      uploadedBy: req.user.id,
      videoUrl: filePath,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fullVideoUrl = `${baseUrl}/${filePath}`;

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: {
        ...video.toObject(),
        videoUrl: fullVideoUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during upload",
      error: error.message,
    });
  }
};


exports.getAllVideos = async (req, res) => {
  try {
    // Optional videoType filter: ?videoType=short | ?videoType=long
    // No query param preserves the previous behaviour (all videos).
    const filter = {};
    if (req.query.videoType && ["short", "long"].includes(req.query.videoType)) {
      filter.videoType = req.query.videoType;
    }

    // Fetch all videos, populate only category name, newest first
    const videos = await Video.find(filter)
      .populate({ path: "category", select: "name", model: categoryModel })        // only category name
      .populate({ path: "uploadedBy", select: "name email", model: User })
      .populate("channel", "name handle")
      .sort({ createdAt: -1 });

    // Get the base URL for the server
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Add full video URL for frontend consumption
    const updatedVideos = assertEnrichedVideos.map((video) => {
      const videoObj = video.toObject();
      return {
        ...videoObj,
        videoUrl: videoObj.videoUrl?.startsWith("http")
          ? videoObj.videoUrl
          : `${baseUrl}/${videoObj.videoUrl}`, // assuming videoUrl is stored as relative path
      };
    });

    res.status(200).json({
      success: true,
      count: updatedVideos.length,
      videos: updatedVideos,
    });

  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching videos",
      error: error.message, // optional: only in development
    });
  }
};

exports.editMyVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      title,
      description,
      type,
      duration,
      category,
      subCategory,
    } = req.body;

    const video = await Video.findOne({
      _id: id,
      $or: [{ uploadedBy: userId }, { creator: userId }],
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found or not authorized",
      });
    }

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (type) video.type = type;
    if (duration) video.duration = Number(duration);
    if (category) video.category = category;
    if (subCategory) video.subCategory = subCategory;

    // 🎥 If new video uploaded
    if (req.file) {
      const filePath = req.file.path.replace(/\\/g, "/");
      video.videoUrl = filePath;
    }

    await video.save();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      video: {
        ...video.toObject(),
        videoUrl: `${baseUrl}/${video.videoUrl}`,
      },
    });
  } catch (error) {
    console.error("Edit my video error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.deleteMyVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await Video.findOne({
      _id: id,
      $or: [{ uploadedBy: userId }, { creator: userId }],
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found or not authorized",
      });
    }

    // 🗑️ Delete video file from server
    if (video.videoUrl && fs.existsSync(video.videoUrl)) {
      fs.unlinkSync(video.videoUrl);
    }

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete my video error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



exports.getMyVideos = async (req, res) => {
  try {
    const userId = req.user.id;

    const videos = await Video.find({ $or: [{ uploadedBy: userId }, { creator: userId }] })
      .populate({ path: "category", select: "name", model: categoryModel })
      .populate({ path: "subCategory", select: "name", model: categoryModel })
      .sort({ createdAt: -1 });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const updatedVideos = videos.map((video) => {
      const videoObj = video.toObject();
      return {
        ...videoObj,
        videoUrl: videoObj.videoUrl?.startsWith("http")
          ? videoObj.videoUrl
          : `${baseUrl}/${videoObj.videoUrl}`,
      };
    });

    res.status(200).json({
      success: true,
      count: updatedVideos.length,
      videos: updatedVideos,
    });
  } catch (error) {
    console.error("Get my videos error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 📄 Get Single Video by ID
 */
exports.getSingleVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    res.status(200).json({
      success: true,
      video
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 🗑️ Delete Video
 */
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    if (video.uploadedBy?.toString() !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this video"
      });
    }

    await video.deleteOne();

    res.status(200).json({
      success: true,
      message: "Video deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



