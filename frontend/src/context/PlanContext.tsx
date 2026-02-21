import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { RetirementPlan } from '../types'

/** Migrate saved plans that may have stale/missing fields */
function migratePlan(p: RetirementPlan): RetirementPlan {
  return {
    ...p,
    // if they had the old 0.07 default, upgrade to 0.10
    expectedReturnRate:       p.expectedReturnRate === 0.07 ? 0.10 : p.expectedReturnRate,
    // fill in new fields if missing from old saved plan
    postRetirementReturnRate: p.postRetirementReturnRate ?? 0.05,
    withdrawalRate:           p.withdrawalRate           ?? 0.04,
    dieWithTarget:            p.dieWithTarget            ?? 0,
    currentSavingsRoth:       p.currentSavingsRoth       ?? 0,
  }
}

const DEFAULT_PLAN: RetirementPlan = {
  currentAge:              31,
  retirementAge:           56,
  currentSavings:          126000,
  currentSavingsRoth:      126000,   // ← default: all Roth (matches rothPct: 100)
  expectedReturnRate:      0.10,     // ← was 0.07, now 10%
  inflationRate:           0.03,
  monthlySpendingGoal:     9000,
  rothPct:                 100,
  filingStatus:            'single',
  contributionMode:        'fixed',
  annualContribution:      35000,
  currentSalary:           120000,
  salaryContributionPct:   15,
  expectedSalaryGrowthPct: 3,
  lifeExpectancy:          90,
  dieWithTarget:           0,      // ← NEW: default = just don't hit $0
  postRetirementReturnRate: 0.05,   // ← conservative: bonds+equities mix in retirement
  withdrawalRate:           0.04,   // ← classic 4% rule
}

const STORAGE_KEY = 'retire_plan'

interface PlanContextValue {
  plan:      RetirementPlan
  setPlan:   (plan: RetirementPlan) => void
  savePlan:  () => Promise<void>
  saved:     boolean
  saving:    boolean
}

export const PlanContext = createContext<PlanContextValue>({
  plan:     DEFAULT_PLAN,
  setPlan:  () => {},
  savePlan: async () => {},
  saved:    false,
  saving:   false,
})

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan,    setPlanState] = useState<RetirementPlan>(DEFAULT_PLAN)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)

  // Load from backend on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/plan')
      .then(r => r.json())
      .then(data => {
        if (data) setPlanState(migratePlan({ ...DEFAULT_PLAN, ...data }))
      })
      .catch(() => {
        // fallback to localStorage
        try {
          const raw = localStorage.getItem('retire_plan')
          if (raw) setPlanState(migratePlan({ ...DEFAULT_PLAN, ...JSON.parse(raw) }))
        } catch {}
      })
  }, [])

  function setPlan(next: RetirementPlan) {
    setPlanState(next)
    setSaved(false)
    // always persist to localStorage as backup
    localStorage.setItem('retire_plan', JSON.stringify(next))
  }

  const savePlan = useCallback(async () => {
    setSaving(true)
    try {
      await fetch('http://localhost:3001/api/plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(plan),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }, [plan])

  return (
    <PlanContext.Provider value={{ plan, setPlan, savePlan, saving, saved }}>
      {children}
    </PlanContext.Provider>
  )
}