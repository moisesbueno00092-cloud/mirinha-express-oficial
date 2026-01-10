
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PasswordDialog from "@/components/password-dialog";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {

    return (
        <div className="container mx-auto max-w-5xl p-2 sm:p-4 lg:p-8">
            <header className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" passHref>
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios de Vendas</h1>
                  <p className="text-muted-foreground">Análise de vendas, histórico e relatórios de clientes.</p>
                </div>
              </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
