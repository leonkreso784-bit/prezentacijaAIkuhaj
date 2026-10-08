// Provjera cijele prezentacije u pravom Chromeu: prolaz naprijed/natrag, videi, brzo klikanje, odlazak na aplikaciju, FPS.
//   npm run build && node tools/qa.mjs [mapa_za_snimke] [url]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [OUT = 'shots/qa', URL = pathToFileURL(path.resolve('dist/index.html')).href] = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })
const APP = 'https://kuhai-web-production.up.railway.app/'
const problems = []
const fail = (m) => { problems.push(m); console.log('  ✗', m) }
const ok = (m) => console.log('  ✓', m)

const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu', '--ignore-gpu-blocklist'] })

async function open(opts, query = '') {
  const p = await b.newPage(opts)
  const logs = []
  p.on('pageerror', (e) => logs.push('PAGE ERROR ' + e.message))
  p.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && !/X4122|GPU stall/.test(m.text()))) logs.push(`console.${m.type()} ${m.text().slice(0, 160)}`) })
  p.on('requestfailed', (r) => { if (!r.url().startsWith(APP) && !/ERR_ABORTED/.test(r.failure()?.errorText)) logs.push(`REQ FAILED ${r.url()} ${r.failure()?.errorText}`) })
  await p.route(APP + '**', (r) => r.fulfill({ contentType: 'text/html', body: '<title>KuhAI app</title>APP' }))
  await p.goto(URL + query)
  await p.waitForFunction(() => window.__go, null, { timeout: 30000 })
  return { p, logs }
}
const state = (p) => p.evaluate(() => {
  const on = [...document.querySelectorAll('.slide.on')]
  const cur = on.at(-1)
  const vis = cur ? [...cur.querySelectorAll('.a')].map((e) => +getComputedStyle(e).opacity) : []
  const vids = [...document.querySelectorAll('video')].map((v) => ({ id: v.id, paused: v.paused, t: +v.currentTime.toFixed(1) }))
  return { hash: location.hash, on: on.length, scene: cur?.dataset.scene, minOpacity: vis.length ? Math.min(...vis) : 1, vids }
})
const fps = (p, ms = 2000) => p.evaluate((ms) => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < ms ? requestAnimationFrame(f) : res(Math.round(n * 1000 / (performance.now() - t0))) }; requestAnimationFrame(f) }), ms)

