Participantes

Pedro Henrique Bernardo Marques RA:170427-2024

Lucas da Silva Pereira RA:145716-2023

Lucas Gabriel RA:176052-2024

João victor Fernandes Felix RA:176448-2024

Jhonatan RA:156801-2023

Vinicus RA:224158-2024

Charles RA:164019-2023

Sossai RA:166481-2024


Documentação

Resumo
- Projeto Node.js para reenvio de webhooks com controle de duplicidade, validação de situações e registro de reprocessamentos.
- Arquitetura: monolito modular (routes → services → models → config → utils).
- Testes: Jest com mocks para isolar dependências (Redis, serviços externos, modelos).

Pré-requisitos
- Node.js 16+ / npm
- Redis (opcional para testes locais; nos testes é mockado)
- Banco de dados (migrations/seeders para popular dados; opcional para rodar testes unitários)

Instalação
- No Windows (PowerShell / CMD):
  npm install

Como rodar (desenvolvimento)
- Iniciar a aplicação (se existir script):
  npm start
- Ou diretamente:
  node src/index.js

Rodar testes
- Executar Jest:
  npm test

Estrutura de pastas (inferida)
- DisparadorWebhooks/
  - package.json
  - README.md
  - src/
    - config/
      - redisClient.js
    - models/
      - (modelos, ex.: WebhookReprocessado)
    - routes/
      - healthRoutes.js
    - services/
      - reenviarService.js
      - validationService.js
      - webhookService.js
      - webhookBodyBuilder.js
    - seeders/
      - 20250929161414-demo-data.js
    - utils/
      - logger.js
    - tests/ ou src/tests/
      - reenviarService.test.js

Principais módulos e responsabilidades
- src/routes/healthRoutes.js
  - Endpoint GET / retornando status OK e timestamp.

- src/config/redisClient.js
  - Cliente Redis usado para controle de duplicidade (get / setEx).

- src/services/validationService.js
  - Validação das situações dos IDs enviados (validateSituacoes(product, id, kind, cedenteId)).

- src/services/webhookService.js
  - Interação com o destino do webhook (getNotificationConfig, sendWebhook, generateProtocol).

- src/services/webhookBodyBuilder.js
  - Monta o corpo do webhook conforme produto/kind.

- src/services/reenviarService.js (orquestrador principal)
  - Fluxo esperado:
    1. checkDuplicateRequest(reqBody, cedenteId)
       - Cria hash MD5 do request + cedenteId e verifica no Redis (chave request_hash:<hash>).
       - Se existir, retorna duplicado. Se não, grava com TTL (1h).
    2. validateSituacoes(product, id, kind, cedente.id)
       - Verifica se IDs podem ser reenviados; em caso de invalidez retorna statusCode 422 e mensagem.
    3. getNotificationConfig(cedente.id)
       - Recupera configuração de notificação do cedente; o serviço valida tanto config.ativado quanto config[type] (ex.: config.reenvio) — importante no teste.
    4. buildWebhookBody(...) e buildProductHeaders(product, config, cedente)
       - Monta payload e headers conforme produto (boleto/pagamento/pix).
    5. buildWebhookData(product, kind, url, headers, body)
       - Gera objeto { notifications: [...] } no formato esperado pelo sendWebhook.
    6. sendWebhook(...)
       - Envia o webhook; em caso de erro deve ser tratado e logado (logger.error).
    7. generateProtocol() / WebhookReprocessado.create(...)
       - Gera protocolo e salva registro de reprocessamento.
    8. Redis.setEx para bloquear duplicidade por 1 hora.

Funções auxiliares no reenviarService.js (visíveis)
- checkDuplicateRequest(reqBody, cedenteId)
- generateRealToken()
- generateRealAccountHash()
- getWebhookFormat(product)
- buildProductHeaders(product, config, cedente)
- buildWebhookData(product, kind, url, headers, body)

Seeders
- src/seeders/20250929161414-demo-data.js
  - Popula tabelas: softwarehouse, cedente, conta, convenio, servico, webhook_reprocessado.
  - Útil para testes de integração/manual.

Como escrever testes compatíveis (resumo)
- Mock do redisClient antes de reimportar:
  jest.mock('../config/redisClient', () => ({ redisClient: { get: jest.fn(), setEx: jest.fn() } }));
  const { redisClient } = require('../config/redisClient');
- Asserções importantes:
  - validateSituacoes é chamado com (product, id, type/kind, cedente.id).
  - getNotificationConfig deve fornecer tanto ativado: true quanto a flag do tipo (ex.: reenvio: true) porque reenviarService checa config[type].
  - generateProtocol pode ser chamada de forma síncrona no service — use mockReturnValue.
  - buildWebhookBody e sendWebhook devem ser mockados para controlar fluxo.
- Mensagens de erro observadas:
  - "Requisição duplicada detectada. Aguarde 1 hora para repetir a mesma operação." (teste deve aceitar substring "duplicada")
  - "Configuração de notificação não encontrada ou desativada"
  - "Falha no envio do webhook" (pode derivar de sendWebhook)

Exemplo de payload usado nos testes (processReenviar)
json
{
  "product": "BOLETO",
  "id": [123],
  "kind": "reenvio",
  "type": "reenvio",
  "data": { "test": "data" }
}
