const { v4: uuidv4 } = require('uuid');
const { redisClient } = require('../config/database');
const { WebhookReprocessado, Cedente, Conta } = require('../models');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'reenviar-controller' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/reenviar.log' })
  ]
});

// Tabela de mapeamento de situações
const SITUACOES_MAP = {
  disponivel: {
    boleto: ['REGISTRADO'],
    pagamento: ['SCHEDULED', 'ACTIVE'],
    pix: ['ACTIVE']
  },
  cancelado: {
    boleto: ['BAIXADO'],
    pagamento: ['CANCELLED'],
    pix: ['REJECTED']
  },
  pago: {
    boleto: ['LIQUIDADO'],
    pagamento: ['PAID'],
    pix: ['LIQUIDATED']
  }
};

class ReenviarController {
  // Gerar chave única para cache baseada nos dados da requisição
  generateCacheKey(authData, requestData) {
    return `reenvio:${authData.cedente.cnpj}:${requestData.product}:${requestData.type}:${JSON.stringify(requestData.id.sort())}`;
  }

  // Validar situações dos IDs conforme a tabela
  async validateSituations(ids, product, type) {
    const situacoesValidas = SITUACOES_MAP[type]?.[product];
    
    if (!situacoesValidas) {
      throw new Error(`Combinação product/type inválida: ${product}/${type}`);
    }

    // SIMULAÇÃO: Aqui você faria a consulta real ao sistema legado
    // Por enquanto, vamos simular algumas validações
    const idsInvalidos = [];
    
    // Simulação: 2º ID sempre inválido para teste
    for (let i = 0; i < ids.length; i++) {
      if (i === 1) { // Segundo ID sempre inválido para demonstração
        idsInvalidos.push(ids[i]);
      }
    }

    return idsInvalidos;
  }

  // Buscar configuração de notificação (conta tem prioridade sobre cedente)
  async getConfiguracaoNotificacao(cedenteId, product) {
    try {
      // Buscar conta ativa para o product
      const conta = await Conta.findOne({
        where: {
          cedente_id: cedenteId,
          produto: product,
          status: 'ativo'
        }
      });

      if (conta && conta.configuracao_notificacao && conta.configuracao_notificacao.ativado) {
        logger.info(`Usando configuração da conta: ${conta.id}`);
        return conta.configuracao_notificacao;
      }

      // Se não tem conta ou configuração, usar cedente
      const cedente = await Cedente.findByPk(cedenteId);
      if (cedente && cedente.configuracao_notificacao && cedente.configuracao_notificacao.ativado) {
        logger.info(`Usando configuração do cedente: ${cedente.id}`);
        return cedente.configuracao_notificacao;
      }

      throw new Error('Nenhuma configuração de notificação ativa encontrada');
    } catch (error) {
      logger.error('Erro ao buscar configuração:', error);
      throw error;
    }
  }

