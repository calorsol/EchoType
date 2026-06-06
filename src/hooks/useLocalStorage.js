import { useState, useEffect, useCallback } from 'react'

// 通用 localStorage 持久化 hook
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 忽略写入失败（如隐私模式）
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset]
}
