import { IconClose, IconFlame } from './Icons'

const WEEKS = 14 // 热力图显示的周数
const HEAT_COLORS = ['#E9E3D9', '#CBD3BC', '#A9B49A', '#849069', '#5F6E48']

function dKey(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function heatColor(words, goal) {
  if (!words) return HEAT_COLORS[0]
  const r = words / Math.max(1, goal)
  if (r < 0.25) return HEAT_COLORS[1]
  if (r < 0.6) return HEAT_COLORS[2]
  if (r < 1) return HEAT_COLORS[3]
  return HEAT_COLORS[4]
}

function buildGrid(days) {
  const total = WEEKS * 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - (total - 1))
  const cells = []
  for (let i = 0; i < start.getDay(); i++) cells.push(null) // 对齐到周日
  for (let i = 0; i < total; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const k = dKey(d)
    cells.push({ key: k, words: days[k]?.words || 0, isToday: k === dKey(today) })
  }
  const cols = []
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7))
  return cols
}

export default function StatsPanel({ stats, goal, setGoal, onClose }) {
  const cols = buildGrid(stats.days || {})
  const pct = Math.min(100, Math.round((stats.todayWords / Math.max(1, goal)) * 100))
  const reached = stats.todayWords >= goal

  return (
    <div className="w-[316px] max-h-[calc(100vh-84px)] overflow-y-auto rounded-2xl bg-sand-50/95 backdrop-blur shadow-xl shadow-ink-700/10 ring-1 ring-sand-300/70 p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-ink-600 text-base tracking-wide">写作统计</h3>
        <button
          onClick={onClose}
          className="text-ink-400 hover:text-ink-600 transition-colors p-1 -mr-1"
          aria-label="关闭"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Metric label="今日字数" value={stats.todayWords} />
        <Metric
          label="连续天数"
          value={stats.streak}
          unit="天"
          icon={<IconFlame width={14} height={14} className="text-clay-400" />}
        />
        <Metric label="本次会话" value={stats.sessionWords} unit="字" />
        <Metric label="今日敲击" value={stats.todayKeys} unit="次" />
      </div>

      {/* 每日目标 */}
      <div className="rounded-xl bg-sand-100/80 px-3 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-500">
            每日目标 {reached && <span className="text-sage-500">· 已达成 ✦</span>}
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="50"
              step="50"
              value={goal}
              onChange={(e) => setGoal(Math.max(50, parseInt(e.target.value) || 50))}
              className="w-14 text-right text-xs bg-sand-50 rounded-md px-1.5 py-0.5 text-ink-600 outline-none ring-1 ring-sand-300 focus:ring-sage-400"
            />
            <span className="text-[11px] text-ink-400">字</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-sand-300/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-sage-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-ink-400">{pct}%</div>
      </div>

      {/* 写作热力图 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-400">写作热力图</span>
          <div className="flex items-center gap-1 text-[10px] text-ink-400/70">
            <span>少</span>
            {HEAT_COLORS.map((c) => (
              <span key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            ))}
            <span>多</span>
          </div>
        </div>
        <div className="flex gap-[3px] justify-between">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell, ri) =>
                cell ? (
                  <div
                    key={cell.key}
                    title={`${cell.key} · ${cell.words} 字`}
                    className={`w-[14px] h-[14px] rounded-[3px] ${
                      cell.isToday ? 'ring-2 ring-sage-500 ring-offset-1 ring-offset-sand-50' : ''
                    }`}
                    style={{ background: heatColor(cell.words, goal) }}
                  />
                ) : (
                  <div key={ri} className="w-[14px] h-[14px]" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-400/80">
        坚持每天写一点，
        {stats.streak > 0 ? `已连续 ${stats.streak} 天 ✦` : '从今天开启你的连续记录吧'}
      </p>
    </div>
  )
}

function Metric({ label, value, unit = '字', icon }) {
  return (
    <div className="rounded-xl bg-sand-100/80 px-3 py-2.5">
      <div className="text-[11px] text-ink-400 mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-serif text-ink-700 leading-none">
        <span className="text-xl">{value.toLocaleString()}</span>
        <span className="text-xs text-ink-400 ml-0.5">{unit}</span>
      </div>
    </div>
  )
}
