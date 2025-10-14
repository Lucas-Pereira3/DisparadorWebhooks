const { validateSituacoes } = require('../services/validationService');
const { Boleto } = require('../models');

// Mock dos modelos Sequelize
jest.mock('../models', () => ({
  Boleto: { findAll: jest.fn() },
  Pagamento: { findAll: jest.fn() },
  Pix: { findAll: jest.fn() },
}));

describe('validationService - validateSituacoes', () => {
  const product = 'boleto';
  const type = 'pago';
  const cedenteId = '123';
  const ids = ['1', '2', '3'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar isValid: true quando todos os serviços são válidos', async () => {
    const mockBoletos = ids.map(id => ({ id, situacao: 'LIQUIDADO' }));
    Boleto.findAll.mockResolvedValue(mockBoletos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result).toEqual({ isValid: true });
  });

  it('deve retornar erro se tipo for inválido para o produto', async () => {
    const invalidType = 'invalido';

    await expect(validateSituacoes(product, ids, invalidType, cedenteId))
      .rejects
      .toThrow('Tipo invalido não é válido para o produto boleto');
  });

  it('deve retornar erro se algum ID não for encontrado', async () => {
    const partialBoletos = [{ id: '1' }, { id: '2', situacao: 'LIQUIDADO' }]; // faltando o ID 3
    Boleto.findAll.mockResolvedValue(partialBoletos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toContain('3');
    expect(result.message).toMatch(/IDs não encontrados/);
  });

  it('deve retornar erro se algum serviço tiver situação incorreta', async () => {
    const mockBoletos = [
      { id: '1', situacao: 'REGISTRADO' },
      { id: '2', situacao: 'BAIXADO' },
      { id: '3', situacao: 'LIQUIDADO' },
    ];
    Boleto.findAll.mockResolvedValue(mockBoletos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '2']);
    expect(result.message).toMatch(/situação do boleto diverge/);
  });

  it('deve lançar erro se ocorrer problema inesperado', async () => {
    Boleto.findAll.mockRejectedValue(new Error('DB error'));

    await expect(validateSituacoes(product, ids, type, cedenteId))
      .rejects
      .toThrow('Erro na validação de situações: DB error');
  });
});
