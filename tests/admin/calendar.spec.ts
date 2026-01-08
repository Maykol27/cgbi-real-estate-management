import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Admin - Calendar Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.click('text=Calendario');
    });

    test('Should view calendar', async ({ page }) => {
        await expect(page.locator('text=Calendario de Visitas')).toBeVisible();
        await expect(page.locator('button:has-text("Hoy")')).toBeVisible();
    });

    test('Should open schedule modal', async ({ page }) => {
        await page.click('text=+ Agendar');
        await expect(page.locator('text=Nueva Visita')).toBeVisible();
        // Close modal
        await page.click('button:has-text("Cancelar")');
    });
});
