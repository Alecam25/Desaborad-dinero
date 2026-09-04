export const CATEGORY_ICON_OPTIONS = [
  { value: 'utensils', label: 'Comida' },
  { value: 'fuel', label: 'Gasolina' },
  { value: 'dumbbell', label: 'Deportes' },
  { value: 'scissors', label: 'Barbero' },
  { value: 'package', label: 'Otros' },
]

export const BALANCING_CATEGORY_NAME = 'Otros'

export const DEFAULT_DAILY_EXPENSE_CATEGORIES = [
  {
    name: 'Comida',
    icon: 'utensils',
    defaultMonthlyLimit: 50000,
    description: 'Para la categoría donde más se repite el gasto.',
  },
  {
    name: 'Gasolina',
    icon: 'fuel',
    defaultMonthlyLimit: 50000,
    description: 'Combustible y movilidad habitual.',
    aliases: ['Transporte'],
  },
  {
    name: 'Deportes',
    icon: 'dumbbell',
    defaultMonthlyLimit: 20000,
    description: 'Referencia: de ₡3.000 a ₡6.000 por semana cuando aplique.',
  },
  {
    name: 'Barbero',
    icon: 'scissors',
    defaultMonthlyLimit: 7000,
    description: 'Cortes de pelo y cuidado personal.',
    aliases: ['Gustos'],
  },
  {
    name: 'Otros',
    icon: 'package',
    defaultMonthlyLimit: 25000,
    description: 'Gastos no contemplados e imprevistos menores.',
    aliases: ['Salud', 'Educación'],
  },
]

export function createDefaultDailyExpenseCategories() {
  const defaultCategories = DEFAULT_DAILY_EXPENSE_CATEGORIES.map((category) => ({
    ...category,
    aliases: [...(category.aliases || [])],
  }))

  return ensureBalancingCategory(defaultCategories)
}

export function getDailyExpenseCategoriesStorageKey(userId) {
  return `daily-expense-categories:${userId}`
}

function normalizeMonthlyLimit(value) {
  return Math.max(Number(value || 0), 0)
}

export function isBalancingCategoryName(categoryName) {
  return String(categoryName || '').toLowerCase() === BALANCING_CATEGORY_NAME.toLowerCase()
}

function getSupportedIcon(icon) {
  const isSupported = CATEGORY_ICON_OPTIONS.some(
    (option) => option.value === icon
  )

  return isSupported ? icon : 'package'
}

export function normalizeDailyExpenseCategories(categories) {
  const source = Array.isArray(categories) ? categories : []
  const normalizedCategories = source
    .map((category) => {
      const name = String(category?.name || '').trim()

      if (!name) return null

      return {
        name,
        icon: getSupportedIcon(category.icon),
        defaultMonthlyLimit: normalizeMonthlyLimit(
          category.defaultMonthlyLimit ?? category.monthlyLimit
        ),
        description:
          String(category.description || '').trim() || 'Categoría personalizada.',
        aliases: Array.isArray(category.aliases)
          ? category.aliases.map((alias) => String(alias).trim()).filter(Boolean)
          : [],
      }
    })
    .filter(Boolean)

  const uniqueCategories = []

  normalizedCategories.forEach((category) => {
    const alreadyExists = uniqueCategories.some(
      (savedCategory) =>
        savedCategory.name.toLowerCase() === category.name.toLowerCase()
    )

    if (!alreadyExists) {
      uniqueCategories.push(category)
    }
  })

  return uniqueCategories.length > 0
    ? ensureBalancingCategory(uniqueCategories)
    : createDefaultDailyExpenseCategories()
}

function ensureBalancingCategory(categories) {
  const hasBalancingCategory = categories.some((category) =>
    isBalancingCategoryName(category.name)
  )

  if (hasBalancingCategory) {
    return categories
  }

  const defaultBalancingCategory = DEFAULT_DAILY_EXPENSE_CATEGORIES.find(
    (category) => isBalancingCategoryName(category.name)
  )

  return [
    ...categories,
    {
      ...defaultBalancingCategory,
      aliases: [...(defaultBalancingCategory.aliases || [])],
    },
  ]
}

export function loadDailyExpenseCategories(userId) {
  if (typeof window === 'undefined' || !userId) {
    return createDefaultDailyExpenseCategories()
  }

  try {
    const storedCategories = window.localStorage.getItem(
      getDailyExpenseCategoriesStorageKey(userId)
    )

    if (!storedCategories) {
      return createDefaultDailyExpenseCategories()
    }

    return normalizeDailyExpenseCategories(JSON.parse(storedCategories))
  } catch {
    return createDefaultDailyExpenseCategories()
  }
}

