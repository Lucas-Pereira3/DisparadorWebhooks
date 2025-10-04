const Joi = require('joi');

/**
 * Validação dos dados da rota POST /reenviar
 * Garante que os campos obrigatórios estejam presentes e corretos
 */
const reenviarSchema = Joi.object({
  product: Joi.string().valid('boleto', 'pagamento', 'pix').required(),
  id: Joi.array().items(Joi.string().required()).min(1).max(30).required(),
  kind: Joi.string().valid('webhook').required(), // prever expansão futura
  type: Joi.string().valid('disponivel', 'cancelado', 'pago').required()
});

function validateReenviar(data) {
  const { error, value } = reenviarSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Erro de validação em /reenviar: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
}

/**
 * Validação dos dados da rota GET /protocolo
 * Garante que as datas estejam corretas e filtros opcionais sejam válidos
 */
const protocoloSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  product: Joi.string().valid('boleto', 'pagamento', 'pix'),
  id: Joi.array().items(Joi.string()),
  kind: Joi.string().valid('webhook'),
  type: Joi.string().valid('disponivel', 'cancelado', 'pago')
});

function validateProtocolo(data) {
  const { error, value } = protocoloSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Erro de validação em /protocolo: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
}

/**
 * Validação dos headers de autenticação
 * Garante que os campos obrigatórios estejam presentes e sejam strings
 */
const authHeaderSchema = Joi.object({
  'cnpj-sh': Joi.string().length(14).required(),
  'token-sh': Joi.string().required(),
  'cnpj-cedente': Joi.string().length(14).required(),
  'token-cedente': Joi.string().required()
}).unknown(true); // permite outros headers

function validateAuthHeaders(headers) {
  const { error, value } = authHeaderSchema.validate(headers, { abortEarly: false });
  if (error) {
    throw new Error(`Erro de validação nos headers: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
}

module.exports = {
  validateReenviar,
  validateProtocolo,
  validateAuthHeaders
};
