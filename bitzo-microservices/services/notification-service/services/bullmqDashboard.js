const { timingSafeEqual } = require("node:crypto");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { createBullBoard } = require("@bull-board/api");
const { ExpressAdapter } = require("@bull-board/express");
const { getQueue } = require("../../../services/Queues");

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createDashboardAuth() {
  const expectedUser = process.env.BULL_BOARD_USER || "admin";
  const expectedPassword = process.env.BULL_BOARD_PASSWORD;
  if (!expectedPassword) {
    throw new Error("BULL_BOARD_PASSWORD is required for the BullMQ dashboard.");
  }

  return (req, res, next) => {
    const [scheme, encodedCredentials] = (req.get("authorization") || "").split(
      " ",
      2,
    );
    if (scheme !== "Basic" || !encodedCredentials) {
      res.set("WWW-Authenticate", 'Basic realm="BullMQ dashboard"');
      return res.status(401).end();
    }

    const decoded = Buffer.from(encodedCredentials, "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    const user = separator >= 0 ? decoded.slice(0, separator) : "";
    const password = separator >= 0 ? decoded.slice(separator + 1) : "";
    if (
      !constantTimeEqual(user, expectedUser) ||
      !constantTimeEqual(password, expectedPassword)
    ) {
      res.set("WWW-Authenticate", 'Basic realm="BullMQ dashboard"');
      return res.status(401).end();
    }
    return next();
  };
}

function mountBullMQDashboard(app) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");
  createBullBoard({
    queues: [new BullMQAdapter(getQueue("notifications"))],
    serverAdapter,
  });
  app.use(
    "/admin/queues",
    createDashboardAuth(),
    serverAdapter.getRouter(),
  );
}

module.exports = { mountBullMQDashboard };
