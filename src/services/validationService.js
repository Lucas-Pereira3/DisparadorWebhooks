const { Servico, Conta, Cedente } = require('../models');

// Mapeamento de situações por tipo e produto
const situacoesMap = {
  disponivel: {
    boleto: 'REGISTRADO',
    pagamento: 'SCHEDULED ACTIVE',
    pix: 'ACTIVE'
  },
  cancelado: {
    boleto: 'BAIXADO',
    pagamento: 'CANCELLED',
    pix: 'REJECTED'
  },
  pago: {
    boleto: 'LIQUIDADO',
    pagamento: 'PAID',
    pix: 'LIQUIDATED'
  }
};

const validateSituacoes = async (product, ids, type, cedenteId) => {
  try {
    // Validação segura para evitar erro de acesso a undefined
    if (!situacoesMap[type] || !situacoesMap[type][product]) {
      throw new Error(`Tipo ${type} não é válido para o produto ${product}`);
    }

    const situacaoEsperada = situacoesMap[type][product];

    // Buscar serviços com os IDs fornecidos
    const servicos = await Servico.findAll({
      where: { id: ids },
      include: [{
        model: require('../models/Convenio'),
        include: [{
          model: Conta,
          where: { 
            produto: product,
            cedente_id: cedenteId
          }
        }]
      }]
    });

    // Verificar se todos os IDs foram encontrados
    const idsEncontrados = servicos.map(s => s.id);
    const idsNaoEncontrados = ids.filter(id => !idsEncontrados.includes(id));

    if (idsNaoEncontrados.length > 0) {
      return {
        isValid: false,
        invalidIds: idsNaoEncontrados,
        message: `IDs não encontrados: ${idsNaoEncontrados.join(', ')}`
      };
    }

    // Verificar situações (simulação aleatória)
    const servicosComSituacaoIncorreta = servicos.filter(() => {
      return Math.random() < 0.2; // 20% de chance de falhar (simulado)
    });

    if (servicosComSituacaoIncorreta.length > 0) {
      const invalidIds = servicosComSituacaoIncorreta.map(s => s.id);
      return {
        isValid: false,
        invalidIds,
        message: `Não foi possível gerar a notificação. A situação do ${product} diverge do tipo de notificação solicitado.`
      };
    }

    return { isValid: true };
  } catch (error) {
    throw new Error(`Erro na validação de situações: ${error.message}`);
  }
};

module.exports = { validateSituacoes };