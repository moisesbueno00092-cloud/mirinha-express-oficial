'use server';

/**
 * @fileOverview Gerador de Relatórios Estratégicos de Gestão "Maxi Mode" com IA.
 * 
 * Analisa vendas, compras, custos de pessoal e contas a pagar para fornecer 
 * uma visão 360º do Restaurante da Mirinha.
 * Inclui lógica de agrupamento inteligente e análise de rentabilidade.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ManagementReportInputSchema = z.object({
  periodLabel: z.string().describe('O nome do período (ex: Semana 12, Janeiro 2024).'),
  salesData: z.any().describe('Dados consolidados de vendas do período.'),
  expenseData: z.any().describe('Dados consolidados de compras de mercadorias.'),
  staffData: z.any().optional().describe('Resumo de custos com funcionários (vales, extras, etc).'),
  financialStats: z.any().optional().describe('Resumo de contas pagas vs pendentes.'),
});
export type ManagementReportInput = z.infer<typeof ManagementReportInputSchema>;

const ManagementReportOutputSchema = z.object({
  summary: z.string().describe('Resumo executivo da saúde financeira.'),
  topSellingItems: z.array(z.object({
    name: z.string(),
    count: z.number(),
    category: z.enum(['Refeição', 'Bomboniere']),
  })).describe('Ranking unificado por similaridade.'),
  mainExpenses: z.array(z.object({
    name: z.string(),
    totalValue: z.number(),
  })).describe('Maiores custos agrupados.'),
  staffAnalysis: z.string().describe('Análise sobre o peso da folha e extras.'),
  profitabilityInsight: z.string().describe('Análise sobre a margem de lucro real.'),
  strategicAdvice: z.string().describe('3 conselhos práticos e diretos para o gestor.'),
  efficiencyScore: z.number().min(0).max(100).describe('Nota de 0 a 100 para a performance do período.'),
});
export type ManagementReportOutput = z.infer<typeof ManagementReportOutputSchema>;

export async function generateManagementReport(input: ManagementReportInput): Promise<ManagementReportOutput> {
  return generateManagementReportFlow(input);
}

const managementPrompt = ai.definePrompt({
  name: 'managementPrompt',
  input: { schema: ManagementReportInputSchema },
  output: { schema: ManagementReportOutputSchema },
  prompt: `Você é o Diretor de Estratégia do "Restaurante da Mirinha". Sua missão é fornecer uma análise "Maxi Mode" para o período de {{{periodLabel}}}.

--- DADOS PARA ANÁLISE ---
VENDAS: {{{json salesData}}}
COMPRAS (MERCADORIAS): {{{json expenseData}}}
PESSOAL (VALES/EXTRAS): {{{json staffData}}}
FINANCEIRO (CONTAS): {{{json financialStats}}}

--- INSTRUÇÕES DE UNIFICAÇÃO (MUITO IMPORTANTE) ---
1. AGRUPE itens com nomes similares em uma única categoria no ranking de vendas e compras.
   - Exemplo: "Filé Aurora", "Filé Atalaia", "Filé Bovino" unifique apenas como "FILÉ".
   - Exemplo: "Marmita M", "Marmita G", "Marmita Especial" unifique como "MARMITA".
   - Exemplo: "Coca Lata", "Coca 600", "Coca 2L" podem ser unificados como "COCA-COLA" se o objetivo for ver o volume da marca.
2. EXCEÇÃO "GÁS": "Água com Gás" e "Água sem Gás" NÃO podem ser unificadas. Mantenha-as separadas.
3. Se encontrar apenas "GÁS", trate como o insumo de cozinha (botijão).

--- SUA TAREFA ---
1. Identifique o produto mais lucrativo (Carro Chefe) e o de maior volume.
2. Analise se os gastos com mercadorias estão compatíveis com as vendas (detecte desperdício se as compras forem muito maiores que as vendas de um item unificado).
3. Avalie o impacto dos Vales e Horas Extras na operação.
4. Verifique o equilíbrio entre Contas Pagas e Pendentes.
5. Seja crítico e honesto: se o lucro parece baixo ou o fiado muito alto, dê o alerta.

Forneça a saída rigorosamente no formato JSON solicitado.`,
});

const generateManagementReportFlow = ai.defineFlow(
  {
    name: 'generateManagementReportFlow',
    inputSchema: ManagementReportInputSchema,
    outputSchema: ManagementReportOutputSchema,
  },
  async (input) => {
    const { output } = await managementPrompt(input);
    return output!;
  }
);
