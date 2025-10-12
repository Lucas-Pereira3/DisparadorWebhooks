const { Boleto, Pagamento, Pix } = require('../models');

// Mapeamento de situações por tipo e produto
const situacoesMap = {
  'disponivel': {
    'boleto': ['REGISTRADO'],
    'pagamento': ['SCHEDULED', 'ACTIVE'],
    'pix': ['ACTIVE']
  },
  'cancelado': {
    'boleto': ['BAIXADO'],
    'pagamento': ['CANCELLED'],
    'pix': ['REJECTED']
  },
  'pago': {
    'boleto': ['LIQUIDADO'],
    'pagamento': ['PAID'],
    'pix': ['LIQUIDATED']
  }
};

const validateSituacoes = async (product, ids, type, cedenteId) => {
  try {
    console.log('Validando situações:', { product, ids, type, cedenteId });

    // Validação de parâmetros
    if (!situacoesMap[type] || !situacoesMap[type][product]) {
      return {
        isValid: false,
        message: `Tipo ${type} não é válido para o produto ${product}`
      };
    }

    const situacoesPermitidas = situacoesMap[type][product];
    console.log('Situações permitidas:', situacoesPermitidas);

    // Buscar situações reais no banco
    let entidades = [];
    const modelMap = {
      'boleto': Boleto,
      'pagamento': Pagamento,
      'pix': Pix
    };

    const Model = modelMap[product];
    if (!Model) {
      return {
        isValid: false,
        message: `Product ${product} não é válido`
      };
    }

    entidades = await Model.findAll({
      where: { 
        id: ids, 
        cedente_id: cedenteId 
      },
      attributes: ['id', 'situacao']
    });

    console.log('Entidades encontradas no banco:', entidades.length);

    // Verificar se encontrou todos os IDs
    const idsEncontrados = entidades.map(e => e.id);
    const idsNaoEncontrados = ids.filter(id => !idsEncontrados.includes(id));

    if (idsNaoEncontrados.length > 0) {
      console.log('IDs não encontrados:', idsNaoEncontrados);
      return {
        isValid: false,
        invalidIds: idsNaoEncontrados,
        message: `IDs não encontrados: ${idsNaoEncontrados.join(', ')}`
      };
    }

    // Validar situações
    const invalidIds = [];
    for (const entidade of entidades) {
      console.log(`${entidade.id}: situação=${entidade.situacao}, esperado=${situacoesPermitidas}`);
      
      if (!situacoesPermitidas.includes(entidade.situacao)) {
        invalidIds.push(entidade.id);
        console.log(`Situação inválida: ${entidade.id}`);
      }
    }

    if (invalidIds.length > 0) {
      console.log('IDs com situação inválida:', invalidIds);
      return {
        isValid: false,
        invalidIds,
        message: `Não foi possível gerar a notificação. A situação do ${product} diverge do tipo de notificação solicitado.`
      };
    }

    console.log('Todas as validações passaram!');
    return { isValid: true };

  } catch (error) {
    console.error('Erro na validação:', error);
    return {
      isValid: false,
      message: `Erro na validação: ${error.message}`
    };
  }
};

module.exports = { validateSituacoes };