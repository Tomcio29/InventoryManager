import * as amqp from 'amqplib';

export class MessageBroker {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url: string;

  constructor(url: string = process.env.RABBITMQ_URL || 'amqp://localhost:5672') {
    this.url = url;
  }

  async connect(): Promise<void> {
    try {
      console.log(`Łączenie z RabbitMQ: ${this.url}`);
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Nasłuchiwanie na zamknięcie połączenia
      this.connection.on('error', (err: any) => {
        console.error('Błąd połączenia RabbitMQ:', err);
      });

      this.connection.on('close', () => {
        console.log('Połączenie z RabbitMQ zostało zamknięte');
        this.connection = null;
        this.channel = null;
      });

      console.log('Połączono z RabbitMQ pomyślnie');
    } catch (error) {
      console.error('Błąd podczas łączenia z RabbitMQ:', error);
      throw error;
    }
  }

  async ensureConnection(): Promise<void> {
    if (!this.connection || !this.channel) {
      await this.connect();
    }
  }

  // Tworzenie exchange
  async createExchange(exchangeName: string, type: 'direct' | 'topic' | 'fanout' = 'topic'): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error('Brak kanału RabbitMQ');
    
    await this.channel.assertExchange(exchangeName, type, { durable: true });
    console.log(`Exchange '${exchangeName}' został utworzony`);
  }

  // Tworzenie kolejki
  async createQueue(queueName: string, durable: boolean = true): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error('Brak kanału RabbitMQ');
    
    await this.channel.assertQueue(queueName, { durable });
    console.log(`Kolejka '${queueName}' została utworzona`);
  }

  // Wiązanie kolejki z exchange
  async bindQueue(queueName: string, exchangeName: string, routingKey: string): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error('Brak kanału RabbitMQ');
    
    await this.channel.bindQueue(queueName, exchangeName, routingKey);
    console.log(`Kolejka '${queueName}' została powiązana z exchange '${exchangeName}' kluczem '${routingKey}'`);
  }

  // Publikowanie wiadomości
  async publish(exchangeName: string, routingKey: string, message: any): Promise<boolean> {
    await this.ensureConnection();
    if (!this.channel) throw new Error('Brak kanału RabbitMQ');

    const messageBuffer = Buffer.from(JSON.stringify(message));
    const result = this.channel.publish(exchangeName, routingKey, messageBuffer, {
      persistent: true,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    console.log(`Opublikowano wiadomość: exchange='${exchangeName}', routingKey='${routingKey}'`);
    return result;
  }

  // Subskrypcja na wiadomości
  async subscribe(
    queueName: string, 
    callback: (message: any, originalMessage: amqp.ConsumeMessage) => Promise<void>
  ): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error('Brak kanału RabbitMQ');

    await this.channel.consume(queueName, async (msg: amqp.ConsumeMessage | null) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`Otrzymano wiadomość z kolejki '${queueName}':`, content);
          
          await callback(content, msg);
          this.channel!.ack(msg);
        } catch (error) {
          console.error('Błąd podczas przetwarzania wiadomości:', error);
          this.channel!.nack(msg, false, false); // Odrzuć wiadomość
        }
      }
    });

    console.log(`Rozpoczęto nasłuchiwanie na kolejce '${queueName}'`);
  }

  // Zamknięcie połączenia
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('Połączenie z RabbitMQ zostało zamknięte');
    } catch (error) {
      console.error('Błąd podczas zamykania połączenia:', error);
    }
  }
}

// Singleton instance
export const messageBroker = new MessageBroker();

// Konfiguracja exchange'ów i kolejek dla aplikacji
export const EXCHANGES = {
  INVENTORY: 'inventory.exchange',
  NOTIFICATIONS: 'notifications.exchange'
} as const;

export const QUEUES = {
  ASSET_CREATED: 'asset.created',
  ASSET_UPDATED: 'asset.updated',
  ASSET_DELETED: 'asset.deleted',
  WAREHOUSE_UPDATED: 'warehouse.updated',
  NOTIFICATIONS: 'notifications.queue'
} as const;

export const ROUTING_KEYS = {
  ASSET_CREATED: 'asset.created',
  ASSET_UPDATED: 'asset.updated',
  ASSET_DELETED: 'asset.deleted',
  WAREHOUSE_UPDATED: 'warehouse.updated',
  NOTIFICATION_SEND: 'notification.send'
} as const;

// Inicjalizacja broker'a
export async function initializeMessageBroker(): Promise<void> {
  try {
    await messageBroker.connect();
    
    // Tworzenie exchange'ów
    await messageBroker.createExchange(EXCHANGES.INVENTORY);
    await messageBroker.createExchange(EXCHANGES.NOTIFICATIONS);
    
    // Tworzenie kolejek
    await messageBroker.createQueue(QUEUES.ASSET_CREATED);
    await messageBroker.createQueue(QUEUES.ASSET_UPDATED);
    await messageBroker.createQueue(QUEUES.ASSET_DELETED);
    await messageBroker.createQueue(QUEUES.WAREHOUSE_UPDATED);
    await messageBroker.createQueue(QUEUES.NOTIFICATIONS);
    
    // Wiązanie kolejek z exchange'ami
    await messageBroker.bindQueue(QUEUES.ASSET_CREATED, EXCHANGES.INVENTORY, ROUTING_KEYS.ASSET_CREATED);
    await messageBroker.bindQueue(QUEUES.ASSET_UPDATED, EXCHANGES.INVENTORY, ROUTING_KEYS.ASSET_UPDATED);
    await messageBroker.bindQueue(QUEUES.ASSET_DELETED, EXCHANGES.INVENTORY, ROUTING_KEYS.ASSET_DELETED);
    await messageBroker.bindQueue(QUEUES.WAREHOUSE_UPDATED, EXCHANGES.INVENTORY, ROUTING_KEYS.WAREHOUSE_UPDATED);
    await messageBroker.bindQueue(QUEUES.NOTIFICATIONS, EXCHANGES.NOTIFICATIONS, ROUTING_KEYS.NOTIFICATION_SEND);
    
    console.log('MessageBroker został zainicjalizowany pomyślnie');
  } catch (error) {
    console.error('Błąd podczas inicjalizacji MessageBroker:', error);
    throw error;
  }
}