export function saveDailyExpenseCategories(userId, categories) {
  if (typeof window === 'undefined' || !userId) return

  window.localStorage.setItem(
    getDailyExpenseCategoriesStorageKey(userId),
    JSON.stringify(normalizeDailyExpenseCategories(categories))
  )
}

export function getBudgetableCategoryAmount(availableAmount) {
  return Math.max(Number(availableAmount || 0), 0)
}

export function getCategoryBudgetsTotal(budgets) {
  return budgets.reduce(
    (total, budget) => total + Number(budget.monthlyLimit || 0),
    0
  )
}

function getNonBalancingCategoryTotal(categories) {
  return categories.reduce((total, category) => {
    if (isBalancingCategoryName(category.name)) return total

    return total + Number(category.defaultMonthlyLimit)
  }, 0)
}

export function balanceCategoryBudgetsToAvailable(budgets, availableAmount) {
  const hasAvailableAmount =
    availableAmount !== undefined && availableAmount !== null

  if (!hasAvailableAmount) {
    return budgets
  }

  const budgetableAmount = getBudgetableCategoryAmount(availableAmount)
  const nonBalancingTotal = budgets.reduce((total, budget) => {
    if (isBalancingCategoryName(budget.name)) return total

    return total + Number(budget.monthlyLimit || 0)
  }, 0)

  let balancedBudgets = budgets

  if (nonBalancingTotal > budgetableAmount) {
    const scale = budgetableAmount > 0 ? budgetableAmount / nonBalancingTotal : 0

    balancedBudgets = budgets.map((budget) => {
      if (isBalancingCategoryName(budget.name)) {
        return budget
      }

      return {
        ...budget,
        monthlyLimit: roundDownToClosedAmount(
          Number(budget.monthlyLimit || 0) * scale
        ),
      }
    })
  }

  const adjustedNonBalancingTotal = balancedBudgets.reduce((total, budget) => {
    if (isBalancingCategoryName(budget.name)) return total

    return total + Number(budget.monthlyLimit || 0)
  }, 0)

  return balancedBudgets.map((budget) => {
    if (!isBalancingCategoryName(budget.name)) {
      return budget
    }

    return {
      ...budget,
      monthlyLimit: Math.max(budgetableAmount - adjustedNonBalancingTotal, 0),
    }
  })
}

function roundDownToClosedAmount(amount) {
  if (amount <= 0) return 0

  return Math.floor(amount / 1000) * 1000
}

export function createDefaultCategoryBudgets(
  availableAmount,
  categories = createDefaultDailyExpenseCategories()
) {
  const hasAvailableAmount =
    availableAmount !== undefined && availableAmount !== null
  const normalizedCategories = normalizeDailyExpenseCategories(categories)
  const budgetableAmount = getBudgetableCategoryAmount(availableAmount)
  const desiredNonBalancingTotal =
    getNonBalancingCategoryTotal(normalizedCategories)

  if (hasAvailableAmount && budgetableAmount <= 0) {
    return normalizedCategories.map((category) => ({
      ...category,
      monthlyLimit: 0,
    }))
  }

  const shouldScaleToAvailable =
    hasAvailableAmount && desiredNonBalancingTotal > budgetableAmount
  const scale = shouldScaleToAvailable
    ? budgetableAmount / desiredNonBalancingTotal
    : 1

  const budgets = normalizedCategories.map((category) => {
    if (isBalancingCategoryName(category.name) && hasAvailableAmount) {
      return {
        ...category,
        monthlyLimit: 0,
      }
    }

    return {
      ...category,
      monthlyLimit: shouldScaleToAvailable
        ? roundDownToClosedAmount(category.defaultMonthlyLimit * scale)
        : category.defaultMonthlyLimit,
    }
  })

  if (!hasAvailableAmount) {
    return budgets
  }

  return balanceCategoryBudgetsToAvailable(budgets, availableAmount)
}

export function normalizeCategoryBudgets(
  savedBudgets,
  availableAmount,
  categories = createDefaultDailyExpenseCategories()
) {
  const defaultBudgets = createDefaultCategoryBudgets(
    availableAmount,
    categories
  )

  if (!Array.isArray(savedBudgets)) {
    return defaultBudgets
  }

  const budgets = defaultBudgets.map((defaultBudget) => {
    const savedBudget = savedBudgets.find(
      (budget) =>
        budget.name === defaultBudget.name ||
        (defaultBudget.aliases || []).includes(budget.name)
    )

    return {
      ...defaultBudget,
      monthlyLimit: normalizeMonthlyLimit(
        savedBudget?.monthlyLimit ?? defaultBudget.monthlyLimit
      ),
    }
  })

  return balanceCategoryBudgetsToAvailable(budgets, availableAmount)
}
