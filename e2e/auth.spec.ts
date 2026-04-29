import { test, expect } from '@playwright/test'

test.describe('Auth Flows', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Khaos Kontrol/i)
    await expect(page.locator('text=Gestão profissional').first()).toBeVisible()
    // CTAs atuais (verbo primeira pessoa): "Profissionalizar minha agenda",
    // "Quero parar de perder noivas". Mantém fallback "Começar" pra
    // regressões caso voltem ao copy genérico.
    await expect(
      page
        .getByRole('button', {
          name: /Profissionalizar|Quero parar|Começar/i,
        })
        .first(),
    ).toBeVisible()
  })

  test('CTA navigates to register', async ({ page }) => {
    await page.goto('/')
    // networkidle garante hidratação do React Router. Firefox CI ocasionalmente
    // clicava antes do listener anexar.
    await page.waitForLoadState('networkidle')

    const cta = page
      .getByRole('button', {
        name: /Profissionalizar|Quero parar|Começar/i,
      })
      .first()
    await cta.scrollIntoViewIfNeeded()
    await expect(cta).toBeEnabled()

    // Pattern oficial do Playwright pra SPA navigation: aguarda a URL mudar
    // CONCORRENTE ao click. Mais robusto em Firefox que `expect(page).toHaveURL`
    // depois — evita race entre history.pushState do React Router e o assert.
    await Promise.all([
      page.waitForURL(/cadastro|register/i, { timeout: 15_000 }),
      cta.click(),
    ])
  })

  test('register page has correct fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Crie sua conta grátis').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Continuar com Google/i }),
    ).toBeVisible()
    await expect(page.getByText('Sem cartão de crédito').first()).toBeVisible()
  })

  test('register validates empty fields', async ({ page }) => {
    await page.goto('/register')
    // Click the submit button on register page
    await page.getByRole('button', { name: /Começar grátis/i }).click()
    // Wait for Shadcn/Sonner toast or standard validation alert
    await expect(
      page.locator('[role="alert"], [data-state="open"]').first(),
    ).toBeVisible({ timeout: 5000 })
  })

  test('login page has correct fields', async ({ page }) => {
    await page.goto('/login')
    await expect(
      page
        .getByRole('heading', { name: /Entrar/i })
        .or(page.getByText('Entrar').first()),
    ).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByText('Esqueceu a senha?')).toBeVisible()
    await expect(page.getByText('Criar conta grátis')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.getByRole('button', { name: /Entrar/i }).click()
    await expect(
      page.locator('[role="alert"], [data-state="open"]').first(),
    ).toBeVisible({ timeout: 5000 })
  })

  test('unauthenticated user redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/i)
  })

  test('unauthenticated user redirected from clients', async ({ page }) => {
    await page.goto('/clientes')
    await expect(page).toHaveURL(/login/i)
  })

  test('register links to login', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('link', { name: /Entrar/i }).click()
    await expect(page).toHaveURL(/login/i)
  })

  test('login links to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /Criar conta grátis/i }).click()
    await expect(page).toHaveURL(/register/i)
  })
})
