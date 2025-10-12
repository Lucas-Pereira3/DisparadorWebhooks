const sequelize = require('../config');
const SoftwareHouse = require('./SoftwareHouse');
const Cedente = require('./Cedente');
const Conta = require('./Conta');
const Convenio = require('./Convenio');
const Servico = require('./Servico');
const WebhookReprocessado = require('./WebhookReprocessado');
const Boleto = require('./Boleto'); 
const Pagamento = require('./Pagamento');
const Pix = require('./Pix');

// Definir associações
Cedente.belongsTo(SoftwareHouse, { foreignKey: 'softwarehouse_id' });
SoftwareHouse.hasMany(Cedente, { foreignKey: 'softwarehouse_id' });

Conta.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(Conta, { foreignKey: 'cedente_id' });

Convenio.belongsTo(Conta, { foreignKey: 'conta_id' });
Conta.hasMany(Convenio, { foreignKey: 'conta_id' });

Servico.belongsTo(Convenio, { foreignKey: 'convenio_id' });
Convenio.hasMany(Servico, { foreignKey: 'convenio_id' });

WebhookReprocessado.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(WebhookReprocessado, { foreignKey: 'cedente_id' });

Boleto.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(Boleto, { foreignKey: 'cedente_id' });

Pagamento.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(Pagamento, { foreignKey: 'cedente_id' });

Pix.belongsTo(Cedente, { foreignKey: 'cedente_id' });
Cedente.hasMany(Pix, { foreignKey: 'cedente_id' });

module.exports = {
  sequelize,
  SoftwareHouse,
  Cedente,
  Conta,
  Convenio,
  Servico,
  WebhookReprocessado,
  Boleto,
  Pagamento,
  Pix 
};