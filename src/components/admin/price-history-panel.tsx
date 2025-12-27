
'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EntradaMercadoria, Fornecedor } from '@/types';

import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

const formatDate = (dateString: string) => {
    try {
        return format(new Date(dateString), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
        return dateString;
    }
}

export default function PriceHistoryPanel() {
    const firestore = useFirestore();

    const allEntradasQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'entradas_mercadorias'), orderBy('data', 'desc')) : null,
        [firestore]
    );

    const { data: allEntradas, isLoading: isLoadingAllEntradas } = useCollection<EntradaMercadoria>(allEntradasQuery);
    
    const fornecedoresQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'fornecedores')) : null,
        [firestore]
    );

    const { data: fornecedores, isLoading: isLoadingFornecedores } = useCollection<Fornecedor>(fornecedoresQuery);

    const fornecedorMap = useMemo(() => {
        if (!fornecedores) return new Map<string, string>();
        return new Map(fornecedores.map(f => [f.id, f.nome]));
    }, [fornecedores]);

    const priceHistory = useMemo(() => {
        if (!allEntradas) return [];
        return allEntradas.map(e => ({
            ...e,
            fornecedorNome: fornecedorMap.get(e.fornecedorId) || 'Desconhecido'
        }));
    }, [allEntradas, fornecedorMap]);

    const isLoading = isLoadingAllEntradas || isLoadingFornecedores;

    return (
        <div className="space-y-6">
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Preço Unitário</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </TableCell>
                        </TableRow>
                    ) : priceHistory.length > 0 ? (
                        priceHistory.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{formatDate(entry.data)}</TableCell>
                                <TableCell className="font-medium">{entry.produtoNome}</TableCell>
                                <TableCell>{entry.fornecedorNome}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(entry.precoUnitario)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                Nenhum histórico de compras encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
