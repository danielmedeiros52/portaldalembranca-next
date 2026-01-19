"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { QrCode, Building2, ArrowLeft, Eye, EyeOff, Mail, Lock, Loader2, Users } from "lucide-react";
import { loginFuneralHome } from "~/app/actions/auth";

const APP_TITLE = "Portal da Lembrança";

function FuneralHomeLoginContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      // Funeral home login
      const result = await loginFuneralHome(email, password);

      if (!result.success) {
        toast.error(result.error || "E-mail ou senha inválidos");
        return;
      }

      // Store session with token in localStorage
      if (result.user && result.token) {
        const sessionData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          type: result.user.type,
          token: result.token,
          loginTime: new Date().toISOString(),
        };

        if (typeof window !== "undefined") {
          localStorage.setItem("userSession", JSON.stringify(sessionData));
        }
      }

      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "E-mail ou senha inválidos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full"></div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{APP_TITLE}</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Portal exclusivo para parceiros.
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-md">
            Gerencie memoriais para suas famílias atendidas e ofereça um serviço completo de lembrança digital.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full text-white text-sm" style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              🏢 Gestão Centralizada
            </div>
            <div className="px-4 py-2 rounded-full text-white text-sm" style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              👨‍👩‍👧‍👦 Suporte às Famílias
            </div>
            <div className="px-4 py-2 rounded-full text-white text-sm" style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              📊 Relatórios
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </button>
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Acesso Família
            </button>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>

          <div className="card-modern p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-teal-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Acesso Funerária</h2>
            </div>
            <p className="text-gray-500 mb-8">Entre com suas credenciais de parceiro.</p>

            {/* Funeral Home Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="contato@funeraria.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-12"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-modern pl-12 pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <span className="text-sm text-gray-600">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm text-teal-600 hover:text-teal-700"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-gray-500 mt-6">
              Quer se tornar um parceiro?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Registre sua funerária
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FuneralHomeLoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <FuneralHomeLoginContent />
    </Suspense>
  );
}
