const { test, expect } = require('@playwright/test');

test.describe('Bill Detail Page', () => {
  test('loads a valid bill', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await expect(page.locator('.bill-detail h2')).not.toBeEmpty();
    await expect(page.locator('.bill-detail')).toContainText('SB 14');
    await expect(page.locator('.bill-detail')).toContainText('Texas');
  });

  test('displays category tags', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await page.waitForSelector('.bill-detail h2');
    await expect(page.locator('.bill-detail-tags .cat-tag').first()).toBeVisible();
  });

  test('displays status badge', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('displays summary section', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await expect(page.locator('.bill-detail')).toContainText('Summary');
  });

  test('displays sponsors', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await expect(page.locator('.bill-detail')).toContainText('Sponsors');
    const sponsors = await page.locator('.sponsors-list li').count();
    expect(sponsors).toBeGreaterThan(0);
  });

  test('has external link to LegiScan', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await expect(page.locator('.bill-links a[href*="legiscan"]')).toBeVisible();
  });

  test('shows error for invalid bill ID', async ({ page }) => {
    await page.goto('/bill.html?id=99999');
    await expect(page.locator('.bill-detail')).toContainText('not found');
  });

  test('shows error when no ID provided', async ({ page }) => {
    await page.goto('/bill.html');
    await expect(page.locator('.bill-detail')).toContainText('No bill ID');
  });

  test('back link returns to main page', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await page.click('.back-link');
    await expect(page).toHaveURL(/index\.html/);
  });

  test('sets page title to bill number', async ({ page }) => {
    await page.goto('/bill.html?id=1001');
    await expect(page).toHaveTitle(/SB 14/);
  });
});
