
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Funcionario } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2, Pencil, User, Briefcase, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const FuncionarioFormModal = ({
    isOpen,
    onClose,
    funcionario,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    funcionario: Partial<Funcionario> | null;
    onSave: (data: Omit<Funcionario, 'id'>) => void;
}) => {
    const [nome, setNome] = useState('');
    const [cargo, setCargo] = useState('');
    const [dataAdmissao, setDataAdmissao] = useState<Date | undefined>(undefined);
    const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (funcionario) {
            setNome(funcionario.nome || '');
            setCargo(funcionario.cargo || '');
            setStatus(funcionario.status || 'Ativo');
            if (funcionario.dataAdmissao && isValid(parse(funcionario.dataAdmissao, 'yyyy-MM-dd', new Date()))) {
                setDataAdmissao(parse(funcionario.dataAdmissao, 'yyyy-MM-dd', new Date()));
            } else {
                setDataAdmissao(undefined);
            }
        } else {
            setNome('');
            setCargo('');
            setDataAdmissao(new Date());
            setStatus('Ativo');
        }
    }, [funcionario, isOpen]);

    const handleSave = () => {
        if (!nome.trim() || !cargo.trim() || !dataAdmissao) {
            toast({
                variant: 'destructive',
                title: 'Erro de Validação',
                description: 'Por favor, preencha todos os campos obrigatórios.',
            });
            return;
        }

        setIsSaving(true);
        const dataToSave = {
            nome: nome.trim(),
            cargo: cargo.trim(),
            dataAdmissao: format(dataAdmissao, 'yyyy-MM-dd'),
            status,
        };
        onSave(dataToSave);
        setIsSaving(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{funcionario?.id ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do funcionário" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Cozinheiro, Atendente" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                        <DatePicker date={dataAdmissao} setDate={setDataAdmissao} />
                    </div>
                     {funcionario?.id && (
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="status-switch">Status</Label>
                             <Switch
                                id="status-switch"
                                checked={status === 'Ativo'}
                                onCheckedChange={(checked) => setStatus(checked ? 'Ativo' : 'Inativo')}
                            />
                            <span className={cn("text-sm font-medium", status === 'Ativo' ? 'text-green-500' : 'text-destructive')}>{status}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const FuncionarioCard = ({ funcionario, onEdit }: { funcionario: Funcionario, onEdit: (f: Funcionario) => void }) => {
    const admissionDate = parse(funcionario.dataAdmissao, 'yyyy-MM-dd', new Date());
    const formattedDate = isValid(admissionDate) ? format(admissionDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inválida';

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div>
                    <CardTitle className="text-xl">{funcionario.nome}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5"><Briefcase className="h-3 w-3"/>{funcionario.cargo}</CardDescription>
                </div>
                 <Badge variant={funcionario.status === 'Ativo' ? 'default' : 'secondary'} className={cn(funcionario.status === 'Ativo' ? 'bg-green-600' : 'bg-muted-foreground')}>{funcionario.status}</Badge>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Admissão: {formattedDate}</span>
                </div>
            </CardContent>
            <div className="p-4 pt-0 text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(funcionario)}>
                    <Pencil className="mr-2 h-4 w-4"/>
                    Editar
                </Button>
            </div>
        </Card>
    )
}

export default function FuncionariosPanel() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFuncionario, setEditingFuncionario] = useState<Partial<Funcionario> | null>(null);
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Ativo');

    const funcionariosQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'funcionarios'), orderBy('nome', 'asc')) : null,
        [firestore]
    );

    const { data: funcionarios, isLoading: isLoadingFuncionarios } = useCollection<Funcionario>(funcionariosQuery);
    
    const filteredFuncionarios = useMemo(() => {
        if (!funcionarios) return [];
        if (statusFilter === 'Todos') return funcionarios;
        return funcionarios.filter(f => f.status === statusFilter);
    }, [funcionarios, statusFilter]);

    const handleOpenModal = (funcionario: Funcionario | null = null) => {
        setEditingFuncionario(funcionario);
        setIsModalOpen(true);
    };

    const handleSaveFuncionario = (data: Omit<Funcionario, 'id'>) => {
        if (!firestore) return;
        
        const funcionariosCollection = collection(firestore, 'funcionarios');

        if (editingFuncionario?.id) {
            // Update
            const docRef = doc(funcionariosCollection, editingFuncionario.id);
            updateDocumentNonBlocking(docRef, data);
            toast({ title: 'Sucesso!', description: 'Funcionário atualizado.' });
        } else {
            // Create
            addDocumentNonBlocking(funcionariosCollection, data);
            toast({ title: 'Sucesso!', description: 'Funcionário adicionado.' });
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <FuncionarioFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                funcionario={editingFuncionario}
                onSave={handleSaveFuncionario}
            />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <Label htmlFor="status-filter">Filtrar por status:</Label>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                            <SelectTrigger id="status-filter" className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ativo">Ativos</SelectItem>
                                <SelectItem value="Inativo">Inativos</SelectItem>
                                <SelectItem value="Todos">Todos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Funcionário
                    </Button>
                </div>

                {isLoadingFuncionarios ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : filteredFuncionarios.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFuncionarios.map(f => (
                           <FuncionarioCard key={f.id} funcionario={f} onEdit={handleOpenModal} />
                        ))}
                    </div>
                ) : (
                    <Card className="p-8 text-center text-muted-foreground">
                        <Info className="mx-auto h-8 w-8 mb-2"/>
                        <p>Nenhum funcionário encontrado para o filtro selecionado.</p>
                    </Card>
                )}
            </div>
        </>
    );
}
