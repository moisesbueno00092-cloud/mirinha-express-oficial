
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Save, Loader2, Search } from 'lucide-react';
import type { Fornecedor } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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

interface FornecedoresEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
}

type EditableFornecedor = Fornecedor;

const PROTECTED_IDS = ['delivery_fees_provider', 'extra_expenses_provider'];

export default function FornecedoresEditModal({ isOpen, onClose, fornecedores: initialFornecedores }: FornecedoresEditModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [fornecedores, setFornecedores] = useState<EditableFornecedor[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<EditableFornecedor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [originalNames, setOriginalNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const sorted = [...initialFornecedores].sort((a,b) => a.nome.localeCompare(b.nome));
      setFornecedores(sorted);
      setOriginalNames(Object.fromEntries(sorted.map(f => [f.id, f.nome])));
      setSearchTerm("");
    }
  }, [isOpen, initialFornecedores]);

  const filteredFornecedores = useMemo(() => {
    if (!searchTerm) return fornecedores;
    
    return fornecedores.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [fornecedores, searchTerm]);


  const handleNameChange = (id: string, newName: string) => {
    setFornecedores(prev => prev.map(f => f.id === id ? {...f, nome: newName} : f));
  };

  const handleDeleteRequest = (fornecedor: EditableFornecedor) => {
      setFornecedorToDelete(fornecedor);
  }

  const confirmDelete = async () => {
      if (!firestore || !fornecedorToDelete || !fornecedorToDelete.id) return;
      
      if (PROTECTED_IDS.includes(fornecedorToDelete.id)) {
        toast({ variant: 'destructive', title: "Ação não permitida", description: "Não pode apagar fornecedores protegidos do sistema."});
        setFornecedorToDelete(null);
        return;
      }
      const docRef = doc(firestore, 'fornecedores', fornecedorToDelete.id);
      await deleteDoc(docRef);
      toast({ title: "Sucesso", description: `"${fornecedorToDelete.nome}" foi removido.`});
      setFornecedorToDelete(null);
  }

  const handleSaveAll = async () => {
      if (!firestore) return;
      setIsProcessing(true);

      const batch = writeBatch(firestore);
      let hasError = false;

      for (const fornecedor of fornecedores) {
          const originalName = originalNames[fornecedor.id];
          if (fornecedor.nome !== originalName) {
            if (!fornecedor.nome.trim()) {
                toast({ variant: 'destructive', title: 'Erro de Validação', description: `O fornecedor com o nome original "${originalName}" não pode ter um nome em branco.`});
                hasError = true;
                break;
            }
            const docRef = doc(firestore, 'fornecedores', fornecedor.id);
            // Only update name, not color
            batch.update(docRef, { nome: fornecedor.nome.trim() });
          }
      }
      
      if (!hasError) {
        try {
          await batch.commit();
          toast({ title: "Sucesso", description: "Nomes dos fornecedores atualizados." });
          onClose();
        } catch (error) {
          console.error("Error saving fornecedores:", error);
          toast({ variant: 'destructive', title: "Erro ao Salvar", description: "Não foi possível atualizar os fornecedores." });
        }
      }
      
      setIsProcessing(false);
  };
  

  return (
    <>
      <AlertDialog open={!!fornecedorToDelete} onOpenChange={(open) => !open && setFornecedorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O fornecedor "{fornecedorToDelete?.nome}" será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle className="text-center">Gerir Fornecedores</DialogTitle>
            </DialogHeader>
            
            <div className="relative px-2">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <ScrollArea className="h-80 -mx-6">
              <div className="px-6 divide-y divide-border">
                {filteredFornecedores.map((fornecedor) => (
                    <div key={fornecedor.id} className="flex items-center gap-x-4 py-2">
                        <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: fornecedor.color }}></div>
                        <Input
                            value={fornecedor.nome}
                            onChange={(e) => handleNameChange(fornecedor.id, e.target.value)}
                            placeholder="Nome do Fornecedor"
                            className="flex-grow"
                            disabled={PROTECTED_IDS.includes(fornecedor.id)}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleDeleteRequest(fornecedor)}
                            disabled={PROTECTED_IDS.includes(fornecedor.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSaveAll} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
