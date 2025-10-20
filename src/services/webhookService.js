const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Conta, Cedente } = require('../models');
const logger = require('../utils/logger');

const getNotificationConfig = async (cedenteId, contaId = null) => {
  try {
    let configuracao = null;
    let source = 'cedente'; 

    // Buscar contas ativas do cedente para testar prioridade
    if (!contaId) {
      const contasAtivas = await Conta.findAll({
        where: { cedente_id: cedenteId, status: 'ativo' },
        attributes: ['id', 'configuracao_notificacao'],
        limit: 1
      });

      if (contasAtivas.length > 0 && contasAtivas[0].configuracao_notificacao) {
        configuracao = contasAtivas[0].configuracao_notificacao;
        contaId = contasAtivas[0].id;
        source = 'conta';
        logger.info(`Usando configuração da conta: ${contaId} para cedente: ${cedenteId}`);
      }
    } else {
      // Buscar configuração específica da conta
      const conta = await Conta.findOne({
        where: { id: contaId, cedente_id: cedenteId },
        attributes: ['configuracao_notificacao']
      });

      if (conta && conta.configuracao_notificacao) {
        configuracao = conta.configuracao_notificacao;
        source = 'conta';
        logger.info(`Usando configuração específica da conta: ${contaId}`);
      }
    }

    // Se não encontrou na conta, busca no cedente
    if (!configuracao) {
      const cedente = await Cedente.findOne({
        where: { id: cedenteId },
        attributes: ['configuracao_notificacao']
      });

      if (cedente && cedente.configuracao_notificacao) {
        configuracao = cedente.configuracao_notificacao;
        source = 'cedente';
        logger.info(`Usando configuração do cedente: ${cedenteId}`);
      }
    }

    if (!configuracao) {
      logger.warn(`Nenhuma configuração encontrada para cedente: ${cedenteId}`);
    } else {
      logger.info(`Configuração carregada de: ${source} para cedente: ${cedenteId}`);
    }

    return configuracao;
  } catch (error) {
    logger.error('Erro ao buscar configuração de notificação:', error);
    throw error;
  }
};

const sendWebhook = async (url, data, headers = {}) => {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const response = await axios.post(url, data, {
      headers: defaultHeaders,
      timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 5000
    });

    logger.info(`Webhook enviado com sucesso para: ${url} - Status: ${response.status}`);

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    logger.error('Erro ao enviar webhook:', error.message);
    
    // Log detalhado para debugging
    if (error.response) {
      logger.error(`Resposta do servidor: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      logger.error('Nenhuma resposta recebida do servidor');
    }
    
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.message
    };
  }
};

const generateProtocol = () => {
  return `WH${uuidv4().replace(/-/g, '').substring(0, 20).toUpperCase()}`;
};

module.exports = { 
  getNotificationConfig, 
  sendWebhook, 
  generateProtocol 
};