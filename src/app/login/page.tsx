"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const funeralHomeLogin = api.auth.funeralHomeLogin.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const familyUserLogin = api.auth.familyUserLogin.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      router.push("/family-dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const handleFuneralHomeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    funeralHomeLogin.mutate({ email, password });
  };

  const handleFamilyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    familyUserLogin.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Portal da Lembrança
          </h1>
          <p className="text-slate-600">Faça login para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login Funerária</CardTitle>
            <CardDescription>
              Acesse sua conta de funerária
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleFuneralHomeLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={funeralHomeLogin.isPending}
              >
                {funeralHomeLogin.isPending ? "Entrando..." : "Entrar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleFamilyLogin}
                disabled={familyUserLogin.isPending}
              >
                {familyUserLogin.isPending ? "Entrando..." : "Login como Família"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center text-sm text-slate-600">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Cadastre-se
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-slate-600 hover:underline">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  );
}
