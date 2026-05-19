import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('shows login form', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button.btn')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button.btn');
    await expect(page).toHaveURL(/\/admin\/login\?error=/);
    await expect(page.locator('.admin-error')).toBeVisible();
  });

  test('health endpoint returns 200', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBeDefined();
  });

  test('admin API returns 401 without session', async ({ request }) => {
    const res = await request.get('/api/admin/cms/pages');
    expect(res.status()).toBe(401);
  });

  test('admin API rejects cross-origin POST', async ({ request }) => {
    const res = await request.post('/api/admin/cms/pages', {
      headers: { 'Origin': 'https://evil.com', 'Content-Type': 'application/json' },
      data: { data: { title: 'test' } },
    });
    expect(res.status()).toBe(403);
  });
});
