export type ContributionMode = 'fixed' | 'salary'
export type AccountType      = 'roth' | 'traditional'
export type FilingStatus     = 'single' | 'married'

export interface Holding {
  id:            string
  ticker:        string
  shares:        number
  pricePerShare: number
  accountType:   AccountType
  accountName:   string
}

export interface ContributionLog {
  id:      string
  year:    number
  planned: number
  actual:  number
  note?:   string
}

export interface ScenarioOverride {
  label:                string
  color:                string
  annualContribution?:  number
  expectedReturnRate?:  number
  retirementAge?:       number
  monthlySpendingGoal?: number
}

export interface RetirementPlan {
  currentAge:              number
  retirementAge:           number
  currentSavings:          number
  currentSavingsRoth:      number   // ← NEW: how much of currentSavings is in Roth
  expectedReturnRate:      number
  inflationRate:           number
  monthlySpendingGoal:     number
  rothPct:                 number
  filingStatus:            FilingStatus
  contributionMode:        ContributionMode
  annualContribution:      number
  currentSalary:           number
  salaryContributionPct:   number
  expectedSalaryGrowthPct: number
  lifeExpectancy:          number
  dieWithTarget:           number   // ← NEW: desired end balance at lifeExpectancy (0 = just don't run out)
  postRetirementReturnRate: number   // ← NEW: conservative return rate during drawdown (e.g. 0.05)
  withdrawalRate:          number   // ← NEW: SWR, defaults to 0.04
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
  doNothingBalance:         number   // ← NEW: no more contributions
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