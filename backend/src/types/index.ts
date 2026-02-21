export type ContributionMode = 'fixed' | 'salary'
export type FilingStatus     = 'single' | 'married'

export interface RetirementPlan {
  currentAge:               number
  retirementAge:            number
  currentSavings:           number
  currentSavingsRoth:       number
  expectedReturnRate:       number
  inflationRate:            number
  monthlySpendingGoal:      number
  rothPct:                  number
  filingStatus:             'single' | 'married'
  contributionMode:         'fixed' | 'salary'
  annualContribution:       number
  currentSalary:            number
  salaryContributionPct:    number
  expectedSalaryGrowthPct:  number
  lifeExpectancy:           number
  dieWithTarget:            number        // ← NEW
  postRetirementReturnRate: number        // ← NEW
  withdrawalRate:           number        // ← NEW
}

export interface YearlyProjection {
  age:                      number
  year:                     number
  balance:                  number
  balanceInflationAdjusted: number
  annualContribution:       number
  estimatedSalary:          number
  isRetirementYear:         boolean
  onTrackTarget:            number
  doNothingBalance:         number
}

export interface DrawdownYear {
  age:              number
  year:             number
  startBalance:     number
  withdrawal:       number
  growth:           number
  endBalance:       number
  depleted:         boolean
  effectiveTaxRate: number
}

export interface Milestone {
  age:              number
  label:            string
  targetBalance:    number
  reached:          boolean
  projectedBalance: number
}

// ── Solver types ──────────────────────────────────────────────

export interface SolveRequest {
  plan:        RetirementPlan
  target:      'endBalance' | 'retireEarlier' | 'monthlySpend'
  targetValue: number
  lever:       'withdrawalRate' | 'annualContribution' | 'retirementAge' | 'monthlySpending'
}

export interface SolveResult {
  success:          boolean
  lever:            string
  originalValue:    number
  solvedValue:      number
  description:      string
  solvedPlan:       RetirementPlan
  projections:      YearlyProjection[]
  nestEggNeeded:    number
  projectedNestEgg: number
}