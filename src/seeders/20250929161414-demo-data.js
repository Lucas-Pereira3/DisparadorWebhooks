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
        url: 'https://webhook.site/7422ccdb-1d62-4680-897e-2d4cafed4181',
        header: true,
        header_campo: 'Authorization',
        header_valor: 'Bearer cedente_token_456',
        headers_adicionais: [
          { 'X-Custom-Header': 'custom-value' }
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

    // SEXTO: PRODUTOS COM data_criacao 
    const agora = new Date();

    // Boletos com situações diferentes para teste
    await queryInterface.bulkInsert('boleto', [
      { id: '1', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '2', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '3', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '4', cedente_id: 1, situacao: 'BAIXADO', data_criacao: agora },     // Para testar cancelado
      { id: '5', cedente_id: 1, situacao: 'LIQUIDADO', data_criacao: agora },   // Para testar pago
      { id: '6', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '7', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '8', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '9', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora },
      { id: '10', cedente_id: 1, situacao: 'REGISTRADO', data_criacao: agora }
    ], {});

    // Pagamentos para teste
    await queryInterface.bulkInsert('pagamento', [
      { id: '1', cedente_id: 1, situacao: 'SCHEDULED', data_criacao: agora },
      { id: '2', cedente_id: 1, situacao: 'CANCELLED', data_criacao: agora },
      { id: '3', cedente_id: 1, situacao: 'PAID', data_criacao: agora }
    ], {});

    // Pix para teste
    await queryInterface.bulkInsert('pix', [
      { id: '1', cedente_id: 1, situacao: 'ACTIVE', data_criacao: agora },
      { id: '2', cedente_id: 1, situacao: 'REJECTED', data_criacao: agora },
      { id: '3', cedente_id: 1, situacao: 'LIQUIDATED', data_criacao: agora }
    ], {});

    // Sétimo: webhooks_reprocessado referenciando cedente e serviços
    const { v4: uuidv4 } = require('uuid'); 
    const webhooks = [];
    
    for (let i = 1; i <= 10; i++) {
      webhooks.push({
        id: uuidv4(),
        data: JSON.stringify({
          boleto: {
            id: `BOL${i}`,
            valor: 100.00 + (i * 10),
            vencimento: '2025-12-31',
            beneficiario: 'Empresa Teste',
            pagador: 'Cliente Teste'
          }
        }),
        data_criacao: new Date(),
        cedente_id: 1,
        kind: 'webhook',
        type: 'disponivel',
        servico_id: i.toString(),
        protocolo: `PROT${1000 + i}`
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