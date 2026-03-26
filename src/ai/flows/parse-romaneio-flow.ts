'use server';

/**
 * @fileOverview Fluxo de extração de dados de romaneios e verificação de conexão.
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
 * Verifica se a chave de API está a funcionar corretamente com um teste simples.
 */
export async function testAiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash-8b',
      prompt: 'Responda apenas com a palavra OK se estiver a funcionar.',
    });

    if (response.text.includes('OK')) {
      return { success: true, message: 'IA Conectada com sucesso!' };
    }
    return { success: false, message: 'A IA respondeu, mas o formato foi inesperado.' };
  } catch (error: any) {
    console.error("ERRO TESTE CONEXÃO:", error);
    if (error.message?.includes('429')) return { success: false, message: 'Chave ativa, mas sem quota disponível (Erro 429).' };
    if (error.message?.includes('API_KEY_INVALID')) return { success: false, message: 'Chave de API inválida ou desativada.' };
    return { success: false, message: `Erro: ${error.message}` };
  }
}

/**
 * Processa a imagem do romaneio e retorna os dados extraídos.
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioOutput> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash-8b',
      prompt: [
        { text: `Você é um assistente de entrada de mercadorias. 
        Analise a imagem deste romaneio e extraia:
        1. Nome do Fornecedor.
        2. Data de Vencimento (YYYY-MM-DD).
        3. Lista de produtos: nome, quantidade e valor total da linha.

        Responda APENAS com um JSON puro no formato abaixo, sem blocos de código markdown:
        {
          "items": [
            { "produtoNome": "Exemplo", "quantidade": 1, "valorTotal": 10.0 }
          ],
          "fornecedorNome": "Empresa X",
          "dataVencimento": "2024-12-31"
        }` },
        { media: { url: input.romaneioPhoto, contentType: 'image/jpeg' } }
      ],
      config: {
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("A IA não retornou dados.");

    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanedJson);
      return ParseRomaneioOutputSchema.parse(parsed);
    } catch (parseError) {
      console.error("JSON inválido da IA:", text);
      throw new Error("Não foi possível processar a resposta da IA. Tente uma foto mais legível.");
    }

  } catch (error: any) {
    console.error("DETALHES DO ERRO IA:", error);
    if (error.message?.includes('429')) throw new Error("Quota excedida. Aguarde 1 minuto.");
    throw new Error(`Falha ao ler imagem: ${error.message}`);
  }
}
