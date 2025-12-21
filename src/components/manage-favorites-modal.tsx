
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

interface FormData {
    name: string;
    command: string;
}

const FavoriteForm = ({
  formData,
  setFormData,
  onSave,
  onCancel,
  isEditing,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}) => {
  const isFormValid = formData.name.trim() && formData.command.trim();

  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
        <h3 className="font-semibold text-center">
            {isEditing ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
        </h3>
        <div className="space-y-1">
            <Label htmlFor="form-name">Nome do Cliente</Label>
            <Input
                id="form-name"
                placeholder="Ex: João da Silva"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            />
        </div>
        <div className="space-y-1">
            <Label htmlFor="form-command">Comando de Lançamento</Label>
            <Input
                id="form-command"
                placeholder="Ex: pf coquinha"
                required
                value={formData.command}
                onChange={(e) => setFormData(prev => ({...prev, command: e.target.value}))}
            />
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button type="button" size="sm" onClick={onSave} disabled={!isFormValid}>
                <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
        </div>
    </div>
  );
};


export default function ManageFavoritesModal({ isOpen, onClose, favoriteClients }: ManageFavoritesModalProps) {
    const firestore = useFirestore();
    const favoriteClientsRef = useMemoFirebase(() => collection(firestore, 'favorite_clients'), [firestore]);
  
    const [view, setView] = useState<'list' | 'form'>('list');
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({ name: '', command: '' });

    useEffect(() => {
        if (isOpen) {
            setView('list');
            setSelectedClientId(null);
            setFormData({ name: '', command: '' });
        }
    }, [isOpen]);
  
    const handleSave = () => {
        if (!firestore) return;

        if (selectedClientId) {
            const docRef = doc(firestore, 'favorite_clients', selectedClientId);
            updateDocumentNonBlocking(docRef, formData);
        } else {
            addDocumentNonBlocking(favoriteClientsRef, formData);
        }
        
        setView('list');
        setSelectedClientId(null);
        setFormData({ name: '', command: '' });
    };

    const handleEditClick = (client: FavoriteClient) => {
        setSelectedClientId(client.id);
        setFormData({ name: client.name, command: client.command });
        setView('form');
    }
    
    const handleAddNewClick = () => {
        setSelectedClientId(null);
        setFormData({ name: '', command: '' });
        setView('form');
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

    const renderList = () => (
        <>
            <ScrollArea className="h-72 -mx-6 px-6">
                <div className="space-y-3">
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
                </div>
            </ScrollArea>
             <Button variant="outline" className="w-full mt-4" onClick={handleAddNewClick}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Cliente
            </Button>
        </>
    );

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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

          {view === 'list' ? renderList() : (
            <FavoriteForm
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                onCancel={() => setView('list')}
                isEditing={!!selectedClientId}
            />
          )}
  
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button className="w-full" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

    