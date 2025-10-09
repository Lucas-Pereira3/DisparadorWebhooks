const app = require('./app');
const { sequelize } = require('./models');
const { connectRedis } = require('./config/redisClient');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Modelos sincronizados com o banco de dados.');
    }

    // Conectar ao Redis
    await connectRedis();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Gerenciamento de encerramento gracioso
process.on('SIGINT', async () => {
  logger.info('Recebido SIGINT. Encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Recebido SIGTERM. Encerrando servidor graciosamente...');
  process.exit(0);
});

startServer();