
'use client';

import { useMemo, useState } from 'react';
import type { Funcionario } from '@/types';
import { differenceInMonths, parseISO, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, CalendarDays, AlertTriangle, Info, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import RescisaoSimulacaoModal from './rescisao-simulacao-modal';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
};

interface DireitosProvisionamentoPanelProps {
    funcionario: Funcionario;
}

export default function DireitosProvisionamentoPanel({ funcionario }: DireitosProvisionamentoPanelProps) {
    const [isRescisaoModalOpen, setIsRescisaoModalOpen] = useState(false);

    const { tempoDeCasaEmMeses, feriasStatus, mesesDesdeUltimasFerias } = useMemo(() => {
        if (!funcionario.dataAdmissao) {
            return { tempoDeCasaEmMeses: 0, feriasStatus: { text: 'N/A', className: 'bg-gray-400', icon: Info }, mesesDesdeUltimasFerias: 0 };
        }
        
        const dataAdmissao = parseISO(funcionario.dataAdmissao);
        const hoje = new Date();
        
        const mesesTotaisTrabalhados = differenceInMonths(hoje, dataAdmissao);
        const mesesDesdeUltimasFerias = mesesTotaisTrabalhados % 12;

        let status = { text: 'Em aquisição', className: 'bg-blue-500', icon: Info };

        if (mesesTotaisTrabalhados >= 23) { // Período concessivo prestes a vencer
            status = { text: 'Alerta: Vencimento em Dobro', className: 'bg-red-600 animate-pulse', icon: AlertTriangle };
        } else if (mesesTotaisTrabalhados >= 12) { // Período aquisitivo completo
            status = { text: 'Direito Adquirido', className: 'bg-yellow-500 text-black', icon: CalendarDays };
        }

        return { tempoDeCasaEmMeses: mesesTotaisTrabalhados, feriasStatus: status, mesesDesdeUltimasFerias };
    }, [funcionario.dataAdmissao]);

    const provisoes = useMemo(() => {
        const salario = funcionario.salarioBase || 0;
        
        const mesesTrabalhadosNoAno = (new Date().getMonth() + 1);
        const provisaoMensal13 = salario / 12;
        const provisaoAcumulada13 = provisaoMensal13 * mesesTrabalhadosNoAno;

        const provisaoMensalFerias = (salario / 12) * (1 + 1/3);
        const provisaoAcumuladaFerias = provisaoMensalFerias * mesesDesdeUltimasFerias;
        
        const totalProvisoesMensal = provisaoMensal13 + provisaoMensalFerias;

        return {
            provisaoMensal13,
            provisaoAcumulada13,
            provisaoMensalFerias,
            provisaoAcumuladaFerias,
            totalProvisoesMensal
        }
    }, [funcionario.salarioBase, mesesDesdeUltimasFerias]);

    const custoMensalTotal = useMemo(() => {
        return funcionario.salarioBase + provisoes.totalProvisoesMensal;
    }, [funcionario.salarioBase, provisoes.totalProvisoesMensal]);

    return (
        <>
            <RescisaoSimulacaoModal
                isOpen={isRescisaoModalOpen}
                onClose={() => setIsRescisaoModalOpen(false)}
                funcionario={funcionario}
                tempoDeCasaEmMeses={tempoDeCasaEmMeses}
            />
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Direitos e Provisões de {funcionario.nome.split(' ')[0]}</CardTitle>
                        <CardDescription>Resumo dos direitos trabalhistas e provisões financeiras.</CardDescription>
                    </div>
                     <Button variant="outline" onClick={() => setIsRescisaoModalOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Simular Rescisão
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Férias</CardTitle>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{tempoDeCasaEmMeses} meses</div>
                                <p className="text-xs text-muted-foreground">de tempo de casa</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge className={cn("mt-2 text-white", feriasStatus.className)}>
                                                <feriasStatus.icon className="h-3 w-3 mr-1" />
                                                {feriasStatus.text}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs max-w-xs">
                                                {feriasStatus.text === 'Em aquisição' && 'O colaborador está a completar 12 meses para ter direito a férias.'}
                                                {feriasStatus.text === 'Direito Adquirido' && 'O colaborador já tem direito a tirar férias. A empresa tem até 11 meses para concedê-las.'}
                                                {feriasStatus.text === 'Alerta: Vencimento em Dobro' && 'O período para conceder as férias está a expirar. Conceda as férias para evitar o pagamento em dobro.'}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Provisão de 13º Salário</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(provisoes.provisaoAcumulada13)}</div>
                                <p className="text-xs text-muted-foreground">acumulado este ano</p>
                                <p className="text-xs text-muted-foreground mt-2">Provisão mensal: <span className="font-semibold">{formatCurrency(provisoes.provisaoMensal13)}</span></p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Provisão de Férias</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(provisoes.provisaoAcumuladaFerias)}</div>
                                <p className="text-xs text-muted-foreground">acumulado no período atual</p>
                                <p className="text-xs text-muted-foreground mt-2">Provisão mensal: <span className="font-semibold">{formatCurrency(provisoes.provisaoMensalFerias)}</span></p>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-primary">Custo Mensal Total Estimado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">{formatCurrency(custoMensalTotal)}</div>
                                <p className="text-xs text-muted-foreground">Salário Base + Provisões</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
