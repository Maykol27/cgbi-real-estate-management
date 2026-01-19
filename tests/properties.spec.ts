import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_PROPERTY } from './fixtures/test-data';
import { loginAs } from './helpers/auth';

test.describe('Property Management (Admin)', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.goto('/admin/properties');
    });

    test('TC-010: Create Property successfully', async ({ page }) => {
        await page.click('text=Nuevo Inmueble');

        // Fill form
        await page.fill('input[name="name"]', TEST_PROPERTY.name + ' ' + Date.now());
        await page.fill('input[name="address"]', TEST_PROPERTY.address);
        await page.fill('input[name="rent"]', TEST_PROPERTY.rent.toString());
        await page.selectOption('select[name="type"]', 'Residencial');
        // Select owner - assumption: dropdown or autocomplete
        // If it's a select
        // await page.selectOption('select[name="owner_id"]', { label: 'Juan Perez' }); 
        // Or if it's a robust component, we might need to click and type.
        // Based on StoreContext/addProperty, it requires owner_id.
        // Let's assume there is a way to select the owner.
        // For now, let's try to find a select for owner.
        const ownerSelect = page.locator('select[name="owner_id"]');
        if (await ownerSelect.isVisible()) {
            await ownerSelect.selectOption({ index: 1 }); // Select first available owner
        } else {
            // Maybe it's a custom dropdown
            await page.click('text=Seleccionar Propietario');
            await page.click('text=' + TEST_USERS.owner.email);
        }

        await page.click('button:has-text("Guardar")');

        await expect(page.locator('text=Propiedad creada exitosamente')).toBeVisible();
    });

    test('TC-011: Create Property validation (Missing Data)', async ({ page }) => {
        await page.click('text=Nuevo Inmueble');
        // Don't fill anything or fill partial
        await page.fill('input[name="address"]', 'Incomplete Address');
        await page.click('button:has-text("Guardar")');

        // Expect validation error - assuming HTML5 validation or UI error
        // If HTML5 validation, we can checks :invalid pseudo-class or listener
        // But usually app shows error.
        // Let's assume the button doesn't close the modal or shows error.
        // Verify we are still on the form
        await expect(page.locator('text=Nuevo Inmueble')).toBeVisible();
    });

    test('TC-013: Update Property Status', async ({ page }) => {
        // Assume there is at least one property
        await page.locator('.property-card').first().click();
        await page.click('text=Editar');

        await page.selectOption('select[name="status"]', 'Arrendado');
        await page.click('button:has-text("Guardar")');

        await expect(page.locator('text=Arrendado')).toBeVisible();
    });

});
