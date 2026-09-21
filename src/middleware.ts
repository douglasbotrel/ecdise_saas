import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, sessionTokenValido } from '@/lib/admin-session'

// Rotas que NÃO exigem o cookie de sessão do admin:
// - /login: a própria tela de login (senão ninguém consegue logar)
// - /api/login-roteamento e /api/empresa-database: chamadas internas
//   server-to-server vindas do Ecdise, já protegidas pelo próprio segredo
//   compartilhado (x-internal-secret) dentro de cada rota — não usam
//   cookie de sessão porque não são navegação de um navegador.
const PUBLIC_ROUTES = ['/login', '/api/login-roteamento', '/api/empresa-database']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const valido = await sessionTokenValido(token)

  if (!valido) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    if (token) response.cookies.delete(ADMIN_SESSION_COOKIE)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
