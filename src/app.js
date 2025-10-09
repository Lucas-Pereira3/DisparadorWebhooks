require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

// Segurança HTTP
app.use(helmet());

// CORS configurável
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS
        : '*',
  })
);

// Limite de requisições por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições deste IP, tente novamente mais tarde.' },
}));

// Parser JSON com limite de 10MB
app.use(express.json({ limit: '10mb' }));

// Logging customizado com Winston
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

// === ROTAS ===
const reenviarRoutes = require('./routes/reenviarRoutes');
const protocoloRoutes = require('./routes/protocoloRoutes');
const healthRoutes = require('./routes/healthRoutes');

app.use('/reenviar', reenviarRoutes);
app.use('/protocolos', protocoloRoutes);
app.use('/health', healthRoutes);

// === HANDLERS GLOBAIS ===
// Erros não tratados
app.use((error, req, res, next) => {
  logger.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = app;
