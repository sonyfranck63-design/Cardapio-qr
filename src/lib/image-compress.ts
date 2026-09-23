/**
 * Utilitário de redimensionamento e compressão de imagens no cliente.
 * Reduz imagens pesadas para no máximo 1200px e formato WebP (~0.8 de qualidade),
 * diminuindo uso de banda e acelerando o carregamento dos cardápios.
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options

  // Se o arquivo for SVG ou GIF animado, não comprime para não perder vetor/animação
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let width = img.naturalWidth || img.width
      let height = img.naturalHeight || img.height

      // Calcula proporção proporcional para não exceder limites
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      // Suavização de alta qualidade
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Converte para WebP com qualidade ~0.8
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          })

          resolve(webpFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Fallback: se houver erro ao carregar imagem, retorna o arquivo original
      resolve(file)
    }

    img.src = objectUrl
  })
}
