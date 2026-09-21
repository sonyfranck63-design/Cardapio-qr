import Link from 'next/link'
import { QrCode, Smartphone, Zap, Check, ChevronRight, Star, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">CardápioQR</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/demo" className="text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
              <Sparkles className="w-4 h-4" />
              Ver Cardápio Demo
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
              Criar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            Cardápio pronto em menos de 5 minutos
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6 animate-slide-up">
            Seu cardápio digital{' '}
            <span className="text-gradient">via QR Code</span>{' '}
            sem complicação
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up">
            Crie categorias, adicione itens com fotos e preços, e compartilhe com seus clientes
            através de um QR Code gerado automaticamente. Simples assim.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
            <Link href="/demo" className="btn-primary text-base px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-500/25">
              <Sparkles className="w-5 h-5 text-amber-200" />
              Ver Cardápio de Demonstração (Ao Vivo)
            </Link>
            <Link href="/auth/register" className="btn-secondary text-base px-6 py-3.5">
              Criar meu cardápio grátis
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Preview mockup */}
      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Admin preview */}
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-500">Painel Admin</span>
              </div>
              <div className="space-y-3">
                <div className="h-8 bg-brand-500/20 rounded-lg w-3/4" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/10" />
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-white/10 rounded w-2/3" />
                        <div className="h-2.5 bg-white/5 rounded w-1/3" />
                      </div>
                      <div className="w-10 h-5 bg-brand-500/30 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile preview */}
            <div className="flex justify-center">
              <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-800">
                <div className="h-8 bg-gray-100 flex items-center justify-center">
                  <div className="w-20 h-4 bg-gray-300 rounded-full" />
                </div>
                <div className="bg-orange-500 p-4 text-white text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-2" />
                  <div className="h-3 bg-white/70 rounded w-2/3 mx-auto" />
                  <div className="h-2 bg-white/50 rounded w-1/3 mx-auto mt-1" />
                </div>
                <div className="bg-gray-50 p-3">
                  <div className="h-2.5 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-2 bg-white rounded-xl p-2 shadow-sm">
                        <div className="w-14 h-14 bg-orange-100 rounded-lg flex-shrink-0" />
                        <div className="flex-1">
                          <div className="h-2.5 bg-gray-200 rounded w-3/4 mb-1" />
                          <div className="h-2 bg-gray-100 rounded w-full mb-2" />
                          <div className="h-3 bg-orange-400 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-green-500 p-2 text-white text-center text-xs font-medium">
                  💬 Pedir pelo WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Tudo que você precisa, sem nada que você não precisa
          </h2>
          <p className="text-gray-400 text-center mb-14 max-w-xl mx-auto">
            Simples para o dono, elegante para o cliente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6 hover:border-brand-500/30 transition-colors duration-300 group">
                <div className="w-12 h-12 bg-brand-500/15 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-colors">
                  <f.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Simples e direto</h2>
          <div className="glass-card p-8 border-brand-500/30">
            <div className="text-5xl font-bold text-gradient mb-2">Grátis</div>
            <p className="text-gray-400 mb-8">Para sempre. Sem cartão de crédito.</p>
            <ul className="space-y-3 text-left mb-8">
              {freePlanFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-brand-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-primary w-full justify-center text-base py-3.5">
              Começar agora
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-400">CardápioQR</span>
        </div>
        <p>Feito com 🧡 para bares e restaurantes brasileiros</p>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: QrCode,
    title: 'QR Code automático',
    description: 'Gere e baixe seu QR Code em segundos. Imprima e coloque nas mesas.',
  },
  {
    icon: Smartphone,
    title: 'Otimizado para celular',
    description: 'Cardápio bonito e rápido em qualquer smartphone. Sem necessidade de app.',
  },
  {
    icon: Zap,
    title: 'Ativar/desativar itens',
    description: 'Item em falta? Desative com um clique e ele some do cardápio do cliente.',
  },
  {
    icon: Star,
    title: 'Fotos dos itens',
    description: 'Faça upload das fotos dos seus pratos e deixe o cardápio irresistível.',
  },
  {
    icon: Check,
    title: 'Link único',
    description: 'Cada restaurante tem seu link exclusivo: cardapioqr.com/seu-bar.',
  },
  {
    icon: ChevronRight,
    title: 'Botão WhatsApp',
    description: 'Botão fixo para o cliente chamar no WhatsApp e fazer o pedido.',
  },
]

const freePlanFeatures = [
  'Categorias ilimitadas',
  'Itens ilimitados com fotos',
  'QR Code para download',
  'Link público personalizado',
  'Botão WhatsApp integrado',
  'Atualizações em tempo real',
]
