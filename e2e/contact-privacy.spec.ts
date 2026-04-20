import { test, expect } from '@playwright/test'

test.describe('Contact privacy on footer/header', () => {
  test('footer email/WhatsApp icons do NOT expose address in href', async ({
    page,
  }) => {
    await page.goto('/')

    // Scroll to footer
    await page.keyboard.press('End')

    const emailTriggers = page.locator('[aria-label="E-mail"]')
    await expect(emailTriggers.first()).toBeVisible()

    for (const handle of await emailTriggers.all()) {
      const tag = await handle.evaluate((el) => el.tagName.toLowerCase())
      // Should be a button, NOT an <a href="mailto:">
      expect(tag).toBe('button')
      const href = await handle.getAttribute('href')
      expect(href).toBeNull()
    }

    const waTriggers = page.locator('[aria-label="WhatsApp"]')
    await expect(waTriggers.first()).toBeVisible()

    for (const handle of await waTriggers.all()) {
      const tag = await handle.evaluate((el) => el.tagName.toLowerCase())
      expect(tag).toBe('button')
      const href = await handle.getAttribute('href')
      expect(href).toBeNull()
    }
  })

  test('Instagram social icon keeps href (public URL, ok to expose)', async ({
    page,
  }) => {
    await page.goto('/')
    await page.keyboard.press('End')

    const instagram = page.locator('[aria-label="Instagram"]').first()
    await expect(instagram).toBeVisible()

    const tag = await instagram.evaluate((el) => el.tagName.toLowerCase())
    expect(tag).toBe('a')
    const href = await instagram.getAttribute('href')
    expect(href).toContain('instagram.com')
  })
})
