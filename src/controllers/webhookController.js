const { Op }= require('sequelize');
const webhookReprocessado = require('../models/WebhookReprocessado');
const redisClient = require('../config/redisClient');//conexão com o redis

exports.listarProtocolos = async (req, res, next) => {
    try {
        const {start_date, end_date, product, id, kind, type}= req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Parâmetros start_date e end_date são obrigatórios.' });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ error: 'Datas inválidas' });
        }

        //validação do intervalo de datas
        const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 31){
            return res.status(400).json({ error: 'O intervalo de datas deve ser entre 0 e 31 dias.' });
        }

        const cacheKey = 'protocolos:${JSON.stringify(req.query)}';

        //verifica se existe cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        //construção dos filtros opcionais
        const where = {
            data_criacao: {[Op.between]: [startDate, endDate]}
        };

        if(product) where.product = product;
        if(id) where.id = {[Op.in]: Array.isArray(id) ? id : [id]};
        if(kind) where.kind = kind;
        if(type) where.type = type;

        //consulta ao banco
        const protocolos = await webhookReprocessado.findAll({ where });

        //salva em cache por 1 dia
        await redisClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(protocolos));

        return res.json(protocolos);
    }catch (error) {
        next(error);
    }
};

exports.buscarProtocolo = async (req, res, next) => {
    try {
        const {uuid}=req.params;

        if(!uuid){
            return res.status(400).json({ error: 'Parâmetro uuid é obrigatório.' });
        }

        const cacheKey = 'protocolo:${uuid}';
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        //busca no banco
        const protocolo = await webhookReprocessado.findByPk(uuid);

        if  (!protocolo) {
            return res.status(404).json({ error: 'Protocolo não encontrado.' });
        }

        //Somente gera cache se status === "sent"
        if (protocolo.status === 'sent') {
            await redisClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(protocolo));
        }

        return res.json(protocolo);

    }catch (err) {
        next(err);
    }
}