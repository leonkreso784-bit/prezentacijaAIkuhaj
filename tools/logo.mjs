// Logo s "Ai" (malo i, da ne podsjeća na A1): crveni kvadrat, krem lonac iz loga, para.
//   node tools/logo.mjs  → src/assets/logo-ai.png (1024 px)
import { chromium } from 'playwright'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
const font = pathToFileURL(path.resolve('node_modules/@fontsource/nunito/files/nunito-latin-900-normal.woff2')).href
const C = { red: '#D0161B', cream: '#FFF4E6' }
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="1024" height="1024">
  <rect width="1254" height="1254" rx="300" fill="${C.red}"/>
  <path d="M1035 185 C960 225 930 300 1000 350 C1080 405 1130 450 1050 500" fill="none" stroke="${C.cream}" stroke-width="58" stroke-linecap="round"/>
  <g fill="none" stroke="${C.cream}" stroke-width="64" stroke-linecap="round">
    <path d="M285 700 C195 625 105 640 105 735 C105 815 185 835 250 842"/>
    <path d="M969 700 C1059 625 1149 640 1149 735 C1149 815 1069 835 1004 842"/>
  </g>
  <path fill="${C.cream}" d="M295 640 L959 640 C1010 755 1032 825 1030 905 C1026 1065 940 1112 820 1124 C700 1134 554 1134 434 1124 C314 1112 228 1065 224 905 C222 825 244 755 295 640 Z"/>
  <rect fill="${C.cream}" x="222" y="566" width="810" height="88" rx="44"/>
  <g transform="rotate(-10 627 520) translate(-30 -40)">
    <path fill="${C.cream}" d="M262 548 C285 440 969 440 992 548 C992 562 262 562 262 548 Z"/>
    <rect fill="${C.cream}" x="600" y="402" width="54" height="60"/>
    <rect fill="${C.cream}" x="527" y="362" width="200" height="62" rx="31"/>
  </g>
  <text x="627" y="1052" text-anchor="middle" font-family="N" font-weight="900" font-size="440" fill="${C.red}">Ai</text>
</svg>`
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1024, height: 1024 } })
const tmp = path.resolve('node_modules/.cache-logo.html')
writeFileSync(tmp, `<!doctype html><style>@font-face{font-family:N;src:url(${font});font-weight:900}html,body{margin:0;background:transparent}</style>${svg.replace('font-weight="900"', 'style="font-weight:900" stroke="' + C.red + '" stroke-width="10" stroke-linejoin="round" paint-order="stroke"')}`)
await p.goto(pathToFileURL(tmp).href)
console.log('font ok:', await p.evaluate(async () => { await document.fonts.load('900 100px N'); return document.fonts.check('900 100px N') }))
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(300)
await p.locator('svg').screenshot({ path: 'src/assets/logo-ai.png', omitBackground: true })
await b.close()
console.log('src/assets/logo-ai.png')
