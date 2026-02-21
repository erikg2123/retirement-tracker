import { useState } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { useRetirementCalc } from '../hooks/useRetirementCalc'
import { formatCurrency } from '../utils/retirementMath'
import type { AccountType } from '../types'

const ACCOUNT_PRESETS = ['Roth IRA', 'Roth 401k', 'Traditional 401k', 'Traditional IRA', 'Brokerage']

const EMPTY_FORM = {
  ticker: '',
  shares: '',
  pricePerShare: '',
  accountType: 'roth' as AccountType,
  accountName: 'Roth IRA',
}

export function HoldingsTracker() {
  const { holdings, addHolding, updateHolding, removeHolding, summary } = useHoldings()
  const { updatePlan } = useRetirementCalc()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  // Sync holdings total + rothPct back into the retirement plan
  const syncPlan = (rothPct: number, total: number) => {
    updatePlan({ rothPct, currentSavings: Math.round(total) })
  }

  const handleAdd = () => {
    const shares = parseFloat(form.shares)
    const price  = parseFloat(form.pricePerShare)
    if (!form.ticker || isNaN(shares) || isNaN(price) || shares <= 0 || price <= 0) return

    addHolding({
      ticker:       form.ticker.toUpperCase(),
      shares,
      pricePerShare: price,
      accountType:  form.accountType,
      accountName:  form.accountName,
    })

    // After adding, re-compute from updated holdings
    const newRothTotal = summary.rothTotal + (form.accountType === 'roth' ? shares * price : 0)
    const newTraditTotal = summary.traditionalTotal + (form.accountType === 'traditional' ? shares * price : 0)
    const newTotal = newRothTotal + newTraditTotal
    const newRothPct = newTotal === 0 ? 100 : Math.round((newRothTotal / newTotal) * 100)
    syncPlan(newRothPct, newTotal)

    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleRemove = (id: string) => {
    removeHolding(id)
    // Recompute after removal — holdings state updates async so we calculate from filtered
    const remaining = holdings.filter(h => h.id !== id)
    const roth = remaining.filter(h => h.accountType === 'roth').reduce((s, h) => s + h.shares * h.pricePerShare, 0)
    const trad = remaining.filter(h => h.accountType === 'traditional').reduce((s, h) => s + h.shares * h.pricePerShare, 0)
    const total = roth + trad
    syncPlan(total === 0 ? 100 : Math.round((roth / total) * 100), total)
  }

  const startEdit = (h: typeof holdings[0]) => {
    setEditingId(h.id)
    setEditForm({ ticker: h.ticker, shares: String(h.shares), pricePerShare: String(h.pricePerShare), accountType: h.accountType, accountName: h.accountName })
  }

  const saveEdit = (id: string) => {
    const shares = parseFloat(editForm.shares)
    const price  = parseFloat(editForm.pricePerShare)
    if (isNaN(shares) || isNaN(price)) return
    updateHolding(id, { ticker: editForm.ticker.toUpperCase(), shares, pricePerShare: price, accountType: editForm.accountType, accountName: editForm.accountName })
    setEditingId(null)
    // Recompute
    const updated = holdings.map(h => h.id === id ? { ...h, shares, pricePerShare: price, accountType: editForm.accountType } : h)
    const roth = updated.filter(h => h.accountType === 'roth').reduce((s, h) => s + h.shares * h.pricePerShare, 0)
    const trad = updated.filter(h => h.accountType === 'traditional').reduce((s, h) => s + h.shares * h.pricePerShare, 0)
    const total = roth + trad
    syncPlan(total === 0 ? 100 : Math.round((roth / total) * 100), total)
  }

  return (
    <div className="chart-card">
      <div className="holdings-header">
        <div>
          <h3>📦 Holdings</h3>
          <p className="chart-sub">Your stocks & ETFs across all retirement accounts</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add Holding'}
        </button>
      </div>

      {/* Summary Bar */}
      <div className="holdings-summary">
        <div className="holdings-total">
          <span className="stat-label">Total Balance</span>
          <span className="stat-value">{formatCurrency(summary.total)}</span>
        </div>
        <div className="holdings-split">
          <div className="split-bar">
            <div
              className="split-fill roth"
              style={{ width: `${summary.rothPct}%` }}
              title={`Roth: ${formatCurrency(summary.rothTotal)}`}
            />
            <div
              className="split-fill traditional"
              style={{ width: `${summary.traditionalPct}%` }}
              title={`Traditional: ${formatCurrency(summary.traditionalTotal)}`}
            />
          </div>
          <div className="split-labels">
            <span className="split-label roth-label">
              🟢 Roth {summary.rothPct}% — {formatCurrency(summary.rothTotal)}
            </span>
            <span className="split-label trad-label">
              🔴 Traditional {summary.traditionalPct}% — {formatCurrency(summary.traditionalTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="holding-form">
          <div className="holding-form-grid">
            <label className="settings-label">
              Ticker
              <input
                placeholder="e.g. VTI"
                value={form.ticker}
                onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
              />
            </label>
            <label className="settings-label">
              Shares
              <input
                type="number"
                placeholder="e.g. 10.5"
                value={form.shares}
                onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
                min={0}
                step={0.01}
              />
            </label>
            <label className="settings-label">
              Price Per Share ($)
              <input
                type="number"
                placeholder="e.g. 245.00"
                value={form.pricePerShare}
                onChange={e => setForm(f => ({ ...f, pricePerShare: e.target.value }))}
                min={0}
                step={0.01}
              />
            </label>
            <label className="settings-label">
              Account Name
              <select
                value={form.accountName}
                onChange={e => {
                  const name = e.target.value
                  const type: AccountType = name.toLowerCase().includes('roth') ? 'roth' : 'traditional'
                  setForm(f => ({ ...f, accountName: name, accountType: type }))
                }}
                className="select-input"
              >
                {ACCOUNT_PRESETS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="settings-label">
              Account Type
              <div className="mode-toggle" style={{ marginTop: '0.1rem' }}>
                <button
                  className={`mode-btn ${form.accountType === 'roth' ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, accountType: 'roth' }))}
                  type="button"
                >
                  🟢 Roth
                </button>
                <button
                  className={`mode-btn ${form.accountType === 'traditional' ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, accountType: 'traditional' }))}
                  type="button"
                >
                  🔴 Traditional
                </button>
              </div>
            </label>
          </div>
          {form.ticker && form.shares && form.pricePerShare && (
            <div className="holding-preview">
              Value: <strong>{formatCurrency(parseFloat(form.shares) * parseFloat(form.pricePerShare) || 0)}</strong>
              {' '}in <strong>{form.accountName}</strong>
            </div>
          )}
          <button className="btn-primary" style={{ marginTop: '0.75rem' }} onClick={handleAdd}>
            Add Holding
          </button>
        </div>
      )}

      {/* Holdings Table */}
      {holdings.length > 0 ? (
        <div className="holdings-table-wrap">
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Value</th>
                <th>Account</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(h => {
                const value = h.shares * h.pricePerShare
                const isEditing = editingId === h.id
                return (
                  <tr key={h.id}>
                    {isEditing ? (
                      <>
                        <td><input className="table-input" value={editForm.ticker} onChange={e => setEditForm(f => ({ ...f, ticker: e.target.value }))} /></td>
                        <td><input className="table-input" type="number" value={editForm.shares} onChange={e => setEditForm(f => ({ ...f, shares: e.target.value }))} /></td>
                        <td><input className="table-input" type="number" value={editForm.pricePerShare} onChange={e => setEditForm(f => ({ ...f, pricePerShare: e.target.value }))} /></td>
                        <td>{formatCurrency(parseFloat(editForm.shares) * parseFloat(editForm.pricePerShare) || 0)}</td>
                        <td>
                          <select className="select-input" value={editForm.accountName} onChange={e => {
                            const name = e.target.value
                            const type: AccountType = name.toLowerCase().includes('roth') ? 'roth' : 'traditional'
                            setEditForm(f => ({ ...f, accountName: name, accountType: type }))
                          }}>
                            {ACCOUNT_PRESETS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="mode-toggle">
                            <button className={`mode-btn small ${editForm.accountType === 'roth' ? 'active' : ''}`} onClick={() => setEditForm(f => ({ ...f, accountType: 'roth' }))} type="button">Roth</button>
                            <button className={`mode-btn small ${editForm.accountType === 'traditional' ? 'active' : ''}`} onClick={() => setEditForm(f => ({ ...f, accountType: 'traditional' }))} type="button">Trad</button>
                          </div>
                        </td>
                        <td className="table-actions">
                          <button className="btn-save" onClick={() => saveEdit(h.id)}>✅</button>
                          <button className="btn-cancel" onClick={() => setEditingId(null)}>✕</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="ticker-cell">{h.ticker}</td>
                        <td>{h.shares.toLocaleString()}</td>
                        <td>${h.pricePerShare.toLocaleString()}</td>
                        <td><strong>{formatCurrency(value)}</strong></td>
                        <td>{h.accountName}</td>
                        <td>
                          <span className={`type-badge ${h.accountType}`}>
                            {h.accountType === 'roth' ? '🟢 Roth' : '🔴 Trad'}
                          </span>
                        </td>
                        <td className="table-actions">
                          <button className="btn-edit" onClick={() => startEdit(h)}>✏️</button>
                          <button className="btn-remove" onClick={() => handleRemove(h.id)}>🗑</button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="holdings-empty">No holdings yet — add your first position above.</div>
      )}
    </div>
  )
}