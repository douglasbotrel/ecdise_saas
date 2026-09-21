import Link from 'next/link'
import { logout } from '../login/actions'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="font-semibold text-brand-700">Ecdise SaaS</span>
          <nav className="flex flex-1 gap-4 text-sm text-neutral-600">
            <Link href="/comercial" className="hover:text-brand-700">Gestão Comercial</Link>
            <Link href="/auditoria" className="hover:text-brand-700">Auditoria</Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-800">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
