import { formatCRC } from '../utils/financeCalculations'

export default function FinancialOverview({
  totalSpent,
  extraIncomeTotal = 0,
  availableInitial,
  availableNow,
  dailyLimit,
}) {
  const availableWithExtraIncome =
    Number(availableInitial) + Number(extraIncomeTotal)

  const percentageUsed =
    availableWithExtraIncome > 0
      ? (totalSpent / availableWithExtraIncome) * 100
      : 0

  const safePercentage = Math.min(Math.max(percentageUsed, 0), 100)

  let status = {
    label: '🟢',
    title: 'Vas bien',
    message: 'Estás usando tu dinero de forma controlada. Sigue así.',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-500',
  }

  if (safePercentage >= 50 && safePercentage < 75) {
    status = {
      label: '🟡',
      title: 'Cuidado con el ritmo',
      message: 'Ya usaste más de la mitad de tu dinero disponible. Revisa tus próximos gastos.',
      badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      bar: 'bg-yellow-500',
    }
  }

  if (safePercentage >= 75) {
    status = {
      label: '🔴',
      title: 'Alerta financiera',
      message: 'Estás cerca de consumir tu dinero disponible. Intenta reducir gastos no necesarios.',
      badge: 'bg-red-500/10 text-red-400 border-red-500/30',
      bar: 'bg-red-500',
    }
  }

  if (availableNow < 0) {
    status = {
      label: '🚨',
      title: 'Presupuesto sobrepasado',
      message: 'Ya gastaste más de lo disponible. Es momento de frenar gastos y revisar prioridades.',
      badge: 'bg-red-500/10 text-red-400 border-red-500/30',
      bar: 'bg-red-500',
    }
  }

  return (
    <section className="mt-6 sm:mt-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div
            className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full text-sm font-semibold ${status.badge}`}
          >
            <span>{status.label}</span>
            <span>{status.title}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mt-4">
            Resumen de tu dinero
          </h2>

          <p className="text-slate-400 mt-2 max-w-2xl">
            {status.message}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-700 rounded-2xl p-5 min-w-full lg:min-w-[280px]">
          <p className="text-slate-400 text-sm">Disponible actual</p>
          <h3 className="text-3xl font-bold mt-1">
            {formatCRC(availableNow)}
          </h3>

          <p className="text-slate-400 text-sm mt-4">
            Límite diario recomendado
          </p>
          <p className="text-xl font-semibold">
            {formatCRC(dailyLimit)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Uso del disponible</span>
          <span className="font-semibold">
            {safePercentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden border border-slate-700">
          <div
            className={`h-full ${status.bar} transition-all duration-500`}
            style={{ width: `${safePercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Disponible inicial</p>
            <h4 className="text-xl font-bold mt-1">
              {formatCRC(availableInitial)}
            </h4>
          </div>

          <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Gastado</p>
            <h4 className="text-xl font-bold mt-1">
              {formatCRC(totalSpent)}
            </h4>
          </div>

          <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Ingresos extra</p>
            <h4 className="text-xl font-bold mt-1">
              {formatCRC(extraIncomeTotal)}
            </h4>
          </div>

          <div className="bg-slate-950/60 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Disponible actual</p>
            <h4 className="text-xl font-bold mt-1">
              {formatCRC(availableNow)}
            </h4>
          </div>
        </div>
      </div>
    </section>
  )
}
