const WebhookReprocessado = require('../models/WebhookReprocessado');
const { redisClient } = require('../config/redis');
const ValidaçãoService = require('./ValidacaoService');

async function processReenviar(payload, cedente = {}){
    const horaInicio = Date.now();

    // Parâmetros Obrigatórios: A requisição deve conter product, id (array de strings), kind e type.
    try{
        const { product, id, kind, type } = payload;
        const ids = id;

        if(!product || !Array.isArray(ids) || ids.length === 0 || !kind || !type ){
            return { success: false, statusCode: 400, error: 'Parametros obrigatorios ausentes'};
        }
        // Limite de ID: 30 elementos
        if(ids.length > 30){
            return { success: false, statusCode: 400, error: 'Array de IDs nao pode exceder 30 elementos'}
        }

        //Cache de Requisicao
        const chaveCache = criaChaveCache({ product, id: ids, kind, type }, cedente?.id);
        try {
            const exists = await redisClient.get(chaveCache);
            if (exists){
                return{ succes: false, statusCode: 429, error: 'Requisicao duplicada para os mesmos dados nas ultimas 1H',};
            }
        } catch(err){
            logger.error('Falha ao consultar cache no Redis', err);
        }
    }
}