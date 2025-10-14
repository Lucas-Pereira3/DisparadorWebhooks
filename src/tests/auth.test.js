const validateHeaders = require('../middlewares/auth');
const { SoftwareHouse, Cedente } = require('../models');

// Mock dos métodos do Sequelize
jest.mock('../models', () => ({
  SoftwareHouse: { findOne: jest.fn() },
  Cedente: { findOne: jest.fn() },
}));

describe('Middleware validateHeaders', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {
        'cnpj-sh': '12345678000100',
        'token-sh': 'tokenSH',
        'cnpj-cedente': '98765432000100',
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

  it('deve chamar next se todos os headers forem válidos e existirem registros', async () => {
    SoftwareHouse.findOne.mockResolvedValue({ id: 1 });
    Cedente.findOne.mockResolvedValue({ id: 1 });

    await validateHeaders(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deve retornar 400 se algum header estiver faltando', async () => {
    req.headers = {}; // nenhum header
    await validateHeaders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Headers de autenticação são obrigatórios')
    }));
  });

  it('deve retornar 401 se Software House não encontrada', async () => {
    SoftwareHouse.findOne.mockResolvedValue(null);

    await validateHeaders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Software House não encontrada')
    }));
  });

  it('deve retornar 401 se Cedente não encontrado', async () => {
    // Software House encontrada para passar na primeira validação
    SoftwareHouse.findOne.mockResolvedValue({ id: 1 });

    // Cedente não encontrado
    Cedente.findOne.mockResolvedValue(null);

    await validateHeaders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Cedente não encontrado')
    }));
  });

  it('deve retornar 500 se ocorrer um erro inesperado', async () => {
    // Simula erro no banco
    SoftwareHouse.findOne.mockRejectedValue(new Error('DB error'));

    await validateHeaders(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Erro interno')
    }));
  });
});
