# Skrypt do czyszczenia wszystkich danych w aplikacji

Write-Host "=== Czyszczenie danych aplikacji ===" -ForegroundColor Red

$confirm = Read-Host "`n⚠️  UWAGA: To usunie wszystkie dane! Kontynuować? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Anulowano." -ForegroundColor Yellow
    exit
}

Write-Host "`nZatrzymywanie aplikacji..." -ForegroundColor Yellow
docker-compose down

Write-Host "`nUsuwanie volumes z danymi..." -ForegroundColor Yellow
docker volume rm inventorymanager_postgres_data 2>$null
docker volume rm inventorymanager_rabbitmq_data 2>$null

Write-Host "`nUsuwanie nieużywanych obrazów..." -ForegroundColor Yellow
docker image prune -f

Write-Host "`n✅ Dane zostały wyczyszczone!" -ForegroundColor Green
Write-Host "`nAby uruchomić aplikację od nowa:" -ForegroundColor Cyan
Write-Host "1. docker-compose up -d" -ForegroundColor White
Write-Host "2. .\seed-data.ps1 (opcjonalnie - dodanie przykładowych danych)" -ForegroundColor White
