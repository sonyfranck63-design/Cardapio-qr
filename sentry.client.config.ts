// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Define a amostragem de rastreamento de performance em produção
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Captura de Replay de Sessão para reprodução de erros visuais do cliente
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Ative 'true' para depurar a captura de eventos no console do navegador
    debug: false,
  })
}
