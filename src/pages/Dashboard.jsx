import { useCallback, useEffect, useState } from 'react'
import UpcomingPayments from '../components/UpcomingPayments'
import MonthlyHistory from '../components/MonthlyHistory'
import FinancialOverview from '../components/FinancialOverview'
import ExtraIncome from '../components/ExtraIncome'
import { supabase } from '../lib/supabaseClient'
import DailyExpenses from './DailyExpenses'
import { formatCRC } from '../utils/financeCalculations'

export default function Dashboard({ session, onRegisterPayment }) {
  const [latestCycle, setLatestCycle] = useState(null)
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [extraIncomes, setExtraIncomes] = useState([])

  const loadLatestCycle = useCallback(async () => {
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
  }, [session.user.id])

  const loadDailyExpenses = useCallback(async () => {
    if (!latestCycle) return

    const { data, error } = await supabase
      .from('daily_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cycle_id', latestCycle.id)

    if (!error) {
      setDailyExpenses(data || [])
    }
  }, [latestCycle, session.user.id])

  const loadExtraIncomes = useCallback(async () => {
    if (!latestCycle) return

    const { data, error } = await supabase
      .from('extra_incomes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('cycle_id', latestCycle.id)
      .order('income_date', { ascending: false })

    if (!error) {
      setExtraIncomes(data || [])
    }
  }, [latestCycle, session.user.id])

  const loadFixedExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('due_day', { ascending: true })

    if (!error) {
      setFixedExpenses(data || [])
    }
  }, [session.user.id])

  useEffect(() => {
    loadLatestCycle()
    loadFixedExpenses()
  }, [loadFixedExpenses, loadLatestCycle])

  useEffect(() => {
    if (latestCycle) {
      loadDailyExpenses()
      loadExtraIncomes()
    } else {
      setDailyExpenses([])
      setExtraIncomes([])
    }
  }, [latestCycle, loadDailyExpenses, loadExtraIncomes])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const totalSpent = dailyExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )

  const totalExtraIncome = extraIncomes.reduce(
    (total, income) => total + Number(income.amount_crc ?? income.amount),
    0
  )

  const availableInitial = Number(latestCycle?.available_amount || 0)
  const availableNow = availableInitial + totalExtraIncome - totalSpent

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

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onRegisterPayment}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl"
            >
              Registrar pago
            </button>

            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <p className="text-slate-400 text-sm">Ingresos extra</p>
            <h2 className="text-2xl font-bold mt-2">
              {formatCRC(totalExtraIncome)}
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
            extraIncomeTotal={totalExtraIncome}
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

        <DailyExpenses
          session={session}
          cycle={latestCycle}
          extraIncomeTotal={totalExtraIncome}
          onExpenseCreated={loadDailyExpenses}
        />

        <ExtraIncome
          session={session}
          cycle={latestCycle}
          incomes={extraIncomes}
          onChange={loadExtraIncomes}
        />

        <UpcomingPayments expenses={fixedExpenses} />

        <MonthlyHistory session={session} />
      </div>
    </div>
  )
}
