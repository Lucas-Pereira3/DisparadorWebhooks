jest.mock('../models', () => ({
  SoftwareHouse: { findOne: jest.fn() },
  Cedente: { findOne: jest.fn() }
}));

const validateHeaders = require('../middlewares/auth');
const db = require('../models');

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

    db.SoftwareHouse.findOne.mockReset();
    db.Cedente.findOne.mockReset();
  });

  it('retorna 400 se faltar header', async () => {
    req.headers['cnpj-sh'] = undefined;
    await validateHeaders(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Headers de autenticação são obrigatórios: cnpj-sh, token-sh, cnpj-cedente, token-cedente'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 se SoftwareHouse não encontrada', async () => {
    db.SoftwareHouse.findOne.mockResolvedValue(null);
    await validateHeaders(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Software House não encontrada ou credenciais inválidas'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 se Cedente não encontrado', async () => {
    db.SoftwareHouse.findOne.mockResolvedValue({ id: 1 });
    db.Cedente.findOne.mockResolvedValue(null);
    await validateHeaders(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Cedente não encontrado ou credenciais inválidas'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('chama next se tudo estiver correto', async () => {
    db.SoftwareHouse.findOne.mockResolvedValue({ id: 1 });
    db.Cedente.findOne.mockResolvedValue({ id: 2 });
    await validateHeaders(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retorna 500 em caso de erro inesperado', async () => {
    db.SoftwareHouse.findOne.mockRejectedValue(new Error('DB error'));
    await validateHeaders(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno na validação de autenticação'
    });
    expect(next).not.toHaveBeenCalled();
  });

  afterAll(async () => {
    const sequelize = require('../config/database');
    if (sequelize?.close) {
      await sequelize.close();
    }
  });
});