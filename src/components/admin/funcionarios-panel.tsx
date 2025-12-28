
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Funcionario } from '@/types';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Trash2, Save, UserPlus, Users, DollarSign } from 'lucide-react';
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
import { Separator } from '../ui/separator';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

type EditableFuncionario = Omit<Funcionario, 'id' | 'salario'> & {
    id?: string;
    salario: string | number;
};

export default function FuncionariosPanel() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [editableFuncionarios, setEditableFuncionarios] = useState<EditableFuncionario[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [funcionarioToDelete, setFuncionarioToDelete] = useState<EditableFuncionario | null>(null);

    const funcionariosQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'funcionarios'), orderBy('nome', 'asc')) : null,
        [firestore]
    );

    const { data: funcionarios, isLoading } = useCollection<Funcionario>(funcionariosQuery);

    useState(() => {
        if (funcionarios) {
            setEditableFuncionarios(funcionarios.map(f => ({ ...f, salario: f.salario ?? 0 })));
        }
    }, [funcionarios]);
    
    // This effect ensures that when the live data from firestore changes (e.g., another user adds/deletes),
    // the local editable state is updated, but it preserves the current unsaved new rows.
    useState(() => {
        if (funcionarios) {
            const newUnsaved = editableFuncionarios.filter(ef => !ef.id);
            const updatedFromDb = funcionarios.map(f => ({ ...f, salario: f.salario ?? 0 }));
            setEditableFuncionarios([...updatedFromDb, ...newUnsaved]);
        }
    }, [funcionarios]);


    const totalSalarios = useMemo(() => {
        return funcionarios?.reduce((acc, func) => acc + func.salario, 0) || 0;
    }, [funcionarios]);

    const handleFieldChange = (index: number, field: keyof EditableFuncionario, value: string) => {
        const newFuncionarios = [...editableFuncionarios];
        const funcionario = newFuncionarios[index];

        if (field === 'salario') {
            const numericValue = value.replace(',', '.');
            if (!isNaN(parseFloat(numericValue)) || numericValue === '') {
                (funcionario[field] as any) = numericValue;
            }
        } else {
            (funcionario[field] as any) = value;
        }
        setEditableFuncionarios(newFuncionarios);
    };

    const handleAddNewRow = () => {
        setEditableFuncionarios(prev => [...prev, { nome: '', funcao: '', salario: '' }]);
    };

    const handleDeleteRequest = (funcionario: EditableFuncionario, index: number) => {
        if (!funcionario.id) { // unsaved item
            setEditableFuncionarios(prev => prev.filter((_, i) => i !== index));
            return;
        }
        setFuncionarioToDelete(funcionario);
    };

    const confirmDelete = () => {
        if (!firestore || !funcionarioToDelete?.id) return;
        deleteDocumentNonBlocking(doc(firestore, "funcionarios", funcionarioToDelete.id));
        toast({ title: "Sucesso", description: `"${funcionarioToDelete.nome}" foi removido.` });
        setFuncionarioToDelete(null);
    };

    const handleSaveAll = async () => {
        if (!firestore) return;

        const validFuncionarios = editableFuncionarios.filter(f => f.nome.trim() && f.funcao.trim());

        if (validFuncionarios.length !== editableFuncionarios.length) {
            toast({ variant: 'destructive', title: 'Erro de Validação', description: "Todos os funcionários devem ter nome e função preenchidos." });
            return;
        }
        
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            const funcionariosCollectionRef = collection(firestore, 'funcionarios');
            
            for (const funcionario of validFuncionarios) {
                const finalSalario = parseFloat(String(funcionario.salario).replace(',', '.'));
                if (isNaN(finalSalario)) {
                    toast({ variant: 'destructive', title: 'Erro de Validação', description: `O salário para "${funcionario.nome}" é inválido.`});
                    setIsSaving(false);
                    return;
                }

                const data = {
                    nome: funcionario.nome.trim(),
                    funcao: funcionario.funcao.trim(),
                    salario: finalSalario,
                };
                
                if (funcionario.id) {
                    batch.update(doc(funcionariosCollectionRef, funcionario.id), data);
                } else {
                    batch.set(doc(funcionariosCollectionRef), data);
                }
            }

            await batch.commit();
            toast({ title: 'Sucesso!', description: 'Lista de funcionários atualizada.' });

        } catch (error) {
            console.error("Erro ao salvar funcionários: ", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as alterações.' });
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <AlertDialog open={!!funcionarioToDelete} onOpenChange={(open) => !open && setFuncionarioToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Funcionário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. O funcionário "{funcionarioToDelete?.nome}" será permanentemente removido.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5"/> Quadro de Funcionários</h3>
                    <p className="text-sm text-muted-foreground">Adicione, edite ou remova membros da sua equipa.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total de Salários</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(totalSalarios)}</p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Nome</TableHead>
                            <TableHead className="w-[30%]">Função</TableHead>
                            <TableHead className="text-right">Salário (R$)</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {editableFuncionarios.map((func, index) => (
                            <TableRow key={func.id || `new-${index}`}>
                                <TableCell>
                                    <Input 
                                      value={func.nome} 
                                      onChange={(e) => handleFieldChange(index, 'nome', e.target.value)}
                                      placeholder="Nome do funcionário"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                      value={func.funcao}
                                      onChange={(e) => handleFieldChange(index, 'funcao', e.target.value)}
                                      placeholder="Ex: Cozinheiro"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                      value={String(func.salario).replace('.', ',')}
                                      onChange={(e) => handleFieldChange(index, 'salario', e.target.value)}
                                      className="text-right font-mono"
                                      placeholder="0,00"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(func, index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex justify-between items-center">
                 <Button variant="outline" onClick={handleAddNewRow}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Funcionário
                </Button>
                <Button onClick={handleSaveAll} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                </Button>
            </div>
        </div>
    );
}
