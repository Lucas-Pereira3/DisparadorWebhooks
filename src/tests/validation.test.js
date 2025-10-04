const { validateReenviar, validateProtocolos } = require('../middlewares/validation');
const logger = require('../utils/logger');

// Mock do logger para evitar prints durante os testes
jest.mock('../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
}));

describe('Validação de Reenvio', () => {
  it('deve passar com dados válidos', () => {
    const req = {
      body: {
        product: 'boleto',
        id: ['123'],
        kind: 'webhook',
        type: 'pago'
      }
    };

    const res = {};
    const next = jest.fn();

    validateReenviar(req, res, next);
    expect(next).toHaveBeenCalled(); // deve chamar next()
  });

  it('deve falhar com dados inválidos', () => {
    const req = {
      body: {
        product: 'invalido', // inválido
        id: [], // vazio
        kind: 'webhook'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    validateReenviar(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Dados de entrada inválidos' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Validação de Protocolos', () => {
  it('deve passar com parâmetros válidos', () => {
    const req = {
      query: {
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        product: 'pix'
      }
    };

    const res = {};
    const next = jest.fn();

    validateProtocolos(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('deve falhar se end_date for antes de start_date', () => {
    const req = {
      query: {
        start_date: '2025-01-10',
        end_date: '2025-01-01'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    validateProtocolos(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Parâmetros de consulta inválidos' })
    );
  });

  it('deve falhar se intervalo for maior que 31 dias', () => {
    const req = {
      query: {
        start_date: '2025-01-01',
        end_date: '2025-02-15' // mais de 31 dias
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    validateProtocolos(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'O intervalo entre as datas não pode ser maior que 31 dias' })
    );
  });
});
