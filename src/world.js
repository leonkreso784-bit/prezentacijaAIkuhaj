// 3D svijet prezentacije: lonac iz loga, namirnice, kartice jela, para.
// Svaki slajd bira "raspored" (layout); objekti se glatko pretapaju iz trenutnog stanja u novi raspored.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import gsap from 'gsap'

const C = {
  bg: '#FFFBF6', brand: '#D0161B', brandDark: '#8E0F12', cream: '#FFF4E6',
  ink: '#2B1D16', muted: '#8A6F60', line: '#F0E4D6', fresh: '#2E7D32', hot: '#C2410C', warn: '#9A5B00',
}
const TAU = Math.PI * 2
const lerp = THREE.MathUtils.lerp

export function createWorld(canvas, { images, logo }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(C.bg)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55

  const BASE_FOV = 35
  const PORTRAIT_MAX = 0.85
  let portrait = false
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 16 / 9, 0.1, 100)
  const cam = { pos: new THREE.Vector3(0, 1.5, 8), target: new THREE.Vector3(0, 1, 0) }

  scene.add(new THREE.HemisphereLight('#ffffff', '#f1dcc6', 1.5))
  const sun = new THREE.DirectionalLight('#fff6ec', 2.4)
  sun.position.set(4, 9, 6)
  sun.castShadow = true
  sun.shadow.mapSize.setScalar(matchMedia('(pointer: coarse)').matches ? 1024 : 2048)
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 })
  sun.shadow.radius = 6
  sun.shadow.bias = -0.0004
  scene.add(sun)

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.1 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // ---------- lonac ----------
  const pot = new THREE.Group()
  scene.add(pot)
  const radius = (y) => {
    let r = 0.9 + 0.12 * Math.sin(Math.PI * (0.15 + 0.75 * y))
    const b = 0.09 // zaobljeno dno
    if (y < b) r = r - b + Math.sqrt(b * b - (b - y) ** 2)
    return r
  }
  const prof = []
  for (let i = 0; i <= 48; i++) { const y = i / 48; prof.push(new THREE.Vector2(radius(y), y)) }

  const aiCanvas = document.createElement('canvas')
  aiCanvas.width = 4096; aiCanvas.height = 660
  {
    const g = aiCanvas.getContext('2d')
    g.fillStyle = C.brand; g.fillRect(0, 0, 4096, 660)
    g.fillStyle = C.cream
    g.font = '900 560px Nunito'
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'
    g.fillText('AI', 2048, 560)
  }
  const aiTex = new THREE.CanvasTexture(aiCanvas)
  aiTex.colorSpace = THREE.SRGBColorSpace
  aiTex.anisotropy = 8
  const enamel = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.22, ...o })
  const redMat = enamel({ color: C.brand })
  const creamMat = enamel({ color: C.cream })

  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 96, -Math.PI, TAU), enamel({ map: aiTex }))
  body.castShadow = true
  pot.add(body)
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(radius(0) + 0.01, 48), redMat)
  bottom.rotation.x = Math.PI / 2
  bottom.position.y = 0.002
  pot.add(bottom)
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.86, 0.96, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: C.brandDark, side: THREE.BackSide, roughness: 0.5 }))
  inner.position.y = 0.52
  pot.add(inner)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius(1) + 0.005, 0.055, 16, 96), redMat)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 1
  rim.castShadow = true
  pot.add(rim)
  const soup = new THREE.Mesh(new THREE.CircleGeometry(0.89, 64),
    new THREE.MeshStandardMaterial({ color: '#E8743A', roughness: 0.25, emissive: '#7a2a08', emissiveIntensity: 0.25 }))
  soup.rotation.x = -Math.PI / 2
  soup.position.y = 0.8
  pot.add(soup)
  const bubbles = []
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: '#F6A86E', roughness: 0.2 }))
    const a = i * 2.4, r = 0.2 + (i % 4) * 0.17
    b.position.set(Math.cos(a) * r, 0.8, Math.sin(a) * r)
    b.scale.setScalar(0)
    pot.add(b); bubbles.push(b)
  }
  for (const s of [1, -1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.068, 14, 32, Math.PI), redMat)
    h.rotation.z = -s * Math.PI / 2
    h.position.set(s * (radius(0.72) - 0.05), 0.72, 0)
    h.castShadow = true
    pot.add(h)
  }
  const lid = new THREE.Group()
  pot.add(lid)
  const lidProf = [[0.001, 0.2], [0.25, 0.186], [0.5, 0.145], [0.75, 0.08], [0.95, 0.022], [1.02, 0], [1.02, -0.035], [0.95, -0.035]]
    .map(([x, y]) => new THREE.Vector2(x, y))
  const lidMesh = new THREE.Mesh(new THREE.LatheGeometry(lidProf, 96), enamel({ color: C.brand, side: THREE.DoubleSide }))
  lidMesh.castShadow = true
  lid.add(lidMesh)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 24), creamMat)
  stem.position.y = 0.22
  const knob = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), creamMat)
  knob.scale.set(0.17, 0.075, 0.17)
  knob.position.y = 0.27
  knob.castShadow = true
  lid.add(stem, knob)

  const potState = { x: 2.3, y: 0, z: 0, s: 0.0001, ry: -0.35, rx: 0, lift: 0, tilt: 0, away: 0, boil: 0.35, steam: 1 }

  // ---------- para ----------
  const N_STEAM = 220
  const sGeo = new THREE.BufferGeometry()
  const seeds = new Float32Array(N_STEAM * 2)
  for (let i = 0; i < N_STEAM; i++) { seeds[i * 2] = Math.random(); seeds[i * 2 + 1] = Math.random() }
  sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_STEAM * 3), 3))
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 2))
  const steamU = { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector3() }, uScale: { value: 1 }, uIntensity: { value: 1 }, uPx: { value: 1 } }
  const steam = new THREE.Points(sGeo, new THREE.ShaderMaterial({
    uniforms: steamU, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec2 aSeed;
      uniform float uTime, uScale, uIntensity, uPx;
      uniform vec3 uOrigin;
      varying float vA;
      void main() {
        float life = fract(uTime * 0.22 + aSeed.x * 13.7);
        float ang = aSeed.y * 6.2831;
        float r = sqrt(fract(aSeed.x * 91.3)) * 0.6;
        vec3 p = vec3(cos(ang) * r, 0.0, sin(ang) * r);
        p.y += life * 2.4;
        p.x += sin(life * 4.0 + aSeed.y * 30.0) * 0.22 * life + life * life * 0.5;
        p.z += cos(life * 3.0 + aSeed.x * 20.0) * 0.15 * life;
        vec4 mv = modelViewMatrix * vec4(uOrigin + p * uScale, 1.0);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(0.0, 0.12, life) * (1.0 - life) * (1.0 - life) * clamp(uIntensity, 0.0, 2.0);
        gl_PointSize = uPx * projectionMatrix[1][1] * uScale * (0.35 + 0.9 * life) / -mv.z;
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * smoothstep(0.5, 0.15, d) * vA * 0.32;
        gl_FragColor = vec4(0.9, 0.86, 0.82, a);
      }`,
  }))
  steam.frustumCulled = false
  scene.add(steam)

  // ---------- namirnice ----------
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o })
  const sph = (r, ws = 28, hs = 18) => new THREE.SphereGeometry(r, ws, hs)
  const MAKERS = [
    function tomato() {
      const g = new THREE.Group()
      const b = new THREE.Mesh(sph(0.22), std('#E23B2E', { roughness: 0.3 })); b.scale.y = 0.84; g.add(b)
      for (let i = 0; i < 5; i++) {
        const l = new THREE.Mesh(sph(0.06, 10, 6), std('#3E8E3A')); l.scale.set(1.2, 0.25, 0.45)
        const a = i / 5 * TAU; l.position.set(Math.cos(a) * 0.06, 0.18, Math.sin(a) * 0.06); l.rotation.y = -a; g.add(l)
      }
      return g
    },
    function carrot() {
      const g = new THREE.Group()
      const b = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 20), std('#F08A24')); b.rotation.x = Math.PI; g.add(b)
      for (let i = 0; i < 3; i++) {
        const l = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 8), std('#4CA64A'))
        l.position.set((i - 1) * 0.03, 0.36, 0); l.rotation.z = (i - 1) * 0.35; g.add(l)
      }
      return g
    },
    function egg() {
      const b = new THREE.Mesh(sph(0.15), std('#FFF1DC', { roughness: 0.45 })); b.scale.y = 1.28
      const g = new THREE.Group(); g.add(b); return g
    },
    function leaf() {
      const g = new THREE.Group()
      const b = new THREE.Mesh(sph(0.2, 24, 12), std('#4CA64A', { roughness: 0.4, side: THREE.DoubleSide })); b.scale.set(1, 0.12, 0.52); g.add(b)
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 6), std('#2E7D32')); v.rotation.z = Math.PI / 2; v.position.y = 0.02; g.add(v)
      return g
    },
    function lemon() {
      const g = new THREE.Group()
      const b = new THREE.Mesh(sph(0.17), std('#F5C542', { roughness: 0.4 })); b.scale.set(1.28, 1, 1); g.add(b)
      for (const s of [1, -1]) { const t = new THREE.Mesh(sph(0.045, 10, 8), std('#F5C542')); t.position.x = s * 0.21; g.add(t) }
      return g
    },
    function broccoli() {
      const g = new THREE.Group()
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.24, 12), std('#7DB65A')); st.position.y = -0.1; g.add(st)
      const m = std('#3F8F3B', { roughness: 0.8 })
      for (const [x, y, z, r] of [[0, 0.1, 0, 0.11], [0.09, 0.05, 0.04, 0.085], [-0.09, 0.05, 0.03, 0.085], [0.02, 0.05, -0.09, 0.085], [-0.02, 0.06, 0.09, 0.08]]) {
        const s = new THREE.Mesh(sph(r, 14, 10), m); s.position.set(x, y, z); g.add(s)
      }
      return g
    },
    function mushroom() {
      const g = new THREE.Group()
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, TAU, 0, Math.PI / 2), std('#A9744F', { side: THREE.DoubleSide })); cap.scale.y = 0.8; cap.position.y = 0.05; g.add(cap)
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.18, 14), std('#EADBC5')); st.position.y = -0.04; g.add(st)
      return g
    },
  ]
  const ingredients = []
  const N_ING = 18
  for (let i = 0; i < N_ING; i++) {
    const g = MAKERS[i % MAKERS.length]()
    const mats = []
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); o.material.userData.orig = o.material.color.clone(); mats.push(o.material) } })
    g.scale.setScalar(0.0001)
    scene.add(g)
    ingredients.push(makeItem(g, i, { mats, rnd: [Math.random(), Math.random(), Math.random(), Math.random()] }))
  }

  // ---------- kartice ----------
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r)
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
  }
  function cover(g, img, x, y, w, h) {
    const s = Math.max(w / img.width, h / img.height)
    const sw = w / s, sh = h / s
    g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
  }
  const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t }

  function mealTexture({ img, day, title, min, mark, tone }) {
    const W = 512, H = 660, cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const g = cv.getContext('2d')
    roundRect(g, 4, 4, W - 8, H - 8, 40); g.fillStyle = '#fff'; g.fill()
    g.lineWidth = 3; g.strokeStyle = C.line; g.stroke()
    g.save(); roundRect(g, 22, 22, W - 44, 340, 28); g.clip(); cover(g, images[img], 22, 22, W - 44, 340); g.restore()
    g.fillStyle = C.muted; g.font = '700 30px Nunito'; g.fillText(day, 34, 412)
    g.fillStyle = C.ink; g.font = '900 38px Nunito'
    const words = title.split(' '); let line = '', y = 460
    for (const w of words) {
      const t = line ? line + ' ' + w : w
      if (g.measureText(t).width > W - 68 && line) { g.fillText(line, 34, y); line = w; y += 44 } else line = t
    }
    g.fillText(line, 34, y)
    const tones = { hot: [C.hot, '#FFE9DF'], fresh: [C.fresh, '#E3F2E1'], warn: [C.warn, '#FFEDCC'] }
    const [fg, bgc] = tones[tone]
    g.font = '700 28px Nunito'; g.fillStyle = C.muted; g.fillText(min, 34, 602)
    const mx = 34 + g.measureText(min).width + 16
    g.font = '800 26px Nunito'
    const mw = g.measureText(mark).width + 32
    roundRect(g, mx, 572, mw, 44, 22); g.fillStyle = bgc; g.fill()
    g.fillStyle = fg; g.fillText(mark, mx + 16, 603)
    return tex(cv)
  }
  function reelTexture({ img, user, title, likes }) {
    const W = 360, H = 640, cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const g = cv.getContext('2d')
    g.save(); roundRect(g, 0, 0, W, H, 34); g.clip()
    cover(g, images[img], 0, 0, W, H)
    const gr = g.createLinearGradient(0, H * 0.45, 0, H)
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.72)')
    g.fillStyle = gr; g.fillRect(0, 0, W, H)
    g.fillStyle = '#fff'; g.font = '800 22px Nunito'; g.fillText(user, 22, H - 92)
    g.font = '900 28px Nunito'; g.fillText(title, 22, H - 56)
    g.font = '700 20px Nunito'; g.globalAlpha = 0.85; g.fillText('▶ 0:47 · recept u opisu', 22, H - 24); g.globalAlpha = 1
    // srce + broj
    g.fillStyle = '#fff'; g.font = '900 40px Nunito'; g.textAlign = 'center'; g.fillText('♥', W - 38, H - 250)
    g.font = '800 18px Nunito'; g.fillText(likes, W - 38, H - 222)
    g.font = '900 34px Nunito'; g.fillText('↗', W - 38, H - 160)
    g.restore()
    return tex(cv)
  }
  const planeMat = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false })

  const WEEK = [
    { img: 'kajgana', day: 'Ponedjeljak', title: 'Kajgana sa špinatom', min: '12 min', mark: 'spašava špinat', tone: 'hot' },
    { img: 'riza-zdjela', day: 'Utorak', title: 'Piletina s rižom i povrćem', min: '5 min', mark: 'iz prepa', tone: 'fresh' },
    { img: 'salata', day: 'Srijeda', title: 'Salata od kupusa s jajem', min: '10 min', mark: 'spašava kupus', tone: 'hot' },
    { img: 'wok', day: 'Četvrtak', title: 'Wok s piletinom', min: '20 min', mark: 'tvoj favorit', tone: 'warn' },
    { img: 'varivo', day: 'Petak', title: 'Varivo od leće', min: '5 min', mark: 'iz prepa', tone: 'fresh' },
    { img: 'spageti', day: 'Subota', title: 'Špageti s rajčicom', min: '20 min', mark: 'spašava rajčice', tone: 'hot' },
    { img: 'peceni-krumpir', day: 'Nedjelja', title: 'Pečeni krumpir s jogurtom', min: '35 min', mark: 'spašava jogurt', tone: 'hot' },
  ]
  const SWAP = { img: 'pileci-batak', day: 'Četvrtak', title: 'Piletina iz pećnice', min: '45 min', mark: 'iste namirnice', tone: 'fresh' }
  const CARD_W = 1.0, CARD_H = CARD_W * 660 / 512
  const cardGeo = new THREE.PlaneGeometry(CARD_W, CARD_H)
  const cards = WEEK.map((m, i) => {
    const g = new THREE.Group()
    const front = new THREE.Mesh(cardGeo, planeMat(mealTexture(m)))
    g.add(front)
    if (i === 3) {
      const back = new THREE.Mesh(cardGeo, planeMat(mealTexture(SWAP)))
      back.rotation.y = Math.PI
      g.add(back)
    }
    g.scale.setScalar(0.0001)
    scene.add(g)
    return makeItem(g, i, { flip: 0 })
  })

  const REELS = [
    { img: 'spageti', user: '@brzi.recepti', title: 'Pasta u 10 min?!', likes: '84k' },
    { img: 'wok', user: '@kuhinja.za.dvoje', title: 'Wok kao iz restorana', likes: '120k' },
    { img: 'odrezak', user: '@meso.majstor', title: 'Savršen odrezak', likes: '56k' },
    { img: 'tost', user: '@dorucak.dnevno', title: '3 tosta, 1 tava', likes: '31k' },
    { img: 'zobena-kasa', user: '@fit.tanjur', title: 'Zobena za 1 €', likes: '42k' },
    { img: 'riza-zdjela', user: '@meal.prep.hr', title: 'Bowl za cijeli tjedan', likes: '97k' },
  ]
  const REEL_W = 1.05, REEL_H = REEL_W * 16 / 9
  const reelGeo = new THREE.PlaneGeometry(REEL_W, REEL_H)
  const reels = REELS.map((r, i) => {
    const m = new THREE.Mesh(reelGeo, planeMat(reelTexture(r)))
    m.scale.setScalar(0.0001)
    scene.add(m)
    return makeItem(m, i, {})
  })

  // ---------- rasporedi ----------
  // fn(item, t, out) postavlja out.pos, out.euler, out.scale, out.gray
  const potTop = (out) => out.set(potState.x, potState.y + 0.9 * potState.s, potState.z)
  const v = new THREE.Vector3()
  const ING = {
    hidden(it, t, o) { o.pos.set((it.rnd[0] - 0.5) * 6, 6 + it.rnd[1] * 2, -2 + it.rnd[2] * 2); o.scale = 0.0001; o.euler.set(0, 0, 0); o.gray = 0 },
    ring(it, t, o) {
      const n = ingredients.length, a = it.i / n * TAU + t * 0.12
      // prednji dio kruga ide iznad lonca, stražnji iza njega: namirnice ne prekrivaju natpis AI
      const rr = (1.9 + (it.i % 3) * 0.28) * potState.s, f = Math.sin(a)
      o.pos.set(potState.x + Math.cos(a) * rr * 0.92, potState.y + (1.05 + f * 0.8 + (it.i % 4) * 0.16 + Math.sin(t * 0.9 + it.i) * 0.1) * potState.s, potState.z - 0.3 + f * rr * 0.55)
      o.euler.set(it.rnd[0] * TAU + t * (0.3 + it.rnd[1] * 0.4), it.rnd[2] * TAU + t * 0.5, 0)
      o.scale = 1.05; o.gray = 0
    },
    fallen(it, t, o) {
      const a = it.rnd[0] * TAU, r = Math.sqrt(it.rnd[1]) * (portrait ? 1.25 : 1.6)
      o.pos.set((portrait ? 0 : 2.4) + Math.cos(a) * r * 1.3, 0.13, 0.4 + Math.sin(a) * r * 0.75)
      o.euler.set(Math.PI / 2 * (it.i % 2), it.rnd[2] * TAU, Math.PI / 2 * ((it.i >> 1) % 2) * 0.9)
      o.scale = 1.05; o.gray = 0.8
    },
    pot(it, t, o) { potTop(o.pos); o.pos.x += (it.rnd[0] - 0.5) * 0.4; o.pos.z += (it.rnd[1] - 0.5) * 0.4; o.euler.set(t, t, 0); o.scale = 0.0001; o.gray = 0 },
    swirl(it, t, o) {
      const n = ingredients.length, a = it.i / n * TAU * 3 + t * (0.7 + (it.i % 3) * 0.12)
      const rr = (0.25 + (it.i % 3) * 0.24) * potState.s
      o.pos.set(potState.x + Math.cos(a) * rr, potState.y + (0.86 + Math.sin(t * 2 + it.i) * 0.03) * potState.s, potState.z + Math.sin(a) * rr)
      o.euler.set(it.rnd[0] * TAU + t * 0.6, -a, it.rnd[1])
      o.scale = 0.75 * potState.s; o.gray = 0
    },
    back(it, t, o) {
      const cols = 9, c = it.i % cols, r = Math.floor(it.i / cols)
      o.pos.set((c - 4) * 1.35 + (r ? 0.6 : 0), 0.4 + r * 2.7 + Math.sin(t * 0.8 + it.i) * 0.15, -4.5 - it.rnd[0] * 1.5)
      o.euler.set(it.rnd[0] * TAU + t * 0.3, it.rnd[1] * TAU + t * 0.4, 0)
      o.scale = 1.1; o.gray = 0
    },
  }
  const CARD = {
    hidden(it, t, o) { o.pos.set((it.i - 3) * 0.6, 1.0, -3); o.euler.set(0, 0, 0); o.scale = 0.0001 },
    week(it, t, o) {
      if (portrait) { // mobitel: mreža 3 + 3 + 1
        const col = it.i < 6 ? it.i % 3 : 1, row = Math.floor(it.i / 3)
        o.pos.set((col - 1) * 1.62, 5.4 - row * 2.1 + Math.sin(t * 0.9 + it.i * 0.8) * 0.03, 0)
        o.euler.set(-0.05, 0, 0)
        o.scale = 1.5
        return
      }
      const d = it.i - 3
      o.pos.set(d * 1.13, 0.95 + Math.sin(t * 0.9 + it.i * 0.8) * 0.04, -Math.abs(d) * 0.32)
      o.euler.set(0, -d * 0.13, 0)
      o.scale = 1.06
    },
    fan(it, t, o) {
      const d = it.i - 3
      o.pos.set(2.45 + d * 0.3, 0.7 + Math.cos(d * 0.22) * 0.45 + Math.sin(t * 0.7) * 0.03, it.i * 0.02)
      o.euler.set(0, -0.25, -d * 0.16)
      o.scale = 1.05
    },
  }
  const REEL = {
    hidden(it, t, o) { o.pos.set(2.3, -3, 0); o.euler.set(0, -0.35, 0); o.scale = 0.0001 },
    feed(it, t, o) {
      const span = REELS.length * 2.0
      const y = ((it.i * 2.0 - t * 0.9) % span + span) % span - 3.6
      o.pos.set((portrait ? 0 : 2.35) + (it.i % 2) * 0.12, (portrait ? 2.4 : 1.0) + y, 0)
      o.euler.set(-0.08, portrait ? -0.25 : -0.4, 0.03)
      o.scale = portrait ? 1.3 : 1
    },
  }

  function makeItem(obj, i, extra) {
    return { obj, i, layout: null, k: 1, hop: 0, from: { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: 0.0001, gray: 0 }, ...extra }
  }
  const tmp = { pos: new THREE.Vector3(), euler: new THREE.Euler(), scale: 1, gray: 0 }
  const tq = new THREE.Quaternion(), flipQ = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0)
  const grayC = new THREE.Color()

  function applyItem(it, fns, t) {
    if (!it.layout) return
    fns[it.layout](it, t, tmp)
    const k = it.k, o = it.obj
    tq.setFromEuler(tmp.euler)
    o.position.lerpVectors(it.from.pos, tmp.pos, k)
    o.position.y += Math.sin(Math.PI * Math.min(k, 1)) * it.hop
    if (it.jx) o.position.x += it.jx
    o.quaternion.slerpQuaternions(it.from.quat, tq, k)
    if (it.flip) o.quaternion.multiply(flipQ.setFromAxisAngle(Y, it.flip))
    o.scale.setScalar(Math.max(0.0001, lerp(it.from.scale, tmp.scale, k)))
    it.gray = lerp(it.from.gray, tmp.gray ?? 0, k)
    if (it.mats) for (const m of it.mats) {
      const c = m.userData.orig, l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11
      grayC.setRGB(l * 0.75 + 0.06, l * 0.7 + 0.05, l * 0.62 + 0.04)
      m.color.copy(c).lerp(grayC, it.gray)
    }
  }

  function setLayout(items, name, { dur = 1.4, stagger = 0.03, hop = 0, ease = 'power3.inOut', delay = 0 } = {}) {
    items.forEach((it, idx) => {
      if (it.layout === name) return
      gsap.killTweensOf(it, 'k')
      it.from.pos.copy(it.obj.position)
      it.from.quat.copy(it.obj.quaternion)
      if (it.flip) it.from.quat.multiply(flipQ.setFromAxisAngle(Y, -it.flip))
      it.from.scale = it.obj.scale.x
      it.from.gray = it.gray ?? 0
      it.layout = name
      it.k = 0
      it.hop = hop * (0.6 + 0.8 * ((idx * 0.618) % 1))
      gsap.to(it, { k: 1, duration: dur, delay: delay + idx * stagger, ease })
    })
  }

  // ---------- petlja ----------
  const clock = new THREE.Clock()
  let t = 0, steamT = 0
  const tgt = new THREE.Vector3()
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05)
    t += dt
    steamT += dt * (0.6 + Math.min(potState.steam, 2) * 0.6)
    const s = potState.s
    pot.position.set(potState.x, potState.y, potState.z)
    pot.scale.setScalar(Math.max(0.0001, s))
    pot.rotation.set(potState.rx, potState.ry + Math.sin(t * 0.5) * 0.05, Math.sin(t * 31) * 0.006 * potState.boil)
    const rattle = Math.abs(Math.sin(t * 23)) * 0.035 * potState.boil
    lid.position.set(-potState.tilt * 0.25 + potState.away * 9, 1 + potState.lift + rattle, potState.away * -3)
    lid.rotation.z = potState.tilt * 0.45 + Math.sin(t * 19) * 0.02 * potState.boil
    bubbles.forEach((b, i) => {
      const p = (t * (0.8 + i * 0.13) + i * 0.37) % 1
      b.scale.setScalar(Math.sin(p * Math.PI) * 0.06 * Math.min(1, potState.boil + 0.3))
    })

    steamU.uTime.value = steamT
    steamU.uScale.value = s
    steamU.uIntensity.value = s < 0.05 ? 0 : potState.steam
    steamU.uOrigin.value.set(potState.x, potState.y + (1.05 + potState.lift * 0.5) * s, potState.z)
    steamU.uPx.value = renderer.domElement.height / 2

    for (const it of ingredients) applyItem(it, ING, t)
    for (const it of cards) applyItem(it, CARD, t)
    for (const it of reels) applyItem(it, REEL, t)

    camera.position.copy(cam.pos)
    camera.position.x += Math.sin(t * 0.31) * 0.06
    camera.position.y += Math.sin(t * 0.43) * 0.04
    tgt.copy(cam.target)
    camera.lookAt(tgt)
    renderer.render(scene, camera)
    requestAnimationFrame(frame)
  }

  function resize() {
    const w = innerWidth, h = innerHeight, a = w / h
    renderer.setSize(w, h, false)
    camera.aspect = a
    portrait = a < PORTRAIT_MAX
    const base = THREE.MathUtils.degToRad(BASE_FOV)
    if (portrait) {
      // mobitel uspravno: kadar širok ~5,2 jedinice na udaljenosti 8
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(2.6 / 8 / a))
    } else {
      // uži ekran od 16:9 → zadrži istu širinu kadra (poravnato s HTML slojem)
      camera.fov = a < 16 / 9 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(base / 2) * (16 / 9) / a)) : BASE_FOV
    }
    camera.updateProjectionMatrix()
  }
  addEventListener('resize', resize)
  resize()
  requestAnimationFrame(frame)

  return {
    cam, potState, ingredients, cards, reels,
    get portrait() { return portrait },
    setIngredients: (name, o) => setLayout(ingredients, name, o),
    setCards: (name, o) => setLayout(cards, name, o),
    setReels: (name, o) => setLayout(reels, name, o),
    shakeCard(i = 3) {
      const it = cards[i]
      const tl = gsap.timeline()
      tl.fromTo(it, { jx: -0.05 }, { jx: 0.05, duration: 0.06, yoyo: true, repeat: 7, ease: 'none' }, 0).set(it, { jx: 0 })
      tl.to(it, { flip: (Math.round(it.flip / Math.PI) + 1) * Math.PI, duration: 0.9, ease: 'back.inOut(1.6)' }, 0.45)
      return tl
    },
  }
}
