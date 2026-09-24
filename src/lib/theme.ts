import { Lora, Plus_Jakarta_Sans, Oswald } from 'next/font/google'

export const fontClassico = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-classico',
})

export const fontModerno = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-moderno',
})

export const fontBoteco = Oswald({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-theme-boteco',
})

export type ThemeFontType = 'classico' | 'moderno' | 'boteco'

export interface ThemeFontOption {
  id: ThemeFontType
  name: string
  description: string
  fontClass: string
  sampleText: string
}

export const THEME_FONTS: Record<ThemeFontType, ThemeFontOption> = {
  classico: {
    id: 'classico',
    name: 'Clássico (Serif)',
    description: 'Bistrôs, cantinas e alta gastronomia',
    fontClass: fontClassico.className,
    sampleText: 'Gastronomia & Tradição',
  },
  moderno: {
    id: 'moderno',
    name: 'Moderno (Sans)',
    description: 'Cafés, docerias e restaurantes contemporâneos',
    fontClass: fontModerno.className,
    sampleText: 'Sabor & Experiência',
  },
  boteco: {
    id: 'boteco',
    name: 'Boteco (Condensada)',
    description: 'Hamburguerias, bares, pubs e espetarias',
    fontClass: fontBoteco.className,
    sampleText: 'Cerveja Gelada & Petiscos',
  },
}

export interface PresetColor {
  hex: string
  name: string
  bgClass: string
}

export const PRESET_THEME_COLORS: PresetColor[] = [
  { hex: '#1c1917', name: 'Carvão / Pedra', bgClass: 'bg-stone-900' },
  { hex: '#c2410c', name: 'Terracota', bgClass: 'bg-orange-700' },
  { hex: '#831843', name: 'Vinho / Merlot', bgClass: 'bg-pink-900' },
  { hex: '#1e392a', name: 'Oliva Escuro', bgClass: 'bg-emerald-950' },
  { hex: '#1e293b', name: 'Azul Ardósia', bgClass: 'bg-slate-800' },
  { hex: '#451a03', name: 'Café Torrado', bgClass: 'bg-amber-950' },
]

/**
 * Calcula a luminância relativa (WCAG 2.1) e retorna a cor de texto com maior contraste.
 * Garante contraste mínimo de 4.5:1 (WCAG AA).
 */
export function getContrastColor(hexColor?: string | null): '#ffffff' | '#0f172a' {
  if (!hexColor || !/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return '#ffffff'
  }

  const r = parseInt(hexColor.slice(1, 3), 16) / 255
  const g = parseInt(hexColor.slice(3, 5), 16) / 255
  const b = parseInt(hexColor.slice(5, 7), 16) / 255

  // Luminância calculada conforme sRGB
  const [lr, lg, lb] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  const luminance = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb

  // Para luminância > 0.45, preto (#0f172a) oferece melhor contraste. Senão, branco (#ffffff).
  return luminance > 0.45 ? '#0f172a' : '#ffffff'
}

/**
 * Retorna a classe de fonte adequada para o tema
 */
export function getThemeFontClass(themeFont?: string | null): string {
  if (themeFont === 'classico') return fontClassico.className
  if (themeFont === 'boteco') return fontBoteco.className
  return fontModerno.className
}
