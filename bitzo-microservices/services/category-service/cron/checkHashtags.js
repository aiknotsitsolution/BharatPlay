const cron = require("node-cron");
const { checkAndConvertHashtags } = require("../config/categoryConverter");

// Run every day at 2 AM
const startHashtagCron = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("Running daily hashtag threshold check...");
    await checkAndConvertHashtags();
  });
  console.log("Hashtag cron job scheduled");
};

module.exports = startHashtagCron;
