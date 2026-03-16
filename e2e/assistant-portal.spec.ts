import { test, expect } from '@playwright/test'

test.describe('Assistant Portal Flow', () => {
  const mockToken = 'mock-invite-token-123'
  const _mockEmail = 'test+assistant@example.com'

  test.beforeEach(async ({ page }) => {
    // Mock Supabase RPC calls
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
  })

  test('Guest user should see signup form when visiting invite link', async ({
    page,
  }) => {
    await page.goto(`/assistente/convite/${mockToken}`)
    await page.waitForLoadState('networkidle')

    // Expect signup form to be visible
    await expect(page.getByText('Criar Conta de Assistente')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByLabel('Nome Completo')).toBeVisible()
  })

  test('Existing user should see login form toggle', async ({ page }) => {
    await page.goto(`/assistente/convite/${mockToken}`)
    await page.waitForLoadState('networkidle')

    await page.click('text=Já tem conta? Entre')

    // Expect login form
    await expect(page.getByText('Acessar Portal da Assistente')).toBeVisible()
    await expect(page.getByLabel('Nome Completo')).not.toBeVisible()
  })

  // Note: Full auth flow mocking requires more complex Supabase auth mocking
  // or a real test environment. checking UI logic here.
})
