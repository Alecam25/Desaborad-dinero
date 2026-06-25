export default function UpcomingPayments({ expenses }) {
  const today = new Date().getDate()

  const sorted = [...expenses].sort(
    (a, b) => a.due_day - b.due_day
  )

  const upcoming = sorted.filter(
    (expense) => expense.due_day >= today
  )

  return (
    <section className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        Próximos pagos
      </h2>

      <div className="space-y-3">
        {upcoming.length === 0 && (
          <p className="text-slate-400">
            No hay pagos pendientes este mes.
          </p>
        )}

        {upcoming.map((expense) => (
          <div
            key={expense.id}
            className="bg-slate-800 rounded-xl p-4 flex justify-between"
          >
            <div>
              <p>{expense.name}</p>
              <p className="text-sm text-slate-400">
                Día {expense.due_day}
              </p>
            </div>

            <div>
              {expense.currency === 'USD'
                ? `$${expense.amount}`
                : `₡${expense.amount.toLocaleString()}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}