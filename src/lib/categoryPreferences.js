import { supabase } from './supabaseClient'
import {
  createDefaultDailyExpenseCategories,
  createDefaultCategoryBudgets,
  getDailyExpenseCategoriesStorageKey,
  loadDailyExpenseCategories,
  normalizeDailyExpenseCategories,
  normalizeCategoryBudgets,
  saveDailyExpenseCategories,
} from '../utils/categoryBudgets'

const METADATA_KEY = 'daily_expense_categories'
const BUDGET_METADATA_KEY = 'daily_expense_cycle_budgets'
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

export function getBudgetStorageKey(userId, cycleId) {
  return `daily-expense-category-budgets-v6:${userId}:${cycleId}`
}

function cacheBudgets(userId, cycleId, budgets) {
  try {
    window.localStorage.setItem(getBudgetStorageKey(userId, cycleId), JSON.stringify(budgets))
  } catch {
    // Saving to the account does not require a browser cache.
  }
}

export function saveAccountBudgets(userId, cycleId, budgets) {
  const limits = budgets.map(({ name, monthlyLimit }) => ({ name, monthlyLimit }))
  const operation = saveQueue.catch(() => {}).then(async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    if (data.user?.id !== userId) throw new Error('La cuenta activa ha cambiado.')

    const savedCycles = data.user.user_metadata?.[BUDGET_METADATA_KEY] || {}
    const { error: saveError } = await supabase.auth.updateUser({
      data: { [BUDGET_METADATA_KEY]: { ...savedCycles, [cycleId]: limits } },
    })
    if (saveError) throw saveError
    cacheBudgets(userId, cycleId, limits)
    return limits
  })
  saveQueue = operation
  return operation
}

export async function loadAccountBudgets(userId, cycleId, availableAmount, categories) {
  await saveQueue.catch(() => {})
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (data.user?.id !== userId) throw new Error('La cuenta activa ha cambiado.')

  const saved = data.user.user_metadata?.[BUDGET_METADATA_KEY]?.[cycleId]
  if (Array.isArray(saved)) {
    const budgets = normalizeCategoryBudgets(saved, availableAmount, categories)
    cacheBudgets(userId, cycleId, budgets)
    return budgets
  }

  const defaults = createDefaultCategoryBudgets(availableAmount, categories)
  let local
  try {
    local = JSON.parse(window.localStorage.getItem(getBudgetStorageKey(userId, cycleId)))
  } catch {
    return defaults
  }
  if (!Array.isArray(local)) return defaults

  const budgets = normalizeCategoryBudgets(local, availableAmount, categories)
  const hasCustomLimits = budgets.some((budget, index) =>
    budget.monthlyLimit !== defaults[index].monthlyLimit
  )
  if (hasCustomLimits) await saveAccountBudgets(userId, cycleId, budgets)
  return budgets
}
