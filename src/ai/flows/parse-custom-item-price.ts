'use server';

/**
 * @fileOverview Parses a custom item price from a text input string.
 *
 * This file exports:
 * - `parseCustomItemPrice`: A function that attempts to extract a custom price from an item name string.
 * - `ParseCustomItemPriceInput`: The input type for the `parseCustomItemPrice` function.
 * - `ParseCustomItemPriceOutput`: The output type for the `parseCustomItemPrice` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseCustomItemPriceInputSchema = z.object({
  itemName: z.string().describe('The name of the item, potentially including a custom price.'),
});
export type ParseCustomItemPriceInput = z.infer<typeof ParseCustomItemPriceInputSchema>;

const ParseCustomItemPriceOutputSchema = z.object({
  itemName: z.string().describe('The name of the item with the price removed.'),
  customPrice: z.number().optional().describe('The custom price of the item if specified, otherwise undefined.'),
});
export type ParseCustomItemPriceOutput = z.infer<typeof ParseCustomItemPriceOutputSchema>;

export async function parseCustomItemPrice(input: ParseCustomItemPriceInput): Promise<ParseCustomItemPriceOutput> {
  return parseCustomItemPriceFlow(input);
}

const parseCustomItemPricePrompt = ai.definePrompt({
  name: 'parseCustomItemPricePrompt',
  input: {schema: ParseCustomItemPriceInputSchema},
  output: {schema: ParseCustomItemPriceOutputSchema},
  prompt: `You are an expert at parsing item names and prices from a text string.

  If the item name starts with a number followed by a non-numeric string, and then another number, extract the second number as the custom price.
  The item name should be the text part.
  For example, if the input is '2bala 0.50', the item name is 'bala' and the custom price is 0.50.
  If the input is '1chocolate 4.50', the item name is 'chocolate' and the custom price is 4.50.
  If the input does not contain a custom price at the end, return the original item name and leave the customPrice field empty.

  Parse the following item name:
  Item Name: {{{itemName}}}
  `,
});


const parseCustomItemPriceFlow = ai.defineFlow(
  {
    name: 'parseCustomItemPriceFlow',
    inputSchema: ParseCustomItemPriceInputSchema,
    outputSchema: ParseCustomItemPriceOutputSchema,
  },
  async input => {
    const {output} = await parseCustomItemPricePrompt(input);
    return output!;
  }
);
