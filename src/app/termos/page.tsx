import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso — CardápioQR',
  description: 'Termos e condições gerais de uso da plataforma CardápioQR.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Navegação Superior */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </Link>
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">Legal</span>
        </div>
      </header>

      {/* Conteúdo dos Termos */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="border-b border-stone-200 pb-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">Termos de Uso</h1>
          <p className="text-stone-500 text-sm mt-2">Última atualização: 24 de setembro de 2026</p>
        </div>

        <div className="prose prose-stone max-w-none space-y-6 text-stone-700 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta ou utilizar a plataforma <strong>CardápioQR</strong>, você concorda expressamente com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde com qualquer disposição, solicitamos que não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">2. Descrição do Serviço</h2>
            <p>
              O CardápioQR é uma plataforma SaaS (Software as a Service) desenvolvida para permitir que bares, restaurantes, cafés e estabelecimentos comerciais criem, gerenciem e disponibilizem cardápios digitais acessíveis via QR Code, além de redirecionar pedidos diretamente ao WhatsApp do estabelecimento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">3. Cadastro e Segurança da Conta</h2>
            <p>
              Para utilizar os recursos administrativos, é necessário criar uma conta informando dados verídicos e mantê-los atualizados. O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso, respondendo por quaisquer atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">4. Assinatura e Pagamentos</h2>
            <p>
              O CardápioQR oferece um período de teste gratuito de 7 (sete) dias corridos. Após o período de avaliação, o acesso continuado ao painel e a manutenção do cardápio online estão condicionados à contratação de assinatura mensal no valor anunciado (R$ 49,90/mês). Os pagamentos são processados de forma segura através da instituição Mercado Pago. O cancelamento pode ser efetuado a qualquer momento pelo usuário.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">5. Conteúdo e Responsabilidade</h2>
            <p>
              O estabelecimento comercial é integral e exclusivamente responsável pelas informações inseridas no cardápio, incluindo preços, descrições dos pratos, ingredientes, fotografias e cumprimento das normas da vigilância sanitária e do Código de Defesa do Consumidor brasileiro. É terminantemente proibido publicar conteúdo ilegal, difamatório, pornográfico ou que infrinja direitos autorais de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">6. Disponibilidade e Suporte</h2>
            <p>
              Empregamos nossos melhores esforços técnicos para assegurar máxima disponibilidade da plataforma (uptime). Eventuais manutenções programadas ou instabilidades decorrentes de fatores fora de nosso controle serão comunicadas com antecedência razoável sempre que viável.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">7. Foro e Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer litígios decorrentes deste instrumento, as partes elegem o foro da Comarca do domicílio do usuário, renunciando a qualquer outro por mais privilegiado que seja.
            </p>
          </section>
        </div>
      </main>

      {/* Rodapé Simples */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} CardápioQR. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/privacidade" className="hover:text-stone-900 transition-colors">Privacidade</Link>
            <Link href="/" className="hover:text-stone-900 transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
