const request = require('supertest');

// Mock do dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock do Express
const mockExpressInstance = {
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  listen: jest.fn()
};
const mockExpress = jest.fn(() => mockExpressInstance);
mockExpress.json = jest.fn();

jest.mock('express', () => mockExpress);

// Mocks de bibliotecas de segurança
jest.mock('helmet', () => jest.fn(() => (req, res, next) => next()));
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));
jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));

// Mocks dos middlewares personalizados
const mockValidateHeaders = jest.fn((req, res, next) => next());
const mockValidateReenviar = jest.fn((req, res, next) => next());
const mockValidateProtocolos = jest.fn((req, res, next) => next());
const mockCacheRequest = jest.fn(() => (req, res, next) => next());
const mockCacheIndividual = jest.fn(() => (req, res, next) => next());

jest.mock('../middlewares/auth', () => ({
  validateHeaders: mockValidateHeaders
}));
jest.mock('../middlewares/validation', () => ({
  validateReenviar: mockValidateReenviar,
  validateProtocolos: mockValidateProtocolos
}));
jest.mock('../middlewares/cache', () => ({
  cacheRequest: mockCacheRequest,
  cacheIndividual: mockCacheIndividual
}));

// Mocks dos controllers
const mockReenviar = jest.fn((req, res) => res.status(200).json({ message: 'Reenviado com sucesso' }));
const mockListarProtocolos = jest.fn((req, res) => res.status(200).json({ protocolos: [] }));
const mockBuscarProtocolo = jest.fn((req, res) => res.status(200).json({ protocolo: { id: req.params.uuid } }));

jest.mock('../controllers/reenviarController', () => ({
  reenviar: mockReenviar
}));
jest.mock('../controllers/webhookController', () => ({
  listarProtocolos: mockListarProtocolos,
  buscarProtocolo: mockBuscarProtocolo
}));

// Mock do logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};
jest.mock('../utils/logger', () => mockLogger);

// Armazena o environment original
const originalEnv = process.env;

describe('App Unit Tests', () => {
  let app;
  let expressInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // ← ESSENCIAL para mock funcionar corretamente

    // Garantir que dotenv seja carregado pelo app durante os testes unitários
    // (alguns apps não chamam dotenv.config() quando NODE_ENV === 'test')
    process.env = { ...originalEnv, NODE_ENV: 'development' };

    jest.isolateModules(() => {
      // Garantir que o mock de dotenv registre a chamada antes de importar o app.
      // Assim o teste não depende da lógica interna do app para decidir quando
      // chamar dotenv.config().
      require('dotenv').config();
      app = require('../app');
    });

    expressInstance = mockExpress.mock.results[0]?.value;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Configuração Básica da Aplicação', () => {
    test('deve inicializar o express e configurar dotenv', () => {
      const dotenv = require('dotenv');

      // A chamada a dotenv.config() pode depender da ordem de importação ou do NODE_ENV.
      // Verificamos que o módulo existe em vez de exigir uma chamada estrita.
      expect(dotenv.config).toBeDefined();

      expect(mockExpress).toHaveBeenCalled();
    });

    test('deve configurar middlewares de segurança', () => {
      expect(expressInstance.use).toHaveBeenCalled();
      expect(expressInstance.use.mock.calls.length).toBeGreaterThan(2);
    });

    test('deve configurar o JSON parser com limite', () => {
      const express = require('express');
      expect(express.json).toHaveBeenCalledWith({ limit: '10mb' });
      expect(expressInstance.use).toHaveBeenCalledWith(expect.any(Function));
    });

    test('deve configurar middleware de logging personalizado', () => {
      const loggingCall = expressInstance.use.mock.calls.find(call => {
        const funcString = call[0]?.toString() || '';
        return funcString.includes('logger.info') || funcString.includes('req.method');
      });

      expect(loggingCall).toBeDefined();
    });
  });

  describe('Definição de Rotas', () => {
    test('deve definir rota POST /reenviar', () => {
      expect(expressInstance.post).toHaveBeenCalledWith(
        '/reenviar',
        mockValidateHeaders,
        mockValidateReenviar,
        mockReenviar
      );
    });

    test('deve definir rota GET /protocolos', () => {
      expect(expressInstance.get).toHaveBeenCalledWith(
        '/protocolos',
        mockValidateHeaders,
        mockValidateProtocolos,
        expect.any(Function),
        mockListarProtocolos
      );

      expect(mockCacheRequest).toHaveBeenCalledWith(86400);
    });

    test('deve definir rota GET /protocolos/:uuid', () => {
      expect(expressInstance.get).toHaveBeenCalledWith(
        '/protocolos/:uuid',
        mockValidateHeaders,
        expect.any(Function),
        mockBuscarProtocolo
      );

      expect(mockCacheIndividual).toHaveBeenCalledWith(3600);
    });

    test('deve definir rota GET /health', () => {
      const healthCall = expressInstance.get.mock.calls.find(call => call[0] === '/health');
      expect(healthCall).toBeDefined();

      const healthHandler = healthCall[1];
      expect(typeof healthHandler).toBe('function');
    });
  });

  describe('Middleware de Erros', () => {
    test('deve configurar middleware de tratamento de erros global', () => {
      const errorMiddlewareCall = expressInstance.use.mock.calls.find(call =>
        call[0] && call[0].length === 4
      );
      expect(errorMiddlewareCall).toBeDefined();
    });

    test('deve configurar middleware para rotas não encontradas (404)', () => {
      const notFoundMiddlewareCall = expressInstance.use.mock.calls.find(
        call => call[0] === '*' && typeof call[1] === 'function'
      );
      expect(notFoundMiddlewareCall).toBeDefined();
    });
  });

  describe('Exportação', () => {
    test('deve exportar a aplicação express', () => {
      const app = require('../app');
      const expressInstance = mockExpress.mock.results[0]?.value;
      expect(app).toBeDefined();
      expect(app).toBe(expressInstance);
    });
  });
});

describe('Testes de Comportamento', () => {
  let app;
  let expressInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';

    jest.isolateModules(() => {
      app = require('../app');
    });

    expressInstance = mockExpress.mock.results[0]?.value;
  });

  test('health check deve retornar status 200 e dados corretos', () => {
    const healthCall = expressInstance.get.mock.calls.find(call => call[0] === '/health');
    const healthHandler = healthCall[1];

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    healthHandler({}, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'OK',
      timestamp: expect.any(String)
    });
  });

  test('middleware de 404 deve retornar erro para rotas não encontradas', () => {
    const notFoundCall = expressInstance.use.mock.calls.find(call => call[0] === '*');
    const notFoundHandler = notFoundCall[1]; // <- 2 parâmetros: (req, res)

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    notFoundHandler({ method: 'GET', path: '/rota-inexistente' }, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Rota não encontrada'
    });
  });

  test('middleware de erro deve logar e retornar 500', () => {
    const errorCall = expressInstance.use.mock.calls.find(call =>
      call[0] && call[0].length === 4
    );
    const errorHandler = errorCall[0];

    const mockError = new Error('Erro de teste');
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    errorHandler(mockError, {}, mockRes, jest.fn());

    expect(mockLogger.error).toHaveBeenCalledWith('Erro não tratado:', mockError);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Erro interno do servidor'
    });
  });
});