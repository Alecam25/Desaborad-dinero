import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCRC } from '../utils/financeCalculations'

export default function DailyExpenses({ session, cycle, onExpenseCreated }) {
  const [expenses, setExpenses] = useState([])
  const [category, setCategory] = useState('Comida')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('SINPE')
  const [expenseDate, setExpenseDate] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (cycle) {
      loadExpenses()
    }
  }, [cycle])

  async function loadExpenses() {
    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cycle_id', cycle.id)
      .order('expense_date', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setExpenses(data || [])
  }

  async function saveExpense(e) {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.from('daily_expenses').insert({
      user_id: session.user.id,
      cycle_id: cycle.id,
      expense_date: expenseDate,
      category,
      description,
      amount: Number(amount),
      payment_method: paymentMethod,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setAmount('')
    setDescription('')
    setMessage('Gasto guardado correctamente.')
    loadExpenses()
    onExpenseCreated?.()
  }

  async function deleteExpense(id) {
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Gasto eliminado correctamente.')
    loadExpenses()
    onExpenseCreated?.()
  }

  if (!cycle) {
    return null
  }

  const totalSpent = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )

  const remaining = Number(cycle?.available_amount || 0) - totalSpent

  return (
    <section className="mt-6 sm:mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Gastos diarios
      </h2>

      <p className="text-slate-400 mb-6 text-sm sm:text-base">
        Registra tus gastos para saber cuánto dinero te queda disponible.
      </p>

      <form
        onSubmit={saveExpense}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Fecha
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option>Comida</option>
            <option>Transporte</option>
            <option>Gustos</option>
            <option>Salud</option>
            <option>Educación</option>
            <option>Otros</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Descripción
          </label>
          <input
            type="text"
            placeholder="Ej: Almuerzo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Método
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
          >
            <option>SINPE</option>
            <option>Efectivo</option>
            <option>Tarjeta</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Monto
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        <button
          type="submit"
          className="sm:col-span-2 lg:col-span-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition"
        >
          Guardar gasto
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Gastado</p>
          <h3 className="text-xl font-bold">{formatCRC(totalSpent)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Disponible inicial</p>
          <h3 className="text-xl font-bold">
            {formatCRC(cycle.available_amount)}
          </h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-sm">Disponible actual</p>
          <h3 className="text-xl font-bold">{formatCRC(remaining)}</h3>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-emerald-400">
          {message}
        </p>
      )}

      <div className="mt-6">
        {/* Vista móvil */}
        <div className="space-y-3 md:hidden">
          {expenses.length === 0 && (
            <p className="text-slate-400 text-sm">
              Todavía no has registrado gastos.
            </p>
          )}

          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-slate-800 rounded-xl p-4 border border-slate-700"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold">{expense.category}</p>
                  <p className="text-sm text-slate-400">
                    {expense.expense_date}
                  </p>
                </div>

                <p className="font-bold">
                  {formatCRC(expense.amount)}
                </p>
              </div>

              <p className="text-sm text-slate-300 mt-3">
                {expense.description || 'Sin descripción'}
              </p>

              <div className="flex justify-between items-center mt-4">
                <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                  {expense.payment_method}
                </span>

                <button
                  type="button"
                  onClick={() => deleteExpense(expense.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Vista escritorio */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left py-3">Fecha</th>
                <th className="text-left py-3">Categoría</th>
                <th className="text-left py-3">Descripción</th>
                <th className="text-left py-3">Método</th>
                <th className="text-right py-3">Monto</th>
                <th className="text-right py-3">Acción</th>
              </tr>
            </thead>

            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="py-4 text-center text-slate-400"
                  >
                    Todavía no has registrado gastos.
                  </td>
                </tr>
              )}

              {expenses.map((expense) => (
                <tr key={expense.id} className="border-t border-slate-800">
                  <td className="py-3">{expense.expense_date}</td>
                  <td className="py-3">{expense.category}</td>
                  <td className="py-3">
                    {expense.description || 'Sin descripción'}
                  </td>
                  <td className="py-3">{expense.payment_method}</td>

                  <td className="py-3 text-right">
                    {formatCRC(expense.amount)}
                  </td>

                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}