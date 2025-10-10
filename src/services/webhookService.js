const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Conta, Cedente } = require('../models');
const logger = require('../utils/logger');

const getNotificationConfig = async (cedenteId, contaId = null) => {
  try {
    let configuracao = null;

    // Primeiro tenta buscar a configuração da conta
    if (contaId) {
      const conta = await Conta.findOne({
        where: { id: contaId, cedente_id: cedenteId },
        attributes: ['configuracao_notificacao']
      });

      if (conta && conta.configuracao_notificacao) {
        configuracao = conta.configuracao_notificacao;
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
      }
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

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    logger.error('Erro ao enviar webhook:', error.message);
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

module.exports = { getNotificationConfig, sendWebhook, generateProtocol };