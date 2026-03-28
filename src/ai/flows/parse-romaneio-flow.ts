'use server';

/**
 * @fileOverview Fluxo de extração de dados de romaneios com resiliência regional.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseRomaneioOutputSchema = z.object({
  items: z.array(z.object({
    produtoNome: z.string(),
    quantidade: z.number(),
    valorTotal: z.number(),
  })),
  fornecedorNome: z.string().optional(),
  dataVencimento: z.string().optional(),
});

export type ParseRomaneioOutput = z.infer<typeof ParseRomaneioOutputSchema>;

/**
 * Testa a conexão com a IA.
 */
export async function testAiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await ai.generate({
      prompt: 'Responda apenas "CONECTADO".',
    });
    if (response.text?.includes('CONECTADO')) {
      return { success: true, message: 'IA conectada com sucesso.' };
    }
    return { success: false, message: 'Resposta inesperada da IA.' };
  } catch (e: any) {
    return { success: false, message: `Erro: ${e.message}` };
  }
}

/**
 * Analisa a foto de um romaneio utilizando múltiplos modelos em caso de falha (Resiliência 404).
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioOutput> {
  // Lista de modelos para tentar em sequência caso ocorra um erro 404 ou 503
  const modelsToTry = [
    'googleai/gemini-1.5-flash',
    'googleai/gemini-1.5-flash-8b',
    'googleai/gemini-1.5-pro'
  ];

  let lastError: any = null;

  for (const modelId of modelsToTry) {
    try {
      const { output } = await ai.generate({
        model: modelId,
        prompt: [
          { text: `Você é um assistente especializado em romaneios de restaurante. 
          Extraia os dados da imagem para JSON:
          1. fornecedorNome: Nome da empresa.
          2. dataVencimento: Data de pagamento (formato YYYY-MM-DD). Se não encontrar, deixe vazio.
          3. items: lista com produtoNome, quantidade e valorTotal.
          Ignore carimbos, assinaturas ou rasuras.` },
          { media: { url: input.romaneioPhoto, contentType: 'image/jpeg' } }
        ],
        output: { schema: ParseRomaneioOutputSchema },
        config: { temperature: 0.1 }
      });

      if (output) return output;
    } catch (error: any) {
      console.warn(`Falha ao usar modelo ${modelId}:`, error.message);
      lastError = error;
      // Se não for erro de modelo não encontrado, pode ser erro de cota ou rede, continuamos tentando
      continue;
    }
  }

  throw new Error(`IA Indisponível: Não foi possível conectar a nenhum modelo na sua região. Tente novamente ou use o teste de conexão. Detalhe: ${lastError?.message || 'Erro desconhecido'}`);
}
