import { z } from 'zod'

export const RetirementPlanSchema = z.object({
  currentAge:              z.number().min(18).max(80),
  retirementAge:           z.number().min(40).max(90),
  currentSavings:          z.number().min(0),
  currentSavingsRoth:      z.number().min(0).default(0),
  expectedReturnRate:      z.number().min(0.001).max(0.30),
  inflationRate:           z.number().min(0).max(0.20),
  monthlySpendingGoal:     z.number().min(500),
  rothPct:                 z.number().min(0).max(100),
  filingStatus:            z.enum(['single', 'married']).default('single'),
  contributionMode:        z.enum(['fixed', 'salary']),
  annualContribution:      z.number().min(0),
  currentSalary:           z.number().min(0),
  salaryContributionPct:   z.number().min(0).max(100),
  expectedSalaryGrowthPct: z.number().min(0).max(50),
  lifeExpectancy:          z.number().min(60).max(110),
})

export const SolveRequestSchema = z.object({
  plan:        RetirementPlanSchema,
  target:      z.enum(['endBalance', 'retireEarlier', 'monthlySpend']),
  targetValue: z.number(),
  lever:       z.enum(['withdrawalRate', 'annualContribution', 'retirementAge', 'monthlySpending']),
})