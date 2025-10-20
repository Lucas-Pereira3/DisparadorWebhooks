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
  data_agendamento: {
    type: DataTypes.DATE,
    allowNull: true
  },
  favorecido: {
    type: DataTypes.STRING,
    allowNull: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'pagamento',
  timestamps: false,
  freezeTableName: true
});

module.exports = Pagamento;