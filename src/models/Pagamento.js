const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Pagamento = sequelize.define('Pagamento', {
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
  tableName: 'pagamento',
  timestamps: false,
  freezeTableName: true
});

module.exports = Pagamento;