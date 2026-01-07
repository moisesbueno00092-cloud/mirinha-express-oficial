
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MinusCircle, Plus, Pencil } from 'lucide-react';
import type { BomboniereItem, SelectedBomboniereItem } from '@/types';
import { cn } from '@/lib/utils';
import StockEditModal from './stock-edit-modal';
import PasswordDialog from './password-dialog';

interface BomboniereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: SelectedBomboniereItem[]) => void;
  bomboniereItems: BomboniereItem[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

const getStockColor = (stock: number) => {
    if (stock <= 5) return 'text-destructive';
    if (stock <= 20) return 'text-yellow-500';
    if (stock <= 30) return 'text-blue-500';
    return 'text-muted-foreground';
};

export default function BomboniereModal({ isOpen, onClose, onAddItems, bomboniereItems }: BomboniereModalProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isStockEditModalOpen, setStockEditModalOpen] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<{ open: boolean, onSuccess: () => void, onCancel?: () => void } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedItems({});
      setSearchTerm('');
    }
  }, [isOpen]);
  
  const filteredBomboniereItems = useMemo(() => {
    return bomboniereItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [bomboniereItems, searchTerm]);

  const handlePasswordSuccess = () => {
    if (passwordPrompt?.onSuccess) {
      try {
        sessionStorage.setItem('admin-authenticated', 'true');
      } catch(e) {
          console.error("Could not write to sessionStorage:", e);
      }
      passwordPrompt.onSuccess();
    }
    setPasswordPrompt(null);
  };

  const handleProtectedAction = (callback: () => void) => {
    try {
      const sessionAuth = sessionStorage.getItem('admin-authenticated');
      if (sessionAuth === 'true') {
        callback();
        return;
      }
    } catch(e) {
      console.error("Could not read sessionStorage:", e);
    }
    
    setPasswordPrompt({ 
        open: true, 
        onSuccess: callback,
        onCancel: () => setPasswordPrompt(null)
    });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setSelectedItems(prev => {
      const currentQuantity = prev[itemId] || 0;
      const newQuantity = Math.max(0, currentQuantity + delta);
      if (newQuantity === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const handleAddClick = () => {
    const itemsToAdd: SelectedBomboniereItem[] = Object.entries(selectedItems)
      .map(([itemId, quantity]) => {
        const item = bomboniereItems.find(i => i.id === itemId);
        if (!item) return null;
        return { id: item.id, name: item.name, price: item.price, quantity };
      })
      .filter((i): i is SelectedBomboniereItem => i !== null);
    
    onAddItems(itemsToAdd);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (Object.keys(selectedItems).length > 0) {
            handleAddClick();
        }
    }
  }

  const renderHeader = () => (
    <DialogHeader className="flex-row items-center justify-between">
        <DialogTitle className="flex-grow text-center">Bomboniere</DialogTitle>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleProtectedAction(() => setStockEditModalOpen(true))}>
            <Pencil className="h-4 w-4" />
        </Button>
    </DialogHeader>
  );
  
  return (
    <>
        <StockEditModal
            isOpen={isStockEditModalOpen}
            onClose={() => setStockEditModalOpen(false)}
            bomboniereItems={bomboniereItems || []}
        />
        
        {passwordPrompt && (
          <PasswordDialog
            open={passwordPrompt.open}
            onOpenChange={(isOpen) => {
                if(!isOpen && passwordPrompt.onCancel) {
                    passwordPrompt.onCancel();
                }
            }}
            onSuccess={handlePasswordSuccess}
            onCancel={passwordPrompt.onCancel}
            showCancel={!!passwordPrompt.onCancel}
          />
        )}

        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
              {renderHeader()}
              
              <div className="px-1 pt-2 pb-1">
                  <Input 
                      placeholder="Buscar item..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-9"
                      autoFocus
                  />
              </div>

              <ScrollArea className="h-80 -mx-6">
                  <div className="divide-y divide-border">
                  {filteredBomboniereItems.map((item) => (
                      <div key={item.id} className="flex items-center p-2">
                          <div className="flex-grow pr-4">
                              <p className="font-semibold">{item.name}</p>
                              <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                              <p className={cn("text-xs font-bold", getStockColor(item.estoque))}>(Estq: {item.estoque})</p>
                              </div>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                              {selectedItems[item.id] > 0 ? (
                              <>
                                  <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-full"
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  >
                                  <MinusCircle className="h-6 w-6 text-destructive" />
                                  </Button>
                                  <span className="text-lg font-bold w-6 text-center tabular-nums">{selectedItems[item.id]}</span>
                                  <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-full"
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  >
                                  <PlusCircle className="h-6 w-6 text-primary" />
                                  </Button>
                              </>
                              ) : (
                              <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-full"
                                  onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                  <Plus className="h-5 w-5" />
                              </Button>
                              )}
                          </div>
                      </div>
                  ))}
                  </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                  <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleAddClick} disabled={Object.keys(selectedItems).length === 0}>
                  Adicionar Itens
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  );
}
