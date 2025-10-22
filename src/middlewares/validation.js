const Joi = require('joi');
const logger = require('../utils/logger');

// Esquema de validação para reenvio
const reenviarSchema = Joi.object({
  product: Joi.string().valid('boleto', 'pagamento', 'pix').required(),
  id: Joi.array().items(Joi.string().pattern(/^\d+$/).message('IDs devem ser números')).max(30).required(),
  kind: Joi.string().valid('webhook').required(),
  type: Joi.string().valid('disponivel', 'cancelado', 'pago').required()
});

// Esquema de validação para consulta de protocolos
const protocolosSchema = Joi.object({
  start_date: Joi.date().required(),
  end_date: Joi.date().required().greater(Joi.ref('start_date')),
  product: Joi.string().valid('boleto', 'pagamento', 'pix').optional(),
  id: Joi.array().items(Joi.string()).optional(),
  kind: Joi.string().valid('webhook').optional(),
  type: Joi.string().valid('disponivel', 'cancelado', 'pago').optional()
});

const validateReenviar = (req, res, next) => {
    const { error } = reenviarSchema.validate(req.body);

    if (error) {
        logger.warn('Validação falhou para reenviar:', error.details);
        return res.status(400).json({
            error: 'Parâmetros de entrada inválidos',
            details: error.details.map((detail) => detail.message),
        });
    }

    // Converter IDs para números
    if (req.body.id && Array.isArray(req.body.id)) {
        req.body.id = req.body.id.map(id => parseInt(id, 10));
    }

    next();
};

const validateProtocolos = (req, res, next) => {
    const { error } = protocolosSchema.validate(req.query);

    if (error) {
        logger.warn('Validação falhou para protocolos:', error.details);
        return res.status(400).json({
            error: 'Parâmetros de consulta inválidos',
            details: error.details.map((detail) => detail.message),
        });
    }

    // Validar intervalo de datas (máximo 31 dias)
    const startDate = new Date(req.query.start_date);
    const endDate = new Date(req.query.end_date);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 31) {
        return res.status(400).json({
            error: 'O intervalo entre as datas não pode ser maior que 31 dias'
        });
    }

    next();
};

module.exports = {
  validateReenviar,
  validateProtocolos,
};