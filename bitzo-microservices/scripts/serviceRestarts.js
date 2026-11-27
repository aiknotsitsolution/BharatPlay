function createServiceRestarter(restartService, logger = console) {
  const timers = new Set();
  const attempts = new Map();
  let stopped = false;

  function restartAfterExit(service, uptimeMs = 0) {
    if (stopped) return;

    const [name] = service;
    if (uptimeMs >= 60000) attempts.delete(name);

    const attempt = (attempts.get(name) || 0) + 1;
    attempts.set(name, attempt);
    const delay = Math.min(1000 * 2 ** Math.min(attempt - 1, 5), 30000);
    logger.error(
      `[${name}] restarting in ${delay / 1000}s (attempt ${attempt})`,
    );

    const timer = setTimeout(() => {
      timers.delete(timer);
      restartService(service);
    }, delay);
    timers.add(timer);
  }

  function stop() {
    stopped = true;
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  }

  return { restartAfterExit, stop };
}

module.exports = { createServiceRestarter };
