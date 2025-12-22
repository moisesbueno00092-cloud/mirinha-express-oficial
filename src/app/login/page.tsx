'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MirinhaLogo from '@/components/mirinha-logo';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (login(password)) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login efetuado com sucesso.',
      });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Senha Incorreta',
        description: 'A senha que você inseriu está errada. Tente novamente.',
      });
      setPassword('');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 text-center">
            <MirinhaLogo className="w-80 h-auto text-primary" />
       </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acesso Restrito</CardTitle>
          <CardDescription>Por favor, insira a senha para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={isLoading || !password}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
