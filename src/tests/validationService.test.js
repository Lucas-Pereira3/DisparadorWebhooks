const { validateSituacoes } = require('../services/validationService');
const { Servico } = require('../models');

// Mock dos modelos Sequelize
jest.mock('../models', () => ({
  Servico: { findAll: jest.fn() },
  Conta: jest.fn(),
  Cedente: jest.fn(),
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
    // Mockando os dados retornados
    const mockServicos = ids.map(id => ({
      id,
      // nenhum com situação incorreta (simulação: Math.random >= 0.2)
    }));

    Servico.findAll.mockResolvedValue(mockServicos);

    // Forçar Math.random para sempre retornar > 0.2 (simulação de situação correta)
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

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
    const partialServicos = [{ id: '1' }, { id: '2' }]; // faltando o ID 3
    Servico.findAll.mockResolvedValue(partialServicos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toContain('3');
    expect(result.message).toMatch(/IDs não encontrados/);
  });

  it('deve retornar erro se algum serviço tiver situação incorreta', async () => {
    const mockServicos = ids.map(id => ({ id }));

    Servico.findAll.mockResolvedValue(mockServicos);

    // Forçar Math.random para simular situação incorreta nos dois primeiros
    const randomValues = [0.1, 0.1, 0.5];
    let index = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => randomValues[index++]);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '2']);
    expect(result.message).toMatch(/A situação do boleto diverge do tipo de notificação/);
  });

  it('deve lançar erro se ocorrer problema inesperado', async () => {
    Servico.findAll.mockRejectedValue(new Error('DB error'));

    await expect(validateSituacoes(product, ids, type, cedenteId))
      .rejects
      .toThrow('Erro na validação de situações: DB error');
  });
});