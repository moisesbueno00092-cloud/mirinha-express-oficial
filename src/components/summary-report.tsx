
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportData {
  totalMarmitas: number;
  totalKg: number;
  totalBomboniere: number;
  totalTaxas: number;
  totalItens: number;
  totalPedidos: number;
}

interface SummaryReportProps {
  report: ReportData;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

export default function SummaryReport({ report }: SummaryReportProps) {
    const summaryItems = [
        { label: 'Total de Marmitas', value: report.totalMarmitas },
        { label: 'Total de KG', value: report.totalKg },
        { label: 'Total de Bomboniere', value: report.totalBomboniere },
        { label: 'Total de Taxas', value: formatCurrency(report.totalTaxas) },
        { label: 'Total de Itens', value: report.totalItens },
        { label: 'Total de Pedidos', value: report.totalPedidos },
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            {summaryItems.map(item => (
                 <div key={item.label} className="flex justify-between items-center text-sm">
                    <p className="text-muted-foreground">{item.label}</p>
                    <p className="font-semibold">{item.value}</p>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
