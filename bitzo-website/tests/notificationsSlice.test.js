import { configureStore } from "@reduxjs/toolkit";
import { afterEach, describe, expect, it, vi } from "vitest";
import notificationsReducer, {
  fetchNotifications,
} from "../src/features/notifications/notificationsSlice";

describe("notification authentication", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("refreshes an expired access token before retrying notification requests", async () => {
    localStorage.setItem("token", "expired-token");
    const fetchMock = vi.fn(async (url, options) => {
      if (String(url).endsWith("/api/refresh")) {
        expect(options.credentials).toBe("include");
        return {
          ok: true,
          json: async () => ({ token: "refreshed-token" }),
        };
      }

      if (options.headers.Authorization === "Bearer expired-token") {
        return { ok: false, status: 401 };
      }

      expect(options.headers.Authorization).toBe("Bearer refreshed-token");
      expect(options.credentials).toBe("include");
      return {
        ok: true,
        json: async () => ({
          success: true,
          notifications: [{ _id: "notification-1" }],
          unreadCount: 1,
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    const store = configureStore({
      reducer: { notifications: notificationsReducer },
    });
    const result = await store.dispatch(fetchNotifications());

    expect(fetchNotifications.fulfilled.match(result)).toBe(true);
    expect(store.getState().notifications.unreadCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not call the API when no user token exists", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const store = configureStore({
      reducer: { notifications: notificationsReducer },
    });
    const result = await store.dispatch(fetchNotifications());

    expect(fetchNotifications.rejected.match(result)).toBe(true);
    expect(result.payload).toBe("No token found. Please login first.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
