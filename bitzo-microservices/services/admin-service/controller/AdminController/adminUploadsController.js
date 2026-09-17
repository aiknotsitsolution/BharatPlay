const Video = require("../../models/Videomodel");
const User = require("../../models/usermodel");
const categoryModel = require("../../models/CategoryModel/category.model");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ALLOWED_TYPES = ["all", "long", "short"];
const ALLOWED_SORT_FIELDS = ["createdAt", "views", "likesCount"];
const ALLOWED_SORT_ORDERS = ["asc", "desc"];

exports.getAdminUploads = async (req, res) => {
  try {
    // --- Pagination ---
    let page = Math.max(1, parseInt(req.query.page, 10) || 1);
    let limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    // --- Type filter ---
    const type = ALLOWED_TYPES.includes(req.query.type) ? req.query.type : "all";

    // --- Search ---
    let search = "";
    if (typeof req.query.search === "string") {
      search = req.query.search.trim().slice(0, 100);
    }
    const searchRegex = search ? new RegExp(escapeRegex(search), "i") : null;

    // --- Sorting ---
    const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = ALLOWED_SORT_ORDERS.includes(req.query.sortOrder)
      ? req.query.sortOrder
      : "desc";
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // --- Build match ---
    const buildMatch = (typeFilter) => {
      const match = {};
      if (typeFilter === "long") match.videoType = "long";
      else if (typeFilter === "short") match.videoType = "short";
      if (searchRegex) match.title = searchRegex;
      return match;
    };

    const paginatedMatch = buildMatch(type);

    // --- Global counts (always unfiltered by search) ---
    const countPipeline = (typeFilter) => {
      const m = {};
      if (typeFilter === "long") m.videoType = "long";
      else if (typeFilter === "short") m.videoType = "short";
      return [{ $match: m }, { $count: "total" }];
    };

    const [allCountResult, videosCountResult, shortsCountResult] =
      await Promise.all([
        Video.estimatedDocumentCount(),
        Video.aggregate(countPipeline("long")),
        Video.aggregate(countPipeline("short")),
      ]);

    const counts = {
      all: allCountResult || 0,
      videos: videosCountResult[0]?.total || 0,
      shorts: shortsCountResult[0]?.total || 0,
    };

    // --- Total for pagination (respects search + type) ---
    const totalResult = await Video.aggregate([
      { $match: paginatedMatch },
      { $count: "total" },
    ]);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // --- Fetch paginated items ---
    const items = await Video.find(paginatedMatch)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({ path: "category", select: "name", model: categoryModel })
      .populate({ path: "uploadedBy", select: "_id name email", model: User })
      .populate("channel", "_id name handle")
      .lean();

    // --- Add commentCount, strip comments ---
    const result = items.map((item) => {
      const { comments, ...rest } = item;
      return {
        ...rest,
        commentCount: Array.isArray(comments) ? comments.length : 0,
      };
    });

    return res.status(200).json({
      success: true,
      items: result,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      counts,
    });
  } catch (err) {
    console.error("getAdminUploads error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch uploads",
    });
  }
};
