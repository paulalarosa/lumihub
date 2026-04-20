import { test, expect } from '@playwright/test'

test.describe('Sales Chat FAB (landing)', () => {
  test('FAB button is visible and opens chat on click', async ({ page }) => {
    await page.goto('/')

    const fab = page.getByRole('button', { name: /abrir assistente/i })
    await expect(fab).toBeVisible()

    await fab.click()

    // Chat header visible after opening
    await expect(page.getByText(/Assistente Khaos/i)).toBeVisible()
    await expect(page.getByText(/online agora/i)).toBeVisible()

    // Welcome message rendered
    await expect(
      page.getByText(/Posso te ajudar a entender planos/i),
    ).toBeVisible()

    // Input field focused + typeable
    const input = page.getByPlaceholder(/Escreva sua pergunta/i)
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()
  })

  test('chat has WhatsApp fallback link', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /abrir assistente/i }).click()

    await expect(
      page.getByRole('button', { name: /prefiro falar no WhatsApp/i }),
    ).toBeVisible()
  })

  test('chat shows suggested prompts on first open', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /abrir assistente/i }).click()

    await expect(page.getByRole('button', { name: /Quais planos/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /trial/i })).toBeVisible()
  })

  test('chat closes when X clicked', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /abrir assistente/i }).click()

    await expect(page.getByText(/Assistente Khaos/i)).toBeVisible()

    await page.getByRole('button', { name: /fechar chat/i }).click()

    // Panel hidden, FAB visible again
    await expect(page.getByText(/Assistente Khaos/i)).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: /abrir assistente/i }),
    ).toBeVisible()
  })
})
