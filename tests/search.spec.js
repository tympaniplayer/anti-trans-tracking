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
    const totalCount = await page.locator('.bill-card').count();
    await page.fill('#search-input', 'healthcare');
    await page.waitForTimeout(300);
    const count = await page.locator('.bill-card').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(totalCount);
  });

  test('finds bills by state name', async ({ page }) => {
    await page.fill('#search-input', 'Texas');
    await page.waitForTimeout(300);
    const count = await page.locator('.bill-card').count();
    expect(count).toBeGreaterThan(0);
    await expect(page.locator('.bill-card').first()).toContainText('Texas');
  });

  test('shows clear button when text is entered', async ({ page }) => {
    await expect(page.locator('#search-clear')).toBeHidden();
    await page.fill('#search-input', 'test');
    await expect(page.locator('#search-clear')).toBeVisible();
  });

  test('clears search and resets results', async ({ page }) => {
    const totalCount = await page.locator('.bill-card').count();
    await page.fill('#search-input', 'Texas');
    await page.waitForTimeout(300);
    expect(await page.locator('.bill-card').count()).toBeLessThan(totalCount);
    await page.click('#search-clear');
    await expect(page.locator('#search-input')).toHaveValue('');
    await expect(page.locator('.bill-card')).toHaveCount(totalCount);
  });

  test('shows no results for gibberish query', async ({ page }) => {
    await page.fill('#search-input', 'xyzzzqqqnotabill');
    await page.waitForTimeout(300);
    await expect(page.locator('.no-results')).toBeVisible();
  });

  test('updates result count', async ({ page }) => {
    const initialText = await page.locator('#results-count').textContent();
    await page.fill('#search-input', 'Texas');
    await page.waitForTimeout(300);
    const updatedText = await page.locator('#results-count').textContent();
    expect(updatedText).not.toBe(initialText);
  });
});
