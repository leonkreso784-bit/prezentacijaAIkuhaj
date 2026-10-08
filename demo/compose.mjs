// Montaža demo videa iz snimke (demo/record.mjs): telefon u okviru, naslovi poglavlja, čekanje na AI ubrzano.
//   node demo/compose.mjs [mapa_snimke] [izlaz.mp4]
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
// --kratko: verzija od ~40 s za pitch (bez AI pitanja i recepta, brže)
const SHORT = process.argv.includes('--kratko')
const args = process.argv.slice(2).filter((a) => a !== '--kratko')
const REC = args[0] || path.join(HERE, 'out', 'rec')
const OUT = args[1] || path.join(HERE, 'out', SHORT ? 'kuhai-demo-kratko.mp4' : 'kuhai-demo.mp4')
const FPS = 30
const WAIT_MAX = SHORT ? 1.1 : 2.4   // koliko čekanje na AI najviše traje u videu (s)
const PACE = SHORT ? 1.75 : 1.2      // ostatak snimke ubrzan da demo bude zbijen

const ev = JSON.parse(readFileSync(path.join(REC, 'events.json'), 'utf8'))
const rel = (ts) => ts - ev.t0                        // CDP vrijeme → sekunde od početka snimanja
const frames = ev.frames.map((f) => ({ t: rel(f.t), file: f.file }))
const start = rel(ev.startWall) - 0.1
const end = ev.events.find((e) => e.type === 'end').t
const at = (type, label) => ev.events.find((e) => e.type === type && e.label === label).t

// izrezani dijelovi snimke (stvarno vrijeme)
const CUTS = SHORT ? [
  [start, start + 1.3],                                       // aplikacija se još učitava
  [at('wait', 'pitanja'), at('chapter', 'Slikaj frižider')],  // AI pitanja
  [at('chapter', 'Recept'), at('chapter', 'Košarica') - 0.2], // recept i zamjena
] : []
// čekanja: [wait, ready] parovi → ubrzaj na WAIT_MAX
const waits = []
ev.events.forEach((e, i) => {
  if (e.type !== 'wait') return
  const r = ev.events.slice(i).find((x) => x.type === 'ready' && x.label === e.label)
  if (r && r.t - e.t > WAIT_MAX) waits.push({ a: e.t, b: r.t, label: e.label })
})
// zadržani dijelovi = cijela snimka bez izreza
let keep = [[start, end]]
for (const [c0, c1] of CUTS) keep = keep.flatMap(([a, b]) => (c1 <= a || c0 >= b) ? [[a, b]] : [[a, c0], [c1, b]].filter(([x, y]) => y - x > 0.05))
// mapa: stvarno vrijeme → vrijeme u videu
const segs = []
let out = 0
for (const [ka, kb] of keep) {
  let cur = ka
  for (const w of waits.filter((w) => w.a >= ka && w.b <= kb)) {
    segs.push({ r0: cur, r1: w.a, o0: out, speed: PACE }); out += (w.a - cur) / PACE
    segs.push({ r0: w.a, r1: w.b, o0: out, speed: (w.b - w.a) / WAIT_MAX, wait: w }); out += WAIT_MAX
    cur = w.b
  }
  segs.push({ r0: cur, r1: kb, o0: out, speed: PACE }); out += (kb - cur) / PACE
}
const DUR = out
const inCut = (r) => CUTS.some(([a, b]) => r > a && r < b)
// ekran se snima samo kad se promijeni: zadnji kadar iz izreza vrijedi i odmah nakon njega
const cutTails = CUTS.map(([, b]) => { const f = frames.findLast((f) => f.t < b); return f && { t: b, file: f.file } }).filter(Boolean)
const toOut = (r) => {
  const s = segs.find((s) => r >= s.r0 && r <= s.r1) || segs.findLast((s) => s.r1 <= r) || segs[0]
  return s.o0 + (Math.min(Math.max(r, s.r0), s.r1) - s.r0) / s.speed
}

const LABELS = {
  pitanja: 'AI smišlja pitanja…', vision: 'AI gleda frižider…', kandidati: 'AI bira jela za tebe…',
  plan: 'AI slaže cijeli tjedan…', shake: 'Tražim novo jelo…', swap: 'Tražim zamjenu…',
}
const SUBS = {
  'KuhAI': 'Otvori aplikaciju i kreni.',
  'Upoznajmo se': 'Tri brza koraka: koliko vas je, kako kuhaš i što voliš.',
  'Slikaj frižider': 'AI prepozna namirnice i što uskoro ističe.',
  'Što ti se jede?': 'Bih ovo ili ne bih ovo. Kao swipe.',
  'Tvoj tjedan': 'Jelovnik i meal prep, složeni od onoga što već imaš.',
  'Protresi': 'Ne paše ti? Protresi i dobiješ novo jelo.',
  'Recept': 'Svaki obrok s receptom, a zamjena je jedan dodir.',
  'Košarica': 'Samo ono što fali, po cijenama iz Konzuma.',
  'Narudžba poslana': 'Dostava ili preuzimanje. Gotovo.',
}
const chapters = ev.events.filter((e) => e.type === 'chapter' && !inCut(e.t) && !(SHORT && e.label === 'Recept')).map((e) => ({ t: Math.max(0, toOut(e.t)), title: e.label, sub: SUBS[e.label] || '' }))
const DATA = {
  frames: frames.filter((f) => f.t >= start - 2 && f.t <= end + 0.5 && !inCut(f.t)).concat(cutTails).sort((a, b) => a.t - b.t).map((f) => ({ t: toOut(Math.max(f.t, start)), file: pathToFileURL(path.join(REC, f.file)).href })),
  chapters,
  waits: segs.filter((s) => s.wait).map((s) => ({ a: s.o0, b: s.o0 + WAIT_MAX, speed: s.speed, label: LABELS[s.wait.label] || 'AI radi…' })),
  dur: DUR,
  logo: pathToFileURL(path.join(HERE, '..', 'src', 'assets', 'logo-ai.png')).href,
}
const html = readFileSync(path.join(HERE, 'compose.html'), 'utf8').replace('<script src="https://cdnjs', `<script>window.DATA = ${JSON.stringify(DATA)}</script>\n<script src="https://cdnjs`)
const page = path.join(REC, 'compose.built.html')
writeFileSync(page, html)
console.log(`trajanje ${DUR.toFixed(1)} s, poglavlja ${chapters.length}, čekanja ${DATA.waits.map((w) => w.speed.toFixed(0) + '×').join(' ')}`)

const b = await chromium.launch({ args: ['--allow-file-access-from-files'] })
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
p.on('pageerror', (e) => console.error('PAGE ERROR', e.message))
await p.goto(pathToFileURL(page).href)
await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 })
if (args[2] === 'stills') {
  for (const t of args.slice(3).map(Number)) {
    await p.evaluate((t) => window.__seek(t), t)
    await p.screenshot({ path: path.join(REC, `still-${t}.png`) })
  }
} else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] })
  const n = Math.round(DUR * FPS)
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.__seek(t), i / FPS)
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (i % 300 === 0) console.log(`kadar ${i}/${n}`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  console.log('gotovo →', OUT)
}
await b.close()
