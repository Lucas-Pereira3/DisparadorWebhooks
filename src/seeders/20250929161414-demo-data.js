'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Primeiro: softwarehouse com ID explícito
    await queryInterface.bulkInsert('softwarehouse', [{
      id: 1,
      cnpj: '12345678000196',
      token: 'sh_token_123',
      status: 'ativo',
      data_criacao: new Date()
    }], {});

    // Segundo: cedente referenciando o ID correto
    await queryInterface.bulkInsert('cedente', [{
      id: 1,
      cnpj: '98765432000198',
      token: 'cedente_token_456',
      softwarehouse_id: 1,
      status: 'ativo',
      configuracao_notificacao: JSON.stringify({  
        ativado: true,
        url: 'https://webhook.site/3532cf9a-ba2c-4c54-87f8-c45a7569d538',
        header: true,
        header_campo: 'Authorization',
        header_valor: 'Bearer cedente_token_456',
        headers_adicionais: [
          { 'X-Custom-Header': 'custom-value' },
          { 'X-API-Version': '1.0' }
        ],
        disponivel: true,
        cancelado: true,
        pago: true
      }),
      data_criacao: new Date()
    }], {});

    // Terceiro: conta referenciando cedente
    await queryInterface.bulkInsert('conta', [{
      id: 1,
      produto: 'boleto',
      banco_codigo: '001',
      cedente_id: 1,
      status: 'ativo',
      configuracao_notificacao: JSON.stringify({
        ativado: true,
        url: 'https://webhook.site/3532cf9a-ba2c-4c54-87f8-c45a7569d538',
        header: true,
        header_campo: 'X-Conta-Token',
        header_valor: 'conta_token_789',
        headers_adicionais: [
          { 'X-Conta-ID': '1' }
        ],
        disponivel: true,
        cancelado: true,
        pago: true
      }),
      data_criacao: new Date()
    }], {});

    // Quarto: convenio referenciando conta
    await queryInterface.bulkInsert('convenio', [{
      id: 1,
      numero_convenio: '123456',
      conta_id: 1,
      data_criacao: new Date()
    }], {});

    // Quinto: serviços referenciando convenio
    const servicos = [];
    for (let i = 1; i <= 50; i++) {
      servicos.push({
        id: i,
        convenio_id: 1,
        status: 'ativo',
        data_criacao: new Date()
      });
    }
    await queryInterface.bulkInsert('servico', servicos, {});

    // SEXTO: PRODUTOS COM CAMPOS ADICIONAIS PARA WEBHOOK
    const agora = new Date();

    // Boletos com dados completos para webhook
    await queryInterface.bulkInsert('boleto', [
      { 
        id: 'BOL001', 
        cedente_id: 1, 
        situacao: 'REGISTRADO', 
        data_criacao: agora,
        valor: 150.50,
        vencimento: new Date('2025-12-31'),
        beneficiario: 'Empresa Teste LTDA',
        pagador: 'Cliente Exemplo 1',
        nosso_numero: '456456'
      },
      { 
        id: 'BOL002', 
        cedente_id: 1, 
        situacao: 'REGISTRADO', 
        data_criacao: agora,
        valor: 230.00,
        vencimento: new Date('2025-11-30'),
        beneficiario: 'Empresa Teste LTDA',
        pagador: 'Cliente Exemplo 2',
        nosso_numero: '456457'
      },
      { 
        id: 'BOL003', 
        cedente_id: 1, 
        situacao: 'BAIXADO', 
        data_criacao: agora,
        valor: 89.90,
        vencimento: new Date('2025-10-15'),
        beneficiario: 'Empresa Teste LTDA',
        pagador: 'Cliente Exemplo 3',
        nosso_numero: '456458'
      },
      { 
        id: 'BOL004', 
        cedente_id: 1, 
        situacao: 'LIQUIDADO', 
        data_criacao: agora,
        valor: 450.75,
        vencimento: new Date('2025-09-20'),
        beneficiario: 'Empresa Teste LTDA',
        pagador: 'Cliente Exemplo 4',
        nosso_numero: '456459'
      },
      
    ], {});

    // Pagamentos com dados completos para webhook
    await queryInterface.bulkInsert('pagamento', [
      { 
        id: 'PAG001', 
        cedente_id: 1, 
        situacao: 'SCHEDULED', 
        data_criacao: agora,
        valor: 1000.00,
        data_agendamento: new Date('2025-11-01'),
        favorecido: 'Fornecedor ABC',
        descricao: 'Pagamento de serviços'
      },
      { 
        id: 'PAG002', 
        cedente_id: 1, 
        situacao: 'CANCELLED', 
        data_criacao: agora,
        valor: 550.50,
        data_agendamento: new Date('2025-10-20'),
        favorecido: 'Fornecedor XYZ',
        descricao: 'Pagamento cancelado'
      },
      { 
        id: 'PAG003', 
        cedente_id: 1, 
        situacao: 'PAID', 
        data_criacao: agora,
        valor: 789.30,
        data_agendamento: new Date('2025-10-10'),
        favorecido: 'Funcionário João',
        descricao: 'Salário'
      }
    ], {});

    // Pix com dados completos para webhook
    await queryInterface.bulkInsert('pix', [
      { 
        id: 'PIX001', 
        cedente_id: 1, 
        situacao: 'ACTIVE', 
        data_criacao: agora,
        valor: 150.00,
        chave_pix: '11999999999',
        nome_recebedor: 'João Silva',
        transaction_id: '8b1a3c7d-e6f0-4d9c-b2a1-5f0e9c8d7b6a'
      },
      { 
        id: 'PIX002', 
        cedente_id: 1, 
        situacao: 'REJECTED', 
        data_criacao: agora,
        valor: 75.50,
        chave_pix: 'exemplo@email.com',
        nome_recebedor: 'Maria Santos',
        transaction_id: '9c2b4d8e-f7g1-5e0d-c3b2-6g1f0d9e8c7b'
      },
      { 
        id: 'PIX003', 
        cedente_id: 1, 
        situacao: 'LIQUIDATED', 
        data_criacao: agora,
        valor: 200.00,
        chave_pix: '123.456.789-00',
        nome_recebedor: 'Carlos Oliveira',
        transaction_id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p'
      }
    ], {});

    // Sétimo: webhooks_reprocessado 
    const { v4: uuidv4 } = require('uuid'); 
    const webhooks = [];
    
    // Webhooks de exemplo 
    for (let i = 1; i <= 5; i++) {
      webhooks.push({
        id: uuidv4(),
        data: JSON.stringify({
          notifications: [{
            kind: 'webhook',
            method: 'POST',
            url: 'https://webhook.site/3532cf9a-ba2c-4c54-87f8-c45a7569d538',
            headers: "Headers configurado pelo cliente",
            body: {
              tipoWH: i % 2 === 0 ? 'notifica_liquidou' : 'notifica_gerou',
              datahoraEnvio: new Date().toLocaleString('pt-BR'),
              titulo: {
                situacao: i % 2 === 0 ? 'LIQUIDADO' : 'REGISTRADO',
                idintegracao: `BOL00${i}`,
                TitulohossoNumero: `45645${i}`,
                Titulohovimentos: {}
              },
              CpfCnpjCedente: '98765432000198'
            }
          }]
        }),
        data_criacao: new Date(),
        cedente_id: 1,
        kind: 'webhook',
        type: i % 2 === 0 ? 'pago' : 'disponivel',
        servico_id: JSON.stringify([`BOL00${i}`]),
        protocolo: `WH${uuidv4().replace(/-/g, '').substring(0, 20).toUpperCase()}`
      });
    }
    
    await queryInterface.bulkInsert('webhook_reprocessado', webhooks, {});
  },

  async down(queryInterface, Sequelize) {
    // Ordem inversa para remoção (por causa das FKs)
    await queryInterface.bulkDelete('webhook_reprocessado', null, {});
    await queryInterface.bulkDelete('pix', null, {});
    await queryInterface.bulkDelete('pagamento', null, {});
    await queryInterface.bulkDelete('boleto', null, {});
    await queryInterface.bulkDelete('servico', null, {});
    await queryInterface.bulkDelete('convenio', null, {});
    await queryInterface.bulkDelete('conta', null, {});
    await queryInterface.bulkDelete('cedente', null, {});
    await queryInterface.bulkDelete('softwarehouse', null, {});
  }
};