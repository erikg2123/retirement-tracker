import { useRetirementCalc } from '../hooks/useRetirementCalc'
import { trinitySuccessRate } from '../utils/trinity'

export function AssumptionsPanel() {
  const { plan, projectedNestEgg } = useRetirementCalc()

  const yearsToRetirement = plan.retirementAge - plan.currentAge
  const retirementYears   = plan.lifeExpectancy - plan.retirementAge
  const annualSpend       = plan.monthlySpendingGoal * 12 *
    Math.pow(1 + plan.inflationRate, yearsToRetirement)
  const withdrawalRate    = projectedNestEgg > 0 ? annualSpend / projectedNestEgg : 0.04
  const successRate       = trinitySuccessRate(withdrawalRate, retirementYears, plan.rothPct)
  const postReturnRate    = Math.max(plan.expectedReturnRate - 0.01, 0.03)

  const rows = [
    { label: 'Pre-retirement return rate',    value: `${(plan.expectedReturnRate * 100).toFixed(1)}%`,  note: 'Applied during accumulation phase' },
    { label: 'Post-retirement return rate',   value: `${(postReturnRate * 100).toFixed(1)}%`,           note: 'Reduced by 1% for conservative drawdown' },
    { label: 'Inflation rate',                value: `${(plan.inflationRate * 100).toFixed(1)}%`,       note: 'Applied to spending goal each year' },
    { label: 'Withdrawal rate (projected)',   value: `${(withdrawalRate * 100).toFixed(2)}%`,           note: 'Annual spend ÷ projected nest egg' },
    { label: 'Trinity success rate',          value: `${successRate}%`,                                 note: `Historical odds over ${retirementYears} yrs` },
    { label: 'Roth allocation',               value: `${plan.rothPct}%`,                                note: 'Roth withdrawals are tax-free' },
    { label: 'Traditional allocation',        value: `${100 - plan.rothPct}%`,                          note: 'Taxed as ordinary income using 2025 IRS brackets' },
    { label: 'Filing status',                 value: plan.filingStatus === 'married' ? 'Married Filing Jointly' : 'Single', note: 'Affects standard deduction + tax brackets' },
    { label: 'Standard deduction (2025)',     value: plan.filingStatus === 'married' ? '$29,200' : '$14,600', note: 'Applied before calculating tax on traditional withdrawals' },
    { label: 'Spending goal (today\'s $)',    value: `$${plan.monthlySpendingGoal.toLocaleString()}/mo`, note: 'Inflated to retirement dollars automatically' },
    { label: 'Spending goal (at retirement)', value: `$${Math.round(annualSpend / 12).toLocaleString()}/mo`, note: `After ${yearsToRetirement} years of ${(plan.inflationRate * 100).toFixed(1)}% inflation` },
    { label: 'Retirement duration',           value: `${retirementYears} years`,                        note: `Age ${plan.retirementAge} → ${plan.lifeExpectancy}` },
    { label: 'Withdrawal model',              value: 'Inflation-adjusted',                               note: 'Withdrawals increase with inflation each year' },
    { label: 'Tax model',                     value: '2025 federal brackets',                            note: 'State taxes not included' },
  ]

  return (
    <div className="chart-card">
      <h2 className="card-title">📋 Assumptions & Model</h2>
      <p className="card-subtitle">
        All calculations are based on the following assumptions. Adjust in ⚙️ Settings.
      </p>

      <table className="assumptions-table">
        <thead>
          <tr>
            <th>Assumption</th>
            <th>Value</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td><strong>{r.value}</strong></td>
              <td className="assumptions-note">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="assumptions-disclaimer">
        ⚠️ <strong>Disclaimer:</strong> These projections are estimates based on historical averages and
        simplified models. Past performance does not guarantee future results. The Trinity Study success
        rates are based on US historical market data (1926–present). Consult a licensed financial advisor
        before making retirement decisions.
      </div>
    </div>
  )
}