"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { Shield, User, Mail, Lock, Key, Loader2, AlertTriangle } from "lucide-react";
import { api } from "~/trpc/react";

const APP_TITLE = "Portal da Lembrança";

export default function AdminSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    setupKey: "",
  });

  // Check if any active admin users exist
  const { data: hasAdmins, isLoading: checkingAdmins } = api.admin.hasActiveAdmins.useQuery();
  const createAdminMutation = api.admin.createAdmin.useMutation();

  // Redirect if admins already exist
  useEffect(() => {
    if (hasAdmins) {
      toast.error("O sistema já possui administradores ativos");
      router.push("/admin/login");
    }
  }, [hasAdmins, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.setupKey) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      await createAdminMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        setupKey: formData.setupKey,
      });

      toast.success("Administrador criado com sucesso!");

      // Clear form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        setupKey: "",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (error: any) {
      console.error("Admin setup error:", error);
      toast.error(error.message || "Erro ao criar administrador");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking
  if (checkingAdmins) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-slate-400">Verificando configuração...</p>
        </div>
      </div>
    );
  }

  // Show blocked message if admins exist
  if (hasAdmins) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
            <p className="text-slate-400">Página de configuração desabilitada</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
            <p className="text-slate-300 text-center mb-6">
              Esta página só pode ser acessada durante a configuração inicial do sistema.
              O sistema já possui administradores ativos.
            </p>
            <Button
              onClick={() => router.push("/admin/login")}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25"
            >
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{APP_TITLE}</h1>
          <p className="text-slate-400">Configuração Inicial - Criar Administrador</p>
        </div>

        {/* Setup Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
            <p className="text-amber-200 text-sm">
              <strong>⚠️ Importante:</strong> Esta página é para configuração inicial apenas.
              A chave de setup é: <code className="bg-black/30 px-2 py-1 rounded">PORTAL_ADMIN_SETUP_2024</code>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Chave de Configuração
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="PORTAL_ADMIN_SETUP_2024"
                  value={formData.setupKey}
                  onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Administrador"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/admin/login")}
              className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
            >
              Já tem uma conta? Fazer login →
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-8">
          ⚠️ Esta página deve ser desabilitada após a configuração inicial
        </p>
      </div>
    </div>
  );
}