  // Simular envio do webhook (integraria com sistema real)
  async enviarWebhook(configuracao, dados) {
    try {
      // Aqui você integraria com axios para enviar para a URL configurada
      // Por enquanto, vamos simular o envio
      
      const payload = {
        tipo: dados.type,
        produto: dados.product,
        ids: dados.id,
        timestamp: new Date().toISOString(),
        dados_adicionais: {} // Aqui viriam os dados completos do sistema legado
      };

      logger.info(`Webhook simulado para: ${configuracao.url}`, payload);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simular protocolo de resposta
      const protocolo = `WH${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      return {
        success: true,
        protocolo,
        url: configuracao.url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Erro ao enviar webhook:', error);
      throw new Error('Falha no envio do webhook');
    }
  }

  // Armazenar no banco após sucesso
  async armazenarWebhookReprocessado(dados, authData, protocolo) {
    try {
      const webhookReprocessado = await WebhookReprocessado.create({
        data: dados,
        cedente_id: authData.cedente.id,
        kind: dados.kind,
        type: dados.type,
        servico_id: dados.id,
        protocolo: protocolo
      });

      logger.info(`Webhook reprocessado armazenado: ${webhookReprocessado.id}`);
      return webhookReprocessado;
    } catch (error) {
      logger.error('Erro ao armazenar webhook reprocessado:', error);
      throw error;
    }
  }

  // Controller principal
  async reenviarWebhook(req, res) {
    const transaction = await models.sequelize.transaction();
    
    try {
      const authData = req.auth;
      const requestData = req.body;

      logger.info('Nova requisição de reenvio', {
        cedente: authData.cedente.cnpj,
        ...requestData
      });

      // 1. Verificar cache para evitar reprocessamento repetido
      const cacheKey = this.generateCacheKey(authData, requestData);
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        logger.warn('Requisição duplicada detectada no cache');
        return res.status(429).json({
          error: 'Requisição duplicada',
          message: 'Uma requisição idêntica foi processada recentemente. Aguarde 1 hora para novo envio.',
          protocolo: JSON.parse(cached).protocolo
        });
      }

      // 2. Validar situações dos IDs
      const idsInvalidos = await this.validateSituations(
        requestData.id, 
        requestData.product, 
        requestData.type
      );

      if (idsInvalidos.length > 0) {
        await transaction.rollback();
        
        logger.warn('Situações inválidas detectadas', { idsInvalidos });
        
        return res.status(422).json({
          error: 'Situação divergente',
          message: `Não foi possível gerar a notificação. A situação do ${requestData.product} diverge do tipo de notificação solicitado.`,
          ids_invalidos: idsInvalidos,
          product: requestData.product,
          type_solicitado: requestData.type
        });
      }

      // 3. Buscar configuração de notificação
      const configuracao = await this.getConfiguracaoNotificacao(
        authData.cedente.id, 
        requestData.product
      );

      // 4. Enviar webhook
      const resultadoEnvio = await this.enviarWebhook(configuracao, requestData);
      
      if (!resultadoEnvio.success) {
        await transaction.rollback();
        throw new Error('Falha no envio do webhook');
      }

      // 5. Armazenar no banco
      const webhookArmazenado = await this.armazenarWebhookReprocessado(
        requestData,
        authData,
        resultadoEnvio.protocolo
      );

      // 6. Armazenar em cache por 1 hora
      const cacheData = {
        protocolo: resultadoEnvio.protocolo,
        timestamp: new Date().toISOString(),
        dados: requestData
      };
      
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(cacheData)); // 1 hora

      // 7. Commit da transação
      await transaction.commit();

      logger.info('Webhook reprocessado com sucesso', {
        protocolo: resultadoEnvio.protocolo,
        cedente: authData.cedente.cnpj
      });

      // 8. Retornar sucesso
      res.status(200).json({
        success: true,
        message: 'Notificação reprocessada com sucesso',
        protocolo: resultadoEnvio.protocolo,
        url: resultadoEnvio.url,
        timestamp: resultadoEnvio.timestamp,
        webhook_id: webhookArmazenado.id
      });

    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      
      logger.error('Erro no processamento do reenvio:', error);

      if (error.message.includes('configuração')) {
        return res.status(400).json({
          error: 'Configuração não encontrada',
          message: 'Nenhuma configuração de notificação ativa encontrada para o produto solicitado.'
        });
      }

      if (error.message.includes('Combinação product/type inválida')) {
        return res.status(400).json({
          error: 'Parâmetros inválidos',
          message: error.message
        });
      }

      // Erro genérico
      res.status(400).json({
        error: 'Erro no processamento',
        message: 'Não foi possível gerar a notificação. Tente novamente mais tarde.'
      });
    }
  }

  // Método auxiliar para limpar cache (útil para testes)
  async limparCache(req, res) {
    try {
      const { pattern = 'reenvio:*' } = req.query;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      res.json({
        message: `Cache limpo para ${keys.length} chaves`,
        pattern,
        keys_removidas: keys
      });
    } catch (error) {
      logger.error('Erro ao limpar cache:', error);
      res.status(500).json({ error: 'Erro ao limpar cache' });
    }
  }
}

module.exports = new ReenviarController();