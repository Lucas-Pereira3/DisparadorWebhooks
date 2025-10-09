const request = require('supertest');
const app = require('../app'); // Corrigido: Sobe um nível para encontrar 'app.js'

// Mock do logger para evitar logs nos testes
// Corrigido: Sobe um nível para chegar na pasta 'utils'
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// Mock das rotas (para isolar os testes da lógica de rota)
// Corrigido: Sobe um nível para chegar na pasta 'routes'
jest.mock('../routes/reenviarRoutes', () => require('express').Router().get('/', (req, res) => res.status(200).json({ route: 'reenviar' })));
jest.mock('../routes/protocoloRoutes', () => require('express').Router().get('/', (req, res) => res.status(200).json({ route: 'protocolos' })));
jest.mock('../routes/healthRoutes', () => require('express').Router().get('/', (req, res) => res.status(200).json({ status: 'OK' })));

describe('Configuração e Middlewares do App', () => {
  
  // Configuração global para ambiente de teste
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Garante que o ambiente de teste é usado
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // Restaura o ambiente original
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  // ---

  describe('Health Check Route', () => {
    it('Deve retornar 200 e status OK para /health', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  // ---

  describe('Rotas de Middleware e Handlers', () => {
    
    it('Deve retornar 404 para rota não encontrada (handler de 404)', async () => {
      const response = await request(app).get('/rota-inexistente');
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: 'Rota não encontrada' });
    });

    it('Deve aplicar o middleware JSON parser e registrar o log', async () => {
      const testData = { id: 123, status: 'test' };
      
      // Enviamos dados POST para uma das rotas mockadas que utiliza o parser
      const response = await request(app)
        .get('/reenviar')
        .send(testData);

      // A rota mockada retorna 200, mas verificamos a execução do logger
      expect(response.statusCode).toBe(200);
      
      // Verificamos se o logger registrou a requisição com o corpo enviado
      const logger = require('../utils/logger');
      expect(logger.info).toHaveBeenCalled();
      
      const loggerCall = logger.info.mock.calls.find(call => call[0].includes('/reenviar'));
      
      // O corpo da requisição deve ser registrado pelo middleware de logging
      expect(loggerCall[1].body).toEqual(testData); 
    });
    
  });

  // ---
  
  describe('CORS Configuration', () => {
    
    it('Deve definir o cabeçalho Access-Control-Allow-Origin como * em ambiente de teste/desenvolvimento', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
    
  });

});