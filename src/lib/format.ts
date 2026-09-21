// Dinheiro é guardado em centavos (Int) no banco pra evitar erro de ponto
// flutuante. Estas funções convertem pra exibição e de volta a partir do
// formulário.

export function formatCentavos(centavos: number | null | undefined): string {
  if (centavos == null) return '—'
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Aceita "1.234,56", "1234,56" ou "1234.56" vindos de um <input>.
export function parseValorParaCentavos(valor: string | null | undefined): number | null {
  if (!valor) return null
  const limpo = valor.trim()
  if (!limpo) return null
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo
  const numero = Number(normalizado)
  if (Number.isNaN(numero)) return null
  return Math.round(numero * 100)
}

export const STATUS_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  PROPOSTA_ENVIADA: 'Proposta Enviada',
  EM_NEGOCIACAO: 'Em Negociação',
  CONTRATO_FECHADO: 'Contrato Fechado',
  EM_IMPLANTACAO: 'Em Implantação',
  ATIVO: 'Ativo',
  CANCELADO: 'Cancelado',
}

export const STATUS_ORDEM = [
  'LEAD',
  'PROPOSTA_ENVIADA',
  'EM_NEGOCIACAO',
  'CONTRATO_FECHADO',
  'EM_IMPLANTACAO',
  'ATIVO',
  'CANCELADO',
]

export const TIPO_CONTRATO_LABELS: Record<string, string> = {
  SAAS_MENSAL: 'SaaS Mensal',
  LICENCA_DE_USO: 'Licença de Uso',
}
