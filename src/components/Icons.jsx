// 极简线性图标，统一 stroke 风格，契合莫兰迪治愈调性
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconKeyboard = (p) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M7.5 14h9" />
  </svg>
)

export const IconRain = (p) => (
  <svg {...base} {...p}>
    <path d="M7 14a4.5 4.5 0 0 1-.5-8.97A5 5 0 0 1 16 5.5a3.5 3.5 0 0 1 .5 7" />
    <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
  </svg>
)

export const IconWhite = (p) => (
  <svg {...base} {...p}>
    <path d="M3 12h2l1.5-5 3 14 3-18 2.5 9H21" />
  </svg>
)

export const IconFire = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C8.5 9.5 9 6.5 12 3z" />
    <path d="M12 13c1.2 0 2 1 2 2.2A2 2 0 0 1 10 15c0-.8.6-1.4 1-1.8.4.4 1 .8 1 .8z" opacity="0.6" />
  </svg>
)

export const IconForest = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2l4 6h-2.5l3 4.5H13V18h-2v-5.5H7.5L10.5 8H8z" />
    <path d="M9 18h6" />
  </svg>
)

export const IconFocus = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
  </svg>
)

export const IconExport = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v11M8 7l4-4 4 4" />
    <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
  </svg>
)

export const IconStats = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IconSound = (p) => (
  <svg {...base} {...p}>
    <path d="M5 9v6h4l5 4V5L9 9H5z" />
    <path d="M17 9a3.5 3.5 0 0 1 0 6" />
  </svg>
)

export const IconMute = (p) => (
  <svg {...base} {...p}>
    <path d="M5 9v6h4l5 4V5L9 9H5z" />
    <path d="M17 9l4 6M21 9l-4 6" />
  </svg>
)

export const IconFlame = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.2.4-2 1-2.8C8.5 9.5 9 6.5 12 3z" />
  </svg>
)

export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12l5 5L20 6" />
  </svg>
)

export const IconZen = (p) => (
  <svg {...base} {...p}>
    <path d="M6 7h12M4 12h16M8 17h8" />
    <circle cx="12" cy="12" r="9.2" opacity="0.35" />
  </svg>
)

export const IconLeaf = (p) => (
  <svg {...base} {...p}>
    <path d="M5 19c0-7 5-12 14-13 0 9-5 14-13 14a6 6 0 0 1-1-1z" />
    <path d="M9 15c2-3 4-5 7-6" />
  </svg>
)
