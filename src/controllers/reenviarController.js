const { processReenviar } = require('../services/reenviarService');
const logger = require('../utils/logger');

const reenviar = async (req, res) => {
  try {
    const { body, cedente } = req;

    const result = await processReenviar(body, cedente);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
        ...(result.invalidIds && { invalidIds: result.invalidIds })
      });
    }

    res.status(200).json({
      message: 'Notificação reprocessada com sucesso',
      protocolo: result.protocolo
    });

  } catch (error) {
    logger.error('Erro no controlador de reenvio:', error);
    res.status(500).json({
      error: 'Não foi possível gerar a notificação. Tente novamente mais tarde.'
    });
  }
};

module.exports = { reenviar };