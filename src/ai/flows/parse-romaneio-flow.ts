'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addDays, format } from 'date-fns';

/**
 * SCHEMA INTERNO (NÃO EXPORTADO)
 * Exportando constantes não-assíncronas em arquivos 'use server' causa erro de build no Next.js 15.
 */
const ParseRomaneioOutputSchema = z.object({
  fornecedor: z.string().describe('Nome do fornecedor ou empresa emissora.'),
  dataVencimento: z.string().describe('Data de vencimento no formato ISO (YYYY-MM-DD).'),
  itens: z.array(z.object({
    nome: z.string().describe('Nome descritivo do produto.'),
    quantidade: z.number().describe('Quantidade numérica.'),
    valorTotal: z.number().describe('Valor total do item (Quantidade * Preço Unitário).'),
  })).describe('Lista completa de produtos extraídos.'),
});

type ParseRomaneioOutput = z.infer<typeof ParseRomaneioOutputSchema>;

/**
 * Interface de resposta (INTERNAL USE ONLY)
 */
interface ParseRomaneioResponse {
  data?: ParseRomaneioOutput;
  error?: string;
}

/**
 * Função principal de extração de Romaneios via IA.
 * Utiliza o modelo Gemini 2.0 Flash para visão computacional.
 */
export async function parseRomaneio(input: { romaneioPhoto: string }): Promise<ParseRomaneioResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('[ParseRomaneio] Erro: GEMINI_API_KEY não configurada no ambiente.');
    return { error: 'Chave da API (GEMINI_API_KEY) não encontrada nas variáveis de ambiente da Vercel.' };
  }

  const today = new Date();
  const defaultDueDate = format(addDays(today, 30), 'yyyy-MM-dd');

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      output: { schema: ParseRomaneioOutputSchema },
      prompt: [
        { media: { url: input.romaneioPhoto, contentType: 'image/jpeg' } },
        { text: `Extraia os dados deste romaneio com precisão absoluta.
        
        REGRAS CRÍTICAS:
        1. Se a Data de Vencimento não estiver visível ou legível na imagem, use OBRIGATORIAMENTE a data: ${defaultDueDate} (+30 dias de hoje).
        2. Extraia TODOS os itens com quantidade e valor total.
        3. O retorno deve ser um JSON válido seguindo estritamente o schema fornecido.
        4. O papel pode estar girado ou com baixa luminosidade.` },
      ],
    });

    if (!output) {
      return { error: 'O modelo Gemini não retornou dados válidos para esta imagem.' };
    }

    return { data: output };
  } catch (error: any) {
    console.error('[ParseRomaneio] Erro Crítico:', error.message);
    
    let userFriendlyError = error.message;
    if (error.message.includes('429') || error.message.includes('quota')) {
      userFriendlyError = 'Limite de uso da IA atingido. Tente novamente em alguns minutos.';
    } else if (error.message.includes('fetch failed')) {
      userFriendlyError = 'Falha de conexão com os servidores da Google AI.';
    }

    return { error: `Erro na IA: ${userFriendlyError}` };
  }
}