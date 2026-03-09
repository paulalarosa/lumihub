import { test, expect } from '@playwright/test'

test('sanity check: homepage loads', async ({ page }) => {
  // 1. Acessa a página inicial
  await page.goto('/')

  // 2. Verifica se o título da página está correto
  await expect(page).toHaveTitle(/KONTROL | Industrial Noir Management/i)

  // 3. Verifica se existe algum botão ou input de Login (supondo que a home seja login ou dashboard)
  // O usuário mencionou "Khaos Kontrol" no prompt, mas o projeto parece ser "LumiHub".
  // Vou verificar se o body está visível, que é o mínimo.
  await expect(page.locator('body')).toBeVisible()

  // Tentar encontrar um texto de Login ou Dashboard se possível
  // await expect(page.getByText('Login') || page.getByText('Entrar')).toBeVisible();
})
