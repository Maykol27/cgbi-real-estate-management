import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-data';
import { loginAs } from './helpers/auth';

test.describe('User Management', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.goto('/admin/users'); // Assuming /admin/users or similar route for "Inquilinos"
    });

    test('TC-020: Register Tenant successfully', async ({ page }) => {
        await page.click('text=Inquilinos'); // Navigate tab
        await page.click('text=Registrar'); // Or "Nuevo Inquilino"

        const newEmail = `tenant_${Date.now()}@test.com`;

        await page.fill('input[name="name"]', 'Test Tenant ' + Date.now());
        await page.fill('input[name="email"]', newEmail);
        // Assuming password or other info might be needed, or it's auto-generated
        // Based on useStore/addUser, we might just need name and email + role which might be hidden if we are in "Inquilinos" section

        await page.click('button:has-text("Guardar")');

        await expect(page.locator(`text=${newEmail}`)).toBeVisible();
    });

    test('TC-021: Duplicate Email Validation', async ({ page }) => {
        await page.click('text=Inquilinos');
        await page.click('text=Registrar');

        await page.fill('input[name="name"]', 'Duplicate User');
        await page.fill('input[name="email"]', TEST_USERS.admin.email); // Use existing email

        await page.click('button:has-text("Guardar")');

        await expect(page.locator('text=User already exists')).toBeVisible(); // Or whatever error message
    });
});
