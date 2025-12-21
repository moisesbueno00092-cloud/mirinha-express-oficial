
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { useToast } from "@/hooks/use-toast";
import type { FavoriteClient } from '@/types';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Trash2, User } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteClients: FavoriteClient[];
}

export default function SettingsModal({ isOpen, onClose, favoriteClients }: SettingsModalProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<FavoriteClient | null>(null);

  const handleClearFavorites = () => {
    if (!firestore || !favoriteClients) return;

    try {
      favoriteClients.forEach(client => {
        const docRef = doc(firestore, "favorite_clients", client.id);
        deleteDocumentNonBlocking(docRef);
      });
      toast({
        title: "Sucesso",
        description: "Todos os favoritos foram apagados.",
      });
    } catch (error) {
      console.error("Error clearing favorites:", error);
      toast({
        variant: "destructive",
        title: "Erro ao limpar favoritos",
        description: "Ocorreu um problema ao apagar os clientes favoritos.",
      });
    } finally {
        setIsClearConfirmOpen(false);
        onClose();
    }
  };
  
  const handleDeleteClient = () => {
      if (!firestore || !clientToDelete) return;
      const docRef = doc(firestore, 'favorite_clients', clientToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({
          title: 'Favorito Removido',
          description: `O cliente "${clientToDelete.name}" foi excluído.`
      });
      setClientToDelete(null);
  }

  return (
    <>
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente todos os seus clientes favoritos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearFavorites}>Confirmar Exclusão Total</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{clientToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente este cliente favorito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
            <DialogDescription>
              Gerencie as configurações e dados do seu aplicativo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">

            <div>
                <h3 className="font-semibold mb-2">Gerenciar Clientes Favoritos</h3>
                <ScrollArea className="h-64 border rounded-md p-2">
                    {favoriteClients.length > 0 ? (
                        <div className="space-y-2">
                            {favoriteClients.map(client => (
                                <div key={client.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-sm">{client.name}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-xs">{client.command}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => setClientToDelete(client)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            <p>Nenhum cliente favorito salvo.</p>
                        </div>
                    )}
                </ScrollArea>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Zona de Perigo</h3>
              <div className="p-4 border border-destructive/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Limpar Clientes Favoritos</p>
                  <p className="text-xs text-muted-foreground">
                    Remove todos os clientes salvos para lançamentos rápidos.
                  </p>
                </div>
                <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setIsClearConfirmOpen(true)}
                    disabled={favoriteClients.length === 0}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Zerar Tudo
                </Button>
              </div>
            </div>

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
