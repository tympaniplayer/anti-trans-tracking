const { test, expect } = require('@playwright/test');

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bill-card');
  });

  test('has a visible search input', async ({ page }) => {
    await expect(page.locator('#search-input')).toBeVisible();
  });

  test('filters bills when typing a keyword', async ({ page }) => {
    await page.fill('#search-input', 'healthcare');
    await page.waitForTimeout(300);
    const count = await page.locator('.bill-card').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(12);
  });

  test('finds bills by state name', async ({ page }) => {
    await page.fill('#search-input', 'Texas');
    await page.waitForTimeout(300);
    const count = await page.locator('.bill-card').count();
    expect(count).toBeGreaterThan(0);
    await expect(page.locator('.bill-card').first()).toContainText('Texas');
  });

  test('finds bills by bill number', async ({ page }) => {
    await page.fill('#search-input', 'SB 14');
    await page.waitForTimeout(300);
    const count = await page.locator('.bill-card').count();
    expect(count).toBeGreaterThan(0);
    // Verify SB 14 appears somewhere in the results (fuzzy search may reorder)
    await expect(page.locator('.bill-card:has-text("SB 14")').first()).toBeVisible();
  });

  test('shows clear button when text is entered', async ({ page }) => {
    await expect(page.locator('#search-clear')).toBeHidden();
    await page.fill('#search-input', 'test');
    await expect(page.locator('#search-clear')).toBeVisible();
  });

  test('clears search and resets results', async ({ page }) => {
    await page.fill('#search-input', 'Texas');
    await page.waitForTimeout(300);
    expect(await page.locator('.bill-card').count()).toBeLessThan(12);
    await page.click('#search-clear');
    await expect(page.locator('#search-input')).toHaveValue('');
    await expect(page.locator('.bill-card')).toHaveCount(12);
  });

  test('shows no results for gibberish query', async ({ page }) => {
    await page.fill('#search-input', 'xyzzzqqqnotabill');
    await page.waitForTimeout(300);
    await expect(page.locator('.no-results')).toBeVisible();
  });

  test('updates result count', async ({ page }) => {
    await expect(page.locator('#results-count')).toContainText('12');
    await page.fill('#search-input', 'Texas');
    await page.waitForTimeout(300);
    await expect(page.locator('#results-count')).not.toContainText('12');
  });
});
