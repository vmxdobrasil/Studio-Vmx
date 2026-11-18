import { APP_NAME } from '../config'
import { LOGO_DATA_ON_DARK } from '../assets/logoDataOnDark'
import { LOGO_DATA_ON_LIGHT } from '../assets/logoDataOnLight'
import { cx } from './ui'

/** Símbolo Skip (três peças roxas) — favicon e fallback. */
export function SkipMark({ className, title = 'Skip' }: { className?: string; title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 291 267"
      fill="none"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g fill="#6F1AE5">
        <path d="M 0.98 132.90 C 0.44 130.20 1.11 126.06 2.49 123.66 L 53.20 35.13 C 54.20 33.40 55.94 30.68 57.10 29.06 L 58.03 27.76 C 59.12 26.23 61.50 25.19 63.36 25.42 L 64.64 25.58 C 66.50 25.81 68.79 27.29 69.77 28.89 L 125.98 120.70 C 127.09 122.52 128.38 125.69 128.84 127.78 L 129.16 129.22 C 129.62 131.31 129.66 134.70 129.24 136.80 L 128.84 138.80 C 128.38 141.12 126.98 144.63 125.73 146.63 L 67.34 239.86 C 66.60 241.04 64.87 242.00 63.48 242.00 L 62.52 242.00 C 61.13 242.00 59.37 241.06 58.60 239.90 L 57.68 238.52 C 56.75 237.13 55.31 234.83 54.46 233.39 L 6.54 152.30 C 5.14 149.93 3.56 145.80 3.02 143.10 Z" />
        <path d="M 113.53 4.42 C 113.24 3.63 113.38 2.44 113.84 1.74 L 114.16 1.26 C 114.62 0.56 115.68 0.00 116.51 0.00 L 222.24 0.00 C 224.32 0.00 227.50 0.75 229.36 1.68 L 230.64 2.32 C 232.50 3.25 234.88 5.43 235.96 7.20 L 285.71 88.26 C 286.97 90.33 288.56 93.88 289.26 96.20 L 289.86 98.18 C 290.49 100.29 289.31 102.56 287.22 103.26 L 285.78 103.74 C 283.69 104.44 280.43 104.15 278.49 103.11 L 274.46 100.94 C 271.44 99.32 266.59 96.63 263.61 94.93 L 119.12 12.77 C 117.40 11.79 115.44 9.50 114.74 7.64 Z" />
        <path d="M 113.00 261.10 C 113.00 259.94 113.81 258.53 114.82 257.95 L 271.75 166.89 C 273.55 165.84 276.50 164.25 278.36 163.32 L 280.27 162.37 C 281.78 161.61 284.32 161.38 285.94 161.84 L 287.54 162.30 C 288.90 162.69 290.19 164.13 290.42 165.52 L 290.58 166.48 C 290.81 167.87 290.42 169.99 289.71 171.21 L 264.04 215.09 C 261.81 218.91 258.16 225.07 255.88 228.86 L 241.60 252.66 C 240.16 255.06 237.31 258.50 235.22 260.36 L 233.78 261.64 C 231.69 263.50 227.74 265.04 224.94 265.09 L 119.10 266.96 C 117.94 266.98 116.25 266.44 115.32 265.74 L 114.68 265.26 C 113.75 264.56 113.00 263.06 113.00 261.90 Z" />
      </g>
    </svg>
  )
}

const LOGO_SRC = {
  onDark: LOGO_DATA_ON_DARK,
  onLight: LOGO_DATA_ON_LIGHT,
} as const

const SIZES = {
  sm: { h: 'h-5', markBox: 'h-5 w-[26px]' },
  md: { h: 'h-6', markBox: 'h-6 w-[32px]' },
  lg: { h: 'h-8', markBox: 'h-8 w-[42px]' },
} as const

export type BrandLogoSize = keyof typeof SIZES

/**
 * Logo oficial Adapta Skip Studio (PNG embutido em SVG).
 * `markOnly` mostra só o símbolo roxo (recorte à esquerda).
 */
export function BrandLogo({
  className,
  markClassName,
  variant = 'onDark',
  markOnly = false,
  size = 'md',
}: {
  className?: string
  markClassName?: string
  variant?: 'onDark' | 'onLight'
  markOnly?: boolean
  size?: BrandLogoSize
}) {
  const src = variant === 'onDark' ? LOGO_SRC.onDark : LOGO_SRC.onLight
  const s = SIZES[size]

  if (markOnly) {
    return (
      <div
        className={cx(s.markBox, 'overflow-hidden shrink-0', markClassName)}
        title={APP_NAME}
        aria-label={APP_NAME}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className={cx(s.h, 'w-auto max-w-none', className)}
        />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={APP_NAME}
      draggable={false}
      className={cx(s.h, 'w-auto shrink-0', className)}
    />
  )
}
