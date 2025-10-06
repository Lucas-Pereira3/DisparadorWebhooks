const protocoloService = require('../services/protocoloService');
const { WebhookReprocessado } = require('../models');
const logger = require('../utils/logger');

// Mock do logger para evitar prints no terminal
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
}));

// Limpar mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

// Mocks base
const protocoloMock = {
  id: '1',
  protocolo: '12345',
  kind: 'kind1',
  type: 'type1',
  data_criacao: new Date(),
  cedente_id: '123',
  data: 'some data',
};

describe('protocoloService', () => {
  describe('listProtocolos', () => {
    it('deve retornar uma lista de protocolos com sucesso', async () => {
      // Mocka findAll com dados
      WebhookReprocessado.findAll = jest.fn().mockResolvedValue([
        protocoloMock
      ]);

      const filters = { start_date: '2023-01-01', end_date: '2023-12-31' };
      const cedenteId = '123';

      const result = await protocoloService.listProtocolos(filters, cedenteId);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('deve retornar erro se ocorrer um problema no banco de dados', async () => {
      WebhookReprocessado.findAll = jest.fn().mockRejectedValueOnce(new Error('Database error'));

      const filters = { start_date: '2023-01-01', end_date: '2023-12-31' };
      const cedenteId = '123';

      const result = await protocoloService.listProtocolos(filters, cedenteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getProtocolo', () => {
    it('deve retornar o protocolo com sucesso', async () => {
      // Mocka findOne com .toJSON()
      WebhookReprocessado.findOne = jest.fn().mockResolvedValue({
        toJSON: () => protocoloMock
      });

      const uuid = '1';
      const cedenteId = '123';

      const result = await protocoloService.getProtocolo(uuid, cedenteId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', '1');
      expect(result.data).toHaveProperty('protocolo', '12345');
      expect(result.data).toHaveProperty('status'); // status é gerado aleatoriamente
    });

    it('deve retornar erro se o protocolo não for encontrado', async () => {
      WebhookReprocessado.findOne = jest.fn().mockResolvedValueOnce(null);

      const uuid = 'not-found';
      const cedenteId = '123';

      const result = await protocoloService.getProtocolo(uuid, cedenteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Protocolo não encontrado');
      expect(result.statusCode).toBe(400);
    });

    it('deve tratar erros ao tentar acessar o protocolo', async () => {
      WebhookReprocessado.findOne = jest.fn().mockRejectedValueOnce(new Error('Erro inesperado'));

      const uuid = '1';
      const cedenteId = '123';

      const result = await protocoloService.getProtocolo(uuid, cedenteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro inesperado');
    });
  });
});
