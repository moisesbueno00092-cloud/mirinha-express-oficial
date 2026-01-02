
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings, BookOpen } from 'lucide-react';

export default function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Ajuda e Informações de RH</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5"/> Guia Rápido do Módulo de RH</SheetTitle>
          <SheetDescription>
            Um guia passo a passo para utilizar todas as funcionalidades de Recursos Humanos.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6 text-sm">
             <section>
                <div className="space-y-4 text-muted-foreground">
                    <div>
                        <h4 className="font-semibold text-foreground">Passo 1: Aceder ao Módulo</h4>
                        <p>Aceda a este módulo através do separador <span className="font-semibold">Recursos Humanos</span> na página de Gestão Administrativa. Introduza a senha para aceder.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Passo 2: Cadastrar um Colaborador</h4>
                        <p>Preencha os campos Nome, Cargo, Salário Base e Data de Admissão no painel "Cadastro de Colaborador" e clique em "Cadastrar".</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Passo 3: Realizar Lançamentos Financeiros</h4>
                        <p>No painel "Gestão Financeira de Pessoal", selecione o colaborador e o tipo de lançamento:</p>
                        <ul className="list-decimal pl-6 mt-2 space-y-1">
                            <li><span className="font-semibold text-foreground">Vale, Bónus, Comissão, Desconto:</span> Introduza o <span className="font-bold">valor monetário</span> direto. Ex: Para um vale de R$50, introduza `50`.</li>
                            <li><span className="font-semibold text-foreground">Hora Extra:</span> Introduza a <span className="font-bold">quantidade de horas</span>. O sistema calcula o valor a pagar com base no salário (com acréscimo de 50%).</li>
                            <li><span className="font-semibold text-foreground">Falta:</span> Introduza a <span className="font-bold">quantidade de dias</span> de ausência. O sistema calcula o desconto com base no salário diário.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Passo 4: Consultar Direitos e Simular Rescisão</h4>
                        <p>Após selecionar um colaborador na lista, o painel <span className="font-semibold">"Direitos e Provisões"</span> aparecerá. Nele pode:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Verificar o status das <span className="font-bold">férias</span> e o tempo de casa.</li>
                            <li>Acompanhar a provisão acumulada do <span className="font-bold">13º Salário</span>.</li>
                            <li>Clicar em <span className="font-semibold">"Simular Rescisão"</span> para estimar os custos de um desligamento, escolhendo a data e o motivo.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Passo 5: Fechar a Folha de Pagamento (Holerite)</h4>
                        <p>No painel <span className="font-semibold">"Fechamento de Folha"</span> (que também aparece ao selecionar um funcionário):</p>
                         <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Selecione o <span className="font-bold">mês</span> e o <span className="font-bold">ano</span> desejados.</li>
                            <li>O sistema exibirá um <span className="font-bold">demonstrativo</span> com todos os vencimentos e descontos, calculando o valor líquido.</li>
                            <li>Clique em <span className="font-semibold">"Fechar e Salvar Mês"</span> para arquivar o holerite e criar um histórico. Um mês fechado não pode ser alterado.</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
