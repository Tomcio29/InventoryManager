# RabbitMQ Integration - Dokumentacja

## Przegląd

Aplikacja Inventory Manager została rozszerzona o komunikację z wykorzystaniem brokera wiadomości RabbitMQ w modelu publikator-subskrybent. Implementacja umożliwia:

- **Asynchroniczną komunikację** między mikroserwisami
- **Niezawodne dostarczanie wiadomości** z persistent queues
- **Skalowalne przetwarzanie zdarzeń** inventory management
- **Loosely coupled architecture** między usługami

## Architektura

### Komponenty:
1. **RabbitMQ Broker** - centralny broker wiadomości
2. **Backend Service** - publisher zdarzeń CRUD dla Assets/Warehouse
3. **Notification Service** - subscriber obsługujący powiadomienia
4. **PostgreSQL** - trwałe przechowywanie danych

### Message Flow:
```
[Backend API] --publish--> [RabbitMQ] --subscribe--> [Notification Service]
     |                        |                          |
     v                        v                          v
[PostgreSQL]            [Exchanges/Queues]        [Email/Push/SMS]
```

## Konfiguracja Exchange'ów i Kolejek

### Exchange'e:
- `inventory.exchange` (topic) - zdarzenia inventory management
- `notifications.exchange` (topic) - system powiadomień

### Kolejki:
- `asset.created` - nowe aktywa
- `asset.updated` - aktualizacje aktywów
- `asset.deleted` - usunięcia aktywów
- `warehouse.updated` - zmiany magazynu
- `notifications.queue` - wszystkie powiadomienia

### Routing Keys:
- `asset.created` - tworzenie aktywów
- `asset.updated` - aktualizacje aktywów
- `asset.deleted` - usuwanie aktywów
- `warehouse.updated` - zmiany magazynu
- `notification.send` - wysyłanie powiadomień

## Uruchomienie z Docker Compose

### 1. Standardowe uruchomienie:
```bash
docker-compose up -d
```

### 2. Sprawdzenie statusu:
```bash
docker-compose ps
```

### 3. Logi RabbitMQ:
```bash
docker-compose logs rabbitmq
```

### 4. Dostęp do RabbitMQ Management UI:
- URL: http://localhost:15672
- Username: admin
- Password: admin123

## Uruchomienie z Kubernetes

### 1. Utworzenie namespace:
```bash
kubectl apply -f k8s-deployment.yaml
```

### 2. Sprawdzenie statusu:
```bash
kubectl get pods -n inventory-manager
```

### 3. Port forwarding dla RabbitMQ UI:
```bash
kubectl port-forward -n inventory-manager svc/rabbitmq-service 15672:15672
```

## Development

### Uruchomienie lokalnie:

1. **Uruchom RabbitMQ:**
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3.13-management
```

2. **Uruchom backend:**
```bash
npm run dev
```

3. **Uruchom notification service:**
```bash
npm run dev:notification
```

## Testowanie

### 1. Tworzenie aktywa (generuje event):
```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Asset",
    "category": "Equipment",
    "locationX": "10",
    "locationY": "20",
    "inWarehouse": true
  }'
```

### 2. Sprawdzenie kolejek w RabbitMQ UI:
- Otwórz http://localhost:15672
- Przejdź do zakładki "Queues"
- Sprawdź czy wiadomości są przetwarzane

### 3. Logi notification service:
```bash
docker-compose logs notification-service
```

## Event Types

### AssetEvent:
```typescript
interface AssetEvent {
  id: number;
  name: string;
  location?: string;
  warehouseId?: number;
  timestamp: Date;
  eventType: 'created' | 'updated' | 'deleted';
}
```

### WarehouseEvent:
```typescript
interface WarehouseEvent {
  id: number;
  name: string;
  location: string;
  timestamp: Date;
  eventType: 'updated';
}
```

### NotificationEvent:
```typescript
interface NotificationEvent {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: number;
  timestamp: Date;
}
```

## Monitoring

### RabbitMQ Metrics:
- **Management UI**: http://localhost:15672
- **Queue lengths**: Monitor for backlogs
- **Message rates**: Published/delivered/acked per second
- **Connection status**: Active connections and channels

### Health Checks:
```bash
# RabbitMQ Health
docker-compose exec rabbitmq rabbitmq-diagnostics ping

# Backend Health
curl http://localhost:5000/api/warehouse

# Notification Service Health
docker-compose logs notification-service | tail -10
```

## Scalowanie

### Docker Compose:
```bash
# Skalowanie notification service
docker-compose up -d --scale notification-service=3
```

### Kubernetes:
```bash
# Skalowanie backend
kubectl scale deployment backend --replicas=3 -n inventory-manager

# Skalowanie notification service
kubectl scale deployment notification-service --replicas=2 -n inventory-manager
```

## Troubleshooting

### Typowe problemy:

1. **RabbitMQ nie startuje:**
   - Sprawdź porty (5672, 15672)
   - Sprawdź miejsca na dysku
   - Sprawdź logi: `docker-compose logs rabbitmq`

2. **Wiadomości się gromadzą:**
   - Sprawdź czy notification service działa
   - Sprawdź logi consumer'a
   - Zwiększ liczbę worker'ów

3. **Błędy połączenia:**
   - Sprawdź RABBITMQ_URL
   - Sprawdź network connectivity
   - Sprawdź credentials

### Debug commands:
```bash
# Restart wszystkich serwisów
docker-compose restart

# Przebudowanie z czystymi kontenerami
docker-compose down && docker-compose up --build

# Sprawdzenie sieci
docker network ls
docker network inspect inventory_network
```

## Rozszerzenia

### Dodawanie nowych event types:
1. Dodaj nową kolejkę w `message-broker.ts`
2. Dodaj routing key
3. Zaimplementuj publisher w odpowiednim endpoint'cie
4. Dodaj subscriber w `event-services.ts`

### Dodawanie nowych mikroserwisów:
1. Utwórz nowy plik serwisu (np. `audit-service.ts`)
2. Dodaj Dockerfile
3. Dodaj do docker-compose.yml
4. Skonfiguruj subskrypcje na odpowiednie kolejki

## Security

### Produkcyjne ustawienia:
- Zmień domyślne hasła RabbitMQ
- Użyj TLS dla połączeń
- Skonfiguruj virtual hosts
- Ograniczenie uprawnień użytkowników
- Monitoring i alerting

### Przykład produkcyjnej konfiguracji:
```yaml
rabbitmq:
  image: rabbitmq:3.13-management
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASS}
    RABBITMQ_SSL_CERTFILE: /certs/server-cert.pem
    RABBITMQ_SSL_KEYFILE: /certs/server-key.pem
```
