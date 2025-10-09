const request = require('supertest');
const logger = require('../utils/logger'); 

// Mock COMPLETO de todas as dependências antes de importar a app
jest.mock('../middlewares/auth', () => (req, res, next) => {
  req.user = { id: 'test-user', role: 'admin' };
  next();
});

jest.mock('../middlewares/validation', () => ({
  validateProtocolos: (req, res, next) => next(),
  validateReenviar: (req, res, next) => next()
}));

jest.mock('../middlewares/cache', () => ({
  cacheRequest: () => (req, res, next) => next(),
  cacheIndividual: () => (req, res, next) => next()
}));

// Mocks dos Controllers para evitar a lógica real de negócio
jest.mock('../controllers/webhookController', () => ({
  listarProtocolos: (req, res) => res.status(200).json({ protocolos: [] }),
  buscarProtocolo: (req, res) => res.status(200).json({ uuid: req.params.uuid })
}));

jest.mock('../controllers/reenviarController', () => ({
  reenviar: (req, res) => res.status(200).json({ message: 'Reenviado com sucesso' })
}));

// Mock real do logger para rastrear chamadas
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Agora importa a app depois dos mocks
const app = require('../app');

describe('Integração - Rotas com Middlewares Reais', () => {
    
  // Limpa as chamadas mockadas antes de cada teste
  beforeEach(() => {
    logger.info.mockClear();
  });


  test('GET /health com app real e validação do logger (CORRIGIDO HEADERS)', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    
    // Espera que o logger.info seja chamado
    expect(logger.info).toHaveBeenCalled();
    
    // Verifica os argumentos da chamada ao logger para a rota /health
    expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('GET /health'), 
        expect.objectContaining({ 
            body: {},
            query: {},
            headers: expect.any(Object),
        })
    );
  });
  
  // ---

  test('POST /reenviar e verifica o logging do payload', async () => {
    const payload = {
      destinatario: 'test@example.com',
      mensagem: 'Teste'
    };
    
    const response = await request(app)
      .post('/reenviar')
      .send(payload);
    
    expect(response.status).toBe(200);

    // Verifica se o logger registrou a requisição com o corpo enviado
    expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('POST /reenviar'), 
        expect.objectContaining({
            body: payload, 
            query: {},
            headers: expect.any(Object),
        })
    );
  });
  
  // ---

  test('GET /protocolos com app real', async () => {
    const response = await request(app).get('/protocolos');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ protocolos: [] });
  });

  test('GET /protocolos/:uuid com app real', async () => {
    const uuid = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
    const response = await request(app).get(`/protocolos/${uuid}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ uuid: uuid });
  });
  
});