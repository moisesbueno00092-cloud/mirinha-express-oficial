
'use client';

import { useMemo } from 'react';
import { Item, FiadoCustomer } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FavoritesMenuProps {
  allItems: Item[];
  onSelect: (command: string) => void;
}

export default function FavoritesMenu({ allItems, onSelect }: FavoritesMenuProps) {
  const fiadoCustomers = useMemo<FiadoCustomer[]>(() => {
    if (!allItems) return [];

    const customerMap = new Map<string, FiadoCustomer>();

    // Sort items by timestamp descending to easily find the latest
    const sortedItems = [...allItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    for (const item of sortedItems) {
      if (item.group.includes('Fiado') && item.customerName && item.originalCommand) {
        const lowerCaseName = item.customerName.toLowerCase();
        if (!customerMap.has(lowerCaseName)) {
          customerMap.set(lowerCaseName, {
            name: item.customerName,
            lastCommand: item.originalCommand,
            lastSeen: item.timestamp,
          });
        }
      }
    }

    return Array.from(customerMap.values());
  }, [allItems]);

  if (fiadoCustomers.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          <Users className="mr-2 h-4 w-4" />
          Fiados
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span>Últimos Pedidos Fiado</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {fiadoCustomers.map((customer) => (
          <DropdownMenuItem key={customer.name} onSelect={() => onSelect(customer.lastCommand)}>
            <div className="flex flex-col w-full">
              <span className="font-semibold">{customer.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {customer.lastCommand}
              </span>
               <span className="text-xs text-muted-foreground/80 mt-1">
                {formatDistanceToNow(new Date(customer.lastSeen), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    