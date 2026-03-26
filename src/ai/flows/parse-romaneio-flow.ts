'use server';

/**
 * @fileOverview Fluxo de extração de dados de romaneios via IA.
 * 
 * Abordagem ultra-estável para evitar erros 404 e problemas de endpoint.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseRomaneioOutputSchema = z.object({
  items: z.array(z.object({
    produtoNome: z.string().describe("Nome do produto."),
    quantidade: z.number().describe("Qtd."),
    valorTotal: z.number().describe("Valor total da linha."),
  })).describe("Lista de produtos."),
  fornecedorNome: z.string().optional().describe("Nome do fornecedor."),
  dataVencimento: z.string().optional().describe("Vencimento YYYY-MM-DD."),
});

export type ParseRomaneioOutput = z.infer<typeof ParseRomaneioOutputSchema>;

/**
 * Processa a imagem do romaneio usando Gemini 1.5 Flash.
 * Utilizamos a referência de modelo mais estável para evitar erros 404.
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioOutput> {
  try {
    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: `Você é um especialista em ler notas fiscais e romaneios brasileiros de hortifruti e mercadorias.
        Extraia:
        1. Nome do fornecedor (se visível).
        2. Data de vencimento (formato YYYY-MM-DD).
        3. Lista de itens com Nome, Quantidade e Valor Total da linha.
        Ignore carimbos ou rasuras. Retorne apenas o JSON solicitado.` },
        { media: { url: input.romaneioPhoto } }
      ],
      output: {
        schema: ParseRomaneioOutputSchema
      }
    });

    if (!response.output) {
      throw new Error("A IA não retornou dados válidos.");
    }

    return response.output;
  } catch (error: any) {
    console.error("Erro na extração do romaneio:", error);
    // Se falhar com 404, tentamos uma variante de nome de modelo
    if (error.message?.includes('404')) {
       throw new Error("Erro de conexão com a IA (Modelo não encontrado). Por favor, verifique a chave de API.");
    }
    throw new Error(`Erro de Processamento: ${error.message}`);
  }
}
