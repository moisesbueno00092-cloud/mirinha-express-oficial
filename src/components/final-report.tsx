
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportData {
    totalAVista: number;
    totalFiado: number;
    totalGeral: number;
}

interface FinalReportProps {
  report: ReportData;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

export default function FinalReport({ report }: FinalReportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório Final</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
            <p className="font-medium">Total à Vista:</p>
            <p className="font-bold text-lg text-foreground">{formatCurrency(report.totalAVista)}</p>
        </div>
        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
            <p className="font-medium text-destructive">Total Fiado:</p>
            <p className="font-bold text-lg text-destructive">{formatCurrency(report.totalFiado)}</p>
        </div>
        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-md border border-primary/20">
            <p className="font-bold text-primary">FATURAMENTO TOTAL:</p>
            <p className="font-extrabold text-2xl text-primary">{formatCurrency(report.totalGeral)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
