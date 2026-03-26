'use server';

/**
 * @fileOverview Fluxo de extração de dados de romaneios via IA.
 * 
 * Este fluxo utiliza o modelo Gemini 1.5 Flash para ler imagens de romaneios
 * e extrair dados estruturados (produtos, quantidades e valores).
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
 * Processa a imagem do romaneio e retorna os dados extraídos.
 * Utiliza o identificador de modelo 'googleai/gemini-1.5-flash' para garantir a resolução correta.
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioOutput> {
  try {
    // A chamada utiliza o identificador canónico do modelo no Genkit 1.x
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: `Você é um especialista em ler romaneios e notas fiscais de mercadorias no Brasil.
        Sua tarefa é extrair o nome do fornecedor, a data de vencimento e a lista de produtos (nome, quantidade e valor total).
        
        IMPORTANTE: Retorne APENAS um objeto JSON puro e válido.
        
        Formato esperado:
        {
          "items": [
            { "produtoNome": "NOME DO ITEM", "quantidade": 10, "valorTotal": 150.50 }
          ],
          "fornecedorNome": "NOME DA EMPRESA",
          "dataVencimento": "YYYY-MM-DD"
        }` },
        { media: { url: input.romaneioPhoto, contentType: 'image/jpeg' } }
      ],
      config: {
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("A IA não retornou nenhum texto de resposta.");
    }

    // Limpeza de blocos de código markdown se a IA os incluir
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanedJson);
      return ParseRomaneioOutputSchema.parse(parsed);
    } catch (parseError) {
      console.error("Erro ao converter resposta em JSON. Resposta original:", text);
      throw new Error("A resposta da IA não está num formato de dados válido.");
    }

  } catch (error: any) {
    // LOG CRÍTICO para diagnóstico detalhado no terminal do servidor
    console.error("DETALHES DO ERRO GOOGLE AI (METADADOS COMPLETOS):");
    console.dir(error, { depth: null });

    const isNotFoundError = error.message?.includes('404') || error.message?.includes('NOT_FOUND');
    const isRegionError = error.message?.includes('location') || error.message?.includes('region');

    if (isNotFoundError || isRegionError) {
      throw new Error(`Erro de IA: O modelo gemini-1.5-flash não foi encontrado ou não está disponível na sua região/chave. Detalhe: ${error.message}`);
    }
    
    throw new Error(`Erro de Processamento: ${error.message}`);
  }
}
