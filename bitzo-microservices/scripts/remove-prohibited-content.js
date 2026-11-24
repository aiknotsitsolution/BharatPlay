require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const uri = process.env.VIDEO_MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("Missing VIDEO_MONGODB_URI or MONGO_URI.");
  process.exit(1);
}

const prohibitedPatterns = [
  /kapil/i,
  /cartoon/i,
  /shinchan/i,
  /movie/i,
  /test\s*1/i,
];

async function removeProhibitedContent() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const videos = db.collection("videos");
  const channels = db.collection("channels");

  const cursor = videos.find(
    {
      $or: [
        { title: { $regex: prohibitedPatterns.map((pattern) => pattern.source).join("|"), $options: "i" } },
        { description: { $regex: prohibitedPatterns.map((pattern) => pattern.source).join("|"), $options: "i" } },
      ],
    },
    { projection: { _id: 1, title: 1, channel: 1 } },
  );

  const matches = await cursor.toArray();
  const ids = matches.map((video) => video._id);

  if (ids.length) {
    await videos.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "disabled", disableReason: "Launch compliance cleanup" } },
    );
  }

  console.log(`Disabled ${ids.length} prohibited or test video(s).`);
  await mongoose.disconnect();
}

removeProhibitedContent().catch(async (error) => {
  console.error("Prohibited-content cleanup failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
