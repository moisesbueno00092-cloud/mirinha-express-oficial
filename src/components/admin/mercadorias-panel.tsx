'use client';

import { useState, useMemo, useRef } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Fornecedor, BomboniereItem } from '@/types';
import { parseRomaneio, testAiConnection } from '@/ai/flows/parse-romaneio-flow';

import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ClipboardList, CheckCircle2, Zap, Upload } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format as formatDateFn } from 'date-fns';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface LancamentoProduto {
    id: string;
    produtoNome: string;
    preco: number;
    quantidade: number;
    precoUnitario: number;
}

const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800; // Reduzido para maior rapidez na Vercel
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.drawImage(img, 0, 0, width, height); }
            resolve(canvas.toDataURL('image/jpeg', 0.5)); // Qualidade menor para payload leve
        };
        img.src = dataUri;
    });
};

export default function MercadoriasPanel() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [fornecedorId, setFornecedorId] = useState<string | undefined>(undefined);
    const [dataVencimento, setDataVencimento] = useState<Date | undefined>(undefined);
    const [produtosLancados, setProdutosLancados] = useState<LancamentoProduto[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsingRomaneio, setIsParsingRomaneio] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fornecedoresQuery = useMemo(() => firestore ? query(collection(firestore, 'fornecedores'), orderBy('nome', 'asc')) : null, [firestore]);
    const { data: fornecedores } = useCollection<Fornecedor>(fornecedoresQuery);
    const bomboniereItemsQuery = useMemo(() => firestore ? query(collection(firestore, 'bomboniere_items')) : null, [firestore]);
    const { data: bomboniereItems } = useCollection<BomboniereItem>(bomboniereItemsQuery);

    const handleCheckStatus = async () => {
        setIsTestingConnection(true);
        const result = await testAiConnection();
        setIsTestingConnection(false);
        toast({ 
            variant: result.success ? 'default' : 'destructive',
            title: result.success ? 'IA Conectada' : 'Falha na IA', 
            description: result.message 
        });
    };

    const processPhoto = async (dataUri: string) => {
        setIsParsingRomaneio(true);
        try {
            const compressed = await compressImage(dataUri);
            const output = await parseRomaneio({ romaneioPhoto: compressed });
            
            if (output?.items?.length > 0) {
                const newItems = output.items.map((it: any) => ({ 
                    id: Math.random().toString(36).substr(2, 9), 
                    produtoNome: it.produtoNome, 
                    preco: it.valorTotal, 
                    quantidade: it.quantidade, 
                    precoUnitario: it.quantidade > 0 ? it.valorTotal / it.quantidade : it.valorTotal
                }));
                setProdutosLancados(newItems);
                toast({ title: "Dados Extraídos", description: `${output.items.length} itens encontrados.` });
            }

            if (output?.fornecedorNome && fornecedores) {
                const matched = fornecedores.find(f => f.nome.toLowerCase().includes(output.fornecedorNome!.toLowerCase()));
                if (matched) setFornecedorId(matched.id);
            }

            if (output?.dataVencimento) {
                const [y, m, d] = output.dataVencimento.split('-').map(Number);
                setDataVencimento(new Date(y, m - 1, d));
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro de Processamento', description: e.message });
        } finally {
            setIsParsingRomaneio(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => processPhoto(event.target?.result as string);
        reader.readAsDataURL(file);
        e.target.value = ''; 
    };

    const handleRegisterEntry = async () => {
        if (!firestore || produtosLancados.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const batch = writeBatch(firestore);
            const romaneioId = doc(collection(firestore, '_')).id;
            const finalFornecedorId = fornecedorId || 'extra_expenses_provider';
            const estaPaga = !dataVencimento;
            const vencimento = dataVencimento || new Date();

            batch.set(doc(collection(firestore, 'contas_a_pagar')), {
                descricao: `Romaneio de Mercadorias`,
                fornecedorId: finalFornecedorId,
                valor: produtosLancados.reduce((acc, p) => acc + p.preco, 0),
                dataVencimento: formatDateFn(vencimento, 'yyyy-MM-dd'),
                estaPaga,
                romaneioId
            });

            for (const p of produtosLancados) {
                batch.set(doc(collection(firestore, 'entradas_mercadorias')), {
                    produtoNome: p.produtoNome,
                    fornecedorId: finalFornecedorId,
                    data: new Date().toISOString(),
                    quantidade: p.quantidade,
                    precoUnitario: p.precoUnitario,
                    valorTotal: p.preco,
                    estaPaga,
                    romaneioId
                });
                
                const matched = bomboniereItems?.find(bi => p.produtoNome.toLowerCase().startsWith(bi.name.toLowerCase().split('(')[0].trim()));
                if (matched) {
                    batch.update(doc(firestore, 'bomboniere_items', matched.id), { estoque: matched.estoque + p.quantity });
                }
            }

            await batch.commit();
            toast({ title: 'Sucesso', description: 'Entrada registada.' });
            setProdutosLancados([]);
            setFornecedorId(undefined);
            setDataVencimento(undefined);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro ao Gravar' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png" onChange={handleFileChange} />

            {/* Micro Barra de Ferramentas */}
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/10 p-1 rounded-md border border-border/40">
                <Button 
                    variant="default" 
                    size="sm" 
                    className="h-7 text-[0.6rem] font-bold uppercase tracking-tighter gap-1 shrink-0 px-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingRomaneio}
                >
                    {isParsingRomaneio ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    JPG
                </Button>

                <div className="flex-grow min-w-[100px]">
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                        <SelectTrigger className="h-7 text-[0.65rem] bg-background border-none shadow-none"><SelectValue placeholder="Fornecedor..." /></SelectTrigger>
                        <SelectContent>{fornecedores?.map(f => (<SelectItem key={f.id} value={f.id} className="text-xs">{f.nome}</SelectItem>))}</SelectContent>
                    </Select>
                </div>

                <div className="w-[120px] shrink-0 h-7 flex items-center bg-background rounded-sm border-none">
                    <DatePicker date={dataVencimento} setDate={setDataVencimento} />
                </div>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 hover:bg-primary/10 text-primary shrink-0" 
                    onClick={handleCheckStatus} 
                    disabled={isTestingConnection || isParsingRomaneio}
                >
                    {isTestingConnection ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                </Button>
            </div>

            {/* Lista Compacta de Itens Extraídos */}
            {produtosLancados.length > 0 && (
                <div className="border border-primary/20 rounded-md overflow-hidden bg-card/30 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="bg-primary/5 px-2 py-1 flex justify-between items-center border-b border-primary/10">
                        <span className="flex items-center gap-1.5 text-primary font-bold uppercase text-[0.55rem] tracking-tight">
                            <ClipboardList className="h-3 w-3"/> Extraído por IA
                        </span>
                        <span className="text-foreground font-bold text-xs">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtosLancados.reduce((acc, p) => acc + p.preco, 0))}
                        </span>
                    </div>
                    <ScrollArea className="h-28">
                        <div className="divide-y divide-border/20">
                            {produtosLancados.map(p => (
                                <div key={p.id} className="flex justify-between items-center px-2 py-1 hover:bg-primary/5">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold uppercase text-[0.6rem] truncate">{p.produtoNome}</span>
                                        <span className="text-[0.5rem] text-muted-foreground font-medium">{p.quantidade} un · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.precoUnitario)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-primary text-[0.65rem]">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco)}</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/30 hover:text-destructive" onClick={() => setProdutosLancados(prev => prev.filter(item => item.id !== p.id))}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-1.5 bg-primary/5 flex justify-end">
                        <Button onClick={handleRegisterEntry} disabled={isSubmitting} className="h-7 px-4 text-[0.65rem] font-bold gap-1.5">
                            {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            Gravar Entrada
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
