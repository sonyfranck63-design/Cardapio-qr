import Link from 'next/link'
import Image from 'next/image'
import {
  QrCode,
  Smartphone,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  Printer,
  SlidersHorizontal,
} from 'lucide-react'
import { PLAN_PRICE, formatPlanPrice } from '@/lib/plans'

export const metadata = {
  title: 'CardápioQR — O Cardápio Digital por QR Code para Bares e Restaurantes',
  description:
    'Substitua cardápios impressos e PDFs lentos por um cardápio digital rápido, elegante e direto no celular dos seus clientes. Teste 7 dias grátis.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans selection:bg-orange-100 selection:text-orange-950">
      {/* Barra de Navegação */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-stone-200/80 bg-[#faf8f5]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-stone-900">CardápioQR</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 transition-colors px-2 py-1"
            >
              Ver Demo ao Vivo
            </Link>
            <Link
              href="/auth/login"
              className="text-xs sm:text-sm text-stone-600 hover:text-stone-950 transition-colors px-2 py-1"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              Testar 7 dias grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-300 bg-white text-stone-700 text-xs font-semibold mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Sem necessidade de baixar aplicativo • Abre instantâneo no celular
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-950 tracking-tight leading-[1.15] mb-6">
            O cardápio digital que valoriza seus pratos e agiliza suas vendas
          </h1>

          <p className="text-base sm:text-xl text-stone-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Elimine PDFs lentos e reimpressões caras. Disponibilize fotos apetitosas, atualize preços em segundos e receba pedidos no WhatsApp com uma plaquinha QR Code na mesa.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-black text-white text-base font-semibold transition-all shadow-md active:scale-95"
            >
              Criar meu cardápio grátis
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-base font-semibold transition-all active:scale-95"
            >
              Explorar demonstração ao vivo
            </Link>
          </div>

          <p className="text-xs text-stone-500 mt-4">
            Teste completo por 7 dias • Sem cadastro de cartão de crédito no início
          </p>
        </div>
      </section>

      {/* Mockup Real do Produto (Visualização Celular + Plaquinha) */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            {/* Coluna da Esquerda: Plaquinha de Mesa */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-3 py-1 rounded-full mb-4">
                Plaquinha de Mesa A5/A6
              </span>
              <div className="w-44 h-44 bg-white p-3 rounded-2xl border-2 border-stone-800 shadow-md flex flex-col items-center justify-center mb-4">
                <QrCode className="w-32 h-32 text-stone-900" />
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-1">
                  Mesa 04 • CardápioQR
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">Imprima direto do painel</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xs">
                O sistema gera plaquinhas prontas para impressão e display acrílico com número da mesa e QR Code de alta resolução.
              </p>
            </div>

            {/* Coluna da Direita: Cardápio Real no Celular */}
            <div className="md:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                <Smartphone className="w-4 h-4 text-orange-700" />
                Experiência do Cliente
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug mb-3">
                Interface leve, elegante e pensada para smartphones
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
                Seu cliente aponta a câmera do celular e o cardápio abre no mesmo segundo. Sem travar, com navegação suave por abas, fotos em alta definição e botão para enviar o pedido diretamente para o seu WhatsApp.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">Personalização com a identidade da sua casa</h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Escolha entre famílias de fontes clássicas, modernas ou de boteco, foto de capa e cores exclusivas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">Controle de pratos em falta com 1 clique</h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Acabou um ingrediente no meio do turno? Marque como esgotado ou desative no painel na hora.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Essenciais */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Construído para a rotina dinâmica de bares e restaurantes
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3">
              Recursos objetivos que realmente fazem diferença no atendimento, sem complicação desnecessária.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1.5">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preço Transparente */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
            Plano Único & Completo
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-4 mb-2">
            Investimento acessível e transparente
          </h2>
          <p className="text-sm text-stone-600 mb-8">
            Sem taxas por pedido. Sem fidelidade. Cancele quando quiser.
          </p>

          <div className="bg-white border-2 border-stone-900 rounded-3xl p-8 shadow-lg text-left">
            <div className="flex items-baseline justify-between border-b border-stone-200 pb-6 mb-6">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Assinatura Mensal Pro</h3>
                <p className="text-xs text-stone-500 mt-0.5">Acesso total a todas as funcionalidades</p>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-extrabold text-stone-900">
                  {formatPlanPrice(PLAN_PRICE)}
                </div>
                <div className="text-xs text-stone-500">por mês</div>
              </div>
            </div>

            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                7 dias gratuitos de avaliação completa
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {planBenefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-stone-700">
                  <Check className="w-4 h-4 text-orange-700 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-700 hover:bg-orange-800 text-white font-bold text-sm transition-all shadow-md active:scale-95"
            >
              Começar período grátis agora
              <ChevronRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>Pagamento seguro via Mercado Pago (PIX e Cartão)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé Institucional */}
      <footer className="border-t border-stone-200 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-stone-900 rounded-md flex items-center justify-center text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-stone-900">CardápioQR</span>
            <span className="text-xs text-stone-400 ml-2">SaaS para bares e restaurantes</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600">
            <Link href="/demo" className="hover:text-stone-950 transition-colors">
              Demonstração
            </Link>
            <Link href="/termos" className="hover:text-stone-950 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-stone-950 transition-colors">
              Política de Privacidade (LGPD)
            </Link>
            <Link href="/auth/login" className="hover:text-stone-950 transition-colors">
              Área do Cliente
            </Link>
          </div>

          <div className="text-xs text-stone-400 text-center md:text-right">
            &copy; {new Date().getFullYear()} CardápioQR. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: QrCode,
    title: 'QR Code e Plaquinha de Mesa',
    description: 'Exportação em SVG e PNG de alta qualidade e modelo de plaquinha A5/A6 pronto para imprimir.',
  },
  {
    icon: Smartphone,
    title: 'Ultra-rápido no Smartphone',
    description: 'Carregamento instantâneo via cache em memória, sem exigir aplicativo nem login dos seus clientes.',
  },
  {
    icon: Zap,
    title: 'WhatsApp Direto',
    description: 'O cliente escolhe o prato e o botão envia o pedido formatado diretamente no WhatsApp da sua cozinha.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Personalização Visual',
    description: 'Capa panorâmica, logotipo, cores institucionais e 3 tipografias selecionadas para cada estilo gastronômico.',
  },
  {
    icon: Printer,
    title: 'Estilo Impresso para Pratos sem Foto',
    description: 'Apresentação clássica com linhas pontilhadas de restaurante para pratos que não possuem fotografia.',
  },
  {
    icon: ShieldCheck,
    title: 'Controle de Esgotados',
    description: 'Oculte ou destaque como esgotado os itens indisponíveis instantaneamente pelo seu celular.',
  },
]

const planBenefits = [
  'Categorias e pratos ilimitados',
  'Upload e compressão automática de fotos em WebP',
  'QR Code exclusivo em alta resolução (SVG e PNG)',
  'Modelo de plaquinha de mesa para impressão',
  'Integração direta com pedidos no WhatsApp',
  'Personalização de tema, cores, logo e banner de capa',
  'Endereço integrado com Google Maps e perfil do Instagram',
  'Atualizações de preços em tempo real',
]
