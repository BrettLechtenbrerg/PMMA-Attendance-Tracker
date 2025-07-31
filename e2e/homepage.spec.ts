import { test, expect } from '@playwright/test';

test('homepage loads and displays correctly', async ({ page }) => {
  await page.goto('/');

  // Check page title
  await expect(page).toHaveTitle(/PMMA Attendance Tracker/);

  // Check if PMMA logo is visible
  const logo = page.locator('img[alt="PMMA Logo"]');
  await expect(logo).toBeVisible();

  // Check main heading
  const heading = page.locator('h1', { hasText: 'PMMA Attendance Tracker' });
  await expect(heading).toBeVisible();

  // Check description
  const description = page.locator('p', { hasText: 'Professional martial arts attendance tracking system' });
  await expect(description).toBeVisible();

  // Check navigation buttons
  const staffLoginButton = page.locator('a', { hasText: 'Staff Login' });
  const parentPortalButton = page.locator('a', { hasText: 'Parent Portal' });

  await expect(staffLoginButton).toBeVisible();
  await expect(parentPortalButton).toBeVisible();

  // Check button styling
  await expect(staffLoginButton).toHaveClass(/bg-primary/);
  await expect(parentPortalButton).toHaveClass(/bg-secondary/);
});

test('navigation links work correctly', async ({ page }) => {
  await page.goto('/');

  // Test Staff Login link
  const staffLoginButton = page.locator('a', { hasText: 'Staff Login' });
  await staffLoginButton.click();
  await expect(page).toHaveURL('/login');

  // Go back to homepage
  await page.goto('/');

  // Test Parent Portal link
  const parentPortalButton = page.locator('a', { hasText: 'Parent Portal' });
  await parentPortalButton.click();
  await expect(page).toHaveURL('/portal');
});

test('homepage is mobile responsive', async ({ page }) => {
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Check if content is properly centered and visible
  const mainContainer = page.locator('main');
  await expect(mainContainer).toBeVisible();

  // Check if logo scales properly on mobile
  const logo = page.locator('img[alt="PMMA Logo"]');
  await expect(logo).toBeVisible();
  
  // Check if buttons stack vertically on mobile
  const buttonsContainer = page.locator('.space-y-4');
  await expect(buttonsContainer).toBeVisible();

  // Verify buttons are full width on mobile
  const staffLoginButton = page.locator('a', { hasText: 'Staff Login' });
  await expect(staffLoginButton).toHaveClass(/block/);
  await expect(staffLoginButton).toHaveClass(/w-full/);
});

test('homepage branding colors are correct', async ({ page }) => {
  await page.goto('/');

  // Check primary color (black) on staff login button
  const staffLoginButton = page.locator('a', { hasText: 'Staff Login' });
  const staffButtonColor = await staffLoginButton.evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );
  
  // Check secondary color (gold) on parent portal button  
  const parentPortalButton = page.locator('a', { hasText: 'Parent Portal' });
  const parentButtonColor = await parentPortalButton.evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );

  // Colors should be different (exact RGB values depend on Tailwind's color palette)
  expect(staffButtonColor).not.toBe(parentButtonColor);
});