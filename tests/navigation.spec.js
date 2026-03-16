const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test('header nav links to Tracker page from About', async ({ page }) => {
    await page.goto('/about.html');
    await page.click('.site-nav a:has-text("Tracker")');
    await expect(page).toHaveURL(/index\.html/);
    await expect(page.locator('.bill-card').first()).toBeVisible();
  });

  test('header nav links to About page from Tracker', async ({ page }) => {
    await page.goto('/');
    await page.click('.site-nav a:has-text("About")');
    await expect(page).toHaveURL(/about\.html/);
  });

  test('About page has correct content sections', async ({ page }) => {
    await page.goto('/about.html');
    await expect(page.locator('.about-content')).toContainText('About This Project');
    await expect(page.locator('.about-content')).toContainText('How It Works');
    await expect(page.locator('.about-content')).toContainText('Categories');
    await expect(page.locator('.about-content')).toContainText('Open Data');
  });

  test('About page has category table', async ({ page }) => {
    await page.goto('/about.html');
    await expect(page.locator('.about-table')).toBeVisible();
    const rows = await page.locator('.about-table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('About page has open data links', async ({ page }) => {
    await page.goto('/about.html');
    await expect(page.locator('a[href*="bills.json"]')).toBeVisible();
    await expect(page.locator('a[href*="states.json"]')).toBeVisible();
    await expect(page.locator('a[href*="metadata.json"]')).toBeVisible();
  });

  test('clicking a bill card navigates to detail page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await expect(page).toHaveURL(/bill\.html\?id=/);
    await expect(page.locator('.bill-detail h2')).not.toBeEmpty();
  });

  test('bill detail back link goes to main page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
    await page.locator('.bill-card').first().click();
    await page.waitForSelector('.back-link');
    await page.click('.back-link');
    await expect(page).toHaveURL(/index\.html/);
  });
});
