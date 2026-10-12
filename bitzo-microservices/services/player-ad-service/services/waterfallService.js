const AdNetwork = require("../models/VidooAds/AdNetwork");
const { fetchVast } = require("./vastService");
const { updateFillRate } = require("./fillRateService");

async function getAdFromWaterfall() {
  const networks = await AdNetwork.find({
    status: "active",
  }).sort({
    priority: 1,
  });

  if (!networks.length) {
    return null;
  }

  for (const network of networks) {
    console.log(`Trying ad network: ${network.name}`);

    const vast = await fetchVast(network);

    if (vast) {
      await updateFillRate(network._id, true);

      return {
        network,
        vast,
      };
    }

    await updateFillRate(network._id, false);
  }

  return null;
}

module.exports = {
  getAdFromWaterfall,
};
