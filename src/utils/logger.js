const winston = require('winston');

const isTestEnv = process.env.NODE_ENV === 'test';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Arquivos de log para erros e logs combinados
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    
    // Console apenas se não estivermos rodando testes
    !isTestEnv && new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ].filter(Boolean) // Remove valores falsy (como 'false') da lista de transports
});

module.exports = logger;
