
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MirinhaLogo from '@/components/mirinha-logo';

/**
 * This component is rendered by Next.js when a route is not found.
 * It automatically redirects the user to the homepage.
 */
export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the homepage after a short delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center text-center p-4 bg-background">
        <MirinhaLogo className="w-64 sm:w-80 h-auto text-primary mb-4" />
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="mt-6 text-2xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">A redirecionar para a página principal...</p>
    </div>
  );
}
