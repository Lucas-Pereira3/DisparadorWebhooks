const { Servico, Convenio, Conta } = require('../models');
const crypto = require('crypto');

// Função para gerar accountHash
const generateRealAccountHash = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

const buildWebhookBody = async (product, type, servicos, cedente, accountHash) => {
  const timestamp = new Date();
  
  try {
    console.log('buildWebhookBody - servicos recebidos:', servicos);

    // Extrair apenas os IDs dos serviços
    const servicoIds = servicos.map(servico => {
      if (typeof servico === 'object' && servico.id) {
        return servico.id;
      }
      return servico;
    });

    console.log('buildWebhookBody - IDs extraídos:', servicoIds);

    // Buscar serviços reais do banco
    const servicosReais = await Servico.findAll({
      where: { 
        id: servicoIds,
        status: 'ativo'
      },
      include: [{
        model: Convenio,
        include: [{
          model: Conta,
          where: { cedente_id: cedente.id }
        }]
      }]
    });

    console.log('buildWebhookBody - serviços encontrados no banco:', servicosReais.length);

    if (!servicosReais || servicosReais.length === 0) {
      throw new Error(`Nenhum serviço encontrado para os IDs: ${servicoIds.join(', ')}`);
    }

    switch (product) {
      case 'boleto':
        return buildBoletoWebhook(type, servicosReais, cedente, timestamp);
      
      case 'pagamento':
        return buildPagamentoWebhook(type, servicosReais, cedente, timestamp, accountHash);
      
      case 'pix':
        return buildPixWebhook(type, servicosReais, cedente, timestamp);
      
      default:
        throw new Error(`Produto ${product} não suportado`);
    }
  } catch (error) {
    console.error('Erro detalhado no buildWebhookBody:', error);
    throw new Error(`Erro ao construir webhook: ${error.message}`);
  }
};

// Boleto 
const buildBoletoWebhook = async (type, servicos, cedente, timestamp) => {
  // Para múltiplos boletos
  if (servicos.length > 1) {
    return {
      tipoWH: getBoletoTipoWH(type),
      datahoraEnvio: timestamp.toLocaleString('pt-BR'),
      titulos: servicos.map(servico => ({ 
        situacao: getBoletoSituacao(type),
        idintegracao: servico.id.toString(),
        TitulohossoNumero: generateNossoNumero(servico.id),
        Titulohovimentos: {},
        dataCriacao: servico.data_criacao
      })),
      CpfCnpjCedente: cedente.cnpj,
      totalTitulos: servicos.length 
    };
  }

  // Para um único boleto
  const servico = servicos[0];
  return {
    tipoWH: getBoletoTipoWH(type),
    datahoraEnvio: timestamp.toLocaleString('pt-BR'),
    titulo: {
      situacao: getBoletoSituacao(type),
      idintegracao: servico.id.toString(),
      TitulohossoNumero: generateNossoNumero(servico.id),
      Titulohovimentos: {},
      dataCriacao: servico.data_criacao
    },
    CpfCnpjCedente: cedente.cnpj
  };
};

// Pagamento 
const buildPagamentoWebhook = async (type, servicos, cedente, timestamp, accountHash) => {
  const finalAccountHash = accountHash || generateRealAccountHash();

  // Para múltiplos pagamentos
  if (servicos.length > 1) {
    return {
      status: getPagamentoStatus(type),
      pagamentos: servicos.map(servico => ({ 
        uniqueId: servico.id.toString(),
        createdAt: servico.data_criacao.toISOString(),
        ocurrences: [],
        accountHash: generateRealAccountHash(),
        occurrences: [],
        dataCriacao: servico.data_criacao,
        produto: servico.produto
      })),
      totalPagamentos: servicos.length
    };
  }

  // Para um único pagamento
  const servico = servicos[0];
  return {
    status: getPagamentoStatus(type),
    uniqueId: servico.id.toString(),
    createdAt: servico.data_criacao.toISOString(),
    ocurrences: [],
    accountHash: finalAccountHash,
    occurrences: [],
    dataCriacao: servico.data_criacao
  };
};

// Pix 
const buildPixWebhook = async (type, servicos, cedente, timestamp) => {
  // Para múltiplos PIX
  if (servicos.length > 1) {
    return {
      type: "SEND_WEBHOOK",
      companyId: cedente.id,
      event: getPixEvent(type),
      transacoes: servicos.map(servico => ({ 
        transactionId: generateTransactionId(servico.id),
        tags: [
          `#${servico.id}`,
          "pix",
          timestamp.getFullYear().toString(),
        ],
        id: {
          pixId: generatePixId(servico.id)
        },
        dataCriacao: servico.data_criacao,
        situacao: servico.situacao
      })),
      totalTransacoes: servicos.length
    };
  }

  // Para um único PIX
  const servico = servicos[0];
  return {
    type: "SEND_WEBHOOK",
    companyId: cedente.id,
    event: getPixEvent(type),
    transactionId: generateTransactionId(servico.id),
    tags: [
      `#${servico.id}`,
      "pix",
      timestamp.getFullYear().toString(),
    ],
    id: {
      pixId: generatePixId(servico.id)
    },
    dataCriacao: servico.data_criacao,
    situacao: servico.situacao
  };
};

// Funções auxiliares 
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

const generateNossoNumero = (servicoId) => {
  return `45645${servicoId.toString().padStart(6, '0')}`;
};

const generateTransactionId = (servicoId) => {
  return `tx${servicoId}${Date.now()}`;
};

const generatePixId = (servicoId) => {
  const baseId = servicoId * 1000000;
  return baseId + Math.floor(Math.random() * 1000000);
};

module.exports = { buildWebhookBody };