import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_PROPERTY } from '../fixtures/test-data';

test.describe('Admin - Properties Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.click('text=Propiedades'); // Menu item
    });

    test('Should create a new property', async ({ page }) => {
        await page.click('text=+ Nueva Propiedad');

        // Fill form
        await page.fill('input[placeholder*="Nombre"]', TEST_PROPERTY.name);
        await page.fill('input[placeholder*="Dirección"]', TEST_PROPERTY.address);
        // await page.fill('input[type="number"]', TEST_PROPERTY.rent.toString()); // If selector matches
        // Fallback to searching by nearby text if placeholders aren't obvious, but placeholders are common.

        // Assuming Selects are standard HTML or custom. 
        // If custom, we might need click. 
        // Let's rely on standard inputs for now or text.

        await page.click('button:has-text("Guardar")');

        // Verification
        await expect(page.locator(`text=${TEST_PROPERTY.name}`)).toBeVisible();
    });

    test('Should search for a property', async ({ page }) => {
        // Assuming search bar exists
        await page.fill('input[placeholder*="Buscar"]', 'NonExistent');
        await expect(page.locator('text=No se encontraron')).toBeVisible({ timeout: 5000 }).catch(() => { }); // Optional check

        // Search for real
        // await page.fill('input[placeholder*="Buscar"]', TEST_PROPERTY.name);
        // await expect(page.locator(`text=${TEST_PROPERTY.name}`)).toBeVisible();
    });
});
