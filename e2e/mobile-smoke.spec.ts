import { test, expect } from '@playwright/test'

/**
 * Mobile smoke: confirma que páginas críticas renderizam SEM overflow
 * horizontal e que os CTAs principais estão visíveis em viewport
 * estreito (375px). Roda só nos projects Mobile Chrome / Mobile Safari.
 *
 * Não testa fluxo logado — esse fica em authenticated.spec.ts.
 */

const expectNoHorizontalScroll = async (page: import('@playwright/test').Page) => {
  // Body width não deve exceder viewport (overflow horizontal é UX bug
  // em mobile — page balança lateralmente).
  const overflow = await page.evaluate(() => {
    const body = document.body
    const html = document.documentElement
    return Math.max(body.scrollWidth, html.scrollWidth) - window.innerWidth
  })
  expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(1)
}

test.describe('Mobile smoke (375px)', () => {
  test('home renderiza sem overflow + CTA do hero visível', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Khaos Kontrol/i)
    await expectNoHorizontalScroll(page)

    const heroCta = page
      .getByRole('button', {
        name: /Profissionalizar|Quero parar|Começar/i,
      })
      .first()
    await expect(heroCta).toBeVisible()
  })

  test('/planos renderiza com 3 cards + CTAs', async ({ page }) => {
    await page.goto('/planos')
    await expectNoHorizontalScroll(page)

    // Cada plano tem um botão CTA — em mobile o layout é horizontal scroll.
    // Verifica os 3 visíveis (alguns scroll-into-view).
    const ctas = page.getByRole('button', {
      name: /Profissionalizar|Quero faturar|Liderar/i,
    })
    await expect(ctas).toHaveCount(3)
  })

  test('/recursos abre sem overflow', async ({ page }) => {
    await page.goto('/recursos')
    await expectNoHorizontalScroll(page)
  })

  test('/login renderiza form', async ({ page }) => {
    await page.goto('/login')
    await expectNoHorizontalScroll(page)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('/cadastro alias funciona em mobile', async ({ page }) => {
    await page.goto('/cadastro')
    await expectNoHorizontalScroll(page)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
