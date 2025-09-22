const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Convenio = sequelize.define('Convenio', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numero_convenio: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    conta_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'conta',
            key: 'id'
        }
    }
}, {
    tableName: 'convenios',
    timestamps: false
});

module.exports = Convenio;