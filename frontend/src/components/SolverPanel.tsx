import { useState } from 'react'
import { useRetirementCalc } from '../hooks/useRetirementCalc'
import { api } from '../api/client'
import type { SolveRequest, SolveResponse } from '../api/client'
import { formatCurrency } from '../utils/retirementMath'

type Target = SolveRequest['target']
type Lever  = SolveRequest['lever']

const TARGET_OPTIONS: { value: Target; label: string; description: string }[] = [
  { value: 'endBalance',    label: '💰 Die with a specific amount',  description: 'Target a specific end-of-life balance' },
  { value: 'monthlySpend',  label: '🛍️ Afford a monthly spend goal', description: 'Hit a specific monthly spending amount in retirement' },
  { value: 'retireEarlier', label: '🏖️ Retire at a specific age',    description: 'Find what it takes to retire earlier' },
]

const LEVER_OPTIONS: Record<Target, { value: Lever; label: string }[]> = {
  endBalance:    [
    { value: 'withdrawalRate',     label: 'Adjust withdrawal rate' },
    { value: 'annualContribution', label: 'Change annual contribution' },
    { value: 'retirementAge',      label: 'Push retirement age' },
    { value: 'monthlySpending',    label: 'Reduce monthly spending' },
  ],
  monthlySpend:  [
    { value: 'annualContribution', label: 'Change annual contribution' },
    { value: 'retirementAge',      label: 'Push retirement age' },
  ],
  retireEarlier: [
    { value: 'annualContribution', label: 'Change annual contribution' },
  ],
}

const TARGET_DEFAULTS: Record<Target, number> = {
  endBalance:    1_000_000,
  monthlySpend:  12_000,
  retireEarlier: 50,
}

const TARGET_LABELS: Record<Target, string> = {
  endBalance:    'Target end balance ($)',
  monthlySpend:  'Target monthly spend ($)',
  retireEarlier: 'Target retirement age (years old)',
}

// Format the solved value correctly based on lever type
function formatSolvedValue(lever: Lever, value: number): string {
  if (lever === 'withdrawalRate') return `${(value * 100).toFixed(2)}%`
  if (lever === 'retirementAge')  return `Age ${value}`
  return formatCurrency(value)
}

export function SolverPanel() {
  const { plan, updatePlan } = useRetirementCalc()

  const [target,      setTarget]      = useState<Target>('endBalance')
  const [lever,       setLever]       = useState<Lever>('withdrawalRate')
  const [targetValue, setTargetValue] = useState(TARGET_DEFAULTS['endBalance'])
  const [result,      setResult]      = useState<SolveResponse | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [applied,     setApplied]     = useState(false)

  function handleTargetChange(t: Target) {
    setTarget(t)
    setLever(LEVER_OPTIONS[t][0].value)
    setTargetValue(TARGET_DEFAULTS[t])
    setResult(null)
    setApplied(false)
  }

  async function handleSolve() {
    setLoading(true)
    setError(null)
    setResult(null)
    setApplied(false)
    try {
      const res = await api.solve({ plan, target, targetValue, lever })
      setResult(res)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleApply() {
    if (!result?.success || !result.solvedPlan) return
    // Apply the entire solved plan — this updates ALL changed fields at once
    updatePlan(result.solvedPlan)
    setApplied(true)
  }

  const shortfall = result ? result.projectedNestEgg - result.nestEggNeeded : 0

  return (
    <div className="chart-card">
      <h2 className="card-title">🎯 Goal Solver</h2>
      <p className="card-subtitle">
        Set a target outcome and let the solver find what needs to change.
      </p>

      <div className="solver-targets">
        {TARGET_OPTIONS.map(t => (
          <button
            key={t.value}
            className={`solver-target-btn ${target === t.value ? 'active' : ''}`}
            onClick={() => handleTargetChange(t.value)}
          >
            <span className="solver-target-label">{t.label}</span>
            <span className="solver-target-desc">{t.description}</span>
          </button>
        ))}
      </div>

      <div className="solver-inputs">
        <label className="settings-label">
          <span className="label-row">{TARGET_LABELS[target]}</span>
          <input
            type="number"
            value={targetValue}
            onChange={e => setTargetValue(Number(e.target.value))}
            step={target === 'retireEarlier' ? 1 : 10000}
            min={target === 'retireEarlier' ? plan.currentAge + 1 : 0}
          />
        </label>

        <label className="settings-label">
          <span className="label-row">Lever to adjust</span>
          <select value={lever} onChange={e => setLever(e.target.value as Lever)}>
            {LEVER_OPTIONS[target].map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </label>

        <button className="btn-primary" onClick={handleSolve} disabled={loading}>
          {loading ? '⏳ Solving...' : '⚡ Solve'}
        </button>
      </div>

      {error && <div className="solver-error">❌ {error}</div>}

      {result && (
        <div className={`solver-result ${result.success ? 'success' : 'failure'}`}>
          <p className="solver-description">{result.description}</p>

          <div className="solver-stats">
            <div className="solver-stat">
              <span className="stat-label">Was</span>
              <span className="stat-value">
                {formatSolvedValue(lever as Lever, result.originalValue)}
              </span>
            </div>
            <div className="solver-stat solver-stat--arrow">→</div>
            <div className="solver-stat">
              <span className="stat-label">Needs to be</span>
              <span className="stat-value highlight">
                {formatSolvedValue(lever as Lever, result.solvedValue)}
              </span>
            </div>
            <div className="solver-stat">
              <span className="stat-label">Projected Nest Egg</span>
              <span className="stat-value">{formatCurrency(result.projectedNestEgg)}</span>
            </div>
            <div className="solver-stat">
              <span className="stat-label">Nest Egg Needed</span>
              <span className="stat-value">{formatCurrency(result.nestEggNeeded)}</span>
            </div>
            <div className="solver-stat">
              <span className="stat-label">{shortfall >= 0 ? '🟢 Surplus' : '🔴 Shortfall'}</span>
              <span className={`stat-value ${shortfall >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(Math.abs(shortfall))}
              </span>
            </div>
          </div>

          {result.success && (
            <button
              className={`btn-primary apply-btn ${applied ? 'applied' : ''}`}
              onClick={handleApply}
              disabled={applied}
            >
              {applied ? '✅ Applied to Plan!' : '⚡ Apply to My Plan'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}