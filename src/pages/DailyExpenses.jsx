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
    if (cycle) loadExpenses()
  }, [cycle])
    async function deleteExpense(id) {
      const { error } = await supabase
        .from('daily_expenses')
        .delete()
        .eq('id', id)

      if (!error) {
        loadExpenses()
        onExpenseCreated?.()
      }
}
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
    onExpenseCreated()  
  }
  
  async function deleteExpense(id) {
  const { error } = await supabase
    .from('daily_expenses')
    .delete()
    .eq('id', id)

  if (!error) {
    loadExpenses()
    onExpenseCreated?.()
  }
}

  const totalSpent = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )

  const remaining = Number(cycle?.available_amount || 0) - totalSpent

  if (!cycle) {
    return null
  }

  return (
    <section className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-2">Gastos diarios</h2>
      <p className="text-slate-400 mb-6">
        Registra tus gastos para saber cuánto dinero te queda disponible.
      </p>

      <form onSubmit={saveExpense} className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">Fecha</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
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
          <label className="block text-sm text-slate-300 mb-2">Descripción</label>
          <input
            type="text"
            placeholder="Ej: Almuerzo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Método</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
          >
            <option>SINPE</option>
            <option>Efectivo</option>
            <option>Tarjeta</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">Monto</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3"
            required
          />
        </div>

        <button
          type="submit"
          className="md:col-span-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl"
        >
          Guardar gasto
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Gastado</p>
          <h3 className="text-xl font-bold">{formatCRC(totalSpent)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Disponible inicial</p>
          <h3 className="text-xl font-bold">{formatCRC(cycle.available_amount)}</h3>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Disponible actual</p>
          <h3 className="text-xl font-bold">{formatCRC(remaining)}</h3>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}

      <div className="mt-6 overflow-x-auto">
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
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-t border-slate-800">
              <td className="py-3">{expense.expense_date}</td>
              <td className="py-3">{expense.category}</td>
              <td className="py-3">{expense.description}</td>
              <td className="py-3">{expense.payment_method}</td>

              <td className="py-3 text-right">
                {formatCRC(expense.amount)}
              </td>

              <td className="py-3 text-right">
                <button
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
    </section>
  )
}