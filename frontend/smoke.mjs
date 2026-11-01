import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const failures = []
const pageErrors = []

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()
page.on('pageerror', (error) => pageErrors.push(`pageerror: ${error.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`)
})

function check(label, condition) {
  if (condition) console.log(`  ok - ${label}`)
  else {
    console.log(`  FAIL - ${label}`)
    failures.push(label)
  }
}

try {
  // --- login page ---
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  check('login page renders', await page.locator('h1:has-text("Welcome back")').isVisible())

  await page.fill('#username', 'PlayTester')
  await page.click('button[type=submit]')
  await page.waitForURL('**/chat', { timeout: 10000 })
  check('redirects to /chat after login', page.url().endsWith('/chat'))

  // --- channel list ---
  await page.waitForSelector('text=tech-talk', { timeout: 10000 })
  check('seeded channels visible', await page.locator('text=general').count() >= 1)

  // --- channel switching ---
  await page.click('button:has-text("random")')
  const header = await page.locator('header h1').textContent()
  check('switching channel updates header', header?.trim() === 'random')

  // --- create channel modal ---
  await page.click('button[title="Create channel"]')
  await page.fill('#channel-name', 'phase4-test')
  await page.click('button:has-text("Create channel")')
  await page.waitForSelector('button:has-text("phase4-test")', { timeout: 10000 })
  check('new channel appears in sidebar', true)

  // --- delete the channel we just created ---
  page.once('dialog', (dialog) => dialog.accept())
  await page.hover('button:has-text("phase4-test")')
  await page.click('[title="Delete #phase4-test"]', { force: true })
  await page.waitForSelector('button:has-text("phase4-test")', { state: 'detached', timeout: 10000 })
  check('deleted channel disappears', true)

  // --- user panel + logout ---
  check('current user shown in sidebar', await page.locator('text=PlayTester').first().isVisible())
  await page.click('button[title="Log out"]')
  await page.waitForURL('**/login', { timeout: 10000 })
  check('logout returns to login page', page.url().endsWith('/login'))

  // no stored user -> direct /chat access should bounce
  await page.goto(`${BASE}/chat`, { waitUntil: 'networkidle' })
  check('protected route redirects when logged out', page.url().endsWith('/login'))
} catch (error) {
  failures.push(`exception: ${error.message}`)
  console.log('  FAIL - exception:', error.message)
} finally {
  await browser.close()
}

const fatalErrors = pageErrors.filter((line) => !line.includes('favicon'))
if (fatalErrors.length) {
  console.log('  page/console errors:')
  fatalErrors.forEach((line) => console.log(`    ${line}`))
}

console.log(failures.length === 0 && fatalErrors.length === 0 ? 'SMOKE PASS' : 'SMOKE FAIL')
process.exit(failures.length === 0 && fatalErrors.length === 0 ? 0 : 1)
