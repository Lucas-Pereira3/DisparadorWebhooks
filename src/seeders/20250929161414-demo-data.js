'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Primeiro: softwarehouse com ID explícito
    await queryInterface.bulkInsert('softwarehouse', [{
      id: 1, // ← ID EXPLÍCITO
      cnpj: '12345678000196',
      token: 'sh_token_123',
      status: 'ativo',
      data_criacao: new Date()
    }], {});

    // Segundo: cedente referenciando o ID correto
    await queryInterface.bulkInsert('cedente', [{
      id: 1, // ← ID EXPLÍCITO
      cnpj: '98765432000198',
      token: 'cedente_token_456',
      softwarehouse_id: 1,
      status: 'ativo',
      configuracao_notificacao: JSON.stringify({  
        ativado: true,
        url: 'https://webhook.site/12345678-1234-1234-1234-123456789012',
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
      id: 1, // ← ID EXPLÍCITO
      produto: 'boleto',
      banco_codigo: '001',
      cedente_id: 1, // ← Referencia cedente ID 1
      status: 'ativo',
      data_criacao: new Date()
    }], {});

    // Quarto: convenio referenciando conta
    await queryInterface.bulkInsert('convenio', [{
      id: 1, // ← ID EXPLÍCITO
      numero_convenio: '123456',
      conta_id: 1, // ← Referencia conta ID 1
      data_criacao: new Date()
    }], {});

    // Quinto: serviços referenciando convenio
    const servicos = [];
    for (let i = 1; i <= 50; i++) {
      servicos.push({
        id: i, // ← ID EXPLÍCITO
        convenio_id: 1, // ← Referencia convenio ID 1
        status: 'ativo',
        data_criacao: new Date()
      });
    }
    await queryInterface.bulkInsert('servico', servicos, {});

    // Sexto: webhooks_reprocessado referenciando cedente e serviços
    const { v4: uuidv4 } = require('uuid'); 

const webhooks = [];
for (let i = 1; i <= 10; i++) {
  webhooks.push({
    id: uuidv4(), // ← GERA UUID VÁLIDO
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
    cedente_id: 1, // ← Referencia cedente ID 1
    kind: 'webhook',
    type: 'disponivel',
    servico_id: i.toString(), // ← Referencia serviços IDs 1-10
    protocolo: `PROT${1000 + i}`
  });
}
await queryInterface.bulkInsert('webhook_reprocessado', webhooks, {});
  },

  async down(queryInterface, Sequelize) {
    // Ordem inversa para remoção (por causa das FKs)
    await queryInterface.bulkDelete('webhook_reprocessado', null, {});
    await queryInterface.bulkDelete('servico', null, {});
    await queryInterface.bulkDelete('convenio', null, {});
    await queryInterface.bulkDelete('conta', null, {});
    await queryInterface.bulkDelete('cedente', null, {});
    await queryInterface.bulkDelete('softwarehouse', null, {});
  }
};