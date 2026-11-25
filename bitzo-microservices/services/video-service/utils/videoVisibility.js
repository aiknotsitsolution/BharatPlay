const mongoose = require("mongoose");
const User = require("../models/usermodel");
const Channel = require("../models/Channel/ChannelModel");
const { cached } = require("../../../services/caching");

const RESTRICTED_ACCOUNT_STATUSES = ["suspended", "banned", "deleted"];
const RESTRICTED_CONTENT_CACHE_TTL_SECONDS = 3;

async function getRestrictedContentIds() {
  return cached(
    "video:restricted-content-ids",
    RESTRICTED_CONTENT_CACHE_TTL_SECONDS,
    async () => {
      const userIds = await User.distinct("_id", {
        status: { $in: RESTRICTED_ACCOUNT_STATUSES },
      });
      const [ownerChannelIds, inactiveChannelIds] = await Promise.all([
        userIds.length
          ? Channel.distinct("_id", { creator: { $in: userIds } })
          : [],
        Channel.distinct("_id", { status: { $ne: "active" } }),
      ]);

      return {
        userIds,
        channelIds: [
          ...new Set([...ownerChannelIds, ...inactiveChannelIds].map(String)),
        ],
      };
    },
  );
}

async function withVisibleVideoFilter(filter = {}) {
  const { userIds, channelIds } = await getRestrictedContentIds();
  const toObjectIds = (ids) =>
    ids
      .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));
  const restrictedUserIds = toObjectIds(userIds);
  const restrictedChannelIds = toObjectIds(channelIds);

  return {
    $and: [
      filter,
      { status: "active" },
      ...(restrictedUserIds.length
        ? [
            { uploadedBy: { $nin: restrictedUserIds } },
            { creator: { $nin: restrictedUserIds } },
          ]
        : []),
      ...(restrictedChannelIds.length
        ? [{ channel: { $nin: restrictedChannelIds } }]
        : []),
    ],
  };
}

module.exports = { getRestrictedContentIds, withVisibleVideoFilter };
