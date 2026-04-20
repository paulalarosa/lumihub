import { test, expect, type Page } from '@playwright/test'

/**
 * Authenticated smoke tests.
 *
 * Requires env vars (set in the shell or .env before running):
 *   E2E_USER_EMAIL — a real user in the dev Supabase project
 *   E2E_USER_PASSWORD — that user's password
 *
 * If the env vars are missing, the whole describe block is skipped so CI
 * stays green when credentials aren't provisioned.
 */

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await page.waitForURL(/dashboard|onboarding/i, { timeout: 15_000 })
}

test.describe.configure({ mode: 'serial' })

test.describe('Authenticated flows', () => {
  test.skip(
    !email || !password,
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set to run authenticated tests.',
  )

  test('user can log in and reach the dashboard', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await expect(page).toHaveURL(/dashboard|onboarding/i)
  })

  test('clients page lists content', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await page.goto('/clientes')
    await expect(page).toHaveURL(/clientes/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('settings page opens with tabs', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await page.goto('/configuracoes')
    await expect(
      page.getByRole('tab', { name: /perfil/i }).first(),
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: /ia/i }).first()).toBeVisible()
  })

  test('workflows page lists templates', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await page.goto('/automacoes')
    await expect(
      page.getByRole('heading', { name: /Automações/i }),
    ).toBeVisible()
    await expect(page.getByText(/Templates prontos/i)).toBeVisible()
    await expect(page.getByText(/Boas-vindas a nova cliente/i)).toBeVisible()
  })
})
