"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  QrCode, ArrowLeft, Mail, Loader2, CheckCircle,
  KeyRound, Eye, EyeOff, Lock
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

type Step = "email" | "sent" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // For demo purposes - simulating token from URL
  const [resetToken] = useState("mock_reset_token_12345");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement forgot password API call
      // const response = await api.auth.forgotPassword.mutate({ email });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("E-mail de recuperação enviado!");
      setStep("sent");
    } catch (error) {
      toast.error("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement reset password API call
      // const response = await api.auth.resetPassword.mutate({ token: resetToken, password });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Senha redefinida com sucesso!");
      router.push("/login");
    } catch (error) {
      toast.error("Erro ao redefinir senha. Tente novamente.");
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
            Recupere o acesso à sua conta.
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-md">
            Não se preocupe, acontece com todos. Vamos ajudá-lo a recuperar sua senha de forma segura.
          </p>

          {/* Security Info */}
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-white" />
              <span className="text-lg font-semibold text-white">Segurança em primeiro lugar</span>
            </div>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Link de recuperação válido por 24 horas</li>
              <li>• E-mail enviado apenas para contas existentes</li>
              <li>• Sua senha atual permanece ativa até a alteração</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => step === "email" ? router.push("/login") : setStep("email")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === "email" ? "Voltar ao login" : "Voltar"}
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>

          {/* Step 1: Enter Email */}
          {step === "email" && (
            <div className="card-modern p-8 fade-in">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
                <KeyRound className="w-8 h-8 text-teal-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Esqueceu sua senha?</h2>
              <p className="text-gray-500 mb-8 text-center">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSendEmail} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-modern pl-12"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>

              <p className="text-center text-gray-500 mt-6">
                Lembrou a senha?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Faça login
                </button>
              </p>
            </div>
          )}

          {/* Step 2: Email Sent */}
          {step === "sent" && (
            <div className="card-modern p-8 fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">E-mail enviado!</h2>
              <p className="text-gray-500 mb-6 text-center">
                Enviamos um link de recuperação para <strong className="text-gray-700">{email}</strong>
              </p>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6">
                <p className="text-sm text-amber-800 text-center">
                  <strong>Não recebeu o e-mail?</strong> Verifique sua pasta de spam ou lixo eletrônico.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full btn-outline"
                  onClick={() => setStep("email")}
                >
                  Tentar outro e-mail
                </Button>

                <Button
                  className="w-full btn-primary"
                  onClick={() => router.push("/login")}
                >
                  Voltar ao login
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <div className="card-modern p-8 fade-in">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-teal-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Criar nova senha</h2>
              <p className="text-gray-500 mb-8 text-center">
                Digite sua nova senha abaixo. Escolha uma senha forte e única.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-modern pl-12 pr-12"
                      disabled={isLoading}
                      autoFocus
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {password.length < 6 ? "Senha muito curta" :
                        password.length < 8 ? "Senha razoável" :
                          password.length < 10 ? "Senha boa" : "Senha forte"}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    "Redefinir senha"
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
