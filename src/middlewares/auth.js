const jwt = require('jsonwebtoken');
const { SoftwareHouse, Cedente } = require('../models');
const logger = require('../utils/logger');

const validateHeaders = async (req, res, next) => {
  try {
    const { 'cnpj-sh': cnpjSh, 'token-sh': tokenSh, 'cnpj-cedente': cnpjCedente, 'token-cedente': tokenCedente } = req.headers;

    if (!cnpjSh || !tokenSh || !cnpjCedente || !tokenCedente) {
      return res.status(400).json({
        error: 'Headers de autenticação são obrigatórios: cnpj-sh, token-sh, cnpj-cedente, token-cedente'
      });
    }

    // Validar Software House
    const softwareHouse = await SoftwareHouse.findOne({
      where: { cnpj: cnpjSh, token: tokenSh, status: 'ativo' }
    });

    if (!softwareHouse) {
      return res.status(401).json({
        error: 'Software House não encontrada ou credenciais inválidas'
      });
    }

    // Validar Cedente
    const cedente = await Cedente.findOne({
      where: { 
        cnpj: cnpjCedente, 
        token: tokenCedente, 
        softwarehouse_id: softwareHouse.id,
        status: 'ativo' 
      }
    });

    if (!cedente) {
      return res.status(401).json({
        error: 'Cedente não encontrado ou credenciais inválidas'
      });
    }

    // Adicionar informações ao request para uso posterior
    req.softwareHouse = softwareHouse;
    req.cedente = cedente;

    next();
  } catch (error) {
    logger.error('Erro na validação de autenticação:', error);
    return res.status(500).json({
      error: 'Erro interno na validação de autenticação'
    });
  }
};

module.exports = validateHeaders;