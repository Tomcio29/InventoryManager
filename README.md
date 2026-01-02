# Inventory Manager

Nowoczesna aplikacja webowa do zarządzania zasobami magazynowymi z wykorzystaniem technologii QR kodów.

## 🚀 Funkcjonalności

- **Dashboard** - Przegląd stanu magazynu i statystyk
- **Zarządzanie Aktywami** - Dodawanie, edycja i usuwanie zasobów
- **Mapa Aktywów** - Interaktywna wizualizacja lokalizacji
- **Skaner QR** - Identyfikacja aktywów przez QR kody
- **Zarządzanie Magazynem** - Konfiguracja i monitoring pojemności
- **Panel Administracyjny** - Narzędzia zarządzania systemem

## 🛠️ Technologie

### Frontend
- React 18 + TypeScript
- Vite + Tailwind CSS
- React Query + Wouter Router
- QR-Scanner + QRCode libraries

### Backend
- Node.js + Express + TypeScript
- Drizzle ORM + PostgreSQL
- RabbitMQ dla powiadomień
- RESTful API

### Infrastructure
- Docker + Docker Compose
- Nginx z SSL (HTTPS)
- Self-signed certificates

## 📋 Wymagania

- Docker & Docker Compose
- Minimum 4GB RAM
- Przeglądarka z obsługą HTTPS
- Kamera (opcjonalnie, do skanowania QR)

## 🚀 Szybki Start

1. **Klonowanie repozytorium**
```bash
git clone <repository-url>
cd InventoryManager
```

2. **Uruchomienie aplikacji**
```bash
docker-compose up -d
```

3. **Sprawdzenie statusu**
```bash
docker-compose ps
```

4. **Dostęp do aplikacji**
- Otwórz: https://localhost
- Zaakceptuj certyfikat SSL (self-signed)

## 📚 Dokumentacja

Pełna dokumentacja dostępna w folderze `docs/`:
- **Markdown**: `Inventory_Manager_Documentation_Updated.md`
- **DOCX**: `Inventory_Manager_Documentation_Final.docx`

## 🔧 Komendy Docker

```bash
# Uruchomienie wszystkich usług
docker-compose up -d

# Przebudowanie konkretnej usługi
docker-compose build frontend
docker-compose up -d frontend

# Sprawdzenie logów
docker-compose logs -f backend

# Zatrzymanie
docker-compose down

# Zatrzymanie konkretnej usługi (np. notification service)
docker-compose stop notification

# Restart konkretnej usługi
docker-compose restart backend
```

## 🧪 Testowanie API z Terminala

### ⚡ Szybki Start

**Krok 1**: Skonfiguruj ignorowanie SSL (wykonaj raz na sesję PowerShell)
```powershell
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
```

**Krok 2**: Testuj API
```powershell
# Sprawdź statystyki
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"

# Dodaj testowy asset
$body = @{ name = "Test Asset"; category = "test"; locationX = "50"; locationY = "30" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $body -ContentType "application/json"
```

### Podstawowe operacje na aktywach

```powershell
# UWAGA: Wykonaj najpierw funkcję Ignore-SSLErrors (patrz sekcja "Kompatybilność PowerShell")

# Pobranie wszystkich aktywów
Invoke-RestMethod -Uri "https://localhost/api/assets"

# Pobranie konkretnego aktywu
Invoke-RestMethod -Uri "https://localhost/api/assets/1"

# Znajdź asset po ID
Invoke-RestMethod -Uri "https://localhost/api/assets/find/I543860-2024"

# Dodanie nowego aktywu
$body = @{
    name = "Test Asset"
    category = "test"
    locationX = "50"
    locationY = "30"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $body -ContentType "application/json"

# Aktualizacja aktywu
$updateBody = @{
    locationX = "75"
    locationY = "45"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets/1" -Method PATCH -Body $updateBody -ContentType "application/json"

# Usunięcie aktywu
Invoke-RestMethod -Uri "https://localhost/api/assets/1" -Method DELETE
```

### Zarządzanie magazynem

```powershell
# Pobranie danych magazynu
Invoke-RestMethod -Uri "https://localhost/api/warehouse"

# Inicjalizacja magazynu
Invoke-RestMethod -Uri "https://localhost/api/warehouse/init"

# Aktualizacja magazynu
$warehouseUpdate = @{
    maxCapacity = 300
    width = "120"
    height = "80"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/warehouse/1" -Method PATCH -Body $warehouseUpdate -ContentType "application/json"
```

### Dashboard i statystyki

```powershell
# Pobranie statystyk dashboard
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"

# Wynik przykładowy (PowerShell object):
# @{
#   totalAssets = 15
#   inWarehouse = 9
#   inField = 6
#   freeSpace = 35
#   warehouseCapacity = 250
#   capacityUsed = 86
# }
```

### Funkcje administracyjne

