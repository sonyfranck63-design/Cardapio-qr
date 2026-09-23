import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas customizadas para análise refinada
export const failureRate = new Rate('custom_failure_rate');
export const menuDuration = new Trend('menu_load_duration', true);

// Configuração dos estágios de carga e limites de aceitação (Thresholds)
export const options = {
  stages: [
    { duration: '10s', target: 100 },  // Rampa de aquecimento
    { duration: '15s', target: 500 },  // Rampa de aceleração
    { duration: '20s', target: 1000 }, // Pico de 1.000 VUs simultâneos
    { duration: '10s', target: 0 },    // Rampa de descida
  ],
  thresholds: {
    // 1. O teste falha se a taxa de erro for superior a 1%
    http_req_failed: ['rate<0.01'],

    // 2. O teste falha se o tempo de resposta do p95 for superior a 250ms
    http_req_duration: ['p(95)<250'],
  },
};

// URL padrão ou informada via variável de ambiente: k6 run -e TARGET_URL=...
const TARGET_URL = __ENV.TARGET_URL || 'http://localhost:3000/matheus-adm-474089';

export default function () {
  const params = {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'k6-load-test/1.0 (Cardapio-QR Performance Audit)',
      'Cache-Control': 'no-cache',
    },
    tags: {
      name: 'GetPublicMenu',
    },
  };

  const response = http.get(TARGET_URL, params);

  // Registra as métricas
  menuDuration.add(response.timings.duration);

  const isSuccess = check(response, {
    'status code é 200': (r) => r.status === 200,
    'tempo de resposta < 250ms': (r) => r.timings.duration < 250,
    'conteúdo HTML retornado': (r) => r.body && r.body.length > 500,
    'contém elementos do cardápio': (r) =>
      r.body.includes('Cardápio') ||
      r.body.includes('cardapio') ||
      r.body.includes('menu') ||
      r.body.includes('restaurant'),
  });

  failureRate.add(!isSuccess);

  // Intervalo realista entre interações (simula leitura humana do cardápio)
  sleep(0.3);
}
