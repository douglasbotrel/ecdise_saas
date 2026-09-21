// Sessão do painel administrativo do control-plane.
//
// Usa só a Web Crypto API (crypto.subtle), que funciona tanto em Server
// Actions/route handlers (runtime Node) quanto no middleware (runtime Edge)
// — assim não precisamos instalar next-auth/jsonwebtoken (o npm install
// pela ponte com o computador do usuário tem travado repetidamente).
//
// O "token" é só um payload assinado por HMAC-SHA256, no formato
// "payloadBase64Url.assinaturaBase64Url", guardado no cookie
// ADMIN_SESSION_COOKIE. Não guarda senha nenhuma, só a validade da sessão.

export const ADMIN_SESSION_COOKIE = 'ecdise_admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 12 // 12 horas

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error(
      'ADMIN_SESSION_SECRET não definida. Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))" e coloque no .env.'
    )
  }
  return secret
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function criarSessionToken(): Promise<string> {
  const secret = getSessionSecret()
  const payload = {
    sub: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  }
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await getHmacKey(secret)
  const assinatura = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const assinaturaB64 = base64UrlEncode(new Uint8Array(assinatura))
  return `${payloadB64}.${assinaturaB64}`
}

export async function sessionTokenValido(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  try {
    const secret = getSessionSecret()
    const [payloadB64, assinaturaB64] = token.split('.')
    if (!payloadB64 || !assinaturaB64) return false

    const key = await getHmacKey(secret)
    const valida = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(assinaturaB64) as BufferSource,
      new TextEncoder().encode(payloadB64)
    )
    if (!valida) return false

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)))
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return false

    return true
  } catch {
    return false
  }
}

// Compara a senha digitada com a esperada em tempo constante (hash das duas
// e comparação byte-a-byte), pra não vazar a senha por timing attack.
// Também funciona em Edge e Node, já que só usa crypto.subtle.
export async function senhaAdminCorreta(senhaDigitada: string): Promise<boolean> {
  const esperada = process.env.ADMIN_PASSWORD
  if (!esperada) {
    throw new Error('ADMIN_PASSWORD não definida nas variáveis de ambiente.')
  }
  const encoder = new TextEncoder()
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(senhaDigitada)),
    crypto.subtle.digest('SHA-256', encoder.encode(esperada)),
  ])
  const aBytes = new Uint8Array(a)
  const bBytes = new Uint8Array(b)
  if (aBytes.length !== bBytes.length) return false
  let diff = 0
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i]
  return diff === 0
}
