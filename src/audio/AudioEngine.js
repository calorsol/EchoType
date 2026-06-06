// AudioEngine — 纯 Web Audio API 合成，无需任何音频素材文件，完全离线可用。
// 负责：① 每次按键的机械键盘音效（多种轴体）② 雨声 / 白噪音 / 篝火 / 森林 氛围音。

let ctx = null
let master = null
let noiseBuffer = null

function ensureContext() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 1
  master.connect(ctx.destination)
  noiseBuffer = makeNoiseBuffer(ctx, 2)
  return ctx
}

// 浏览器自动暂停策略：在用户手势后恢复
export function resumeAudio() {
  ensureContext()
  if (ctx.state === 'suspended') ctx.resume()
}

function makeNoiseBuffer(audioCtx, seconds) {
  const length = audioCtx.sampleRate * seconds
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate)
  const data = buffer.getChannelData(0)
  // 棕噪音 — 比白噪音更柔和、更有“氛围”
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.0
  }
  return buffer
}

// ───────────────────────── 键盘音效 ─────────────────────────

const KEY_PROFILES = {
  cherry: { label: '机械青轴', tone: 2400, body: 180, decay: 0.06, noise: 0.5, click: 0.9 },
  thock: { label: '客制化', tone: 1500, body: 95, decay: 0.12, noise: 0.35, click: 0.55 },
  typewriter: { label: '复古打字机', tone: 3200, body: 240, decay: 0.05, noise: 0.7, click: 1 },
  soft: { label: '轻柔薄膜', tone: 900, body: 70, decay: 0.09, noise: 0.25, click: 0.3 },
}

export const KEYBOARD_PROFILES = Object.entries(KEY_PROFILES).map(([id, v]) => ({
  id,
  label: v.label,
}))

let keyGain = null
function keyboardOut() {
  if (!keyGain) {
    keyGain = ctx.createGain()
    keyGain.gain.value = 0.6
    keyGain.connect(master)
  }
  return keyGain
}

// 触发一次按键音。space=true 时音色稍低沉（大键位手感）。
export function playKey(profileId = 'thock', isSpace = false) {
  ensureContext()
  if (ctx.state === 'suspended') ctx.resume()
  const p = KEY_PROFILES[profileId] || KEY_PROFILES.thock
  const now = ctx.currentTime
  const out = keyboardOut()
  const rand = 0.92 + Math.random() * 0.16

  // —— 1. “咔哒”高频瞬态（噪声脉冲过带通）——
  const click = ctx.createBufferSource()
  click.buffer = noiseBuffer
  click.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = p.tone * rand * (isSpace ? 0.8 : 1)
  bp.Q.value = 0.8
  const clickGain = ctx.createGain()
  clickGain.gain.setValueAtTime(0.0001, now)
  clickGain.gain.exponentialRampToValueAtTime(p.click, now + 0.001)
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02)
  click.connect(bp).connect(clickGain).connect(out)
  click.start(now)
  click.stop(now + 0.05)

  // —— 2. “咚”低频键体共鸣（正弦+快速衰减）——
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(p.body * rand * (isSpace ? 0.7 : 1), now)
  osc.frequency.exponentialRampToValueAtTime(p.body * 0.6, now + p.decay)
  const bodyGain = ctx.createGain()
  bodyGain.gain.setValueAtTime(0.0001, now)
  bodyGain.gain.exponentialRampToValueAtTime(0.5 * (isSpace ? 1.25 : 1), now + 0.004)
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay)
  osc.connect(bodyGain).connect(out)
  osc.start(now)
  osc.stop(now + p.decay + 0.02)

  // —— 3. 触底噪声层（更厚的手感）——
  const thud = ctx.createBufferSource()
  thud.buffer = noiseBuffer
  thud.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 700
  const thudGain = ctx.createGain()
  thudGain.gain.setValueAtTime(0.0001, now)
  thudGain.gain.exponentialRampToValueAtTime(p.noise * 0.5, now + 0.002)
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay * 0.8)
  thud.connect(lp).connect(thudGain).connect(out)
  thud.start(now)
  thud.stop(now + p.decay + 0.02)
}

// 回车键：老打字机的“叮——咔哒”进纸声（bell + 滑架），同样走键盘音量。
export function playReturn() {
  ensureContext()
  if (ctx.state === 'suspended') ctx.resume()
  const now = ctx.currentTime
  const out = keyboardOut()

  // —— 打字机铃声 bell：两路微失谐正弦，金属感衰减 ——
  const freqs = [1180, 1480, 2360]
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = f * (0.99 + Math.random() * 0.02)
    const g = ctx.createGain()
    const peak = i === 0 ? 0.28 : 0.12
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(peak, now + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5 - i * 0.1)
    o.connect(g).connect(out)
    o.start(now)
    o.stop(now + 0.6)
  })

  // —— 滑架回位“咔” ——
  const car = ctx.createBufferSource()
  car.buffer = noiseBuffer
  car.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2200
  bp.Q.value = 0.6
  const cg = ctx.createGain()
  cg.gain.setValueAtTime(0.0001, now + 0.04)
  cg.gain.exponentialRampToValueAtTime(0.5, now + 0.05)
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
  car.connect(bp).connect(cg).connect(out)
  car.start(now)
  car.stop(now + 0.2)
}

