const { processReenviar } = require('../services/reenviarService');
const { WebhookReprocessado } = require('../models');
const { validateSituacoes } = require('../services/validationService');
const { getNotificationConfig, sendWebhook, generateProtocol } = require('../services/webhookService');
const logger = require('../utils/logger');
const { buildWebhookBody } = require('../services/webhookBodyBuilder');

// Mock do Redis
jest.mock('../config/redisClient', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn()
  }
}));
const { redisClient } = require('../config/redisClient');

// Mocks de serviços/modelos
jest.mock('../models', () => ({
  WebhookReprocessado: { create: jest.fn() }
}));
jest.mock('../services/validationService', () => ({
  validateSituacoes: jest.fn()
}));
jest.mock('../services/webhookService', () => ({
  getNotificationConfig: jest.fn(),
  sendWebhook: jest.fn(),
  generateProtocol: jest.fn()
}));
jest.mock('../services/webhookBodyBuilder', () => ({
  buildWebhookBody: jest.fn()
}));
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

describe('processReenviar', () => {
  const cedente = { id: 1, token: 'test-token' };
  const baseBody = {
    product: 'BOLETO',
    id: [123],
    kind: 'reenvio',
    type: 'reenvio',
    data: { test: 'data' }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Redis padrão = não duplicado
    redisClient.get.mockResolvedValue(null);
    redisClient.setEx.mockResolvedValue('OK');

    // Validação padrão = válida (service chama validateSituacoes(product, id, kind, cedenteId))
    validateSituacoes.mockResolvedValue({
      isValid: true,
      product: baseBody.product,
      id: baseBody.id,
      kind: baseBody.kind
    });

    // Configuração padrão = ativada para reenvio. Cobrir possíveis variações de checagem.
    getNotificationConfig.mockResolvedValue({
      ativado: true,
      notificacoes: {
        reenvio: true,
        notificacao: true
      },
      reenvio: true,
      notificacao: true,
      url: 'http://test.com',
      header_valor: 'test-header'
    });

    // build body / send webhook / protocolo / create
    buildWebhookBody.mockResolvedValue({ test: 'body' });
    sendWebhook.mockResolvedValue({ success: true, data: { message: 'ok' } });

    // generateProtocol pode ser usado de forma síncrona no service
    generateProtocol.mockReturnValue('PROTO123');

    WebhookReprocessado.create.mockResolvedValue({
      protocolo: 'PROTO123',
      cedente_id: cedente.id,
      toJSON: () => ({ protocolo: 'PROTO123', cedente_id: cedente.id })
    });
  });

  it('deve retornar erro se a requisição for duplicada', async () => {
    redisClient.get.mockResolvedValue('1'); // duplicado

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/duplicada/i);
    expect(redisClient.get).toHaveBeenCalled();
  });

  it('deve retornar erro se a validação falhar', async () => {
    validateSituacoes.mockResolvedValue({
      isValid: false,
      message: 'Situação inválida',
      invalidIds: [123]
    });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(422);
    expect(result.error).toBe('Situação inválida');
    expect(validateSituacoes).toHaveBeenCalledWith(
      baseBody.product,
      baseBody.id,
      baseBody.kind,
      cedente.id
    );
  });

  it('deve retornar erro se a configuração de notificação estiver desativada', async () => {
    getNotificationConfig.mockResolvedValue({
      ativado: false,
      notificacoes: {}
    });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Configuração de notificação não encontrada ou desativada');
    expect(getNotificationConfig).toHaveBeenCalledWith(cedente.id);
  });

  it('deve retornar erro se o envio do webhook falhar', async () => {
    // garantir validação e config ativas antes de simular falha no envio
    validateSituacoes.mockResolvedValue({ isValid: true });
    getNotificationConfig.mockResolvedValue({
      ativado: true,
      notificacoes: { reenvio: true, notificacao: true },
      reenvio: true,
      url: 'http://test.com'
    });

    // Forçar rejeição do envio
    sendWebhook.mockRejectedValue(new Error('Falha no envio do webhook'));

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Falha no envio do webhook');
    expect(logger.error).toHaveBeenCalled();
    expect(sendWebhook).toHaveBeenCalled();
  });

  it('deve processar corretamente e retornar sucesso', async () => {
    // garantir ambiente propício ao sucesso
    validateSituacoes.mockResolvedValue({ isValid: true });
    getNotificationConfig.mockResolvedValue({
      ativado: true,
      notificacoes: { reenvio: true, notificacao: true },
      reenvio: true,
      url: 'http://test.com'
    });
    sendWebhook.mockResolvedValue({ success: true, data: { message: 'ok' } });
    generateProtocol.mockReturnValue('PROTO123');
    WebhookReprocessado.create.mockResolvedValue({
      protocolo: 'PROTO123',
      cedente_id: cedente.id,
      toJSON: () => ({ protocolo: 'PROTO123', cedente_id: cedente.id })
    });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(true);
    expect(result.protocolo).toBe('PROTO123');

    // verificar chamadas principais
    expect(redisClient.get).toHaveBeenCalled();
    expect(validateSituacoes).toHaveBeenCalledWith(
      baseBody.product,
      baseBody.id,
      baseBody.kind,
      cedente.id
    );
    expect(getNotificationConfig).toHaveBeenCalledWith(cedente.id);
    expect(buildWebhookBody).toHaveBeenCalled();
    expect(sendWebhook).toHaveBeenCalled();
    expect(generateProtocol).toHaveBeenCalled();
    expect(WebhookReprocessado.create).toHaveBeenCalledWith(
      expect.objectContaining({ cedente_id: cedente.id, protocolo: 'PROTO123' })
    );
    expect(redisClient.setEx).toHaveBeenCalled();
    // garantir que não houve log de erro
    expect(logger.error).not.toHaveBeenCalled();
  });
});