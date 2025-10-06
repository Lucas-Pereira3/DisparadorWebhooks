const { processReenviar } = require('../services/reenviarService');
const { redisClient } = require('../config/redis');
const { WebhookReprocessado } = require('../models');
const { validateSituacoes } = require('../services/validationService');
const { getNotificationConfig, sendWebhook, generateProtocol } = require('../services/webhookService');
const logger = require('../utils/logger');

// Mocks
jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
  },
}));

jest.mock('../models', () => ({
  WebhookReprocessado: { create: jest.fn() },
}));

jest.mock('../services/validationService', () => ({
  validateSituacoes: jest.fn(),
}));

jest.mock('../services/webhookService', () => ({
  getNotificationConfig: jest.fn(),
  sendWebhook: jest.fn(),
  generateProtocol: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
}));

describe('processReenviar', () => {
  const cedente = { id: 1 };
  const baseBody = {
    product: 'PIX',
    id: [123],
    kind: 'reenvio',
    type: 'notificacao'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar erro se a requisição for duplicada', async () => {
    redisClient.get.mockResolvedValue('1');

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/duplicada/i);
  });

  it('deve retornar erro se a validação falhar', async () => {
    redisClient.get.mockResolvedValue(null);
    validateSituacoes.mockResolvedValue({
      isValid: false,
      message: 'Situação inválida',
      invalidIds: [123],
    });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(422);
    expect(result.error).toBe('Situação inválida');
  });

  it('deve retornar erro se a configuração de notificação estiver desativada', async () => {
    redisClient.get.mockResolvedValue(null);
    validateSituacoes.mockResolvedValue({ isValid: true });
    getNotificationConfig.mockResolvedValue({ ativado: false });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/desativada/i);
  });

  it('deve retornar erro se o tipo de notificação não estiver ativado', async () => {
    redisClient.get.mockResolvedValue(null);
    validateSituacoes.mockResolvedValue({ isValid: true });
    getNotificationConfig.mockResolvedValue({ ativado: true });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/não está ativada/i);
  });

  it('deve retornar erro se o envio do webhook falhar', async () => {
    redisClient.get.mockResolvedValue(null);
    validateSituacoes.mockResolvedValue({ isValid: true });
    getNotificationConfig.mockResolvedValue({
      ativado: true,
      notificacao: true,
      url: 'https://teste.com',
      notificacao: true,
      notificacao: true,
      [baseBody.type]: true
    });
    sendWebhook.mockResolvedValue({ success: false, error: 'Erro no envio' });

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Falha no envio/);
  });

  it('deve processar corretamente e retornar sucesso', async () => {
    redisClient.get.mockResolvedValue(null);
    validateSituacoes.mockResolvedValue({ isValid: true });
    getNotificationConfig.mockResolvedValue({
      ativado: true,
      [baseBody.type]: true,
      url: 'https://teste.com',
      header: true,
      header_campo: 'Authorization',
      header_valor: 'Bearer token'
    });
    sendWebhook.mockResolvedValue({ success: true });
    generateProtocol.mockReturnValue('PROTO123');
    WebhookReprocessado.create.mockResolvedValue();

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(true);
    expect(result.protocolo).toBe('PROTO123');
    expect(WebhookReprocessado.create).toHaveBeenCalledTimes(1);
    expect(redisClient.setEx).toHaveBeenCalledTimes(1);
  });

  it('deve capturar exceções inesperadas e registrar erro', async () => {
    redisClient.get.mockRejectedValue(new Error('Falha no Redis'));

    const result = await processReenviar(baseBody, cedente);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Falha no Redis');
    expect(logger.error).toHaveBeenCalled();
  });
});