// ---------- 1. PC 1920×1080: prolaz naprijed ----------
console.log('PC 1920×1080, prolaz naprijed')
{
  const { p, logs } = await open({ viewport: { width: 1920, height: 1080 } })
  const n = await p.$$eval('.slide', (s) => s.length)
  for (let i = 0; i < n - 1; i++) {
    if (i) await p.keyboard.press('ArrowRight')
    await p.waitForTimeout(i === 3 ? 3800 : 2600)
    const s = await state(p)
    await p.screenshot({ path: `${OUT}/pc-${String(i + 1).padStart(2, '0')}-${s.scene}.png` })
    if (s.on !== 1) fail(`slajd ${i + 1}: vidljivo ${s.on} slajdova`)
    if (s.minOpacity < 0.99) fail(`slajd ${i + 1} (${s.scene}): tekst nije do kraja vidljiv (${s.minOpacity})`)
    const playing = s.vids.filter((v) => !v.paused)
    if (['video', 'demoqr'].includes(s.scene)) { if (playing.length !== 1) fail(`slajd ${i + 1}: video ne svira`) }
    else if (playing.length) fail(`slajd ${i + 1}: video svira u pozadini (${playing.map((v) => v.id)})`)
    if (['title', 'kuhaj', 'tech', 'nums'].includes(s.scene)) console.log(`    ${s.scene}: ${await fps(p)} fps`)
  }
  ok(`prošao ${n - 1} slajdova`)
  // crtić na kraju sam prelazi na demo + QR
  await p.evaluate(() => window.__go(7)); await p.waitForTimeout(2000)
  let s = await state(p)
  s.vids.find((v) => v.id === 'crtic' && !v.paused) ? ok('crtić svira') : fail('crtić ne svira')
  await p.evaluate(() => { document.getElementById('crtic').currentTime = 36.6 })
  await p.waitForFunction(() => [...document.querySelectorAll('.slide.on')].at(-1)?.dataset.scene === 'demoqr', null, { timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(2000)
  s = await state(p)
  s.scene === 'demoqr' && s.vids.find((v) => v.id === 'demo' && !v.paused) ? ok('nakon crtića: demo + QR, demo svira') : fail('nakon crtića nije demo + QR: ' + JSON.stringify(s))
  const qr = await p.$eval('#qr svg', (e) => e.getBoundingClientRect().width)
  qr > 250 ? ok(`QR vidljiv (${qr | 0} px)`) : fail('QR premalen')
  // natrag na crtić: svira ispočetka, demo stoji
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(2500)
  s = await state(p)
  s.vids.find((v) => v.id === 'crtic' && !v.paused && v.t < 3) && s.vids.find((v) => v.id === 'demo' && v.paused) ? ok('natrag na crtić: svira ispočetka') : fail('natrag na crtić: ' + JSON.stringify(s))
  // brzo klikanje
  await p.evaluate(() => window.__go(3)); await p.waitForTimeout(1000)
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft']) { await p.keyboard.press(k); await p.waitForTimeout(90) }
  await p.waitForTimeout(2500)
  s = await state(p)
  s.on === 1 && s.minOpacity > 0.99 && !s.vids.some((v) => !v.paused) ? ok(`brzo klikanje: čisto (${s.scene})`) : fail('brzo klikanje: ' + JSON.stringify(s))
  // demo do kraja: ostaje na slajdu; tek strelica otvara aplikaciju
  await p.evaluate(() => window.__go(8)); await p.waitForTimeout(2000)
  await p.evaluate(() => { document.getElementById('demo').currentTime = 39.2 })
  await p.waitForTimeout(5000)
  s = await state(p)
  s.scene === 'demoqr' && !p.url().startsWith(APP) ? ok('demo završio, ostaje na slajdu s QR kodom') : fail('demo nije ostao na slajdu: ' + JSON.stringify(s))
  const box = await p.$eval('.s-qrdemo .video-wrap', (e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight } })
  box.top >= 0 && box.bottom <= box.h ? ok('demo je cijeli na ekranu i nakon ponovnog ulaska') : fail('demo izlazi iz ekrana: ' + JSON.stringify(box))
  await p.screenshot({ path: `${OUT}/pc-demoqr-kraj.png` })
  await p.keyboard.press('ArrowRight')
  await p.waitForURL(APP, { timeout: 15000 }).then(() => ok('strelica otvara aplikaciju')).catch(() => fail('strelica ne otvara aplikaciju'))
  logs.length ? logs.forEach((l) => fail(l)) : ok('nema grešaka u konzoli')
  await p.close()
}

// ---------- 2. projektor 16:10 i 4:3 ----------
for (const [w, h] of [[1280, 800], [1024, 768]]) {
  const { p } = await open({ viewport: { width: w, height: h } }, '?noredirect')
  for (const i of [0, 4, 5, 6, 8]) { await p.evaluate((i) => window.__go(i), i); await p.waitForTimeout(2600); await p.screenshot({ path: `${OUT}/r${w}x${h}-${i + 1}.png` }) }
  ok(`${w}×${h} snimljeno`)
  await p.close()
}

// ---------- 3. mobitel uspravno ----------
{
  const { p, logs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, '?noredirect')
  const n = await p.$$eval('.slide', (s) => s.length)
  for (let i = 0; i < n - 1; i++) {
    if (i) await p.tap('body', { position: { x: 200, y: 420 } })
    await p.waitForTimeout(2600)
    const s = await state(p)
    await p.screenshot({ path: `${OUT}/mob-${String(i + 1).padStart(2, '0')}-${s.scene}.png` })
    if (s.on !== 1 || s.minOpacity < 0.99) fail(`mobitel slajd ${i + 1}: ${JSON.stringify(s)}`)
  }
  ok('mobitel: prošao sve slajdove dodirom')
  logs.forEach((l) => fail('mobitel ' + l))
  await p.close()
}
await b.close()
console.log(problems.length ? `\n${problems.length} problema` : '\nSVE U REDU')
process.exitCode = problems.length ? 1 : 0
