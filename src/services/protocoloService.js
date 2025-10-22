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

    // Filtro por kind e type
    if (kind) whereClause.kind = kind;
    if (type) whereClause.type = type;

    // Filtro por servico_id (agora é TEXT com array JSON)
    if (id && id.length > 0) {
      // Cria condições OR para cada ID buscado
      const idConditions = id.map(singleId => ({
        servico_id: {
          [Op.like]: `%${singleId}%`
        }
      }));
      
      whereClause[Op.or] = idConditions;
    }

    const protocolos = await WebhookReprocessado.findAll({
      where: whereClause,
      order: [['data_criacao', 'DESC']],
      attributes: ['id', 'protocolo', 'kind', 'type', 'data_criacao', 'servico_id', 'data']
    });

    // Filtrar por product de forma mais precisa
    let filteredProtocolos = protocolos;
    if (product) {
      filteredProtocolos = protocolos.filter(proto => {
        try {
          const data = typeof proto.data === 'string' ? JSON.parse(proto.data) : proto.data;
          // Verificar se o product aparece no corpo do webhook
          const bodyString = JSON.stringify(data).toLowerCase();
          return bodyString.includes(product.toLowerCase());
        } catch (error) {
          return false;
        }
      });
    }

    return {
      success: true,
      data: filteredProtocolos,
      total: filteredProtocolos.length
    };
  } catch (error) {
    logger.error('Erro ao listar protocolos:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Serviço para buscar um protocolo individual por UUID
const getProtocolo = async (uuid, cedenteId) => {
  try {
    const protocolo = await WebhookReprocessado.findOne({
      where: {
        id: uuid,
        cedente_id: cedenteId
      }
    });

    if (!protocolo) {
      return {
        success: false,
        error: 'Protocolo não encontrado',
        statusCode: 404
      };
    }

    // Simular status baseado na data
    const horasDiff = (new Date() - new Date(protocolo.data_criacao)) / (1000 * 60 * 60);
    const status = horasDiff < 1 ? 'pending' : 'sent'; // Se criado há menos de 1 hora = pending

    return {
      success: true,
      data: {
        id: protocolo.id,
        protocolo: protocolo.protocolo,
        kind: protocolo.kind,
        type: protocolo.type,
        data_criacao: protocolo.data_criacao,
        servico_id: protocolo.servico_id,
        data: protocolo.data,
        status: status
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