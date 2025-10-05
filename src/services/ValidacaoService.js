// src/services/ValidacaoService.js
const Joi = require('joi');

// --- Esquemas de validação ---
const reenviarSchema = Joi.object({
  product: Joi.string().valid('boleto', 'pagamento', 'pix').required(),
  ids: Joi.array().items(Joi.string().required()).min(1).max(30).required(),
  kind: Joi.string().valid('webhook').required(),
  type: Joi.string().valid('disponivel', 'cancelado', 'pago').required()
});

const protocoloSchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  product: Joi.string().valid('boleto', 'pagamento', 'pix'),
  ids: Joi.array().items(Joi.string()),
  kind: Joi.string().valid('webhook'),
  type: Joi.string().valid('disponivel', 'cancelado', 'pago')
});

const authHeaderSchema = Joi.object({
  'cnpj-sh': Joi.string().length(14).required(),
  'token-sh': Joi.string().required(),
  'cnpj-cedente': Joi.string().length(14).required(),
  'token-cedente': Joi.string().required()
}).unknown(true);

// --- Implementação das funções esperadas ---
class ValidacaoService {
  static validarParametros(data) {
    const { error } = reenviarSchema.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(`Erro de validação: ${error.details.map(d => d.message).join(', ')}`);
    }
    return true;
  }

  static async validarAutenticacao(headers) {
    const { error } = authHeaderSchema.validate(headers, { abortEarly: false });
    if (error) {
      throw new Error(`Erro na autenticação: ${error.details.map(d => d.message).join(', ')}`);
    }

    // Simula um retorno do cedente autenticado
    return { id: 1, nome: 'Cedente Mock' };
  }

  static async validarSituacoes(ids, product, type) {
    if (!ids || ids.length === 0) {
      throw new Error('Nenhum ID informado para validação de situação.');
    }
    return true;
  }

  static async getConfiguracaoNotificacao(cedenteId, product) {
    return { url: 'https://mock.url', ativado: true };
  }
}

module.exports = ValidacaoService;
