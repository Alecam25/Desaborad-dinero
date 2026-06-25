import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatCRC } from '../utils/financeCalculations'

export default function FixedExpensesCard({
  session,
  expenses,
  exchangeRate,
  onChange,
}) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    currency: 'CRC',
    due_day: '',
    category: '',
  })

  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  function resetForm() {
    setForm({
      name: '',
      amount: '',
      currency: 'CRC',
      due_day: '',
      category: '',
    })
    setEditingId(null)
  }

  async function saveExpense(e) {
    e.preventDefault()
    setMessage('')

    const payload = {
      user_id: session.user.id,
      name: form.name,
      amount: Number(form.amount),
      currency: form.currency,
      due_day: Number(form.due_day),
      category: form.category,
      is_active: true,
    }

    let error

    if (editingId) {
      const response = await supabase
        .from('fixed_expenses')
        .update(payload)
        .eq('id', editingId)

      error = response.error
    } else {
      const response = await supabase
        .from('fixed_expenses')
        .insert(payload)

      error = response.error
    }

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(editingId ? 'Gasto actualizado.' : 'Gasto agregado.')
    resetForm()
    onChange?.()
  }

  function editExpense(expense) {
    setEditingId(expense.id)
    setForm({
      name: expense.name,
      amount: expense.amount,
      currency: expense.currency,
      due_day: expense.due_day,
      category: expense.category || '',
    })
  }

  async function deleteExpense(id) {
    const { error } = await supabase
      .from('fixed_expenses')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Gasto eliminado.')
    onChange?.()
  }

  return (
    <section className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-2">Gastos fijos</h2>
      <p className="text-slate-400 mb-6">
        Agrega, edita o quita tus pagos mensuales.
      </p>

      <form
        onSubmit={saveExpense}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
      >
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nombre"
          className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          required
        />

        <input
          name="amount"
          type="number"
          value={form.amount}
          onChange={handleChange}
          placeholder="Monto"
          className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          required
        />

        <select
          name="currency"
          value={form.currency}
          onChange={handleChange}
          className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
        >
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>

        <input
          name="due_day"
          type="number"
          min="1"
          max="31"
          value={form.due_day}
          onChange={handleChange}
          placeholder="Día"
          className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          required
        />

        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Categoría"
          className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
        />

        <button
          type="submit"
          className="md:col-span-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl"
        >
          {editingId ? 'Guardar cambios' : 'Agregar gasto fijo'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="md:col-span-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 rounded-xl"
          >
            Cancelar edición
          </button>
        )}
      </form>

      {message && (
        <p className="mb-4 text-sm text-emerald-400">{message}</p>
      )}

      <div className="space-y-3">
        {expenses.map((expense) => {
          const amountCRC =
            expense.currency === 'USD'
              ? Number(expense.amount) * Number(exchangeRate)
              : Number(expense.amount)

          return (
            <div
              key={expense.id}
              className="bg-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
            >
              <div>
                <p className="font-semibold">{expense.name}</p>
                <p className="text-sm text-slate-400">
                  Día {expense.due_day} · {expense.category}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <p className="font-bold">
                  {expense.currency === 'USD'
                    ? `$${expense.amount} / ${formatCRC(amountCRC)}`
                    : formatCRC(amountCRC)}
                </p>

                <button
                  onClick={() => editExpense(expense)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Editar
                </button>

                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Quitar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}