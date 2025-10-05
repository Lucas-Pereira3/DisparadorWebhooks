// src/tests/protocoloService.test.js
const ProtocoloService = require('../services/protocoloService');

// 🔹 Mock dos serviços dependentes
jest.mock('../services/ValidacaoService', () => ({
  validarParametros: jest.fn(),
  validarAutenticacao: jest.fn().mockResolvedValue({ id: 1 }),
  validarSituacoes: jest.fn(),
  getConfiguracaoNotificacao: jest.fn().mockResolvedValue({ url: 'https://mock.url' })
}));
/*
jest.mock('../services/CacheService', () => ({
  verificarCacheReenvio: jest.fn()
}));
*/
jest.mock('../services/webhookService', () => ({
  processarReenvio: jest.fn().mockResolvedValue({ success: true }),
  listarProtocolos: jest.fn().mockResolvedValue([{ uuid: 'abc-123' }]),
  consultarProtocolo: jest.fn().mockResolvedValue({ uuid: 'abc-123', status: 'ok' })
}));
/*
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));
*/
describe('ProtocoloService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('deve reenviar protocolos com sucesso', async () => {
    const resultado = await ProtocoloService.reenviar({
      product: 'boleto',
      ids: ['BOL001'],
      kind: 'webhook',
      type: 'disponivel',
      headers: {
        'cnpj-sh': '00000000000191',
        'token-sh': 'token-sh',
        'cnpj-cedente': '11111111000191',
        'token-cedente': 'token-cedente'
      }
    });

    expect(resultado).toEqual({ success: true });
  });

  test('deve listar protocolos corretamente', async () => {
    const resultado = await ProtocoloService.listar({ tipo: 'boleto' });
    expect(resultado).toEqual([{ uuid: 'abc-123' }]);
  });

  test('deve consultar protocolo corretamente', async () => {
    const resultado = await ProtocoloService.consultar('abc-123');
    expect(resultado).toEqual({ uuid: 'abc-123', status: 'ok' });
  });

  test('deve lançar erro se processarReenvio falhar', async () => {
    const WebhookService = require('../services/WebhookService');
    WebhookService.processarReenvio.mockRejectedValueOnce(new Error('Erro no reenvio'));

    await expect(ProtocoloService.reenviar({
      product: 'boleto',
      ids: ['BOL001'],
      kind: 'webhook',
      type: 'disponivel',
      headers: {}
    })).rejects.toThrow('Erro no reenvio');
  });
});
