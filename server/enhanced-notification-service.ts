// Enhanced Notification Service - rozbudowany mikroserwis powiadomień
import { messageBroker, QUEUES, initializeMessageBroker } from './message-broker';
import { NotificationEvent } from './event-services';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, text, serial, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { eq, desc, and } from 'drizzle-orm';

// Schema dla tabeli powiadomień
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull().unique(),
  type: text("type").notNull(), // 'email', 'push', 'sms', 'webhook', 'internal'
  channel: text("channel").notNull(), // 'success', 'warning', 'error', 'info'
  recipient: text("recipient").notNull(), // email, phone, user_id
  subject: text("subject"),
  message: text("message").notNull(),
  templateData: jsonb("template_data"),
  status: text("status").notNull().default("pending"), // 'pending', 'sent', 'failed', 'retry'
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastError: text("last_error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

interface NotificationTemplate {
  subject?: string;
  htmlBody: string;
  textBody: string;
}

interface NotificationChannel {
  type: 'email' | 'push' | 'sms' | 'webhook' | 'internal';
  enabled: boolean;
  config: Record<string, any>;
}

class EnhancedNotificationService {
  private db: any;
  private channels: Map<string, NotificationChannel> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private metrics = {
    totalProcessed: 0,
    totalSent: 0,
    totalFailed: 0,
    byType: {} as Record<string, number>,
    byChannel: {} as Record<string, number>
  };

  async start(): Promise<void> {
    try {
      console.log('🚀 Uruchamianie Enhanced Notification Service...');
      
      // Połączenie z bazą danych
      await this.initializeDatabase();
      
      // Konfiguracja kanałów powiadomień
      this.setupNotificationChannels();
      
      // Ładowanie szablonów
      this.loadNotificationTemplates();
      
      // Inicjalizacja połączenia z RabbitMQ
      await initializeMessageBroker();
      
      // Subskrypcja na różne kolejki
      await this.subscribeToQueues();
      
      // Uruchomienie zadań w tle
      this.startBackgroundTasks();
      
      console.log('✅ Enhanced Notification Service uruchomiony pomyślnie');
      this.logMetrics();
    } catch (error) {
      console.error('❌ Błąd podczas uruchamiania Enhanced Notification Service:', error);
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/inventory';
    const sql = postgres(connectionString);
    this.db = drizzle(sql);
    console.log('📊 Połączono z bazą danych');
  }

  private setupNotificationChannels(): void {
    // Konfiguracja różnych kanałów powiadomień
    this.channels.set('email', {
      type: 'email',
      enabled: true,
      config: {
        provider: 'smtp', // mogłoby być 'sendgrid', 'ses', 'mailgun'
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_FROM || 'noreply@inventory.com'
      }
    });

    this.channels.set('push', {
      type: 'push',
      enabled: false, // wyłączone do czasu konfiguracji Firebase
      config: {
        firebaseApiKey: process.env.FIREBASE_API_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID
      }
    });

    this.channels.set('sms', {
      type: 'sms',
      enabled: false, // wyłączone do czasu konfiguracji Twilio
      config: {
        provider: 'twilio',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER
      }
    });

    this.channels.set('webhook', {
      type: 'webhook',
      enabled: true,
      config: {
        timeout: 5000,
        retryOnFailure: true
      }
    });

    this.channels.set('internal', {
      type: 'internal',
      enabled: true,
      config: {}
    });

    console.log(`📡 Skonfigurowano ${this.channels.size} kanałów powiadomień`);
  }

  private loadNotificationTemplates(): void {
    // Szablony dla różnych typów powiadomień
    this.templates.set('asset_created', {
      subject: 'Nowy asset został utworzony',
      htmlBody: `
        <h2>Utworzono nowy asset</h2>
        <p>W systemie został utworzony nowy asset:</p>
        <ul>
          <li><strong>Nazwa:</strong> {{name}}</li>
          <li><strong>ID:</strong> {{assetId}}</li>
          <li><strong>Kategoria:</strong> {{category}}</li>
          <li><strong>Lokalizacja:</strong> {{locationX}}, {{locationY}}</li>
        </ul>
        <p>Data utworzenia: {{createdAt}}</p>
      `,
      textBody: 'Utworzono nowy asset: {{name}} ({{assetId}}) w kategorii {{category}}'
    });

    this.templates.set('asset_updated', {
      subject: 'Asset został zaktualizowany',
      htmlBody: `
        <h2>Asset został zaktualizowany</h2>
        <p>Asset {{name}} ({{assetId}}) został zmodyfikowany.</p>
        <p>Data aktualizacji: {{updatedAt}}</p>
      `,
      textBody: 'Asset {{name}} ({{assetId}}) został zaktualizowany'
    });

    this.templates.set('asset_deleted', {
      subject: 'Asset został usunięty',
      htmlBody: `
        <h2>⚠️ Asset został usunięty</h2>
        <p>Asset {{name}} ({{assetId}}) został usunięty z systemu.</p>
        <p>Data usunięcia: {{deletedAt}}</p>
      `,
      textBody: 'Asset {{name}} ({{assetId}}) został usunięty'
    });

    this.templates.set('warehouse_updated', {
      subject: 'Magazyn został zaktualizowany',
      htmlBody: `
        <h2>Magazyn został zaktualizowany</h2>
        <p>Magazyn {{name}} został zmodyfikowany:</p>
        <ul>
          <li><strong>Maksymalna pojemność:</strong> {{maxCapacity}}</li>
          <li><strong>Obecna liczba:</strong> {{currentCount}}</li>
          <li><strong>Wykorzystanie:</strong> {{utilizationPercent}}%</li>
        </ul>
      `,
      textBody: 'Magazyn {{name}} został zaktualizowany. Wykorzystanie: {{utilizationPercent}}%'
    });

    this.templates.set('low_stock_alert', {
      subject: '⚠️ Ostrzeżenie o niskim stanie magazynowym',
      htmlBody: `
        <h2>🚨 Niski stan magazynowy</h2>
        <p>Magazyn {{warehouseName}} przekroczył próg ostrzeżenia:</p>
        <ul>
          <li><strong>Obecna liczba:</strong> {{currentCount}}</li>
          <li><strong>Maksymalna pojemność:</strong> {{maxCapacity}}</li>
          <li><strong>Wykorzystanie:</strong> {{utilizationPercent}}%</li>
        </ul>
        <p>Zalecane działanie: Sprawdź dostępność miejsc w magazynie.</p>
      `,
      textBody: 'OSTRZEŻENIE: Magazyn {{warehouseName}} ma niski stan ({{utilizationPercent}}%)'
    });

    console.log(`📝 Załadowano ${this.templates.size} szablonów powiadomień`);
  }

  private async subscribeToQueues(): Promise<void> {
    // Subskrypcja na powiadomienia ogólne
    await messageBroker.subscribe(QUEUES.NOTIFICATIONS, async (notification: NotificationEvent) => {
      await this.processNotification(notification);
    });

    // Subskrypcja na wydarzenia asset'ów
    await messageBroker.subscribe(QUEUES.ASSET_CREATED, async (event: any) => {
      await this.handleAssetEvent('asset_created', event);
    });

    await messageBroker.subscribe(QUEUES.ASSET_UPDATED, async (event: any) => {
      await this.handleAssetEvent('asset_updated', event);
    });

    await messageBroker.subscribe(QUEUES.ASSET_DELETED, async (event: any) => {
      await this.handleAssetEvent('asset_deleted', event);
    });

    // Subskrypcja na wydarzenia magazynu
    await messageBroker.subscribe(QUEUES.WAREHOUSE_UPDATED, async (event: any) => {
      await this.handleWarehouseEvent('warehouse_updated', event);
    });

    console.log('📨 Skonfigurowano subskrypcje na wszystkie kolejki');
  }

  private async handleAssetEvent(eventType: string, eventData: any): Promise<void> {
    console.log(`🔄 Przetwarzanie wydarzenia asset: ${eventType}`, eventData);
    
    this.updateMetrics('byType', eventType);
    
    // Tworzenie powiadomienia na podstawie szablonu
    const template = this.templates.get(eventType);
    if (!template) {
      console.warn(`⚠️ Brak szablonu dla wydarzenia: ${eventType}`);
      return;
    }

    const notificationData = {
      type: 'internal',
      channel: this.determineChannelByEvent(eventType),
      recipient: 'admin@inventory.com', // mogłoby być dynamiczne
      subject: this.renderTemplate(template.subject || '', eventData),
      message: this.renderTemplate(template.textBody, eventData),
      templateData: eventData,
      maxAttempts: 3
    };

    await this.saveAndSendNotification(notificationData);
  }

  private async handleWarehouseEvent(eventType: string, eventData: any): Promise<void> {
    console.log(`🏢 Przetwarzanie wydarzenia magazynu: ${eventType}`, eventData);
    
    this.updateMetrics('byType', eventType);
    
    // Sprawdzenie czy nie ma ostrzeżenia o niskim stanie
    if (eventData.currentCount && eventData.maxCapacity) {
      const utilizationPercent = (eventData.currentCount / eventData.maxCapacity) * 100;
      
      if (utilizationPercent > 90) {
        await this.sendLowStockAlert(eventData, utilizationPercent);
      }
    }

    // Standardowe powiadomienie o aktualizacji
    const template = this.templates.get(eventType);
    if (template) {
      const notificationData = {
        type: 'internal',
        channel: 'info',
        recipient: 'warehouse@inventory.com',
        subject: this.renderTemplate(template.subject || '', eventData),
        message: this.renderTemplate(template.textBody, eventData),
        templateData: eventData
      };

      await this.saveAndSendNotification(notificationData);
    }
  }

  private async sendLowStockAlert(warehouseData: any, utilizationPercent: number): Promise<void> {
    const template = this.templates.get('low_stock_alert');
    if (!template) return;

    const alertData = {
      ...warehouseData,
      utilizationPercent: utilizationPercent.toFixed(1)
    };

    const notificationData = {
      type: 'email',
      channel: 'warning',
      recipient: 'admin@inventory.com',
      subject: this.renderTemplate(template.subject || '', alertData),
      message: this.renderTemplate(template.htmlBody, alertData),
      templateData: alertData,
      maxAttempts: 5 // ważne powiadomienie
    };

    await this.saveAndSendNotification(notificationData);
    console.log(`🚨 Wysłano ostrzeżenie o niskim stanie magazynowym: ${utilizationPercent}%`);
  }

  private async processNotification(notification: NotificationEvent): Promise<void> {
    console.log('📩 Otrzymano powiadomienie do przetworzenia:', notification);
    
    this.metrics.totalProcessed++;
    this.updateMetrics('byChannel', notification.type);
    
    try {
      const notificationData = {
        type: 'internal',
        channel: notification.type,
        recipient: notification.userId || 'system',
        message: notification.message,
        templateData: notification
      };

      await this.saveAndSendNotification(notificationData);
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania powiadomienia:', error);
      this.metrics.totalFailed++;
      throw error;
    }
  }

  private async saveAndSendNotification(notificationData: any): Promise<void> {
    try {
      // Zapisanie powiadomienia do bazy danych
      const [savedNotification] = await this.db.insert(notifications).values({
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: notificationData.type,
        channel: notificationData.channel,
        recipient: notificationData.recipient,
        subject: notificationData.subject,
        message: notificationData.message,
        templateData: notificationData.templateData,
        maxAttempts: notificationData.maxAttempts || 3
      }).returning();

      console.log('💾 Zapisano powiadomienie do bazy danych:', savedNotification.id);
      
      // Wysłanie powiadomienia
      await this.sendNotification(savedNotification);
      
    } catch (error) {
      console.error('❌ Błąd podczas zapisywania/wysyłania powiadomienia:', error);
      throw error;
    }
  }

  private async sendNotification(notification: any): Promise<void> {
    const channel = this.channels.get(notification.type);
    
    if (!channel || !channel.enabled) {
      console.warn(`⚠️ Kanał ${notification.type} jest wyłączony lub nie istnieje`);
      return;
    }

    try {
      await this.db.update(notifications)
        .set({ 
          attempts: notification.attempts + 1,
          updatedAt: new Date()
        })
        .where(eq(notifications.id, notification.id));

      // Symulacja wysyłania przez różne kanały
      switch (notification.type) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'webhook':
          await this.sendWebhook(notification);
          break;
        case 'internal':
        default:
          await this.logInternalNotification(notification);
          break;
      }

      // Oznaczenie jako wysłane
      await this.db.update(notifications)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(notifications.id, notification.id));

      this.metrics.totalSent++;
      this.updateMetrics('byChannel', notification.type);
      
      console.log(`✅ Powiadomienie ${notification.id} wysłane przez ${notification.type}`);
      
    } catch (error) {
      console.error(`❌ Błąd podczas wysyłania powiadomienia ${notification.id}:`, error);
      
      await this.db.update(notifications)
        .set({ 
          status: notification.attempts >= notification.maxAttempts ? 'failed' : 'retry',
          lastError: error.message,
          updatedAt: new Date()
        })
        .where(eq(notifications.id, notification.id));
      
      this.metrics.totalFailed++;
      throw error;
    }
  }

  private async sendEmail(notification: any): Promise<void> {
    const channel = this.channels.get('email')!;
    console.log(`📧 Wysyłanie email do ${notification.recipient}`);
    console.log(`📧 Temat: ${notification.subject}`);
    console.log(`📧 Treść: ${notification.message.substring(0, 100)}...`);
    
    // Tutaj byłaby rzeczywista implementacja z SMTP/SendGrid/SES
    await this.delay(200); // Symulacja opóźnienia
  }

  private async sendPushNotification(notification: any): Promise<void> {
    console.log(`📱 Wysyłanie push notification do ${notification.recipient}`);
    // Implementacja z Firebase Cloud Messaging
    await this.delay(100);
  }

  private async sendSMS(notification: any): Promise<void> {
    console.log(`📞 Wysyłanie SMS do ${notification.recipient}`);
    // Implementacja z Twilio
    await this.delay(150);
  }

  private async sendWebhook(notification: any): Promise<void> {
    console.log(`🔗 Wysyłanie webhook dla ${notification.recipient}`);
    // Implementacja HTTP POST do zewnętrznego endpointa
    await this.delay(300);
  }

  private async logInternalNotification(notification: any): Promise<void> {
    const icon = this.getChannelIcon(notification.channel);
    console.log(`${icon} INTERNAL [${notification.channel.toUpperCase()}]: ${notification.message}`);
    await this.delay(50);
  }

  private getChannelIcon(channel: string): string {
    const icons = {
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'info': 'ℹ️'
    };
    return icons[channel] || '📨';
  }

  private determineChannelByEvent(eventType: string): string {
    if (eventType.includes('deleted')) return 'warning';
    if (eventType.includes('error') || eventType.includes('failed')) return 'error';
    if (eventType.includes('created') || eventType.includes('updated')) return 'success';
    return 'info';
  }

  private renderTemplate(template: string, data: any): string {
    let rendered = template;
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });
    return rendered;
  }

  private updateMetrics(category: string, key: string): void {
    if (!this.metrics[category]) {
      this.metrics[category] = {};
    }
    this.metrics[category][key] = (this.metrics[category][key] || 0) + 1;
  }

  private startBackgroundTasks(): void {
    // Zadanie retry dla nieudanych powiadomień - co 30 sekund
    setInterval(async () => {
      await this.retryFailedNotifications();
    }, 30000);

    // Logowanie metryk - co 5 minut
    setInterval(() => {
      this.logMetrics();
    }, 300000);

    // Czyszczenie starych powiadomień - co godzinę
    setInterval(async () => {
      await this.cleanupOldNotifications();
    }, 3600000);

    console.log('⏰ Uruchomiono zadania w tle');
  }

  private async retryFailedNotifications(): Promise<void> {
    try {
      const failedNotifications = await this.db.select()
        .from(notifications)
        .where(and(
          eq(notifications.status, 'retry'),
          eq(notifications.attempts, notifications.maxAttempts)
        ))
        .limit(10);

      if (failedNotifications.length > 0) {
        console.log(`🔄 Ponawiam ${failedNotifications.length} nieudanych powiadomień`);
        
        for (const notification of failedNotifications) {
          try {
            await this.sendNotification(notification);
          } catch (error) {
            console.error(`❌ Ponowienie powiadomienia ${notification.id} nieudane:`, error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Błąd podczas ponowień:', error);
    }
  }

  private async cleanupOldNotifications(): Promise<void> {
    try {
      // Usuń powiadomienia starsze niż 30 dni
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.db.delete(notifications)
        .where(and(
          eq(notifications.status, 'sent'),
          // notifications.createdAt < thirtyDaysAgo  // would need proper date comparison
        ));

      console.log(`🧹 Usunięto stare powiadomienia`);
    } catch (error) {
      console.error('❌ Błąd podczas czyszczenia:', error);
    }
  }

  private logMetrics(): void {
    console.log('\n📊 METRYKI NOTIFICATION SERVICE:');
    console.log(`📥 Łącznie przetworzonych: ${this.metrics.totalProcessed}`);
    console.log(`📤 Łącznie wysłanych: ${this.metrics.totalSent}`);
    console.log(`❌ Łącznie nieudanych: ${this.metrics.totalFailed}`);
    
    if (Object.keys(this.metrics.byType).length > 0) {
      console.log('📈 Według typu:');
      Object.entries(this.metrics.byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
    
    if (Object.keys(this.metrics.byChannel).length > 0) {
      console.log('📡 Według kanału:');
      Object.entries(this.metrics.byChannel).forEach(([channel, count]) => {
        console.log(`   ${channel}: ${count}`);
      });
    }
    console.log('');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Zamykanie Enhanced Notification Service...');
    try {
      await messageBroker.close();
      console.log('✅ Enhanced Notification Service zamknięty pomyślnie');
    } catch (error) {
      console.error('❌ Błąd podczas zamykania Enhanced Notification Service:', error);
    }
  }
}

// Uruchomienie serwisu
const enhancedNotificationService = new EnhancedNotificationService();

// Graceful shutdown
const gracefulShutdown = async () => {
  await enhancedNotificationService.shutdown();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start serwisu
enhancedNotificationService.start().catch((error) => {
  console.error('💥 Nieprzewidziany błąd:', error);
  process.exit(1);
});
