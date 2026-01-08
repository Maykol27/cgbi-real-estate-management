import { Page, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-data';

export async function loginAs(page: Page, role: keyof typeof TEST_USERS) {
    const user = TEST_USERS[role];

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    // Click login
    await page.click('button:has-text("Ingresar")');

    // Wait for navigation and dashboard load
    await page.waitForURL(`**/${role}/**`, { timeout: 10000 });
}

export async function logout(page: Page) {
    await page.click('button[aria-label="Cerrar sesión"]'); // Adjust selector as needed
    await page.waitForURL('**/', { timeout: 5000 });
}
