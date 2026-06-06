import { useEffect, useRef, useCallback } from 'react'

// 打字机滚动：让光标所在行始终保持在编辑区垂直中央。
// 原理：用一个隐藏的「镜像」div 复刻 textarea 的排版，量出光标的像素高度，再设置 scrollTop。
export function useTypewriterScroll(ref, enabled) {
  const mirrorRef = useRef(null)

  const getMirror = useCallback(() => {
    if (!mirrorRef.current) {
      const m = document.createElement('div')
      m.setAttribute('aria-hidden', 'true')
      Object.assign(m.style, {
        position: 'absolute',
        top: '0',
        left: '-9999px',
        visibility: 'hidden',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
      })
      document.body.appendChild(m)
      mirrorRef.current = m
    }
    return mirrorRef.current
  }, [])

  const recenter = useCallback(
    (smooth = true) => {
      const ta = ref.current
      if (!ta || !enabled) return
      const cs = window.getComputedStyle(ta)
      const m = getMirror()
      // 复刻影响换行/高度的样式
      ;[
        'fontFamily',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'boxSizing',
        'textIndent',
      ].forEach((k) => (m.style[k] = cs[k]))
      m.style.width = ta.clientWidth + 'px'

      const pos = ta.selectionEnd ?? ta.value.length
      const before = ta.value.slice(0, pos)
      m.textContent = before
      const marker = document.createElement('span')
      marker.textContent = '​'
      m.appendChild(marker)

      const caretTop = marker.offsetTop // 含 paddingTop
      const target = caretTop - ta.clientHeight / 2
      const max = ta.scrollHeight - ta.clientHeight
      const next = Math.max(0, Math.min(target, max))
      if (smooth) ta.scrollTo({ top: next, behavior: 'smooth' })
      else ta.scrollTop = next
    },
    [ref, enabled, getMirror],
  )

  // 绑定输入/光标移动事件
  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    if (!enabled) {
      ta.scrollTop = 0
      return
    }
    const onInput = () => recenter(false)
    const onNav = () => recenter(true)
    ta.addEventListener('input', onInput)
    ta.addEventListener('keyup', onNav)
    ta.addEventListener('click', onNav)
    const ro = new ResizeObserver(() => recenter(false))
    ro.observe(ta)
    recenter(false)
    return () => {
      ta.removeEventListener('input', onInput)
      ta.removeEventListener('keyup', onNav)
      ta.removeEventListener('click', onNav)
      ro.disconnect()
    }
  }, [ref, enabled, recenter])

  // 卸载时清理镜像
  useEffect(() => {
    return () => {
      if (mirrorRef.current) {
        mirrorRef.current.remove()
        mirrorRef.current = null
      }
    }
  }, [])

  return recenter
}
