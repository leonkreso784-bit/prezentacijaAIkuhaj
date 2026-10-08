import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import '@fontsource/unbounded/600.css'
import '@fontsource/unbounded/700.css'
import '@fontsource/unbounded/800.css'
import './style.css'
import gsap from 'gsap'
import QRCode from 'qrcode'
import { createWorld } from './world.js'
import { APP_URL } from './config.js'
import logoUrl from './assets/logo.png'
import icons from './assets/icons.json'

const foodUrls = import.meta.glob('./assets/food/*.jpg', { eager: true, import: 'default' })
const params = new URLSearchParams(location.search)
const NO_REDIRECT = params.has('noredirect')
// snimanje (spori headless preglednik): bez usporavanja vremena kad kasne kadrovi
if (params.has('shot')) gsap.ticker.lagSmoothing(0)

const loadImg = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src })

async function boot() {
  await Promise.all(['600', '700', '800', '900'].map((w) => document.fonts.load(`${w} 40px Nunito`)).concat(
    ['600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Unbounded`))))
  const images = {}
  await Promise.all(Object.entries(foodUrls).map(async ([path, url]) => {
    images[path.split('/').pop().replace('.jpg', '')] = await loadImg(url)
  }))

  document.querySelectorAll('img[data-src="logo"]').forEach((i) => { i.src = logoUrl })
  const icon = document.createElement('link'); icon.rel = 'icon'; icon.href = logoUrl; document.head.appendChild(icon)
  document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icons[+el.dataset.icon] })
  document.getElementById('qr').innerHTML = await QRCode.toString(APP_URL, {
    type: 'svg', margin: 0, errorCorrectionLevel: 'H', color: { dark: '#2B1D16', light: '#FFFFFF' },
  }) + `<img src="${logoUrl}" alt="" />`

  const W = createWorld(document.getElementById('gl'), { images })
  window.__world = W
  return W
}

const W = await boot()
const slides = [...document.querySelectorAll('.slide')]
const dots = document.getElementById('dots')
slides.forEach(() => dots.appendChild(document.createElement('i')))
const P = W.potState
const pot = (o, d = 1.6, ease = 'power3.inOut') => gsap.to(P, { ...o, duration: d, ease, overwrite: 'auto' })
const camTo = (pos, target, d = 1.8, ease = 'power3.inOut') => {
  gsap.to(W.cam.pos, { x: pos[0], y: pos[1], z: pos[2], duration: d, ease, overwrite: 'auto' })
  gsap.to(W.cam.target, { x: target[0], y: target[1], z: target[2], duration: d, ease, overwrite: 'auto' })
}
// mobitel uspravno: tekst gore, 3D dolje (kamera gleda više pa je pod nisko na ekranu)
const PT = () => W.portrait
const PCAM = [[0, 5.6, 9.5], [0, 5.1, 0]]
// uspravni mobitel: okomita 9:16 verzija videa (ako postoji); bira se odmah da se preuzme prava datoteka
const pickVideo = (v) => { const src = PT() ? v.dataset.mob : v.dataset.desk; if (v.getAttribute('src') !== src) { v.src = src; v.load() } }
document.querySelectorAll('video').forEach(pickVideo)
const fmt = (n, dec) => n.toFixed(dec).replace('.', ',')
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = el.dataset.count.includes('.') ? 2 : 0
    const suffix = dec ? ' €' : ''
    const o = { v: 0 }
    gsap.to(o, { v: end, duration: 1.4, delay: 0.5, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v, dec) + suffix } })
  })
}

