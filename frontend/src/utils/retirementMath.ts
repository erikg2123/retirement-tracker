// Single source of truth — no legacy exports
import type {
  RetirementPlan,
  YearlyProjection,
  Milestone,
  DrawdownYear,
  ScenarioOverride,
} from '../types'

// ── 2025 Federal Tax Brackets ──────────────────────────────────────────────
const SINGLE_BRACKETS   = [
  { limit: 11600,  rate: 0.10 },
  { limit: 47150,  rate: 0.12 },
  { limit: 100525, rate: 0.22 },
  { limit: 191950, rate: 0.24 },
  { limit: 243725, rate: 0.32 },
  { limit: 609350, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
]
const MARRIED_BRACKETS  = [
  { limit: 23200,  rate: 0.10 },
  { limit: 94300,  rate: 0.12 },
  { limit: 201050, rate: 0.22 },
  { limit: 383900, rate: 0.24 },
  { limit: 487450, rate: 0.32 },
  { limit: 731200, rate: 0.35 },
  { limit: Infinity, rate: 0.37 },
]
const STANDARD_DEDUCTION = { single: 14600, married: 29200 }

/** Calculate federal tax on a gross income amount */
function calcFederalTax(grossIncome: number, filingStatus: 'single' | 'married'): number {
  const deduction = STANDARD_DEDUCTION[filingStatus]
  const taxable   = Math.max(grossIncome - deduction, 0)
  const brackets  = filingStatus === 'married' ? MARRIED_BRACKETS : SINGLE_BRACKETS

  let tax  = 0
  let prev = 0
  for (const bracket of brackets) {
    if (taxable <= prev) break
    tax  += (Math.min(taxable, bracket.limit) - prev) * bracket.rate
    prev  = bracket.limit
  }
  return tax
}

/**
 * Given a desired net annual spend, calculate gross needed.
 * Roth portion is tax-free. Traditional portion is taxed.
 */
function grossForNet(netAnnual: number, rothPct: number, filingStatus: 'single' | 'married'): number {
  const rothFrac = rothPct / 100
  const tradFrac = 1 - rothFrac

  if (tradFrac === 0) return netAnnual // all Roth — no tax

  // Binary search for gross where (gross - tax on traditional portion) = net
  let lo = netAnnual, hi = netAnnual * 3
  for (let i = 0; i < 60; i++) {
    const mid     = (lo + hi) / 2
    const tradAmt = mid * tradFrac
    const tax     = calcFederalTax(tradAmt, filingStatus)
    const net     = mid - tax
    if (Math.abs(net - netAnnual) < 1) return mid
    if (net < netAnnual) lo = mid
    else                 hi = mid
  }
  return (lo + hi) / 2
}

/** Effective tax rate on a gross withdrawal */
function effectiveTaxRate(gross: number, rothPct: number, filingStatus: 'single' | 'married'): number {
  const tradAmt = gross * (1 - rothPct / 100)
  const tax     = calcFederalTax(tradAmt, filingStatus)
  return gross > 0 ? tax / gross : 0
}

// ── Contribution helpers ───────────────────────────────────────────────────
function getAnnualContribution(plan: RetirementPlan, yearIndex: number): number {
  if (plan.contributionMode === 'fixed') return plan.annualContribution
  const salary = plan.currentSalary * Math.pow(1 + plan.expectedSalaryGrowthPct / 100, yearIndex)
  return Math.round(salary * (plan.salaryContributionPct / 100))
}

function getEstimatedSalary(plan: RetirementPlan, yearIndex: number): number {
  if (plan.contributionMode === 'fixed') return 0
  return Math.round(
    plan.currentSalary * Math.pow(1 + plan.expectedSalaryGrowthPct / 100, yearIndex)
  )
}

export function getEffectiveAnnualContribution(plan: RetirementPlan): number {
  return getAnnualContribution(plan, 0)
}

// ── Nest egg needed ────────────────────────────────────────────────────────
export function calculateNestEggNeeded(plan: RetirementPlan): number {
  const { inflationRate, monthlySpendingGoal, currentAge, retirementAge, rothPct, filingStatus } = plan
  const swr           = plan.withdrawalRate ?? 0.04   // ← read from plan
  const years         = retirementAge - currentAge
  const futureMonthly = monthlySpendingGoal * Math.pow(1 + inflationRate, years)
  const futureAnnual  = futureMonthly * 12
  const grossAnnual   = grossForNet(futureAnnual, rothPct, filingStatus ?? 'single')
  return Math.round(grossAnnual / swr)
}

export const calculateNestedEggNeeded = calculateNestEggNeeded

// ── Monthly withdrawal (gross) the plan implies ───────────────────────────
export function calculateMonthlyWithdrawal(nestEgg: number, plan: RetirementPlan): number {
  if (!nestEgg || nestEgg <= 0) return 0
  const swr = plan.withdrawalRate ?? 0.04   // ← was hardcoded 0.04
  return Math.round((nestEgg * swr) / 12)
}

/** Net (take-home) monthly after taxes */
export function calculateNetMonthlyWithdrawal(nestEgg: number, plan: RetirementPlan): number {
  const gross = calculateMonthlyWithdrawal(nestEgg, plan)
  const tax   = calcFederalTax(
    gross * 12 * (1 - plan.rothPct / 100),
    plan.filingStatus ?? 'single'
  )
  return Math.round(gross - tax / 12)
}

// ── On-track glide path ────────────────────────────────────────────────────
function buildOnTrackTargets(plan: RetirementPlan, nestEggNeeded: number): number[] {
  const { currentAge, retirementAge, currentSavings, expectedReturnRate } = plan
  const years     = retirementAge - currentAge
  const r         = expectedReturnRate
  const fvGrowth  = Math.pow(1 + r, years)
  const fvAnnuity = r === 0 ? years : (fvGrowth - 1) / r
  const impliedC  = (nestEggNeeded - currentSavings * fvGrowth) / fvAnnuity

  return Array.from({ length: years + 1 }, (_, i) => {
    const fvi  = Math.pow(1 + r, i)
    const fvai = r === 0 ? i : (fvi - 1) / r
    return Math.round(currentSavings * fvi + impliedC * fvai)
  })
}

// ── Projections ────────────────────────────────────────────────────────────
export function buildProjections(plan: RetirementPlan): YearlyProjection[] {
  const { currentAge, retirementAge, currentSavings, expectedReturnRate, inflationRate } = plan
  const currentYear       = new Date().getFullYear()
  const yearsToRetirement = retirementAge - currentAge
  const nestEggNeeded     = calculateNestEggNeeded(plan)
  const onTrackTargets    = buildOnTrackTargets(plan, nestEggNeeded)

  const projections: YearlyProjection[] = []
  let balance      = currentSavings
  let doNothingBal = currentSavings   // grows at same rate, zero contributions

  for (let i = 0; i <= yearsToRetirement; i++) {
    const age              = currentAge + i
    const isRetirementYear = age === retirementAge
    const contribution     = isRetirementYear ? 0 : getAnnualContribution(plan, i)

    projections.push({
      age,
      year:                     currentYear + i,
      balance:                  Math.round(balance),
      balanceInflationAdjusted: Math.round(balance / Math.pow(1 + inflationRate, i)),
      annualContribution:       contribution,
      estimatedSalary:          getEstimatedSalary(plan, i),
      isRetirementYear,
      onTrackTarget:            onTrackTargets[i],
      doNothingBalance:         Math.round(doNothingBal),
    })

    if (!isRetirementYear) {
      balance      = (balance + contribution) * (1 + expectedReturnRate)
      doNothingBal = doNothingBal * (1 + expectedReturnRate)
    }
  }
  return projections
}

export function buildScenarioProjections(
  plan: RetirementPlan,
  override: ScenarioOverride,
): YearlyProjection[] {
  const merged: RetirementPlan = {
    ...plan,
    ...(override.annualContribution  !== undefined && { annualContribution: override.annualContribution, contributionMode: 'fixed' }),
    ...(override.expectedReturnRate  !== undefined && { expectedReturnRate: override.expectedReturnRate }),
    ...(override.retirementAge       !== undefined && { retirementAge:      override.retirementAge }),
    ...(override.monthlySpendingGoal !== undefined && { monthlySpendingGoal: override.monthlySpendingGoal }),
  }
  return buildProjections(merged)
}

// ── Drawdown ───────────────────────────────────────────────────────────────
export function buildDrawdown(plan: RetirementPlan, nestEgg: number): DrawdownYear[] {
  const {
    retirementAge, lifeExpectancy, inflationRate,
    rothPct, filingStatus,
  } = plan
  const fs                   = filingStatus ?? 'single'
  const swr                  = plan.withdrawalRate          ?? 0.04  // ← from plan
  const postReturn           = plan.postRetirementReturnRate ?? 0.05  // ← from plan
  const retirementYear       = new Date().getFullYear() + (retirementAge - plan.currentAge)
  const baseAnnualWithdrawal = nestEgg * swr   // ← SWR-based, responds to withdrawalRate changes

  const result: DrawdownYear[] = []
  let balance = nestEgg

  for (let i = 0; i < lifeExpectancy - retirementAge; i++) {
    const depleted        = balance <= 0
    const grossWithdrawal = baseAnnualWithdrawal * Math.pow(1 + inflationRate, i)
    const actual          = Math.min(grossWithdrawal, balance)
    const taxRate         = effectiveTaxRate(actual, rothPct, fs)
    const endBalance      = depleted ? 0 : Math.max((balance - actual) * (1 + postReturn), 0)

    result.push({
      age:              retirementAge + i,
      year:             retirementYear + i,
      startBalance:     Math.round(balance),
      withdrawal:       Math.round(actual),
      growth:           Math.round(depleted ? 0 : (balance - actual) * postReturn),
      endBalance:       Math.round(endBalance),
      depleted,
      effectiveTaxRate: Math.round(taxRate * 1000) / 1000,
    })

    if (depleted) break
    balance = endBalance
  }
  return result
}

// ── Milestones ─────────────────────────────────────────────────────────────
export function buildMilestones(plan: RetirementPlan, projections: YearlyProjection[]): Milestone[] {
  return [
    { age: 35, label: '35 — Early Career' },
    { age: 40, label: '40 — Mid Career' },
    { age: 45, label: '45 — Peak Earning' },
    { age: 50, label: '50 — Final Push' },
    { age: plan.retirementAge, label: `${plan.retirementAge} — Retirement 🎯` },
  ]
    .filter(m => m.age >= plan.currentAge)
    .map(({ age, label }) => {
      const proj = projections.find(p => p.age === age)
      return {
        age, label,
        targetBalance:    proj?.onTrackTarget   ?? 0,
        projectedBalance: proj?.balance          ?? 0,
        reached:         (proj?.balance ?? 0) >= (proj?.onTrackTarget ?? 0),
      }
    })
}

// ── Formatting ─────────────────────────────────────────────────────────────
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '$0'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}