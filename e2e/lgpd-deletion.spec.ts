import { test, expect, type Page } from '@playwright/test'

/**
 * LGPD deletion flow — full loop.
 *
 * Requires env vars:
 *   E2E_USER_EMAIL     — a real user in the dev Supabase project
 *   E2E_USER_PASSWORD  — that user's password
 *
 * The flow:
 *   1. Clear any pre-existing pending deletion (via UI cancel if banner shown)
 *   2. Open Privacy Settings tab
 *   3. Click "Solicitar Exclusão" → fill modal → confirm
 *   4. Verify amber "Exclusão agendada" banner appears
 *   5. Click "Cancelar exclusão"
 *   6. Verify banner disappears + "Solicitar Exclusão" button returns
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

async function openPrivacyTab(page: Page) {
  await page.goto('/configuracoes')
  await page.getByRole('tab', { name: /privacidade/i }).click()
  await expect(page.getByText(/Seus Direitos \(LGPD\)/i)).toBeVisible()
}

async function clearExistingDeletion(page: Page) {
  const cancelButton = page.getByRole('button', { name: /Cancelar exclusão/i })
  if (await cancelButton.isVisible().catch(() => false)) {
    await cancelButton.click()
    await expect(
      page.getByRole('button', { name: /Solicitar Exclusão/i }),
    ).toBeVisible({ timeout: 10_000 })
  }
}

test.describe.configure({ mode: 'serial' })

test.describe('LGPD deletion flow', () => {
  test.skip(
    !email || !password,
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set to run LGPD deletion tests.',
  )

  test('user can request scheduled deletion and cancel it', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await openPrivacyTab(page)
    await clearExistingDeletion(page)

    // Open modal
    await page.getByRole('button', { name: /Solicitar Exclusão/i }).click()
    await expect(
      page.getByRole('heading', { name: /Solicitar Exclusão de Dados/i }),
    ).toBeVisible()

    // Confirm button must be disabled until "EXCLUIR" is typed
    const confirmButton = page.getByRole('button', {
      name: /Agendar Exclusão/i,
    })
    await expect(confirmButton).toBeDisabled()

    // Fill optional reason + confirmation text
    await page
      .getByPlaceholder(/migrei pra outra ferramenta/i)
      .fill('E2E test — not a real request')
    await page.getByPlaceholder('EXCLUIR').fill('EXCLUIR')
    await expect(confirmButton).toBeEnabled()

    // Submit
    await confirmButton.click()

    // Modal closes + amber banner appears
    await expect(
      page.getByRole('heading', { name: /Solicitar Exclusão de Dados/i }),
    ).not.toBeVisible()
    await expect(page.getByText(/Exclusão agendada/i)).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/Sua conta será excluída/i)).toBeVisible()

    // Cancel via banner button
    await page.getByRole('button', { name: /Cancelar exclusão/i }).click()

    // Banner disappears + request button returns
    await expect(page.getByText(/Exclusão agendada/i)).not.toBeVisible({
      timeout: 10_000,
    })
    await expect(
      page.getByRole('button', { name: /Solicitar Exclusão/i }),
    ).toBeVisible()
  })

  test('user can abort via modal cancel without scheduling', async ({
    page,
  }) => {
    await loginViaUI(page, email!, password!)
    await openPrivacyTab(page)
    await clearExistingDeletion(page)

    await page.getByRole('button', { name: /Solicitar Exclusão/i }).click()
    await expect(
      page.getByRole('heading', { name: /Solicitar Exclusão de Dados/i }),
    ).toBeVisible()

    // Modal "Cancelar" button (not the confirm, not the banner cancel)
    await page.getByRole('button', { name: /^Cancelar$/ }).click()

    // Banner should NOT appear (nothing was scheduled)
    await expect(page.getByText(/Exclusão agendada/i)).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: /Solicitar Exclusão/i }),
    ).toBeVisible()
  })
})
