import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChannelVideoActions } from "../src/components/channels/ChannelPage";

describe("ChannelVideoActions", () => {
  it("opens the menu and calls the edit and delete handlers", () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { rerender } = render(
      <ChannelVideoActions
        isOpen={false}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Video actions" }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    rerender(
      <ChannelVideoActions
        isOpen
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
