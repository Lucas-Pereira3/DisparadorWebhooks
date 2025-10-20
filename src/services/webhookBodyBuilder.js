const { Boleto, Pagamento, Pix } = require('../models');
const crypto = require('crypto');

// Criar a função localmente
const generateRealAccountHash = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase(); // Hash de 16 caracteres
};

const buildWebhookBody = async (product, type, ids, cedente, accountHash) => {
  const timestamp = new Date();
  
  try {
    switch (product) {
      case 'boleto':
        return await buildBoletoWebhook(type, ids, cedente, timestamp);
      
      case 'pagamento':
        return await buildPagamentoWebhook(type, ids, cedente, timestamp, accountHash);
      
      case 'pix':
        return await buildPixWebhook(type, ids, cedente, timestamp);
      
      default:
        throw new Error(`Produto ${product} não suportado`);
    }
  } catch (error) {
    throw new Error(`Erro ao construir webhook: ${error.message}`);
  }
};

// Boleto - formato da imagem CORRIGIDO para múltiplos
const buildBoletoWebhook = async (type, ids, cedente, timestamp) => {
  const boletos = await Boleto.findAll({
    where: { 
      id: ids,
      cedente_id: cedente.id 
    }
  });

  if (!boletos || boletos.length === 0) {
    throw new Error(`Nenhum boleto encontrado para os IDs: ${ids.join(', ')}`);
  }

  // Se há múltiplos boletos, criar um webhook para CADA um
  if (boletos.length > 1) {
    // Para múltiplos boletos, criar estrutura com array de títulos
    return {
      tipoWH: getBoletoTipoWH(type),
      datahoraEnvio: timestamp.toLocaleString('pt-BR'),
      titulos: boletos.map(boleto => ({ 
        situacao: getBoletoSituacao(type),
        idintegracao: boleto.id,
        TitulohossoNumero: boleto.nosso_numero || boleto.id,
        Titulohovimentos: {},
        
        valor: boleto.valor,
        vencimento: boleto.vencimento ? boleto.vencimento.toISOString().split('T')[0] : null,
        beneficiario: boleto.beneficiario,
        pagador: boleto.pagador
      })),
      CpfCnpjCedente: cedente.cnpj,
      totalTitulos: boletos.length 
    };
  }

  // Para um único boleto, manter estrutura original
  return {
    tipoWH: getBoletoTipoWH(type),
    datahoraEnvio: timestamp.toLocaleString('pt-BR'),
    titulo: { // Singular para um boleto
      situacao: getBoletoSituacao(type),
      idintegracao: boletos[0].id,
      TitulohossoNumero: boletos[0].nosso_numero || boletos[0].id,
      Titulohovimentos: {}
    },
    CpfCnpjCedente: cedente.cnpj
  };
};

// Pagamento - formato da imagem para múltiplos
const buildPagamentoWebhook = async (type, ids, cedente, timestamp, accountHash) => {
  const pagamentos = await Pagamento.findAll({
    where: { 
      id: ids,
      cedente_id: cedente.id 
    }
  });

  if (!pagamentos || pagamentos.length === 0) {
    throw new Error(`Nenhum pagamento encontrado para os IDs: ${ids.join(', ')}`);
  }

  const finalAccountHash = accountHash || generateRealAccountHash();

  // Para múltiplos pagamentos
  if (pagamentos.length > 1) {
    return {
      status: getPagamentoStatus(type),
      pagamentos: pagamentos.map(pagamento => ({ 
        uniqueId: pagamento.id,
        createdAt: pagamento.data_criacao.toISOString(),
        ocurrences: [],
        accountHash: generateRealAccountHash(), // Hash único para cada um
        occurrences: [],
        valor: pagamento.valor,
        dataAgendamento: pagamento.data_agendamento ? pagamento.data_agendamento.toISOString() : null,
        favorecido: pagamento.favorecido,
        descricao: pagamento.descricao
      })),
      totalPagamentos: pagamentos.length
    };
  }

  // Para um único pagamento
  return {
    status: getPagamentoStatus(type),
    uniqueId: pagamentos[0].id,
    createdAt: pagamentos[0].data_criacao.toISOString(),
    ocurrences: [],
    accountHash: finalAccountHash,
    occurrences: []
  };
};

// Pix - formato da imagem para múltiplos
const buildPixWebhook = async (type, ids, cedente, timestamp) => {
  const pixs = await Pix.findAll({
    where: { 
      id: ids,
      cedente_id: cedente.id 
    }
  });

  if (!pixs || pixs.length === 0) {
    throw new Error(`Nenhum pix encontrado para os IDs: ${ids.join(', ')}`);
  }

  // Para múltiplos PIX
  if (pixs.length > 1) {
    return {
      type: "SEND_WEBHOOK",
      companyId: cedente.id,
      event: getPixEvent(type),
      transacoes: pixs.map(pix => ({ 
        transactionId: pix.transaction_id || pix.id,
        tags: [
          `#${pix.id}`,
          "pix",
          timestamp.getFullYear().toString()
        ],
        id: {
          pixId: parseInt(pix.id.replace(/\D/g, '').substring(0, 8)) || generatePixId()
        },
        valor: pix.valor,
        chavePix: pix.chave_pix,
        nomeRecebedor: pix.nome_recebedor,
        timestamp: timestamp.toISOString()
      })),
      totalTransacoes: pixs.length
    };
  }

  // Para um único PIX
  return {
    type: "SEND_WEBHOOK",
    companyId: cedente.id,
    event: getPixEvent(type),
    transactionId: pixs[0].transaction_id || pixs[0].id,
    tags: [
      `#${pixs[0].id}`,
      "pix",
      timestamp.getFullYear().toString()
    ],
    id: {
      pixId: parseInt(pixs[0].id.replace(/\D/g, '').substring(0, 8)) || generatePixId()
    }
  };
};

// Funções auxiliares (mantenha as mesmas)
const getBoletoTipoWH = (type) => {
  const map = { 
    'disponivel': 'notifica_gerou', 
    'cancelado': 'notifica_cancelou', 
    'pago': 'notifica_liquidou' 
  };
  return map[type] || 'notifica_gerou';
};

const getBoletoSituacao = (type) => {
  const map = { 
    'disponivel': 'REGISTRADO', 
    'cancelado': 'BAIXADO', 
    'pago': 'LIQUIDADO' 
  };
  return map[type];
};

const getPagamentoStatus = (type) => {
  const map = { 
    'disponivel': 'SCHEDULED', 
    'cancelado': 'CANCELLED', 
    'pago': 'PAID' 
  };
  return map[type];
};

const getPixEvent = (type) => {
  const map = { 
    'disponivel': 'PIX_CREATED', 
    'cancelado': 'PIX_REJECTED', 
    'pago': 'PIX_PAID' 
  };
  return map[type];
};

const generatePixId = () => {
  return Math.floor(10000000 + Math.random() * 90000000);
};

module.exports = { buildWebhookBody };