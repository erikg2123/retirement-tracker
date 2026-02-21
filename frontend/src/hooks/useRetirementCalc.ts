import { useContext } from 'react'
import { PlanContext } from '../context/PlanContext'
import { useProjections } from './useProjections'
import { calculateMonthlyWithdrawal } from '../utils/retirementMath'
import type { RetirementPlan } from '../types'

export function useRetirementCalc() {
  const { plan, setPlan } = useContext(PlanContext)
  const { data, loading, error } = useProjections(plan)

  function updatePlan(updates: Partial<RetirementPlan>) {
    setPlan({ ...plan, ...updates })
  }

  const projectedNestEgg = data?.projectedNestEgg ?? 0
  const nestEggNeeded    = data?.nestEggNeeded    ?? 0
  const monthlyWithdrawal = projectedNestEgg > 0
    ? calculateMonthlyWithdrawal(projectedNestEgg, plan)
    : 0
  const onTrack = projectedNestEgg >= nestEggNeeded

  return {
    plan,
    setPlan,
    updatePlan,
    loading,
    error,
    projections:      data?.projections  ?? [],
    nestEggNeeded,
    projectedNestEgg,
    monthlyWithdrawal,
    onTrack,
    drawdown:         data?.drawdown     ?? [],
    milestones:       data?.milestones   ?? [],
  }
}