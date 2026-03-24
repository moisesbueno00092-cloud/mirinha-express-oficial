
'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc, setDoc, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { ContaAPagar, EntradaMercadoria, Fornecedor, BomboniereItem } from '@/types';
import { parseRomaneio } from '@/ai/flows/parse-romaneio-flow';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, PlusCircle, Trash2, Pencil, Settings, Camera, Video, ChevronUp, ChevronDown } from 'lucide-react';
import { Separator } from '../ui/separator';
import { format as formatDateFn, addDays } from 'date-fns';
import { DatePicker } from '../ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import FornecedoresEditModal from './fornecedores-edit-modal';
import { ScrollArea } from '../ui/scroll-area';
import CameraCaptureSheet from './camera-capture-sheet';

interface LancamentoProduto {
    id: number;
    produtoNome: string;
    preco: number;
    quantidade: number;
    precoUnitario: number;
}

/**
 * Função de Compressão de Imagem no Cliente
 * Reduz o peso da imagem para evitar o erro de 1MB e acelerar a IA.
 */
const compressImage = (dataUri: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
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
    const [numParcelas, setNumParcelas] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsingRomaneio, setIsParsingRomaneio] = useState(false);
    const [newFornecedorName, setNewFornecedorName] = useState('');
    const [isAddingFornecedor, setIsAddingFornecedor] = useState(false);
    const [lancamentoInput, setLancamentoInput] = useState('');
    const [isFornecedoresModalOpen, setIsFornecedoresModalOpen] = useState(false);
    const [isCameraSheetOpen, setIsCameraSheetOpen] = useState(false);
    const lancamentoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fornecedoresQuery = useMemo(() => firestore ? query(collection(firestore, 'fornecedores'), orderBy('nome', 'asc')) : null, [firestore]);
    const { data: fornecedores, isLoading: isLoadingFornecedores } = useCollection<Fornecedor>(fornecedoresQuery);
    const bomboniereItemsQuery = useMemo(() => firestore ? query(collection(firestore, 'bomboniere_items')) : null, [firestore]);
    const { data: bomboniereItems } = useCollection<BomboniereItem>(bomboniereItemsQuery);

    const handleRegisterEntry = async () => {
        if (!firestore || produtosLancados.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        const romaneioId = doc(collection(firestore, '_')).id;
        const finalFornecedorId = fornecedorId || 'extra_expenses_provider';
        try {
            const batch = writeBatch(firestore);
            const totalCompra = produtosLancados.reduce((acc, p) => acc + p.preco, 0);
            const estaPaga = !dataVencimento;
            const parcelas = estaPaga ? 1 : parseInt(numParcelas, 10);
            const valorParcela = totalCompra / parcelas;

            for (let i = 0; i < parcelas; i++) {
                const vencimentoParcela = estaPaga ? new Date() : addDays(dataVencimento!, i * 7);
                batch.set(doc(collection(firestore, 'contas_a_pagar')), {
                    descricao: `Compra Mercadorias ${parcelas > 1 ? `(${i + 1}/${parcelas})` : ''}`.trim(),
                    fornecedorId: finalFornecedorId, valor: valorParcela,
                    dataVencimento: formatDateFn(vencimentoParcela, 'yyyy-MM-dd'),
                    estaPaga: estaPaga, romaneioId: romaneioId,
                });
            }

            for (const produto of produtosLancados) {
                batch.set(doc(collection(firestore, 'entradas_mercadorias')), {
                    produtoNome: produto.produtoNome, fornecedorId: finalFornecedorId,
                    data: new Date().toISOString(), quantidade: produto.quantidade,
                    precoUnitario: produto.precoUnitario, valorTotal: produto.preco,
                    estaPaga: estaPaga, romaneioId: romaneioId,
                });
                const matched = findBestBomboniereMatch(produto.produtoNome, bomboniereItems || []);
                if (matched) {
                    batch.update(doc(firestore, 'bomboniere_items', matched.id), { estoque: matched.estoque + produto.quantidade });
                }
            }
            await batch.commit();
            toast({ title: 'Sucesso!', description: 'Lançamento realizado.' });
            setProdutosLancados([]); setFornecedorId(undefined); setDataVencimento(undefined);
        } catch (error) { toast({ variant: 'destructive', title: 'Erro ao salvar' }); } finally { setIsSubmitting(false); }
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

    const handleCameraCapture = async (dataUri: string | null) => {
        if (!dataUri) return;
        setIsParsingRomaneio(true);
        try {
            const compressed = await compressImage(dataUri);
            const output = await parseRomaneio({ romaneioPhoto: compressed });
            if (output.items) {
                setProdutosLancados(prev => [...prev, ...output.items.map((it: any) => ({ id: Math.random(), produtoNome: it.produtoNome, preco: it.valorTotal, quantidade: it.quantidade, precoUnitario: it.valorTotal / it.quantidade }))]);
            }
        } catch (e) { toast({ variant: 'destructive', title: 'Erro na leitura' }); } finally { setIsParsingRomaneio(false); setIsCameraSheetOpen(false); }
    };

    const totalCompra = useMemo(() => produtosLancados.reduce((acc, p) => acc + p.preco, 0), [produtosLancados]);

    return (
        <div className="space-y-6">
            <CameraCaptureSheet isOpen={isCameraSheetOpen} onClose={() => setIsCameraSheetOpen(false)} onCapture={handleCameraCapture} isProcessing={isParsingRomaneio} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{fornecedores?.map(f => (<SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2"><Label>Vencimento (Vazio = Pago)</Label><DatePicker date={dataVencimento} setDate={setDataVencimento} /></div>
            </div>
            <div className="flex gap-2">
                <Input ref={lancamentoInputRef} placeholder="produto preço... (Enter vazio para finalizar)" value={lancamentoInput} onChange={(e) => setLancamentoInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddProduto()} />
                <Button variant="outline" onClick={() => setIsCameraSheetOpen(true)} disabled={isParsingRomaneio}><Video className="h-4 w-4"/></Button>
            </div>
            {produtosLancados.length > 0 && (
                <ScrollArea className="h-40 border rounded-md p-2">
                    {produtosLancados.map(p => (<div key={p.id} className="flex justify-between text-sm py-1 border-b last:border-0"><span>{p.produtoNome}</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.preco)}</span></div>))}
                </ScrollArea>
            )}
            <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCompra)}</span>
                <Button onClick={handleRegisterEntry} disabled={isSubmitting || produtosLancados.length === 0}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Registar"}</Button>
            </div>
        </div>
    );
}
