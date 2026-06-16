import { KEYBOARD_PROFILES, AMBIENT_LIST, resumeAudio } from '../audio/AudioEngine'
import { IconKeyboard, IconRain, IconWhite, IconFire, IconForest, IconClose } from './Icons'

const AMBIENT_ICONS = {
  rain: IconRain,
  white: IconWhite,
  fire: IconFire,
  forest: IconForest,
}

export default function SoundPanel({ sound, setSound, onClose }) {
  const update = (patch) => {
    resumeAudio()
    setSound((s) => ({ ...s, ...patch }))
  }
  const toggleAmbient = (id) => {
    const active = { ...sound.ambients }
    active[id] = !active[id]
    update({ ambients: active })
  }
  const setAmbVol = (id, v) => {
    update({ ambientVol: { ...sound.ambientVol, [id]: v } })
  }

  return (
    <div className="w-[300px] max-h-[calc(100vh-84px)] overflow-y-auto rounded-2xl bg-sand-50/95 backdrop-blur shadow-xl shadow-ink-700/10 ring-1 ring-sand-300/70 p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-ink-600 text-base tracking-wide">声音 · Ambience</h3>
        <button
          onClick={onClose}
          className="text-ink-400 hover:text-ink-600 transition-colors p-1 -mr-1"
          aria-label="关闭"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>

      {/* 键盘音效 */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-2 text-sm text-ink-500">
            <IconKeyboard width={16} height={16} className="text-sage-500" />
            打字音效
          </span>
          <Switch on={sound.keyOn} onClick={() => update({ keyOn: !sound.keyOn })} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {KEYBOARD_PROFILES.map((p) => (
            <button
              key={p.id}
              disabled={!sound.keyOn}
              onClick={() => update({ keyProfile: p.id })}
              className={`text-xs py-1.5 px-2 rounded-lg transition-all ${
                sound.keyProfile === p.id
                  ? 'bg-sage-400 text-sand-50 shadow-sm'
                  : 'bg-sand-200 text-ink-500 hover:bg-sand-300'
              } ${!sound.keyOn ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-ink-400 w-8">音量</span>
          <input
            type="range"
            className="echo-range flex-1"
            min="0"
            max="1"
            step="0.01"
            value={sound.keyVol}
            disabled={!sound.keyOn}
            onChange={(e) => update({ keyVol: parseFloat(e.target.value) })}
          />
        </div>
      </section>

      <div className="h-px bg-sand-300/70 my-4" />

      {/* 氛围音 */}
      <section>
        <span className="text-sm text-ink-500 mb-3 block">环境氛围</span>
        <div className="space-y-2.5">
          {AMBIENT_LIST.map((a) => {
            const Icon = AMBIENT_ICONS[a.id]
            const on = !!sound.ambients[a.id]
            return (
              <div key={a.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggleAmbient(a.id)}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all ${
                    on
                      ? 'bg-clay-300 text-sand-50 shadow-sm scale-105'
                      : 'bg-sand-200 text-ink-400 hover:bg-sand-300'
                  }`}
                  aria-label={a.label}
                >
                  <Icon width={18} height={18} />
                </button>
                <span className="text-xs text-ink-500 w-10">{a.label}</span>
                <input
                  type="range"
                  className="echo-range flex-1"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sound.ambientVol[a.id] ?? 0.5}
                  disabled={!on}
                  onChange={(e) => setAmbVol(a.id, parseFloat(e.target.value))}
                />
              </div>
            )
          })}
        </div>
      </section>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-400/80">
        所有声音由浏览器实时合成，无需联网或下载素材。
      </p>
    </div>
  )
}

function Switch({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-[22px] rounded-full transition-colors ${
        on ? 'bg-sage-400' : 'bg-sand-300'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-sand-50 shadow-sm transition-all ${
          on ? 'left-[21px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}
