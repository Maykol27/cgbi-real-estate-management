import { defineConfig, devices } from '@playwright/test';


export default defineConfig({
    testDir: './tests',
    timeout: 60 * 1000,
    expect: {
        timeout: 10 * 1000
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['html'], ['list']],
    use: {
        baseURL: 'http://localhost:3000',
        actionTimeout: 0,
        trace: 'on-first-retry',
        video: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // {
        //   name: 'mobile-chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
