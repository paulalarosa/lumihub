import { test, expect, type Page } from '@playwright/test'

/**
 * Calendar event edit + delete flow.
 *
 * Regression guard for the bug where `EventDetailsModal` only exposed
 * "Ver Projeto" / "Abrir no Google" buttons — events created locally
 * without a client/project had no path to edit or delete from the UI.
 *
 * Requires:
 *   E2E_USER_EMAIL     — a real user in the dev Supabase project
 *   E2E_USER_PASSWORD  — that user's password
 *
 * Flow:
 *   1. Login + navigate to calendar
 *   2. Create an event in a far-future date (to avoid clashes)
 *   3. Click the event on the calendar → details modal opens
 *   4. Click "Editar" → create modal reopens in edit mode
 *   5. Change the title → save → confirm updated title is visible
 *   6. Reopen → click "Excluir" → confirm via modal
 *   7. Confirm event no longer present
 */

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

const TEST_PREFIX = 'E2E-EVT-'
const originalTitle = `${TEST_PREFIX}${Date.now()}`
const editedTitle = `${TEST_PREFIX}EDITED-${Date.now()}`

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await page.waitForURL(/dashboard|onboarding/i, { timeout: 15_000 })
}

async function createEvent(page: Page, title: string) {
  await page.goto('/calendar')
  // Open CreateEventModal via the toolbar "Novo evento" button; fallbacks
  // cover different calendar layouts.
  const newBtn = page
    .getByRole('button', { name: /Novo Evento|\+ Evento|Criar Evento/i })
    .first()
  await newBtn.click({ timeout: 10_000 })

  await expect(
    page.getByRole('heading', { name: /Novo Evento/i }),
  ).toBeVisible({ timeout: 5_000 })

  await page.getByLabel(/Título/i).fill(title)

  // Date: 30 days out to keep clear of existing events
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const iso = future.toISOString().slice(0, 10)
  await page.locator('input[type="date"]').first().fill(iso)

  await page.getByRole('button', { name: /Criar Evento/i }).click()
  await expect(
    page.getByRole('heading', { name: /Novo Evento/i }),
  ).not.toBeVisible({ timeout: 10_000 })
}

async function openEventByTitle(page: Page, title: string) {
  await page.goto('/calendar')
  // Events render as buttons or divs with the title inside. Click the first
  // match — if multiple matches exist the test title is unique by timestamp.
  await page.getByText(title).first().click({ timeout: 10_000 })
  await expect(page.getByRole('heading', { name: title })).toBeVisible({
    timeout: 5_000,
  })
}

test.describe.configure({ mode: 'serial' })

test.describe('Calendar event edit + delete', () => {
  test.skip(
    !email || !password,
    'E2E_USER_EMAIL and E2E_USER_PASSWORD must be set to run this test.',
  )

  test('user can edit an event created without a client', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await createEvent(page, originalTitle)

    await openEventByTitle(page, originalTitle)

    // Click Editar → CreateEventModal should reopen in edit mode
    await page.getByRole('button', { name: /Editar/i }).click()
    await expect(
      page.getByRole('heading', { name: /Editar Evento/i }),
    ).toBeVisible({ timeout: 5_000 })

    // Title field should be prefilled with the original
    const titleInput = page.getByLabel(/Título/i)
    await expect(titleInput).toHaveValue(originalTitle)

    // Update the title and save
    await titleInput.fill(editedTitle)
    await page.getByRole('button', { name: /Salvar alterações/i }).click()
    await expect(
      page.getByRole('heading', { name: /Editar Evento/i }),
    ).not.toBeVisible({ timeout: 10_000 })

    // Calendar should now show the edited title
    await page.goto('/calendar')
    await expect(page.getByText(editedTitle).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('user can delete an event via details modal', async ({ page }) => {
    await loginViaUI(page, email!, password!)
    await openEventByTitle(page, editedTitle)

    await page.getByRole('button', { name: /Excluir/i }).click()

    // Confirmation modal
    await expect(
      page.getByRole('heading', { name: /Excluir este evento/i }),
    ).toBeVisible({ timeout: 5_000 })

    await page
      .getByRole('button', { name: /Excluir definitivamente/i })
      .click()

    // Confirmation + details modals should both close
    await expect(
      page.getByRole('heading', { name: /Excluir este evento/i }),
    ).not.toBeVisible({ timeout: 10_000 })

    // Event should be gone from the calendar
    await page.goto('/calendar')
    await expect(page.getByText(editedTitle)).toHaveCount(0, {
      timeout: 10_000,
    })
  })
})
