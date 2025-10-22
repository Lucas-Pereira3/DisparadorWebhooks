const { redisClient } = require('../config/redisClient');
const { WebhookReprocessado } = require('../models');
const { validateSituacoes } = require('./validationService');
const { getNotificationConfig, sendWebhook, generateProtocol } = require('./webhookService');
const { buildWebhookBody } = require('./webhookBodyBuilder');
const logger = require('../utils/logger');
const crypto = require('crypto');

const checkDuplicateRequest = async (reqBody, cedenteId) => {
  const requestHash = crypto.createHash('md5').update(JSON.stringify({ ...reqBody, cedenteId })).digest('hex');
  const cacheKey = `request_hash:${requestHash}`;
  
  const exists = await redisClient.get(cacheKey);
  if (exists) {
    return true;
  }
  
  // Salva o hash da requisição com expiração de 1 hora
  await redisClient.setEx(cacheKey, 3600, '1');
  return false;
};

// Função para gerar token real
const generateRealToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Função para gerar accountHash real
const generateRealAccountHash = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Função para determinar o formato do webhook baseado no produto
const getWebhookFormat = (product) => {
  const formats = {
    'boleto': 'boleto',
    'pagamento': 'pagamento', 
    'pix': 'pix'
  };
  return formats[product] || 'pagamento';
};

// Função para construir headers específicos por produto
const buildProductHeaders = (product, config, cedente) => {
  switch (product) {
    case 'pagamento':
      const login = cedente.id.toString() || "00000";
      const token = cedente.token || config.header_valor || generateRealToken();
      
      return [
        { "login": login },
        { "token": token }
      ];
    
    case 'boleto':
      return "defaultHeaders";
    
    case 'pix':
      return "Headers configurado pelo cliente";
    
    default:
      return "Headers configurado pelo cliente";
  }
};

// Função para construir a estrutura do webhook baseado no produto
const buildWebhookData = (product, kind, url, headers, body) => {
  const format = getWebhookFormat(product);
  
  switch (format) {
    case 'pagamento':
      return {
        notifications: [{
          url: url,
          body: body, 
          kind: kind,
          method: 'POST',
          headers: headers
        }]
      };
    
    case 'boleto':
      return {
        notifications: [{
          body: body, 
          kind: kind,
          method: 'POST',
          url: url,
          headers: headers
        }]
      };
    
    case 'pix':
      return {
        notifications: [{
          kind: kind,
          method: 'POST',
          url: url,
          headers: headers,
          body: body
        }]
      };
    
    default:
      return {
        notifications: [{
          kind: kind,
          method: 'POST',
          url: url,
          headers: headers,
          body: body
        }]
      };
  }
};

const processReenviar = async (body, cedente) => {
  const { product, id, kind, type } = body;
  
  try {
    // Verificar duplicidade
    const isDuplicate = await checkDuplicateRequest(body, cedente.id);
    if (isDuplicate) {
      throw new Error('Requisição duplicada detectada. Aguarde 1 hora para repetir a mesma operação.');
    }

    // Validar situações e obter serviços
    const validationResult = await validateSituacoes(product, id, type, cedente.id);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.message,
        invalidIds: validationResult.invalidIds,
        statusCode: 422
      };
    }

    const servicos = validationResult.servicos;

    // Buscar configuração de notificação 
    const config = await getNotificationConfig(cedente.id);
    if (!config || !config.ativado) {
      throw new Error('Configuração de notificação não encontrada ou desativada');
    }

    // Verificar se o tipo de notificação está ativado
    if (!config[type]) {
      throw new Error(`Notificação do tipo ${type} não está ativada`);
    }

    // Gerar accountHash
    const accountHash = generateRealAccountHash();

    // Construir corpo do webhook específico para o produto COM DADOS REAIS
    const webhookBody = await buildWebhookBody(product, type, servicos, cedente, accountHash);

    // Construir headers específicos para cada produto
    const productHeaders = buildProductHeaders(product, config, cedente);

    // Construir estrutura do webhook baseada no produto
    const webhookData = buildWebhookData(product, kind, config.url, productHeaders, webhookBody);

    // Preparar headers para a requisição HTTP
    const requestHeaders = {};
    if (config.header) {
      requestHeaders[config.header_campo] = config.header_valor;
    }

    // Adicionar headers adicionais da configuração
    if (config.headers_adicionais && Array.isArray(config.headers_adicionais)) {
      config.headers_adicionais.forEach(header => {
        Object.assign(requestHeaders, header);
      });
    }

    // Incluir headers padrão
    Object.assign(requestHeaders, {
      'Content-Type': 'application/json'
    });

    // Enviar webhook
    const webhookResult = await sendWebhook(config.url, webhookData, requestHeaders);

    if (!webhookResult.success) {
      throw new Error(`Falha no envio do webhook: ${webhookResult.error}`);
    }

    // Gerar protocolo 
    const protocolo = generateProtocol();

    // Salvar no banco de dados
    await WebhookReprocessado.create({
      data: webhookData,
      cedente_id: cedente.id,
      kind,
      type,
      servico_id: JSON.stringify(id),
      protocolo
    });

    // Criar cache da requisição bem-sucedida
    const cacheKey = `${product}:${id.join(',')}:${kind}:${type}`;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify({
      success: true,
      protocolo,
      message: 'Notificação reprocessada com sucesso'
    }));

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

module.exports = { 
  processReenviar
};