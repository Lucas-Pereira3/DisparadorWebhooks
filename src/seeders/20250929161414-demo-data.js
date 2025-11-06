'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // SoftwareHouse
    await queryInterface.bulkInsert('softwarehouse', [
      {
        id: 1,
        cnpj: "61199921000110",
        token: "AbC123defGHI456jklMNOpqrSTU789vwXYZ0abc4",
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 2,
        cnpj: "33517684000152",
        token: "q1W2e3R4t5Y6u7I8o9P0a1S2d3F4g5H6j7K8l9M0",
        status: "inativo",
        data_criacao: new Date(),
      },
      {
        id: 3,
        cnpj: "74718190000113",
        token: "Z9y8X7w6V5u4T3s2R1q0P9o8N7m6B5v4C3x2D1e0",
        status: "inativo",
        data_criacao: new Date(),
      },
    ], {});

    // Cedente
    await queryInterface.bulkInsert('cedente', [
      {
        id: 1,
        cnpj: "45723174000110",
        token: "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0",
        softwarehouse_id: 1,
        status: "ativo",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/69502649-f3f7-482b-bfc1-0ad80ce8f3a6",
          email: null,
          tipos: {},
          cancelado: true,
          pago: true,
          disponivel: true, 
          header: false,
          ativado: true,
          header_campo: "",
          header_valor: "",
          headers_adicionais: [
            {"content-type": "application/json"}
          ],
        }),
        data_criacao: new Date(),
      },
      {
        id: 2,
        cnpj: "33198567000125",
        token: "Q1w2E3r4T5y6U7i8O9p0A1s2D3f4G5h6J7k8L9m0",
        softwarehouse_id: 2,
        status: "inativo",
        configuracao_notificacao: null,
        data_criacao: new Date(),
      },
      {
        id: 3,
        cnpj: "74910332000104",
        token: "N1m2B3v4C5x6Z7a8S9d0F1g2H3j4K5l6P7o8I9u0",
        softwarehouse_id: 3,
        status: "inativo",
        configuracao_notificacao: null,
        data_criacao: new Date(),
      },
    ], {});

    // Conta 
    await queryInterface.bulkInsert('conta', [
      {
        id: 1,
        produto: "boleto",
        banco_codigo: "341",
        cedente_id: 1,
        status: "ativo",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/69502649-f3f7-482b-bfc1-0ad80ce8f3a6",
          email: null,
          tipos: {},
          cancelado: true,   
          pago: true,        
          disponivel: true,  
          header: false,
          ativado: true,
          header_campo: "",
          header_valor: "",
          headers_adicionais: [
            {"content-type": "application/json"}
          ],
        }),
        data_criacao: new Date("2025-09-10"),
      },
      {
        id: 2,
        produto: "pix",
        banco_codigo: "001",
        cedente_id: 2,
        status: "inativo",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/69502649-f3f7-482b-bfc1-0ad80ce8f3a6",
          email: null,
          tipos: {},
          cancelado: true,   
          pago: true,        
          disponivel: true,  
          header: false,
          ativado: true,
          header_campo: "",
          header_valor: "",
          headers_adicionais: [
            {"content-type": "application/json"}
          ],
        }),
        data_criacao: new Date("2025-09-09"),
      },
      {
        id: 3,
        produto: "pagamento",
        banco_codigo: "001",
        cedente_id: 3,
        status: "inativo",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/69502649-f3f7-482b-bfc1-0ad80ce8f3a6",
          email: null,
          tipos: {},
          cancelado: true,   
          pago: true,        
          disponivel: true, 
          header: false,
          ativado: true,
          header_campo: "",
          header_valor: "",
          headers_adicionais: [
            {"content-type": "application/json"}
          ],
        }),
        data_criacao: new Date("2025-09-08"),
      },
      {
        id: 4,
        produto: "boleto",
        banco_codigo: "237",
        cedente_id: 1,
        status: "ativo",
        configuracao_notificacao: JSON.stringify({
          url: "https://webhook.site/69502649-f3f7-482b-bfc1-0ad80ce8f3a6",
          email: null,
          tipos: {},
          cancelado: true,   
          pago: true,        
          disponivel: true,  
          header: false,
          ativado: true,
          header_campo: "",
          header_valor: "",
          headers_adicionais: [
            {"content-type": "application/json"}
          ],
        }),
        data_criacao: new Date("2025-09-07"),
      },
    ], {});

    // Convenio 
    await queryInterface.bulkInsert('convenio', [
      {
        id: 1,
        numero_convenio: "102938",
        data_criacao: new Date(),
        conta_id: 1,
      },
      {
        id: 2,
        numero_convenio: "564738",
        data_criacao: new Date(),
        conta_id: 2,
      },
      {
        id: 3,
        numero_convenio: "918273",
        data_criacao: new Date(),
        conta_id: 3,
      },
      {
        id: 4,
        numero_convenio: "4455667",
        data_criacao: new Date(),
        conta_id: 4,
      },
    ], {});

    // Servico 
    const servicos = [
      // Serviços BOLETO
      {
        id: 1,
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 1,
        status: "inativo",
        data_criacao: new Date(),
      },
      {
        id: 2,
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 1,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 3,
        produto: "BOLETO",
        situacao: "pago",
        convenio_id: 1,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 4,
        produto: "BOLETO",
        situacao: "cancelado",
        convenio_id: 1,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 5,
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 4,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 6,
        produto: "BOLETO",
        situacao: "disponivel",
        convenio_id: 4,
        status: "inativo",
        data_criacao: new Date(),
      },
      
      // Serviços PIX
      {
        id: 7,
        produto: "PIX",
        situacao: "disponivel",
        convenio_id: 2,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 8,
        produto: "PIX",
        situacao: "pago",
        convenio_id: 2,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 9,
        produto: "PIX",
        situacao: "cancelado",
        convenio_id: 2,
        status: "ativo",
        data_criacao: new Date(),
      },
      
      // Serviços PAGAMENTO
      {
        id: 10,
        produto: "PAGAMENTO",
        situacao: "disponivel",
        convenio_id: 3,
        status: "inativo",
        data_criacao: new Date(),
      },
      {
        id: 11,
        produto: "PAGAMENTO",
        situacao: "disponivel",
        convenio_id: 3,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 12,
        produto: "PAGAMENTO",
        situacao: "pago",
        convenio_id: 3,
        status: "ativo",
        data_criacao: new Date(),
      },
      {
        id: 13,
        produto: "PAGAMENTO",
        situacao: "cancelado",
        convenio_id: 3,
        status: "ativo",
        data_criacao: new Date(),
      }
    ];

    await queryInterface.bulkInsert('servico', servicos, {});

    // Webhook Reprocessado 
    const { v4: uuidv4 } = require('uuid'); 
    const webhooks = [];
    
    for (let i = 1; i <= 10; i++) {
      const tipo = i % 3 === 0 ? 'pago' : (i % 3 === 1 ? 'disponivel' : 'cancelado');
      const product = i % 3 === 0 ? 'BOLETO' : (i % 3 === 1 ? 'PIX' : 'PAGAMENTO');
      
      webhooks.push({
        id: uuidv4(),
        data: JSON.stringify({
          notifications: [{
            kind: 'webhook',
            method: 'POST',
            url: 'https://webhook.site/69502649-f3f7-482b-bfc1-0ad80ce8f3a6',
            headers: "Headers configurado pelo cliente",
            body: {
              tipoWH: getBoletoTipoWH(tipo),
              datahoraEnvio: new Date().toLocaleString('pt-BR'),
              titulo: {
                situacao: getBoletoSituacao(tipo),
                idintegracao: i.toString(),
                TitulohossoNumero: `45645${i}`,
                Titulohovimentos: {}
              },
              CpfCnpjCedente: '45723174000110'
            }
          }]
        }),
        data_criacao: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        cedente_id: 1,
        kind: 'webhook',
        type: tipo,
        servico_id: JSON.stringify([i]),
        protocolo: `WH${uuidv4().replace(/-/g, '').substring(0, 20).toUpperCase()}`
      });
    }
    
    await queryInterface.bulkInsert('webhook_reprocessado', webhooks, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('webhook_reprocessado', null, {});
    await queryInterface.bulkDelete('servico', null, {});
    await queryInterface.bulkDelete('convenio', null, {});
    await queryInterface.bulkDelete('conta', null, {});
    await queryInterface.bulkDelete('cedente', null, {});
    await queryInterface.bulkDelete('softwarehouse', null, {});
  }
};

// Funções auxiliares para webhook 
function getBoletoTipoWH(type) {
  const map = { 
    'disponivel': 'notifica_gerou', 
    'cancelado': 'notifica_cancelou', 
    'pago': 'notifica_liquidou' 
  };
  return map[type] || 'notifica_gerou';
}

function getBoletoSituacao(type) {
  const map = { 
    'disponivel': 'REGISTRADO', 
    'cancelado': 'BAIXADO', 
    'pago': 'LIQUIDADO' 
  };
  return map[type];
}