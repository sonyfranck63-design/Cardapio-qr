export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 pb-20 animate-fade-in font-sans">
      {/* Header Skeleton */}
      <div className="w-full bg-stone-200 h-44 sm:h-52 animate-pulse relative" />

      <div className="max-w-xl mx-auto px-4 -mt-10 sm:-mt-12 flex flex-col items-center text-center">
        {/* Logo Shimmer */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-stone-300 border-2 border-white shadow-md animate-pulse mb-3" />

        {/* Título do Restaurante */}
        <div className="h-7 w-48 bg-stone-200 rounded-lg animate-pulse mb-2" />

        {/* Tagline */}
        <div className="h-4 w-72 max-w-full bg-stone-200/80 rounded animate-pulse mb-3" />

        {/* Badges de Endereço/Horário */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="h-6 w-36 bg-stone-200/70 rounded-full animate-pulse" />
          <div className="h-6 w-28 bg-stone-200/70 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Nav de Categorias Skeleton */}
      <div className="border-y border-stone-200/80 bg-white/70 py-3 mb-6">
        <div className="max-w-xl mx-auto px-4 flex items-center gap-2 overflow-x-hidden">
          <div className="h-8 w-24 rounded-full bg-stone-200 animate-pulse shrink-0" />
          <div className="h-8 w-28 rounded-full bg-stone-200/80 animate-pulse shrink-0" />
          <div className="h-8 w-20 rounded-full bg-stone-200/80 animate-pulse shrink-0" />
          <div className="h-8 w-32 rounded-full bg-stone-200/60 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Seções e Itens Skeleton */}
      <div className="max-w-xl mx-auto px-4 space-y-8">
        {/* Categoria 1 */}
        <div className="space-y-3">
          <div className="h-5 w-32 bg-stone-300/80 rounded animate-pulse" />

          {/* Item 1 - com imagem */}
          <div className="flex gap-3.5 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-stone-200 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
                <div className="h-3 w-full bg-stone-100 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-stone-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-stone-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Item 2 - com imagem */}
          <div className="flex gap-3.5 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-stone-200 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-2">
                <div className="h-4 w-2/3 bg-stone-200 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-stone-100 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-stone-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Categoria 2 */}
        <div className="space-y-3 pt-2">
          <div className="h-5 w-40 bg-stone-300/80 rounded animate-pulse" />

          {/* Item 3 - estilo pontilhado clássico sem foto */}
          <div className="py-3 px-4 rounded-xl border border-stone-200/60 bg-white/80 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-40 bg-stone-200 rounded animate-pulse" />
              <div className="h-4 w-14 bg-stone-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-3/4 bg-stone-100 rounded animate-pulse" />
          </div>

          {/* Item 4 - estilo pontilhado clássico sem foto */}
          <div className="py-3 px-4 rounded-xl border border-stone-200/60 bg-white/80 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-4 w-48 bg-stone-200 rounded animate-pulse" />
              <div className="h-4 w-14 bg-stone-200 rounded animate-pulse" />
            </div>
            <div className="h-3 w-4/5 bg-stone-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
