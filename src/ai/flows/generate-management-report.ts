'use server';

/**
 * @fileOverview Gerador de Relatórios Estratégicos de Gestão com IA.
 * 
 * Analisa dados de vendas, compras e tendências para fornecer insights ao gestor.
 * Inclui lógica de agrupamento inteligente para unificar itens similares.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ManagementReportInputSchema = z.object({
  periodLabel: z.string().describe('O nome do período (ex: Semana 12, Janeiro 2024 ou Ano 2024).'),
  salesData: z.any().describe('Dados consolidados de vendas do período.'),
  expenseData: z.any().describe('Dados consolidados de compras de mercadorias do período.'),
  customerStats: z.any().describe('Resumo do comportamento dos clientes.'),
});
export type ManagementReportInput = z.infer<typeof ManagementReportInputSchema>;

const ManagementReportOutputSchema = z.object({
  summary: z.string().describe('Um resumo executivo da saúde financeira do período.'),
  topSellingItems: z.array(z.object({
    name: z.string(),
    count: z.number(),
    category: z.enum(['Refeição', 'Bomboniere']),
  })).describe('Ranking dos produtos mais vendidos, com nomes unificados.'),
  mainExpenses: z.array(z.object({
    name: z.string(),
    totalValue: z.number(),
  })).describe('Principais custos com mercadorias, agrupados por similaridade.'),
  strategicAdvice: z.string().describe('Conselhos práticos para o gestor melhorar o negócio.'),
  efficiencyScore: z.number().min(0).max(100).describe('Uma nota de 0 a 100 para a eficiência do período.'),
});
export type ManagementReportOutput = z.infer<typeof ManagementReportOutputSchema>;

export async function generateManagementReport(input: ManagementReportInput): Promise<ManagementReportOutput> {
  return generateManagementReportFlow(input);
}

const managementPrompt = ai.definePrompt({
  name: 'managementPrompt',
  input: { schema: ManagementReportInputSchema },
  output: { schema: ManagementReportOutputSchema },
  prompt: `Você é um consultor especializado em gestão de restaurantes brasileiros. 
Analise os dados reais do "Restaurante da Mirinha" referentes ao período de {{{periodLabel}}}.

DADOS DE VENDAS (CONTÉM NOME DO ITEM E QUANTIDADE):
{{{json salesData}}}

DADOS DE COMPRAS (MERCADORIAS NOS ROMANEIOS):
{{{json expenseData}}}

INSTRUÇÕES DE AGRUPAMENTO INTELIGENTE (CRÍTICO):
1. UNIFIQUE itens similares nos rankings: ignore marcas, nomes de fazendas ou adjetivos secundários se o item principal for o mesmo.
   - Exemplo: "Filé Aurora", "Filé Atalaia", "Filé Bovino" devem ser consolidados apenas como "FILÉ".
   - Exemplo: Variações de "Marmita" (Marmita M, Marmita G, Marmita Especial) devem ser unificadas como "MARMITA".
2. EXCEÇÃO "GÁS": "Água com gás" e "Água sem gás" devem ser mantidas como itens DISTINTOS e não unificadas.
   - Se encontrar apenas a palavra "GÁS" isolada, trate como um item separado (ex: botijão de cozinha).
3. Seja estratégico: ao unificar, some as quantidades e valores. Isso ajuda a ver o volume real de consumo de cada insumo.

Sua tarefa é gerar um relatório de gestão de alto nível:
1. Identifique o "Carro Chefe" e a "Estrela da Bomboniere" usando os nomes unificados.
2. Analise se o volume de vendas na RUA compensa as taxas de entrega.
3. Verifique o peso dos FIADOS e dê um alerta se estiverem muito altos.
4. Analise as COMPRAS: quais categorias de mercadorias (ex: CARNES, BEBIDAS, VEGETAIS) estão custando mais?
5. Seja prático e direto nos conselhos.

Formate a saída rigorosamente conforme o esquema solicitado.`,
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
