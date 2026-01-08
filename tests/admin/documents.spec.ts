import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Admin - Documents Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.click('text=Documentos');
    });

    test('Should list documents', async ({ page }) => {
        await expect(page.locator('text=Gestión de Documentos')).toBeVisible();
    });

    test('Should allow file upload interaction', async ({ page }) => {
        // Check if upload area exists
        await expect(page.locator('text=Arrastra archivos aquí')).toBeVisible();
    });
});
