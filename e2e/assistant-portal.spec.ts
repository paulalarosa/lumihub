import { test, expect } from '@playwright/test'

test.describe('Assistant Portal Flow', () => {
  const mockToken = 'mock-invite-token-123'

  test.beforeEach(async ({ page }) => {
    await page.route(
      '**/rest/v1/rpc/accept_assistant_invite',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, is_new_connection: true }),
        })
      },
    )

    await page.route('**/rest/v1/rpc/check_assistant_exists', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exists: false, is_assistant: false }),
      })
    })

    await page.route('**/auth/v1/token?grant_type=*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid Refresh Token',
        }),
      })
    })

    await page.route('**/auth/v1/session', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not_authenticated' }),
      })
    })

    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'not_authenticated' }),
      })
    })
  })

  test('Guest user should see signup form when visiting invite link', async ({
    page,
  }) => {
    await page.goto(`/assistente/convite/${mockToken}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Criar Conta de Assistente')).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByLabel('Nome Completo')).toBeVisible()
  })

  test('Existing user should see login form toggle', async ({ page }) => {
    await page.goto(`/assistente/convite/${mockToken}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Criar Conta de Assistente')).toBeVisible({
      timeout: 15000,
    })

    await page.click('text=Já tem conta? Entre')

    await expect(page.getByText('Acessar Portal da Assistente')).toBeVisible()
    await expect(page.getByLabel('Nome Completo')).not.toBeVisible()
  })
})
