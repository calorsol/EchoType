import { IconClose, IconFlame } from './Icons'

const WEEKS = 14
const HEAT_COLORS = [
  'var(--heat-0)',
  'var(--heat-1)',
  'var(--heat-2)',
  'var(--heat-3)',
  'var(--heat-4)',
]

function dayKey(date) {
  const part = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`
}

function heatColor(words, goal) {
  if (!words) return HEAT_COLORS[0]
  const ratio = words / Math.max(1, goal)
  if (ratio < 0.25) return HEAT_COLORS[1]
  if (ratio < 0.6) return HEAT_COLORS[2]
  if (ratio < 1) return HEAT_COLORS[3]
  return HEAT_COLORS[4]
}

function buildGrid(days) {
  const total = WEEKS * 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - (total - 1))

  const cells = []
  for (let index = 0; index < start.getDay(); index += 1) cells.push(null)

  for (let index = 0; index < total; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = dayKey(date)
    cells.push({ key, words: days[key]?.words || 0, isToday: key === dayKey(today) })
  }

  const columns = []
  for (let index = 0; index < cells.length; index += 7) columns.push(cells.slice(index, index + 7))
  return columns
}

export default function StatsPanel({ stats, goal, setGoal, onClose }) {
  const columns = buildGrid(stats.days || {})
  const percentage = Math.min(100, Math.round((stats.todayWords / Math.max(1, goal)) * 100))
  const reached = stats.todayWords >= goal

  return (
    <div className="w-[316px] max-h-[calc(100vh-84px)] overflow-y-auto rounded-2xl bg-[var(--panel-bg)] backdrop-blur shadow-[0_20px_25px_-5px_var(--shadow-color)] ring-1 ring-[var(--line-color)] p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-[var(--text-main)] text-base tracking-wide">写作统计</h3>
        <button
          onClick={onClose}
          className="text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors p-1 -mr-1"
          aria-label="关闭"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Metric label="今日字数" value={stats.todayWords} />
        <Metric
          label="连续天数"
          value={stats.streak}
          unit="天"
          icon={<IconFlame width={14} height={14} className="text-[var(--accent-muted)]" />}
        />
        <Metric label="本次会话" value={stats.sessionWords} unit="字" />
        <Metric label="今日敲击" value={stats.todayKeys} unit="次" />
      </div>

      <div className="rounded-xl bg-[var(--card-bg)] px-3 py-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-main)]">
            每日目标 {reached && <span className="text-[var(--accent-strong)]">· 已达成 ✦</span>}
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="50"
              step="50"
              value={goal}
              onChange={(event) => setGoal(Math.max(50, parseInt(event.target.value, 10) || 50))}
              className="w-14 text-right text-xs bg-[var(--input-bg)] rounded-md px-1.5 py-0.5 text-[var(--text-main)] outline-none ring-1 ring-[var(--line-color)] focus:ring-[var(--accent)]"
            />
            <span className="text-[11px] text-[var(--text-soft)]">字</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--muted-bg)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-[var(--text-soft)]">{percentage}%</div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--text-soft)]">写作热力图</span>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-soft)]">
            <span>少</span>
            {HEAT_COLORS.map((color) => (
              <span key={color} className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            ))}
            <span>多</span>
          </div>
        </div>
        <div className="flex gap-[3px] justify-between">
          {columns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-[3px]">
              {column.map((cell, rowIndex) =>
                cell ? (
                  <div
                    key={cell.key}
                    title={`${cell.key} · ${cell.words} 字`}
                    className={`w-[14px] h-[14px] rounded-[3px] ${
                      cell.isToday
                        ? 'ring-2 ring-[var(--accent-strong)] ring-offset-1 ring-offset-[var(--input-bg)]'
                        : ''
                    }`}
                    style={{ background: heatColor(cell.words, goal) }}
                  />
                ) : (
                  <div key={rowIndex} className="w-[14px] h-[14px]" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-soft)]">
        坚持每天写一点，{stats.streak > 0 ? `已连续 ${stats.streak} 天 ✦` : '从今天开启你的连续记录吧'}
      </p>
    </div>
  )
}

function Metric({ label, value, unit = '字', icon }) {
  return (
    <div className="rounded-xl bg-[var(--card-bg)] px-3 py-2.5">
      <div className="text-[11px] text-[var(--text-soft)] mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-serif text-[var(--text-strong)] leading-none">
        <span className="text-xl">{value.toLocaleString()}</span>
        <span className="text-xs text-[var(--text-soft)] ml-0.5">{unit}</span>
      </div>
    </div>
  )
}
