
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { DailyReport } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import HistoryReportDetail from '@/components/history-report-detail';

export default function HistoryPage() {
  const firestore = useFirestore();
  const reportsRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'daily_reports'), orderBy('timestamp', 'desc')) : null),
    [firestore]
  );
  const { data: reports, isLoading, error } = useCollection<DailyReport>(reportsRef);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-8 text-center text-destructive">
        <h1 className="text-2xl font-bold">Erro ao Carregar Histórico</h1>
        <p>Não foi possível buscar os relatórios salvos.</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <Link href="/" passHref>
            <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
        </Link>
      </div>
    );
  }

  if (selectedReport) {
    return (
      <HistoryReportDetail 
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Histórico de Relatórios</h1>
         <Link href="/" passHref>
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
        </Link>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card 
                key={report.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedReport(report)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg sm:text-xl">
                  <span>{formatDate(report.timestamp)}</span>
                  <span className="text-primary">{formatCurrency(report.reportData.totalFaturamento)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                <p>À Vista: <span className="font-mono text-foreground">{formatCurrency(report.reportData.totalAVista)}</span></p>
                <p>Fiado: <span className="font-mono text-destructive">{formatCurrency(report.reportData.totalFiado)}</span></p>
                <p>Refeições: <span className="font-mono text-foreground">{report.reportData.totalMealItems}</span></p>
                <p>Bomboniere: <span className="font-mono text-foreground">{formatCurrency(report.reportData.totalBomboniereValue)}</span></p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-16">
          <p>Nenhum relatório salvo encontrado.</p>
        </div>
      )}
    </div>
  );
}

    