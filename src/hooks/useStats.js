import { useState, useEffect, useRef, useCallback } from 'react'

const STATS_KEY = 'echotype.stats.v1'

function todayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function load() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { days: {}, totalWords: 0, totalKeys: 0 }
}

function countWords(text) {
  if (!text) return 0
  // 中文按字符计，英文按单词计
  const cjk = (text.match(/[一-龥぀-ヿ가-힯]/g) || []).length
  const words = (text.match(/[a-zA-Z0-9]+/g) || []).length
  return cjk + words
}

// 连续写作天数（streak）
function computeStreak(days) {
  let streak = 0
  const d = new Date()
  // 若今天还没写，从昨天开始算 streak 仍成立
  if (!days[todayKey(d)] || days[todayKey(d)].words === 0) {
    d.setDate(d.getDate() - 1)
  }
  while (days[todayKey(d)] && days[todayKey(d)].words > 0) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function useStats(text) {
  const [stats, setStats] = useState(load)
  const baselineRef = useRef(null) // 本次会话载入文档时的初始字数
  const sessionStartRef = useRef(Date.now())
  const [sessionWords, setSessionWords] = useState(0)

  const liveWordCount = countWords(text)

  // 建立基线：首个非空内容载入时记录，避免把历史文档算成今天新写的
  useEffect(() => {
    if (baselineRef.current === null) {
      baselineRef.current = liveWordCount
    }
  }, [liveWordCount])

  // 写作进度写入今日记录
  useEffect(() => {
    if (baselineRef.current === null) return
    const delta = Math.max(0, liveWordCount - baselineRef.current)
    setSessionWords(delta)
    setStats((prev) => {
      const key = todayKey()
      const prevDay = prev.days[key] || { words: 0, keys: 0, ms: 0 }
      // 今日字数取“当日峰值增量”，避免删改造成回退
      const dayWords = Math.max(prevDay.words, delta + (prevDay.baseWords || 0))
      const next = {
        ...prev,
        days: {
          ...prev.days,
          [key]: { ...prevDay, words: dayWords, baseWords: prevDay.baseWords ?? 0 },
        },
      }
      return next
    })
  }, [liveWordCount])

  // 记录一次按键（用于统计当日敲击次数）
  const recordKey = useCallback(() => {
    setStats((prev) => {
      const key = todayKey()
      const prevDay = prev.days[key] || { words: 0, keys: 0, ms: 0 }
      return {
        ...prev,
        totalKeys: (prev.totalKeys || 0) + 1,
        days: { ...prev.days, [key]: { ...prevDay, keys: (prevDay.keys || 0) + 1 } },
      }
    })
  }, [])

  // 持久化
  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    } catch {}
  }, [stats])

  const today = stats.days[todayKey()] || { words: 0, keys: 0 }
  const streak = computeStreak(stats.days)

  // 最近 7 日（用于迷你柱状图）
  const recent = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const k = todayKey(d)
    recent.push({ date: k, words: stats.days[k]?.words || 0 })
  }

  const sessionMinutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000))

  return {
    liveWordCount,
    charCount: text ? text.length : 0,
    todayWords: today.words || 0,
    todayKeys: today.keys || 0,
    sessionWords,
    sessionMinutes,
    streak,
    recent,
    days: stats.days,
    recordKey,
    resetBaseline: () => {
      baselineRef.current = liveWordCount
    },
  }
}
