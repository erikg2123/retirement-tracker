import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'
import { useRetirementCalc } from '../hooks/useRetirementCalc'
import { buildScenarioProjections, formatCurrency, calculateNestedEggNeeded } from '../utils/retirementMath'
import type { ScenarioOverride } from '../types'

const DEFAULT_SCENARIOS: ScenarioOverride[] = [
  { label: 'Base Plan',       color: '#4a90e2' },
  { label: 'Contribute +$5K', color: '#38a169', annualContribution: 40000 },
  { label: 'Contribute -$5K', color: '#e53e3e', annualContribution: 30000 },
  { label: 'Retire at 58',    color: '#9b59b6', retirementAge: 58 },
  { label: '6% Return',       color: '#f39c12', expectedReturnRate: 0.06 },
]

export function ScenarioComparison() {
  const { plan, projectedNestEgg, nestEggNeeded } = useRetirementCalc()
  const [active, setActive] = useState<boolean[]>(DEFAULT_SCENARIOS.map((_, i) => i < 3))
  const [custom, setCustom] = useState({ label: '', contribution: '', returnRate: '', retirementAge: '' })
  const [scenarios, setScenarios] = useState<ScenarioOverride[]>(DEFAULT_SCENARIOS)

  const toggleScenario = (i: number) =>
    setActive(a => a.map((v, j) => j === i ? !v : v))

  const addCustom = () => {
    const override: ScenarioOverride = {
      label: custom.label || 'Custom',
      color: `hsl(${Math.random() * 360}, 60%, 50%)`,
      ...(custom.contribution  && { annualContribution:  parseFloat(custom.contribution),  }),
      ...(custom.returnRate    && { expectedReturnRate:  parseFloat(custom.returnRate) / 100 }),
      ...(custom.retirementAge && { retirementAge:       parseInt(custom.retirementAge) }),
    }
    setScenarios(s => [...s, override])
    setActive(a => [...a, true])
    setCustom({ label: '', contribution: '', returnRate: '', retirementAge: '' })
  }

  // Build all projections
  const allProjections = scenarios.map(s =>
    s.label === 'Base Plan' ? null : buildScenarioProjections(plan, s)
  )
  const baseProjections = buildScenarioProjections(plan, { label: 'Base Plan', color: '#4a90e2' })

  // Merge into chart data keyed by age
  const ages = baseProjections.map(p => p.age)
  const chartData = ages.map((age, i) => {
    const row: Record<string, number> = { age }
    scenarios.forEach((s, si) => {
      if (!active[si]) return
      const proj = s.label === 'Base Plan' ? baseProjections[i] : allProjections[si]?.[i]
      if (proj) row[s.label] = proj.balance
    })
    return row
  })

  // Summary table
  const summaryRows = scenarios.map((s, si) => {
    const projs = s.label === 'Base Plan' ? baseProjections : allProjections[si] ?? baseProjections
    const retirementAgeFinal = s.retirementAge ?? plan.retirementAge
    const retProj = projs.find(p => p.age === retirementAgeFinal) ?? projs[projs.length - 1]
    const needed  = calculateNestedEggNeeded({ ...plan, ...(s.retirementAge && { retirementAge: s.retirementAge }) })
    const onTrack = (retProj?.balance ?? 0) >= needed
    return { ...s, projectedNestEgg: retProj?.balance ?? 0, needed, onTrack, active: active[si] }
  })

  return (
    <div className="chart-card">
      <h3>🎲 Scenario Comparison</h3>
      <p className="chart-sub">See how different choices affect your retirement outcome</p>

      {/* Toggle buttons */}
      <div className="scenario-toggles">
        {scenarios.map((s, i) => (
          <button
            key={i}
            className={`scenario-btn ${active[i] ? 'active' : ''}`}
            style={{ '--s-color': s.color } as React.CSSProperties}
            onClick={() => toggleScenario(i)}
          >
            <span className="scenario-dot" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="age" tick={{ fontSize: 12 }} label={{ value: 'Age', position: 'insideBottom', offset: -4 }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={75} />
          <Tooltip
            formatter={(v: number, name: string) => [formatCurrency(v), name]}
            labelFormatter={l => `Age ${l}`}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
          <Legend verticalAlign="top" />
          {scenarios.map((s, i) =>
            active[i] ? (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={s.color}
                strokeWidth={s.label === 'Base Plan' ? 3 : 2}
                dot={false}
                strokeDasharray={s.label === 'Base Plan' ? undefined : '5 3'}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <table className="holdings-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Projected Nest Egg</th>
            <th>Goal</th>
            <th>Difference</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {summaryRows.filter(s => s.active).map(s => {
            const diff = s.projectedNestEgg - s.needed
            return (
              <tr key={s.label}>
                <td><span className="scenario-dot" style={{ background: s.color, display: 'inline-block', marginRight: 6 }} />{s.label}</td>
                <td><strong>{formatCurrency(s.projectedNestEgg)}</strong></td>
                <td>{formatCurrency(s.needed)}</td>
                <td style={{ color: diff >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                </td>
                <td>
                  <span className={`type-badge ${s.onTrack ? 'roth' : 'traditional'}`}>
                    {s.onTrack ? '✅ On Track' : '⚠️ Short'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Custom scenario builder */}
      <div className="holding-form" style={{ marginTop: '1.25rem' }}>
        <p className="section-label">+ Build Custom Scenario</p>
        <div className="holding-form-grid">
          <label className="settings-label">
            Label
            <input value={custom.label} onChange={e => setCustom(c => ({ ...c, label: e.target.value }))} placeholder="e.g. Aggressive Save" />
          </label>
          <label className="settings-label">
            Annual Contribution ($)
            <input type="number" value={custom.contribution} onChange={e => setCustom(c => ({ ...c, contribution: e.target.value }))} placeholder="e.g. 45000" />
          </label>
          <label className="settings-label">
            Return Rate (%)
            <input type="number" value={custom.returnRate} onChange={e => setCustom(c => ({ ...c, returnRate: e.target.value }))} placeholder="e.g. 8" />
          </label>
          <label className="settings-label">
            Retirement Age
            <input type="number" value={custom.retirementAge} onChange={e => setCustom(c => ({ ...c, retirementAge: e.target.value }))} placeholder="e.g. 55" />
          </label>
        </div>
        <button className="btn-primary" style={{ marginTop: '0.75rem' }} onClick={addCustom}>
          Add Scenario
        </button>
      </div>
    </div>
  )
}