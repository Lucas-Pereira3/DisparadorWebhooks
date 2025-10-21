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
  servico_id: 'servico-xyz',
  data: 'some data',
};

describe('protocoloService', () => {
  describe('listProtocolos', () => {
    it('deve retornar uma lista de protocolos com sucesso', async () => {
      WebhookReprocessado.findAll = jest.fn().mockResolvedValue([protocoloMock]);

      const filters = { start_date: '2023-01-01', end_date: '2023-12-31' };
      const cedenteId = '123';

      const result = await protocoloService.listProtocolos(filters, cedenteId);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.data[0]).toEqual(protocoloMock);
    });

    it('deve retornar erro se ocorrer um problema no banco de dados', async () => {
      WebhookReprocessado.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const filters = { start_date: '2023-01-01', end_date: '2023-12-31' };
      const cedenteId = '123';

      const result = await protocoloService.listProtocolos(filters, cedenteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getProtocolo', () => {
    it('deve retornar o protocolo com sucesso', async () => {
      WebhookReprocessado.findOne = jest.fn().mockResolvedValue(protocoloMock);

      const uuid = '1';
      const cedenteId = '123';

      const result = await protocoloService.getProtocolo(uuid, cedenteId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id', '1');
      expect(result.data).toHaveProperty('protocolo', '12345');
      expect(result.data).toHaveProperty('kind', 'kind1');
      expect(result.data).toHaveProperty('type', 'type1');
      expect(result.data).toHaveProperty('servico_id', 'servico-xyz');
      expect(result.data).toHaveProperty('data', 'some data');
      expect(['pending', 'sent']).toContain(result.data.status);
    });

    it('deve retornar erro se o protocolo não for encontrado', async () => {
      WebhookReprocessado.findOne = jest.fn().mockResolvedValue(null);

      const uuid = 'not-found';
      const cedenteId = '123';

      const result = await protocoloService.getProtocolo(uuid, cedenteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Protocolo não encontrado');
      expect(result.statusCode).toBe(404);
    });

    it('deve tratar erros ao tentar acessar o protocolo', async () => {
      WebhookReprocessado.findOne = jest.fn().mockRejectedValue(new Error('Erro inesperado'));

      const uuid = '1';
      const cedenteId = '123';

      const result = await protocoloService.getProtocolo(uuid, cedenteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro inesperado');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});