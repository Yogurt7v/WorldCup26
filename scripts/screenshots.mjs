import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(dirname, '../public/screenshots')

const URL = 'https://worldcup26-eta.vercel.app'

async function main() {
  const browser = await chromium.launch()

  // Narrow screenshot (mobile) — 750x1334
  const narrowCtx = await browser.newContext({
    viewport: { width: 750, height: 1334 },
    deviceScaleFactor: 1,
  })
  await narrowCtx.addInitScript(() => {
    localStorage.setItem('wc26_user', JSON.stringify({ id: 1, username: 'Тест', created_at: new Date().toISOString() }))
  })
  const narrowPage = await narrowCtx.newPage()
  await narrowPage.goto(URL, { waitUntil: 'networkidle' })
  await narrowPage.waitForTimeout(2000)
  await narrowPage.screenshot({ path: path.join(outDir, 'narrow.png'), fullPage: false })
  await narrowCtx.close()

  // Wide screenshot (desktop) — 1280x720
  const wideCtx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  })
  await wideCtx.addInitScript(() => {
    localStorage.setItem('wc26_user', JSON.stringify({ id: 1, username: 'Тест', created_at: new Date().toISOString() }))
  })
  const widePage = await wideCtx.newPage()
  await widePage.goto(URL, { waitUntil: 'networkidle' })
  await widePage.waitForTimeout(2000)
  await widePage.screenshot({ path: path.join(outDir, 'wide.png'), fullPage: false })
  await wideCtx.close()

  await browser.close()
  console.log('Screenshots saved to', outDir)
}

main().catch(console.error)
