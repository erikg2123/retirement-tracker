export type FilingStatus = 'single' | 'married'

// 2025 IRS federal income tax brackets
const BRACKETS: Record<FilingStatus, { min: number; max: number; rate: number }[]> = {
  single: [
    { min: 0,        max: 11_925,   rate: 0.10 },
    { min: 11_925,   max: 48_475,   rate: 0.12 },
    { min: 48_475,   max: 103_350,  rate: 0.22 },
    { min: 103_350,  max: 197_300,  rate: 0.24 },
    { min: 197_300,  max: 250_525,  rate: 0.32 },
    { min: 250_525,  max: 626_350,  rate: 0.35 },
    { min: 626_350,  max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0,        max: 23_850,   rate: 0.10 },
    { min: 23_850,   max: 96_950,   rate: 0.12 },
    { min: 96_950,   max: 206_700,  rate: 0.22 },
    { min: 206_700,  max: 394_600,  rate: 0.24 },
    { min: 394_600,  max: 501_050,  rate: 0.32 },
    { min: 501_050,  max: 751_600,  rate: 0.35 },
    { min: 751_600,  max: Infinity, rate: 0.37 },
  ],
}

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single:  14_600,
  married: 29_200,
}

/**
 * Given a gross annual withdrawal, rothPct, and filing status,
 * returns { effectiveRate, taxOwed, netWithdrawal }
 *
 * Roth portion = tax free
 * Traditional portion = taxed as ordinary income after standard deduction
 */
export function calcTax(
  grossAnnual:   number,
  rothPct:       number,
  filingStatus:  FilingStatus = 'single',
): { effectiveRate: number; taxOwed: number; netWithdrawal: number } {
  const rothPortion        = grossAnnual * (rothPct / 100)
  const traditionalPortion = grossAnnual * ((100 - rothPct) / 100)

  // Apply standard deduction to traditional income
  const taxableIncome = Math.max(traditionalPortion - STANDARD_DEDUCTION[filingStatus], 0)

  let taxOwed = 0
  for (const bracket of BRACKETS[filingStatus]) {
    if (taxableIncome <= bracket.min) break
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min
    taxOwed += taxable * bracket.rate
  }

  const effectiveRate  = grossAnnual > 0 ? taxOwed / grossAnnual : 0
  const netWithdrawal  = grossAnnual - taxOwed

  return { effectiveRate, taxOwed, netWithdrawal }
}

/**
 * How much gross do you need to withdraw to NET a target amount?
 * Binary search since the tax function isn't easily invertible.
 */
export function grossForNet(
  targetNet:     number,
  rothPct:       number,
  filingStatus:  FilingStatus = 'single',
): number {
  if (rothPct === 100) return targetNet // all Roth = no tax

  let lo = targetNet, hi = targetNet * 2
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    const { netWithdrawal } = calcTax(mid, rothPct, filingStatus)
    if (Math.abs(netWithdrawal - targetNet) < 1) return mid
    if (netWithdrawal < targetNet) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}