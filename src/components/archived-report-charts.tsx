'use client';

import type { Item } from '@/types';
import DailyTimelineChart from './daily-timeline-chart';
import { Separator } from './ui/separator';

interface ArchivedReportChartsProps {
    items: Item[];
}

export default function ArchivedReportCharts({ items }: ArchivedReportChartsProps) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4 text-center">Linha do Tempo do Dia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DailyTimelineChart items={items} dataType="total" title="Valor (R$) x Hora" color="primary" />
                <DailyTimelineChart items={items} dataType="quantity" title="Itens x Hora" color="chart-2" />
            </div>
        </div>
    );
}
