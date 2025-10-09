const express = require('express');
const router = express.Router();

const validateHeaders = require('../middlewares/auth');
const { validateProtocolos } = require('../middlewares/validation');
const { cacheRequest, cacheIndividual } = require('../middlewares/cache');
const { listarProtocolos, buscarProtocolo } = require('../controllers/webhookController');

// GET /protocolos → lista protocolos (com cache)
router.get('/', validateHeaders, validateProtocolos, cacheRequest(86400), listarProtocolos);

// GET /protocolos/:uuid → busca protocolo individual (com cache)
router.get('/:uuid', validateHeaders, cacheIndividual(3600), buscarProtocolo);

module.exports = router;