// ---------- scene po slajdu ----------
// enter(dir) vraća opcionalni timeline koji se ubija kad se slajd napusti
const SCENES = {
  title() {
    PT() ? camTo(...PCAM) : camTo([0, 1.5, 8], [0, 1, 0])
    pot({ x: PT() ? 0 : 2.3, y: 0, z: 0, s: PT() ? 1.3 : 1.25, ry: PT() ? -0.15 : -0.35, rx: 0, lift: 0, tilt: 0, away: 0, boil: 0.35, steam: 1 })
    W.setIngredients('ring', { dur: 1.8, stagger: 0.04, hop: 0.4 })
    W.setCards('hidden', { dur: 0.8, stagger: 0.02 })
    W.setReels('hidden', { dur: 0.8 })
  },
  doom() {
    PT() ? camTo(...PCAM) : camTo([0, 1.4, 8], [0, 1, 0])
    pot({ x: 4.5, y: 0, z: -4, s: 0.0001, ry: -0.8, lift: 0, tilt: 0, away: 0, boil: 0, steam: 0 }, 1.2)
    W.setIngredients('hidden', { dur: 1.1, stagger: 0.02, ease: 'power2.in' })
    W.setCards('hidden', { dur: 0.8 })
    W.setReels('feed', { dur: 1.6, stagger: 0.08, ease: 'power3.out' })
  },
  waste() {
    PT() ? camTo([0, 4.6, 8.6], [0, 4.0, 0]) : camTo([0.4, 1.35, 7.4], [0.9, 0.7, 0])
    pot({ x: 4.5, y: 0, z: -4, s: 0.0001, steam: 0, boil: 0 }, 1)
    W.setReels('hidden', { dur: 0.9, stagger: 0.03, ease: 'power2.in' })
    W.setCards('hidden', { dur: 0.6 })
    W.setIngredients('fallen', { dur: 1.5, stagger: 0.05, delay: 0.3, ease: 'bounce.out' })
  },
  kuhaj(root) {
    PT() ? camTo(...PCAM, 1.6) : camTo([0, 2.3, 8.4], [0, 1.75, 0], 1.6)
    W.setReels('hidden', { dur: 0.6 })
    W.setCards('hidden', { dur: 0.6 })
    gsap.killTweensOf(P)
    gsap.set(P, { x: 0, y: 0, z: 0, s: 0.0001, ry: -0.2, rx: 0, lift: 0, tilt: 0, away: 0, boil: 0, steam: 0 })
    const k = root.querySelector('.kuhaj'), letters = k.querySelectorAll(':scope > span'), j = k.querySelector('.j'), ai = k.querySelector('.ai')
    const stop = root.querySelector('.stop')
    gsap.set([stop, ...letters], { opacity: 0 })
    gsap.set(j, { opacity: 1, rotationX: 0, x: 0 })
    gsap.set(ai, { opacity: 0, rotationX: -90 })
    k.classList.remove('glitch')
    const tl = gsap.timeline()
    tl.fromTo(stop, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, 0.25)
      .fromTo(letters, { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'back.out(2.5)' }, 0.75)
      .to(P, { s: PT() ? 1.45 : 1.3, duration: 0.7, ease: 'back.out(1.7)' }, 0.8)
      .add(() => W.setIngredients('pot', { dur: 1.1, stagger: 0.035, hop: 1.4, ease: 'power2.in' }), 0.9)
      .call(() => k.classList.add('glitch'), null, 1.6)
      .to(j, { keyframes: { x: [0, -14, 10, -6, 12, 0], skewX: [0, 14, -10, 6, 0, 0] }, duration: 0.5, ease: 'none' }, 1.6)
      .call(() => k.classList.remove('glitch'), null, 2.1)
      .to(j, { rotationX: 90, opacity: 0, duration: 0.25, ease: 'power2.in' }, 2.1)
      .to(ai, { rotationX: 0, opacity: 1, duration: 0.45, ease: 'back.out(2.5)' }, 2.3)
      .to(P, { lift: 0.7, tilt: 1, duration: 0.35, ease: 'back.out(3)' }, 2.3)
      .to(P, { steam: 2.2, boil: 1, duration: 0.3 }, 2.3)
      .to(P, { lift: 0.32, steam: 1.2, boil: 0.6, duration: 1.4, ease: 'power2.inOut' }, 2.8)
    return tl
  },
  how() {
    PT() ? camTo([0, 6.2, 9.5], [0, 5.7, 0]) : camTo([0, 1.6, 8], [0, 1, 0])
    pot({ x: PT() ? 0 : -2.4, y: 0, z: 0, s: PT() ? 1.0 : 1.05, ry: 0.35, rx: 0, lift: 0.25, tilt: 0.6, away: 0, boil: 0.5, steam: 1 })
    W.setIngredients('ring', { dur: 1.6, stagger: 0.03, hop: 0.8, ease: 'power3.out' })
    W.setCards('hidden', { dur: 0.8 })
    W.setReels('hidden', { dur: 0.6 })
  },
  week(root) {
    PT() ? camTo([0, 3.65, 9.5], [0, 3.35, 0]) : camTo([0, 1.15, 6.9], [0, 1.0, 0])
    pot({ x: 0, y: 0, z: -7, s: 0.0001, boil: 0, steam: 0 }, 1.2)
    W.setIngredients('hidden', { dur: 1.1, stagger: 0.02, ease: 'power2.in' })
    W.setReels('hidden', { dur: 0.6 })
    W.setCards('week', { dur: 1.5, stagger: 0.07, hop: 0.6, ease: 'power3.out' })
    const icon = root.querySelector('.shake')
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.2, delay: 2.4 })
    tl.to(icon, { keyframes: { rotation: [0, -14, 12, -10, 8, 0] }, duration: 0.5 }, 0)
      .add(W.shakeCard(3), 0)
    return tl
  },
  nums(root) {
    PT() ? camTo(...PCAM) : camTo([0, 1.45, 8], [0, 1.0, 0])
    pot({ x: 0, y: 0, z: -7, s: 0.0001, steam: 0 }, 1)
    W.setIngredients('hidden', { dur: 1.1, stagger: 0.02, ease: 'power2.in' })
    W.setReels('hidden', { dur: 0.6 })
    W.setCards(PT() ? 'hidden' : 'fan', { dur: 1.5, stagger: 0.05, ease: 'power3.inOut' })
    countUp(root)
  },
  tech() {
    PT() ? camTo([0, 8.4, 2.3], [0, 0.55, 1.1], 2) : camTo([0, 7.6, 1.6], [0, 0.55, -0.75], 2)
    pot({ x: 0, y: 0, z: 0, s: 1.25, ry: 0, rx: 0, lift: 0.4, tilt: 0, away: 1, boil: 0.9, steam: 0.25 }, 1.8)
    W.setCards('hidden', { dur: 0.8, stagger: 0.02 })
    W.setReels('hidden', { dur: 0.6 })
    W.setIngredients('swirl', { dur: 1.8, stagger: 0.03, hop: 1.2, delay: 0.3 })
  },
  qr() {
    PT() ? camTo([0, 6.6, 9.5], [0, 6.1, 0]) : camTo([0, 1.5, 8], [0, 1, 0])
    pot({ x: PT() ? 0 : -2.5, y: 0, z: 0, s: PT() ? 1.0 : 1.25, ry: 0.35, rx: 0, lift: 0.3, tilt: 0.8, away: 0, boil: 0.6, steam: 1.1 }, 1.8)
    W.setIngredients('ring', { dur: 1.8, stagger: 0.03, hop: 0.9 })
    W.setCards('hidden', { dur: 0.6 })
    W.setReels('hidden', { dur: 0.6 })
  },
  video(root) {
    // lonac se zakuha, a crtić izroni ispred njega
    PT() ? camTo(...PCAM, 1.4) : camTo([0, 1.5, 8], [0, 1, 0], 1.4)
    pot({ x: 0, y: 0, z: 0, s: 1.3, ry: 0, rx: 0, lift: 0.5, tilt: 0.8, away: 0, boil: 1, steam: 1.6 }, 1.2)
    W.setIngredients('ring', { dur: 1.4, stagger: 0.02, hop: 0.6 })
    W.setCards('hidden', { dur: 0.6 })
    W.setReels('hidden', { dur: 0.6 })
    const v = root.querySelector('video')
    pickVideo(v)
    v.currentTime = 0
    v.muted = false
    v.onended = () => { if (slides[cur] === root) go(cur + 1) }
    document.body.classList.add('playing')
    const tl = gsap.timeline()
    tl.fromTo(root.querySelector('.video-wrap'), { scale: 0.2, rotation: -4 }, { scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(1.2)' }, 0.35)
      .call(() => v.play().catch(() => { v.muted = true; v.play() }), null, 0.6)
    return tl
  },
  go(root) {
    const msg = root.querySelector('.go-msg'), flash = document.getElementById('flash')
    gsap.set(msg, { opacity: 0 })
    const tl = gsap.timeline()
    tl.to(P, { x: 0, z: 0, s: 1.3, ry: 0, lift: 1.6, tilt: 0, away: 1, steam: 2, boil: 1, duration: 0.8, ease: 'power3.inOut' }, 0)
      .to(W.cam.pos, { x: 0, y: 6.5, z: 0.6, duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(W.cam.target, { x: 0, y: 0.8, z: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
      .to(W.cam.pos, { y: 1.3, z: 0.05, duration: 0.8, ease: 'power3.in' }, 0.9)
      .to(flash, { opacity: 1, duration: 0.35, ease: 'power1.in' }, 1.45)
      .fromTo(msg, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 1.7)
      .call(() => { if (!NO_REDIRECT) location.href = APP_URL }, null, 2.3)
    return tl
  },
}

// ---------- prijelazi ----------
let cur = -1, sceneTl = null
function go(n) {
  n = Math.max(0, Math.min(slides.length - 1, n))
  if (n === cur) return
  const prev = slides[cur], next = slides[n]
  sceneTl?.kill(); sceneTl = null
  if (prev) {
    prev.querySelectorAll('video').forEach((v) => { v.pause(); v.onended = null })
    document.body.classList.remove('playing')
    const els = [...prev.querySelectorAll('.a')]
    const hidePrev = () => { if (slides[cur] !== prev) prev.classList.remove('on') }
    if (els.length) {
      gsap.killTweensOf(els)
      gsap.to(els, { opacity: 0, y: -24, filter: 'blur(6px)', duration: 0.35, stagger: 0.03, ease: 'power2.in', onComplete: hidePrev })
    } else gsap.delayedCall(0.35, hidePrev)
  }
  gsap.set('#flash', { opacity: 0 })
  next.classList.add('on')
  const els = [...next.querySelectorAll('.a')]
  if (els.length) gsap.killTweensOf(els)
  if (els.length) gsap.fromTo(els, { opacity: 0, y: 34, filter: 'blur(8px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.09, delay: prev ? 0.35 : 0.6, ease: 'power3.out', clearProps: 'filter' })
  cur = n
  sceneTl = SCENES[next.dataset.scene]?.(next) || null
  ;[...dots.children].forEach((d, i) => d.classList.toggle('on', i === n))
  history.replaceState(null, '', `#${n + 1}`)
  updateNotes()
}

// ---------- kontrole ----------
const notes = document.getElementById('notes')
function updateNotes() { notes.textContent = slides[cur].dataset.notes || '' }
const timerEl = document.getElementById('timer')
let tStart = 0, tId = 0
function toggleTimer() {
  if (!timerEl.hidden) { timerEl.hidden = true; clearInterval(tId); return }
  timerEl.hidden = false
  tStart = performance.now()
  const tick = () => {
    const left = 180 - (performance.now() - tStart) / 1000, a = Math.abs(Math.round(left))
    timerEl.textContent = `${left < 0 ? '+' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`
    timerEl.classList.toggle('late', left < 15)
  }
  tick(); tId = setInterval(tick, 250)
}
const hint = document.getElementById('hint')
setTimeout(() => hint.classList.add('gone'), 4500)

addEventListener('keydown', (e) => {
  const k = e.key
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); go(cur + 1) }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); go(cur - 1) }
  else if (k === 'Home') go(0)
  else if (k === 'End') go(slides.length - 2)
  else if (/^[1-9]$/.test(k)) go(+k - 1)
  else if (k === 'f' || k === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
  else if (k === 't' || k === 'T') toggleTimer()
  else if (k === 'n' || k === 'N') notes.hidden = !notes.hidden
  else return
  hint.classList.add('gone')
})
// promjena orijentacije: ponovno složi trenutni slajd
let wasPortrait = PT()
document.body.classList.toggle('portrait', wasPortrait)
addEventListener('resize', () => {
  if (PT() === wasPortrait) return
  wasPortrait = PT()
  document.body.classList.toggle('portrait', wasPortrait)
  const n = cur; cur = -1; slides.forEach((s) => s.classList.remove('on')); go(n)
})
// dodir: tap = dalje, povlačenje desno = natrag, lijevo = dalje
let touch = null, swiped = false
addEventListener('touchstart', (e) => { touch = e.touches[0]; swiped = false }, { passive: true })
addEventListener('touchend', (e) => {
  if (!touch) return
  const dx = e.changedTouches[0].clientX - touch.clientX, dy = e.changedTouches[0].clientY - touch.clientY
  touch = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(cur + (dx < 0 ? 1 : -1)) }
})
if (matchMedia('(pointer: coarse)').matches) hint.textContent = 'Dodirni za dalje · povuci udesno za natrag'
addEventListener('click', () => { if (swiped) { swiped = false; return } go(cur + 1) })
addEventListener('contextmenu', (e) => { e.preventDefault(); go(cur - 1) })

window.__go = go
const start = parseInt(location.hash.slice(1), 10)
go(Number.isFinite(start) && start < slides.length ? start - 1 : 0)
