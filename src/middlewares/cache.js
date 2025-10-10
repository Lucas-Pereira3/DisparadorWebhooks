const { redisClient } = require('../config/redisClient');
const logger = require('../utils/logger');

const cacheRequest = (ttl = 3600) => {
  return async (req, res, next) => {
    try {
      const key = `request:${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}:${JSON.stringify(req.query)}`;
      
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        logger.info(`Retornando dados do cache para: ${key}`);
        return res.json(JSON.parse(cachedData));
      }
      
      // Sobrescrever o método res.json para cachear a resposta
      const originalJson = res.json;
      res.json = function(data) {
        redisClient.setEx(key, ttl, JSON.stringify(data))
          .catch(err => logger.error('Erro ao salvar no cache:', err));
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Erro no middleware de cache:', error);
      next();
    }
  };
};

const cacheIndividual = (ttl = 3600) => {
  return async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const key = `protocol:${uuid}`;
      
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        const data = JSON.parse(cachedData);
        // Só retorna do cache se o status for "sent"
        if (data.status === 'sent') {
          logger.info(`Retornando protocolo do cache: ${key}`);
          return res.json(data);
        }
      }
      
      // Sobrescrever o método res.json para cachear a resposta
      const originalJson = res.json;
      res.json = function(data) {
        if (data.status === 'sent') {
          redisClient.setEx(key, ttl, JSON.stringify(data))
            .catch(err => logger.error('Erro ao salvar no cache:', err));
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Erro no middleware de cache individual:', error);
      next();
    }
  };
};

module.exports = { cacheRequest, cacheIndividual };