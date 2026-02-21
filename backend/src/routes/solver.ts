import { Router } from 'express'
import { solve } from '../utils/solver'
import type { SolveRequest } from '../types'

const router = Router()

router.post('/', (req, res) => {
  try {
    const body = req.body

    const request: SolveRequest = {
      plan: {
        currentAge:               body.plan.currentAge,
        retirementAge:            body.plan.retirementAge,
        currentSavings:           body.plan.currentSavings,
        currentSavingsRoth:       body.plan.currentSavingsRoth       ?? 0,
        expectedReturnRate:       body.plan.expectedReturnRate,
        inflationRate:            body.plan.inflationRate,
        monthlySpendingGoal:      body.plan.monthlySpendingGoal,
        rothPct:                  body.plan.rothPct,
        filingStatus:             body.plan.filingStatus              ?? 'single',
        contributionMode:         body.plan.contributionMode          ?? 'fixed',
        annualContribution:       body.plan.annualContribution,
        currentSalary:            body.plan.currentSalary             ?? 0,
        salaryContributionPct:    body.plan.salaryContributionPct     ?? 0,
        expectedSalaryGrowthPct:  body.plan.expectedSalaryGrowthPct   ?? 0,
        lifeExpectancy:           body.plan.lifeExpectancy            ?? 90,
        dieWithTarget:            body.plan.dieWithTarget             ?? 0,       // ← NEW
        postRetirementReturnRate: body.plan.postRetirementReturnRate  ?? 0.05,    // ← NEW
        withdrawalRate:           body.plan.withdrawalRate            ?? 0.04,    // ← NEW
      },
      target:      body.target,
      targetValue: body.targetValue,
      lever:       body.lever,
    }

    const result = solve(request)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

export default router