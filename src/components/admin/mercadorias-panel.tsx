
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { ContaAPagar, EntradaMercadoria, Fornecedor } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { format } from 'date-fns';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface LancamentoProduto {
    id: number;
    texto: string;
    produtoNome: string;
    preco: number;
}

export default function MercadoriasPanel() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [fornecedorId, setFornecedorId] = useState<string | undefined>();
    const [dataVencimento, setDataVencimento] = useState<Date | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [lancamentoInput, setLancamentoInput] = useState('');
    const [produtosLancados, setProdutosLancados] = useState<LancamentoProduto[]>([]);

    const fornecedoresQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'fornecedores'), orderBy('nome', 'asc')) : null,
        [firestore]
    );
    const { data: fornecedores, isLoading: isLoadingFornecedores } = useCollection<Fornecedor>(fornecedoresQuery);
    
    const handleAddProduto = (e: React.FormEvent) => {
        e.preventDefault();
        if(!lancamentoInput.trim()) return;

        // Simple parsing: assumes last word is price
        const parts = lancamentoInput.trim().split(' ');
        const precoStr = parts.pop()?.replace(',', '.');
        const produtoNome = parts.join(' ');
        const preco = parseFloat(precoStr || '');
        
        if (!produtoNome || isNaN(preco)) {
            toast({ variant: 'destructive', title: 'Entrada inválida', description: 'Formato esperado: "Nome do produto 99,99"' });
            return;
        }

        setProdutosLancados(prev => [...prev, {
            id: Date.now(),
            texto: lancamentoInput,
            produtoNome,
            preco,
        }]);
        setLancamentoInput('');
    }

    const handleRemoveProduto = (id: number) => {
        setProdutosLancados(prev => prev.filter(p => p.id !== id));
    }
    
    const resetForm = () => {
        setFornecedorId(undefined);
        setDataVencimento(undefined);
        setProdutosLancados([]);
        setLancamentoInput('');
    }

    const handleRegisterEntry = async () => {
        if (!firestore || !fornecedorId || !dataVencimento || produtosLancados.length === 0) {
            toast({ variant: 'destructive', title: 'Faltam dados', description: 'Por favor, preencha todos os campos.' });
            return;
        }
        setIsSubmitting(true);

        try {
            const fornecedorNome = fornecedores?.find(f => f.id === fornecedorId)?.nome || 'Fornecedor desconhecido';

            // 1. Create Conta a Pagar
            const novaConta: Omit<ContaAPagar, 'id'> = {
                descricao: `Compra de mercadorias - ${fornecedorNome}`,
                fornecedorId: fornecedorId,
                valor: totalCompra,
                dataVencimento: format(dataVencimento, 'yyyy-MM-dd'),
                estaPaga: false,
            };
            await addDocumentNonBlocking(collection(firestore, 'contas_a_pagar'), novaConta);
            
            // 2. Create Entrada de Mercadoria for each product
            const batch = writeBatch(firestore);
            const entradasCollection = collection(firestore, 'entradas_mercadorias');
            
            produtosLancados.forEach(produto => {
                const novaEntrada: Omit<EntradaMercadoria, 'id'> = {
                    produtoNome: produto.produtoNome,
                    fornecedorId: fornecedorId,
                    data: new Date().toISOString(),
                    quantidade: 1, // Assuming 1 for now, can be expanded
                    precoUnitario: produto.preco,
                    valorTotal: produto.preco,
                };
                const docRef = doc(entradasCollection); // Create a new doc with a random ID
                batch.set(docRef, novaEntrada);
            });
            
            await batch.commit();

            toast({ title: 'Sucesso!', description: 'Entrada de mercadoria e conta a pagar registadas.' });
            resetForm();
        } catch (error) {
            console.error("Erro ao registar entrada:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registar a entrada.' });
        } finally {
            setIsSubmitting(false);
        }
    }


    const totalCompra = useMemo(() => {
        return produtosLancados.reduce((acc, p) => acc + (p.preco || 0), 0);
    }, [produtosLancados]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                        <SelectTrigger id="fornecedor" disabled={isLoadingFornecedores}>
                            <SelectValue placeholder={isLoadingFornecedores ? "A carregar..." : "Selecione um fornecedor"} />
                        </SelectTrigger>
                        <SelectContent>
                            {fornecedores?.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="vencimento">Data de Vencimento</Label>
                    <DatePicker date={dataVencimento} setDate={setDataVencimento} placeholder="Selecione a data" />
                </div>
            </div>
            
            <Separator />

            <div className="space-y-4">
                <form onSubmit={handleAddProduto} className="flex items-center gap-2">
                    <div className="flex-grow space-y-2">
                        <Label htmlFor="lancamento-produto">Lançamento de Produto (Nome e Preço)</Label>
                        <Input 
                            id="lancamento-produto"
                            placeholder="Ex: Arroz 5kg 25,90"
                            value={lancamentoInput}
                            onChange={(e) => setLancamentoInput(e.target.value)}
                        />
                    </div>
                     <Button type="submit" size="icon" className="self-end" disabled={!lancamentoInput.trim()}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                </form>
            </div>
            
            {produtosLancados.length > 0 && (
                 <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Produtos nesta Entrada</h3>
                    <div className="rounded-md border">
                        {produtosLancados.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                <span>{p.produtoNome}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono">{formatCurrency(p.preco || 0)}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveProduto(p.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="flex justify-end items-center gap-4 pt-2 font-semibold">
                        <span>Total da Compra:</span>
                        <span className="text-xl text-primary">{formatCurrency(totalCompra)}</span>
                    </div>
                </div>
            )}


            <div className="flex justify-end pt-4">
                <Button 
                    onClick={handleRegisterEntry}
                    disabled={isSubmitting || !fornecedorId || !dataVencimento || produtosLancados.length === 0}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registar Entrada e Criar Conta a Pagar
                </Button>
            </div>

        </div>
    );
}
