import { test, expect } from '@playwright/test'

test.describe('Assistant Portal Flow', () => {
  const mockProfessionalId = 'mock-prof-123'

  test.beforeEach(async ({ page }) => {
    // Mock profiles check
    await page.route('**/rest/v1/profiles?id=eq.*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ full_name: 'Makeup Artist Profissional' }]),
      })
    })

    // Mock RPC verify_assistant_login
    await page.route('**/rest/v1/rpc/verify_assistant_login', async (route) => {
      const payload = route.request().postDataJSON()
      if (payload.p_pin === '1234') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-assistant-id',
            full_name: 'Assistant User',
          }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'invalid_pin' }),
        })
      }
    })

    // Mock initial check for existing session
    await page.route('**/auth/v1/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: null }),
      })
    })
  })

  test('Assistant should see quick login screen', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto(`/agenda-equipa/${mockProfessionalId}`)
    
    // Wait for the specific content to appear
    await page.waitForSelector('text=AGENDA DA ASSISTENTE', { timeout: 30000 })

    // Check for the header text
    await expect(page.getByText('AGENDA DA ASSISTENTE')).toBeVisible()
    
    // Check for PIN label
    await expect(page.getByText('PIN de Acesso')).toBeVisible()
    
    // Check for the access button
    await expect(page.getByRole('button', { name: 'Aceder à Agenda' })).toBeVisible()
  })

  test('Assistant should fail with wrong PIN', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto(`/agenda-equipa/${mockProfessionalId}`)
    await page.waitForSelector('text=AGENDA DA ASSISTENTE', { timeout: 30000 })

    const pinInput = page.locator('#assistant-pin')
    await pinInput.fill('0000')
    
    // Wait for the specific RPC call to finish
    const responsePromise = page.waitForResponse('**/rest/v1/rpc/verify_assistant_login')
    await page.click('button:has-text("Aceder à Agenda")')
    await responsePromise

    await expect(page.getByText('Acesso Negado', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('PIN incorreto ou sem autorização.', { exact: true })).toBeVisible()
  })

  test('Assistant should log in successfully with correct PIN', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto(`/agenda-equipa/${mockProfessionalId}`)
    await page.waitForSelector('text=AGENDA DA ASSISTENTE', { timeout: 30000 })

    const pinInput = page.locator('#assistant-pin')
    await pinInput.fill('1234')
    
    const responsePromise = page.waitForResponse('**/rest/v1/rpc/verify_assistant_login')
    await page.click('button:has-text("Aceder à Agenda")')
    await responsePromise

    // Should see success toast
    await expect(page.getByText('Acesso autorizado', { exact: true })).toBeVisible({ timeout: 10000 })
    
    // Should navigate to dashboard
    await expect(page).toHaveURL(new RegExp(`/agenda-equipa/${mockProfessionalId}/dashboard`), { timeout: 15000 })
  })
})
