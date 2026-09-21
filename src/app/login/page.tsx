import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-brand-700">Ecdise SaaS</h1>
          <p className="text-sm text-neutral-500">Painel administrativo — acesso restrito.</p>
        </div>
        <form action={login} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">Senha</label>
            <input
              name="senha"
              type="password"
              required
              autoFocus
              className="input"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
