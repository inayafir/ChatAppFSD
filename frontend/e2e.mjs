import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const tag = Date.now().toString(36)
const MSG_ONE = `hello from alice ${tag}`
const MSG_TWO = `one copy only ${tag}`
const CHANNEL_NAME = `e2e-${tag}`

const failures = []
const browserErrors = []

function check(label, condition) {
  if (condition) console.log(`  ok - ${label}`)
  else {
    console.log(`  FAIL - ${label}`)
    failures.push(label)
  }
}

async function login(browser, username) {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on('pageerror', (error) => browserErrors.push(`[${username}] pageerror: ${error.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') browserErrors.push(`[${username}] console: ${msg.text()}`)
  })
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#username', { timeout: 15000 })
  await page.fill('#username', username)
  await page.click('button[type=submit]')
  await page.waitForURL('**/chat', { timeout: 20000 })
  await page.waitForSelector('header:has-text("general")', { timeout: 15000 })
  return { context, page }
}

const browser = await chromium.launch()

try {
  const alice = await login(browser, 'E2EAlice')
  const bob = await login(browser, 'E2EBob')

  // 1. history is loaded via REST
  await alice.page.waitForSelector('text=Welcome to ChatApp', { timeout: 10000 })
  check('message history loads on channel open', true)

  // 2. presence: both users see each other in the online list (real time)
  const aliceRight = alice.page.locator('aside').last()
  const bobRight = bob.page.locator('aside').last()
  await aliceRight.locator('text=E2EBob').waitFor({ timeout: 10000 })
  await bobRight.locator('text=E2EAlice').waitFor({ timeout: 10000 })
  check('online users list updates in real time', true)

  // 3. send a message from Alice -> appears instantly on Bob's screen
  const aliceInput = alice.page.locator('textarea')
  await aliceInput.fill(MSG_ONE)
  await aliceInput.press('Enter')
  await alice.page.waitForSelector(`p:has-text("${MSG_ONE}")`, { timeout: 10000 })
  await bob.page.waitForSelector(`p:has-text("${MSG_ONE}")`, { timeout: 10000 })
  check('message appears instantly for the sender', true)
  check('message appears instantly for the other user', true)
  check(
    'messages are not duplicated',
    (await bob.page.locator(`p:has-text("${MSG_ONE}")`).count()) === 1,
  )
  check(
    'other user sees no delete button on my message',
    (await bob.page.locator('[title="Delete message"]').count()) === 0,
  )

  // 4. typing indicator
  await aliceInput.fill(`just typing ${tag}`)
  await bob.page.waitForSelector('text=E2EAlice is typing...', { timeout: 10000 })
  check('typing indicator shown to the other user', true)
  await aliceInput.fill('')

  // 5. delete own message -> disappears for everyone in real time
  const aliceMsg = alice.page.locator('li', { hasText: MSG_ONE })
  await aliceMsg.hover()
  await aliceMsg.locator('[title="Delete message"]').click()
  await alice.page.waitForSelector(`p:has-text("${MSG_ONE}")`, { state: 'detached', timeout: 10000 })
  check('deleted message disappears for sender', true)
  await bob.page.waitForSelector(`p:has-text("${MSG_ONE}")`, { state: 'detached', timeout: 10000 })
  check('deleted message disappears for other users', true)

  // 6. channel created by Alice shows up in Bob's sidebar live
  await alice.page.click('button[title="Create channel"]')
  await alice.page.fill('#channel-name', CHANNEL_NAME)
  await alice.page.click('button:has-text("Create channel")')
  await bob.page.waitForSelector(`button:has-text("${CHANNEL_NAME}")`, { timeout: 10000 })
  check('new channel broadcast to other users', true)

  // 7. channel switching re-loads history without duplicates
  await alice.page.click('button:has-text("random")')
  await alice.page.waitForSelector('header:has-text("random")', { timeout: 10000 })
  check('switching channel updates header', true)
  await alice.page.click('button:has-text("general")')
  await alice.page.waitForSelector('text=Welcome to ChatApp', { timeout: 10000 })

  await bob.page.locator('textarea').fill(MSG_TWO)
  await bob.page.locator('textarea').press('Enter')
  await alice.page.waitForSelector(`p:has-text("${MSG_TWO}")`, { timeout: 10000 })
  check(
    'no duplicate after channel switch re-subscribe',
    (await alice.page.locator(`p:has-text("${MSG_TWO}")`).count()) === 1,
  )

  // 8. typing indicator clears after a while
  await alice.page.waitForSelector('text=is typing...', { state: 'detached', timeout: 8000 })
  check('typing indicator expires', true)

  // 9. per-channel isolation: message sent in #general not visible in #random
  await bob.page.click('button:has-text("random")')
  await bob.page.waitForSelector('header:has-text("random")', { timeout: 10000 })
  await bob.page.waitForTimeout(500)
  check(
    'messages scoped to their channel',
    (await bob.page.locator(`p:has-text("${MSG_TWO}")`).count()) === 0,
  )
} catch (error) {
  failures.push(`exception: ${error.message}`)
  console.log('  FAIL - exception:', error.message)
} finally {
  await browser.close()
}

const fatalErrors = browserErrors.filter((line) => !/favicon/i.test(line))
if (fatalErrors.length) {
  console.log('  browser errors:')
  fatalErrors.slice(0, 10).forEach((line) => console.log(`    ${line}`))
}

console.log(failures.length === 0 && fatalErrors.length === 0 ? 'E2E PASS' : 'E2E FAIL')
process.exit(failures.length === 0 && fatalErrors.length === 0 ? 0 : 1)
