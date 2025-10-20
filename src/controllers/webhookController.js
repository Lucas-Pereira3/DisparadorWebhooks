const { listProtocolos, getProtocolo } = require('../services/protocoloService');
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

        const cacheKey = `protocolos:${JSON.stringify(req.query)}:${req.cedente.id}`;

        // Verifica se existe cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Usar o service em vez de consulta direta
        const result = await listProtocolos(req.query, req.cedente.id);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        if (result.data.length === 0) {
            return res.status(404).json({ error: 'Nenhum protocolo encontrado para o período informado.' });
        }

        // Formatar resposta
        const response = result.data.map(proto => ({
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

        const cacheKey = `protocolo:${uuid}:${req.cedente.id}`;
        
        // Verifica cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            const data = JSON.parse(cachedData);
            // Só retorna do cache se o status for "sent"
            if (data.status === 'sent') {
                console.log(`Retornando protocolo do cache: ${uuid}`);
                return res.json(data);
            }
        }

        // Usar o service em vez de consulta direta
        const result = await getProtocolo(uuid, req.cedente.id);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        // Salva em cache por 1 hora (apenas se status = 'sent')
        if (result.data.status === 'sent') {
            await redisClient.set(cacheKey, JSON.stringify(result.data), { EX: 60 * 60 });
        }

        return res.json(result.data);
    } catch (err) {
        console.error('Erro no buscarProtocolo:', err);
        next(err);
    }
};