// Mock dos modelos ANTES de importar o serviço
jest.mock('../models', () => ({
  Servico: {
    findAll: jest.fn()
  },
  Convenio: {
    findAll: jest.fn()
  },
  Conta: {
    findAll: jest.fn()
  }
}));

// Agora importamos o serviço e os modelos
const { validateSituacoes } = require('../services/validationService');
const { Servico, Convenio, Conta } = require('../models');

describe('validationService - validateSituacoes', () => {
  const product = 'boleto';
  const type = 'pago';
  const cedenteId = '123';
  const ids = ['1', '2', '3'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar isValid: true quando todos os serviços são válidos', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'BOLETO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      },
      {
        id: '2', 
        produto: 'BOLETO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      },
      {
        id: '3',
        produto: 'BOLETO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(Servico.findAll).toHaveBeenCalledWith({
      where: {
        id: ids,
        produto: 'BOLETO',
        status: 'ativo'
      },
      include: [{
        model: Convenio,
        include: [{
          model: Conta,
          where: { cedente_id: cedenteId }
        }]
      }]
    });
    expect(result).toEqual({ 
      isValid: true, 
      servicos: mockServicos 
    });
  });

  it('deve retornar erro se produto for inválido', async () => {
    const invalidProduct = 'produto_invalido';

    await expect(validateSituacoes(invalidProduct, ids, type, cedenteId))
      .rejects
      .toThrow('Produto produto_invalido não é válido');

    expect(Servico.findAll).not.toHaveBeenCalled();
  });

  it('deve retornar erro se tipo for inválido para o produto', async () => {
    const invalidType = 'tipo_invalido';

    await expect(validateSituacoes(product, ids, invalidType, cedenteId))
      .rejects
      .toThrow('Tipo tipo_invalido não é válido para o produto boleto');

    expect(Servico.findAll).not.toHaveBeenCalled();
  });

  it('deve retornar erro se algum ID não for encontrado', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'BOLETO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      },
      {
        id: '2',
        produto: 'BOLETO', 
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
      
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['3']);
    expect(result.message).toMatch(/IDs não encontrados ou produto incorreto: 3/);
  });

  it('deve retornar erro se algum serviço tiver situação incorreta', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'BOLETO',
        situacao: 'disponivel', 
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      },
      {
        id: '2',
        produto: 'BOLETO',
        situacao: 'cancelado', 
        status: 'ativo', 
        Convenio: { Conta: { cedente_id: '123' } }
      },
      {
        id: '3',
        produto: 'BOLETO',
        situacao: 'pago', 
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '2']);
    expect(result.message).toMatch(/não foi possível gerar a notificação. a situação do boleto diverge do tipo de notificação solicitado./i);
  });

  it('deve retornar erro se cedenteId não corresponder', async () => {
    
    Servico.findAll.mockResolvedValue([]);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '2', '3']);
    expect(result.message).toMatch(/IDs não encontrados ou produto incorreto/);
  });

  it('deve retornar erro quando apenas alguns serviços têm cedenteId correspondente', async () => {
    const mockServicos = [
      {
        id: '2',
        produto: 'BOLETO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
     
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '3']);
    expect(result.message).toMatch(/IDs não encontrados ou produto incorreto: 1, 3/);
  });

  it('deve retornar erro se serviço não estiver ativo', async () => {
    
    const mockServicos = [
      {
        id: '2',
        produto: 'BOLETO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '3']);
    expect(result.message).toMatch(/IDs não encontrados ou produto incorreto: 1, 3/);
  });

  it('deve funcionar para produto pagamento', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'PAGAMENTO',
        situacao: 'pago',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes('pagamento', ['1'], 'pago', cedenteId);

    expect(result.isValid).toBe(true);
    expect(Servico.findAll).toHaveBeenCalledWith({
      where: {
        id: ['1'],
        produto: 'PAGAMENTO',
        status: 'ativo'
      },
      include: [{
        model: Convenio,
        include: [{
          model: Conta,
          where: { cedente_id: cedenteId }
        }]
      }]
    });
  });

  it('deve funcionar para produto pix', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'PIX',
        situacao: 'disponivel',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes('pix', ['1'], 'disponivel', cedenteId);

    expect(result.isValid).toBe(true);
    expect(Servico.findAll).toHaveBeenCalledWith({
      where: {
        id: ['1'],
        produto: 'PIX',
        status: 'ativo'
      },
      include: [{
        model: Convenio,
        include: [{
          model: Conta,
          where: { cedente_id: cedenteId }
        }]
      }]
    });
  });

  it('deve lançar erro se ocorrer problema inesperado no banco', async () => {
    Servico.findAll.mockRejectedValue(new Error('Database connection failed'));

    await expect(validateSituacoes(product, ids, type, cedenteId))
      .rejects
      .toThrow('Erro na validação de situações: Database connection failed');
  });

  it('deve validar tipo cancelado para boleto', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'BOLETO',
        situacao: 'cancelado',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes('boleto', ['1'], 'cancelado', cedenteId);

    expect(result.isValid).toBe(true);
  });

  it('deve validar tipo disponivel para boleto', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'BOLETO',
        situacao: 'disponivel',
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes('boleto', ['1'], 'disponivel', cedenteId);

    expect(result.isValid).toBe(true);
  });

  it('deve retornar erro quando produto está correto mas situação não corresponde ao tipo', async () => {
    const mockServicos = [
      {
        id: '1',
        produto: 'BOLETO',
        situacao: 'disponivel', 
        status: 'ativo',
        Convenio: { Conta: { cedente_id: '123' } }
      }
    ];

    Servico.findAll.mockResolvedValue(mockServicos);

    const result = await validateSituacoes('boleto', ['1'], 'pago', cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1']);
    expect(result.message).toMatch(/situação do boleto diverge do tipo de notificação solicitado/i);
  });

  it('deve retornar erro quando nenhum serviço é encontrado', async () => {
    Servico.findAll.mockResolvedValue([]);

    const result = await validateSituacoes(product, ids, type, cedenteId);

    expect(result.isValid).toBe(false);
    expect(result.invalidIds).toEqual(['1', '2', '3']);
    expect(result.message).toMatch(/IDs não encontrados ou produto incorreto/);
  });
});