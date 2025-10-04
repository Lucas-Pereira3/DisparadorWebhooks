// src/test/reenviarController.test.js

// ===== MOCKS COMPLETOS =====
jest.mock('../config/database', () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue(null),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(null),
    connect: jest.fn().mockResolvedValue(null),
    on: jest.fn()
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn().mockResolvedValue(null),
      rollback: jest.fn().mockResolvedValue(null)
    }))
  }
}));

jest.mock('../models', () => ({
  WebhookReprocessado: {
    create: jest.fn().mockResolvedValue({ 
      id: 'mock-webhook-id',
      protocolo: 'WH123456'
    })
  },
  Cedente: {
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      cnpj: '129129129000199',
      configuracao_notificacao: { 
        url: 'https://webhook.site/test-mock', 
        ativado: true,
        cancelado: true,
        pago: true,
        disponivel: true
      }
    })
  },
  Conta: {
    findOne: jest.fn().mockResolvedValue(null)
  }
}));

jest.mock('uuid', () => ({ 
  v4: jest.fn(() => 'mock-uuid-123') 
}));

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  })),
  format: {
    json: jest.fn(() => 'json-format'),
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    splat: jest.fn(),
    simple: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

jest.mock('sequelize', () => ({
  DataTypes: {
    INTEGER: 'INTEGER',
    STRING: jest.fn(),
    DATE: 'DATE',
    JSONB: 'JSONB',
    TEXT: 'TEXT',
    UUID: 'UUID',
    UUIDV4: 'UUIDV4',
    NOW: 'NOW'
  }
}));

// Global para a transaction
global.models = { 
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn().mockResolvedValue(null),
      rollback: jest.fn().mockResolvedValue(null)
    }))
  }
};

// ===== IMPORTAR CONTROLLER =====
// ✅ Importa a INSTÂNCIA já criada (sem new)
const controller = require('../controllers/reenviarController');

// ===== TESTES =====
describe('ReenviarController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateCacheKey deve gerar chave correta', () => {
    const authData = { cedente: { cnpj: '129129129000199' } };
    const requestData = { 
      product: 'boleto', 
      type: 'disponivel', 
      id: ['BOL001', 'BOL002'] 
    };
    
    const key = controller.generateCacheKey(authData, requestData);
    
    expect(key).toBe('reenvio:129129129000199:boleto:disponivel:["BOL001","BOL002"]');
  });

  test('validateSituations deve retornar IDs inválidos', async () => {
    const idsInvalidos = await controller.validateSituations(
      ['ID1', 'ID2', 'ID3'], 
      'boleto', 
      'disponivel'
    );
    
    expect(idsInvalidos).toEqual(['ID2']);
  });

  test('getConfiguracaoNotificacao deve retornar configuração do cedente', async () => {
    const config = await controller.getConfiguracaoNotificacao(1, 'boleto');
    
    expect(config.url).toBe('https://webhook.site/test-mock');
    expect(config.ativado).toBe(true);
  });

  test('enviarWebhook deve retornar protocolo', async () => {
    const config = { url: 'https://webhook.site/test-mock' };
    const dados = { product: 'boleto', type: 'disponivel', id: ['BOL001'] };
    
    const result = await controller.enviarWebhook(config, dados);
    
    expect(result.success).toBe(true);
    expect(result.protocolo).toMatch(/^WH/);
  });
});