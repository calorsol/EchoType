import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useStats } from './hooks/useStats'
import {
  playKey,
  playReturn,
  resumeAudio,
  setKeyboardVolume,
  setAmbient,
  setAmbientVolume,
  AMBIENT_LIST,
} from './audio/AudioEngine'
import { exportTxt, exportMarkdown, copyToClipboard } from './utils/export'
import { useTypewriterScroll } from './hooks/useTypewriterScroll'
import SoundPanel from './components/SoundPanel'
import StatsPanel from './components/StatsPanel'
import AmbientBackdrop from './components/AmbientBackdrop'
import {
  IconFocus,
  IconSound,
  IconMute,
  IconStats,
  IconExport,
  IconFlame,
  IconLeaf,
  IconZen,
  IconClose,
  IconCheck,
} from './components/Icons'

const DEFAULT_SOUND = {
  keyOn: true,
  keyProfile: 'thock',
  keyVol: 0.6,
  ambients: {},
  ambientVol: { rain: 0.5, white: 0.4, fire: 0.5, forest: 0.5 },
}

const TYPED_KEYS = /^[\w\W]$/ // 单字符按键

export default function App() {
  const [text, setText] = useLocalStorage('echotype.doc.v1', '')
  const [sound, setSound] = useLocalStorage('echotype.sound.v1', DEFAULT_SOUND)
  const [zen, setZen] = useLocalStorage('echotype.zen.v1', false)
  const [goal, setGoal] = useLocalStorage('echotype.goal.v1', 500)
  const [focus, setFocus] = useState(false)
  const [panel, setPanel] = useState(null) // 'sound' | 'stats' | null
  const [exportOpen, setExportOpen] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [toast, setToast] = useState(null)
  const [bloom, setBloom] = useState(false)

  const stats = useStats(text)
  const textareaRef = useRef(null)
  const hideTimer = useRef(null)
  const reachedRef = useRef(false)

  useTypewriterScroll(textareaRef, zen)

  // ── 音频音量同步 ──
  useEffect(() => {
    setKeyboardVolume(sound.keyVol)
  }, [sound.keyVol])

  useEffect(() => {
    AMBIENT_LIST.forEach((a) =>
      setAmbient(a.id, !!sound.ambients[a.id], sound.ambientVol[a.id] ?? 0.5),
    )
  }, [sound.ambients])

  useEffect(() => {
    AMBIENT_LIST.forEach((a) => setAmbientVolume(a.id, sound.ambientVol[a.id] ?? 0.5))
  }, [sound.ambientVol])

  // ── 按键音效 ──
  const handleKeyDown = useCallback(
    (e) => {
      // Esc 退出专注 / 禅模式
      if (e.key === 'Escape' && (focus || zen)) {
        setFocus(false)
        setZen(false)
        return
      }
      if (!sound.keyOn) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const isType =
        TYPED_KEYS.test(e.key) || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Tab'
      if (!isType) return
      resumeAudio()
      if (e.key === 'Enter') playReturn()
      else playKey(sound.keyProfile, e.key === ' ' || e.code === 'Space')
      stats.recordKey()
    },
    [sound.keyOn, sound.keyProfile, focus, zen, setZen, stats],
  )

  // ── 专注模式下隐藏界面，鼠标移动短暂唤出 ──
  useEffect(() => {
    if (!focus) {
      setUiVisible(true)
      return
    }
    const onMove = () => {
      setUiVisible(true)
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setUiVisible(false), 2200)
    }
    setUiVisible(false)
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      clearTimeout(hideTimer.current)
    }
  }, [focus])

  // ── 全局快捷键 ──
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        setFocus((f) => !f)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        exportTxt(text)
        flash('已导出 .txt')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [text])

  // ── 每日目标达成：叶子开花 + 提示 ──
  const initGoalRef = useRef(true)
  useEffect(() => {
    const reached = goal > 0 && stats.todayWords >= goal
    if (initGoalRef.current) {
      initGoalRef.current = false
      reachedRef.current = reached
      return
    }
    if (reached && !reachedRef.current) {
      reachedRef.current = true
      setBloom(true)
      setTimeout(() => setBloom(false), 1000)
      setToast(`今日目标达成 · ${goal} 字 ✦`)
      setTimeout(() => setToast(null), 2600)
      resumeAudio()
      playReturn()
    } else if (!reached) {
      reachedRef.current = false
    }
  }, [stats.todayWords, goal])

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const closePanels = () => {
    setPanel(null)
    setExportOpen(false)
  }

  const activeAmbients = Object.values(sound.ambients).filter(Boolean).length
  const anySoundOn = sound.keyOn || activeAmbients > 0

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-sand-100 to-sand-200 text-ink-600"
      onClick={(e) => {
        // 点击空白处收起浮层
        if (e.target === e.currentTarget) closePanels()
      }}
    >
      {/* 氛围视觉层 */}
      <AmbientBackdrop ambients={sound.ambients} ambientVol={sound.ambientVol} />

      {/* ─────────── 顶栏 ─────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-30 transition-opacity duration-500 ${
          focus && !uiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <span
              className={`relative flex items-center justify-center w-8 h-8 rounded-xl bg-sage-400 text-sand-50 shadow-sm ${
                bloom ? 'bloom' : ''
              }`}
            >
              <IconLeaf width={18} height={18} />
              {bloom &&
                [...Array(8)].map((_, i) => {
                  const ang = (i / 8) * Math.PI * 2
                  const colors = ['#C9ADA7', '#A9B49A', '#B89A92', '#849069']
                  return (
                    <span
                      key={i}
                      className="petal"
                      style={{
                        '--px': `${Math.cos(ang) * 26}px`,
                        '--py': `${Math.sin(ang) * 26}px`,
                        background: colors[i % colors.length],
                        animationDelay: `${i * 18}ms`,
                      }}
                    />
                  )
                })}
            </span>
            <div className="leading-none">
              <span className="font-serif text-lg text-ink-700 tracking-wide">EchoType</span>
              <span className="block text-[10px] text-ink-400 mt-0.5 tracking-widest">
                听得见的写作
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <TopButton
              active={panel === 'sound'}
              onClick={() => setPanel(panel === 'sound' ? null : 'sound')}
              title="声音设置"
            >
              {anySoundOn ? <IconSound /> : <IconMute />}
              {activeAmbients > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-clay-400 text-sand-50 text-[9px] flex items-center justify-center">
                  {activeAmbients}
                </span>
              )}
            </TopButton>

            <TopButton
              active={panel === 'stats'}
              onClick={() => setPanel(panel === 'stats' ? null : 'stats')}
              title="写作统计"
            >
              <IconStats />
            </TopButton>

            <div className="relative">
              <TopButton
                active={exportOpen}
                onClick={() => {
                  setExportOpen((v) => !v)
                  setPanel(null)
                }}
                title="导出"
              >
                <IconExport />
              </TopButton>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-sand-50 shadow-xl shadow-ink-700/10 ring-1 ring-sand-300/70 py-1.5 animate-fade-in">
                  <MenuItem
                    onClick={() => {
                      exportTxt(text)
                      flash('已导出 .txt')
                      setExportOpen(false)
                    }}
                  >
                    导出为 .txt
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      exportMarkdown(text)
                      flash('已导出 .md')
                      setExportOpen(false)
                    }}
                  >
                    导出为 Markdown
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      copyToClipboard(text).then(() => flash('已复制到剪贴板'))
                      setExportOpen(false)
                    }}
                  >
                    复制全文
                  </MenuItem>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-sand-300 mx-1" />

            <TopButton active={zen} onClick={() => setZen((z) => !z)} title="禅模式 · 打字机居中">
              <IconZen />
            </TopButton>

            <TopButton active={focus} onClick={() => setFocus((f) => !f)} title="专注模式 (Ctrl+Enter)">
              <IconFocus />
            </TopButton>
          </div>
        </div>
      </header>

      {/* 浮层面板 */}
      {panel && (
        <div className="fixed top-[64px] right-5 z-40">
          {panel === 'sound' && (
            <SoundPanel sound={sound} setSound={setSound} onClose={() => setPanel(null)} />
          )}
          {panel === 'stats' && (
            <StatsPanel stats={stats} goal={goal} setGoal={setGoal} onClose={() => setPanel(null)} />
          )}
        </div>
      )}

      {/* ─────────── 写作区 ─────────── */}
      <main className="relative z-10 flex-1 flex justify-center pt-16 pb-20 px-5">
        <div className="w-full max-w-3xl flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={resumeAudio}
            spellCheck={false}
            autoFocus
            placeholder="在这里开始书写，让每一次敲击都有回响……"
            style={zen ? { paddingTop: '42vh', paddingBottom: '42vh' } : undefined}
            className="echo-editor flex-1 w-full bg-transparent outline-none border-none resize-none
                       font-serif text-ink-700 text-[19px] leading-[2.1] tracking-wide
                       placeholder:text-ink-400/50 py-10"
          />
        </div>
      </main>

      {/* ─────────── 底栏 ─────────── */}
      <footer
        className={`fixed bottom-0 inset-x-0 z-20 transition-opacity duration-500 ${
          focus && !uiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between text-[13px] text-ink-400">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-serif text-ink-600 text-base">{stats.liveWordCount.toLocaleString()}</span>{' '}
              字
            </span>
            <span className="hidden sm:inline text-ink-400/70">{stats.charCount} 字符</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPanel(panel === 'stats' ? null : 'stats')}
              className="flex items-center gap-1.5 hover:text-ink-600 transition-colors"
              title="每日目标"
            >
              <GoalRing value={stats.todayWords} goal={goal} />
              <span className="text-ink-400/70">{stats.todayWords}/{goal}</span>
            </button>
            {stats.streak > 0 && (
              <span className="flex items-center gap-1 text-clay-500">
                <IconFlame width={14} height={14} />
                连续 {stats.streak} 天
              </span>
            )}
            {focus && <span className="text-sage-500 animate-soft-pulse">专注模式 · Esc 退出</span>}
          </div>
        </div>
      </footer>

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-ink-600 text-sand-50 text-sm px-4 py-2 rounded-full shadow-lg">
            <IconCheck width={15} height={15} className="text-sage-300" />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function GoalRing({ value, goal }) {
  const r = 7
  const c = 2 * Math.PI * r
  const pct = Math.min(1, value / Math.max(1, goal))
  const done = pct >= 1
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90">
      <circle cx="9" cy="9" r={r} fill="none" stroke="#DBD3C5" strokeWidth="2.5" />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke={done ? '#849069' : '#909E7E'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  )
}

function TopButton({ children, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
        active
          ? 'bg-sage-400 text-sand-50 shadow-sm'
          : 'text-ink-500 hover:bg-sand-300/60 hover:text-ink-700'
      }`}
    >
      {children}
    </button>
  )
}

function MenuItem({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-ink-500 hover:bg-sand-200 hover:text-ink-700 transition-colors"
    >
      {children}
    </button>
  )
}
