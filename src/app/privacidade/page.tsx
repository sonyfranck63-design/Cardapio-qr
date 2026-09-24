import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade — CardápioQR',
  description: 'Política de privacidade e proteção de dados pessoais (LGPD) do CardápioQR.',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Navegação Superior */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </Link>
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">LGPD</span>
        </div>
      </header>

      {/* Conteúdo de Privacidade */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="border-b border-stone-200 pb-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">Política de Privacidade</h1>
          <p className="text-stone-500 text-sm mt-2">Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</p>
        </div>

        <div className="prose prose-stone max-w-none space-y-6 text-stone-700 leading-relaxed text-sm sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">1. Compromisso com a Privacidade</h2>
            <p>
              O <strong>CardápioQR</strong> preza pela transparência, privacidade e proteção dos dados pessoais de seus usuários e dos clientes finais que acessam os cardápios digitais. Esta Política descreve como coletamos, tratamos e protegemos essas informações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">2. Dados Coletados</h2>
            <p className="mb-2">Coletamos exclusivamente os dados estritamente necessários para a prestação dos serviços:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-stone-600">
              <li><strong>Dados de Cadastro do Proprietário:</strong> Endereço de e-mail, senha criptografada e nome do estabelecimento.</li>
              <li><strong>Dados do Estabelecimento:</strong> Nome do restaurante, telefone/WhatsApp de atendimento, endereço físico e logotipo/imagens do cardápio.</li>
              <li><strong>Dados de Pagamento:</strong> Processados diretamente pela instituição de pagamento Mercado Pago sob criptografia bancária. Não armazenamos números de cartão de crédito.</li>
              <li><strong>Acesso dos Clientes aos Cardápios:</strong> Não exigimos cadastro, login ou download de aplicativo para os consumidores finais consultarem o cardápio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">3. Finalidade do Tratamento de Dados</h2>
            <p>Os dados coletados destinam-se a:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-stone-600">
              <li>Autenticar o acesso do proprietário ao painel de controle;</li>
              <li>Gerar os links públicos e QR Codes exclusivos para os cardápios;</li>
              <li>Redirecionar pedidos diretamente para o WhatsApp comercial do restaurante;</li>
              <li>Gerenciar a assinatura mensal e emitir comprovantes;</li>
              <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">4. Compartilhamento de Informações</h2>
            <p>
              O CardápioQR não vende, aluga ou compartilha dados pessoais com terceiros para fins de marketing. O compartilhamento ocorre unicamente com provedores essenciais à operação (hospedagem de infraestrutura, processamento de pagamentos Mercado Pago e armazenamento seguro).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">5. Seus Direitos (Art. 18 da LGPD)</h2>
            <p>Você tem o direito de solicitar a qualquer momento:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-stone-600">
              <li>Confirmação da existência de tratamento e acesso aos dados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Eliminação ou anonimização de dados desnecessários;</li>
              <li>Revogação do consentimento e exclusão definitiva de sua conta e cardápios.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-2">6. Contato com o Encarregado de Dados (DPO)</h2>
            <p>
              Para exercer seus direitos relativos à LGPD ou esclarecer dúvidas sobre esta Política, entre em contato através de nossa Central de Atendimento ou pelo painel do usuário.
            </p>
          </section>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} CardápioQR. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/termos" className="hover:text-stone-900 transition-colors">Termos de Uso</Link>
            <Link href="/" className="hover:text-stone-900 transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
