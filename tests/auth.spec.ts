import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';
import { loginAs, logout } from './helpers/auth';

test.describe('Authentication & Authorization', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Should login successfully as Admin', async ({ page }) => {
        await loginAs(page, 'admin');
        await expect(page).toHaveURL(/\/admin\/dashboard/);
        await expect(page.locator('text=Bienvenido')).toBeVisible();
    });

    test('Should login successfully as Tenant', async ({ page }) => {
        // Note: Assuming the test user exists or mock login allows it
        await loginAs(page, 'tenant');
        await expect(page).toHaveURL(/\/tenant\/dashboard/);
    });

    test('Should login successfully as Owner', async ({ page }) => {
        await loginAs(page, 'owner');
        await expect(page).toHaveURL(/\/owner\/dashboard/);
    });

    // Since we are mocking login in the real app (based on StoreContext I recall seeing), these credentials might just work if the mock logic in App.tsx/StoreContext allows specific emails. 
    // If the app uses real Supabase login, these might fail if users don't exist in Supabase.
    // However, looking at Login.tsx, it calls `login(email, password)` from useStore.
    // I should check `StoreContext.tsx` to see if it hits Supabase or has mock logic.

    test('Should show error with invalid credentials', async ({ page }) => {
        await page.fill('input[type="email"]', 'wrong@test.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
        await expect(page).toHaveURL('/');
    });

    test('Should logout correctly', async ({ page }) => {
        await loginAs(page, 'admin');
        await logout(page);
        await expect(page).toHaveURL('/');
        // Verify we can't go back
        await page.goto('/#/admin/dashboard');
        // If route protection is improved, it should redirect to login. 
        // If not, this assertion might fail or need adjustment based on current app behavior.
        // For now, let's verify we are on login.
        await expect(page.locator('h1:has-text("Iniciar Sesión")')).toBeVisible();
    });
});
