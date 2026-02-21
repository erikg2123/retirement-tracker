import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useHoldings } from '../hooks/useHoldings'
import { formatCurrency } from '../utils/retirementMath'

const COLORS = ['#4a90e2','#38a169','#e53e3e','#f39c12','#9b59b6','#1abc9c','#e67e22','#2ecc71','#3498db','#e74c3c']

export function AssetAllocation() {
  const { holdings, summary } = useHoldings()

  if (holdings.length === 0) {
    return (
      <div className="chart-card">
        <h3>📊 Asset Allocation</h3>
        <div className="holdings-empty">Add holdings to see your allocation breakdown.</div>
      </div>
    )
  }

  // By ticker
  const byTicker: Record<string, number> = {}
  for (const h of holdings) {
    byTicker[h.ticker] = (byTicker[h.ticker] ?? 0) + h.shares * h.pricePerShare
  }
  const tickerData = Object.entries(byTicker)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)

  // By account
  const accountData = Object.entries(summary.byAccount).map(([name, info]) => ({
    name,
    value: Math.round(info.total),
    accountType: info.accountType,
  }))

  const pct = (value: number) => ((value / summary.total) * 100).toFixed(1)

  return (
    <div className="chart-card">
      <h3>📊 Asset Allocation</h3>
      <p className="chart-sub">Portfolio breakdown by ticker and account</p>

      <div className="allocation-grid">
        {/* By Ticker */}
        <div className="allocation-panel">
          <p className="section-label">By Ticker</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={tickerData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name} ${pct(value)}%`}
                labelLine={false}
              >
                {tickerData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name]}
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <table className="holdings-table" style={{ marginTop: '0.5rem' }}>
            <thead><tr><th>Ticker</th><th>Value</th><th>%</th></tr></thead>
            <tbody>
              {tickerData.map((t, i) => (
                <tr key={t.name}>
                  <td><span className="ticker-cell" style={{ color: COLORS[i % COLORS.length] }}>{t.name}</span></td>
                  <td>{formatCurrency(t.value)}</td>
                  <td>{pct(t.value)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Account */}
        <div className="allocation-panel">
          <p className="section-label">By Account</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={accountData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${pct(value)}%`}
                labelLine={false}
              >
                {accountData.map((a, i) => (
                  <Cell key={i} fill={a.accountType === 'roth' ? '#38a169' : '#e53e3e'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name]}
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <table className="holdings-table" style={{ marginTop: '0.5rem' }}>
            <thead><tr><th>Account</th><th>Type</th><th>Value</th><th>%</th></tr></thead>
            <tbody>
              {accountData.map(a => (
                <tr key={a.name}>
                  <td>{a.name}</td>
                  <td><span className={`type-badge ${a.accountType}`}>{a.accountType === 'roth' ? '🟢 Roth' : '🔴 Trad'}</span></td>
                  <td>{formatCurrency(a.value)}</td>
                  <td>{pct(a.value)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}