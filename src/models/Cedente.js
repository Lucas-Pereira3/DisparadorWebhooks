const { DataTypes} = require('sequelize');
const sequelize = require('../config');
const SoftwareHouse = require('./SoftwareHouse');

const Cedente = sequelize.define('Cedente', {
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
    cnpj: {
        type: DataTypes.STRING(14),
        allowNull: false,
        unique: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    softwareHouse_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SoftwareHouse,
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
    tableName: 'cedentes',
    timestamps: false
});

module.exports = Cedente;