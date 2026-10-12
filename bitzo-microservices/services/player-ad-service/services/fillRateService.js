const AdFillRate = require("../models/VidooAds/AdFillRate");

async function updateFillRate(networkId, filled) {
  let record = await AdFillRate.findOne({
    networkId,
  });

  if (!record) {
    record = new AdFillRate({
      networkId,
      requests: 0,
      filled: 0,
      fillRate: 0,
    });
  }

  record.requests += 1;

  if (filled) {
    record.filled += 1;
  }

  record.fillRate = record.requests > 0 ? record.filled / record.requests : 0;

  record.updatedAt = new Date();

  await record.save();

  return record;
}

module.exports = {
  updateFillRate,
};
