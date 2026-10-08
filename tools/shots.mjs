// Snimke svih slajdova za provjeru: node tools/shots.mjs [izlazna_mapa] [širina] [visina]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const [out = 'shots', w = 1920, h = 1080, mobile] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage({ viewport: { width: +w, height: +h }, ...(mobile ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}) })
p.on('pageerror', (e) => console.error('PAGE ERROR', e.message))
p.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()))
await p.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?noredirect&shot')
await p.waitForFunction(() => window.__go, null, { timeout: 60000 })
const n = await p.$$eval('.slide', (s) => s.length)
for (let i = 0; i < n; i++) {
  await p.evaluate((i) => window.__go(i), i)
  await p.waitForTimeout(i === 3 ? 5000 : 4000)
  await p.screenshot({ path: `${out}/s${i + 1}.png` })
  console.log('slajd', i + 1)
}
await b.close()
