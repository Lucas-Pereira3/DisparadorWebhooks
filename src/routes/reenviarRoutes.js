const express = require('express');
const router = express.Router();

const validateHeaders = require('../middlewares/auth');
const { validateReenviar } = require('../middlewares/validation');
const { reenviar } = require('../controllers/reenviarController');

// POST /reenviar → reenvio de mensagens
router.post('/', validateHeaders, validateReenviar, reenviar);

module.exports = router;