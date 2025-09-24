'use strict';

const SoftwareHouse = require("../models/SoftwareHouse");

module.exports = {
  async up(queryInterface, Sequelize) {

// Tabela software_houses
    await queryInterface.createTable('software_houses', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        data_criacao: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        cnpj: {
            type: Sequelize.STRING(14),
            allowNull: false,
            unique: true
        },
        token: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'ativo'
        }
    });

// Tabela cedente
    await queryInterface.createTable('convenios', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        data_criacao: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        cnpj: {
            type: Sequelize.STRING(14),
            allowNull: false,
            unique: true
        },
        token: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        Softwarehouse_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'softwarehouses',
                key: 'id'
            }
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'ativo'
        },
        configuracao_notificacao: {
            type: Sequelize.JSON,
            allowNull: true
        }
    });

// Tabela conta
    await queryInterface.createTable('conta', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        data_criacao: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        produto: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        banco_codigo: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        cedente_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'cedente',
                key: 'id'
            }
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'ativo'
        },
        configuracao_notificacao: {
            type: Sequelize.JSON,
            allowNull: true
        }
    });

// Tabela convenio
    await queryInterface.createTable('convenio', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        numero_convenio: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        data_criacao: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        conta_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'conta',
                key: 'id'
            }
        }
    });

// Tabela servico
    await queryInterface.createTable('servico', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        data_criacao: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        convenio_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { 
                model: 'convenio',
                key: 'id'
            }
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'ativo'
        }
    });

// Tabela webhook_reprocessado
    await queryInterface.createTable('webhook_reprocessado', {
        id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4
        },
        data: {
                type: Sequelize.JSON,
                allowNull: false
        },
        data_criacao: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
        },
        cedente_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'cedente',
                    key: 'id'
                }
        },
        kind: {
                type: Sequelize.STRING,
                allowNull: false
        },
        type: {
                type: Sequelize.STRING,
                allowNull: false
        },
        servico_id: {
                type: Sequelize.TEXT,
                allowNull: false
        },
        protocolo: {
                type: Sequelize.STRING,
                allowNull: false
        }
    });
},

    async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('webhook_reprocessado');
    await queryInterface.dropTable('servico');
    await queryInterface.dropTable('convenio');
    await queryInterface.dropTable('conta');
    await queryInterface.dropTable('cedente');
    await queryInterface.dropTable('softwarehouses');
  }
};
