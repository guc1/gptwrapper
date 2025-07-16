import { test, expect } from '../fixtures';

// Simple text search regression guard to ensure 'agent' copy was removed

test('agents page is fully rebranded', async ({ page }) => {
  await page.context().addCookies([
    { name: 'language', value: 'nl', domain: 'localhost', path: '/' },
  ]);
  await page.goto('/agents');
  const content = await page.content();
  expect(content.toLowerCase()).not.toContain('agent');
});
