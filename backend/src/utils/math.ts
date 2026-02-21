import type { RetirementPlan, YearlyProjection, DrawdownYear, Milestone } from '../types'
import { calcTax, grossForNet } from './tax'
import type { FilingStatus } from './tax'

export function getAnnualContribution(plan: RetirementPlan, yearIndex: number): number {
  if (plan.contributionMode === 'fixed') return plan.annualContribution
  const salary = plan.currentSalary * Math.pow(1 + plan.expectedSalaryGrowthPct / 100, yearIndex)
  return Math.round(salary * (plan.salaryContributionPct / 100))
}

export function calculateNestEggNeeded(plan: RetirementPlan): number {
  const { inflationRate, monthlySpendingGoal, currentAge, retirementAge, rothPct, filingStatus } = plan
  const swr           = plan.withdrawalRate ?? 0.04   // ← always read from plan
  const years         = retirementAge - currentAge
  const futureMonthly = monthlySpendingGoal * Math.pow(1 + inflationRate, years)
  const futureAnnual  = futureMonthly * 12
  const grossAnnual   = grossForNet(futureAnnual, rothPct, (filingStatus ?? 'single') as FilingStatus)
  return Math.round(grossAnnual / swr)
}

export function buildProjections(plan: RetirementPlan): YearlyProjection[] {
  const { currentAge, retirementAge, currentSavings, expectedReturnRate, inflationRate } = plan
  const currentYear       = new Date().getFullYear()
  const yearsToRetirement = retirementAge - currentAge
  const nestEggNeeded     = calculateNestEggNeeded(plan)

  const r         = expectedReturnRate
  const fvGrowth  = Math.pow(1 + r, yearsToRetirement)
  const fvAnnuity = r === 0 ? yearsToRetirement : (fvGrowth - 1) / r
  const impliedC  = (nestEggNeeded - currentSavings * fvGrowth) / fvAnnuity

  const onTrackTargets = Array.from({ length: yearsToRetirement + 1 }, (_, i) => {
    const fvi  = Math.pow(1 + r, i)
    const fvai = r === 0 ? i : (fvi - 1) / r
    return Math.round(currentSavings * fvi + impliedC * fvai)
  })

  const projections: YearlyProjection[] = []
  let balance      = currentSavings
  let doNothingBal = currentSavings

  for (let i = 0; i <= yearsToRetirement; i++) {
    const age              = currentAge + i
    const isRetirementYear = age === retirementAge
    const contribution     = isRetirementYear ? 0 : getAnnualContribution(plan, i)
    const estimatedSalary  = plan.contributionMode === 'salary'
      ? Math.round(plan.currentSalary * Math.pow(1 + plan.expectedSalaryGrowthPct / 100, i))
      : 0

    projections.push({
      age,
      year:                     currentYear + i,
      balance:                  Math.round(balance),
      balanceInflationAdjusted: Math.round(balance / Math.pow(1 + inflationRate, i)),
      annualContribution:       contribution,
      estimatedSalary,
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

export function buildDrawdown(plan: RetirementPlan, nestEgg: number): DrawdownYear[] {
  const {
    retirementAge, lifeExpectancy, inflationRate,
    rothPct, filingStatus,
  } = plan
  const fs          = (filingStatus ?? 'single') as FilingStatus
  const postReturn  = plan.postRetirementReturnRate ?? 0.05   // ← from plan, no magic subtraction
  const swr         = plan.withdrawalRate ?? 0.04             // ← from plan, solver changes this
  const retirementYear = new Date().getFullYear() + (retirementAge - plan.currentAge)

  // SWR-based: withdraw swr% of initial nest egg, inflation-adjusted each year
  // This is what actually responds to withdrawalRate changes
  const baseAnnualWithdrawal = nestEgg * swr

  const result: DrawdownYear[] = []
  let balance = nestEgg

  for (let i = 0; i < lifeExpectancy - retirementAge; i++) {
    const depleted        = balance <= 0
    const grossWithdrawal = baseAnnualWithdrawal * Math.pow(1 + inflationRate, i)
    const actual          = Math.min(grossWithdrawal, balance)
    const { effectiveRate } = calcTax(actual, rothPct, fs)
    const endBalance      = depleted ? 0 : Math.max((balance - actual) * (1 + postReturn), 0)

    result.push({
      age:              retirementAge + i,
      year:             retirementYear + i,
      startBalance:     Math.round(balance),
      withdrawal:       Math.round(actual),
      growth:           Math.round(depleted ? 0 : (balance - actual) * postReturn),
      endBalance:       Math.round(endBalance),
      depleted,
      effectiveTaxRate: Math.round(effectiveRate * 1000) / 1000,
    })

    if (depleted) break
    balance = endBalance
  }
  return result
}

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
        targetBalance:    proj?.onTrackTarget ?? 0,
        projectedBalance: proj?.balance       ?? 0,
        reached:         (proj?.balance ?? 0) >= (proj?.onTrackTarget ?? 0),
      }
    })
}