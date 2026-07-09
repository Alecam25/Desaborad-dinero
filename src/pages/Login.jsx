import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isRegister) {
        const redirectUrl =
          import.meta.env.VITE_APP_URL || window.location.origin

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        })

        if (error) throw error

        setMessageType('success')
        setMessage(
          'Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessageType('success')
        setMessage('Inicio de sesión correcto.')
      }
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const messageStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
    info: 'bg-slate-800 text-slate-300 border-slate-700',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-sm font-semibold">
            💰 Finanzas personales
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-6 leading-tight">
            Desaborad Dinero
          </h1>

          <p className="text-slate-400 mt-4 text-base sm:text-lg max-w-xl">
            Organiza tus ingresos, gastos fijos, ahorro y gastos diarios desde un dashboard simple y visual.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-950/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-2xl mb-2">📊</p>
              <h3 className="font-bold">Control mensual</h3>
              <p className="text-sm text-slate-400 mt-1">
                Registra cada pago y calcula tu presupuesto automáticamente.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-2xl mb-2">🚦</p>
              <h3 className="font-bold">Semáforo financiero</h3>
              <p className="text-sm text-slate-400 mt-1">
                Visualiza si vas bien, si debes controlar gastos o si estás en alerta.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-2xl mb-2">💵</p>
              <h3 className="font-bold">USD y CRC</h3>
              <p className="text-sm text-slate-400 mt-1">
                Maneja salarios y gastos en dólares o colones.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-700 rounded-2xl p-4">
              <p className="text-2xl mb-2">🔐</p>
              <h3 className="font-bold">Datos privados</h3>
              <p className="text-sm text-slate-400 mt-1">
                Cada usuario administra únicamente su propia información.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </h2>

            <p className="text-slate-400 mt-2">
              {isRegister
                ? 'Crea tu cuenta para empezar a ordenar tu dinero.'
                : 'Ingresa para ver tu dashboard financiero.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                className="w-full min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-60"
            >
              {loading
                ? 'Procesando...'
                : isRegister
                  ? 'Crear cuenta'
                  : 'Ingresar'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-5 border px-4 py-3 rounded-xl text-sm ${messageStyles[messageType]}`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 border-t border-slate-800 pt-6">
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setMessage('')
              }}
              className="w-full text-sm text-emerald-400 hover:text-emerald-300"
            >
              {isRegister
                ? 'Ya tengo cuenta, iniciar sesión'
                : 'No tengo cuenta, crear una'}
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-6">
            Tu información financiera se guarda de forma privada por usuario.
          </p>
        </section>
      </div>
    </div>
  )
}