import { test, expect } from '@playwright/test'

test.describe('Plans page', () => {
  test('displays the 3 tier prices', async ({ page }) => {
    await page.goto('/planos')

    await expect(page.locator('body')).toBeVisible()

    // Each tier price should be visible on the page (current prices: 39,90 / 89,90 / 149,90)
    await expect(page.getByText(/39[,.]90/).first()).toBeVisible()
    await expect(page.getByText(/89[,.]90/).first()).toBeVisible()
    await expect(page.getByText(/149[,.]90/).first()).toBeVisible()
  })

  test('has CTAs to subscribe', async ({ page }) => {
    await page.goto('/planos')

    // At least one plan CTA button must exist
    const ctas = page.getByRole('button', {
      name: /profissionalizar|faturar|liderar|assinar|começar|testar|trial|agenda/i,
    })
    await expect(ctas.first()).toBeVisible()
  })
})
