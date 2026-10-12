import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // 20 users tak ramp up
    { duration: "1m", target: 50 }, // 50 concurrent users
    { duration: "30s", target: 100 }, // 100 users
    { duration: "1m", target: 100 }, // 100 users maintain
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% requests 500ms se kam
    errors: ["rate<0.05"], // error rate 5% se kam
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
  }) || errorRate.add(1);

  // 2. Root endpoint
  const rootRes = http.get(`${BASE_URL}/`);
  check(rootRes, {
    "root status is 200": (r) => r.status === 200,
  }) || errorRate.add(1);

  // 3. Koi important API (example)
  // const apiRes = http.get(`${BASE_URL}/api/auth/something`);
  // check(apiRes, { 'api status is 200': (r) => r.status === 200 }) || errorRate.add(1);

  sleep(1);
}
