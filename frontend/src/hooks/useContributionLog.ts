import { useState, useMemo } from 'react'
import type { ContributionLog } from '../types'

const STORAGE_KEY = 'contribution_log'

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function load(): ContributionLog[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return []
}

export function useContributionLog() {
  const [logs, setLogs] = useState<ContributionLog[]>(load)

  const save = (l: ContributionLog[]) => {
    setLogs(l)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(l))
  }

  const addLog = (entry: Omit<ContributionLog, 'id'>) =>
    save([...logs, { ...entry, id: uuid() }])

  const updateLog = (id: string, updates: Partial<Omit<ContributionLog, 'id'>>) =>
    save(logs.map(l => l.id === id ? { ...l, ...updates } : l))

  const removeLog = (id: string) => save(logs.filter(l => l.id !== id))

  const summary = useMemo(() => {
    const totalPlanned = logs.reduce((s, l) => s + l.planned, 0)
    const totalActual  = logs.reduce((s, l) => s + l.actual,  0)
    const avgActual    = logs.length ? totalActual / logs.length : 0
    const onTrackYears = logs.filter(l => l.actual >= l.planned).length
    return { totalPlanned, totalActual, avgActual, onTrackYears, totalYears: logs.length }
  }, [logs])

  return { logs, addLog, updateLog, removeLog, summary }
}