const { SoftwareHouse, Cedente } = require('../models');

const validateHeaders = async (req, res, next) => {
  try {
    const {
      'cnpj-sh': cnpjSh,
      'token-sh': tokenSh,
      'cnpj-cedente': cnpjCedente,
      'token-cedente': tokenCedente
    } = req.headers;

    if (!cnpjSh || !tokenSh || !cnpjCedente || !tokenCedente) {
      return res.status(400).json({
        error: 'Headers de autenticação são obrigatórios: cnpj-sh, token-sh, cnpj-cedente, token-cedente'
      });
    }

    const softwareHouse = await SoftwareHouse.findOne({
      where: { cnpj: cnpjSh, token: tokenSh, status: 'ativo' }
    });

    if (!softwareHouse) {
      return res.status(401).json({
        error: 'Software House não encontrada ou credenciais inválidas'
      });
    }

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

    req.softwareHouse = softwareHouse;
    req.cedente = cedente;

    next();
  } catch (error) {
    console.error('Erro na validação de autenticação:', error); // substituído logger.error
    return res.status(500).json({
      error: 'Erro interno na validação de autenticação'
    });
  }
};

module.exports = validateHeaders;