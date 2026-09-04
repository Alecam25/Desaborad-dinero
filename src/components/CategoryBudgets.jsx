import {
  Dumbbell,
  Fuel,
  Package,
  RotateCcw,
  Scissors,
  Settings,
  Utensils,
} from 'lucide-react'
import { formatCRC, formatCRCWithDecimals } from '../utils/financeCalculations'
import { isBalancingCategoryName } from '../utils/categoryBudgets'

const categoryIcons = {
  dumbbell: Dumbbell,
  fuel: Fuel,
  package: Package,
  scissors: Scissors,
  utensils: Utensils,
}

function getSpentForBudget(expenses, budget) {
  return expenses
    .filter((expense) =>
      [budget.name, ...(budget.aliases || [])].includes(expense.category)
    )
    .reduce((total, expense) => total + Number(expense.amount), 0)
}

function getBudgetStatus(spent, limit) {
  if (limit <= 0 && spent > 0) {
    return {
      label: 'Sin límite asignado',
      textColor: 'text-red-400',
      barColor: 'bg-red-500',
      borderColor: 'border-red-500/30',
    }
  }

  const percentage = limit > 0 ? (spent / limit) * 100 : 0

  if (percentage >= 100) {
    return {
      label: 'Límite superado',
      textColor: 'text-red-400',
      barColor: 'bg-red-500',
      borderColor: 'border-red-500/30',
    }
  }

  if (percentage >= 85) {
    return {
      label: 'Cerca del límite',
      textColor: 'text-yellow-400',
      barColor: 'bg-yellow-400',
      borderColor: 'border-yellow-500/30',
    }
  }

  return {
    label: 'En control',
    textColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    borderColor: 'border-slate-700',
  }
}

export default function CategoryBudgets({
  availableAmount,
  budgetAlert,
  budgets,
  expenses,
  onManageCategories,
  onBudgetLimitChange,
  onRedistribute,
}) {
  const totalAssigned = budgets.reduce(
    (total, budget) => total + Number(budget.monthlyLimit || 0),
    0
  )

  return (
    <div className="mb-6 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold">
            Límites mensuales por categoría
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Disponible inicial: {formatCRCWithDecimals(availableAmount)}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            La suma de categorías debe ser igual al disponible inicial.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-w-[150px]">
            <p className="text-slate-400 text-xs">Disponible inicial</p>
            <p className="font-bold">
              {formatCRCWithDecimals(availableAmount)}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-w-[150px]">
            <p className="text-slate-400 text-xs">Total categorías</p>
            <p className="font-bold">{formatCRCWithDecimals(totalAssigned)}</p>
          </div>

          <button
            type="button"
            onClick={onManageCategories}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-xl font-semibold"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Categorías
          </button>

          <button
            type="button"
            onClick={onRedistribute}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-xl font-semibold"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Restaurar montos
          </button>
        </div>
      </div>

      {budgetAlert && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {budgetAlert}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {budgets.map((budget) => {
          const spent = getSpentForBudget(expenses, budget)
          const limit = Number(budget.monthlyLimit || 0)
          const percentage = limit > 0 ? (spent / limit) * 100 : 0
          const safePercentage = Math.min(Math.max(percentage, 0), 100)
          const remaining = limit - spent
          const status = getBudgetStatus(spent, limit)
          const CategoryIcon = categoryIcons[budget.icon] || Package
          const isAutomaticBudget = isBalancingCategoryName(budget.name)

          return (
            <article
              key={budget.name}
              className={`bg-slate-900 border ${status.borderColor} rounded-xl p-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                    <CategoryIcon className="h-5 w-5 text-slate-100" aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    <h4 className="font-bold truncate">{budget.name}</h4>
                    <p className={`text-sm font-semibold ${status.textColor}`}>
                      {status.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {budget.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold">
                    {formatCRC(spent)}
                  </p>
                  <p className="text-sm text-slate-400">
                    de {formatCRC(limit)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">
                    {remaining >= 0 ? 'Disponible' : 'Excedido'}
                  </span>
                  <span className="font-semibold">
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                  <div
                    className={`h-full ${status.barColor} transition-all duration-500`}
                    style={{ width: `${safePercentage}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">
                      {isAutomaticBudget ? 'Límite automático' : 'Límite mensual'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={limit}
                      disabled={isAutomaticBudget}
                      onChange={(event) =>
                        onBudgetLimitChange(budget.name, event.target.value)
                      }
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>

                  <p
                    className={`text-sm sm:text-right ${
                      remaining < 0 ? 'text-red-400' : 'text-slate-300'
                    }`}
                  >
                    {formatCRC(Math.abs(remaining))}
                  </p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
