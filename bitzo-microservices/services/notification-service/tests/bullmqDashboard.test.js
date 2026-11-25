jest.mock("../../../services/Queues", () => ({
  getQueue: jest.fn(),
}));

const { mountBullMQDashboard } = require("../services/bullmqDashboard");

describe("mountBullMQDashboard", () => {
  const originalPassword = process.env.BULL_BOARD_PASSWORD;

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.BULL_BOARD_PASSWORD;
    } else {
      process.env.BULL_BOARD_PASSWORD = originalPassword;
    }
  });

  it("does not mount an unauthenticated dashboard when no password is configured", () => {
    delete process.env.BULL_BOARD_PASSWORD;
    const app = { use: jest.fn() };

    expect(mountBullMQDashboard(app)).toBe(false);
    expect(app.use).not.toHaveBeenCalled();
  });
});
