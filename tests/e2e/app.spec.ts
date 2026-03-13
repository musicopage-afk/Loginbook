import fs from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { resetE2EData, type E2EFixture } from "./reset";

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true
  });
}

async function login(page: Page, fixture: E2EFixture) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(fixture.adminEmail);
  await page.getByLabel("Password").fill(fixture.adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/logbooks\/[^/]+$/);
}

async function readDownload(download: Awaited<ReturnType<Page["waitForEvent"]>>) {
  const filePath = await download.path();
  if (!filePath) {
    throw new Error("Download path was not available");
  }

  return fs.readFile(filePath, "utf8");
}

let fixture: E2EFixture;

test.beforeEach(async () => {
  fixture = await resetE2EData();
});

test("shows direct login errors for wrong password and unknown email", async ({ page }, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(fixture.adminEmail);
  await page.getByLabel("Password").fill("WrongPassword123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid password")).toBeVisible();
  await capture(page, testInfo, "invalid-password");

  await page.getByLabel("Email").fill("missing@loginbook.local");
  await page.getByLabel("Password").fill(fixture.adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email address not found")).toBeVisible();
  await capture(page, testInfo, "unknown-email");
});

test("supports the core admin workflow end to end", async ({ page }, testInfo) => {
  const createdEntryTitle = "Main Gate";
  const createdEntryBody = "Visitor signed out after the evening shift handover.";
  const updatedEntryBody = "Visitor signed out after confirming all handover notes were complete.";

  await login(page, fixture);
  await expect(page.getByRole("heading", { name: fixture.logbookName })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Log Book");
  await capture(page, testInfo, "dashboard");
  await expect(page.getByText(fixture.seededEntryName)).toBeVisible();
  await capture(page, testInfo, "logbook-overview");

  const [existingLogbookCsv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export CSV" }).click()
  ]);
  const existingLogbookCsvText = await readDownload(existingLogbookCsv);
  expect(existingLogbookCsv.suggestedFilename()).toContain("logbook-");
  expect(existingLogbookCsvText).toContain(fixture.seededEntryName);

  await page.getByRole("link", { name: "Create log" }).click();
  await expect(page.getByRole("heading", { name: "Create log" })).toBeVisible();

  await page.getByLabel("Name").fill(createdEntryTitle);
  await page.getByRole("button", { name: /Entry or Exit/i }).click();
  await page.getByRole("option", { name: "Exit" }).click();
  await page.getByLabel("Reason").fill(createdEntryBody);
  await page.getByLabel("Authorised by").fill(fixture.adminDisplayName);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/logbooks/") && response.status() === 201),
    page.getByRole("button", { name: "Create log" }).click()
  ]);

  const entryEmbed = page.locator(".embed");
  await expect(page).toHaveURL(/\/entries\//);
  await expect(page.getByText(`${createdEntryTitle} | Exit`)).toBeVisible();
  await expect(entryEmbed.getByText(createdEntryBody)).toBeVisible();
  await expect(entryEmbed.getByText(fixture.adminDisplayName)).toBeVisible();
  await capture(page, testInfo, "entry-created");

  await page.locator(".topbar").getByRole("link", { name: "Log Book" }).click();
  const createdLogRow = page.locator(".entry-row").filter({ hasText: createdEntryTitle });
  await expect(createdLogRow).toBeVisible();
  await capture(page, testInfo, "entry-listed");

  await createdLogRow.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit log" })).toBeVisible();
  await page.getByLabel("Reason").fill(updatedEntryBody);
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/entries/") && response.ok()),
    page.getByRole("button", { name: "Save changes" }).click()
  ]);
  await expect(page.locator(".embed").getByText(updatedEntryBody)).toBeVisible();
  await capture(page, testInfo, "entry-edited");

  await page.locator(".topbar").getByRole("link", { name: "Log Book" }).click();
  const updatedLogRow = page.locator(".entry-row").filter({ hasText: createdEntryTitle });
  await updatedLogRow.getByRole("button", { name: "Delete" }).click();
  const deleteDialog = page.getByRole("dialog");
  await expect(deleteDialog).toBeVisible();
  await capture(page, testInfo, "delete-modal");
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/entries/") &&
        response.request().method() === "DELETE" &&
        response.ok()
    ),
    deleteDialog.getByRole("button", { name: "Delete" }).click()
  ]);
  await page.reload();
  await expect(page.getByText(createdEntryTitle)).toHaveCount(0);
  await capture(page, testInfo, "entry-deleted");

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await capture(page, testInfo, "logged-out");
});
