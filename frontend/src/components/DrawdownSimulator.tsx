import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useRetirementCalc } from '../hooks/useRetirementCalc'
import { formatCurrency } from '../utils/retirementMath'

export function DrawdownSimulator() {
  const { drawdown, plan, projectedNestEgg } = useRetirementCalc()

  const depletionYear = drawdown.find(d => d.depleted)
  const lastYear      = drawdown[drawdown.length - 1]
  const runsOut       = !!depletionYear
  const runway        = drawdown.filter(d => !d.depleted).length
  const balanceAtLife = lastYear?.endBalance ?? 0

  const chartData = drawdown.map(d => ({
    age:     d.age,
    Balance: d.endBalance,
    Withdrawal: d.withdrawal,
  }))

  return (
    <div className="chart-card">
      <h3>🏖️ Retirement Drawdown Simulator</h3>
      <p className="chart-sub">
        Starting with {formatCurrency(projectedNestEgg)} at age {plan.retirementAge} · 4% withdrawal · inflation-adjusted
      </p>

      {/* Summary */}
      <div className="log-summary" style={{ marginBottom: '1.25rem' }}>
        <div className="log-stat">
          <span className="stat-label">Nest Egg at Retirement</span>
          <span className="stat-value">{formatCurrency(projectedNestEgg)}</span>
        </div>
        <div className="log-stat">
          <span className="stat-label">Runway</span>
          <span className="stat-value" style={{ color: runsOut ? 'var(--error)' : 'var(--success)' }}>
            {runsOut ? `${runway} yrs ⚠️` : `${runway}+ yrs ✅`}
          </span>
        </div>
        <div className="log-stat">
          <span className="stat-label">Balance at {plan.lifeExpectancy}</span>
          <span className="stat-value" style={{ color: balanceAtLife > 0 ? 'var(--success)' : 'var(--error)' }}>
            {balanceAtLife > 0 ? formatCurrency(balanceAtLife) : 'Depleted'}
          </span>
        </div>
        <div className="log-stat">
          <span className="stat-label">Life Expectancy</span>
          <span className="stat-value">{plan.lifeExpectancy}</span>
        </div>
      </div>

      {runsOut && (
        <div className="banner banner-warning" style={{ marginBottom: '1rem' }}>
          ⚠️ At current withdrawal rate, funds are depleted at age {depletionYear?.age}. Consider increasing your nest egg or reducing spending.
        </div>
      )}
      {!runsOut && (
        <div className="banner banner-success" style={{ marginBottom: '1rem' }}>
          ✅ Your nest egg outlasts your life expectancy of {plan.lifeExpectancy} — leaving {formatCurrency(balanceAtLife)} at age {plan.lifeExpectancy}.
        </div>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="balanceGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#4a90e2" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4a90e2" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="withdrawalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#e74c3c" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#e74c3c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="age" tick={{ fontSize: 12 }} label={{ value: 'Age', position: 'insideBottom', offset: -4 }} />
          <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} width={75} />
          <Tooltip
            formatter={(v: number, name: string) => [formatCurrency(v), name]}
            labelFormatter={l => `Age ${l}`}
            contentStyle={{ borderRadius: 8, fontSize: 13 }}
          />
          {depletionYear && (
            <ReferenceLine
              x={depletionYear.age}
              stroke="#e74c3c"
              strokeDasharray="4 3"
              label={{ value: 'Depleted', fill: '#e74c3c', fontSize: 11 }}
            />
          )}
          <Area type="monotone" dataKey="Balance"    stroke="#4a90e2" fill="url(#balanceGrad2)"   strokeWidth={2.5} name="Portfolio Balance" />
          <Area type="monotone" dataKey="Withdrawal" stroke="#e74c3c" fill="url(#withdrawalGrad)" strokeWidth={1.5} name="Annual Withdrawal" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Year by year table (collapsed) */}
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--muted)', padding: '0.5rem 0' }}>
          View year-by-year breakdown
        </summary>
        <div className="holdings-table-wrap" style={{ marginTop: '0.5rem' }}>
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Age</th>
                <th>Start Balance</th>
                <th>Withdrawal</th>
                <th>Growth</th>
                <th>End Balance</th>
              </tr>
            </thead>
            <tbody>
              {drawdown.map(d => (
                <tr key={d.age} style={{ opacity: d.depleted ? 0.4 : 1 }}>
                  <td><strong>{d.age}</strong></td>
                  <td>{formatCurrency(d.startBalance)}</td>
                  <td style={{ color: 'var(--error)' }}>−{formatCurrency(d.withdrawal)}</td>
                  <td style={{ color: 'var(--success)' }}>+{formatCurrency(d.growth)}</td>
                  <td><strong>{formatCurrency(d.endBalance)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}