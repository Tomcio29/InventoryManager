# Inventory Management System

System zarządzania magazynem z funkcjami:
- Zarządzanie zasobami (CRUD)
- Generowanie i skanowanie kodów QR
- Interaktywna mapa lokalizacji
- Śledzenie pojemności magazynu
- Panel administracyjny

## Architektura Docker

Aplikacja składa się z trzech kontenerów:
- **postgres**: Baza danych PostgreSQL
- **backend**: Server Node.js/Express
- **frontend**: Aplikacja React z Nginx

## Wymagania

- Docker
- Docker Compose

## Uruchomienie

1. **Sklonuj repozytorium:**
```bash
git clone <repository-url>
cd inventory-management
```

2. **Uruchom aplikację:**
```bash
docker-compose up -d
```

3. **Sprawdź status:**
```bash
docker-compose ps
```

4. **Zobacz logi:**
```bash
docker-compose logs -f
```

## Dostęp do aplikacji

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

## Dane dostępowe do bazy

- **Host**: localhost
- **Port**: 5432
- **Database**: inventory_db
- **User**: postgres
- **Password**: postgres123

## Komendy Docker

```bash
# Budowanie kontenerów
docker-compose build

# Uruchomienie w tle
docker-compose up -d

# Zatrzymanie
docker-compose down

# Restart konkretnego serwisu
docker-compose restart backend

# Przeglądanie logów
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## Rozwój aplikacji

### Struktura projeków
```
├── client/                 # Frontend React
├── server/                 # Backend Express
├── shared/                 # Wspólne typy/schema
├── docker-compose.yml      # Konfiguracja Docker
├── Dockerfile.backend      # Dockerfile dla backend
├── Dockerfile.frontend     # Dockerfile dla frontend
├── nginx.conf             # Konfiguracja Nginx
└── wait-for-postgres.sh   # Script oczekiwania na bazę
```

### Dodanie nowych funkcji
1. Aktualizuj schema w `shared/schema.ts`
2. Dodaj endpointy w `server/routes.ts`
3. Dodaj komponenty w `client/src/`
4. Przebuduj kontenery: `docker-compose build`

## Rozwiązywanie problemów

### Baza danych nie startuje
```bash
docker-compose logs postgres
docker-compose restart postgres
```

### Backend nie łączy się z bazą
```bash
# Sprawdź czy baza jest gotowa
docker-compose exec postgres pg_isready -U postgres

# Restart backend
docker-compose restart backend
```

### Frontend nie łączy się z backend
```bash
# Sprawdź status wszystkich serwisów
docker-compose ps

# Sprawdź logi nginx
docker-compose logs frontend
```

### Reset całej aplikacji
```bash
docker-compose down -v
docker-compose up -d
```

## Backup bazy danych

```bash
# Export
docker-compose exec postgres pg_dump -U postgres inventory_db > backup.sql

# Import
docker-compose exec -T postgres psql -U postgres inventory_db < backup.sql
```