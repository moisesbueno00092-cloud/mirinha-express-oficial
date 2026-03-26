'use server';

/**
 * @fileOverview Fluxo de extração de dados de romaneios via IA.
 * 
 * Abordagem Alternativa: Utiliza extração via Prompt + JSON Parsing manual 
 * para garantir compatibilidade com a API v1 (que não suporta responseSchema no payload).
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
 * Processa a imagem do romaneio usando o modelo gemini-1.5-flash na API v1.
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioOutput> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: `Você é um especialista em ler romaneios e notas fiscais de mercadorias no Brasil.
        Sua tarefa é extrair o nome do fornecedor, a data de vencimento e a lista de produtos (nome, quantidade e valor total).
        
        IMPORTANTE: Retorne APENAS um objeto JSON puro e válido, sem blocos de código markdown (sem \`\`\`json), sem texto adicional antes ou depois.
        
        Formato esperado:
        {
          "items": [
            { "produtoNome": "NOME DO ITEM", "quantidade": 10, "valorTotal": 150.50 }
          ],
          "fornecedorNome": "NOME DA EMPRESA",
          "dataVencimento": "YYYY-MM-DD"
        }` },
        { media: { url: input.romaneioPhoto } }
      ],
      config: {
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("A IA não conseguiu ler dados na imagem.");
    }

    // Limpeza de possíveis blocos de código se a IA ignorar a instrução de texto puro
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanedJson);
      return ParseRomaneioOutputSchema.parse(parsed);
    } catch (parseError) {
      console.error("Erro ao converter texto da IA em JSON. Texto recebido:", text);
      throw new Error("A resposta da IA não está num formato de dados válido.");
    }

  } catch (error: any) {
    // LOG CRÍTICO para diagnóstico de metadados no terminal do servidor
    console.error("DETALHES DO ERRO GOOGLE AI (METADADOS COMPLETOS):");
    console.dir(error, { depth: null });

    const isNotFoundError = error.message?.includes('404') || error.message?.includes('NOT_FOUND');
    const isRegionError = error.message?.includes('location') || error.message?.includes('region');

    if (isNotFoundError || isRegionError) {
      throw new Error(`Erro de IA: O modelo gemini-1.5-flash não está disponível na sua região ou chave de API. Detalhe: ${error.message}`);
    }
    
    throw new Error(`Erro de Processamento: ${error.message}`);
  }
}
