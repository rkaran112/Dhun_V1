import { test, expect } from "@playwright/test";

test("happy path: search, log, and see recent activity", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("MUSICD_E2E_TEST_USER", "true");
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Log an album" }),
  ).toBeVisible();

  const searchInput = page.getByPlaceholder(
    "Search for an album (e.g., Daft Punk - Discovery)",
  );
  await searchInput.fill("Daft Punk - Discovery");
  await page.getByRole("button", { name: "Search" }).click();

  const albumCard = page.getByText("Discovery").first();
  await expect(albumCard).toBeVisible();

  await page.getByRole("button", { name: "Log" }).click();

  await expect(page.getByRole("heading", { name: "Log this album" })).toBeVisible();

  await page.getByRole("button", { name: "Save log" }).click();

  await expect(
    page.getByRole("heading", { name: "Recent activity" }),
  ).toBeVisible();

  await expect(page.getByText("Discovery").first()).toBeVisible();
});
