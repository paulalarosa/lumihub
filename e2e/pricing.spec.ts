import { test, expect } from '@playwright/test'

test.describe('Plans page', () => {
  test('displays the 3 tier prices', async ({ page }) => {
    await page.goto('/planos')

    await expect(page.locator('body')).toBeVisible()

    // Each tier price should be visible somewhere on the page
    await expect(page.getByText(/49[,.]90/).first()).toBeVisible()
    await expect(page.getByText(/99[,.]90/).first()).toBeVisible()
    await expect(page.getByText(/199[,.]90/).first()).toBeVisible()
  })

  test('has CTAs to subscribe', async ({ page }) => {
    await page.goto('/planos')

    // At least one subscribe/register button must exist
    const ctas = page.getByRole('button', {
      name: /assinar|começar|testar|trial/i,
    })
    await expect(ctas.first()).toBeVisible()
  })
})
