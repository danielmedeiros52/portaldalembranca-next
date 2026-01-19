import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Serviço | Portal da Lembrança",
  description: "Termos e condições de uso do Portal da Lembrança.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Termos de Serviço</h1>

      <div className="space-y-8 text-muted-foreground">
        <section>
          <p className="mb-4">
            <strong>Última atualização:</strong> 19 de janeiro de 2026
          </p>
          <p>
            Bem-vindo ao Portal da Lembrança. Ao acessar ou usar nossa plataforma, você concorda
            em cumprir estes Termos de Serviço. Por favor, leia-os cuidadosamente.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">1. Aceitação dos Termos</h2>
          <p className="mb-4">
            Ao criar uma conta, acessar ou usar o Portal da Lembrança, você concorda em estar
            vinculado a estes Termos de Serviço e nossa{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            . Se você não concorda com qualquer parte destes termos, não deve usar nossa plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">2. Descrição do Serviço</h2>
          <p className="mb-4">
            O Portal da Lembrança é uma plataforma digital de memorial que permite:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Criação e gerenciamento de páginas memoriais</li>
            <li>Upload de fotos e informações biográficas</li>
            <li>Geração de códigos QR para acesso físico</li>
            <li>Compartilhamento de tributos e dedicatórias</li>
            <li>Processamento de pagamentos via PIX e cartão de crédito</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">3. Tipos de Conta</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">3.1 Funerárias</h3>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Podem criar múltiplos memorials</li>
            <li>Têm acesso a dashboard administrativo</li>
            <li>Podem convidar usuários familiares para colaborar</li>
            <li>São responsáveis por pagamentos de assinaturas</li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold text-foreground">3.2 Usuários Familiares</h3>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Acesso via convite de funerária</li>
            <li>Podem editar memorials específicos autorizados</li>
            <li>Não podem criar novos memorials</li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold text-foreground">3.3 Visitantes Públicos</h3>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Podem visualizar memorials públicos</li>
            <li>Podem deixar dedicatórias (se habilitado)</li>
            <li>Não requerem conta para visualização</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">4. Registro e Segurança da Conta</h2>
          <p className="mb-4">
            Ao criar uma conta, você concorda em:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Fornecer informações precisas, atuais e completas</li>
            <li>Manter a segurança de sua senha</li>
            <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            <li>Ser responsável por todas as atividades em sua conta</li>
            <li>Não compartilhar suas credenciais de acesso</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">5. Uso Aceitável</h2>
          <p className="mb-4">
            Você concorda em NÃO:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Publicar conteúdo ofensivo, difamatório ou ilegal</li>
            <li>Violar direitos de propriedade intelectual de terceiros</li>
            <li>Usar a plataforma para spam ou atividades comerciais não autorizadas</li>
            <li>Tentar hackear ou comprometer a segurança da plataforma</li>
            <li>Fazer scraping ou extração automatizada de dados</li>
            <li>Criar contas falsas ou enganosas</li>
            <li>Publicar informações pessoais de terceiros sem consentimento</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">6. Conteúdo do Usuário</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">6.1 Propriedade</h3>
          <p className="mb-4">
            Você mantém todos os direitos sobre o conteúdo que envia (fotos, textos, biografias).
            Ao publicar conteúdo, você nos concede uma licença não exclusiva, mundial e isenta
            de royalties para usar, armazenar e exibir esse conteúdo conforme necessário para
            fornecer nossos serviços.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">6.2 Responsabilidade</h3>
          <p className="mb-4">
            Você é o único responsável pelo conteúdo que publica. Reservamos o direito de
            remover conteúdo que viole estes termos ou seja inadequado, sem aviso prévio.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">6.3 Direitos Autorais</h3>
          <p className="mb-4">
            Ao fazer upload de fotos, você confirma que possui os direitos ou permissão
            necessária para usar essas imagens. Respeitamos a propriedade intelectual e
            responderemos a notificações DMCA válidas.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">7. Pagamentos e Assinaturas</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">7.1 Planos e Preços</h3>
          <p className="mb-4">
            Nossos planos de assinatura e preços estão listados no site. Reservamos o direito
            de alterar preços mediante notificação prévia de 30 dias.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">7.2 Cobrança</h3>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Pagamentos processados via Stripe (PIX e cartão de crédito)</li>
            <li>Assinaturas renovadas automaticamente</li>
            <li>Você pode cancelar a qualquer momento via dashboard</li>
            <li>Cancelamentos entram em vigor no fim do período pago</li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold text-foreground">7.3 Reembolsos</h3>
          <p className="mb-4">
            Reembolsos são avaliados caso a caso. Entre em contato com nosso{" "}
            <Link href="/support" className="text-primary hover:underline">
              suporte
            </Link>
            {" "}para solicitar reembolso dentro de 7 dias da compra.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">7.4 Falha de Pagamento</h3>
          <p className="mb-4">
            Se o pagamento falhar, você tem 15 dias para regularizar antes que o acesso seja
            suspenso. Memorials não serão deletados durante suspensão.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">8. Término e Suspensão</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">8.1 Por Você</h3>
          <p className="mb-4">
            Você pode encerrar sua conta a qualquer momento através das configurações ou
            entrando em contato conosco.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">8.2 Por Nós</h3>
          <p className="mb-4">
            Podemos suspender ou encerrar sua conta se:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Você violar estes Termos de Serviço</li>
            <li>Seu uso causar danos à plataforma ou outros usuários</li>
            <li>Exigido por lei</li>
            <li>Atividade fraudulenta ou suspeita for detectada</li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold text-foreground">8.3 Efeito do Término</h3>
          <p className="mb-4">
            Após o término, você perde acesso à plataforma. Podemos reter seus dados conforme
            necessário para cumprir obrigações legais. Você pode solicitar exportação de dados
            antes do término.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">9. Limitação de Responsabilidade</h2>
          <p className="mb-4">
            NA EXTENSÃO MÁXIMA PERMITIDA POR LEI:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>O serviço é fornecido "COMO ESTÁ" e "CONFORME DISPONÍVEL"</li>
            <li>Não garantimos disponibilidade ininterrupta ou livre de erros</li>
            <li>Não somos responsáveis por perda de dados, lucros ou danos indiretos</li>
            <li>Nossa responsabilidade total é limitada ao valor pago nos últimos 12 meses</li>
            <li>Não somos responsáveis por conteúdo publicado por usuários</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">10. Indenização</h2>
          <p className="mb-4">
            Você concorda em indenizar e isentar o Portal da Lembrança, seus funcionários e
            parceiros de quaisquer reclamações, danos ou despesas decorrentes de:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Seu uso da plataforma</li>
            <li>Violação destes Termos</li>
            <li>Conteúdo que você publica</li>
            <li>Violação de direitos de terceiros</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">11. Propriedade Intelectual</h2>
          <p className="mb-4">
            O Portal da Lembrança e todo seu conteúdo (exceto conteúdo do usuário) são
            propriedade nossa ou de nossos licenciadores. Isso inclui:
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 pl-4">
            <li>Código-fonte e design da plataforma</li>
            <li>Logotipos e marcas registradas</li>
            <li>Documentação e materiais de marketing</li>
          </ul>
          <p>
            Você não pode copiar, modificar ou distribuir nosso conteúdo sem permissão expressa.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">12. Alterações nos Termos</h2>
          <p className="mb-4">
            Podemos modificar estes Termos a qualquer momento. Notificaremos você sobre
            mudanças significativas por email ou através da plataforma. Seu uso continuado
            após as mudanças constitui aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">13. Privacidade</h2>
          <p>
            Sua privacidade é importante para nós. Por favor, revise nossa{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
            {" "}para entender como coletamos e usamos suas informações.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">14. Resolução de Disputas</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">14.1 Lei Aplicável</h3>
          <p className="mb-4">
            Estes Termos são regidos pelas leis da República Federativa do Brasil.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">14.2 Jurisdição</h3>
          <p className="mb-4">
            Quaisquer disputas serão resolvidas nos tribunais de São Paulo, SP, Brasil.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">14.3 Resolução Amigável</h3>
          <p className="mb-4">
            Antes de iniciar ação judicial, você concorda em tentar resolver disputas
            amigavelmente através de nosso{" "}
            <Link href="/support" className="text-primary hover:underline">
              suporte ao cliente
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">15. Disposições Gerais</h2>

          <h3 className="mb-3 text-xl font-semibold text-foreground">15.1 Acordo Completo</h3>
          <p className="mb-4">
            Estes Termos constituem o acordo completo entre você e o Portal da Lembrança.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">15.2 Divisibilidade</h3>
          <p className="mb-4">
            Se qualquer disposição for considerada inválida, as demais permanecem em vigor.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">15.3 Não Renúncia</h3>
          <p className="mb-4">
            Nossa falha em fazer cumprir qualquer direito não constitui renúncia desse direito.
          </p>

          <h3 className="mb-3 text-xl font-semibold text-foreground">15.4 Cessão</h3>
          <p className="mb-4">
            Você não pode transferir seus direitos sob estes Termos. Podemos ceder nossos
            direitos a uma empresa afiliada ou sucessora.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-foreground">16. Contato</h2>
          <p className="mb-4">
            Para questões sobre estes Termos de Serviço:
          </p>
          <div className="rounded-lg border bg-card p-6">
            <p className="mb-2"><strong>Portal da Lembrança</strong></p>
            <p className="mb-1">
              Email:{" "}
              <a href="mailto:legal@portaldalembranca.com.br" className="text-primary hover:underline">
                legal@portaldalembranca.com.br
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

        <section className="rounded-lg border bg-muted/50 p-6">
          <h2 className="mb-4 text-xl font-bold text-foreground">Documentos Relacionados</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </li>
            <li>
              <Link href="/support" className="text-primary hover:underline">
                Suporte ao Cliente
              </Link>
            </li>
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
