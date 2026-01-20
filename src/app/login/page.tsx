"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { QrCode, Building2, Users, ArrowLeft, Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { loginFuneralHome, loginFamilyUser } from "~/app/actions/auth";

const APP_TITLE = "Portal da Lembrança";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get plan from URL query params
  const selectedPlan = searchParams.get("plan");

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
      // Family login only
      const result = await loginFamilyUser(email, password);

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

      // Redirect after successful login
      if (selectedPlan) {
        router.push(`/checkout?plan=${selectedPlan}`);
      } else {
        router.push("/dashboard");
      }
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
      <div className="hidden lg:flex lg:w-1/2 bg-gray-800 relative overflow-hidden">

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">{APP_TITLE}</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Um lugar para recordar e homenagear.
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-md">
            Acesse sua conta para gerenciar os memoriais e manter vivas as histórias de quem partiu.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full text-white text-sm" style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              ✨ Códigos QR Únicos
            </div>
            <div className="px-4 py-2 rounded-full text-white text-sm" style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              📷 Galerias de Fotos
            </div>
            <div className="px-4 py-2 rounded-full text-white text-sm" style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              💬 Dedicações
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </button>
            <button
              onClick={() => router.push("/funeraria/login")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Acesso Funerária
            </button>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>

          <div className="card-modern p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Olá! Acesse sua conta</h2>
            <p className="text-gray-500 mb-8">Preencha seus dados para acessar o portal.</p>

            {/* Plan Selection Notice */}
            {selectedPlan && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-800 text-center">
                  <strong>Plano selecionado:</strong> {selectedPlan === 'essencial' ? 'Memorial Essencial' : selectedPlan === 'premium' ? 'Memorial Premium' : 'Plano Família'}
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Faça login ou cadastre-se para continuar com a contratação.
                </p>
              </div>
            )}

            {/* Family Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="familia@email.com"
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
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500" />
                  <span className="text-sm text-gray-600">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  selectedPlan ? "Entrar e Continuar" : "Entrar"
                )}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-center text-gray-500 mt-6">
              Não tem uma conta?{" "}
              <button
                onClick={() => router.push(selectedPlan ? `/register?plan=${selectedPlan}` : "/register")}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Registre-se
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
