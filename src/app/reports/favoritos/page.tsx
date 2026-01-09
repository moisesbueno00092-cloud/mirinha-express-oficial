
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import usePersistentState from '@/hooks/use-persistent-state';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, User, ShoppingBag } from 'lucide-react';
import type { SavedFavorite, Item } from '@/types';
import { renderItemName } from '@/components/item-list';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return '-';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if(isNaN(date.getTime())) return '-';
    return format(date, "dd/MM/yy 'às' HH:mm");
  } catch (e) {
    return '-';
  }
};


const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
        years.push({ value: String(i), label: String(i) });
    }
    return years;
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(2000, i), 'MMMM', { locale: ptBR })
}));


export default function RelatorioPorCliente() {
    const firestore = useFirestore();
    const [savedFavorites] = usePersistentState<SavedFavorite[]>('savedFavorites', []);

    const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | undefined>();
    const [currentMonth, setCurrentMonth] = useState(String(new Date().getMonth()));
    const [currentYear, setCurrentYear] = useState(String(new Date().getFullYear()));
    const [isLoading, setIsLoading] = useState(false);
    const [customerItems, setCustomerItems] = useState<Item[]>([]);
    
    const yearOptions = useMemo(() => generateYearOptions(), []);

    const fetchCustomerItems = useCallback(async () => {
        if (!firestore || !selectedFavoriteId) {
            setCustomerItems([]);
            return;
        };

        const selectedFavorite = savedFavorites.find(f => f.id === selectedFavoriteId);
        if (!selectedFavorite) return;
        
        setIsLoading(true);

        try {
            const year = parseInt(currentYear);
            const month = parseInt(currentMonth);
        
            const startDate = startOfMonth(new Date(year, month));
            const endDate = endOfMonth(new Date(year, month));

            // Queries for both live and archived items
            const liveItemsQuery = query(
                collection(firestore, 'live_items'),
                where('customerName', '==', selectedFavorite.name),
                where('timestamp', '>=', startDate),
                where('timestamp', '<=', endDate)
            );
            const orderItemsQuery = query(
                collection(firestore, 'order_items'),
                where('customerName', '==', selectedFavorite.name),
                where('timestamp', '>=', startDate),
                where('timestamp', '<=', endDate)
            );

            const [liveItemsSnapshot, orderItemsSnapshot] = await Promise.all([
                getDocs(liveItemsQuery),
                getDocs(orderItemsQuery)
            ]);

            const itemsMap = new Map<string, Item>();
            liveItemsSnapshot.forEach(doc => itemsMap.set(doc.id, { ...doc.data(), id: doc.id } as Item));
            orderItemsSnapshot.forEach(doc => itemsMap.set(doc.id, { ...doc.data(), id: doc.id } as Item));

            const combinedItems = Array.from(itemsMap.values()).sort((a, b) => {
                const dateA = a.timestamp.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp as any).getTime();
                const dateB = b.timestamp.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp as any).getTime();
                return dateB - dateA;
            });

            setCustomerItems(combinedItems);
        } catch (error) {
            console.error("Error fetching customer items:", error);
            setCustomerItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [firestore, selectedFavoriteId, currentMonth, currentYear, savedFavorites]);


    useEffect(() => {
        fetchCustomerItems();
    }, [fetchCustomerItems]);

    const totalPeriodo = useMemo(() => {
        return customerItems.reduce((acc, item) => acc + item.total, 0);
    }, [customerItems]);
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Relatório Mensal por Cliente</CardTitle>
                <CardDescription>Selecione um cliente e um período para ver o histórico de consumo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="cliente-select">Cliente</Label>
                        <Select value={selectedFavoriteId} onValueChange={setSelectedFavoriteId}>
                            <SelectTrigger id="cliente-select">
                                <SelectValue placeholder="Selecione um cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {savedFavorites.map(fav => (
                                    <SelectItem key={fav.id} value={fav.id}>{fav.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="report-month">Mês</Label>
                         <Select value={currentMonth} onValueChange={setCurrentMonth}>
                            <SelectTrigger id="report-month">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="report-year">Ano</Label>
                         <Select value={currentYear} onValueChange={setCurrentYear}>
                            <SelectTrigger id="report-year">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : !selectedFavoriteId ? (
                     <div className="text-center text-muted-foreground p-10">
                        <User className="mx-auto h-8 w-8 mb-2"/>
                        <p>Por favor, selecione um cliente para começar.</p>
                    </div>
                ) : customerItems.length === 0 ? (
                    <div className="text-center text-muted-foreground p-10">
                        <ShoppingBag className="mx-auto h-8 w-8 mb-2"/>
                        <p>Nenhum lançamento encontrado para este cliente no período selecionado.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center bg-muted p-3 rounded-t-lg">
                            <h3 className="font-semibold">Lançamentos de {savedFavorites.find(f => f.id === selectedFavoriteId)?.name}</h3>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total no Período</p>
                                <p className="font-bold text-lg text-primary">{formatCurrency(totalPeriodo)}</p>
                            </div>
                        </div>
                        <ScrollArea className="h-96 rounded-b-lg border">
                            <div className="divide-y">
                            {customerItems.map(item => (
                                <div key={item.id} className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-xs font-semibold text-muted-foreground">{formatTimestamp(item.timestamp)}</p>
                                        <p className="font-bold text-primary">{formatCurrency(item.total)}</p>
                                    </div>
                                    <div className="pl-2">
                                        {renderItemName(item)}
                                    </div>
                                </div>
                            ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
