import { ArrowLeft, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CATEGORY_ICON_OPTIONS,
  createDefaultDailyExpenseCategories,
  isBalancingCategoryName,
  loadDailyExpenseCategories,
  saveDailyExpenseCategories,
} from '../utils/categoryBudgets'
import { supabase } from '../lib/supabaseClient'
import { formatCRC, formatCRCWithDecimals } from '../utils/financeCalculations'

export default function CategoriesPage({ session, onBack }) {
  const [categories, setCategories] = useState(() =>
    loadDailyExpenseCategories(session.user.id)
  )
  const [availableInitial, setAvailableInitial] = useState(0)
  const [form, setForm] = useState({
    name: '',
    defaultMonthlyLimit: '',
    description: '',
    icon: 'package',
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  useEffect(() => {
    let ignore = false

    async function loadLatestCycle() {
      const { data, error } = await supabase
        .from('monthly_cycles')
        .select('available_amount')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!ignore && !error) {
        setAvailableInitial(Number(data?.available_amount || 0))
      }
    }

    loadLatestCycle()

    return () => {
      ignore = true
    }
  }, [session.user.id])

  function persistCategories(nextCategories, nextMessage) {
    setCategories(nextCategories)
    saveDailyExpenseCategories(session.user.id, nextCategories)
    setMessageType('success')
    setMessage(nextMessage)
  }

  function showError(errorMessage) {
    setMessageType('error')
    setMessage(errorMessage)
  }

  function getControlledCategoriesTotal(nextCategories) {
    return nextCategories.reduce((total, category) => {
      if (isBalancingCategoryName(category.name)) return total

      return total + Number(category.defaultMonthlyLimit || 0)
    }, 0)
  }

  function exceedsAvailableInitial(nextCategories) {
    if (availableInitial <= 0) return false

    return getControlledCategoriesTotal(nextCategories) > availableInitial
  }

  function handleFormChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })
  }

  function addCategory(event) {
    event.preventDefault()

    const name = form.name.trim()
    const monthlyLimit = Number(form.defaultMonthlyLimit || 0)
    const alreadyExists = categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase()
    )

    if (!name) {
      showError('Ingresa un nombre para la categoría.')
      return
    }

    if (alreadyExists) {
      showError('Ya existe una categoría con ese nombre.')
      return
    }

    const nextCategories = [
      ...categories,
      {
        name,
        icon: form.icon,
        defaultMonthlyLimit: monthlyLimit,
        description:
          form.description.trim() || 'Categoría personalizada.',
        aliases: [],
      },
    ]

    if (exceedsAvailableInitial(nextCategories)) {
      showError(
        `No se puede agregar ${name} con ${formatCRC(monthlyLimit)} porque la suma se pasa del disponible inicial.`
      )
      return
    }

    persistCategories(
      nextCategories,
      'Categoría agregada.'
    )

    setForm({
      name: '',
      defaultMonthlyLimit: '',
      description: '',
      icon: 'package',
    })
  }

  function updateCategory(categoryName, field, value) {
    if (field === 'defaultMonthlyLimit' && isBalancingCategoryName(categoryName)) {
      showError('Otros se ajusta automáticamente con el monto restante.')
      return
    }

    const nextCategories = categories.map((category) =>
      category.name === categoryName
        ? {
            ...category,
            [field]:
              field === 'defaultMonthlyLimit'
                ? Math.max(Number(value || 0), 0)
                : value,
          }
        : category
    )

    if (field === 'defaultMonthlyLimit' && exceedsAvailableInitial(nextCategories)) {
      showError(
        `No se puede asignar ${formatCRC(value)} a ${categoryName} porque la suma se pasa del disponible inicial.`
      )
      return
    }

    persistCategories(nextCategories, 'Categoría actualizada.')
  }

  function deleteCategory(categoryName) {
    if (isBalancingCategoryName(categoryName)) {
      showError('Otros no se puede eliminar porque completa el presupuesto.')
      return
    }

    if (categories.length <= 1) {
      showError('Debe quedar al menos una categoría.')
      return
    }

    persistCategories(
      categories.filter((category) => category.name !== categoryName),
      'Categoría eliminada.'
    )
  }

  function restoreDefaultCategories() {
    persistCategories(
      createDefaultDailyExpenseCategories(),
      'Categorías restauradas.'
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Categorías de gastos
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Administra los grupos y límites base de tus gastos diarios.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al dashboard
          </button>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Crear categoría
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                Disponible inicial del último pago: {formatCRCWithDecimals(availableInitial)}.
              </p>
            </div>

            <button
              type="button"
              onClick={restoreDefaultCategories}
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-xl font-semibold"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restaurar categorías
            </button>
          </div>

          <form
            onSubmit={addCategory}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Nombre
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Ej: Parqueo"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Límite mensual
              </label>
              <input
                name="defaultMonthlyLimit"
                type="number"
                min="0"
                step="1000"
                value={form.defaultMonthlyLimit}
                onChange={handleFormChange}
                placeholder="Ej: 10000"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Icono
              </label>
              <select
                name="icon"
                value={form.icon}
                onChange={handleFormChange}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
              >
                {CATEGORY_ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Descripción
              </label>
              <input
                name="description"
                type="text"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Opcional"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="sm:col-span-2 lg:col-span-4 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar categoría
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 text-sm ${
                messageType === 'error' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {message}
            </p>
          )}
        </section>

        <section className="mt-6 sm:mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            Categorías actuales
          </h2>

          <div className="space-y-4">
            {categories.map((category) => {
              const isAutomaticCategory = isBalancingCategoryName(category.name)

              return (
                <article
                  key={category.name}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_1fr_auto] gap-4 lg:items-end">
                    <div>
                      <p className="font-bold">{category.name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {isAutomaticCategory
                          ? 'Automático'
                          : formatCRC(category.defaultMonthlyLimit)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        {isAutomaticCategory ? 'Límite automático' : 'Límite base'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={category.defaultMonthlyLimit}
                        disabled={isAutomaticCategory}
                        onChange={(event) =>
                          updateCategory(
                            category.name,
                            'defaultMonthlyLimit',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={category.description}
                        onChange={(event) =>
                          updateCategory(
                            category.name,
                            'description',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isAutomaticCategory}
                      onClick={() => deleteCategory(category.name)}
                      className="inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
