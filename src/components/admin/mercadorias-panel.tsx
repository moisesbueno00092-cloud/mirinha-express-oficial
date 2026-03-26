'use client';

import { useState, useMemo, useRef } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Fornecedor, BomboniereItem } from '@/types';
import { parseRomaneio } from '@/ai/flows/parse-romaneio-flow';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, Save, Upload, FileJson } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { format as formatDateFn, addDays } from 'date-fns';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface LancamentoProduto {
    id: number;
    produtoNome: string;
    preco: number;
    quantidade: number;
    precoUnitario: number;
}

/**
 * Função de Compressão de Imagem no Cliente (Ultra Otimizada)
 * Reduz o peso da imagem (Max 1200px) e qualidade 0.7 para garantir envio rápido e evitar erro de 1MB.
 */
const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200; // Suficiente para OCR sem exceder limites
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Qualidade 0.7 gera um JPG muito leve mas nítido para IA
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = dataUri;
    });
};

const findBestBomboniereMatch = (productName: string, bomboniereItems: BomboniereItem[]): BomboniereItem | undefined => {
    if (!productName || !bomboniereItems) return undefined;
    const lowerProductName = productName.toLowerCase();
    let bestMatch: BomboniereItem | undefined = undefined;
    let longestMatchLength = 0;
    for (const bomboniereItem of bomboniereItems) {
        const baseBomboniereName = bomboniereItem.name.toLowerCase().replace(/\s*\(.*\)\s*/, '').trim();
        if (!baseBomboniereName) continue;
        if (lowerProductName.startsWith(baseBomboniereName)) {
            if (baseBomboniereName.length > longestMatchLength) {
                bestMatch = bomboniereItem;
                longestMatchLength = baseBomboniereName.length;
            }
        }
    }
    return bestMatch;
};

