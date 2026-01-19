import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MessageCircle, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Suporte ao Cliente | Portal da Lembrança",
  description: "Entre em contato com nossa equipe de suporte para ajuda com sua conta ou memorial.",
};

export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Suporte ao Cliente</h1>
        <p className="text-lg text-muted-foreground">
          Estamos aqui para ajudar você com qualquer dúvida ou problema relacionado ao Portal da Lembrança.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Support */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Email</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            Entre em contato conosco por email para suporte detalhado.
          </p>
          <a
            href="mailto:suporte@portaldalembranca.com.br"
            className="text-primary hover:underline"
          >
            suporte@portaldalembranca.com.br
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            Tempo de resposta: 24-48 horas úteis
          </p>
        </div>

        {/* Phone Support */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Telefone</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            Fale diretamente com nossa equipe de suporte.
          </p>
          <a
            href="tel:+5511999999999"
            className="text-primary hover:underline"
          >
            +55 (11) 99999-9999
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            Seg-Sex: 9h às 18h (horário de Brasília)
          </p>
        </div>

        {/* WhatsApp Support */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">WhatsApp</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            Atendimento rápido via WhatsApp.
          </p>
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Iniciar conversa
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            Seg-Sex: 9h às 18h (horário de Brasília)
          </p>
        </div>

        {/* FAQ */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Perguntas Frequentes</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            Encontre respostas para as dúvidas mais comuns.
          </p>
          <Link href="#faq" className="text-primary hover:underline">
            Ver FAQ
          </Link>
        </div>
      </div>

      {/* Common Issues */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">Como Podemos Ajudar?</h2>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">Problemas com Pagamento</h3>
            <p className="text-muted-foreground">
              Se você está tendo problemas com pagamentos via PIX ou cartão de crédito,
              entre em contato conosco com os detalhes da transação.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">Gerenciamento de Memorial</h3>
            <p className="text-muted-foreground">
              Precisa de ajuda para criar, editar ou gerenciar um memorial?
              Nossa equipe pode guiá-lo através do processo.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">Problemas Técnicos</h3>
            <p className="text-muted-foreground">
              Encontrou um bug ou problema técnico? Relate-nos com detalhes
              para que possamos resolver rapidamente.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 text-lg font-semibold">Questões de Conta</h3>
            <p className="text-muted-foreground">
              Problemas com login, senha ou configurações da conta?
              Podemos ajudar a recuperar seu acesso.
            </p>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="mt-12 rounded-lg border bg-muted/50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Horário de Atendimento</h2>
        <div className="space-y-2 text-muted-foreground">
          <p><strong>Segunda a Sexta:</strong> 9h às 18h (horário de Brasília)</p>
          <p><strong>Sábado:</strong> 9h às 13h (horário de Brasília)</p>
          <p><strong>Domingo e Feriados:</strong> Fechado</p>
          <p className="mt-4 text-sm">
            Mensagens enviadas fora do horário de atendimento serão respondidas
            no próximo dia útil.
          </p>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-primary hover:underline">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
