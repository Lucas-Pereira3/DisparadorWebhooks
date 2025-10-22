const { DataTypes } = require('sequelize');
const sequelize = require('../config');

const WebhookReprocessado = sequelize.define('WebhookReprocessado', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: false
    },
    data_criacao: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    cedente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {  
            model: 'cedente',
            key: 'id'
        }
    },
    kind: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    servico_id: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    protocolo: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'webhook_reprocessado',
    timestamps: false,
    freezeTableName: true
});

module.exports = WebhookReprocessado;