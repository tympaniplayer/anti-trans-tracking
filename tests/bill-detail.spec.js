const { test, expect } = require('@playwright/test');

test.describe('Bill Detail Page', () => {
  test('loads a bill via homepage navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await expect(page).toHaveURL(/bill\.html\?id=/);
    await expect(page.locator('.bill-detail h2')).not.toBeEmpty();
  });

  test('displays category tags', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
    await expect(page.locator('.bill-detail-tags .cat-tag').first()).toBeVisible();
  });

  test('displays status badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
    await expect(page.locator('.status-badge')).toBeVisible();
  });

  test('displays sentiment badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
    await expect(page.locator('.bill-detail-tags .sentiment-badge')).toBeVisible();
  });

  test('displays summary section', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
    await expect(page.locator('.bill-detail')).toContainText('Summary');
  });

  test('displays latest action', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
    await expect(page.locator('.bill-detail')).toContainText('Latest Action');
  });

  test('has external link to LegiScan', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
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
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.back-link');
    await page.click('.back-link');
    await expect(page).toHaveURL(/index\.html/);
  });

  test('sets page title to bill number', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    const billId = await page.locator('.bill-card').first().locator('.bill-card-id').textContent();
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.bill-detail h2');
    await expect(page).toHaveTitle(new RegExp(billId.trim()));
  });
});
