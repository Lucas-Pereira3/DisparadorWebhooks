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
  }
}, {
  tableName: 'boleto',
  timestamps: false,
  freezeTableName: true
});

module.exports = Boleto;