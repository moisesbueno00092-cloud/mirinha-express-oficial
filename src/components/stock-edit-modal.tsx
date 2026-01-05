
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Save, Loader2, Search } from 'lucide-react';
import type { BomboniereItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { collection, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import usePersistentState from '@/hooks/use-persistent-state';


interface StockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  bomboniereItems: BomboniereItem[];
}

type EditableItem = BomboniereItem;

const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);
        return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delay]);
};


export default function StockEditModal({ isOpen, onClose, bomboniereItems: initialItems }: StockEditModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [localItems, setLocalItems] = useState<EditableItem[]>([]);
  const [debouncedItems, setDebouncedItems] = useState<EditableItem[]>([]);
  const [itemToDelete, setItemToDelete] = useState<EditableItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      const sortedItems = [...initialItems].sort((a,b) => a.name.localeCompare(b.name));
      setLocalItems(sortedItems);
      setDebouncedItems(sortedItems);
    }
  }, [isOpen, initialItems]);

  useDebouncedEffect(() => {
    setDebouncedItems(localItems);
  }, [localItems], 500); // 500ms debounce delay


  useEffect(() => {
      if (!firestore || !isOpen) return;

      const changedItems = debouncedItems.filter(debouncedItem => {
          const originalItem = initialItems.find(item => item.id === debouncedItem.id);
          if (!originalItem) return false; // Should not happen for existing items
          return (
              originalItem.name !== debouncedItem.name ||
              originalItem.price !== debouncedItem.price ||
              originalItem.estoque !== debouncedItem.estoque
          );
      });

      if (changedItems.length > 0) {
          changedItems.forEach(item => {
              if (item.id) {
                const docRef = doc(firestore, 'bomboniere_items', item.id);
                updateDocumentNonBlocking(docRef, {
                    name: item.name,
                    price: item.price,
                    estoque: item.estoque
                });
              }
          });
      }
  }, [debouncedItems, firestore, initialItems, isOpen]);


  const filteredItems = useMemo(() => {
    const itemsToFilter = localItems || [];
    if (!searchTerm) return itemsToFilter;
    
    return itemsToFilter.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localItems, searchTerm]);


  const handleFieldChange = (id: string, field: keyof EditableItem, value: string | number) => {
    setLocalItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const finalValue = (field === 'price' || field === 'estoque') 
            ? (String(value).trim() === '' ? 0 : parseFloat(String(value).replace(',', '.')))
            : value;
          
          if(isNaN(finalValue as number)) return item;
          
          return { ...item, [field]: finalValue };
        }
        return item;
      })
    );
  };
  
  const handleAddNewItem = () => {
    if (!firestore) return;
    const newItemData = { name: 'Novo Item', price: 0, estoque: 0 };
    addDocumentNonBlocking(collection(firestore, "bomboniere_items"), newItemData);

    toast({ title: "Item Adicionado", description: "Um 'Novo Item' foi criado. Por favor, edite-o."});

    setTimeout(() => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
      }
    }, 500); // Give time for the new item to be received from Firestore and rendered
  };

  const handleDeleteRequest = (item: EditableItem) => {
      setItemToDelete(item);
  }

  const confirmDelete = () => {
      if (!firestore || !itemToDelete || !itemToDelete.id) return;
      const docRef = doc(firestore, 'bomboniere_items', itemToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Sucesso", description: `"${itemToDelete.name}" foi removido.`});
      setItemToDelete(null);
  }
  

  return (
    <>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O item "{itemToDelete?.name}" será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-center">Gerir Estoque da Bomboniere (Tempo Real)</DialogTitle>
            </DialogHeader>
            
            <div className="relative px-2">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-2 font-semibold text-sm text-muted-foreground">
              <span>Nome do Item</span>
              <span className="text-right">Preço (R$)</span>
              <span className="text-right">Estoque</span>
              <span />
            </div>

            <ScrollArea className="h-80 -mx-6">
              <div className="px-6 divide-y divide-border">
                {filteredItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-x-4 py-2">
                        <Input
                            defaultValue={item.name}
                            onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                            placeholder="Nome do Item"
                        />
                        <Input
                           defaultValue={String(item.price).replace('.', ',')}
                           onChange={(e) => handleFieldChange(item.id, 'price', e.target.value.replace(/[^0-9,]/g, ''))}
                           className="text-right"
                           placeholder="0,00"
                        />
                        <Input
                            defaultValue={String(item.estoque)}
                             onChange={(e) => handleFieldChange(item.id, 'estoque', e.target.value.replace(/[^0-9]/g, ''))}
                            type="text"
                            className="text-right"
                            placeholder="0"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteRequest(item)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  )
                )}
              </div>
            </ScrollArea>
            
            <div className="px-6 mt-2">
                <Button variant="outline" className="w-full" onClick={handleAddNewItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Novo Item
                </Button>
            </div>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                  <Button variant="outline">Fechar</Button>
              </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    