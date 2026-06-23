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
    setSound((current) => ({ ...current, ...patch }))
  }

  const toggleAmbient = (id) => {
    const active = { ...sound.ambients }
    active[id] = !active[id]
    update({ ambients: active })
  }

  const setAmbientVolume = (id, value) => {
    update({ ambientVol: { ...sound.ambientVol, [id]: value } })
  }

  return (
    <div className="w-[300px] max-h-[calc(100vh-84px)] overflow-y-auto rounded-2xl bg-[var(--panel-bg)] backdrop-blur shadow-[0_20px_25px_-5px_var(--shadow-color)] ring-1 ring-[var(--line-color)] p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--text-main)] text-base tracking-wide">声音 · Ambience</h3>
        <button
          onClick={onClose}
          className="text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors p-1 -mr-1"
          aria-label="关闭"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>

      <section className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center gap-2 text-sm text-[var(--text-main)]">
            <IconKeyboard width={16} height={16} className="text-[var(--accent)]" />
            打字音效
          </span>
          <Switch on={sound.keyOn} onClick={() => update({ keyOn: !sound.keyOn })} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {KEYBOARD_PROFILES.map((profile) => (
            <button
              key={profile.id}
              disabled={!sound.keyOn}
              onClick={() => update({ keyProfile: profile.id })}
              className={`text-xs py-1.5 px-2 rounded-lg transition-all ${
                sound.keyProfile === profile.id
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'bg-[var(--muted-bg)] text-[var(--text-main)] hover:bg-[var(--hover-bg)]'
              } ${!sound.keyOn ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {profile.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-soft)] w-8">音量</span>
          <input
            type="range"
            className="echo-range flex-1"
            min="0"
            max="1"
            step="0.01"
            value={sound.keyVol}
            disabled={!sound.keyOn}
            onChange={(event) => update({ keyVol: parseFloat(event.target.value) })}
          />
        </div>
      </section>

      <div className="h-px bg-[var(--line-color)] my-4" />

      <section>
        <span className="text-sm text-[var(--text-main)] mb-3 block">环境氛围</span>
        <div className="space-y-2.5">
          {AMBIENT_LIST.map((ambient) => {
            const Icon = AMBIENT_ICONS[ambient.id]
            const active = !!sound.ambients[ambient.id]
            return (
              <div key={ambient.id} className="flex items-center gap-3">
                <button
                  onClick={() => toggleAmbient(ambient.id)}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all ${
                    active
                      ? 'bg-[var(--accent-muted)] text-[var(--accent-contrast)] shadow-sm scale-105'
                      : 'bg-[var(--muted-bg)] text-[var(--text-soft)] hover:bg-[var(--hover-bg)]'
                  }`}
                  aria-label={ambient.label}
                >
                  <Icon width={18} height={18} />
                </button>
                <span className="text-xs text-[var(--text-main)] w-10">{ambient.label}</span>
                <input
                  type="range"
                  className="echo-range flex-1"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sound.ambientVol[ambient.id] ?? 0.5}
                  disabled={!active}
                  onChange={(event) => setAmbientVolume(ambient.id, parseFloat(event.target.value))}
                />
              </div>
            )
          })}
        </div>
      </section>

      <p className="mt-5 text-[11px] leading-relaxed text-[var(--text-soft)]">
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
        on ? 'bg-[var(--accent)]' : 'bg-[var(--muted-bg)]'
      }`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-[var(--input-bg)] shadow-sm transition-all ${
          on ? 'left-[21px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}
