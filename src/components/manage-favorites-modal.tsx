'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FavoriteClient } from '@/types';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface ManageFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteClients: FavoriteClient[];
}

interface FormData {
    name: string;
    command: string;
}

export default function ManageFavoritesModal({ isOpen, onClose, favoriteClients }: ManageFavoritesModalProps) {
    const firestore = useFirestore();
    const favoriteClientsRef = useMemoFirebase(() => collection(firestore, 'favorite_clients'), [firestore]);
  
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({ name: '', command: '' });

    useEffect(() => {
        // Reset state when the modal is opened
        if (isOpen) {
            setClientToDelete(null);
            setEditingClientId(null);
            setFormData({ name: '', command: '' });
        }
    }, [isOpen]);
  
    const handleSave = () => {
        if (!firestore) return;
        const { name, command } = formData;
        if (!name.trim() || !command.trim()) return;

        if (editingClientId) {
            const docRef = doc(firestore, 'favorite_clients', editingClientId);
            updateDocumentNonBlocking(docRef, formData);
        } else {
            addDocumentNonBlocking(favoriteClientsRef, formData);
        }
        
        setEditingClientId(null);
        setFormData({ name: '', command: '' });
    };

    const handleEditClick = (client: FavoriteClient) => {
        setEditingClientId(client.id);
        setFormData({ name: client.name, command: client.command });
    }
  
    const handleDeleteRequest = (id: string) => {
      setClientToDelete(id);
    };
  
    const confirmDelete = () => {
      if (clientToDelete && firestore) {
        const docRef = doc(firestore, 'favorite_clients', clientToDelete);
        deleteDocumentNonBlocking(docRef);
        setClientToDelete(null);
      }
    };
  
    const sortedClients = useMemo(() => 
      [...favoriteClients].sort((a, b) => a.name.localeCompare(b.name)),
      [favoriteClients]
    );
    
    const isFormValid = formData.name.trim() && formData.command.trim();

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md flex flex-col">
          <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente dos seus favoritos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
  
          <DialogHeader>
            <DialogTitle>Gerenciar Clientes Favoritos</DialogTitle>
          </DialogHeader>

          <div className="flex-grow overflow-hidden">
            <ScrollArea className="h-full">
                <div className="space-y-3 pr-6">
                {sortedClients.map((client) => (
                    <Card key={client.id}>
                    <CardContent className="p-3 flex items-center">
                        <div className="flex-grow">
                        <p className="font-semibold">{client.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{client.command}</p>
                        </div>
                        <div className="flex">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(client)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRequest(client.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                    </CardContent>
                    </Card>
                ))}
                 {sortedClients.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Nenhum cliente favorito adicionado.</p>
                    </div>
                 )}
                </div>
            </ScrollArea>
          </div>
          
          <div className="flex-shrink-0 pt-4 border-t">
              <div className="p-1 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold text-center text-sm">
                      {editingClientId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
                  </h3>
                  <div className="space-y-1">
                      <Label htmlFor="form-name" className="text-xs">Nome</Label>
                      <Input
                          id="form-name"
                          placeholder="Ex: João da Silva"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                          className="h-8"
                      />
                  </div>
                  <div className="space-y-1">
                      <Label htmlFor="form-command" className="text-xs">Comando</Label>
                      <Input
                          id="form-command"
                          placeholder="Ex: pf coquinha-200ml"
                          value={formData.command}
                          onChange={(e) => setFormData(prev => ({...prev, command: e.target.value}))}
                          className="h-8"
                      />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                       {editingClientId && (
                           <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingClientId(null); setFormData({name: '', command: ''}); }}>
                                <X className="h-4 w-4 mr-1" />
                                Cancelar Edição
                           </Button>
                       )}
                      <Button type="button" size="sm" onClick={handleSave} disabled={!isFormValid}>
                          <Save className="h-4 w-4 mr-2" /> Salvar
                      </Button>
                  </div>
              </div>
          </div>
  
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button className="w-full" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
