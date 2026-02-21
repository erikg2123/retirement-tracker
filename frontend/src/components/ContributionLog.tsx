import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend, Cell
} from 'recharts'
import { useContributionLog } from '../hooks/useContributionLog'
import { useRetirementCalc } from '../hooks/useRetirementCalc'
import { formatCurrency } from '../utils/retirementMath'

const currentYear = new Date().getFullYear()

export function ContributionLog() {
  const { logs, addLog, removeLog, summary } = useContributionLog()
  const { plan } = useRetirementCalc()
  const [form, setForm] = useState({ year: String(currentYear), planned: String(plan.annualContribution), actual: '', note: '' })
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    const year    = parseInt(form.year)
    const planned = parseFloat(form.planned)
    const actual  = parseFloat(form.actual)
    if (isNaN(year) || isNaN(planned) || isNaN(actual)) return
    addLog({ year, planned, actual, note: form.note })
    setForm({ year: String(currentYear), planned: String(plan.annualContribution), actual: '', note: '' })
    setShowForm(false)
  }

  const sorted = [...logs].sort((a, b) => a.year - b.year)

  const chartData = sorted.map(l => ({
    year: l.year,
    Planned: l.planned,
    Actual:  l.actual,
    onTrack: l.actual >= l.planned,
  }))

  return (
    <div className="chart-card">
      <div className="holdings-header">
        <div>
          <h3>📅 Contribution Log</h3>
          <p className="chart-sub">Actual vs planned contributions year by year</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Log Year'}
        </button>
      </div>

      {/* Summary stats */}
      {logs.length > 0 && (
        <div className="log-summary">
          <div className="log-stat">
            <span className="stat-label">Total Contributed</span>
            <span className="stat-value">{formatCurrency(summary.totalActual)}</span>
          </div>
          <div className="log-stat">
            <span className="stat-label">Total Planned</span>
            <span className="stat-value">{formatCurrency(summary.totalPlanned)}</span>
          </div>
          <div className="log-stat">
            <span className="stat-label">On-Track Years</span>
            <span className="stat-value">{summary.onTrackYears} / {summary.totalYears}</span>
          </div>
          <div className="log-stat">
            <span className="stat-label">Avg Annual</span>
            <span className="stat-value">{formatCurrency(summary.avgActual)}</span>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="holding-form">
          <div className="holding-form-grid">
            <label className="settings-label">
              Year
              <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} min={2000} max={2100} />
            </label>
            <label className="settings-label">
              Planned ($)
              <input type="number" value={form.planned} onChange={e => setForm(f => ({ ...f, planned: e.target.value }))} min={0} step={500} />
            </label>
            <label className="settings-label">
              Actual ($)
              <input type="number" value={form.actual} onChange={e => setForm(f => ({ ...f, actual: e.target.value }))} min={0} step={500} />
            </label>
            <label className="settings-label">
              Note (optional)
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. maxed out Roth IRA" />
            </label>
          </div>
          <button className="btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleAdd}>
            Save Entry
          </button>
        </div>
      )}

      {/* Chart */}
      {logs.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name]} contentStyle={{ borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Planned" fill="#94a3b8" radius={[4,4,0,0]} />
              <Bar dataKey="Actual" radius={[4,4,0,0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.onTrack ? '#38a169' : '#e53e3e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Table */}
          <table className="holdings-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Year</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Difference</th>
                <th>Status</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(l => {
                const diff = l.actual - l.planned
                return (
                  <tr key={l.id}>
                    <td><strong>{l.year}</strong></td>
                    <td>{formatCurrency(l.planned)}</td>
                    <td>{formatCurrency(l.actual)}</td>
                    <td style={{ color: diff >= 0 ? 'var(--success)' : 'var(--error)' }}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                    </td>
                    <td>
                      <span className={`type-badge ${diff >= 0 ? 'roth' : 'traditional'}`}>
                        {diff >= 0 ? '✅ On Track' : '⚠️ Behind'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{l.note || '—'}</td>
                    <td><button className="btn-remove" onClick={() => removeLog(l.id)}>🗑</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {logs.length === 0 && !showForm && (
        <div className="holdings-empty">No contributions logged yet — add your first year above.</div>
      )}
    </div>
  )
}