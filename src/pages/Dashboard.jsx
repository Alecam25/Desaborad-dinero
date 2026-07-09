import { useEffect, useState } from 'react'
import FixedExpensesCard from '../components/FixedExpensesCard'
import UpcomingPayments from '../components/UpcomingPayments'
import MonthlyHistory from '../components/MonthlyHistory'
import FinancialOverview from '../components/FinancialOverview'
import { supabase } from '../lib/supabaseClient'
import RegisterPayment from './RegisterPayment'
import DailyExpenses from './DailyExpenses'
import { formatCRC } from '../utils/financeCalculations'

export default function Dashboard({ session }) {
  const [latestCycle, setLatestCycle] = useState(null)
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [fixedExpenses, setFixedExpenses] = useState([])

  useEffect(() => {
    loadLatestCycle()
    loadFixedExpenses()
  }, [])

  useEffect(() => {
    if (latestCycle) {
      loadDailyExpenses()
    }
  }, [latestCycle])

  async function loadLatestCycle() {
    const { data, error } = await supabase
      .from('monthly_cycles')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error) {
      setLatestCycle(data)
    }
  }

  async function loadDailyExpenses() {
    if (!latestCycle) return

    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cycle_id', latestCycle.id)

    if (!error) {
      setDailyExpenses(data || [])
    }
  }

  async function loadFixedExpenses() {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('due_day', { ascending: true })

    if (!error) {
      setFixedExpenses(data || [])
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const totalSpent = dailyExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )

  const availableInitial = Number(latestCycle?.available_amount || 0)
  const availableNow = availableInitial - totalSpent

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Desaborad Dinero
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Bienvenido, {session?.user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Ingreso mensual</p>
            <h2 className="text-2xl font-bold mt-2">
              {formatCRC(latestCycle?.salary_crc || 0)}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Gastado diario</p>
            <h2 className="text-2xl font-bold mt-2">
              {formatCRC(totalSpent)}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Ahorro</p>
            <h2 className="text-2xl font-bold mt-2">
              {formatCRC(latestCycle?.saving_amount || 0)}
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">Disponible actual</p>
            <h2 className="text-2xl font-bold mt-2">
              {formatCRC(availableNow)}
            </h2>
          </div>
        </section>

        {latestCycle ? (
          <FinancialOverview
            totalSpent={totalSpent}
            availableInitial={availableInitial}
            availableNow={availableNow}
            dailyLimit={latestCycle.daily_limit}
          />
        ) : (
          <section className="mt-6 sm:mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
            <h2 className="text-xl font-bold mb-2">Estado financiero</h2>
            <p className="text-slate-400">
              Todavía no has creado un presupuesto. Registra tu primer pago para ver el resumen financiero.
            </p>
          </section>
        )}

        <RegisterPayment
          session={session}
          fixedExpenses={fixedExpenses}
          onCycleCreated={loadLatestCycle}
        />

        <DailyExpenses
          session={session}
          cycle={latestCycle}
          onExpenseCreated={loadDailyExpenses}
        />

        <FixedExpensesCard
          session={session}
          expenses={fixedExpenses}
          exchangeRate={latestCycle?.exchange_rate || 0}
          onChange={loadFixedExpenses}
        />

        <UpcomingPayments expenses={fixedExpenses} />

        <MonthlyHistory session={session} />
      </div>
    </div>
  )
}