```powershell
# Losowe przemieszczenie wszystkich aktywów
Invoke-RestMethod -Uri "https://localhost/api/admin/move-assets" -Method POST

# Naprawa statusów aktywów na podstawie lokalizacji
Invoke-RestMethod -Uri "https://localhost/api/admin/fix-asset-statuses" -Method POST

# Test powiadomienia
$notificationBody = @{
    type = "success"
    title = "Test z terminala"
    message = "To jest test API"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/test/notification" -Method POST -Body $notificationBody -ContentType "application/json"

# Test logiki statusów (sprawdź czy pozycja jest w magazynie)
Invoke-RestMethod -Uri "https://localhost/api/test/status/50/30"
```

## 🔕 Zarządzanie Usługą Powiadomień

### Wyłączenie notification service (demo)

```powershell
# Zatrzymanie usługi powiadomień
docker-compose stop notification

# Sprawdzenie statusu - notification powinien być "Exited"
docker-compose ps

# Test API - aktywa będą działać, ale bez powiadomień
$testAsset = @{
    name = "Asset bez powiadomień"
    category = "demo"
    locationX = "80"
    locationY = "60"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $testAsset -ContentType "application/json"

# Sprawdzenie logów backendu - powinna być informacja o błędzie RabbitMQ
docker-compose logs backend | Select-String "RabbitMQ|notification"

# Ponowne uruchomienie notification service
docker-compose start notification

# Sprawdzenie czy usługa działa
docker-compose ps notification
```

### Monitoring RabbitMQ

```powershell
# Dostęp do panelu RabbitMQ Management
# Otwórz: http://localhost:15672
# Login: admin / admin123

# Sprawdzenie queue przez API RabbitMQ
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123"))
Invoke-RestMethod -Uri "http://localhost:15672/api/queues" -Headers @{Authorization="Basic $cred"}

# Sprawdzenie wiadomości w kolejce
Invoke-RestMethod -Uri "http://localhost:15672/api/queues/%2F/inventory.events" -Headers @{Authorization="Basic $cred"}

# Ręczne wysłanie wiadomości testowej
$testNotification = @{
    type = "info"
    title = "Test kolejki"
    message = "Sprawdzenie działania RabbitMQ"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/test/notification" -Method POST -Body $testNotification -ContentType "application/json"
```

## 📊 Scenariusze Demonstracyjne

### Scenariusz 1: Podstawowe operacje CRUD

```powershell
# 1. Sprawdź obecny stan
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"

# 2. Dodaj nowy asset
$demoAsset = @{
    name = "Demo Laptop"
    category = "elektronika"
    locationX = "25"
    locationY = "25"
} | ConvertTo-Json

$newAsset = Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $demoAsset -ContentType "application/json"

# 3. Sprawdź zmianę statystyk
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"

# 4. Przenieś asset poza magazyn (użyj ID z kroku 2)
$assetId = $newAsset.id
$moveAsset = @{
    locationX = "150"
    locationY = "150"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets/$assetId" -Method PATCH -Body $moveAsset -ContentType "application/json"

# 5. Sprawdź ponownie statystyki
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"
```

### Scenariusz 2: Test działania bez powiadomień

```powershell
# 1. Zatrzymaj notification service
docker-compose stop notification

# 2. Wykonaj operacje na aktywach
$testAssetNoNotif = @{
    name = "Test bez notyfikacji"
    category = "test"
    locationX = "40"
    locationY = "40"
} | ConvertTo-Json

$asset = Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $testAssetNoNotif -ContentType "application/json"

# 3. Sprawdź logi backendu - powinny być błędy RabbitMQ
docker-compose logs backend | Select-String "Failed|Error|RabbitMQ"

# 4. Uruchom ponownie notification service
docker-compose start notification

# 5. Wykonaj ponownie operację - teraz z powiadomieniami
$assetId = $asset.id
$moveUpdate = @{
    locationX = "60"
    locationY = "60"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets/$assetId" -Method PATCH -Body $moveUpdate -ContentType "application/json"
```

### Scenariusz 3: Testowanie granic magazynu

```powershell
# 1. Sprawdź konfigurację magazynu
Invoke-RestMethod -Uri "https://localhost/api/warehouse"

# 2. Dodaj asset w magazynie (w granicach 0-100, 0-100)
$assetInWarehouse = @{
    name = "Asset w magazynie"
    category = "test"
    locationX = "50"
    locationY = "50"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $assetInWarehouse -ContentType "application/json"

# 3. Dodaj asset poza magazynem
$assetInField = @{
    name = "Asset na terenie"
    category = "test"
    locationX = "150"
    locationY = "150"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $assetInField -ContentType "application/json"

# 4. Sprawdź różnicę w statusach
$allAssets = Invoke-RestMethod -Uri "https://localhost/api/assets"
$allAssets | Select-Object name, inWarehouse | Format-Table

# 5. Test logiki granic
Invoke-RestMethod -Uri "https://localhost/api/test/status/50/50"     # powinno być w magazynie
Invoke-RestMethod -Uri "https://localhost/api/test/status/150/150"   # powinno być na terenie
```

