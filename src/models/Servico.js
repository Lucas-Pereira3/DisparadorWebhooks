const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servico = sequelize.define('Servico', {
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
    convenio_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'convenios',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ativo'
    }
}, {
    tableName: 'servicos',
    timestamps: false
});

module.exports = Servico;