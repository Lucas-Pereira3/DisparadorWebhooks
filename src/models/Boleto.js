const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Boleto = sequelize.define('Boleto', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  situacao: {
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
  data_criacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  vencimento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  beneficiario: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pagador: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nosso_numero: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'boleto',
  timestamps: false,
  freezeTableName: true
});

module.exports = Boleto;