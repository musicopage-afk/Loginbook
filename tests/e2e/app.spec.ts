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
  await expect(page).toHaveURL(/\/logbooks$/);
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
  const createdLogbookName = "E2E Shift Logbook";
  const createdEntryTitle = "Generator inspection complete";
  const createdEntryBody = "Completed generator inspection and recorded meter readings.";

  await login(page, fixture);
  await expect(page.getByRole("heading", { name: "Logbooks" })).toBeVisible();
  await expect(page.getByText(fixture.operationsLogbookName)).toBeVisible();
  await capture(page, testInfo, "dashboard");

  await page.getByRole("link", { name: fixture.operationsLogbookName }).click();
  await expect(page.getByRole("heading", { name: fixture.operationsLogbookName })).toBeVisible();
  await expect(page.getByText(fixture.operationsEntryTitle)).toBeVisible();
  await capture(page, testInfo, "operations-logbook");

  const [existingLogbookCsv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export CSV" }).click()
  ]);
  const existingLogbookCsvText = await readDownload(existingLogbookCsv);
  expect(existingLogbookCsv.suggestedFilename()).toContain("logbook-");
  expect(existingLogbookCsvText).toContain(fixture.operationsEntryTitle);

  await page.getByRole("link", { name: "Logbooks" }).click();
  await page.getByLabel("Name").fill(createdLogbookName);
  await page.getByLabel("Type").fill("SHIFT");
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith("/api/logbooks") && response.status() === 201),
    page.getByRole("button", { name: "Create logbook" }).click()
  ]);
  await page.reload();
  await expect(page.getByRole("link", { name: createdLogbookName })).toBeVisible();
  await capture(page, testInfo, "logbook-created");

  await page.getByRole("link", { name: createdLogbookName }).click();
  await expect(page.getByRole("heading", { name: createdLogbookName })).toBeVisible();
  await page.getByRole("link", { name: "New entry" }).click();
  await expect(page.getByRole("heading", { name: "Create entry" })).toBeVisible();

  await page.getByLabel("Title").fill(createdEntryTitle);
  await page.getByLabel("Body").fill(createdEntryBody);
  await page.getByLabel("Occurred at").fill("2026-03-13T10:45");
  await page.getByLabel("Tags").fill("inspection,generator");
  await page.getByLabel("Structured fields JSON").fill("{\"severity\":\"info\",\"equipment\":\"Generator 2\"}");
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/logbooks/") && response.status() === 201),
    page.getByRole("button", { name: "Create entry" }).click()
  ]);

  await expect(page).toHaveURL(/\/entries\//);
  await expect(page.getByRole("heading", { name: createdEntryTitle })).toBeVisible();
  await expect(page.locator("p").filter({ hasText: createdEntryBody }).first()).toBeVisible();
  await expect(page.locator(".pill").filter({ hasText: "SUBMITTED" }).first()).toBeVisible();
  await capture(page, testInfo, "entry-created");

  await page.getByLabel("Approval note").fill("Approved after review");
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/approve") && response.ok()),
    page.getByRole("button", { name: "Approve and lock entry" }).click()
  ]);
  await expect(page.getByText(`Approved by ${fixture.adminDisplayName}`)).toBeVisible();
  await capture(page, testInfo, "entry-approved");

  await page.getByRole("link", { name: "Audit" }).click();
  await expect(page.getByRole("heading", { name: "Audit events" })).toBeVisible();
  await page.getByLabel("Action").fill("APPROVE");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("cell", { name: "APPROVE" }).first()).toBeVisible();
  await capture(page, testInfo, "audit-events");

  const [auditCsv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export audit CSV" }).click()
  ]);
  const auditCsvText = await readDownload(auditCsv);
  expect(auditCsv.suggestedFilename()).toBe("audit-events.csv");
  expect(auditCsvText).toContain("APPROVE");

  await page.getByRole("link", { name: "Logbooks" }).click();
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain(createdLogbookName);
    await dialog.accept();
  });
  const createdLogbookCard = page.locator("div.card").filter({
    has: page.getByRole("link", { name: createdLogbookName })
  });
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/logbooks/") && response.ok()),
    createdLogbookCard.getByRole("button", { name: "Delete" }).click()
  ]);
  await page.reload();
  await expect(page.getByRole("link", { name: createdLogbookName })).toHaveCount(0);
  await capture(page, testInfo, "logbook-deleted");

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await capture(page, testInfo, "logged-out");
});
