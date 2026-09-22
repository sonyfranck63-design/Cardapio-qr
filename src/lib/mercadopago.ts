import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'

export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 5000 },
})

export const preferenceClient = new Preference(mpClient)
export const paymentClient = new Payment(mpClient)
