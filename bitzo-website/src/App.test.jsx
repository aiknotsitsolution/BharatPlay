import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the public home route without crashing", async () => {
    window.history.pushState({}, "", "/advanced-settings");

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });
  });

  test("renders the not-found page for an unknown route", async () => {
    window.history.pushState({}, "", "/route-that-does-not-exist");

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/page not found|not found/i),
      ).toBeInTheDocument();
    });
  });
});
