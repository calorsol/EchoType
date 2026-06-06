// 导出工具：纯前端生成文件并触发下载

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function firstLine(text) {
  const line = (text.split('\n').find((l) => l.trim()) || '未命名').trim()
  return line.slice(0, 20).replace(/[\\/:*?"<>|]/g, '')
}

export function exportTxt(text) {
  download(`${firstLine(text)}-${stamp()}.txt`, text, 'text/plain;charset=utf-8')
}

export function exportMarkdown(text) {
  download(`${firstLine(text)}-${stamp()}.md`, text, 'text/markdown;charset=utf-8')
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
}