## 💡 Przydatne Aliasy PowerShell

Dodaj do profilu PowerShell dla szybszego testowania:

```powershell
# Dodaj do $PROFILE
# Funkcja do ignorowania błędów SSL w PowerShell 5.1
function Ignore-SSLErrors {
    add-type @"
        using System.Net;
        using System.Security.Cryptography.X509Certificates;
        public class TrustAllCertsPolicy : ICertificatePolicy {
            public bool CheckValidationResult(
                ServicePoint srvPoint, X509Certificate certificate,
                WebRequest request, int certificateProblem) {
                return true;
            }
        }
"@
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
}

function Test-InventoryAPI {
    param($endpoint)
    Ignore-SSLErrors
    Invoke-RestMethod -Uri "https://localhost/api/$endpoint"
}

function Add-TestAsset {
    param($name, $x, $y)
    Ignore-SSLErrors
    $body = @{
        name = $name
        category = "test"
        locationX = $x
        locationY = $y
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "https://localhost/api/assets" -Method POST -Body $body -ContentType "application/json"
}

function Get-InventoryStats {
    Ignore-SSLErrors
    Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"
}

# Użycie:
# Test-InventoryAPI "dashboard/stats"
# Add-TestAsset "Mój Asset" "75" "25"
# Get-InventoryStats
```

## 🔧 Kompatybilność PowerShell

### PowerShell 5.1 (Windows domyślny)
```powershell
# Ignorowanie błędów SSL - wykonaj raz na sesję
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint srvPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

# Teraz możesz używać zwykłych komend
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats"
```

### PowerShell 7+ (nowoczesny)
```powershell
# Użyj parametru -SkipCertificateCheck
Invoke-RestMethod -Uri "https://localhost/api/dashboard/stats" -SkipCertificateCheck
```

## 🌐 Endpointy

### Frontend
- **HTTPS**: https://localhost (port 443)
- **HTTP Redirect**: http://localhost:3000 → HTTPS

### Backend API
- **Base URL**: https://localhost/api
- **Port**: 5000 (wewnętrzny)

### Baza Danych
- **PostgreSQL**: localhost:5432
- **Database**: inventory_db
- **User**: postgres

### RabbitMQ
- **AMQP**: localhost:5672
- **Management**: http://localhost:15672
- **User**: admin / admin123

## 📖 Podstawowe Użycie

### 1. Dashboard
- Otwórz https://localhost
- Zobacz statystyki aktywów i magazynu

### 2. Dodawanie Aktywu
- Kliknij "Add Asset"
- Wypełnij formularz (nazwa, kategoria, lokalizacja)
- System wygeneruje automatycznie ID i QR kod

### 3. Skanowanie QR
- Przejdź do "QR Scanner"
- Daj pozwolenie na kamerę
- Zeskanuj QR kod aktywu

### 4. Mapa Aktywów
- Przejdź do "Asset Map"
- Zobacz lokalizacje aktywów
- Przeciągnij aktywa żeby zmienić pozycję

## 🐛 Rozwiązywanie Problemów

### QR Scanner nie działa
- Upewnij się że używasz HTTPS (nie HTTP)
- Daj pozwolenie przeglądarce na kamerę

### Błąd SSL Certificate
- Kliknij "Advanced" → "Proceed to localhost"
- Certyfikat jest self-signed i bezpieczny

### Aplikacja nie ładuje się
- Sprawdź status kontenerów: `docker-compose ps`
- Sprawdź logi: `docker-compose logs frontend`
- Wyczyść cache przeglądarki

## 📁 Struktura Projektu

```
InventoryManager/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── shared/          # Wspólne typy i schema
├── docs/            # Dokumentacja
├── ssl/             # Certyfikaty SSL
├── migrations/      # Migracje bazy danych
├── docker-compose.yml
└── README.md
```

## 🎯 Status Projektu

**Wersja**: 1.0.0  
**Status**: ✅ Gotowa do użycia  
**Ostatnia aktualizacja**: 9 września 2025

### Zaimplementowane Funkcje
✅ System zarządzania aktywami  
✅ QR kody i skanowanie  
✅ Mapa interaktywna  
✅ Dashboard z statystykami  
✅ HTTPS z SSL  
✅ Containerization (Docker)  
✅ System powiadomień (RabbitMQ)  

### Przyszłe Rozszerzenia
🔄 System użytkowników i autoryzacji  
🔄 Zaawansowane raportowanie  
🔄 Mobile app  
🔄 Integracje zewnętrzne  

## 👥 Wsparcie

W przypadku problemów sprawdź:
1. Dokumentację w folderze `docs/`
2. Logi kontenerów Docker
3. Status usług: `docker-compose ps`

---

**Inventory Manager** - Efektywne zarządzanie zasobami magazynowymi 📦