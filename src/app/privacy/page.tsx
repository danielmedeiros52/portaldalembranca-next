import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Portal da Lembrança",
  description: "Política de privacidade e proteção de dados do Portal da Lembrança.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Política de Privacidade</h1>

      <div className="space-y-8 text-muted-foreground">
        <section>
          <p className="mb-4">
            <strong>Última atualização:</strong> 19 de janeiro de 2026
          </p>
          <p>
            O Portal da Lembrança ("nós", "nosso" ou "nos") está comprometido em proteger
            sua privacidade. Esta Política de Privacidade explica como coletamos, usamos,
            divulgamos e protegemos suas informações quando você usa nossa plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">1. Informações que Coletamos</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">1.1 Informações Fornecidas por Você</h3>
          <p className="mb-4">
            Coletamos informações que você nos fornece diretamente, incluindo:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li><strong>Dados de Cadastro:</strong> Nome, email, telefone, CNPJ (funerárias)</li>
            <li><strong>Dados de Memorial:</strong> Informações do falecido, fotos, biografias, datas importantes</li>
            <li><strong>Dados de Pagamento:</strong> Informações processadas através do Stripe (não armazenamos dados de cartão)</li>
            <li><strong>Comunicações:</strong> Mensagens de suporte, dedicatórias e tributos</li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold text-foreground">1.2 Informações Coletadas Automaticamente</h3>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li><strong>Dados de Uso:</strong> Páginas visitadas, tempo de acesso, cliques</li>
            <li><strong>Dados do Dispositivo:</strong> Tipo de navegador, endereço IP, sistema operacional</li>
            <li><strong>Cookies:</strong> Pequenos arquivos de texto armazenados no seu dispositivo</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">2. Como Usamos Suas Informações</h2>
          <p className="mb-4">
            Usamos as informações coletadas para:
          </p>
          <ul className="list-inside list-disc space-y-2 pl-4">
            <li>Fornecer, operar e manter nossa plataforma</li>
            <li>Processar transações e pagamentos</li>
            <li>Criar e gerenciar contas de usuário</li>
            <li>Enviar notificações e atualizações importantes</li>
            <li>Responder a solicitações de suporte ao cliente</li>
            <li>Melhorar e personalizar a experiência do usuário</li>
            <li>Detectar, prevenir e tratar fraudes ou problemas técnicos</li>
            <li>Cumprir obrigações legais</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">3. Compartilhamento de Informações</h2>
          <p className="mb-4">
            Não vendemos suas informações pessoais. Podemos compartilhar suas informações com:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li><strong>Prestadores de Serviços:</strong> Stripe (pagamentos), AWS S3 (armazenamento de fotos)</li>
            <li><strong>Cumprimento Legal:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
            <li><strong>Consentimento:</strong> Com seu consentimento explícito</li>
          </ul>
          <p>
            <strong>Nota sobre Memorials Públicos:</strong> As informações publicadas em memorials
            públicos são visíveis para qualquer pessoa que acesse a plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">4. Armazenamento e Segurança</h2>
          <p className="mb-4">
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
            <li>Senhas protegidas com hash bcrypt</li>
            <li>Tokens JWT para autenticação segura</li>
            <li>Armazenamento seguro em AWS S3 com controle de acesso</li>
            <li>Backups regulares do banco de dados</li>
            <li>Monitoramento contínuo de segurança</li>
          </ul>
          <p>
            <strong>Localização dos Dados:</strong> Seus dados são armazenados em servidores seguros
            localizados no Brasil e nos Estados Unidos (AWS).
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">5. Seus Direitos</h2>
          <p className="mb-4">
            De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li><strong>Acesso:</strong> Solicitar cópias de suas informações pessoais</li>
            <li><strong>Correção:</strong> Corrigir informações imprecisas ou incompletas</li>
            <li><strong>Exclusão:</strong> Solicitar a exclusão de suas informações (com exceções legais)</li>
            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
            <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
            <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato conosco em{" "}
            <a href="mailto:privacidade@portaldalembranca.com.br" className="text-primary hover:underline">
              privacidade@portaldalembranca.com.br
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">6. Cookies e Tecnologias Semelhantes</h2>
          <p className="mb-4">
            Usamos cookies essenciais para:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Manter você conectado (cookie de sessão)</li>
            <li>Lembrar suas preferências (tema escuro/claro)</li>
            <li>Analisar o uso da plataforma</li>
          </ul>
          <p>
            Você pode configurar seu navegador para recusar cookies, mas isso pode afetar
            a funcionalidade da plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">7. Retenção de Dados</h2>
          <p className="mb-4">
            Mantemos suas informações pelo tempo necessário para:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Fornecer nossos serviços</li>
            <li>Cumprir obrigações legais e fiscais</li>
            <li>Resolver disputas e fazer cumprir acordos</li>
          </ul>
          <p>
            Memorials podem ser mantidos indefinidamente, a menos que solicitado de outra forma.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">8. Privacidade de Menores</h2>
          <p>
            Nossa plataforma não é direcionada a menores de 18 anos. Não coletamos intencionalmente
            informações de menores sem o consentimento dos pais ou responsáveis. Se você acredita
            que coletamos informações de um menor, entre em contato conosco.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">9. Transferências Internacionais</h2>
          <p>
            Seus dados podem ser transferidos e processados em servidores fora do Brasil,
            incluindo Estados Unidos (AWS). Garantimos que essas transferências cumpram
            com a LGPD e padrões internacionais de proteção de dados.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">10. Alterações nesta Política</h2>
          <p className="mb-4">
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você
            sobre alterações significativas por email ou através de um aviso destacado em nossa
            plataforma. A data de "Última atualização" no topo desta página indica quando a
            política foi revisada pela última vez.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">11. Contato</h2>
          <p className="mb-4">
            Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados:
          </p>
          <div className="rounded-lg border bg-card p-6">
            <p className="mb-2"><strong>Portal da Lembrança</strong></p>
            <p className="mb-1">
              Email:{" "}
              <a href="mailto:privacidade@portaldalembranca.com.br" className="text-primary hover:underline">
                privacidade@portaldalembranca.com.br
              </a>
            </p>
            <p className="mb-1">
              Suporte:{" "}
              <a href="mailto:suporte@portaldalembranca.com.br" className="text-primary hover:underline">
                suporte@portaldalembranca.com.br
              </a>
            </p>
            <p>Telefone: +55 (11) 99999-9999</p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">12. Encarregado de Dados (DPO)</h2>
          <p>
            Nosso Encarregado de Proteção de Dados pode ser contatado em:{" "}
            <a href="mailto:dpo@portaldalembranca.com.br" className="text-primary hover:underline">
              dpo@portaldalembranca.com.br
            </a>
          </p>
        </section>

        <section className="rounded-lg border bg-muted/50 p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">Conformidade Legal</h2>
          <p>
            Esta política está em conformidade com:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-1 pl-4">
            <li>Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018</li>
            <li>Marco Civil da Internet - Lei nº 12.965/2014</li>
            <li>Código de Defesa do Consumidor - Lei nº 8.078/1990</li>
          </ul>
        </section>
      </div>

      {/* Back to home */}
      <div className="mt-12 text-center">
        <Link href="/" className="text-primary hover:underline">
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
