const { Boleto, Pagamento, Pix } = require('../models');

class ProductService {
  static async getProductData(product, id, cedenteId) {
    const modelMap = {
      'boleto': Boleto,
      'pagamento': Pagamento,
      'pix': Pix
    };

    const Model = modelMap[product];
    if (!Model) {
      throw new Error(`Produto ${product} não suportado`);
    }

    const data = await Model.findOne({
      where: { id, cedente_id: cedenteId }
    });

    if (!data) {
      throw new Error(`${product} com ID ${id} não encontrado`);
    }

    return data;
  }

  static async validateProductExists(product, ids, cedenteId) {
    const modelMap = {
      'boleto': Boleto,
      'pagamento': Pagamento,
      'pix': Pix
    };

    const Model = modelMap[product];
    const entities = await Model.findAll({
      where: { id: ids, cedente_id: cedenteId },
      attributes: ['id', 'situacao']
    });

    return entities;
  }
}

module.exports = ProductService;