/**
 * Trinity Study inspired success rates.
 * Based on historical data from Bengen (1994) and Trinity Study (1998, updated 2011).
 * Stock allocation estimated from rothPct (higher Roth = more aggressive = more equities).
 *
 * Returns estimated % probability portfolio survives given years.
 */

// Historical success rates: [withdrawalRate, 15yr, 20yr, 25yr, 30yr, 35yr, 40yr]
// 75% stocks / 25% bonds (aggressive) — Trinity Study Table
const AGGRESSIVE: [number, number, number, number, number, number, number][] = [
  [0.03, 100, 100, 100, 100,  98,  95],
  [0.04, 100, 100,  98,  95,  90,  85],
  [0.05, 100,  98,  90,  83,  73,  63],
  [0.06, 100,  90,  78,  68,  57,  46],
  [0.07,  98,  80,  63,  52,  42,  32],
  [0.08,  90,  65,  50,  38,  29,  22],
  [0.09,  80,  52,  38,  27,  20,  15],
  [0.10,  68,  40,  27,  18,  13,  10],
]

// 50% stocks / 50% bonds (moderate) — Trinity Study Table
const MODERATE: [number, number, number, number, number, number, number][] = [
  [0.03, 100, 100, 100,  99,  95,  90],
  [0.04, 100,  99,  93,  87,  80,  72],
  [0.05, 100,  90,  78,  66,  55,  45],
  [0.06,  98,  78,  60,  47,  37,  28],
  [0.07,  88,  62,  43,  32,  23,  17],
  [0.08,  72,  46,  30,  21,  14,  10],
  [0.09,  58,  33,  20,  13,   8,   5],
  [0.10,  44,  23,  13,   8,   5,   3],
]

function interpolateRate(
  table: [number, number, number, number, number, number, number][],
  rate:  number,
  years: number,
): number {
  const colIndex = years <= 15 ? 1
    : years <= 20 ? 2
    : years <= 25 ? 3
    : years <= 30 ? 4
    : years <= 35 ? 5
    : 6

  // clamp rate
  const clampedRate = Math.max(0.03, Math.min(0.10, rate))

  // find surrounding rows
  for (let i = 0; i < table.length - 1; i++) {
    const lo = table[i]
    const hi = table[i + 1]
    if (clampedRate >= lo[0] && clampedRate <= hi[0]) {
      const t = (clampedRate - lo[0]) / (hi[0] - lo[0])
      return Math.round(lo[colIndex] + t * (hi[colIndex] - lo[colIndex]))
    }
  }

  return clampedRate <= 0.03 ? 100 : table[table.length - 1][colIndex]
}

/**
 * @param withdrawalRate  e.g. 0.04 for 4%
 * @param retirementYears e.g. 30
 * @param rothPct         0–100 — higher = more aggressive stock allocation assumed
 */
export function trinitySuccessRate(
  withdrawalRate:  number,
  retirementYears: number,
  rothPct:         number,
): number {
  // Assume Roth-heavy = more equities = use aggressive table
  // Traditional-heavy = more conservative = use moderate table
  const aggressive = interpolateRate(AGGRESSIVE, withdrawalRate, retirementYears)
  const moderate   = interpolateRate(MODERATE,   withdrawalRate, retirementYears)
  const blend      = rothPct / 100 // 100% Roth = full aggressive
  return Math.round(aggressive * blend + moderate * (1 - blend))
}