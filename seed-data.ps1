# Script do dodawania przykładowych assetów do magazynu
# Uruchamiaj po uruchomieniu aplikacji: docker-compose up -d

Write-Host "=== Dodawanie przykładowych assetów do magazynu ===" -ForegroundColor Green

# Sprawdź czy backend działa
Write-Host "`nSprawdzanie czy backend API jest dostępny..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/warehouse/init" -TimeoutSec 5
    Write-Host "✅ Backend API działa" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API nie jest dostępny. Uruchom: docker-compose up -d" -ForegroundColor Red
    exit 1
}

# Przykładowe assety do dodania (status będzie automatycznie określony na podstawie współrzędnych)
$sampleAssets = @(
    @{
        name = "Laptop Dell Latitude 5520"
        category = "IT Equipment"
        locationX = "10"
        locationY = "15"
    },
    @{
        name = "Projektor Epson EB-X41"
        category = "AV Equipment" 
        locationX = "25"
        locationY = "20"
    },
    @{
        name = "Krzesło biurowe Ergonomic Pro"
        category = "Furniture"
        locationX = "45"
        locationY = "30"
    },
    @{
        name = "Monitor Samsung 27'' 4K"
        category = "IT Equipment"
        locationX = "75"
        locationY = "35"
    },
    @{
        name = "Wiertarka Black & Decker"
        category = "Tools"
        locationX = "150"
        locationY = "120"
    },
    @{
        name = "Kamera Canon EOS R6"
        category = "Photography"
        locationX = "35"
        locationY = "60"
    },
    @{
        name = "Tablet iPad Pro 12.9''"
        category = "IT Equipment"
        locationX = "180"
        locationY = "200"
    },
    @{
        name = "Drukarka HP LaserJet Pro"
        category = "Office Equipment"
        locationX = "55"
        locationY = "80"
    },
    @{
        name = "Mikrofon Shure SM7B"
        category = "AV Equipment"
        locationX = "80"
        locationY = "45"
    },
    @{
        name = "Laptop MacBook Pro M2"
        category = "IT Equipment"
        locationX = "250"
        locationY = "180"
    },
    @{
        name = "Router Cisco ISR 4331"
        category = "Network Equipment"
        locationX = "30"
        locationY = "90"
    },
    @{
        name = "Szafa rack 42U"
        category = "Infrastructure"
        locationX = "90"
        locationY = "90"
    },
    @{
        name = "Laptop testowy 1"
        category = "IT Equipment"
        locationX = "-30"
        locationY = "-20"
    },
    @{
        name = "Monitor testowy"
        category = "IT Equipment"
        locationX = "-10"
        locationY = "50"
    },
    @{
        name = "Kamera testowa"
        category = "Photography"
        locationX = "50"
        locationY = "150"
    }
)

Write-Host "`nDodawanie $($sampleAssets.Count) przykładowych assetów..." -ForegroundColor Yellow

$successCount = 0
$errorCount = 0

foreach ($asset in $sampleAssets) {
    try {
        $jsonData = $asset | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/assets" `
                                     -Method POST `
                                     -ContentType "application/json" `
                                     -Body $jsonData
        
        $status = if ($response.inWarehouse) { "Magazyn" } else { "Teren" }
        Write-Host "✅ Dodano: $($asset.name) - $status ($($asset.locationX),$($asset.locationY)) - Status: $($response.status)" -ForegroundColor Green
        $successCount++
        
        # Małe opóźnienie żeby nie przeciążać API
        Start-Sleep -Milliseconds 200
        
    } catch {
        Write-Host "❌ Błąd przy dodawaniu: $($asset.name) - $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n=== Podsumowanie ===" -ForegroundColor Cyan
Write-Host "✅ Pomyślnie dodano: $successCount assetów" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "❌ Błędy: $errorCount assetów" -ForegroundColor Red
}

# Sprawdź końcowy stan magazynu
Write-Host "`nSprawdzanie stanu magazynu..." -ForegroundColor Yellow
try {
    $allAssets = Invoke-RestMethod -Uri "http://localhost:5000/api/assets"
    $warehouseAssets = $allAssets | Where-Object { $_.inWarehouse -eq $true }
    $fieldAssets = $allAssets | Where-Object { $_.inWarehouse -eq $false }
    
    Write-Host "`n📊 Stan magazynu:" -ForegroundColor Cyan
    Write-Host "   Łącznie assetów: $($allAssets.Count)" -ForegroundColor White
    Write-Host "   W magazynie: $($warehouseAssets.Count)" -ForegroundColor Green
    Write-Host "   Na terenie: $($fieldAssets.Count)" -ForegroundColor Blue
    
    Write-Host "`n📍 Kategorie w magazynie:" -ForegroundColor Cyan
    $categories = $warehouseAssets | Group-Object category | Sort-Object Name
    foreach ($cat in $categories) {
        Write-Host "   $($cat.Name): $($cat.Count) szt." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Nie można pobrać stanu magazynu: $_" -ForegroundColor Red
}

Write-Host "`n🌐 Sprawdź aplikację:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000/api/assets" -ForegroundColor White
Write-Host "   RabbitMQ: http://localhost:15672" -ForegroundColor White

Write-Host "`n💡 Sprawdź logi notification service:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f notification" -ForegroundColor Gray
