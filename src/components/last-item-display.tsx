
"use client";

import type { Item } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { groupBadgeStyles, renderItemName } from "@/components/item-list";

interface LastItemDisplayProps {
    data: { item: Item, title: string } | null;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export default function LastItemDisplay({ data }: LastItemDisplayProps) {
    if (!data) {
        return null;
    }
    
    const { item, title } = data;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
            <Card className="shadow-2xl animate-in slide-in-from-bottom-5 fade-in-50">
                <CardHeader className="flex-row items-center justify-between p-3">
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                        <div className="flex flex-col gap-1.5">
                            {renderItemName(item)}
                            <Badge className={cn("whitespace-nowrap w-fit", groupBadgeStyles[item.group] || "bg-gray-500")}>
                                {item.group}
                            </Badge>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-xl text-primary">{formatCurrency(item.total)}</div>
                            {item.deliveryFee > 0 && <div className="text-xs text-muted-foreground">Taxa: {formatCurrency(item.deliveryFee)}</div>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
