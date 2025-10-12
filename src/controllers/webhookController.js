const { Op } = require('sequelize');
const webhookReprocessado = require('../models/WebhookReprocessado');
const { redisClient } = require('../config/redisClient');

exports.listarProtocolos = async (req, res, next) => {
    try {
        const { start_date, end_date, product, id, kind, type } = req.query;

        // Validações obrigatórias
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Parâmetros start_date e end_date são obrigatórios.' });
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate) || isNaN(endDate)) {
            return res.status(400).json({ error: 'Datas inválidas' });
        }

        // Validação do intervalo de datas
        const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 31) {
            return res.status(400).json({ error: 'O intervalo de datas deve ser entre 0 e 31 dias.' });
        }

        const cacheKey = `protocolos:${JSON.stringify(req.query)}`;

        // Verifica se existe cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Construção dos filtros
        const where = {
            data_criacao: { 
                [Op.between]: [startDate, endDate] 
            }
        };

        // Filtros opcionais
        if (kind) where.kind = kind;
        if (type) where.type = type;

        // Filtro por servico_id (campo TEXT)
        if (id) {
            if (Array.isArray(id)) {
                where.servico_id = { [Op.in]: id };
            } else {
                where.servico_id = id;
            }
        }

        // Filtro por product (está dentro do campo JSON 'data')
        if (product) {
            where.data = {
                product: product
            };
        }

        // Consulta ao banco
        const protocolos = await webhookReprocessado.findAll({ 
            where,
            order: [['data_criacao', 'DESC']]
        });

        if (!protocolos || protocolos.length === 0) {
            return res.status(404).json({ error: 'Nenhum protocolo encontrado para o período informado.' });
        }

        // Formatar resposta
        const response = protocolos.map(proto => ({
            id: proto.id,
            protocolo: proto.protocolo,
            kind: proto.kind,
            type: proto.type,
            data_criacao: proto.data_criacao,
            servico_id: proto.servico_id,
            data: proto.data
        }));

        // Salva em cache por 1 dia
        await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 60 * 24 });
        
        return res.json(response);
    } catch (error) {
        console.error('Erro no listarProtocolos:', error);
        next(error);
    }
};

exports.buscarProtocolo = async (req, res, next) => {
    try {
        const { uuid } = req.params;

        if (!uuid) {
            return res.status(400).json({ error: 'Parâmetro uuid é obrigatório.' });
        }

        const cacheKey = `protocolo:${uuid}`;
        
        // Verifica cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Busca no banco
        const protocolo = await webhookReprocessado.findByPk(uuid);

        if (!protocolo) {
            return res.status(404).json({ error: 'Protocolo não encontrado.' });
        }

        // Formatar resposta individual
        const response = {
            id: protocolo.id,
            protocolo: protocolo.protocolo,
            kind: protocolo.kind,
            type: protocolo.type,
            data_criacao: protocolo.data_criacao,
            servico_id: protocolo.servico_id,
            data: protocolo.data,
            status: 'sent' // Simulado conforme regra de negócio
        };

        // Salva em cache por 1 hora (apenas se status = 'sent')
        if (response.status === 'sent') {
            await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 * 60 });
        }

        return res.json(response);
    } catch (err) {
        console.error('Erro no buscarProtocolo:', err);
        next(err);
    }
};