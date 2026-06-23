import {
  BACKGROUND_LIST,
  TEXT_LIST,
  THEME_LIST,
  selectThemeAppearance,
} from '../theme/appearance'
import { IconClose, IconPalette } from './Icons'

export default function AppearancePanel({ appearance, setAppearance, onClose }) {
  const update = (patch) => setAppearance((current) => ({ ...current, ...patch }))

  return (
    <div className="w-[316px] max-h-[calc(100vh-84px)] overflow-y-auto rounded-2xl bg-[var(--panel-bg)] backdrop-blur shadow-[0_20px_25px_-5px_var(--shadow-color)] ring-1 ring-[var(--line-color)] p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--text-main)] text-base tracking-wide">外观 · Themes</h3>
        <button
          onClick={onClose}
          className="text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors p-1 -mr-1"
          aria-label="关闭"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>

      <section className="mb-5">
        <div className="flex items-center gap-2 text-sm text-[var(--text-main)] mb-3">
          <IconPalette width={16} height={16} className="text-[var(--accent)]" />
          经典主题
        </div>
        <div className="space-y-2.5">
          {THEME_LIST.map((theme) => {
            const active = appearance.themeId === theme.id
            return (
              <button
                key={theme.id}
                onClick={() =>
                  setAppearance((current) => selectThemeAppearance(current, theme.id))
                }
                className={`w-full rounded-2xl border text-left transition-all ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--card-bg)] shadow-[0_10px_15px_-3px_var(--shadow-color)]'
                    : 'border-[var(--line-color)] bg-[var(--panel-soft)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <div
                  className="h-20 rounded-t-2xl p-3"
                  style={{
                    background: `linear-gradient(135deg, ${theme.preview.bg} 0%, ${theme.preview.accent} 100%)`,
                  }}
                >
                  <div
                    className="w-16 h-2.5 rounded-full mb-2"
                    style={{ background: theme.preview.text, opacity: 0.88 }}
                  />
                  <div
                    className="w-28 h-2 rounded-full mb-1.5"
                    style={{ background: theme.preview.text, opacity: 0.56 }}
                  />
                  <div
                    className="w-20 h-2 rounded-full"
                    style={{ background: theme.preview.text, opacity: 0.38 }}
                  />
                </div>
                <div className="px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-sm text-[var(--text-strong)]">{theme.label}</span>
                    {active && (
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--accent-contrast)]">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-soft)]">
                    {theme.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <div className="h-px bg-[var(--line-color)] my-4" />

      <section className="mb-4">
        <div className="text-sm text-[var(--text-main)] mb-2.5">背景底色</div>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_LIST.map((option) => (
            <ChoiceChip
              key={option.id}
              active={appearance.backgroundId === option.id}
              label={option.label}
              onClick={() => update({ backgroundId: option.id })}
            >
              {option.id === 'theme-default' ? (
                <span className="text-[11px] text-[var(--text-soft)]">跟随主题</span>
              ) : (
                <span
                  className="block w-10 h-5 rounded-full border border-white/60 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${option.appBgStart} 0%, ${option.appBgEnd} 100%)`,
                  }}
                />
              )}
            </ChoiceChip>
          ))}
        </div>
      </section>

      <section>
        <div className="text-sm text-[var(--text-main)] mb-2.5">文字颜色</div>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_LIST.map((option) => (
            <ChoiceChip
              key={option.id}
              active={appearance.textId === option.id}
              label={option.label}
              onClick={() => update({ textId: option.id })}
            >
              {option.id === 'theme-default' ? (
                <span className="text-[11px] text-[var(--text-soft)]">跟随主题</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span
                    className="block w-3.5 h-3.5 rounded-full border border-white/60"
                    style={{ background: option.textStrong }}
                  />
                  <span
                    className="block w-6 h-1.5 rounded-full"
                    style={{ background: option.textMain, opacity: 0.82 }}
                  />
                </span>
              )}
            </ChoiceChip>
          ))}
        </div>
      </section>

      <p className="mt-5 text-[11px] leading-relaxed text-[var(--text-soft)]">
        先选一套经典主题，再根据喜好微调纸张底色和正文颜色。
      </p>
    </div>
  )
}

function ChoiceChip({ active, children, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
        active
          ? 'bg-[var(--card-bg)] ring-1 ring-[var(--accent)]'
          : 'bg-[var(--panel-soft)] ring-1 ring-[var(--line-color)] hover:bg-[var(--hover-bg)]'
      }`}
    >
      {children}
      <span className="text-[11px] text-[var(--text-main)]">{label}</span>
    </button>
  )
}
