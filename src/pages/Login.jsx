import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        setMessage('Cuenta creada. Ahora puedes iniciar sesión.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage('Inicio de sesión correcto.')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Desaborad Dinero</h1>
          <p className="text-slate-400 mt-2">
            Ordena tu salario, gastos y ahorro mensual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Correo
            </label>
            <input
              type="email"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
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
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-500"
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
          <p className="mt-5 text-center text-sm text-slate-300">
            {message}
          </p>
        )}

        <button
          onClick={() => {
            setIsRegister(!isRegister)
            setMessage('')
          }}
          className="w-full mt-6 text-sm text-emerald-400 hover:text-emerald-300"
        >
          {isRegister
            ? 'Ya tengo cuenta, iniciar sesión'
            : 'No tengo cuenta, crear una'}
        </button>
      </div>
    </div>
  )
}