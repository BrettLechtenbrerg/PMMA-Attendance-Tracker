import { test, expect } from '@playwright/test';

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');

  // Check if the page title is correct
  await expect(page).toHaveTitle(/PMMA Attendance Tracker/);

  // Check if the PMMA logo is visible
  const logo = page.locator('img[alt="PMMA Logo"]');
  await expect(logo).toBeVisible();

  // Check if the main heading is present
  const heading = page.locator('h2', { hasText: 'Staff Login' });
  await expect(heading).toBeVisible();

  // Check if login form elements are present
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const signInButton = page.locator('button[type="submit"]');

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(signInButton).toBeVisible();
  await expect(signInButton).toContainText('Sign in');

  // Check if Parent Portal link is present
  const parentPortalLink = page.locator('button', { hasText: 'Parent Portal Access' });
  await expect(parentPortalLink).toBeVisible();
});

test('login form validation', async ({ page }) => {
  await page.goto('/login');

  // Try to submit empty form
  const signInButton = page.locator('button[type="submit"]');
  await signInButton.click();

  // Check if HTML5 validation prevents submission
  const emailInput = page.locator('input[type="email"]');
  const isEmailValid = await emailInput.evaluate((input: HTMLInputElement) => input.validity.valid);
  expect(isEmailValid).toBe(false);
});

test('login form interaction', async ({ page }) => {
  await page.goto('/login');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const signInButton = page.locator('button[type="submit"]');

  // Fill in the form
  await emailInput.fill('test@example.com');
  await passwordInput.fill('password123');

  // Check if form can be submitted (will fail due to no backend, but form should be valid)
  await signInButton.click();

  // Check if loading state is shown (button should be disabled during submission)
  await expect(signInButton).toBeDisabled();
});

test('parent portal navigation', async ({ page }) => {
  await page.goto('/login');

  const parentPortalButton = page.locator('button', { hasText: 'Parent Portal Access' });
  await parentPortalButton.click();

  // Should navigate to parent portal
  await expect(page).toHaveURL('/portal');
});

test('mobile responsive design', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/login');

  // Check if the layout is mobile-friendly
  const container = page.locator('.sm\\:mx-auto.sm\\:w-full.sm\\:max-w-md');
  await expect(container).toBeVisible();

  // Check if logo is still visible on mobile
  const logo = page.locator('img[alt="PMMA Logo"]');
  await expect(logo).toBeVisible();

  // Check if form elements are accessible on mobile
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
});