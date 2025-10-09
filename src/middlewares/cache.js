

import { redisClient } from "../controllers/config/redis.js";
import logger from "../utils/logger.js";

const cache = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    try {
      // só cachear GET
      if (req.method !== "GET") return next();

      const key = `cache:${req.originalUrl}`;

      // se o redis não estiver pronto, pulamos o cache
      if (!redisClient || !redisClient.isOpen) {
        logger.warn("Redis não está conectado — pulando cache");
        res.setHeader("X-Cache", "BYPASS");
        return next();
      }

      const cached = await redisClient.get(key);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          logger.info(`Cache hit: ${key}`);
          res.setHeader("X-Cache", "HIT");
          return res.status(200).json(data);
        } catch (e) {
          // se parsing falhar, removemos a chave e seguimos
          logger.error(`Erro ao parsear cache para ${key}:`, e);
          await redisClient.del(key).catch(() => {});
        }
      }

      // Caso não tenha cache: interceptamos res.json e res.send para gravar o resultado
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      const setCache = async (body) => {
        try {
          // se for objeto, stringify; senão, armazena como string
          const payload = typeof body === "object" ? JSON.stringify(body) : String(body);
          // setEx define valor + TTL
          await redisClient.setEx(key, ttlSeconds, payload);
          logger.info(`Cache salvo: ${key} (ttl=${ttlSeconds}s)`);
        } catch (err) {
          logger.error("Erro ao salvar cache:", err);
        }
      };

      // sobrescreve res.json
      res.json = async (body) => {
        res.setHeader("X-Cache", "MISS");
        // gravar no cache de forma assíncrona, mas esperar para garantir consistência
        await setCache(body);
        return originalJson(body);
      };

      // sobrescreve res.send (para casos que retornam string/HTML)
      res.send = async (body) => {
        res.setHeader("X-Cache", "MISS");
        await setCache(body);
        return originalSend(body);
      };

      return next();
    } catch (error) {
      logger.error("Erro no middleware de cache:", error);
      return next();
    }
  };
};

export default cache;
