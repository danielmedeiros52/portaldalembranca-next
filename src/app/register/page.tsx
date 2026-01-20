"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { toast } from "sonner";
import {
  QrCode, Building2, Users, ArrowLeft, Eye, EyeOff,
  Mail, Lock, User, Phone, MapPin, FileText, Loader2, CheckCircle2
} from "lucide-react";
import { registerFuneralHome, registerFamilyUser } from "~/app/actions/auth";

const APP_TITLE = "Portal da Lembrança";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"funeral_home" | "family">("family");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Get plan from URL query params
  const selectedPlan = searchParams.get("plan");

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    companyName: "",
    cnpj: "",
    address: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (type: "funeral_home" | "family") => {
    setUserType(type);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Por favor, informe seu nome completo.");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Por favor, informe seu e-mail.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      toast.error("Por favor, informe um e-mail válido.");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Por favor, informe seu telefone.");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem.");
      return false;
    }
    if (userType === "funeral_home") {
      if (!formData.companyName?.trim()) {
        toast.error("Por favor, informe o nome da funerária.");
        return false;
      }
      if (!formData.cnpj?.trim()) {
        toast.error("Por favor, informe o CNPJ.");
        return false;
      }
    }
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let result;

      if (userType === "funeral_home") {
        result = await registerFuneralHome({
          name: formData.companyName || formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao criar conta");
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

        toast.success("Cadastro realizado com sucesso!");
        router.push("/dashboard");
      } else {
        result = await registerFamilyUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        });

        if (!result.success) {
          toast.error(result.error || "Erro ao criar conta");
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

        toast.success("Cadastro realizado com sucesso!");

        // Redirect to checkout if plan was selected, otherwise to dashboard
        if (selectedPlan) {
          router.push(`/checkout?plan=${selectedPlan}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Register error:", error);
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
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
            Junte-se a nós e preserve memórias.
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-md">
            Crie sua conta para começar a homenagear quem você ama com memoriais digitais únicos.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90">Cadastro rápido e gratuito</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90">Memoriais ilimitados</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white/90">Suporte dedicado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>

          <div className="card-modern p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crie sua conta</h2>
            <p className="text-gray-500 mb-6">Preencha seus dados para começar.</p>

            <Tabs value={userType} onValueChange={(v) => handleUserTypeChange(v as "funeral_home" | "family")}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="family"
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  Família
                </TabsTrigger>
                <TabsTrigger
                  value="funeral_home"
                  className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Building2 className="w-4 h-4" />
                  Funerária
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Common Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      placeholder={userType === "funeral_home" ? "Nome do responsável" : "Seu nome completo"}
                      value={formData.name}
                      onChange={handleChange}
                      className="input-modern pl-12"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Funeral Home Specific Fields */}
                {userType === "funeral_home" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Funerária</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="companyName"
                          placeholder="Funerária Exemplo Ltda"
                          value={formData.companyName}
                          onChange={handleChange}
                          className="input-modern pl-12"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="cnpj"
                          placeholder="00.000.000/0000-00"
                          value={formData.cnpj}
                          onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                          className="input-modern pl-12"
                          maxLength={18}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="address"
                          placeholder="Rua, número, bairro, cidade"
                          value={formData.address}
                          onChange={handleChange}
                          className="input-modern pl-12"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder={userType === "funeral_home" ? "contato@funeraria.com.br" : "seu@email.com"}
                      value={formData.email}
                      onChange={handleChange}
                      className="input-modern pl-12"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="(81) 99999-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      className="input-modern pl-12"
                      maxLength={15}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={handleChange}
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Repita a senha"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-modern pl-12 pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Li e aceito os{" "}
                    <a href="#" className="text-gray-700 hover:text-gray-900">
                      Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="#" className="text-gray-700 hover:text-gray-900">
                      Política de Privacidade
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    `Criar conta como ${userType === "funeral_home" ? "Funerária" : "Família"}`
                  )}
                </Button>
              </form>
            </Tabs>

            {/* Login Link */}
            <p className="text-center text-gray-500 mt-6">
              Já tem uma conta?{" "}
              <button
                onClick={() => router.push(selectedPlan ? `/login?plan=${selectedPlan}` : "/login")}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
