import { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import type { ProjectionsResponse } from '../api/client'
import type { RetirementPlan } from '../types'

interface State {
  data:    ProjectionsResponse | null
  loading: boolean
  error:   string | null
}

// Debounce so we don't hammer the backend on every keypress
const DEBOUNCE_MS = 400

export function useProjections(plan: RetirementPlan) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setState(s => ({ ...s, loading: true, error: null }))
      try {
        const data = await api.projections(plan)
        setState({ data, loading: false, error: null })
      } catch (e) {
        setState({ data: null, loading: false, error: (e as Error).message })
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [JSON.stringify(plan)]) // re-fetch when plan changes

  return state
}