const { withSentryConfig } = require('@sentry/nextjs/config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    instrumentationHook: true,
  },
}

// Configurações do Sentry Webpack Plugin para upload de source maps e monitoramento de erros
const sentryWebpackPluginOptions = {
  // Suprime logs adicionais durante o build para não poluir o terminal
  silent: true,

  // Variáveis opcionais para upload de sourcemaps no CI/CD
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Aumenta a visibilidade das pilhas de erro dos clientes sem expor código-fonte
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
