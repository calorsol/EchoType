// 氛围视觉层：根据当前开启的环境音，渲染对应的极淡背景动效。
// 透明度随该氛围音的音量微调，与听觉氛围呼应。完全不拦截鼠标。
const LAYERS = [
  { id: 'rain', className: 'backdrop-rain', base: 0.9 },
  { id: 'fire', className: 'backdrop-fire', base: 1 },
  { id: 'forest', className: 'backdrop-forest', base: 1 },
  { id: 'white', className: 'backdrop-white', base: 1 },
]

export default function AmbientBackdrop({ ambients, ambientVol }) {
  return (
    <div aria-hidden className="pointer-events-none">
      {LAYERS.map((l) => {
        const on = !!ambients[l.id]
        const vol = ambientVol?.[l.id] ?? 0.5
        return (
          <div
            key={l.id}
            className={`backdrop-layer ${l.className}`}
            style={{ opacity: on ? l.base * (0.45 + vol * 0.55) : 0 }}
          />
        )
      })}
    </div>
  )
}
