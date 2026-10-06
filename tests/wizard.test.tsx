import { it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import App from "../src/App";
import * as storage from "../src/lib/storage";
vi.mock("../src/components/Preview", () => ({ Preview: () => null }));
vi.mock("../src/lib/storage", () => ({
  listProjects: vi.fn(async () => []),
  saveProject: vi.fn(async () => {}),
  deleteProject: vi.fn(async () => {}),
}));
it("guides a merchant through the seven steps with persistent language and facts", async () => {
  const user = userEvent.setup();
  render(<App />);
  await waitFor(() => expect(storage.listProjects).toHaveBeenCalled());
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Interface language / ភាសា" }),
    "en",
  );
  await user.type(
    screen.getByLabelText("Shop / business name *"),
    "Sunrise Market",
  );
  await user.type(screen.getByLabelText("Product / service name *"), "Bananas");
  await user.selectOptions(screen.getByLabelText("Currency"), "both");
  await user.type(screen.getByLabelText("Khmer riel (KHR)"), "2000");
  await user.type(screen.getByLabelText("US dollar (USD)"), "0.50");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(
    screen.getByRole("heading", { name: "Show what you sell" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Your business" }),
  ).toHaveAccessibleName("Your business");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.type(
    screen.getByLabelText("Product description"),
    "Fresh bananas from our garden.",
  );
  await user.click(screen.getByRole("button", { name: "Arrange my copy" }));
  expect(
    screen.getByLabelText("Khmer caption — edit before export"),
  ).toHaveValue("Fresh bananas from our garden.");
  await user.selectOptions(screen.getByLabelText("Story language"), "both");
  expect(
    screen.getByLabelText("English caption — edit before export"),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("button", { name: "Khmer Sunrise" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await user.click(screen.getByRole("button", { name: "Night Market" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Record narration" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Microphone permission",
  );
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(
    screen.getByText(/does not process, verify or confirm payments/),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(
    screen.getByRole("button", { name: "Download story image (PNG)" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("at least one photo");
  expect(localStorage.getItem("shop-story-language")).toBe("en");
});
it("uses labelled inputs and accessible navigation in the first step", async () => {
  localStorage.setItem("shop-story-language", "en");
  const { container } = render(<App />);
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Your business" }),
    ).toBeInTheDocument(),
  );
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  expect(results.violations).toEqual([]);
});
