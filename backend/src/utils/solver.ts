import type { RetirementPlan, SolveRequest, SolveResult } from '../types'
import { buildProjections, buildDrawdown, calculateNestEggNeeded } from './math'

const TOLERANCE      = 100
const MAX_ITERS      = 100
const WITHDRAWAL_MIN = 0.02
const WITHDRAWAL_MAX = 0.10

function getEndBalance(plan: RetirementPlan, withdrawalRate: number): number {
  const p           = { ...plan, withdrawalRate }
  const projections = buildProjections(p)
  const nestEgg     = projections.find(pr => pr.isRetirementYear)?.balance ?? 0
  const drawdown    = buildDrawdown(p, nestEgg)
  return drawdown[drawdown.length - 1]?.endBalance ?? 0
}

function getProjectedNestEgg(plan: RetirementPlan): number {
  return buildProjections(plan).find(p => p.isRetirementYear)?.balance ?? 0
}

function binarySearch(
  f: (v: number) => number,
  target: number,
  lo: number,
  hi: number,
  increasing: boolean,
): number | null {
  for (let i = 0; i < MAX_ITERS; i++) {
    const mid    = (lo + hi) / 2
    const result = f(mid)
    if (Math.abs(result - target) < TOLERANCE) return mid
    const overshoot = result > target
    if (increasing ? overshoot : !overshoot) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

export function solve(req: SolveRequest): SolveResult {
  const { plan, target, targetValue, lever } = req

  let solvedValue:   number | null  = null
  let originalValue: number         = 0
  let description:   string         = 'No solution found.'
  let solvedPlan:    RetirementPlan = { ...plan }

  if (target === 'endBalance') {
    if (lever === 'withdrawalRate') {
      originalValue = plan.withdrawalRate ?? 0.04
      solvedValue   = binarySearch(
        v => getEndBalance(plan, v),
        targetValue, WITHDRAWAL_MIN, WITHDRAWAL_MAX, false
      )
      if (solvedValue !== null) {
        solvedPlan  = { ...plan, withdrawalRate: solvedValue }
        description = `To die with ${fmt(targetValue)}, change your withdrawal rate from ${(originalValue * 100).toFixed(2)}% to ${(solvedValue * 100).toFixed(2)}%.`
      }
    }
    else if (lever === 'annualContribution') {
      originalValue = plan.annualContribution
      solvedValue   = binarySearch(
        v => getEndBalance({ ...plan, annualContribution: v, contributionMode: 'fixed' }, plan.withdrawalRate ?? 0.04),
        targetValue, 0, plan.annualContribution * 5, true,
      )
      if (solvedValue !== null) {
        solvedPlan  = { ...plan, annualContribution: Math.round(solvedValue), contributionMode: 'fixed' }
        description = `To die with ${fmt(targetValue)}, change your annual contribution from ${fmt(plan.annualContribution)} to ${fmt(Math.round(solvedValue))}.`
      }
    }
    else if (lever === 'retirementAge') {
      originalValue = plan.retirementAge
      solvedValue   = binarySearch(
        v => getEndBalance({ ...plan, retirementAge: Math.round(v) }, plan.withdrawalRate ?? 0.04),
        targetValue, plan.currentAge + 1, plan.lifeExpectancy - 1, true,
      )
      if (solvedValue !== null) {
        solvedValue = Math.round(solvedValue)
        solvedPlan  = { ...plan, retirementAge: solvedValue }
        description = `To die with ${fmt(targetValue)}, retire at age ${solvedValue} instead of ${plan.retirementAge}.`
      }
    }
    else if (lever === 'monthlySpending') {
      originalValue = plan.monthlySpendingGoal
      solvedValue   = binarySearch(
        v => getEndBalance({ ...plan, monthlySpendingGoal: v }, plan.withdrawalRate ?? 0.04),
        targetValue, 500, plan.monthlySpendingGoal * 3, true,
      )
      if (solvedValue !== null) {
        solvedPlan  = { ...plan, monthlySpendingGoal: Math.round(solvedValue) }
        description = `To die with ${fmt(targetValue)}, adjust monthly spending from ${fmt(plan.monthlySpendingGoal)} to ${fmt(Math.round(solvedValue))}.`
      }
    }
  }

  else if (target === 'monthlySpend') {
    if (lever === 'annualContribution') {
      originalValue = plan.annualContribution
      const needed  = calculateNestEggNeeded({ ...plan, monthlySpendingGoal: targetValue })
      solvedValue   = binarySearch(
        v => getProjectedNestEgg({ ...plan, annualContribution: v, contributionMode: 'fixed' }),
        needed, 0, plan.annualContribution * 5, true,
      )
      if (solvedValue !== null) {
        solvedPlan  = { ...plan, annualContribution: Math.round(solvedValue), contributionMode: 'fixed', monthlySpendingGoal: targetValue }
        description = `To spend ${fmt(targetValue)}/mo in retirement, increase annual contribution to ${fmt(Math.round(solvedValue))}.`
      }
    }
    else if (lever === 'retirementAge') {
      originalValue = plan.retirementAge
      const needed  = calculateNestEggNeeded({ ...plan, monthlySpendingGoal: targetValue })
      solvedValue   = binarySearch(
        v => getProjectedNestEgg({ ...plan, retirementAge: Math.round(v) }),
        needed, plan.currentAge + 1, plan.lifeExpectancy - 1, true,
      )
      if (solvedValue !== null) {
        solvedValue = Math.round(solvedValue)
        solvedPlan  = { ...plan, retirementAge: solvedValue, monthlySpendingGoal: targetValue }
        description = `To spend ${fmt(targetValue)}/mo in retirement, retire at age ${solvedValue}.`
      }
    }
  }

  else if (target === 'retireEarlier') {
    const targetAge = Math.round(targetValue)
    if (lever === 'annualContribution') {
      originalValue = plan.annualContribution
      const needed  = calculateNestEggNeeded({ ...plan, retirementAge: targetAge })
      solvedValue   = binarySearch(
        v => getProjectedNestEgg({ ...plan, retirementAge: targetAge, annualContribution: v, contributionMode: 'fixed' }),
        needed, 0, plan.annualContribution * 10, true,
      )
      if (solvedValue !== null) {
        solvedPlan  = { ...plan, retirementAge: targetAge, annualContribution: Math.round(solvedValue), contributionMode: 'fixed' }
        description = `To retire at ${targetAge}, increase your annual contribution to ${fmt(Math.round(solvedValue))}.`
      }
    }
  }

  if (solvedValue === null) {
    return {
      success:          false,
      lever,
      originalValue,
      solvedValue:      0,
      description:      'Could not find a solution within the search bounds.',
      solvedPlan:       plan,
      projections:      buildProjections(plan),
      nestEggNeeded:    calculateNestEggNeeded(plan),
      projectedNestEgg: getProjectedNestEgg(plan),
    }
  }

  const finalProjections   = buildProjections(solvedPlan)
  const finalNestEgg       = finalProjections.find(p => p.isRetirementYear)?.balance ?? 0
  const finalNestEggNeeded = calculateNestEggNeeded(solvedPlan)

  return {
    success:          true,
    lever,
    originalValue,
    solvedValue:      lever === 'withdrawalRate' ? solvedValue : Math.round(solvedValue),
    description,
    solvedPlan,
    projections:      finalProjections,
    nestEggNeeded:    finalNestEggNeeded,
    projectedNestEgg: finalNestEgg,
  }
}