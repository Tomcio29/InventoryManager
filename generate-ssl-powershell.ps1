# Generowanie certyfikatów SSL dla localhost używając PowerShell
Write-Host "Generowanie certyfikatów SSL używając PowerShell..." -ForegroundColor Green

# Tworzenie folderu na certyfikaty
New-Item -ItemType Directory -Force -Path "ssl"

# Generowanie certyfikatu self-signed
Write-Host "Generowanie certyfikatu self-signed..." -ForegroundColor Yellow

$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "127.0.0.1" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddDays(365) `
    -FriendlyName "InventoryManager Development Certificate" `
    -KeyUsageProperty All `
    -KeyUsage CertSign, CRLSign, DigitalSignature

# Eksportowanie certyfikatu do pliku
$password = ConvertTo-SecureString -String "password123" -Force -AsPlainText

Write-Host "Eksportowanie certyfikatu..." -ForegroundColor Yellow
Export-PfxCertificate -Cert $cert -FilePath "ssl\server.pfx" -Password $password

# Eksportowanie jako .crt i .key dla nginx
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes("$PWD\ssl\server.crt", $certBytes)

# Generowanie klucza RSA w formacie PEM (symulacja)
$pemKey = @"
-----BEGIN PRIVATE KEY-----
$(([Convert]::ToBase64String($cert.PrivateKey.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob))).ToCharArray() -join '' -replace '(.{64})', '$1`n')
-----END PRIVATE KEY-----
"@

$pemKey | Out-File -FilePath "ssl\server.key" -Encoding ASCII

Write-Host "Certyfikaty wygenerowane pomyślnie!" -ForegroundColor Green
Write-Host "Pliki:" -ForegroundColor Cyan
Write-Host "  - ssl/server.crt (certyfikat)" -ForegroundColor White
Write-Host "  - ssl/server.key (klucz prywatny)" -ForegroundColor White
Write-Host "  - ssl/server.pfx (PKCS#12)" -ForegroundColor White
Write-Host ""
Write-Host "Odcisk certyfikatu: $($cert.Thumbprint)" -ForegroundColor Yellow
