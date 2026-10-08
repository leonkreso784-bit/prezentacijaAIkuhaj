// Snimanje demo prolaza kroz živu aplikaciju KuhAI na mobitelu (Playwright + CDP screencast).
//   node demo/record.mjs [izlazna_mapa]
// Sprema kadrove (jpg) + events.json (oznake poglavlja i čekanja na AI) za demo/compose.mjs.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APP = 'https://kuhai-web-production.up.railway.app'
const PHOTO = path.join(HERE, 'frizider.jpg')
const OUT = process.argv[2] || path.join(HERE, 'out', 'rec')
rmSync(OUT, { recursive: true, force: true })
mkdirSync(path.join(OUT, 'f'), { recursive: true })

const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 1080 / 390, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
// vidljiv "prst": krug na mjestu dodira
await ctx.addInitScript(() => {
  addEventListener('pointerdown', (e) => {
    const d = document.createElement('div')
    d.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;
      background:rgba(43,29,22,.22);border:2px solid rgba(43,29,22,.35);pointer-events:none;z-index:2147483647;
      transition:transform .45s ease-out,opacity .45s ease-out;transform:scale(.6)`
    document.documentElement.appendChild(d)
    requestAnimationFrame(() => { d.style.transform = 'scale(1.5)'; d.style.opacity = '0' })
    setTimeout(() => d.remove(), 600)
  }, true)
})
const p = await ctx.newPage()
p.on('pageerror', (e) => console.error('PAGE ERROR', e.message))

const t0 = Date.now()
const now = () => (Date.now() - t0) / 1000
const events = []
const mark = (type, label = '') => { events.push({ t: now(), type, label }); console.log(`[${now().toFixed(1)}] ${type} ${label}`) }
const pause = (s) => p.waitForTimeout(s * 1000)

// CDP screencast: kadar svaki put kad se ekran promijeni, s vremenskom oznakom
const cdp = await ctx.newCDPSession(p)
const frames = []
let n = 0
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = `f/${String(n++).padStart(5, '0')}.jpg`
  writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'))
  frames.push({ t: metadata.timestamp, file })
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})

const tap = async (loc) => { await loc.scrollIntoViewIfNeeded(); await pause(0.25); await loc.click(); await pause(0.55) }
const scroll = async (dy, steps = 12) => {
  for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, dy / steps); await pause(0.035) }
  await pause(0.4)
}
const waitAI = async (label, fn) => { mark('wait', label); await fn(); mark('ready', label); await pause(0.4) }

try {
  await p.goto(APP)
  await p.evaluate(() => localStorage.clear())
  await p.goto(APP, { waitUntil: 'networkidle' })
  await p.mouse.move(195, 400)
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 })
  const startWall = Date.now() / 1000
  mark('chapter', 'KuhAI')
  await pause(2.2)
  await tap(p.getByRole('button', { name: 'Kreni kuhati' }))

  // onboarding: 3 kratka koraka
  mark('chapter', 'Upoznajmo se')
  await pause(1.0)
  await tap(p.getByRole('radio', { name: /^3/ }).first())
  await tap(p.getByRole('radio', { name: /^Meal prep/ }))
  await tap(p.getByRole('radio', { name: 'Normalno' }))
  await pause(0.4)
  await tap(p.getByRole('button', { name: 'Dalje' }))
  await pause(0.8)
  await tap(p.getByRole('button', { name: 'Domaća' }))
  await tap(p.getByRole('button', { name: 'Mediteranska' }))
  await tap(p.getByRole('button', { name: 'Talijanska' }))
  await pause(0.4)
  await tap(p.getByRole('button', { name: 'Dalje' }))
  await waitAI('pitanja', () => p.getByText(/Ovo bi mi još pomoglo|imam sve što trebam/).waitFor({ timeout: 60_000 }))
  await pause(1.6)
  // AI pitanja: na svako pitanje tapni prvu ponuđenu opciju (ako postoji)
  const sections = p.locator('main section')
  for (let i = 0; i < await sections.count(); i++) {
    const opt = sections.nth(i).getByRole('button').first()
    if (await opt.count()) { await tap(opt); await pause(0.3) }
  }
  await pause(0.6)
  await tap(p.getByRole('button', { name: 'Slikaj frižider' }))
  await p.waitForURL(/\/frizider/, { timeout: 20_000 })

  // frižider: "slikaj" → fotka
  mark('chapter', 'Slikaj frižider')
  await pause(1.4)
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.getByText('Slikaj frižider', { exact: true }).click()])
  await chooser.setFiles(PHOTO)
  await waitAI('vision', () => p.getByRole('button', { name: 'Složi mi tjedan' }).waitFor({ timeout: 90_000 }))
  await pause(1.6)
  await scroll(500); await pause(1.0); await scroll(500); await pause(1.0)
  await tap(p.getByRole('button', { name: 'Složi mi tjedan' }))

  // kartice "Što ti se jede?"
  await p.waitForURL(/\/biram/, { timeout: 20_000 })
  mark('chapter', 'Što ti se jede?')
  await waitAI('kandidati', () => p.getByText(/^1 \/ \d+$/).waitFor({ timeout: 120_000 }))
  await pause(1.4)
  for (const a of ['Bih ovo', 'Ne bih ovo', 'Bih ovo', 'Bih ovo']) {
    await tap(p.getByRole('button', { name: a, exact: true })); await pause(0.7)
  }
  await tap(p.getByRole('button', { name: /Dosta mi je/ }))
  await p.waitForURL(/\/plan/, { timeout: 25_000 })

  // tjedni plan (AI 60–90 s)
  mark('chapter', 'Tvoj tjedan')
  await waitAI('plan', () => p.getByRole('button', { name: 'Pogledaj košaricu' }).first().waitFor({ timeout: 200_000 }))
  await pause(2.0)
  await scroll(450); await pause(1.2); await scroll(450); await pause(1.2); await scroll(450); await pause(1.0)
  await scroll(-1350, 18); await pause(0.8)

  // protresi
  mark('chapter', 'Protresi')
  const shake = p.waitForResponse((r) => r.url().includes('/shake'), { timeout: 90_000 })
  await tap(p.getByRole('button', { name: /Protresi/ }))
  await waitAI('shake', () => shake)
  await pause(2.2)

  // detalj obroka + zamjena
  mark('chapter', 'Recept')
  await tap(p.locator('a[href^="/obrok/"]').first())
  await p.getByRole('button', { name: 'Ne jede mi se ovo' }).waitFor({ timeout: 30_000 })
  await pause(1.6)
  await scroll(500); await pause(1.2); await scroll(-500); await pause(0.6)
  const swap = p.waitForResponse((r) => r.url().includes('/swap'), { timeout: 90_000 })
  await tap(p.getByRole('button', { name: 'Ne jede mi se ovo' }))
  await pause(0.6)
  await tap(p.getByRole('button', { name: 'Samo mi daj nešto drugo' }))
  await waitAI('swap', () => swap)
  await pause(2.0)
  await p.goBack()
  await pause(1.0)

  // košarica i narudžba
  mark('chapter', 'Košarica')
  await tap(p.getByRole('button', { name: 'Pogledaj košaricu' }).last())
  await p.getByText('Pretpostavka:').waitFor({ timeout: 30_000 })
  await pause(1.8)
  await scroll(450); await pause(1.2); await scroll(450); await pause(1.0)
  await tap(p.getByRole('button', { name: 'Naruči namirnice' }))
  await pause(1.4)
  await tap(p.getByRole('dialog').getByRole('button').filter({ hasText: /Naruči|Potvrdi/ }).last())
  mark('chapter', 'Narudžba poslana')
  await pause(3.5)
  mark('end')
  await cdp.send('Page.stopScreencast')
  writeFileSync(path.join(OUT, 'events.json'), JSON.stringify({ startWall, events, frames, t0: t0 / 1000 }, null, 1))
  console.log(`gotovo: ${frames.length} kadrova`)
} catch (e) {
  console.error('PUKLO:', e.message.split('\n')[0])
  await p.screenshot({ path: path.join(OUT, 'error.png') }).catch(() => {})
  writeFileSync(path.join(OUT, 'events.json'), JSON.stringify({ events, frames, t0: t0 / 1000, error: e.message }, null, 1))
  process.exitCode = 1
} finally {
  await b.close()
}
