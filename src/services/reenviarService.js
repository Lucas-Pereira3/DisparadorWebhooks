const { redisClient } = require('../config/redisClient');
const { WebhookReprocessado } = require('../models');
const { validateSituacoes } = require('./validationService');
const { getNotificationConfig, sendWebhook, generateProtocol } = require('./webhookService');
const logger = require('../utils/logger');

const checkDuplicateRequest = async (reqBody, cedenteId) => {
  const requestHash = JSON.stringify({ ...reqBody, cedenteId });
  const cacheKey = `request_hash:${require('crypto').createHash('md5').update(requestHash).digest('hex')}`;
  
  const exists = await redisClient.get(cacheKey);
  if (exists) {
    return true;
  }
  
  // Armazenar no cache por 1 hora
  await redisClient.setEx(cacheKey, 3600, '1');
  return false;
};

const processReenviar = async (body, cedente) => {
  const { product, id, kind, type } = body;
  
  try {
    // Verificar duplicidade
    const isDuplicate = await checkDuplicateRequest(body, cedente.id);
    if (isDuplicate) {
      throw new Error('Requisição duplicada detectada. Aguarde 1 hora para repetir a mesma operação.');
    }

    // Validar situações
    const validationResult = await validateSituacoes(product, id, type, cedente.id);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.message,
        invalidIds: validationResult.invalidIds,
        statusCode: 422
      };
    }

    // Buscar configuração de notificação
    const config = await getNotificationConfig(cedente.id);
    if (!config || !config.ativado) {
      throw new Error('Configuração de notificação não encontrada ou desativada');
    }

    // Verificar se o tipo de notificação está ativado
    if (!config[type]) {
      throw new Error(`Notificação do tipo ${type} não está ativada`);
    }

    // Preparar dados para envio
    const webhookData = {
      product,
      ids: id,
      kind,
      type,
      timestamp: new Date().toISOString()
    };

    // Preparar headers
    const headers = {};
    if (config.header) {
      headers[config.header_campo] = config.header_valor;
    }

    if (config.headers_adicionais && Array.isArray(config.headers_adicionais)) {
      config.headers_adicionais.forEach(header => {
        Object.assign(headers, header);
      });
    }
    // 🔍 URL temporária para teste
    const testUrl = 'https://disparadorwebhook.free.beeceptor.com'; // <-- cole aqui a URL gerada no webhook.site
    logger.info(`Enviando webhook de teste para: ${testUrl}`);

    // Enviar webhook
    const webhookResult = await sendWebhook(config.url, webhookData, headers);

    if (!webhookResult.success) {
      throw new Error(`Falha no envio do webhook: ${webhookResult.error}`);
    }

    // Gerar protocolo
    const protocolo = generateProtocol();

    // Salvar no banco de dados
    await WebhookReprocessado.create({
      data: body,
      cedente_id: cedente.id,
      kind,
      type,
      servico_id: JSON.stringify(id),
      protocolo
    });

    return {
      success: true,
      protocolo,
      webhookResult
    };

  } catch (error) {
    logger.error('Erro no processamento de reenvio:', error);
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode || 400
    };
  }
};

module.exports = { processReenviar };