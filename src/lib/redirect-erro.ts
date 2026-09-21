import { redirect } from 'next/navigation'

// Redireciona de volta pra uma página com a mensagem de erro na URL, em vez
// de deixar o Next.js estourar a tela genérica "Application error: a
// server-side exception has occurred" (que esconde a mensagem real em
// produção — foi o que causou confusão no primeiro deploy do painel).
// Usado em toda Server Action que pode falhar por um motivo que o usuário
// precisa ver: validação, chamada externa que falhou, etc.
export function redirectComErro(caminho: string, mensagem: string): never {
  const separador = caminho.includes('?') ? '&' : '?'
  redirect(`${caminho}${separador}erro=${encodeURIComponent(mensagem)}`)
}

// redirect() do Next.js funciona lançando uma exceção especial por baixo dos
// panos (identificada pelo campo `digest`, prefixo "NEXT_REDIRECT") — um
// try/catch em volta de uma Server Action precisa deixar essa exceção
// passar direto, senão o redirect de sucesso também cai no catch e vira um
// redirect de erro.
export function isNextRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as any).digest === 'string' &&
    (err as any).digest.startsWith('NEXT_REDIRECT')
  )
}
