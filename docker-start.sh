#!/bin/bash

echo "🚀 Uruchamianie Inventory Management System w Docker..."

# Sprawdź czy Docker jest dostępny
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nie jest zainstalowany!"
    exit 1
fi

# Zatrzymaj poprzednie kontenery jeśli działają
echo "🛑 Zatrzymywanie poprzednich kontenerów..."
docker-compose down 2>/dev/null

# Buduj kontenery
echo "🔨 Budowanie kontenerów..."
docker-compose build

# Uruchom aplikację
echo "▶️ Uruchamianie aplikacji..."
docker-compose up -d

# Sprawdź status
echo "📊 Status kontenerów:"
docker-compose ps

echo ""
echo "✅ Aplikacja uruchomiona!"
echo ""
echo "🌐 Dostęp do aplikacji:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   Database:  localhost:5432"
echo ""
echo "📋 Przydatne komendy:"
echo "   docker-compose logs -f          # Zobacz logi"
echo "   docker-compose down             # Zatrzymaj"
echo "   docker-compose restart backend  # Restart backend"
echo ""
echo "Sprawdź logi aby upewnić się że wszystko działa:"
echo "docker-compose logs -f"