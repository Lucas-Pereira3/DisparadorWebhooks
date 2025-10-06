const { DataTypes }  = require('sequelize');
const sequelize = require('../config');

const SoftwareHouse = sequelize.define('SoftwareHouse', {
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
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ativo'
    }
}, {
    tableName: 'software_houses',
    timestamps: false
});

module.exports = SoftwareHouse;