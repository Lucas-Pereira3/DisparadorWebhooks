
// app.js - API Base padronizada e segura

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

// Middlewares personalizados (funções nomeadas)
const { validateHeaders } = require('./middlewares/auth');
const { validateReenviar, validateProtocolos } = require('./middlewares/validation');
const { cacheRequest, cacheIndividual } = require('./middlewares/cache');

// Controllers
const { reenviar } = require('./controllers/reenviarController');
const { listarProtocolos, buscarProtocolo } = require('./controllers/protocoloController');

// Logger utilitário
const logger = require('./utils/logger');

// Segurança e configurações globais

// Helmet - headers de segurança HTTP
app.use(helmet());

// CORS - controle de origens
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS
        : '*', // em desenvolvimento libera tudo
  })
);

// Rate limiting - evita abuso de requisições
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: {
    error: 'Muitas requisições deste IP, tente novamente mais tarde.',
  },
});
app.use(limiter);

// Parser de JSON com limite de tamanho
app.use(express.json({ limit: '10mb' }));

// Logging detalhado das requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers,
  });
  next();
});

// Log adicional no console (modo dev)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rotas principais da API

// POST /reenviar → reenvio de mensagens
app.post('/reenviar', validateHeaders, validateReenviar, reenviar);

// GET /protocolos → lista protocolos (com cache)
app.get('/protocolos', validateHeaders, validateProtocolos, cacheRequest(86400), listarProtocolos);

// GET /protocolos/:uuid → busca protocolo individual (com cache)
app.get('/protocolos/:uuid', validateHeaders, cacheIndividual(3600), buscarProtocolo);

// GET /health → health check e monitoramento

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});


// Middleware de tratamento de erros globais
app.use((error, req, res, next) => {
  logger.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
  });
});

// Middleware para rotas não encontradas (404)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
  });
});

// Exporta a aplicação
module.exports = app;
