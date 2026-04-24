import type {
  CheatSheetCardLayout,
  CheatSheetCardResizeConfig,
} from '@/types/components'

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const spanToPixels = (span: number, unit: number, gap: number): number => {
  if (span <= 0) return unit
  return span * unit + (span - 1) * gap
}

const estimateBodyHeight = (content: string, widthPx: number): number => {
  const lines = content.split('\n')
  const chars = content.length
  const availableWidth = Math.max(120, widthPx - 34)
  const charsPerLine = clamp(Math.floor(availableWidth / 7.1), 18, 240)
  const wrappedLines = lines.reduce((sum, line) => {
    return sum + Math.max(1, Math.ceil(line.length / charsPerLine))
  }, 0)

  const blankLines = lines.filter((line) => line.trim().length === 0).length
  const longLines = lines.filter((line) => line.length > charsPerLine).length
  const codeLikeLines = lines.filter((line) => {
    return /[{}[\];=>]|^\s{2,}|\t|`/.test(line)
  }).length

  const baseLinesHeight = wrappedLines * 15.7
  const blankLineBonus = blankLines * 4.2
  const longLineBonus = longLines * 2.8
  const codeBonus = codeLikeLines * 2.4
  const densityBonus = Math.min(150, chars * 0.055)

  return baseLinesHeight + blankLineBonus + longLineBonus + codeBonus + densityBonus
}

export const estimateCardRowSpan = (
  content: string,
  colSpan: number,
  cfg: CheatSheetCardResizeConfig,
): number => {
  const safeColSpan = clamp(colSpan, cfg.minColSpan, cfg.maxColSpan)
  const widthPx = spanToPixels(safeColSpan, cfg.columnWidth, cfg.gap)
  const bodyHeight = estimateBodyHeight(content, widthPx)
  const chromeHeight = 96
  const estimatedHeight = chromeHeight + bodyHeight

  return clamp(
    Math.round((estimatedHeight + cfg.gap) / (cfg.rowHeight + cfg.gap)),
    cfg.minRowSpan,
    cfg.maxRowSpan,
  )
}

export const estimateCardLayoutForContent = (
  content: string,
  baseColSpan: number,
  cfg: CheatSheetCardResizeConfig,
): CheatSheetCardLayout => {
  const base = clamp(baseColSpan, cfg.minColSpan, cfg.maxColSpan)
  const multipliers = [0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.4]
  const candidates = Array.from(new Set(
    multipliers
      .map((m) => clamp(Math.round(base * m), cfg.minColSpan, cfg.maxColSpan))
      .sort((a, b) => a - b),
  ))

  let bestCol = base
  let bestRow = estimateCardRowSpan(content, base, cfg)
  let bestScore = Number.POSITIVE_INFINITY

  candidates.forEach((col) => {
    const row = estimateCardRowSpan(content, col, cfg)
    const area = col * row
    const tooTallPenalty = row > 58 ? (row - 58) * 1.2 : 0
    const tooWidePenalty = col > base * 1.8 ? (col - Math.round(base * 1.8)) * 2.5 : 0
    const score = area + tooTallPenalty + tooWidePenalty

    if (score < bestScore) {
      bestScore = score
      bestCol = col
      bestRow = row
    }
  })

  return {
    colSpan: bestCol,
    rowSpan: bestRow,
  }
}
