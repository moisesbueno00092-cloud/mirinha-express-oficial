
'use server';

/**
 * @fileOverview Fluxo de extração de dados de romaneios utilizando Gemini 1.5 Flash.
 * Configurado para máxima compatibilidade em ambientes de produção como Vercel.
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
 * Identificador do modelo universal para evitar erro 404 na Vercel.
 * Alguns ambientes da Vercel requerem o identificador completo.
 */
const STABLE_MODEL = 'googleai/gemini-1.5-flash';

/**
 * Testa a conexão com a IA utilizando o modelo padrão.
 */
export async function testAiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await ai.generate({
      model: STABLE_MODEL,
      prompt: 'Responda apenas "OK".',
    });

    if (response.text?.includes('OK')) {
      return { success: true, message: 'IA conectada com sucesso!' };
    }
    return { success: false, message: 'A IA respondeu mas o formato foi inesperado.' };
  } catch (error: any) {
    console.error("ERRO TESTE CONEXÃO:", error);
    
    if (error.message?.includes('404')) {
        return { 
            success: false, 
            message: 'Erro 404: Modelo não encontrado. Vá ao Google AI Studio e ative a "Generative Language API" para esta chave.' 
        };
    }
    
    if (error.message?.includes('429')) {
        return { success: false, message: 'Limite de uso atingido (429). Tente novamente em breve.' };
    }

    if (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED')) {
        return { success: false, message: 'Erro 403: Chave de API inválida ou sem permissão para o Gemini 1.5 Flash.' };
    }

    return { success: false, message: `Erro Técnico: ${error.message}` };
  }
}

/**
 * Extrai dados do romaneio via visão computacional.
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioOutput> {
  try {
    const { output } = await ai.generate({
      model: STABLE_MODEL,
      prompt: [
        { text: `Você é um assistente especializado em romaneios de restaurante. 
        Analise a imagem e extraia os seguintes dados em JSON:
        1. fornecedorNome: Nome da empresa vendedora.
        2. dataVencimento: Data de pagamento (YYYY-MM-DD).
        3. items: lista com produtoNome, quantidade e valorTotal.

        Ignore carimbos ou rasuras ilegíveis.` },
        { media: { url: input.romaneioPhoto, contentType: 'image/jpeg' } }
      ],
      output: {
        schema: ParseRomaneioOutputSchema
      },
      config: {
        temperature: 0.1,
      }
    });

    if (!output) throw new Error("Não foi possível processar os dados desta imagem.");
    return output;

  } catch (error: any) {
    console.error("ERRO PROCESSAMENTO IA:", error);
    
    if (error.message?.includes('404')) {
        throw new Error("Modelo não encontrado (404). Verifique se a API 'Generative Language' está ativa no Google AI Studio.");
    }

    if (error.message?.includes('429')) {
        throw new Error("Muitos pedidos seguidos. Aguarde um momento.");
    }
    
    throw new Error(`Falha na IA: ${error.message}`);
  }
}
