const { WebhookReprocessado } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const listProtocolos = async (filters, cedenteId) => {
  try {
    const { start_date, end_date, product, id, kind, type } = filters;
    
    const whereClause = {
      cedente_id: cedenteId,
      data_criacao: {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    };

    // Aplicar filtros opcionais
    if (product) {
      whereClause.data = {
        ...whereClause.data,
        product
      };
    }

    if (kind) {
      whereClause.kind = kind;
    }

    if (type) {
      whereClause.type = type;
    }

    if (id && id.length > 0) {
      whereClause.servico_id = {
        [Op.in]: id.map(id => JSON.stringify(id))
      };
    }

    const protocolos = await WebhookReprocessado.findAll({
      where: whereClause,
      order: [['data_criacao', 'DESC']],
      attributes: ['id', 'protocolo', 'kind', 'type', 'data_criacao', 'data']
    });

    return {
      success: true,
      data: protocolos,
      total: protocolos.length
    };
  } catch (error) {
    logger.error('Erro ao listar protocolos:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const getProtocolo = async (uuid, cedenteId) => {
  try {
    const protocolo = await WebhookReprocessado.findOne({
      where: {
        id: uuid,
        cedente_id: cedenteId
      },
      include: [{
        model: require('../models/Cedente'),
        attributes: ['cnpj', 'id']
      }]
    });

    if (!protocolo) {
      return {
        success: false,
        error: 'Protocolo não encontrado',
        statusCode: 400
      };
    }

    // Simular status (em produção, isso viria de um sistema real)
    const status = Math.random() > 0.2 ? 'sent' : 'pending';

    return {
      success: true,
      data: {
        ...protocolo.toJSON(),
        status
      }
    };
  } catch (error) {
    logger.error('Erro ao buscar protocolo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { listProtocolos, getProtocolo };