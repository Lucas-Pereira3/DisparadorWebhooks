const { Servico, Convenio, Conta } = require('../models');

// Mapeamento para converter product para uppercase
const productMap = {
  'boleto': 'BOLETO',
  'pagamento': 'PAGAMENTO', 
  'pix': 'PIX'
};

// Mapeamento das situações permitidas por tipo e produto
const situacoesPermitidasMap = {
  'disponivel': {
    'BOLETO': ['disponivel'],
    'PAGAMENTO': ['disponivel'],
    'PIX': ['disponivel']
  },
  'cancelado': {
    'BOLETO': ['cancelado'],
    'PAGAMENTO': ['cancelado'],
    'PIX': ['cancelado']
  },
  'pago': {
    'BOLETO': ['pago'],
    'PAGAMENTO': ['pago'],
    'PIX': ['pago']
  }
};

const validateSituacoes = async (product, ids, type, cedenteId) => {
  try {
    console.log('Validando situações:', { product, ids, type, cedenteId });

    const productUpper = productMap[product];
    if (!productUpper) {
      throw new Error(`Produto ${product} não é válido`);
    }

    if (!situacoesPermitidasMap[type] || !situacoesPermitidasMap[type][productUpper]) {
      throw new Error(`Tipo ${type} não é válido para o produto ${product}`);
    }

    const situacoesPermitidas = situacoesPermitidasMap[type][productUpper];

    // Buscar serviços validando produto, situação e cedente
    const servicos = await Servico.findAll({
      where: { 
        id: ids,
        produto: productUpper,
        status: 'ativo'
      },
      include: [{
        model: Convenio,
        include: [{
          model: Conta,
          where: { cedente_id: cedenteId }
        }]
      }]
    });

    // Verificar se encontrou todos os IDs
    const idsEncontrados = servicos.map(s => s.id);
    const idsNaoEncontrados = ids.filter(id => !idsEncontrados.includes(id));

    if (idsNaoEncontrados.length > 0) {
      return {
        isValid: false,
        invalidIds: idsNaoEncontrados,
        message: `IDs não encontrados ou produto incorreto: ${idsNaoEncontrados.join(', ')}`
      };
    }

    // Validar situações
    const invalidIds = servicos
      .filter(servico => !situacoesPermitidas.includes(servico.situacao))
      .map(servico => servico.id);

    if (invalidIds.length > 0) {
      return {
        isValid: false,
        invalidIds,
        message: `Não foi possível gerar a notificação. A situação do ${product} diverge do tipo de notificação solicitado.`
      };
    }

    return { isValid: true, servicos };

  } catch (error) {
    console.error('Erro na validação:', error);
    throw new Error(`Erro na validação de situações: ${error.message}`);
  }
};

module.exports = { validateSituacoes };