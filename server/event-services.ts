// Event Services - definicje eventów i publisherów

export interface NotificationEvent {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AssetEvent {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  assetId: string;
  assetData?: any;
  userId?: string;
  timestamp: Date;
}

export interface WarehouseEvent {
  id: string;
  action: 'updated';
  warehouseId: string;
  warehouseData?: any;
  userId?: string;
  timestamp: Date;
}

import { messageBroker, EXCHANGES, ROUTING_KEYS } from './message-broker';

export class EventPublisher {
  
  async publishAssetEvent(event: AssetEvent): Promise<void> {
    try {
      const routingKey = event.action === 'created' ? ROUTING_KEYS.ASSET_CREATED :
                        event.action === 'updated' ? ROUTING_KEYS.ASSET_UPDATED :
                        ROUTING_KEYS.ASSET_DELETED;
      
      await messageBroker.publish(EXCHANGES.INVENTORY, routingKey, event);
      console.log(`Event aktywa opublikowany: ${event.action} - ${event.assetId}`);
    } catch (error) {
      console.error('Błąd podczas publikowania zdarzenia aktywa:', error);
      throw error;
    }
  }

  async publishWarehouseEvent(event: WarehouseEvent): Promise<void> {
    try {
      await messageBroker.publish(EXCHANGES.INVENTORY, ROUTING_KEYS.WAREHOUSE_UPDATED, event);
      console.log(`Event magazynu opublikowany: ${event.action} - ${event.warehouseId}`);
    } catch (error) {
      console.error('Błąd podczas publikowania zdarzenia magazynu:', error);
      throw error;
    }
  }

  async publishNotificationEvent(event: NotificationEvent): Promise<void> {
    try {
      await messageBroker.publish(EXCHANGES.NOTIFICATIONS, ROUTING_KEYS.NOTIFICATION_SEND, event);
      console.log(`Powiadomienie opublikowane: ${event.type} - ${event.title}`);
    } catch (error) {
      console.error('Błąd podczas publikowania powiadomienia:', error);
      throw error;
    }
  }
}

export const eventPublisher = new EventPublisher();
