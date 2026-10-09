import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright'

const PORT = 5199
const BASE = `http://localhost:${PORT}`

/** 42-move game that ends in a draw (mirrors src/engine/fixtures.ts). */
const DRAW_MOVES = [
  0, 6, 5, 4, 3, 2, 1, 0, 6, 5, 4, 3, 2, 1, 0, 6, 5, 4, 3, 2, 1, 0, 0, 6, 5, 4, 3, 2, 0, 6, 5, 4, 3,
  2, 1, 1, 6, 5, 4, 3, 2, 1,
]

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not ready yet
    }
    await sleep(300)
  }
  throw new Error(`Server at ${url} did not start`)
}

const server = spawn(
  'node',
  ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore' },
)

const shots = []
const errors = []

try {
  await waitForServer(BASE)
  const browser = await chromium.launch()

  const shoot = async (page, name) => {
    const path = `./screenshots/${name}.png`
    await page.screenshot({ path })
    shots.push(path)
  }

  const attachErrors = (page, tag) => {
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`[${tag}] console: ${message.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`[${tag}] pageerror: ${error.message}`))
  }

  const play = async (page, col, delay = 340) => {
    await page.getByRole('button', { name: `Jouer dans la colonne ${col + 1}` }).click()
    await page.waitForTimeout(delay)
  }

  // --- Desktop, mode 2 joueurs -------------------------------------
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 920 } })
  attachErrors(desktop, 'desktop')
  await desktop.goto(BASE, { waitUntil: 'networkidle' })
  await shoot(desktop, '01-menu')

  await desktop.getByRole('button', { name: /lancer la partie/i }).click()
  await desktop.waitForTimeout(400)
  await shoot(desktop, '02-game-empty')

  // Red wins with a horizontal line: columns 0,0,1,1,2,2,3 (0-based)
  for (const col of [0, 0, 1, 1, 2, 2, 3]) {
    await play(desktop, col)
  }
  await desktop.waitForTimeout(800)
  await shoot(desktop, '03-victory')

  const overlayVisible = await desktop
    .getByRole('button', { name: /menu principal/i })
    .isVisible()
    .catch(() => false)
  if (!overlayVisible) errors.push('[desktop] victory overlay is not visible')

  const scoreText = await desktop
    .locator('section', { hasText: 'SCORES' })
    .first()
    .innerText()
    .catch(() => '')
  if (!scoreText.includes('1')) errors.push('[desktop] score was not updated after the win')

  await desktop.locator('div.fixed').getByRole('button', { name: 'Rejouer' }).click()
  await desktop.waitForTimeout(500)
  await shoot(desktop, '04-after-replay')

  // --- Desktop, mode IA difficile ----------------------------------
  await desktop.getByRole('button', { name: /retour au menu/i }).click()
  await desktop.waitForTimeout(300)
  await desktop.getByRole('button', { name: /contre l ia/i }).first().click()
  await desktop.getByRole('button', { name: 'Difficile' }).click()
  await shoot(desktop, '05-menu-ai')
  await desktop.getByRole('button', { name: /lancer la partie/i }).click()
  await desktop.waitForTimeout(400)
  await play(desktop, 4, 1800)
  await shoot(desktop, '06-ai-hard')

  const aiMoved = await desktop.evaluate(() => document.body.innerText.includes('2/42'))
  if (!aiMoved) errors.push('[desktop] AI did not answer the first move')

  // --- Match nul rejoué coup par coup --------------------------------
  await desktop.getByRole('button', { name: /retour au menu/i }).click()
  await desktop.waitForTimeout(300)
  await desktop.getByRole('button', { name: /2 joueurs/i }).first().click()
  await desktop.getByRole('button', { name: /lancer la partie/i }).click()
  await desktop.waitForTimeout(300)
  for (const col of DRAW_MOVES) {
    await desktop.getByRole('button', { name: `Jouer dans la colonne ${col + 1}` }).click({
      force: true,
      timeout: 5000,
    })
    await desktop.waitForTimeout(45)
  }
  await desktop.waitForTimeout(600)
  await shoot(desktop, '09-draw')
  const drawShown = await desktop
    .getByText('Égalité !')
    .isVisible()
    .catch(() => false)
  if (!drawShown) errors.push('[desktop] draw overlay is not visible')

  // --- Mobile -------------------------------------------------------
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  attachErrors(mobile, 'mobile')
  await mobile.goto(BASE, { waitUntil: 'networkidle' })
  await shoot(mobile, '07-mobile-menu')
  await mobile.getByRole('button', { name: /lancer la partie/i }).click()
  await mobile.waitForTimeout(400)
  await play(mobile, 1, 500)
  await shoot(mobile, '08-mobile-game')

  await browser.close()
} finally {
  server.kill()
}

console.log(JSON.stringify({ shots, errors }, null, 2))
if (errors.length > 0) process.exitCode = 1
