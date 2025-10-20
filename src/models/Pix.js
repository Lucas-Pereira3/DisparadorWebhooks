const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const Pix = sequelize.define('Pix', {
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
  chave_pix: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nome_recebedor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'pix',
  timestamps: false,
  freezeTableName: true
});

module.exports = Pix;