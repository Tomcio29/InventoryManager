// Notification Service - przykład mikroserwisu komunikującego się przez RabbitMQ
import { messageBroker, QUEUES, initializeMessageBroker } from './message-broker';
import { NotificationEvent } from './event-services';

class NotificationService {
  
  async start(): Promise<void> {
    try {
      console.log('Uruchamianie Notification Service...');
      
      // Inicjalizacja połączenia z RabbitMQ
      await initializeMessageBroker();
      
      // Subskrypcja na powiadomienia
      await this.subscribeToNotifications();
      
      console.log('Notification Service uruchomiony pomyślnie');
    } catch (error) {
      console.error('Błąd podczas uruchamiania Notification Service:', error);
      process.exit(1);
    }
  }

  private async subscribeToNotifications(): Promise<void> {
    await messageBroker.subscribe(QUEUES.NOTIFICATIONS, async (notification: NotificationEvent) => {
      console.log('Otrzymano powiadomienie do przetworzenia:', notification);
      
      try {
        // Symulacja różnych rodzajów powiadomień
        switch (notification.type) {
          case 'success':
            await this.sendSuccessNotification(notification);
            break;
          case 'warning':
            await this.sendWarningNotification(notification);
            break;
          case 'error':
            await this.sendErrorNotification(notification);
            break;
          case 'info':
            await this.sendInfoNotification(notification);
            break;
          default:
            console.log('Nieznany typ powiadomienia:', notification.type);
        }
        
        // Zapisanie powiadomienia do "bazy danych" (symulacja)
        await this.saveNotificationToDatabase(notification);
        
      } catch (error) {
        console.error('Błąd podczas przetwarzania powiadomienia:', error);
        throw error; // Re-throw żeby wiadomość została ponownie przetworzona
      }
    });
  }

  private async sendSuccessNotification(notification: NotificationEvent): Promise<void> {
    console.log(`✅ SUCCESS: ${notification.message}`);
    
    // Tutaj można dodać rzeczywistą logikę wysyłania:
    // - Email przez SendGrid/SES
    // - Push notification przez Firebase
    // - SMS przez Twilio
    // - Webhook do zewnętrznego systemu
    
    // Symulacja opóźnienia
    await this.delay(100);
  }

  private async sendWarningNotification(notification: NotificationEvent): Promise<void> {
    console.log(`⚠️ WARNING: ${notification.message}`);
    
    // Ostrzeżenia mogą wymagać specjalnej uwagi
    if (notification.userId) {
      console.log(`Wysyłanie ostrzeżenia do użytkownika ID: ${notification.userId}`);
    }
    
    await this.delay(100);
  }

  private async sendErrorNotification(notification: NotificationEvent): Promise<void> {
    console.log(`❌ ERROR: ${notification.message}`);
    
    // Błędy mogą wymagać natychmiastowego działania
    console.log('Wysyłanie powiadomienia o błędzie do administratorów');
    
    await this.delay(100);
  }

  private async sendInfoNotification(notification: NotificationEvent): Promise<void> {
    console.log(`ℹ️ INFO: ${notification.message}`);
    
    await this.delay(50);
  }

  private async saveNotificationToDatabase(notification: NotificationEvent): Promise<void> {
    // Symulacja zapisywania do bazy danych
    const logEntry = {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      userId: notification.userId,
      timestamp: notification.timestamp,
      processed: true,
      processedAt: new Date()
    };
    
    console.log('Zapisano powiadomienie do bazy danych:', logEntry);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    console.log('Zamykanie Notification Service...');
    try {
      await messageBroker.close();
      console.log('Notification Service zamknięty pomyślnie');
    } catch (error) {
      console.error('Błąd podczas zamykania Notification Service:', error);
    }
  }
}

// Uruchomienie serwisu
const notificationService = new NotificationService();

// Graceful shutdown
const gracefulShutdown = async () => {
  await notificationService.shutdown();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start serwisu
notificationService.start().catch((error) => {
  console.error('Nieprzewidziany błąd:', error);
  process.exit(1);
});
