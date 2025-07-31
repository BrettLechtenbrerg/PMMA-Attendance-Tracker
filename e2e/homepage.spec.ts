import { test, expect } from '@playwright/test';

test('homepage redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/');

  // Should redirect to login page
  await expect(page).toHaveURL('/login');

  // Check page title
  await expect(page).toHaveTitle(/PMMA Attendance Tracker/);
});

test('login page loads correctly after redirect', async ({ page }) => {
  await page.goto('/');

  // Wait for redirect
  await expect(page).toHaveURL('/login');

  // Check if login form is visible
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const signInButton = page.locator('button[type="submit"]');

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(signInButton).toBeVisible();
});