export default function MercadoriasPanel() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [fornecedorId, setFornecedorId] = useState<string | undefined>(undefined);
    const [dataVencimento, setDataVencimento] = useState<Date | undefined>(undefined);
    const [produtosLancados, setProdutosLancados] = useState<LancamentoProduto[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsingRomaneio, setIsParsingRomaneio] = useState(false);
    const [lancamentoInput, setLancamentoInput] = useState('');
    
    const lancamentoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fornecedoresQuery = useMemo(() => firestore ? query(collection(firestore, 'fornecedores'), orderBy('nome', 'asc')) : null, [firestore]);
    const { data: fornecedores } = useCollection<Fornecedor>(fornecedoresQuery);
    const bomboniereItemsQuery = useMemo(() => firestore ? query(collection(firestore, 'bomboniere_items')) : null, [firestore]);
    const { data: bomboniereItems } = useCollection<BomboniereItem>(bomboniereItemsQuery);

    const handleRegisterEntry = async () => {
        if (!firestore || produtosLancados.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        const romaneioId = doc(collection(firestore, '_')).id;
        const finalFornecedorId = fornecedorId || 'extra_expenses_provider';
        try {
            const batch = writeBatch(firestore);
            const estaPaga = !dataVencimento;
            const vencimentoParcela = estaPaga ? new Date() : dataVencimento!;
            
            const totalCompra = produtosLancados.reduce((acc, p) => acc + p.preco, 0);

            batch.set(doc(collection(firestore, 'contas_a_pagar')), {
                descricao: `Compra Mercadorias (via OCR)`.trim(),
                fornecedorId: finalFornecedorId, 
                valor: totalCompra,
                dataVencimento: formatDateFn(vencimentoParcela, 'yyyy-MM-dd'),
                estaPaga: estaPaga, 
                romaneioId: romaneioId,
            });

            for (const produto of produtosLancados) {
                batch.set(doc(collection(firestore, 'entradas_mercadorias')), {
                    produtoNome: produto.produtoNome, 
                    fornecedorId: finalFornecedorId,
                    data: new Date().toISOString(), 
                    quantidade: produto.quantidade,
                    precoUnitario: produto.precoUnitario, 
                    valorTotal: produto.preco,
                    estaPaga: estaPaga, 
                    romaneioId: romaneioId,
                });
                const matched = findBestBomboniereMatch(produto.produtoNome, bomboniereItems || []);
                if (matched) {
                    batch.update(doc(firestore, 'bomboniere_items', matched.id), { estoque: matched.estoque + produto.quantidade });
                }
            }
            await batch.commit();
            toast({ title: 'Sucesso!', description: 'Lançamento realizado no financeiro.' });
            setProdutosLancados([]); 
            setFornecedorId(undefined); 
            setDataVencimento(undefined);
        } catch (error) { 
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro ao salvar' }); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleAddProduto = (e?: React.FormEvent) => {
        e?.preventDefault();
        const input = lancamentoInput.trim();
        if (!input) {
            if (produtosLancados.length > 0 && !isSubmitting) handleRegisterEntry();
            return;
        }
        const lastSpace = input.lastIndexOf(' ');
        if (lastSpace > -1) {
            const price = parseFloat(input.substring(lastSpace + 1).replace(',', '.'));
            if (!isNaN(price)) {
                setProdutosLancados(prev => [...prev, { id: Date.now(), produtoNome: input.substring(0, lastSpace), preco: price, quantidade: 1, precoUnitario: price }]);
                setLancamentoInput('');
            }
        }
    };

    const processPhoto = async (dataUri: string) => {
        setIsParsingRomaneio(true);
        try {
            // COMPRESSÃO NO CLIENTE: Garante que o payload seja pequeno e rápido
            const compressed = await compressImage(dataUri);
            const output = await parseRomaneio({ romaneioPhoto: compressed });
            
            if (output && output.items && output.items.length > 0) {
                setProdutosLancados(prev => [
                    ...prev, 
                    ...output.items.map((it: any) => ({ 
                        id: Math.random(), 
                        produtoNome: it.produtoNome, 
                        preco: it.valorTotal, 
                        quantidade: it.quantidade, 
                        precoUnitario: it.valorTotal / it.quantidade 
                    }))
                ]);
                toast({ title: "Leitura Concluída", description: `${output.items.length} produtos identificados pelo romaneio.` });
            } else {
                throw new Error("Nenhum item detectado na imagem.");
            }

            if (output && output.fornecedorNome) {
                const matchedFornecedor = fornecedores?.find(f => f.nome.toLowerCase().includes(output.fornecedorNome!.toLowerCase()));
                if (matchedFornecedor) setFornecedorId(matchedFornecedor.id);
            }
            if (output && output.dataVencimento) {
                try { setDataVencimento(new Date(output.dataVencimento)); } catch(e) {}
            }
        } catch (e: any) { 
            console.error("Erro ao processar romaneio:", e);
            toast({ variant: 'destructive', title: 'Falha na Leitura', description: 'Não foi possível extrair dados da imagem. Verifique se o texto está nítido.' }); 
        } finally { 
            setIsParsingRomaneio(false); 
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUri = event.target?.result as string;
            processPhoto(dataUri);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Limpar input para permitir re-upload do mesmo arquivo
    };

    const handleRemoveItem = (id: number) => {
        setProdutosLancados(prev => prev.filter(p => p.id !== id));
    };

    const totalCompra = useMemo(() => produtosLancados.reduce((acc, p) => acc + p.preco, 0), [produtosLancados]);

    return (
        <div className="space-y-6">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png" 
                onChange={handleFileChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                        <SelectContent>
                            {fornecedores?.map(f => (
                                <SelectItem key={f.id} value={f.id} style={{ color: f.color }}>
                                    {f.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Vencimento (Vazio = Pago hoje)</Label>
                    <DatePicker date={dataVencimento} setDate={setDataVencimento} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-primary/5 border-2 border-dashed border-primary/30 rounded-xl p-6 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <Upload className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Carregar Romaneio JPG</h3>
                        <p className="text-sm text-muted-foreground">O sistema usará IA para ler produtos e preços automaticamente.</p>
                    </div>
                    <Button 
                        size="lg"
                        className="w-full sm:w-auto px-10 h-12 gap-3"
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isParsingRomaneio}
                    >
                        {isParsingRomaneio ? <Loader2 className="h-5 w-5 animate-spin"/> : <FileJson className="h-5 w-5"/>}
                        {isParsingRomaneio ? 'A Analisar Imagem...' : 'Escolher Ficheiro do PC'}
                    </Button>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                    <div className="relative flex justify-center text-[0.6rem] uppercase"><span className="bg-card px-2 text-muted-foreground tracking-widest font-bold">Ou introdução manual rápida</span></div>
                </div>

                <div className="relative">
                    <Input 
                        ref={lancamentoInputRef} 
                        placeholder="Ex: Tomate 15,50 (Enter para adicionar)" 
                        value={lancamentoInput} 
                        onChange={(e) => setLancamentoInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddProduto()} 
                        disabled={isParsingRomaneio}
                        className="h-12 text-base border-primary/20 focus:border-primary"
                    />
                </div>
            </div>

            {produtosLancados.length > 0 && (
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-muted/50 px-4 py-2 text-[0.7rem] font-bold uppercase flex justify-between items-center border-b">
                        <span className="flex items-center gap-2 text-primary"><FileJson className="h-3 w-3"/> Itens para Conferência</span>
                        <span className="text-foreground">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCompra)}</span>
                    </div>
                    <ScrollArea className="h-56">
                        <div className="divide-y">
                            {produtosLancados.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 text-sm hover:bg-muted/30 group transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-semibold uppercase tracking-tight">{p.produtoNome}</span>
                                        <span className="text-[0.65rem] text-muted-foreground font-medium">
                                            {p.quantidade} un x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.precoUnitario)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-black text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco)}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10" 
                                            onClick={() => handleRemoveItem(p.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                <div className="text-center sm:text-left">
                    <span className="text-[0.65rem] text-muted-foreground uppercase font-black tracking-widest">Valor Total do Lançamento</span>
                    <div className="font-black text-3xl text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCompra)}</div>
                </div>
                <Button 
                    onClick={handleRegisterEntry} 
                    disabled={isSubmitting || produtosLancados.length === 0}
                    className="h-14 px-10 text-lg font-bold shadow-lg w-full sm:w-auto"
                >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                    Confirmar e Gerar Conta
                </Button>
            </div>
        </div>
    );
}
