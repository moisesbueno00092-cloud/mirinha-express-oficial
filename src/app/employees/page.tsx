'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, getDocs, collectionGroup } from 'firebase/firestore';
import type { Employee, EmployeeAdvance } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, Trash2, PlusCircle, UserPlus, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
};

function EmployeeAdvances({ employee }: { employee: Employee }) {
    const firestore = useFirestore();
    const advancesQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, `employees/${employee.id}/advances`), orderBy('date', 'desc')) : null
    ), [firestore, employee.id]);

    const { data: advances, isLoading, error } = useCollection<EmployeeAdvance>(advancesQuery);
    const [isAddingAdvance, setIsAddingAdvance] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const { toast } = useToast();

    const handleAddAdvance = () => {
        if (!firestore || !advanceAmount) return;
        const amount = parseFloat(advanceAmount.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Valor inválido' });
            return;
        }

        const advanceData: Omit<EmployeeAdvance, 'id'> = {
            employeeId: employee.id,
            employeeName: employee.name,
            amount: amount,
            date: new Date().toISOString(),
        };

        const advancesCollectionRef = collection(firestore, `employees/${employee.id}/advances`);
        addDocumentNonBlocking(advancesCollectionRef, advanceData);

        toast({ title: 'Sucesso', description: `Vale de ${formatCurrency(amount)} adicionado para ${employee.name}` });
        setAdvanceAmount('');
        setIsAddingAdvance(false);
    };

    return (
        <div className="bg-muted/50 p-4 rounded-md mt-2">
            <h4 className="font-semibold text-sm mb-2">Vales (Adiantamentos)</h4>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {error && <p className="text-destructive text-xs">Erro ao carregar vales.</p>}
            
            {advances && advances.length > 0 && (
                <div className="space-y-1 text-xs mb-4 max-h-32 overflow-y-auto">
                    {advances.map(advance => (
                        <div key={advance.id} className="flex justify-between">
                            <span>{formatDate(advance.date)}</span>
                            <span className="font-mono">{formatCurrency(advance.amount)}</span>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && advances?.length === 0 && <p className="text-xs text-muted-foreground mb-4">Nenhum vale registrado.</p>}
            
            {isAddingAdvance ? (
                <div className="flex gap-2">
                    <Input 
                        placeholder="Valor do vale" 
                        value={advanceAmount} 
                        onChange={(e) => setAdvanceAmount(e.target.value)} 
                        className="h-8"
                    />
                    <Button size="sm" onClick={handleAddAdvance}>Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingAdvance(false)}>Cancelar</Button>
                </div>
            ) : (
                <Button size="xs" variant="outline" onClick={() => setIsAddingAdvance(true)}>Adicionar Vale</Button>
            )}
        </div>
    );
}

export default function EmployeesPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    // Data fetching
    const employeesQuery = useMemoFirebase(() => (firestore && user ? query(collection(firestore, 'employees'), where('userId', '==', user.uid), orderBy('name', 'asc')) : null), [firestore, user]);
    const { data: employees, isLoading, error } = useCollection<Employee>(employeesQuery);

    // State for modals and forms
    const [isAdding, setIsAdding] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [newEmployeeRole, setNewEmployeeRole] = useState('');
    const [newEmployeeSalary, setNewEmployeeSalary] = useState('');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleAddEmployee = async () => {
        if (!firestore || !user || !newEmployeeName || !newEmployeeRole || !newEmployeeSalary) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Preencha todos os campos.' });
            return;
        }
        const salary = parseFloat(newEmployeeSalary.replace(',', '.'));
        if (isNaN(salary) || salary <= 0) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Salário inválido.' });
            return;
        }

        const newEmployee: Omit<Employee, 'id'> = {
            userId: user.uid,
            name: newEmployeeName,
            role: newEmployeeRole,
            salary: salary
        };

        const employeesCollectionRef = collection(firestore, 'employees');
        await addDocumentNonBlocking(employeesCollectionRef, newEmployee);
        
        toast({ title: 'Sucesso', description: `${newEmployee.name} foi adicionado(a) à equipe.` });
        setIsAdding(false);
        setNewEmployeeName('');
        setNewEmployeeRole('');
        setNewEmployeeSalary('');
    };

    const confirmDelete = async () => {
        if (!firestore || !itemToDelete) return;

        // First, delete all advances in the subcollection
        const advancesSnapshot = await getDocs(collection(firestore, `employees/${itemToDelete}/advances`));
        advancesSnapshot.forEach(doc => {
            deleteDocumentNonBlocking(doc.ref);
        });
        
        // Then, delete the employee document
        const docRef = doc(firestore, 'employees', itemToDelete);
        deleteDocumentNonBlocking(docRef);

        toast({ title: 'Sucesso', description: 'Funcionário removido.' });
        setItemToDelete(null);
    };
    
    if (isUserLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    if (error) {
        return (
            <div className="container mx-auto p-8 text-center text-destructive">
                <h1 className="text-2xl font-bold">Erro ao Carregar Dados</h1>
                <p className="mt-2">{error.message}</p>
                 <Link href="/" passHref>
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o funcionário e todos os seus vales registrados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="container mx-auto max-w-4xl p-4 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Funcionários</h1>
                    <Link href="/" passHref>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    </Link>
                </div>
                
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Adicionar Funcionário
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr,2fr,1fr,auto] gap-2 items-end">
                            <Input placeholder="Nome completo" value={newEmployeeName} onChange={e => setNewEmployeeName(e.target.value)} />
                            <Input placeholder="Cargo" value={newEmployeeRole} onChange={e => setNewEmployeeRole(e.target.value)} />
                            <Input placeholder="Salário" value={newEmployeeSalary} onChange={e => setNewEmployeeSalary(e.target.value)} />
                            <Button onClick={handleAddEmployee}>Adicionar</Button>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Equipe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> : 
                            <div className="space-y-2">
                                {employees && employees.map(employee => (
                                    <Collapsible key={employee.id} className="border p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-bold">{employee.name}</p>
                                                <p className="text-sm text-muted-foreground">{employee.role} - <span className="font-mono">{formatCurrency(employee.salary)}</span></p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setItemToDelete(employee.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </div>
                                        </div>
                                        <CollapsibleContent>
                                            <Separator className="my-3" />
                                            <EmployeeAdvances employee={employee} />
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                            </div>
                        }
                        { !isLoading && employees?.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum funcionário registrado.</p>}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
