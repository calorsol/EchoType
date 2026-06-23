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
import AppearancePanel from './components/AppearancePanel'
import AmbientBackdrop from './components/AmbientBackdrop'
import { DEFAULT_APPEARANCE, resolveAppearance, buildAppearanceVars } from './theme/appearance'
import {
  IconFocus,
  IconSound,
  IconMute,
  IconStats,
  IconPalette,
  IconExport,
  IconFlame,
  IconLeaf,
  IconZen,
  IconCheck,
} from './components/Icons'

const DEFAULT_SOUND = {
  keyOn: true,
  keyProfile: 'thock',
  keyVol: 0.6,
  ambients: {},
  ambientVol: { rain: 0.5, white: 0.4, fire: 0.5, forest: 0.5 },
}

const TYPED_KEYS = /^[\w\W]$/

export default function App() {
  const [text, setText] = useLocalStorage('echotype.doc.v1', '')
  const [sound, setSound] = useLocalStorage('echotype.sound.v1', DEFAULT_SOUND)
  const [appearance, setAppearance] = useLocalStorage(
    'echotype.appearance.v1',
    DEFAULT_APPEARANCE,
  )
  const [zen, setZen] = useLocalStorage('echotype.zen.v1', false)
  const [goal, setGoal] = useLocalStorage('echotype.goal.v1', 500)
  const [focus, setFocus] = useState(false)
  const [panel, setPanel] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)
  const [toast, setToast] = useState(null)
  const [bloom, setBloom] = useState(false)

  const stats = useStats(text)
  const textareaRef = useRef(null)
  const hideTimer = useRef(null)
  const reachedRef = useRef(false)
  const initGoalRef = useRef(true)

  const resolvedAppearance = resolveAppearance(appearance)
  const themeTokens = resolvedAppearance.tokens

  useTypewriterScroll(textareaRef, zen)

  useEffect(() => {
    const root = document.documentElement
    const vars = buildAppearanceVars(resolveAppearance(appearance))
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value))
    root.style.color = vars['--text-main']
    document.body.style.backgroundColor = vars['--body-bg']
    document.body.style.color = vars['--text-main']
  }, [appearance])

  useEffect(() => {
    setKeyboardVolume(sound.keyVol)
  }, [sound.keyVol])

  useEffect(() => {
    AMBIENT_LIST.forEach((ambient) =>
      setAmbient(
        ambient.id,
        !!sound.ambients[ambient.id],
        sound.ambientVol[ambient.id] ?? 0.5,
      ),
    )
  }, [sound.ambients, sound.ambientVol])

  useEffect(() => {
    AMBIENT_LIST.forEach((ambient) =>
      setAmbientVolume(ambient.id, sound.ambientVol[ambient.id] ?? 0.5),
    )
  }, [sound.ambientVol])

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && (focus || zen)) {
        setFocus(false)
        setZen(false)
        return
      }
      if (!sound.keyOn || event.metaKey || event.ctrlKey || event.altKey) return
      const isTypeKey =
        TYPED_KEYS.test(event.key) ||
        event.key === 'Enter' ||
        event.key === 'Backspace' ||
        event.key === 'Tab'
      if (!isTypeKey) return
      resumeAudio()
      if (event.key === 'Enter') playReturn()
      else playKey(sound.keyProfile, event.key === ' ' || event.code === 'Space')
      stats.recordKey()
    },
    [sound.keyOn, sound.keyProfile, focus, zen, setZen, stats],
  )

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

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        setFocus((value) => !value)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        exportTxt(text)
        flash('已导出 .txt')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [text])

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

  const flash = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 1800)
  }

  const closePanels = () => {
    setPanel(null)
    setExportOpen(false)
  }

  const activeAmbients = Object.values(sound.ambients).filter(Boolean).length
  const anySoundOn = sound.keyOn || activeAmbients > 0
  const petalColors = [
    themeTokens.accentMuted,
    themeTokens.accentSoft,
    themeTokens.accent,
    themeTokens.accentStrong,
  ]

  return (
    <div
      className="app-shell min-h-screen flex flex-col bg-gradient-to-b from-[var(--app-bg-start)] to-[var(--app-bg-end)] text-[var(--text-main)]"
      onPointerDown={resumeAudio}
      onClick={(event) => {
        if (event.target === event.currentTarget) closePanels()
      }}
    >
      <AmbientBackdrop ambients={sound.ambients} ambientVol={sound.ambientVol} />

      <header
        className={`fixed top-0 inset-x-0 z-30 transition-opacity duration-500 ${
          focus && !uiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <span
              className={`relative flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm ${
                bloom ? 'bloom' : ''
              }`}
            >
              <IconLeaf width={18} height={18} />
              {bloom &&
                [...Array(8)].map((_, index) => {
                  const angle = (index / 8) * Math.PI * 2
                  return (
                    <span
                      key={index}
                      className="petal"
                      style={{
                        '--px': `${Math.cos(angle) * 26}px`,
                        '--py': `${Math.sin(angle) * 26}px`,
                        background: petalColors[index % petalColors.length],
                        animationDelay: `${index * 18}ms`,
                      }}
                    />
                  )
                })}
            </span>
            <div className="leading-none">
              <span className="font-serif text-lg text-[var(--text-strong)] tracking-wide">
                EchoType
              </span>
              <span className="block text-[10px] text-[var(--text-soft)] mt-0.5 tracking-widest">
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
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--accent-muted)] text-[var(--accent-contrast)] text-[9px] flex items-center justify-center">
                  {activeAmbients}
                </span>
              )}
            </TopButton>

            <TopButton
              active={panel === 'appearance'}
              onClick={() => setPanel(panel === 'appearance' ? null : 'appearance')}
              title="外观主题"
            >
              <IconPalette />
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
                  setExportOpen((value) => !value)
                  setPanel(null)
                }}
                title="导出"
              >
                <IconExport />
              </TopButton>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[var(--panel-bg)] shadow-[0_20px_25px_-5px_var(--shadow-color)] ring-1 ring-[var(--line-color)] py-1.5 animate-fade-in">
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

            <div className="w-px h-5 bg-[var(--line-color)] mx-1" />

            <TopButton active={zen} onClick={() => setZen((value) => !value)} title="禅模式 · 打字机居中">
              <IconZen />
            </TopButton>

            <TopButton
              active={focus}
              onClick={() => setFocus((value) => !value)}
              title="专注模式 (Ctrl+Enter)"
            >
              <IconFocus />
            </TopButton>
          </div>
        </div>
      </header>

      {panel && (
        <div className="fixed top-[64px] right-5 z-40">
          {panel === 'sound' && (
            <SoundPanel sound={sound} setSound={setSound} onClose={() => setPanel(null)} />
          )}
          {panel === 'appearance' && (
            <AppearancePanel
              appearance={appearance}
              setAppearance={setAppearance}
              onClose={() => setPanel(null)}
            />
          )}
          {panel === 'stats' && (
            <StatsPanel stats={stats} goal={goal} setGoal={setGoal} onClose={() => setPanel(null)} />
          )}
        </div>
      )}

      <main className="relative z-10 flex-1 flex justify-center pt-16 pb-20 px-5">
        <div className="w-full max-w-3xl flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={resumeAudio}
            spellCheck={false}
            autoFocus
            placeholder="在这里开始书写，让每一次敲击都有回响……"
            style={zen ? { paddingTop: '42vh', paddingBottom: '42vh' } : undefined}
            className="echo-editor flex-1 w-full bg-transparent outline-none border-none resize-none font-serif text-[var(--text-strong)] text-[19px] leading-[2.1] tracking-wide py-10"
          />
        </div>
      </main>

      <footer
        className={`fixed bottom-0 inset-x-0 z-20 transition-opacity duration-500 ${
          focus && !uiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between text-[13px] text-[var(--text-soft)]">
          <div className="flex items-center gap-4">
            <span>
              <span className="font-serif text-[var(--text-main)] text-base">
                {stats.liveWordCount.toLocaleString()}
              </span>{' '}
              字
            </span>
            <span className="hidden sm:inline opacity-80">{stats.charCount} 字符</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPanel(panel === 'stats' ? null : 'stats')}
              className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition-colors"
              title="每日目标"
            >
              <GoalRing value={stats.todayWords} goal={goal} />
              <span className="opacity-80">
                {stats.todayWords}/{goal}
              </span>
            </button>
            {stats.streak > 0 && (
              <span className="flex items-center gap-1 text-[var(--accent-strong)]">
                <IconFlame width={14} height={14} />
                连续 {stats.streak} 天
              </span>
            )}
            {focus && (
              <span className="text-[var(--accent-strong)] animate-soft-pulse">
                专注模式 · Esc 退出
              </span>
            )}
          </div>
        </div>
      </footer>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-[var(--toast-bg)] text-[var(--text-inverse)] text-sm px-4 py-2 rounded-full shadow-lg">
            <IconCheck width={15} height={15} className="text-[var(--accent-soft)]" />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function GoalRing({ value, goal }) {
  const r = 7
  const circumference = 2 * Math.PI * r
  const progress = Math.min(1, value / Math.max(1, goal))
  const done = progress >= 1

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90">
      <circle cx="9" cy="9" r={r} fill="none" stroke="var(--line-color)" strokeWidth="2.5" />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke={done ? 'var(--accent-strong)' : 'var(--accent)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
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
          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
          : 'text-[var(--text-main)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-strong)]'
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
      className="w-full text-left px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-strong)] transition-colors"
    >
      {children}
    </button>
  )
}
