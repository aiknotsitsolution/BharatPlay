import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/context/useTheme", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

vi.mock("../src/components/public/LegalPageLayout", () => ({
  default: ({ children, title }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

vi.mock("../src/features/support/api", () => ({
  deleteMyAccount: vi.fn(),
  submitDeletionRequest: vi.fn(),
}));

import { submitDeletionRequest } from "../src/features/support/api";
import DeleteAccountPage from "../src/pages/public-site/DeleteAccountPage";

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
    render(
      <MemoryRouter>
        <DeleteAccountPage />
      </MemoryRouter>,
    );

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
