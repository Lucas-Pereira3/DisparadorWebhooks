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
  }
}, {
  tableName: 'pix',
  timestamps: false,
  freezeTableName: true
});

module.exports = Pix;