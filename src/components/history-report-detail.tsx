
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Item, Group } from '@/types';

interface HistoryReportDetailProps {
  items: Item[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
};

const groupBadgeStyles: Record<Group, string> = {
  'Vendas salão': 'bg-purple-600 hover:bg-purple-700',
  'Fiados salão': 'bg-destructive hover:bg-destructive/90',
  'Vendas rua': 'bg-blue-600 hover:bg-blue-700',
  'Fiados rua': 'bg-orange-500 hover:bg-orange-600',
};

export default function HistoryReportDetail({ items }: HistoryReportDetailProps) {
  const sortedItems = [...items].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes dos Lançamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead>
                <TableHead>Comando Original</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map(item => (
                <TableRow key={item.id} className={cn(item.group.includes('Fiados') && 'text-destructive')}>
                  <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                  <TableCell className="font-medium break-all">{item.originalCommand || item.name}</TableCell>
                  <TableCell>
                    <Badge className={cn('whitespace-nowrap text-white border-transparent', groupBadgeStyles[item.group] || 'bg-gray-500')}>
                      {item.group}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
