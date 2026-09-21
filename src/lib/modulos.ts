// Catálogo de módulos vendáveis do Ecdise, à la carte.
// Mantém as mesmas chaves usadas em src/lib/utils.ts (MODULOS_POR_ROLE) do
// projeto Ecdise, só que em MAIUSCULO_SNAKE por serem um enum do Prisma.
// Atualizar sempre que um módulo novo nascer no produto principal.
export const MODULOS_CATALOGO = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'TAREFAS_SEMANA', label: 'Tarefas da Semana' },
  { key: 'COMERCIAL', label: 'Comercial' },
  { key: 'CLIENTES', label: 'Clientes' },
  { key: 'CONTRATOS', label: 'Contratos' },
  { key: 'OPERACIONAL', label: 'Operacional' },
  { key: 'ACOMPANHAMENTO', label: 'Acompanhamento de Processos' },
  { key: 'LICENCAS', label: 'Licenças' },
  { key: 'CAMPO', label: 'Gestão de Campo' },
  { key: 'TECNICO', label: 'Minhas Vistorias' },
  { key: 'FINANCEIRO', label: 'Financeiro' },
  { key: 'ENCERRAMENTO', label: 'Encerramento' },
  { key: 'BI', label: 'BI' },
  { key: 'CONFIGURACOES', label: 'Configurações' },
] as const

export type ModuloKeyStr = (typeof MODULOS_CATALOGO)[number]['key']
