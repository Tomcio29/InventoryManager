# Script do testowania komunikacji RabbitMQ w aplikacji Inventory Manager

Write-Host "=== Test komunikacji RabbitMQ ===" -ForegroundColor Green

# 0. Opcja dodania przykładowych danych
$addSampleData = Read-Host "`nCzy chcesz dodać przykładowe assety? (y/N)"
if ($addSampleData -eq "y" -or $addSampleData -eq "Y") {
    Write-Host "`nDodawanie przykładowych assetów..." -ForegroundColor Yellow
    & ".\seed-data.ps1"
    Write-Host "`nPowrót do testów komunikacji..." -ForegroundColor Yellow
}

# 1. Sprawdź czy usługi działają
Write-Host "`n1. Sprawdzanie statusu usług..." -ForegroundColor Yellow
docker-compose ps

# 2. Test tworzenia aktywa (generuje event do RabbitMQ)
Write-Host "`n2. Tworzenie nowego aktywa (test publisher)..." -ForegroundColor Yellow
$assetData = @{
    name = "Test Asset - RabbitMQ"
    category = "Equipment"
    description = "Asset utworzony do testowania RabbitMQ"
    locationX = "15"
    locationY = "25"
    inWarehouse = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/assets" `
                                  -Method POST `
                                  -ContentType "application/json" `
                                  -Body $assetData
    Write-Host "✅ Asset utworzony: $($response.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Błąd tworzenia asseta: $_" -ForegroundColor Red
}

# 3. Sprawdź logi notification service (subscriber)
Write-Host "`n3. Logi Notification Service (subscriber)..." -ForegroundColor Yellow
docker-compose logs --tail=20 notification

# 4. Aktualizacja aktywa (kolejny event)
Write-Host "`n4. Aktualizacja aktywa (test publisher)..." -ForegroundColor Yellow
$updateData = @{
    name = "Test Asset - RabbitMQ UPDATED"
    locationX = "30"
    locationY = "40"
} | ConvertTo-Json

try {
    $assets = Invoke-RestMethod -Uri "http://localhost:5000/api/assets"
    if ($assets.Count -gt 0) {
        $lastAsset = $assets[-1]
        Invoke-RestMethod -Uri "http://localhost:5000/api/assets/$($lastAsset.id)" `
                         -Method PUT `
                         -ContentType "application/json" `
                         -Body $updateData
        Write-Host "✅ Asset zaktualizowany" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Błąd aktualizacji: $_" -ForegroundColor Red
}

# 5. Sprawdź RabbitMQ Management UI
Write-Host "`n5. Sprawdzanie RabbitMQ Management UI..." -ForegroundColor Yellow
try {
    $rabbit = Invoke-WebRequest -Uri "http://localhost:15672" -UseBasicParsing
    Write-Host "✅ RabbitMQ Management UI dostępne na: http://localhost:15672" -ForegroundColor Green
    Write-Host "   Login: guest / Password: guest" -ForegroundColor Cyan
} catch {
    Write-Host "❌ RabbitMQ Management UI niedostępne" -ForegroundColor Red
}

# 6. Sprawdź kolejki w RabbitMQ
Write-Host "`n6. Informacje o kolejkach RabbitMQ..." -ForegroundColor Yellow
Write-Host "Otwórz http://localhost:15672 i sprawdź:" -ForegroundColor Cyan
Write-Host "- Zakładka 'Queues' - zobacz czy są wiadomości w kolejkach" -ForegroundColor White
Write-Host "- Kolejki do sprawdzenia:" -ForegroundColor White
Write-Host "  * asset.created" -ForegroundColor Gray
Write-Host "  * asset.updated" -ForegroundColor Gray
Write-Host "  * notifications.queue" -ForegroundColor Gray

# 7. Podsumowanie
Write-Host "`n=== Podsumowanie testów ===" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "✅ Backend API: http://localhost:5000" -ForegroundColor Green  
Write-Host "✅ RabbitMQ UI: http://localhost:15672" -ForegroundColor Green
Write-Host "✅ PostgreSQL: localhost:5432" -ForegroundColor Green

Write-Host "`nSprawdź logi notification service by zobaczyć przetwarzanie wiadomości:" -ForegroundColor Yellow
Write-Host "docker-compose logs -f notification" -ForegroundColor Cyan
