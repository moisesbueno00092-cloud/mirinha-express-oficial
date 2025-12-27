'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProductComboboxProps {
  products: string[];
  value: string;
  setValue: (value: string) => void;
  disabled: boolean;
}

export function ProductCombobox({ products, value, setValue, disabled }: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
          disabled={disabled}
        >
          {value
            ? products.find(p => p.toLowerCase() === value.toLowerCase()) || value
            : "Selecione ou crie um produto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar produto..." 
            value={value}
            onValueChange={setValue}
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado. Pode adicioná-lo.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product}
                  value={product}
                  onSelect={(currentValue) => {
                    setValue(currentValue.toLowerCase() === value.toLowerCase() ? '' : product);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === product.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {product}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
