import { useEffect, useRef, useState } from 'react'
import { loadAccountBudgets, saveAccountBudgets } from '../lib/categoryPreferences'
import { createDefaultCategoryBudgets } from '../utils/categoryBudgets'

export default function useAccountBudgets(userId, cycleId, availableAmount, categories, categoriesReady) {
  const [state, setState] = useState({ budgets: [], key: '', error: '' })
  const revision = useRef(0)
  const pending = useRef(0)
  const key = `${userId}:${cycleId}`

  useEffect(() => {
    if (!cycleId || !categoriesReady) return
    let active = true
    let loading = false
    async function refresh() {
      if (loading || pending.current > 0) return
      loading = true
      const version = revision.current
      try {
        const budgets = await loadAccountBudgets(userId, cycleId, availableAmount, categories)
        if (active && version === revision.current) setState({ budgets, key, error: '' })
      } catch {
        if (active) setState((current) => ({
          ...current,
          error: 'No se pudieron sincronizar los montos. Revisa tu conexi\u00f3n y vuelve a abrir esta pantalla.',
        }))
      } finally {
        loading = false
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') refresh()
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [userId, cycleId, availableAmount, categories, categoriesReady, key])

  const ready = categoriesReady && state.key === key
  async function saveBudgets(budgets) {
    if (!ready) return
    const version = ++revision.current
    pending.current += 1
    setState({ budgets, key, error: '' })
    try {
      await saveAccountBudgets(userId, cycleId, budgets)
    } catch {
      if (version === revision.current) setState((current) => ({
        ...current,
        error: 'No se guardaron los montos en tu cuenta. Revisa tu conexi\u00f3n y vuelve a intentarlo.',
      }))
    } finally {
      pending.current -= 1
    }
  }

  return {
    budgets: ready ? state.budgets : createDefaultCategoryBudgets(availableAmount, categories),
    ready,
    error: state.error,
    saveBudgets,
  }
}
