import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cardapioqr.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/superadmin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
