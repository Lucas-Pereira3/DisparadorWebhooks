'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // softwarehouse
    await queryInterface.bulkInsert('softwarehouse', [{
      cnpj: '12345678000196',
      token: 'sh_token_123',
      status: 'ativo',
      data_criacao: new Date()
    }], {});

    // cedente
    await queryInterface.bulkInsert('cedente', [{
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

    // conta
    await queryInterface.bulkInsert('conta', [{
      produto: 'boleto',
      banco_codigo: '001',
      cedente_id: 1,
      status: 'ativo',
      data_criacao: new Date()
    }], {});

    // convenio
    await queryInterface.bulkInsert('convenio', [{
      numero_convenio: '123456',
      conta_id: 1,
      data_criacao: new Date()
    }], {});

    // serviços
    const servicos = [];
    for (let i = 1; i <= 50; i++) {
      servicos.push({
        convenio_id: 1,
        status: 'ativo',
        data_criacao: new Date()
      });
    }
    await queryInterface.bulkInsert('servico', servicos, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('servico', null, {});
    await queryInterface.bulkDelete('convenio', null, {});
    await queryInterface.bulkDelete('conta', null, {});
    await queryInterface.bulkDelete('cedente', null, {});
    await queryInterface.bulkDelete('softwarehouse', null, {});
  }
};