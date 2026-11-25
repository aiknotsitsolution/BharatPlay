import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { toast as hotToast, Toaster } from "react-hot-toast";
import { toast } from "../src/utils/toast";

afterEach(() => {
  act(() => {
    hotToast.dismiss();
  });
  cleanup();
});

describe("branded toast notifications", () => {
  test.each([
    ["success", "status"],
    ["info", "status"],
    ["error", "alert"],
  ])("renders %s notifications with branded styling", async (type, role) => {
    render(<Toaster />);
    const message = `${type} notification`;

    act(() => {
      toast[type](message);
    });

    const messageElement = await screen.findByText(message);
    const notification = messageElement.closest(`[role="${role}"]`);
    const icon = notification.querySelector('[aria-hidden="true"]');

    expect(notification).toHaveTextContent(message);
    expect(messageElement).toHaveStyle({ fontSize: "13px" });
    expect(icon.style.background).toContain("linear-gradient");
    expect(icon.style.background).toContain("rgb(255, 120, 63)");
  });
});
