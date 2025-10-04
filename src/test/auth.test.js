// src/test/auth.test.js

// ===== MOCKS COMPLETOS =====
jest.mock('../config/database', () => ({
  sequelize: {
    close: jest.fn().mockResolvedValue(null)
  }
}));

jest.mock('../models', () => ({
  SoftwareHouse: {
    findOne: jest.fn()
  },
  Cedente: {
    findOne: jest.fn()
  }
}));

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

// ===== IMPORTAR DEPOIS DOS MOCKS =====
const validateHeaders = require('../middlewares/auth');
const db = require('../models');

// ===== TESTES =====
describe('Middleware de autenticação', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        'cnpj-sh': '123123123000123',
        'token-sh': 'tokenSH',
        'cnpj-cedente': '129129129000199',
        'token-cedente': 'tokenCedente'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  test('deve retornar 400 se faltar header', async () => {
    req.headers['cnpj-sh'] = undefined;
    
    await validateHeaders(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Headers de autenticação são obrigatórios: cnpj-sh, token-sh, cnpj-cedente, token-cedente'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 401 se SoftwareHouse não for encontrada', async () => {
    db.SoftwareHouse.findOne.mockResolvedValue(null);
    
    await validateHeaders(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Software House não encontrada ou credenciais inválidas'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('deve retornar 401 se Cedente não for encontrado', async () => {
    db.SoftwareHouse.findOne.mockResolvedValue({ 
      id: 1, 
      cnpj: '123123123000123',
      token: 'tokenSH',
      status: 'ativo'
    });
    
    db.Cedente.findOne.mockResolvedValue(null);
    
    await validateHeaders(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Cedente não encontrado ou credenciais inválidas'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('deve chamar next se autenticação for bem-sucedida', async () => {
    db.SoftwareHouse.findOne.mockResolvedValue({ 
      id: 1, 
      cnpj: '123123123000123',
      token: 'tokenSH',
      status: 'ativo'
    });
    
    db.Cedente.findOne.mockResolvedValue({ 
      id: 2, 
      cnpj: '129129129000199',
      token: 'tokenCedente',
      softwarehouse_id: 1,
      status: 'ativo'
    });
    
    await validateHeaders(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('deve retornar 500 em caso de erro no banco', async () => {
    db.SoftwareHouse.findOne.mockRejectedValue(new Error('DB error'));
    
    await validateHeaders(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno na validação de autenticação'
    });
    expect(next).not.toHaveBeenCalled();
  });
});