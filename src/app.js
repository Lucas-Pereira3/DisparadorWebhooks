require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middlewares personalizados
const authMiddleware = require('./middlewares/auth');
const validationMiddleware = require('./middlewares/validation');
const cacheMiddleware = require('./middlewares/cache');

// Controllers
const reenviarController = require('./controllers/reenviarController');
const protocoloController = require('./controllers/protocoloController');

// Segurança e utilitários
app.use(helmet()); // Proteções básicas
app.use(cors());   // Liberação de CORS
app.use(morgan('dev')); // Logs de requisição
app.use(express.json()); // Parser de JSON

// Autenticação global
app.use(authMiddleware);

// Rotas
app.post(
  '/reenviar',
  validationMiddleware.reenviar,
  reenviarController.reenviar
);

app.get(
  '/protocolo',
  validationMiddleware.protocoloList,
  cacheMiddleware.listCache,
  protocoloController.listar
);

app.get(
  '/protocolo/:uuid',
  cacheMiddleware.individualCache,
  protocoloController.buscarPorUuid
);

// Tratamento global de erros
app.use((err, req, res, next) => {
  const logger = require('./utils/logger');
  logger.error(err.message, { stack: err.stack });

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erro interno no servidor',
  });
});

module.exports = app;
