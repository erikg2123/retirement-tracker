import { useState, useMemo } from 'react'
import type { Holding, AccountType } from '../types'

const STORAGE_KEY = 'retirement_holdings'

function loadHoldings(): Holding[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings)

  const save = (h: Holding[]) => {
    setHoldings(h)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
  }

  const addHolding = (h: Omit<Holding, 'id'>) => {
    save([...holdings, { ...h, id: uuid() }])
  }

  const updateHolding = (id: string, updates: Partial<Omit<Holding, 'id'>>) => {
    save(holdings.map(h => h.id === id ? { ...h, ...updates } : h))
  }

  const removeHolding = (id: string) => {
    save(holdings.filter(h => h.id !== id))
  }

  const summary = useMemo(() => {
    const rothTotal        = holdings.filter(h => h.accountType === 'roth').reduce((s, h) => s + h.shares * h.pricePerShare, 0)
    const traditionalTotal = holdings.filter(h => h.accountType === 'traditional').reduce((s, h) => s + h.shares * h.pricePerShare, 0)
    const total            = rothTotal + traditionalTotal
    const rothPct          = total === 0 ? 100 : Math.round((rothTotal / total) * 100)
    const traditionalPct   = total === 0 ? 0   : 100 - rothPct

    // Group by account name
    const byAccount: Record<string, { accountType: AccountType; total: number; holdings: Holding[] }> = {}
    for (const h of holdings) {
      if (!byAccount[h.accountName]) {
        byAccount[h.accountName] = { accountType: h.accountType, total: 0, holdings: [] }
      }
      byAccount[h.accountName].total    += h.shares * h.pricePerShare
      byAccount[h.accountName].holdings.push(h)
    }

    return { rothTotal, traditionalTotal, total, rothPct, traditionalPct, byAccount }
  }, [holdings])

  return { holdings, addHolding, updateHolding, removeHolding, summary }
}