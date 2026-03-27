'use client';

import { useState, useMemo, useRef } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Fornecedor, BomboniereItem } from '@/types';
import { parseRomaneio, testAiConnection } from '@/ai/flows/parse-romaneio-flow';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Upload, FileImage, ClipboardList, CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format as formatDateFn } from 'date-fns';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';

interface LancamentoProduto {
    id: string;
    produtoNome: string;
    preco: number;
    quantidade: number;
    precoUnitario: number;
}

/**
 * Otimiza a imagem no cliente para garantir que o envio à Vercel seja rápido.
 */
const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1000;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
            }
            resolve(canvas.toDataURL('image/jpeg', 0.7));
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
    const [aiStatus, setAiStatus] = useState<'idle' | 'online' | 'offline'>('idle');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fornecedoresQuery = useMemo(() => firestore ? query(collection(firestore, 'fornecedores'), orderBy('nome', 'asc')) : null, [firestore]);
    const { data: fornecedores } = useCollection<Fornecedor>(fornecedoresQuery);
    const bomboniereItemsQuery = useMemo(() => firestore ? query(collection(firestore, 'bomboniere_items')) : null, [firestore]);
    const { data: bomboniereItems } = useCollection<BomboniereItem>(bomboniereItemsQuery);

    const handleCheckStatus = async () => {
        setIsTestingConnection(true);
        const result = await testAiConnection();
        setIsTestingConnection(false);
        
        if (result.success) {
            setAiStatus('online');
            toast({ title: 'Ligação Ativa', description: result.message });
        } else {
            setAiStatus('offline');
            toast({ variant: 'destructive', title: 'Falha na Ligação', description: result.message, duration: 10000 });
        }
    };

    const processPhoto = async (dataUri: string) => {
        setIsParsingRomaneio(true);
        try {
            const compressed = await compressImage(dataUri);
            const output = await parseRomaneio({ romaneioPhoto: compressed });
            
            if (output && output.items && output.items.length > 0) {
                const newItems = output.items.map((it: any) => ({ 
                    id: Math.random().toString(36).substr(2, 9), 
                    produtoNome: it.produtoNome, 
                    preco: it.valorTotal, 
                    quantidade: it.quantidade, 
                    precoUnitario: it.quantidade > 0 ? it.valorTotal / it.quantidade : it.valorTotal
                }));
                setProdutosLancados(newItems);
                toast({ title: "Sucesso!", description: `Foram lidos ${output.items.length} produtos do romaneio.` });
            }

            if (output?.fornecedorNome && fornecedores) {
                const matched = fornecedores.find(f => 
                    f.nome.toLowerCase().includes(output.fornecedorNome!.toLowerCase())
                );
                if (matched) setFornecedorId(matched.id);
            }

            if (output?.dataVencimento) {
                try {
                    const [y, m, d] = output.dataVencimento.split('-').map(Number);
                    setDataVencimento(new Date(y, m - 1, d));
                } catch {}
            }
        } catch (e: any) {
            console.error("Erro no processamento:", e);
            toast({ variant: 'destructive', title: 'Erro de Análise', description: e.message });
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
                
                const matched = bomboniereItems?.find(bi => 
                    p.produtoNome.toLowerCase().startsWith(bi.name.toLowerCase().split('(')[0].trim())
                );
                if (matched) {
                    batch.update(doc(firestore, 'bomboniere_items', matched.id), { 
                        estoque: matched.estoque + p.quantidade 
                    });
                }
            }

            await batch.commit();
            toast({ title: 'Lançamento Gravado!' });
            setProdutosLancados([]);
            setFornecedorId(undefined);
            setDataVencimento(undefined);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro ao Gravar Lançamento' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png" onChange={handleFileChange} />

            <div className="flex justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", 
                        aiStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : aiStatus === 'offline' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-gray-500'
                    )} />
                    <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">
                        IA: {aiStatus === 'online' ? 'LIGADA' : aiStatus === 'offline' ? 'DESLIGADA' : 'EM ESPERA'}
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-2 text-[0.6rem] font-bold hover:bg-primary/10 transition-all" 
                    onClick={handleCheckStatus}
                    disabled={isTestingConnection}
                >
                    {isTestingConnection ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <Zap className="h-3 w-3 text-primary" />}
                    TESTAR
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-muted-foreground uppercase text-[0.6rem] font-bold tracking-widest leading-none">Fornecedor</Label>
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                        <SelectTrigger className="h-8 rounded-md text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {fornecedores?.map(f => (<SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-muted-foreground uppercase text-[0.6rem] font-bold tracking-widest leading-none">Vencimento</Label>
                    <div className="h-8"><DatePicker date={dataVencimento} setDate={setDataVencimento} /></div>
                </div>
            </div>

            <div 
                className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-lg p-2 text-center space-y-1 transition-all hover:bg-primary/10 hover:border-primary/40 group cursor-pointer" 
                onClick={() => fileInputRef.current?.click()}
            >
                {isParsingRomaneio ? (
                    <div className="flex flex-col items-center py-1">
                        <Loader2 className="h-4 w-4 animate-spin text-primary mb-1" />
                        <span className="text-[0.6rem] font-black uppercase text-primary">Analisando Imagem...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-2">
                            <FileImage className="h-4 w-4 text-primary" />
                            <span className="font-bold text-xs">Carregar Romaneio</span>
                        </div>
                        <p className="text-[0.55rem] text-muted-foreground uppercase font-medium">JPG ou PNG (Até 50MB)</p>
                    </>
                )}
            </div>

            {produtosLancados.length > 0 && (
                <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50 shadow-lg backdrop-blur-sm">
                    <div className="bg-muted/30 px-4 py-2 flex justify-between items-center border-b border-border/50">
                        <span className="flex items-center gap-2 text-primary font-black uppercase text-[0.6rem] tracking-widest"><ClipboardList className="h-3.5 w-3.5"/> Itens Extraídos</span>
                        <span className="text-foreground font-black text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produtosLancados.reduce((acc, p) => acc + p.preco, 0))}</span>
                    </div>
                    <ScrollArea className="h-48">
                        <div className="divide-y divide-border/30">
                            {produtosLancados.map(p => (
                                <div key={p.id} className="flex justify-between items-center px-4 py-3 hover:bg-primary/5 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-bold uppercase text-[0.65rem] leading-none">{p.produtoNome}</span>
                                        <span className="text-[0.55rem] text-muted-foreground font-medium uppercase tracking-tight">
                                            {p.quantity.toLocaleString('pt-BR')} un · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.precoUnitario)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-black text-primary text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco)}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/30 hover:text-destructive" onClick={() => setProdutosLancados(prev => prev.filter(item => item.id !== p.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-3 bg-muted/10 border-t border-border/50 flex justify-end">
                        <Button onClick={handleRegisterEntry} disabled={isSubmitting} className="h-8 px-6 text-xs font-black gap-2 rounded-md shadow-md">
                            {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Confirmar Lançamento
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