export function setKeyboardVolume(v) {
  ensureContext()
  keyboardOut().gain.value = v
}

// ───────────────────────── 氛围音 ─────────────────────────

const ambients = {} // id -> { nodes, gain, timer, stop() }

function startRain() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1600
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 380
  const g = ctx.createGain()
  src.connect(hp).connect(lp).connect(g)
  src.start()

  // 随机雨滴 ping，增加层次
  let stopped = false
  const tick = () => {
    if (stopped) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 1800 + Math.random() * 2600
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.0001, t)
    og.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.04, t + 0.005)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
    o.connect(og).connect(g)
    o.start(t)
    o.stop(t + 0.12)
    timer = setTimeout(tick, 60 + Math.random() * 160)
  }
  let timer = setTimeout(tick, 200)
  return {
    gain: g,
    stop() {
      stopped = true
      clearTimeout(timer)
      try { src.stop() } catch (e) {}
    },
  }
}

function startWhiteNoise() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 5200
  const g = ctx.createGain()
  src.connect(lp).connect(g)
  src.start()
  return {
    gain: g,
    stop() {
      try { src.stop() } catch (e) {}
    },
  }
}

function startFire() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 800
  const g = ctx.createGain()
  src.connect(lp).connect(g)
  src.start()

  let stopped = false
  const crackle = () => {
    if (stopped) return
    const t = ctx.currentTime
    const n = ctx.createBufferSource()
    n.buffer = noiseBuffer
    n.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1200 + Math.random() * 2000
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(0.12 + Math.random() * 0.18, t + 0.004)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.06)
    n.connect(bp).connect(ng).connect(g)
    n.start(t)
    n.stop(t + 0.2)
    timer = setTimeout(crackle, 40 + Math.random() * 350)
  }
  let timer = setTimeout(crackle, 150)
  return {
    gain: g,
    stop() {
      stopped = true
      clearTimeout(timer)
      try { src.stop() } catch (e) {}
    },
  }
}

function startForest() {
  // 风声底噪
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1100
  const g = ctx.createGain()
  src.connect(lp).connect(g)
  src.start()

  // 随机鸟鸣
  let stopped = false
  const chirp = () => {
    if (stopped) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    o.type = 'sine'
    const base = 2200 + Math.random() * 1600
    o.frequency.setValueAtTime(base, t)
    o.frequency.linearRampToValueAtTime(base + 600, t + 0.06)
    o.frequency.linearRampToValueAtTime(base - 200, t + 0.13)
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.0001, t)
    og.gain.exponentialRampToValueAtTime(0.05, t + 0.02)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    o.connect(og).connect(g)
    o.start(t)
    o.stop(t + 0.2)
    // 偶尔连续两声
    if (Math.random() > 0.6) setTimeout(chirp, 130 + Math.random() * 120)
    timer = setTimeout(chirp, 1200 + Math.random() * 3500)
  }
  let timer = setTimeout(chirp, 1000)
  return {
    gain: g,
    stop() {
      stopped = true
      clearTimeout(timer)
      try { src.stop() } catch (e) {}
    },
  }
}

const AMBIENT_STARTERS = {
  rain: startRain,
  white: startWhiteNoise,
  fire: startFire,
  forest: startForest,
}

export const AMBIENT_LIST = [
  { id: 'rain', label: '雨声', icon: 'rain' },
  { id: 'white', label: '白噪音', icon: 'white' },
  { id: 'fire', label: '篝火', icon: 'fire' },
  { id: 'forest', label: '森林', icon: 'forest' },
]

export function setAmbient(id, on, volume = 0.5) {
  ensureContext()
  if (ctx.state === 'suspended') ctx.resume()
  if (on) {
    if (ambients[id]) return
    const starter = AMBIENT_STARTERS[id]
    if (!starter) return
    const handle = starter()
    handle.gain.gain.value = 0.0001
    handle.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), ctx.currentTime + 0.8)
    handle.gain.connect(master)
    ambients[id] = handle
  } else {
    const handle = ambients[id]
    if (!handle) return
    handle.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    setTimeout(() => handle.stop(), 600)
    delete ambients[id]
  }
}

export function setAmbientVolume(id, volume) {
  if (ambients[id]) {
    ambients[id].gain.gain.setTargetAtTime(Math.max(0.0001, volume), ctx.currentTime, 0.1)
  }
}

export function setMasterVolume(v) {
  ensureContext()
  master.gain.value = v
}
