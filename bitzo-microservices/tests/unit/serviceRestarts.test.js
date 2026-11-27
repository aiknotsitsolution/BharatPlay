const { createServiceRestarter } = require("../../scripts/serviceRestarts");

describe("service restarts", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("restarts exited services with capped backoff", () => {
    jest.useFakeTimers();
    const restartService = jest.fn();
    const logger = { error: jest.fn() };
    const restarter = createServiceRestarter(restartService, logger);
    const service = ["video-service", "services/video-service", 5003];

    restarter.restartAfterExit(service);
    expect(logger.error).toHaveBeenLastCalledWith(
      "[video-service] restarting in 1s (attempt 1)",
    );

    jest.advanceTimersByTime(1000);
    expect(restartService).toHaveBeenCalledWith(service);

    restarter.restartAfterExit(service);
    expect(logger.error).toHaveBeenLastCalledWith(
      "[video-service] restarting in 2s (attempt 2)",
    );

    for (let attempt = 3; attempt <= 7; attempt += 1) {
      restarter.restartAfterExit(service);
    }
    expect(logger.error).toHaveBeenLastCalledWith(
      "[video-service] restarting in 30s (attempt 7)",
    );

    restarter.restartAfterExit(service, 60000);
    expect(logger.error).toHaveBeenLastCalledWith(
      "[video-service] restarting in 1s (attempt 1)",
    );
    restarter.stop();
  });

  test("cancels pending restarts when the runner stops", () => {
    jest.useFakeTimers();
    const restartService = jest.fn();
    const restarter = createServiceRestarter(restartService, {
      error: jest.fn(),
    });

    restarter.restartAfterExit(["admin-service", "services/admin-service", 5002]);
    restarter.stop();
    jest.advanceTimersByTime(1000);

    expect(restartService).not.toHaveBeenCalled();
  });
});
