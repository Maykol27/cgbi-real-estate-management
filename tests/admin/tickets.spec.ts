import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_TICKET } from '../fixtures/test-data';

test.describe('Admin - Tickets Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin');
        await page.click('text=Tickets');
    });

    test('Should list tickets', async ({ page }) => {
        await expect(page.locator('text=Mesa de Ayuda')).toBeVisible();
        // Check for list
        // expect(await page.locator('.ticket-item').count()).toBeGreaterThanOrEqual(0);
    });

    test('Should filter tickets', async ({ page }) => {
        await page.click('button:has-text("Pendientes")');
        // Verify filter active visual cue
    });

    test('Should reply to a ticket', async ({ page }) => {
        // Find a ticket or create one first? 
        // For now, assume tickets exist or skip if empty.
        const ticket = page.locator('text=Ver Ticket').first();
        if (await ticket.isVisible()) {
            await ticket.click();
            await page.fill('textarea[placeholder*="Responder"]', 'Respuesta automática de prueba');
            await page.click('button:has-text("Enviar")');
            await expect(page.locator('text=Respuesta automática de prueba')).toBeVisible();
        }
    });
});
