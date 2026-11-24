import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

vi.mock("../../../components/public/LegalPageLayout", () => ({
  default: ({ children, title }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

vi.mock("../../../api/support", () => ({
  deleteMyAccount: vi.fn(),
  submitDeletionRequest: vi.fn(),
}));

import { submitDeletionRequest } from "../../../api/support";
import DeleteAccountPage from "./DeleteAccountPage";

describe("DeleteAccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    submitDeletionRequest.mockResolvedValue({
      success: true,
      requestId: "507f1f77bcf86cd799439011",
    });
  });

  it("submits a deletion request only after the user confirms", async () => {
    render(<DeleteAccountPage />);

    fireEvent.change(screen.getByLabelText("Email Address *"), {
      target: { value: "member@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request Account Deletion" }));

    expect(submitDeletionRequest).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm Deletion Request" }),
    );

    await waitFor(() => {
      expect(submitDeletionRequest).toHaveBeenCalledTimes(1);
    });
  });
});
