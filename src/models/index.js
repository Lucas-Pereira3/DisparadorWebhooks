const sequelize = require('../config');
const SoftwareHouse = require('./SoftwareHouse');
const Cedente = require('./Cedente');
const Conta = require('./Conta');
const Convenio = require('./Convenio');
const Servico = require('./Servico');
const WebhookReprocessado = require('./WebhookReprocessado');

// Definindo associações entre os modelos
Cedente.belongsTo(SoftwareHouse, { foreignKey: 'softwareHouse_id' });
SoftwareHouse.hasMany(Cedente, { foreignKey: 'softwareHouse_id' });

Conta.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(Conta, { foreignKey: 'cedente_id' });

Convenio.belongsTo(Conta, { foreignKey: 'conta_id' });
Conta.hasMany(Convenio, { foreignKey: 'conta_id' });

Servico.belongsTo(Convenio, { foreignKey: 'convenio_id' });
Convenio.hasMany(Servico, { foreignKey: 'convenio_id' });

WebhookReprocessado.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(WebhookReprocessado, { foreignKey: 'cedente_id' });

module.exports = {
    sequelize,
    SoftwareHouse,
    Cedente,
    Conta,
    Convenio,
    Servico,
    WebhookReprocessado
};  