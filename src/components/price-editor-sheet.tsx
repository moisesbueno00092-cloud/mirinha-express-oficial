'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PREDEFINED_PRICES, DELIVERY_FEE } from '@/lib/constants';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface PriceEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrices: Record<string, number>;
  initialFee: number;
  onSave: (newPrices: Record<string, number>, newFee: number) => void;
}

const formatCurrencyForInput = (value: number) => {
  return String(value.toFixed(2)).replace('.', ',');
};

export default function PriceEditorSheet({ 
    isOpen, 
    onClose, 
    initialPrices, 
    initialFee,
    onSave 
}: PriceEditorSheetProps) {
  const { toast } = useToast();
  const [prices, setPrices] = useState(initialPrices);
  const [deliveryFee, setDeliveryFee] = useState(initialFee);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrices(initialPrices);
      setDeliveryFee(initialFee);
    }
  }, [isOpen, initialPrices, initialFee]);

  const handlePriceChange = (key: string, value: string) => {
    const numericValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numericValue)) {
      setPrices(prev => ({ ...prev, [key]: numericValue }));
    }
  };

  const handleFeeChange = (value: string) => {
    const numericValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numericValue)) {
      setDeliveryFee(numericValue);
    }
  };
  
  const handleResetDefaults = () => {
    setPrices(PREDEFINED_PRICES);
    setDeliveryFee(DELIVERY_FEE);
    toast({
        title: "Valores Restaurados",
        description: "Os preços padrão foram carregados. Clique em salvar para aplicar.",
    })
  }

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save delay
    setTimeout(() => {
        onSave(prices, deliveryFee);
        setIsSaving(false);
        toast({
            title: "Preços Salvos!",
            description: "Os novos preços e a taxa de entrega foram guardados.",
        });
        onClose();
    }, 500);
  };
  
  const sortedPriceKeys = Object.keys(PREDEFINED_PRICES).sort();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Editor de Preços e Taxas</SheetTitle>
          <SheetDescription>
            Ajuste os valores padrão para os itens pré-definidos e a taxa de entrega. Os valores são guardados localmente no seu navegador.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-14rem)] pr-4 mt-4">
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="deliveryFee">Taxa de Entrega Padrão (R$)</Label>
                    <Input
                        id="deliveryFee"
                        value={formatCurrencyForInput(deliveryFee)}
                        onChange={(e) => handleFeeChange(e.target.value)}
                        className="font-mono text-right"
                    />
                </div>
                
                <h3 className="text-lg font-semibold pt-4">Preços dos Itens</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {sortedPriceKeys.map(key => (
                        <div key={key} className="space-y-1">
                            <Label htmlFor={`price-${key}`}>{key}</Label>
                             <Input
                                id={`price-${key}`}
                                value={formatCurrencyForInput(prices[key] || 0)}
                                onChange={(e) => handlePriceChange(key, e.target.value)}
                                className="font-mono text-right"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>

        <SheetFooter className='pt-4'>
            <Button variant="ghost" onClick={handleResetDefaults} className="mr-auto">
                <RotateCcw className="mr-2 h-4 w-4"/>
                Restaurar Padrão
            </Button>
            <SheetClose asChild>
                <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Salvar
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
