/// <reference types="vite/client" />

import type { RetirementPlan, YearlyProjection, DrawdownYear, Milestone } from '../types'

const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api'

export interface ProjectionsResponse {
  projections:      YearlyProjection[]
  nestEggNeeded:    number
  projectedNestEgg: number
  drawdown:         DrawdownYear[]
  milestones:       Milestone[]
}

export interface SolveRequest {
  plan:        RetirementPlan
  target:      'endBalance' | 'retireEarlier' | 'monthlySpend'
  targetValue: number
  lever:       'withdrawalRate' | 'annualContribution' | 'retirementAge' | 'monthlySpending'
}

export interface SolveResponse {
  success:          boolean
  lever:            string
  originalValue:    number
  solvedValue:      number
  description:      string
  solvedPlan:       RetirementPlan
  projections:      import('../types').YearlyProjection[]
  nestEggNeeded:    number
  projectedNestEgg: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  projections: (plan: RetirementPlan) =>
    post<ProjectionsResponse>('/projections', plan),

  solve: (req: SolveRequest) =>
    post<SolveResponse>('/solve', req),
}