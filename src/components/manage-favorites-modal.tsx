
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
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FavoriteClient } from '@/types';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';


interface ManageFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteClients: FavoriteClient[];
}

function FavoriteForm({
    selectedClient,
    onSave,
    onClearSelection,
  }: {
    selectedClient: FavoriteClient | null;
    onSave: (id: string | null, data: { name: string; command: string }) => void;
    onClearSelection: () => void;
  }) {
    const [formData, setFormData] = useState({ name: '', command: '' });
  
    useEffect(() => {
      if (selectedClient) {
        setFormData({ name: selectedClient.name, command: selectedClient.command });
      } else {
        setFormData({ name: '', command: '' });
      }
    }, [selectedClient]);
  
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formData.name || !formData.command) return;
      onSave(selectedClient?.id || null, formData);
      setFormData({ name: '', command: '' }); // Reset form after saving
    };
  
    return (
      <form onSubmit={handleSubmit} className="p-4 bg-muted/50 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-center">
            {selectedClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
          </h3>
          {selectedClient && (
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="form-name">Nome do Cliente</Label>
          <Input id="form-name" name="name" placeholder="Ex: João da Silva" required value={formData.name} onChange={handleFormChange} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="form-command">Comando de Lançamento</Label>
          <Input id="form-command" name="command" placeholder="Ex: pf coquinha" required value={formData.command} onChange={handleFormChange} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" size="sm" disabled={!formData.name || !formData.command}>
            <Save className="h-4 w-4 mr-2" /> Salvar
          </Button>
        </div>
      </form>
    );
}

export default function ManageFavoritesModal({ isOpen, onClose, favoriteClients }: ManageFavoritesModalProps) {
    const firestore = useFirestore();
    const favoriteClientsRef = useMemoFirebase(() => collection(firestore, 'favorite_clients'), [firestore]);
  
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
    const handleSave = (id: string | null, data: { name: string; command: string }) => {
      if (!firestore) return;
  
      if (id) {
        // Editing existing client
        const docRef = doc(firestore, 'favorite_clients', id);
        updateDocumentNonBlocking(docRef, data);
      } else {
        // Adding new client
        addDocumentNonBlocking(favoriteClientsRef, data);
      }
      setSelectedClientId(null); // Clear selection after save
    };
  
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
  
    const handleModalOpenChange = (open: boolean) => {
      if (!open) {
        setSelectedClientId(null); // Reset state when closing
        onClose();
      }
    };
  
    const sortedClients = useMemo(() => 
      [...favoriteClients].sort((a, b) => a.name.localeCompare(b.name)),
      [favoriteClients]
    );
  
    const selectedClient = useMemo(() => 
        sortedClients.find(c => c.id === selectedClientId) || null,
        [selectedClientId, sortedClients]
    );
  
    return (
      <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-md">
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
  
          <ScrollArea className="h-72 -mx-6 px-6">
            <div className="space-y-3">
              {sortedClients.map((client) => (
                <Card key={client.id} className={cn(client.id === selectedClientId && 'border-primary')}>
                  <CardContent className="p-3 flex items-center">
                    <div className="flex-grow">
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{client.command}</p>
                    </div>
                    <div className="flex">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedClientId(client.id)}>
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
            </div>
          </ScrollArea>
  
          <FavoriteForm
            selectedClient={selectedClient}
            onSave={handleSave}
            onClearSelection={() => setSelectedClientId(null)}
          />
  
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button className="w-full">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
