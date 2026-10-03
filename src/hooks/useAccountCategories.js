import { useEffect, useRef, useState } from 'react'
import { loadAccountCategories, saveAccountCategories } from '../lib/categoryPreferences'
import { loadDailyExpenseCategories } from '../utils/categoryBudgets'

export default function useAccountCategories(userId) {
  const [categories, setCategories] = useState(() => loadDailyExpenseCategories(userId))
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const revision = useRef(0)
  const pending = useRef(0)

  useEffect(() => {
    let active = true
    let loading = false

    async function refresh() {
      if (loading || pending.current > 0) return
      loading = true
      const currentRevision = revision.current
      try {
        const loaded = await loadAccountCategories(userId)
        if (active && currentRevision === revision.current) {
          setCategories(loaded)
          setReady(true)
          setError('')
        }
      } catch {
        if (active) setError('No se pudieron sincronizar las categor\u00edas. Revisa tu conexi\u00f3n y vuelve a abrir esta pantalla.')
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
  }, [userId])

  async function saveCategories(nextCategories) {
    if (!ready) return false
    const currentRevision = ++revision.current
    pending.current += 1
    setCategories(nextCategories)
    setError('')
    try {
      await saveAccountCategories(userId, nextCategories)
      return currentRevision === revision.current
    } catch {
      if (currentRevision === revision.current) {
        setError('No se guardaron los cambios en tu cuenta. Revisa tu conexi\u00f3n y vuelve a intentarlo.')
      }
      return false
    } finally {
      pending.current -= 1
    }
  }

  return { categories, ready, error, saveCategories }
}
