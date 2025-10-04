const { reenviar } = require('../../src/controllers/reenviarController');
const { processReenviar } = require('../../src/services/reenviarService');
const logger = require('../../src/utils/logger');

// Mock explícito
jest.mock('../../src/services/reenviarService', () => ({
  processReenviar: jest.fn()
}));
jest.mock('../../src/utils/logger', () => ({ error: jest.fn() }));

describe('ReenviarController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { id: [1, 2, 3], product: 'boleto', type: 'disponivel' },
      cedente: { id: 10, cnpj: '12345678000195' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  test('Deve retornar sucesso quando processReenviar for bem-sucedido', async () => {
    processReenviar.mockResolvedValue({
      success: true,
      protocolo: 'WH123ABC'
    });

    await reenviar(req, res);

    expect(processReenviar).toHaveBeenCalledWith(req.body, req.cedente);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Notificação reprocessada com sucesso',
      protocolo: 'WH123ABC'
    });
  });

  test('Deve retornar erro de negócio quando processReenviar falhar', async () => {
    processReenviar.mockResolvedValue({
      success: false,
      error: 'Situação divergente',
      invalidIds: [2],
      statusCode: 422
    });

    await reenviar(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Situação divergente',
      invalidIds: [2]
    });
  });

  test('Deve retornar erro genérico (500) em exceção inesperada', async () => {
    processReenviar.mockRejectedValue(new Error('Falha inesperada'));

    await reenviar(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      'Erro no controlador de reenvio:',
      expect.any(Error)
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Não foi possível gerar a notificação. Tente novamente mais tarde.'
    });
  });
});