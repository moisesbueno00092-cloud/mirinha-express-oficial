'use client';

import { useMemo } from 'react';
import type { Funcionario } from '@/types';
import { differenceInMonths, parseISO, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, CalendarDays, AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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

    const { tempoDeCasaEmMeses, feriasStatus } = useMemo(() => {
        if (!funcionario.dataAdmissao) {
            return { tempoDeCasaEmMeses: 0, feriasStatus: { text: 'N/A', className: 'bg-gray-400', icon: Info } };
        }
        
        const dataAdmissao = parseISO(funcionario.dataAdmissao);
        const hoje = new Date();
        
        const mesesTrabalhados = differenceInMonths(hoje, dataAdmissao);

        let status = { text: 'Em aquisição', className: 'bg-blue-500', icon: Info };

        if (mesesTrabalhados >= 22) { // Período concessivo prestes a vencer
            status = { text: 'Alerta: Vencimento em Dobro', className: 'bg-red-600 animate-pulse', icon: AlertTriangle };
        } else if (mesesTrabalhados >= 12) { // Período aquisitivo completo
            status = { text: 'Período Vencido', className: 'bg-yellow-500 text-black', icon: CalendarDays };
        }

        return { tempoDeCasaEmMeses: mesesTrabalhados, feriasStatus: status };
    }, [funcionario.dataAdmissao]);

    const provisoes = useMemo(() => {
        const salario = funcionario.salarioBase || 0;
        
        // Provisão para o 13º: 1/12 do salário por mês trabalhado no ano.
        const mesesTrabalhadosNoAno = (new Date().getMonth() + 1);
        const provisaoMensal13 = salario / 12;
        const provisaoAcumulada13 = provisaoMensal13 * mesesTrabalhadosNoAno;

        // Provisão para as Férias: 1/12 do salário + 1/3, por mês.
        const provisaoMensalFerias = (salario / 12) * (1 + 1/3);
        const provisaoAcumuladaFerias = provisaoMensalFerias * (tempoDeCasaEmMeses % 12);
        
        const totalProvisoesMensal = provisaoMensal13 + provisaoMensalFerias;

        return {
            provisaoMensal13,
            provisaoAcumulada13,
            provisaoMensalFerias,
            provisaoAcumuladaFerias,
            totalProvisoesMensal
        }
    }, [funcionario.salarioBase, tempoDeCasaEmMeses]);

    const custoMensalTotal = useMemo(() => {
        return funcionario.salarioBase + provisoes.totalProvisoesMensal;
    }, [funcionario.salarioBase, provisoes.totalProvisoesMensal]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Direitos e Provisões de {funcionario.nome.split(' ')[0]}</CardTitle>
                <CardDescription>Resumo dos direitos trabalhistas e provisões financeiras.</CardDescription>
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
                                        <p className="text-xs">
                                            {feriasStatus.text === 'Em aquisição' && 'O colaborador está a completar 12 meses para ter direito a férias.'}
                                            {feriasStatus.text === 'Período Vencido' && 'O colaborador já tem direito a tirar férias. A empresa tem 12 meses para concedê-las.'}
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
    )
}
