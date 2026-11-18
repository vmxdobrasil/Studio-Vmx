import type { CSSProperties, ReactNode } from 'react'
import type { HighlightStyle, Palette } from '../types'
import { luminance, resolveColor } from './colors'

/**
 * Texto com marcação leve:
 *   ==palavra==  → destaque (cor, marca-texto, sublinhado ou degradê, conforme o carrossel)
 *   **palavra**  → negrito
 *   _palavra_    → itálico
 *   ~~palavra~~  → tachado
 */
const TOKEN = /(==[^=]+?==|\*\*[^*]+?\*\*|~~[^~]+?~~|(?<![\w@])_[^_\n]+?_(?!\w))/g

export function renderRich(text: string, highlight: HighlightStyle, palette: Palette): ReactNode[] {
  const color = resolveColor(highlight.color, palette)
  const hlStyle: CSSProperties =
    highlight.mode === 'gradiente'
      ? {
          backgroundImage: `linear-gradient(90deg, ${color}, ${palette.apoio ?? color})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
        }
      : highlight.mode === 'cor'
        ? { color }
        : highlight.mode === 'fundo'
          ? {
              // Faixa de altura fixa (não a caixa inteira da fonte) para não invadir as linhas vizinhas.
              backgroundImage: `linear-gradient(${color}, ${color})`,
              backgroundSize: '100% 1.08em',
              backgroundPosition: '0 50%',
              backgroundRepeat: 'no-repeat',
              color:
                luminance(color.startsWith('#') ? color : '#000000') > 0.45 ? '#111111' : '#FFFFFF',
              padding: '0 0.12em',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }
          : {
              color,
              textDecoration: 'underline',
              textDecorationColor: color,
              textDecorationThickness: '0.07em',
              textUnderlineOffset: '0.14em',
            }

  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
      return (
        <span key={i} style={hlStyle}>
          {part.slice(2, -2)}
        </span>
      )
    }
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <span key={i} style={{ textDecoration: 'line-through', textDecorationThickness: '0.08em' }}>
          {renderRich(part.slice(2, -2), highlight, palette)}
        </span>
      )
    }
    if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
      return (
        <em key={i} style={{ fontStyle: 'italic' }}>
          {renderRich(part.slice(1, -1), highlight, palette)}
        </em>
      )
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      // O negrito pode conter um destaque dentro: **É ==isso==.**
      return (
        <strong key={i} style={{ fontWeight: 800 }}>
          {renderRich(part.slice(2, -2), highlight, palette)}
        </strong>
      )
    }
    return part
  })
}

/** Remove a marcação (para contagem de caracteres, legenda, etc.). */
export function plainText(text: string) {
  return text
    .replace(/==([^=]+?)==/g, '$1')
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/~~([^~]+?)~~/g, '$1')
    .replace(/(?<![\w@])_([^_\n]+?)_(?!\w)/g, '$1')
}

/** Envolve a seleção de um textarea com a marcação de destaque. */
export function wrapSelection(value: string, start: number, end: number, mark = '==') {
  if (start === end) return { value, start, end }
  const selected = value.slice(start, end)
  // Se já está marcado, desmarca.
  if (selected.startsWith(mark) && selected.endsWith(mark)) {
    const inner = selected.slice(mark.length, -mark.length)
    return {
      value: value.slice(0, start) + inner + value.slice(end),
      start,
      end: start + inner.length,
    }
  }
  const next = value.slice(0, start) + mark + selected + mark + value.slice(end)
  return { value: next, start, end: end + mark.length * 2 }
}
