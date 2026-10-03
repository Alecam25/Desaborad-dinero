import { supabase } from './supabaseClient'
import {
  createDefaultDailyExpenseCategories,
  getDailyExpenseCategoriesStorageKey,
  loadDailyExpenseCategories,
  normalizeDailyExpenseCategories,
  saveDailyExpenseCategories,
} from '../utils/categoryBudgets'

const METADATA_KEY = 'daily_expense_categories'
let saveQueue = Promise.resolve()

function cacheCategories(userId, categories) {
  try {
    saveDailyExpenseCategories(userId, categories)
  } catch {
    // The account remains the source of truth when browser storage is unavailable.
  }
}

export function saveAccountCategories(userId, categories) {
  const normalized = normalizeDailyExpenseCategories(categories)
  const operation = saveQueue.catch(() => {}).then(async () => {
    const { data: current, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (current.user?.id !== userId) throw new Error('La cuenta activa ha cambiado.')

    const { error } = await supabase.auth.updateUser({
      data: { [METADATA_KEY]: normalized },
    })
    if (error) throw error
    cacheCategories(userId, normalized)
    return normalized
  })
  saveQueue = operation
  return operation
}

export async function loadAccountCategories(userId) {
  await saveQueue.catch(() => {})
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (data.user?.id !== userId) throw new Error('La cuenta activa ha cambiado.')

  const stored = data.user.user_metadata?.[METADATA_KEY]
  if (Array.isArray(stored) && stored.length > 0) {
    const categories = normalizeDailyExpenseCategories(stored)
    cacheCategories(userId, categories)
    return categories
  }

  const categories = loadDailyExpenseCategories(userId)
  let hasLocalCategories = false
  try {
    hasLocalCategories = Boolean(
      window.localStorage.getItem(getDailyExpenseCategoriesStorageKey(userId))
    )
  } catch {
    // Do not upload defaults from a device that has no existing categories.
  }

  const hasCustomCategories = JSON.stringify(categories) !== JSON.stringify(
    normalizeDailyExpenseCategories(createDefaultDailyExpenseCategories())
  )

  return hasLocalCategories && hasCustomCategories
    ? saveAccountCategories(userId, categories)
    : categories
}
