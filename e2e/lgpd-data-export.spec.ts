import { test, expect, type Page } from '@playwright/test'

/**
 * LGPD data-export flow.
 *
 * Requires env vars:
 *   E2E_USER_EMAIL     — a real user in the dev Supabase project
 *   E2E_USER_PASSWORD  — that user's password
 *
 * Flow: login → open Privacy tab → click "Exportar Meus Dados" →
 * expect a JSON download (or visible success toast).
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

test.describe('LGPD data export flow', () => {
  test.skip(
    !email || !password,
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set to run LGPD export tests.',
  )

  test('user can export their personal data as JSON', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await openPrivacyTab(page)

    const exportButton = page.getByRole('button', {
      name: /Exportar Meus Dados/i,
    })
    await expect(exportButton).toBeVisible()

    // The export triggers a file download. Playwright's download event wraps
    // either a direct blob download OR a same-origin URL serving JSON. We
    // race either signal.
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 })

    await exportButton.click()

    // Button should flip to loading state briefly. Not asserting the exact
    // "Gerando arquivo..." copy because i18n may change it.
    await expect(exportButton).toBeDisabled()

    const download = await downloadPromise
    const suggested = download.suggestedFilename()
    expect(suggested).toMatch(/\.json$/i)

    // Button returns to idle once the download resolves.
    await expect(exportButton).toBeEnabled({ timeout: 15_000 })
  })

  test('exported JSON contains expected LGPD sections', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await openPrivacyTab(page)

    const exportButton = page.getByRole('button', {
      name: /Exportar Meus Dados/i,
    })

    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 })
    await exportButton.click()
    const download = await downloadPromise

    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const body = Buffer.concat(chunks).toString('utf-8')

    const parsed = JSON.parse(body)

    // Guards the shape produced by the `lgpd-export` Edge Function. If any
    // of these keys disappear silently the export is broken (LGPD Art. 18
    // compliance gap). See supabase/functions/lgpd-export/index.ts.
    expect(parsed).toHaveProperty('generated_at')
    expect(parsed).toHaveProperty('user_id')
    expect(parsed).toHaveProperty('account.email')
    expect(parsed).toHaveProperty('data.profiles')
    expect(parsed).toHaveProperty('data.wedding_clients')
    expect(parsed).toHaveProperty('data.projects')
    expect(parsed).toHaveProperty('_meta.lgpd_article')
  })
})
