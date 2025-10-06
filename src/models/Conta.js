const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Conta = sequelize.define('Conta', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    produto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    banco_codigo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cedente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cedente',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ativo'
    },
    configuracao_notificacao: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    tableName: 'contas',
    timestamps: false
});

module.exports = Conta;